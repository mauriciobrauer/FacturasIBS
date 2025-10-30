import { NextRequest, NextResponse } from 'next/server';
import { Dropbox } from 'dropbox';
import { config } from '@/lib/config';

const dropbox = new Dropbox({
  accessToken: config.dropbox.accessToken,
  fetch: fetch
});

export async function POST(request: NextRequest) {
  try {
    const { filePath } = await request.json();

    if (!filePath) {
      return NextResponse.json(
        { error: 'Ruta del archivo requerida' },
        { status: 400 }
      );
    }

    console.log('Eliminando archivo de Dropbox:', filePath);

    // Eliminar el archivo de Dropbox
    const result = await dropbox.filesDeleteV2({
      path: filePath
    });

    console.log('Archivo eliminado exitosamente:', result);

    return NextResponse.json({
      success: true,
      message: 'Archivo eliminado exitosamente',
      result
    });

  } catch (error) {
    console.error('Error eliminando archivo de Dropbox:', error);
    
    return NextResponse.json(
      {
        error: 'Error eliminando archivo de Dropbox',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
