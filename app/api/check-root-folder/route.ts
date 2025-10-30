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

    // Intentar acceder a /FacturasIBS
    try {
      const response = await dropbox.filesListFolder({
        path: '/FacturasIBS',
        recursive: false,
      });
      
      results.push({
        path: '/FacturasIBS',
        status: 'accessible',
        files: response.result.entries.filter((entry: any) => entry['.tag'] === 'file').length,
        folders: response.result.entries.filter((entry: any) => entry['.tag'] === 'folder').length
      });
    } catch (error: any) {
      results.push({
        path: '/FacturasIBS',
        status: 'error',
        error: error.message,
        statusCode: error.status
      });
    }

    // Verificar /Aplicaciones/FacturasIBS
    try {
      const response = await dropbox.filesListFolder({
        path: '/Aplicaciones/FacturasIBS',
        recursive: false,
      });
      
      results.push({
        path: '/Aplicaciones/FacturasIBS',
        status: 'accessible',
        files: response.result.entries.filter((entry: any) => entry['.tag'] === 'file').length,
        folders: response.result.entries.filter((entry: any) => entry['.tag'] === 'folder').length
      });
    } catch (error: any) {
      results.push({
        path: '/Aplicaciones/FacturasIBS',
        status: 'error',
        error: error.message,
        statusCode: error.status
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Verificación de carpetas',
      results: results
    });

  } catch (error) {
    console.error('Error verificando carpetas:', error);
    return NextResponse.json(
      { 
        error: 'Error verificando carpetas',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
