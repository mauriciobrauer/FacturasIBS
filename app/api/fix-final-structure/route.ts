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

    // 1. Crear la carpeta correcta /Aplicaciones/FacturasIBS
    try {
      await dropbox.filesCreateFolderV2({
        path: '/Aplicaciones/FacturasIBS',
        autorename: false
      });
      steps.push('✅ Carpeta correcta /Aplicaciones/FacturasIBS creada');
    } catch (error: any) {
      if (error.status === 409) {
        steps.push('ℹ️ Carpeta /Aplicaciones/FacturasIBS ya existe');
      } else {
        throw error;
      }
    }

    // 2. Mover archivos de /Aplicaciones/FacturaIBS a /Aplicaciones/FacturasIBS
    try {
      const filesResponse = await dropbox.filesListFolder({
        path: '/Aplicaciones/FacturaIBS',
        recursive: false,
      });

      const files = filesResponse.result.entries.filter((entry: any) => entry['.tag'] === 'file');
      steps.push(`📁 Encontrados ${files.length} archivos en /Aplicaciones/FacturaIBS`);

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

      // 3. Eliminar la carpeta incorrecta /Aplicaciones/FacturaIBS
      try {
        await dropbox.filesDeleteV2({
          path: '/Aplicaciones/FacturaIBS'
        });
        steps.push('✅ Carpeta incorrecta /Aplicaciones/FacturaIBS eliminada');
      } catch (error: any) {
        steps.push(`⚠️ Error eliminando carpeta incorrecta: ${error.message}`);
      }

    } catch (error: any) {
      if (error.status === 404) {
        steps.push('ℹ️ Carpeta /Aplicaciones/FacturaIBS no existe');
      } else {
        throw error;
      }
    }

    // 4. Verificar estructura final
    try {
      const finalCheck = await dropbox.filesListFolder({
        path: '/Aplicaciones/FacturasIBS',
        recursive: false,
      });
      
      const files = finalCheck.result.entries.filter((entry: any) => entry['.tag'] === 'file');
      steps.push(`✅ Estructura final correcta: /Aplicaciones/FacturasIBS con ${files.length} archivos`);
    } catch (error: any) {
      steps.push(`⚠️ Error verificando estructura final: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Estructura final corregida',
      steps: steps
    });

  } catch (error) {
    console.error('Error corrigiendo estructura:', error);
    return NextResponse.json(
      { 
        error: 'Error corrigiendo estructura',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
