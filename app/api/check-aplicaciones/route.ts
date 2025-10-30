import { NextRequest, NextResponse } from 'next/server';
import { Dropbox } from 'dropbox';
import { config } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const dropbox = new Dropbox({
      accessToken: config.dropbox.accessToken,
      fetch: fetch,
    });

    // Listar contenido de /Aplicaciones
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

    return NextResponse.json({
      success: true,
      message: 'Contenido de /Aplicaciones',
      folders: folders,
      files: files
    });

  } catch (error) {
    console.error('Error listando /Aplicaciones:', error);
    return NextResponse.json(
      { 
        error: 'Error listando /Aplicaciones',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
