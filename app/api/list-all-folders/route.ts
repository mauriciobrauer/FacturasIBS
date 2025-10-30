import { NextRequest, NextResponse } from 'next/server';
import { Dropbox } from 'dropbox';
import { config } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const dropbox = new Dropbox({
      accessToken: config.dropbox.accessToken,
      fetch: fetch,
    });

    const allFolders = [];

    // Función recursiva para listar todas las carpetas
    async function listAllFolders(path: string, depth: number = 0) {
      if (depth > 4) return; // Limitar profundidad
      
      try {
        const response = await dropbox.filesListFolder({
          path: path,
          recursive: false,
        });

        for (const entry of response.result.entries) {
          if (entry['.tag'] === 'folder') {
            allFolders.push({
              name: entry.name,
              path: entry.path_display,
              depth: depth,
              parent: path === '' ? 'root' : path
            });
            
            // Buscar recursivamente en subcarpetas
            await listAllFolders(entry.path_display, depth + 1);
          }
        }
      } catch (error: any) {
        if (error.status !== 404) {
          console.error(`Error listando carpetas en ${path}:`, error.message);
        }
      }
    }

    // Listar desde la raíz
    await listAllFolders('');

    // Ordenar por profundidad y nombre
    allFolders.sort((a, b) => {
      if (a.depth !== b.depth) {
        return a.depth - b.depth;
      }
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      success: true,
      message: 'Todas las carpetas en Dropbox',
      folders: allFolders,
      totalFolders: allFolders.length
    });

  } catch (error) {
    console.error('Error listando todas las carpetas:', error);
    return NextResponse.json(
      { 
        error: 'Error listando carpetas',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
