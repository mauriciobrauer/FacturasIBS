import { NextRequest, NextResponse } from 'next/server';
import { config, validateConfig } from '@/lib/config';
import { OCRService } from '@/lib/services/ocr';
import { PDFService } from '@/lib/services/pdf';
import { DropboxService } from '@/lib/services/dropbox';
import { NotionService } from '@/lib/services/notion';
import { StorageService } from '@/lib/services/storage';
import { InvoiceData } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Validar configuración
    validateConfig();

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    console.log('File type received:', file.type);
    console.log('File name:', file.name);
    console.log('File object:', file);
    console.log('Allowed types:', config.upload.allowedTypes);

    // Validar por tipo MIME o extensión (con verificación de null/undefined)
    const fileName = file.name || '';
    const isValidType = (config.upload.allowedTypes as readonly string[]).includes(file.type) ||
      fileName.toLowerCase().endsWith('.pdf') ||
      fileName.toLowerCase().endsWith('.jpg') ||
      fileName.toLowerCase().endsWith('.jpeg') ||
      fileName.toLowerCase().endsWith('.png');

    if (!isValidType) {
      return NextResponse.json(
        { error: `Tipo de archivo no soportado. Tipo recibido: ${file.type}, Nombre: ${fileName}` },
        { status: 400 }
      );
    }

    // Validar tamaño de archivo
    if (file.size > config.upload.maxFileSize) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande' },
        { status: 400 }
      );
    }

    // Inicializar servicios
    const dropboxService = DropboxService.getInstance();
    const notionService = NotionService.getInstance();
    const ocrService = OCRService.getInstance();
    const pdfService = PDFService.getInstance();

    // Crear registro inicial (sin Notion por ahora)
    const initialInvoice: InvoiceData = {
      fecha: new Date().toISOString().split('T')[0],
      monto: 0,
      proveedor: 'Procesando...',
      descripcion: 'Extrayendo información...',
      archivoUrl: '',
      estado: 'procesando',
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
    };

    try {
      // Primero extraer datos del archivo para verificar duplicados
      let extractedText: string;
      let ocrResult;

      if (file.type === 'application/pdf') {
        extractedText = await pdfService.extractTextFromPDF(file);
        ocrResult = await pdfService.extractInvoiceData(extractedText);
      } else {
        extractedText = await ocrService.extractTextFromImage(file);
        ocrResult = await ocrService.extractInvoiceData(extractedText);
      }

      // Verificar si existe una factura con el mismo Folio Fiscal
      const storageService = StorageService.getInstance();
      console.log('Folio Fiscal extraído:', ocrResult.folioFiscal);

      if (ocrResult.folioFiscal) {
        console.log('Verificando duplicados para folio:', ocrResult.folioFiscal);
        const isDuplicate = await storageService.isDuplicateFolio(ocrResult.folioFiscal);
        console.log('¿Es duplicado?', isDuplicate);

        if (isDuplicate) {
          const existingInvoice = await storageService.findInvoiceByFolio(ocrResult.folioFiscal);
          console.log('Factura existente encontrada:', existingInvoice);

          return NextResponse.json({
            success: false,
            error: 'Factura duplicada',
            message: `Ya existe una factura con el Folio Fiscal: ${ocrResult.folioFiscal}`,
            existingInvoice: existingInvoice,
            isDuplicate: true
          }, { status: 409 }); // Conflict status
        }
      } else {
        console.log('No se encontró Folio Fiscal, continuando con la subida');
      }

      // Si no es duplicada, subir archivo a Dropbox
      const desiredBaseName = ocrResult.folioFiscal ? ocrResult.folioFiscal : undefined;
      const dropboxFile = await dropboxService.uploadFile(file, '', desiredBaseName);
      // Generar enlace compartido usando la API para garantizar acceso correcto
      const publicLink = await dropboxService.createSharedLink(dropboxFile.path_display);

      // Crear datos finales de la factura
      const finalInvoice: InvoiceData = {
        id: `temp-${Date.now()}`,
        fecha: ocrResult.fecha || new Date().toISOString().split('T')[0],
        monto: ocrResult.monto || 0,
        proveedor: ocrResult.proveedor || 'Proveedor no identificado',
        descripcion: ocrResult.descripcion || 'Sin descripción',
        folioFiscal: ocrResult.folioFiscal,
        archivoUrl: publicLink,
        estado: 'completado',
        fechaCreacion: initialInvoice.fechaCreacion,
        fechaActualizacion: new Date().toISOString(),
      };

      // (Manifest eliminado)

      // Sin Notion por ahora - solo procesar archivo

      // Crear registro en Notion (no bloquear si falla)
      try {
        await notionService.createInvoice(finalInvoice);
      } catch (e) {
        console.error('No se pudo crear registro en Notion (no bloqueante):', e);
      }

      return NextResponse.json({
        success: true,
        data: finalInvoice,
        ocrConfidence: ocrResult.confianza,
      });

    } catch (processingError) {
      console.error('Error procesando archivo:', processingError);

      return NextResponse.json(
        {
          error: 'Error procesando el archivo',
          details: processingError instanceof Error ? processingError.message : 'Error desconocido'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error en API de subida:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
