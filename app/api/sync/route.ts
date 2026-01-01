
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
                } catch (e) {
                    console.error(`Error fixing link invoice ${inv.id}`, e);
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
