import { NextRequest, NextResponse } from 'next/server';
import { config, validateConfig } from '@/lib/config';
import { NotionService } from '@/lib/services/notion';
import { DropboxService } from '@/lib/services/dropbox';

export async function GET(request: NextRequest) {
  try {
    // Validar configuración básica
    validateConfig();

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        notion: { status: 'unknown', message: '' },
        dropbox: { status: 'unknown', message: '' },
      },
    };

    // Verificar Notion
    try {
      const notionService = NotionService.getInstance();
      const isValid = await notionService.validateDatabase();
      
      health.services.notion = {
        status: isValid ? 'healthy' : 'unhealthy',
        message: isValid ? 'Base de datos válida' : 'Base de datos no válida',
      };
    } catch (error) {
      health.services.notion = {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Error desconocido',
      };
    }

    // Verificar Dropbox
    try {
      const dropboxService = DropboxService.getInstance();
      await dropboxService.listFiles();
      
      health.services.dropbox = {
        status: 'healthy',
        message: 'Conexión exitosa',
      };
    } catch (error) {
      health.services.dropbox = {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Error desconocido',
      };
    }

    // Determinar estado general
    const allServicesHealthy = Object.values(health.services).every(
      service => service.status === 'healthy'
    );

    if (!allServicesHealthy) {
      health.status = 'degraded';
    }

    return NextResponse.json(health);

  } catch (error) {
    console.error('Error en health check:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
