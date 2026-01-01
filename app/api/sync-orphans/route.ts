
import { NextResponse } from 'next/server';
import { NotionService } from '@/lib/services/notion';
import { DropboxService } from '@/lib/services/dropbox';
import { InvoiceData } from '@/lib/types';

export async function GET() {
    try {
        const notion = NotionService.getInstance();
        const dropbox = DropboxService.getInstance();

        // 1. Obtener datos de ambas fuentes
        const [invoices, files] = await Promise.all([
            notion.getInvoices(),
            dropbox.listFiles('/Aplicaciones/FacturasIBS'), // Carpeta default
        ]);

        // Fallback carpeta raiz si la específica está vacía
        let allFiles = files;
        if (files.length === 0) {
            const rootFiles = await dropbox.listFiles('/FacturasIBS');
            if (rootFiles.length > 0) allFiles = rootFiles;
        }

        // 2. Encontrar archivos sin factura en Notion (Huérfanos)
        const orphans = allFiles.filter(file => {
            // Verificar si este archivo está referenciado en alguna factura
            const isReferenced = invoices.some(inv => {
                return inv.archivoUrl && decodeURIComponent(inv.archivoUrl).includes(file.name);
            });

            // También verificar por coincidencia exacta de título (Folio) con el nombre del archivo (sin extensión)
            const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
            const isTitleMatch = invoices.some(inv => inv.folioFiscal === nameWithoutExt || inv.proveedor === nameWithoutExt);

            return !isReferenced && !isTitleMatch;
        });

        const results = [];

        // 3. Crear facturas para los huérfanos
        for (const file of orphans) {
            console.log(`Sincronizando archivo huérfano: ${file.name}`);

            // Generar enlace compartido
            const publicLink = await dropbox.createSharedLink(file.path_display);

            // Extraer posible fecha del nombre (si es timestamp) o usar fecha modificación
            const creationDate = new Date(file.client_modified).toISOString();
            const simpleDate = creationDate.split('T')[0];

            const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");

            const newInvoice: InvoiceData = {
                fecha: simpleDate,
                monto: 0, // Desconocido
                proveedor: 'Archivo Recuperado',
                descripcion: 'Factura sincronizada automáticamente desde Dropbox',
                folioFiscal: nameWithoutExt,
                archivoUrl: publicLink,
                estado: 'completado',
                fechaCreacion: creationDate,
                fechaActualizacion: new Date().toISOString()
            };

            await notion.createInvoice(newInvoice);
            results.push(newInvoice);
        }

        return NextResponse.json({
            success: true,
            orphansFound: orphans.length,
            syncedInvoices: results,
            message: `Se encontraron y sincronizaron ${orphans.length} archivos huérfanos.`
        });

    } catch (error: any) {
        console.error('Error en sync-orphans:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
