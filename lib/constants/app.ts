export const APP_CONFIG = {
  name: 'Sincronización de Facturas Médicas',
  description: 'Aplicación para automatizar el registro de facturas médicas',
  version: '1.0.0',
  author: 'Tu Nombre',
} as const;

export const ROUTES = {
  HOME: '/',
  UPLOAD: '/upload',
  INVOICES: '/invoices',
  ANALYTICS: '/analytics',
  INTEGRATIONS: '/integrations',
} as const;

export const API_ROUTES = {
  UPLOAD: '/api/upload',
  INVOICES: '/api/invoices',
  STATS: '/api/stats',
  HEALTH: '/api/health',
} as const;

export const INVOICE_STATUS = {
  PROCESSING: 'procesando',
  COMPLETED: 'completado',
  ERROR: 'error',
} as const;

export const OCR_CONFIG = {
  LANGUAGE: 'spa',
  CONFIDENCE_THRESHOLD: 0.6,
  MAX_RETRIES: 3,
} as const;

export const DROPBOX_CONFIG = {
  FOLDER_PATH: '/facturas-medicas',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

export const NOTION_CONFIG = {
  PROPERTIES: {
    FECHA: 'Fecha',
    MONTO: 'Monto',
    PROVEEDOR: 'Proveedor',
    DESCRIPCION: 'Descripcion',
    ARCHIVO: 'Archivo',
    ESTADO: 'Estado',
  },
} as const;
