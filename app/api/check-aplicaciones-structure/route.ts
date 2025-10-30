import { NextRequest, NextResponse } from 'next/server';
import { Dropbox } from 'dropbox';
import { config } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const dropbox = new Dropbox({
      accessToken: config.dropbox.accessToken,
      fetch: fetch,
    });

    const steps = [];

    // Listar contenido de /Aplicaciones
    try {
      const response = await dropbox.filesListFolder({
        path: '/Aplicaciones',
        recursive: false,
      });

      const folders = response.result.entries
        .filter((entry: any) => entry['.tag'] === 'folder')
        .map((folder: any) => ({
          name: folder.name,
          path: folder.path_display
        }));

      const files = response.result.entries
        .filter((entry: any) => entry['.tag'] === 'file')
        .map((file: any) => ({
          name: file.name,
          path: file.path_display
        }));

      steps.push(`📁 Carpetas en /Aplicaciones: ${folders.map(f => f.name).join(', ')}`);
      steps.push(`📄 Archivos en /Aplicaciones: ${files.length}`);

      // Verificar cada carpeta
      for (const folder of folders) {
        try {
          const folderContent = await dropbox.filesListFolder({
            path: folder.path,
            recursive: false,
          });
          
          const folderFiles = folderContent.result.entries.filter((entry: any) => entry['.tag'] === 'file');
          steps.push(`📁 ${folder.name}: ${folderFiles.length} archivos`);
        } catch (error: any) {
          steps.push(`⚠️ Error accediendo a ${folder.name}: ${error.message}`);
        }
      }

    } catch (error: any) {
      steps.push(`❌ Error accediendo a /Aplicaciones: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Estructura de /Aplicaciones',
      steps: steps
    });

  } catch (error) {
    console.error('Error verificando estructura:', error);
    return NextResponse.json(
      { 
        error: 'Error verificando estructura',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
