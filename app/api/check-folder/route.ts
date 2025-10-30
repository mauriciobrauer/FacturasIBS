import { NextRequest, NextResponse } from 'next/server';
import { Dropbox } from 'dropbox';
import { config } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const dropbox = new Dropbox({
      accessToken: config.dropbox.accessToken,
      fetch: fetch,
    });

    // Verificar si la carpeta /Aplicaciones/FacturaIBS existe
    const folderPath = '/Aplicaciones/FacturaIBS';
    
    try {
      const response = await dropbox.filesListFolder({
        path: folderPath,
        recursive: false,
      });

      return NextResponse.json({
        success: true,
        message: `Carpeta ${folderPath} existe`,
        files: response.result.entries.filter((entry: any) => entry['.tag'] === 'file'),
        folders: response.result.entries.filter((entry: any) => entry['.tag'] === 'folder')
      });

    } catch (error: any) {
      if (error.status === 404) {
        return NextResponse.json({
          success: false,
          message: `Carpeta ${folderPath} no existe`,
          error: 'NOT_FOUND'
        });
      }
      throw error;
    }

  } catch (error) {
    console.error('Error verificando carpeta:', error);
    return NextResponse.json(
      { 
        error: 'Error verificando carpeta',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
