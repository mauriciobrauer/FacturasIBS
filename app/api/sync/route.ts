
import { NextResponse } from 'next/server';
import { NotionService } from '@/lib/services/notion';
import { DropboxService } from '@/lib/services/dropbox';
import { InvoiceData } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        console.log('Starting sync process...');
        const notion = NotionService.getInstance();
        const dropbox = DropboxService.getInstance();

        // 1. Obtener datos de ambas fuentes
        const [invoices, files] = await Promise.all([
            notion.getInvoices(),
            dropbox.listFiles(''),
        ]);

        // Mapa para búsqueda rápida de archivos
        const filesMap = new Map();
        files.forEach(f => {
            // Mapa exacto
            filesMap.set(f.name, f);
            // Mapa sin extensión
            const noExt = f.name.replace(/\.[^/.]+$/, "");
            filesMap.set(noExt, f);
        });

        let fixedLinks = 0;
        let orphansCreated = 0;

        // Set de IDs de archivos encontrados/vinculados
        const seenFileIds = new Set();

        // 2. Corregir enlaces y vincular facturas existentes
        for (const inv of invoices) {
            let match = null;

            const folio = (inv.folioFiscal || "").trim();
            const provider = (inv.proveedor || "").trim();

            // Intentar matching
            if (folio && filesMap.has(folio)) match = filesMap.get(folio);
            else if (provider && filesMap.has(provider)) match = filesMap.get(provider);
            else if (inv.archivoUrl) {
                // Backup: buscar si el nombre del archivo está en la URL actual
                match = files.find(f => inv.archivoUrl.includes(f.name));
            }

            if (match) {
                seenFileIds.add(match.id);
                try {
                    // Obtener link oficial
                    const correctLink = await dropbox.createSharedLink(match.path_display || '');

                    // Si es diferente, actualizar
                    if (inv.id && inv.archivoUrl !== correctLink) {
                        await notion.updateInvoiceUrl(inv.id, correctLink);
                        fixedLinks++;
                    }

                    // REPARACIÓN: Si el monto es 0 ó inválido, intentar extraerlo del archivo
                    if (inv.id && (inv.monto === 0 || !inv.monto)) {
                        console.log(`Intentando reparar factura ${inv.folioFiscal} con monto 0...`);
                        const buffer = await dropbox.downloadFile(match.path_display);
                        const ext = match.name.split('.').pop()?.toLowerCase();

                        let extractedResult = null;
                        if (ext === 'pdf') {
                            const { PDFService } = await import('@/lib/services/pdf');
                            const text = await PDFService.getInstance().extractTextFromPDF(buffer);
                            extractedResult = await PDFService.getInstance().extractInvoiceData(text);
                        } else if (['jpg', 'jpeg', 'png'].includes(ext || '')) {
                            const { OCRService } = await import('@/lib/services/ocr');
                            const text = await OCRService.getInstance().extractTextFromImage(buffer);
                            extractedResult = await OCRService.getInstance().extractInvoiceData(text);
                        }

                        if (extractedResult && extractedResult.monto && extractedResult.monto > 0) {
                            console.log(`Reparación exitosa para ${inv.folioFiscal}: Monto ${extractedResult.monto}`);
                            await notion.updateInvoiceData(inv.id, {
                                monto: extractedResult.monto,
                                fecha: (!inv.fecha && extractedResult.fecha) ? extractedResult.fecha : undefined
                            });
                        }
                    }

                } catch (e) {
                    console.error(`Error fixing/repairing invoice ${inv.id}`, e);
                }
            }
        }

        // 3. Procesar Huérfanos (Archivos en Dropbox sin factura)
        const orphans = files.filter(f => !seenFileIds.has(f.id));

        for (const file of orphans) {
            if (file.name.startsWith('.')) continue; // Ignorar ocultos

            // Validar extensión
            const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.xml'];
            const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
            if (!validExtensions.includes(ext)) continue;

            try {
                const publicLink = await dropbox.createSharedLink(file.path_display);
                const creationDate = new Date(file.client_modified).toISOString();
                const simpleDate = creationDate.split('T')[0];
                const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");

                const newInvoice: InvoiceData = {
                    fecha: simpleDate,
                    monto: 0,
                    proveedor: 'Archivo Recuperado',
                    descripcion: 'Sincronizado manualmente',
                    folioFiscal: nameWithoutExt,
                    archivoUrl: publicLink,
                    estado: 'completado',
                    fechaCreacion: creationDate,
                    fechaActualizacion: new Date().toISOString()
                };

                await notion.createInvoice(newInvoice);
                orphansCreated++;
            } catch (e) {
                console.error(`Error creating orphan invoice ${file.name}`, e);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Sincronización completada. Links corregidos: ${fixedLinks}. Nuevos recuperados: ${orphansCreated}.`,
            stats: { fixedLinks, orphansCreated }
        });

    } catch (error: any) {
        console.error('Sync error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
