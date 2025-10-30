import { NextRequest, NextResponse } from 'next/server';
import { Dropbox } from 'dropbox';
import { config } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const dropbox = new Dropbox({
      accessToken: config.dropbox.accessToken,
      fetch: fetch,
    });

    // Listar carpetas en la raíz
    const response = await dropbox.filesListFolder({
      path: '',
      recursive: false,
    });

    const folders = response.result.entries
      .filter((entry: any) => entry['.tag'] === 'folder')
      .map((folder: any) => ({
        name: folder.name,
        path: folder.path_display
      }));

    return NextResponse.json({
      success: true,
      folders: folders
    });

  } catch (error) {
    console.error('Error listando carpetas:', error);
    return NextResponse.json(
      { 
        error: 'Error listando carpetas',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
