
import { NextResponse } from 'next/server';
import { NotionService } from '@/lib/services/notion';
import { DropboxService } from '@/lib/services/dropbox';

export async function GET() {
    try {
        const notion = NotionService.getInstance();
        const dropbox = DropboxService.getInstance();

        // 1. Obtener datos de ambas fuentes
        const [invoices, files] = await Promise.all([
            notion.getInvoices(),
            dropbox.listFiles(''), // Root folder where files are stored
        ]);

        // 2. Encontrar discrepancias (Archivos en Dropbox que NO tienen factura en Notion)
        const extraDropboxFiles = files.filter(file => {
            const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");

            // Match por URL
            const isReferencedInUrl = invoices.some(inv => {
                return inv.archivoUrl && decodeURIComponent(inv.archivoUrl).includes(file.name);
            });

            // Match por nombre
            const isTitleMatch = invoices.some(inv => {
                const invFolio = (inv.folioFiscal || "").trim();
                const invProv = (inv.proveedor || "").trim();
                return (invFolio === nameWithoutExt) || (invProv === nameWithoutExt);
            });

            return !isReferencedInUrl && !isTitleMatch;
        });

        return NextResponse.json({
            status: "OK",
            summary: {
                notionCount: invoices.length,
                dropboxCount: files.length,
                extraFilesCount: extraDropboxFiles.length
            },
            // Lista explícita de archivos sobrantes
            extraFiles: extraDropboxFiles.map(f => ({
                name: f.name,
                path: f.path_display,
                modified: f.client_modified
            })),
            // Muestra parcial de Notion
            notionSample: invoices.slice(0, 3).map(i => `${i.folioFiscal || 'Sin Folio'} (${i.archivoUrl})`)
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
