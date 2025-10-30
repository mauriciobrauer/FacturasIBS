import { NextRequest, NextResponse } from 'next/server';
import { config, validateConfig } from '@/lib/config';
import { NotionService } from '@/lib/services/notion';

export async function GET(request: NextRequest) {
  try {
    // Validar configuración
    validateConfig();

    const notionService = NotionService.getInstance();
    const stats = await notionService.getInvoiceStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return NextResponse.json(
      { 
        error: 'Error obteniendo estadísticas',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
