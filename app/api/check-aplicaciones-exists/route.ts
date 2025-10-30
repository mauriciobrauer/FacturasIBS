import { NextRequest, NextResponse } from 'next/server';
import { Dropbox } from 'dropbox';
import { config } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const dropbox = new Dropbox({
      accessToken: config.dropbox.accessToken,
      fetch: fetch,
    });

    const results = [];

    // 1. Listar raíz
    try {
      const rootResponse = await dropbox.filesListFolder({
        path: '',
        recursive: false,
      });

      const rootFolders = rootResponse.result.entries
        .filter((entry: any) => entry['.tag'] === 'folder')
        .map((folder: any) => ({
          name: folder.name,
          path: folder.path_display
        }));

      results.push({
        location: 'Root',
        folders: rootFolders
      });
    } catch (error: any) {
      results.push({
        location: 'Root',
        error: error.message
      });
    }

    // 2. Verificar si /Aplicaciones existe
    try {
      const aplicacionesResponse = await dropbox.filesListFolder({
        path: '/Aplicaciones',
        recursive: false,
      });

      const aplicacionesFolders = aplicacionesResponse.result.entries
        .filter((entry: any) => entry['.tag'] === 'folder')
        .map((folder: any) => ({
          name: folder.name,
          path: folder.path_display
        }));

      results.push({
        location: '/Aplicaciones',
        folders: aplicacionesFolders,
        status: 'exists'
      });
    } catch (error: any) {
      results.push({
        location: '/Aplicaciones',
        error: error.message,
        status: 'not_found'
      });
    }

    // 3. Verificar si /Aplicaciones/FacturasIBS existe
    try {
      const facturasResponse = await dropbox.filesListFolder({
        path: '/Aplicaciones/FacturasIBS',
        recursive: false,
      });

      const facturasFiles = facturasResponse.result.entries
        .filter((entry: any) => entry['.tag'] === 'file')
        .map((file: any) => ({
          name: file.name,
          path: file.path_display,
          size: file.size
        }));

      results.push({
        location: '/Aplicaciones/FacturasIBS',
        files: facturasFiles,
        status: 'exists'
      });
    } catch (error: any) {
      results.push({
        location: '/Aplicaciones/FacturasIBS',
        error: error.message,
        status: 'not_found'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Verificación de estructura de Dropbox',
      results: results
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
