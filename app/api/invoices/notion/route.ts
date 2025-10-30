import { NextResponse } from 'next/server';
import { NotionService } from '@/lib/services/notion';
import { validateConfig } from '@/lib/config';

export async function GET() {
  try {
    validateConfig();
    const notion = NotionService.getInstance();
    const invoices = await notion.getInvoices();
    return NextResponse.json({ success: true, data: { invoices } });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: 'Error obteniendo facturas de Notion', details: e?.message },
      { status: 500 }
    );
  }
}


