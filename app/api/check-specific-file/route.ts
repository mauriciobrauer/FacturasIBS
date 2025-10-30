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

    // Verificar archivos específicos que sabemos que se subieron
    const filesToCheck = [
      '1761778535143-test_factura.pdf',
      '1761778570460-test_factura.pdf'
    ];

    for (const fileName of filesToCheck) {
      try {
        const response = await dropbox.filesGetMetadata({
          path: `/${fileName}`
        });

        results.push({
          fileName: fileName,
          status: 'exists',
          path: response.result.path_display,
          size: response.result.size,
          modified: response.result.server_modified
        });
      } catch (error: any) {
        results.push({
          fileName: fileName,
          status: 'not_found',
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Verificación de archivos específicos',
      results: results
    });

  } catch (error) {
    console.error('Error verificando archivos específicos:', error);
    return NextResponse.json(
      { 
        error: 'Error verificando archivos específicos',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
