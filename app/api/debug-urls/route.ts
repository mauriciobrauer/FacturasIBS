
import { NextResponse } from 'next/server';
import { NotionService } from '@/lib/services/notion';

export async function GET() {
    try {
        const notion = NotionService.getInstance();

        // Obtenemos facturas tal cual las ve la app
        const invoices = await notion.getInvoices();

        return NextResponse.json({
            source: "debug-urls",
            timestamp: new Date().toISOString(),
            count: invoices.length,
            sample: invoices.slice(0, 5).map(inv => ({
                folio: inv.folioFiscal,
                proveedor: inv.proveedor,
                url_raw: inv.archivoUrl,
                url_length: inv.archivoUrl ? inv.archivoUrl.length : 0
            }))
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
