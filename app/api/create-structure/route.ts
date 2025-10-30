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

    // 1. Crear carpeta Aplicaciones si no existe
    try {
      await dropbox.filesCreateFolderV2({
        path: '/Aplicaciones',
        autorename: false
      });
      steps.push('✅ Carpeta /Aplicaciones creada');
    } catch (error: any) {
      if (error.status === 409) {
        steps.push('ℹ️ Carpeta /Aplicaciones ya existe');
      } else {
        throw error;
      }
    }

    // 2. Crear carpeta FacturaIBS dentro de Aplicaciones
    try {
      await dropbox.filesCreateFolderV2({
        path: '/Aplicaciones/FacturaIBS',
        autorename: false
      });
      steps.push('✅ Carpeta /Aplicaciones/FacturaIBS creada');
    } catch (error: any) {
      if (error.status === 409) {
        steps.push('ℹ️ Carpeta /Aplicaciones/FacturaIBS ya existe');
      } else {
        throw error;
      }
    }

    // 3. Mover archivos de /FacturasIBS a /Aplicaciones/FacturaIBS
    try {
      const filesResponse = await dropbox.filesListFolder({
        path: '/FacturasIBS',
        recursive: false,
      });

      const files = filesResponse.result.entries.filter((entry: any) => entry['.tag'] === 'file');
      
      for (const file of files) {
        const fromPath = file.path_display;
        const toPath = `/Aplicaciones/FacturaIBS/${file.name}`;
        
        await dropbox.filesMoveV2({
          from_path: fromPath,
          to_path: toPath,
          autorename: true
        });
      }
      
      steps.push(`✅ ${files.length} archivos movidos a /Aplicaciones/FacturaIBS`);
    } catch (error: any) {
      steps.push(`⚠️ Error moviendo archivos: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Estructura de carpetas configurada',
      steps: steps
    });

  } catch (error) {
    console.error('Error creando estructura:', error);
    return NextResponse.json(
      { 
        error: 'Error creando estructura',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
