
import { NextResponse } from 'next/server';
import { NotionService } from '@/lib/services/notion';
import { DropboxService } from '@/lib/services/dropbox';

export async function GET() {
    try {
        const notion = NotionService.getInstance();
        const dropbox = DropboxService.getInstance();

        // 1. Obtener todo
        const [invoices, files] = await Promise.all([
            notion.getInvoices(),
            dropbox.listFiles('/Aplicaciones/FacturasIBS'),
        ]);

        // Fallback root if needed
        let allFiles = files;
        if (files.length < 5) {
            const rootFiles = await dropbox.listFiles('/FacturasIBS');
            allFiles = [...files, ...rootFiles];
        }

        // De-duplicate files list by ID
        const uniqueFiles = new Map();
        allFiles.forEach(f => uniqueFiles.set(f.id, f));
        const distinctFiles = Array.from(uniqueFiles.values());

        let updated = 0;
        const errors: any[] = [];
        const logs: string[] = [];

        // 2. Recorrer facturas y buscar su archivo real
        for (const inv of invoices) {
            // Normalizar folio
            const invFolio = (inv.folioFiscal || "").trim();
            if (!invFolio) continue;

            // Encontrar archivo
            let match = distinctFiles.find(f => {
                const nameNoExt = f.name.replace(/\.[^/.]+$/, "");
                return (invFolio === nameNoExt);
            });

            // Si no hubo match por folio, intentar por proveedor (para casos legacy)
            if (!match && inv.proveedor && inv.proveedor !== 'Proveedor no identificado') {
                match = distinctFiles.find(f => {
                    const nameNoExt = f.name.replace(/\.[^/.]+$/, "");
                    return (inv.proveedor === nameNoExt);
                });
            }

            // Si encontramos el archivo, generamos link OFICIAL API y actualizamos
            if (match) {
                try {
                    // Generar link compartido real (ignora si ya es correcto, queremos asegurar que funcione)
                    const sharedLink = await dropbox.createSharedLink(match.path_display);

                    // Solo actualizar si es diferente
                    if (inv.archivoUrl !== sharedLink) {
                        await notion.updateInvoiceUrl(inv.id, sharedLink);
                        updated++;
                        logs.push(`Updated ${invFolio} -> ${sharedLink}`);
                    } else {
                        logs.push(`Skipped ${invFolio} (already correct)`);
                    }
                } catch (e: any) {
                    errors.push({ id: inv.id, folio: invFolio, error: e.message });
                }
            } else {
                logs.push(`No file found for invoice ${invFolio}`);
            }
        }

        return NextResponse.json({
            success: true,
            processed: invoices.length,
            updated: updated,
            errors: errors,
            logs: logs
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
