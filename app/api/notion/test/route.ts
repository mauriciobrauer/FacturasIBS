import { NextResponse } from 'next/server';
import { NotionService } from '@/lib/services/notion';
import { validateConfig } from '@/lib/config';

export async function POST() {
  try {
    validateConfig();
    const notion = NotionService.getInstance();

    const dummy = {
      id: '',
      fecha: new Date().toISOString().slice(0, 10),
      monto: 1234,
      proveedor: 'Dummy Test',
      descripcion: 'Registro de prueba desde API',
      archivoUrl: 'https://www.dropbox.com/home?preview=dummy.pdf',
      estado: 'completado',
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
      folioFiscal: 'DUMMY-FOLIO-TEST',
    };

    const page = await notion.createInvoice(dummy);
    return NextResponse.json({ success: true, data: page });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: 'No se pudo crear el registro en Notion', details: e?.message },
      { status: 500 }
    );
  }
}


