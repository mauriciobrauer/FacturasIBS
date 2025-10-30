import { NextRequest, NextResponse } from 'next/server';
import { Dropbox } from 'dropbox';
import { config } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const dropbox = new Dropbox({
      accessToken: config.dropbox.accessToken,
      fetch: fetch,
    });

    // Listar archivos en la raíz
    const response = await dropbox.filesListFolder({
      path: '',
      recursive: false,
    });

    const files = response.result.entries
      .filter((entry: any) => entry['.tag'] === 'file')
      .map((file: any) => ({
        name: file.name,
        path: file.path_display,
        size: file.size,
        modified: file.server_modified
      }));

    const folders = response.result.entries
      .filter((entry: any) => entry['.tag'] === 'folder')
      .map((folder: any) => ({
        name: folder.name,
        path: folder.path_display
      }));

    return NextResponse.json({
      success: true,
      message: 'Archivos en la raíz de Dropbox',
      files: files,
      folders: folders,
      totalFiles: files.length,
      totalFolders: folders.length
    });

  } catch (error) {
    console.error('Error listando archivos de la raíz:', error);
    return NextResponse.json(
      { 
        error: 'Error listando archivos de la raíz',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
