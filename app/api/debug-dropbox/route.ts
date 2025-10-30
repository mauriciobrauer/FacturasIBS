import { NextRequest, NextResponse } from 'next/server';
import { DropboxService } from '@/lib/services/dropbox';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    const dropboxService = DropboxService.getInstance();
    
    // Probar solo la subida sin crear enlace público
    const dropboxFile = await dropboxService.uploadFile(file);
    
    return NextResponse.json({
      success: true,
      message: 'Archivo subido exitosamente',
      dropboxFile: dropboxFile
    });

  } catch (error) {
    console.error('Error detallado:', error);
    return NextResponse.json(
      { 
        error: 'Error en debug',
        details: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
