import { NextRequest, NextResponse } from 'next/server';
import { config, validateConfig } from '@/lib/config';
import { NotionService } from '@/lib/services/notion';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Validar configuración
    validateConfig();

    const notionService = NotionService.getInstance();
    const invoices = await notionService.getInvoices();

    return NextResponse.json({
      success: true,
      data: invoices,
    });

  } catch (error) {
    console.error('Error obteniendo facturas:', error);
    return NextResponse.json(
      {
        error: 'Error obteniendo facturas',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validar configuración
    validateConfig();

    const body = await request.json();
    const { fecha, monto, proveedor, descripcion, archivoUrl, estado } = body;

    // Validar datos requeridos
    if (!fecha || !proveedor || !archivoUrl) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    const notionService = NotionService.getInstance();

    const invoiceData = {
      fecha,
      monto: monto || 0,
      proveedor,
      descripcion: descripcion || '',
      archivoUrl,
      estado: estado || 'completado',
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
    };

    const notionPage = await notionService.createInvoice(invoiceData);

    return NextResponse.json({
      success: true,
      data: {
        id: notionPage.id,
        ...invoiceData,
      },
    });

  } catch (error) {
    console.error('Error creando factura:', error);
    return NextResponse.json(
      {
        error: 'Error creando factura',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
