import { NextRequest, NextResponse } from 'next/server';
import { Dropbox } from 'dropbox';
import { config } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const dropbox = new Dropbox({
      accessToken: config.dropbox.accessToken,
      fetch: fetch,
    });

    const searchResults = [];
    const searchTerm = 'prueba dev';

    // Función recursiva para buscar carpetas
    async function searchFolders(path: string, depth: number = 0) {
      if (depth > 3) return; // Limitar profundidad para evitar bucles infinitos
      
      try {
        const response = await dropbox.filesListFolder({
          path: path,
          recursive: false,
        });

        for (const entry of response.result.entries) {
          if (entry['.tag'] === 'folder') {
            const folderName = entry.name.toLowerCase();
            const folderPath = entry.path_display;
            
            // Buscar coincidencias en el nombre
            if (folderName.includes('prueba') || folderName.includes('dev')) {
              searchResults.push({
                name: entry.name,
                path: folderPath,
                type: 'folder',
                match: folderName.includes(searchTerm.toLowerCase()) ? 'exact' : 'partial'
              });
            }
            
            // Buscar recursivamente en subcarpetas
            await searchFolders(folderPath, depth + 1);
          }
        }
      } catch (error: any) {
        if (error.status !== 404) {
          console.error(`Error buscando en ${path}:`, error.message);
        }
      }
    }

    // Buscar desde la raíz
    await searchFolders('');

    // También buscar específicamente en /Aplicaciones
    try {
      const aplicacionesResponse = await dropbox.filesListFolder({
        path: '/Aplicaciones',
        recursive: true,
      });

      for (const entry of aplicacionesResponse.result.entries) {
        if (entry['.tag'] === 'folder') {
          const folderName = entry.name.toLowerCase();
          if (folderName.includes('prueba') || folderName.includes('dev')) {
            searchResults.push({
              name: entry.name,
              path: entry.path_display,
              type: 'folder',
              match: folderName.includes(searchTerm.toLowerCase()) ? 'exact' : 'partial'
            });
          }
        }
      }
    } catch (error: any) {
      console.error('Error buscando en /Aplicaciones:', error.message);
    }

    // Eliminar duplicados
    const uniqueResults = searchResults.filter((result, index, self) => 
      index === self.findIndex(r => r.path === result.path)
    );

    return NextResponse.json({
      success: true,
      message: `Búsqueda de carpetas con "prueba" o "dev"`,
      searchTerm: searchTerm,
      results: uniqueResults,
      totalFound: uniqueResults.length
    });

  } catch (error) {
    console.error('Error buscando carpetas:', error);
    return NextResponse.json(
      { 
        error: 'Error buscando carpetas',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
