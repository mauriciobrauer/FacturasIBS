
import { NextResponse } from 'next/server';
import { NotionService } from '@/lib/services/notion';
import { DropboxService } from '@/lib/services/dropbox';
import { InvoiceData } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const notion = NotionService.getInstance();
        const dropbox = DropboxService.getInstance();

        // 1. Obtener datos
        const [invoices, files] = await Promise.all([
            notion.getInvoices(),
            dropbox.listFiles(''),
        ]);

        const extraFiles = files.filter(file => {
            const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
            const isReferencedInUrl = invoices.some(inv => inv.archivoUrl && decodeURIComponent(inv.archivoUrl).includes(file.name));
            const isTitleMatch = invoices.some(inv => {
                const invFolio = (inv.folioFiscal || "").trim();
                const invProv = (inv.proveedor || "").trim();
                return (invFolio === nameWithoutExt) || (invProv === nameWithoutExt);
            });
            return !isReferencedInUrl && !isTitleMatch;
        });

        // 3. Lógica para reparar facturas "Proveedor no identificado"
        // Buscamos facturas que no tienen archivo asociado correctamente
        const brokenInvoices = invoices.filter(inv =>
            (inv.folioFiscal === 'Proveedor no identificado' || inv.proveedor === 'Proveedor no identificado') &&
            (!inv.archivoUrl || inv.archivoUrl.includes('Proveedor%20no%20identificado'))
        );

        // Sort invoices by created time (desc)
        brokenInvoices.sort((a: any, b: any) => new Date(b.fechaCreacion || 0).getTime() - new Date(a.fechaCreacion || 0).getTime());
        // Sort files by modified time (desc)
        extraFiles.sort((a, b) => new Date(b.client_modified).getTime() - new Date(a.client_modified).getTime());

        const fixes = [];

        // Emparejar
        for (let i = 0; i < Math.min(brokenInvoices.length, extraFiles.length); i++) {
            const inv = brokenInvoices[i];
            const file = extraFiles[i];

            try {
                const sharedLink = await dropbox.createSharedLink(file.path_display);

                // Actualizar URL en Notion
                if (inv.archivoUrl !== sharedLink) {
                    await notion.updateInvoiceUrl(inv.id, sharedLink);
                    fixes.push({
                        invoice: inv.folioFiscal,
                        oldUrl: inv.archivoUrl,
                        newUrl: sharedLink,
                        matchedFile: file.name
                    });
                }
            } catch (e: any) {
                console.error(e);
            }
        }

        // LISTAR TODO PARA QUE EL USUARIO CUENTE (Respuesta al "por qué 21?")
        const readableInvoices = invoices.map((inv, index) => ({
            index: index + 1,
            fecha: inv.fecha,
            monto: inv.monto,
            proveedor: inv.proveedor,
            folio: inv.folioFiscal,
            url: inv.archivoUrl
        }));
        readableInvoices.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

        return NextResponse.json({
            status: "OK",
            summary: {
                notionCount: invoices.length,
                dropboxCount: files.length,
                brokenInvoicesCount: brokenInvoices.length,
                extraFilesCount: extraFiles.length,
                filesFixed: fixes.length
            },
            fixes: fixes,
            allInvoices: readableInvoices
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
