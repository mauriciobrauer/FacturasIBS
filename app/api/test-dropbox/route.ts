import { NextRequest, NextResponse } from 'next/server';
import { DropboxService } from '@/lib/services/dropbox';

export async function GET(request: NextRequest) {
  try {
    const dropboxService = DropboxService.getInstance();
    
    // Probar listar archivos en la carpeta FacturasIBS
    const files = await dropboxService.listFiles('/FacturasIBS');
    
    return NextResponse.json({
      success: true,
      message: 'Conexión a Dropbox exitosa',
      files: files,
      folderPath: '/FacturasIBS'
    });

  } catch (error) {
    console.error('Error probando Dropbox:', error);
    return NextResponse.json(
      { 
        error: 'Error conectando con Dropbox',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
