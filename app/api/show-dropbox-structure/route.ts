import { NextRequest, NextResponse } from 'next/server';
import { Dropbox } from 'dropbox';
import { config } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const dropbox = new Dropbox({
      accessToken: config.dropbox.accessToken,
      fetch: fetch,
    });

    const structure = {
      root: [],
      aplicaciones: [],
      facturasIBS: []
    };

    // 1. Listar carpetas en la raíz
    try {
      const rootResponse = await dropbox.filesListFolder({
        path: '',
        recursive: false,
      });

      structure.root = rootResponse.result.entries
        .filter((entry: any) => entry['.tag'] === 'folder')
        .map((folder: any) => ({
          name: folder.name,
          path: folder.path_display,
          type: 'folder'
        }));

      structure.root.push(...rootResponse.result.entries
        .filter((entry: any) => entry['.tag'] === 'file')
        .map((file: any) => ({
          name: file.name,
          path: file.path_display,
          type: 'file',
          size: file.size
        })));
    } catch (error: any) {
      structure.root = [{ name: 'Error accediendo a la raíz', error: error.message }];
    }

    // 2. Listar contenido de /Aplicaciones
    try {
      const aplicacionesResponse = await dropbox.filesListFolder({
        path: '/Aplicaciones',
        recursive: false,
      });

      structure.aplicaciones = aplicacionesResponse.result.entries
        .filter((entry: any) => entry['.tag'] === 'folder')
        .map((folder: any) => ({
          name: folder.name,
          path: folder.path_display,
          type: 'folder'
        }));

      structure.aplicaciones.push(...aplicacionesResponse.result.entries
        .filter((entry: any) => entry['.tag'] === 'file')
        .map((file: any) => ({
          name: file.name,
          path: file.path_display,
          type: 'file',
          size: file.size
        })));
    } catch (error: any) {
      structure.aplicaciones = [{ name: 'Error accediendo a /Aplicaciones', error: error.message }];
    }

    // 3. Listar contenido de /Aplicaciones/FacturasIBS
    try {
      const facturasResponse = await dropbox.filesListFolder({
        path: '/Aplicaciones/FacturasIBS',
        recursive: false,
      });

      structure.facturasIBS = facturasResponse.result.entries
        .filter((entry: any) => entry['.tag'] === 'file')
        .map((file: any) => ({
          name: file.name,
          path: file.path_display,
          type: 'file',
          size: file.size,
          modified: file.server_modified
        }));
    } catch (error: any) {
      structure.facturasIBS = [{ name: 'Error accediendo a /Aplicaciones/FacturasIBS', error: error.message }];
    }

    return NextResponse.json({
      success: true,
      message: 'Estructura de Dropbox',
      structure: structure
    });

  } catch (error) {
    console.error('Error mostrando estructura:', error);
    return NextResponse.json(
      { 
        error: 'Error mostrando estructura',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
