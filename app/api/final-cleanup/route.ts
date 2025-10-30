import { NextRequest, NextResponse } from 'next/server';
import { Dropbox } from 'dropbox';
import { config } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const dropbox = new Dropbox({
      accessToken: config.dropbox.accessToken,
      fetch: fetch,
    });

    const steps = [];

    // 1. Obtener archivos de /FacturasIBS (raíz)
    try {
      const filesResponse = await dropbox.filesListFolder({
        path: '/FacturasIBS',
        recursive: false,
      });

      const files = filesResponse.result.entries.filter((entry: any) => entry['.tag'] === 'file');
      steps.push(`📁 Encontrados ${files.length} archivos en /FacturasIBS (raíz)`);

      // 2. Mover cada archivo a /Aplicaciones/FacturasIBS
      for (const file of files) {
        const fromPath = file.path_display;
        const toPath = `/Aplicaciones/FacturasIBS/${file.name}`;
        
        try {
          await dropbox.filesMoveV2({
            from_path: fromPath,
            to_path: toPath,
            autorename: true
          });
          steps.push(`✅ Movido: ${file.name}`);
        } catch (error: any) {
          steps.push(`⚠️ Error moviendo ${file.name}: ${error.message}`);
        }
      }

      // 3. Eliminar la carpeta vacía /FacturasIBS
      try {
        await dropbox.filesDeleteV2({
          path: '/FacturasIBS'
        });
        steps.push('✅ Carpeta /FacturasIBS (raíz) eliminada');
      } catch (error: any) {
        steps.push(`⚠️ Error eliminando /FacturasIBS: ${error.message}`);
      }

    } catch (error: any) {
      if (error.status === 404) {
        steps.push('ℹ️ Carpeta /FacturasIBS (raíz) no existe');
      } else {
        steps.push(`⚠️ Error accediendo a /FacturasIBS: ${error.message}`);
      }
    }

    // 4. Verificar estructura final
    try {
      const finalCheck = await dropbox.filesListFolder({
        path: '/Aplicaciones/FacturasIBS',
        recursive: false,
      });
      
      const files = finalCheck.result.entries.filter((entry: any) => entry['.tag'] === 'file');
      steps.push(`✅ Estructura final: /Aplicaciones/FacturasIBS con ${files.length} archivos`);
    } catch (error: any) {
      steps.push(`⚠️ Error verificando estructura final: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Limpieza final completada',
      steps: steps
    });

  } catch (error) {
    console.error('Error en limpieza final:', error);
    return NextResponse.json(
      { 
        error: 'Error en limpieza final',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
