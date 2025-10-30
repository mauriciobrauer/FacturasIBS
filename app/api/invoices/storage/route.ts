import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/lib/services/storage';

export async function GET() {
  try {
    const storageService = StorageService.getInstance();
    const invoices = await storageService.getAllInvoices();

    return NextResponse.json({
      success: true,
      data: {
        invoices
      }
    });
  } catch (error) {
    console.error('Error obteniendo facturas:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error obteniendo facturas',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoice } = body;

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos de factura requeridos'
        },
        { status: 400 }
      );
    }

    const storageService = StorageService.getInstance();
    await storageService.addInvoice(invoice);

    return NextResponse.json({
      success: true,
      message: 'Factura guardada exitosamente'
    });
  } catch (error) {
    console.error('Error guardando factura:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error guardando factura',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
