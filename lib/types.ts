export interface InvoiceData {
  id?: string;
  fecha: string;
  monto: number;
  proveedor: string;
  descripcion: string;
  folioFiscal?: string;
  archivoUrl: string;
  estado: 'procesando' | 'completado' | 'error';
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export interface OCRResult {
  fecha?: string;
  monto?: number;
  proveedor?: string;
  descripcion?: string;
  folioFiscal?: string;
  confianza: number;
}

export interface DropboxFile {
  id: string;
  name: string;
  path_display: string;
  size: number;
  client_modified: string;
  server_modified: string;
  content_hash: string;
}

export interface NotionPage {
  id: string;
  properties: {
    Fecha: { date: { start: string } };
    Monto: { number: number };
    Proveedor: { title: [{ text: { content: string } }] };
    Descripcion: { rich_text: [{ text: { content: string } }] };
    Archivo: { url: string };
    Estado: { select: { name: string } };
  };
}

