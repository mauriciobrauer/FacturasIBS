export const SUPPORTED_FILE_TYPES = {
  PDF: 'application/pdf',
  JPEG: 'image/jpeg',
  JPG: 'image/jpg',
  PNG: 'image/png',
} as const;

export const SUPPORTED_EXTENSIONS = {
  PDF: ['.pdf'],
  JPEG: ['.jpg', '.jpeg'],
  PNG: ['.png'],
} as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ALLOWED_TYPES = [
  SUPPORTED_FILE_TYPES.PDF,
  SUPPORTED_FILE_TYPES.JPEG,
  SUPPORTED_FILE_TYPES.JPG,
  SUPPORTED_FILE_TYPES.PNG,
];

export const ACCEPT_CONFIG = {
  [SUPPORTED_FILE_TYPES.PDF]: SUPPORTED_EXTENSIONS.PDF,
  [SUPPORTED_FILE_TYPES.JPEG]: SUPPORTED_EXTENSIONS.JPEG,
  [SUPPORTED_FILE_TYPES.PNG]: SUPPORTED_EXTENSIONS.PNG,
};

export function getFileTypeFromMimeType(mimeType: string): string {
  switch (mimeType) {
    case SUPPORTED_FILE_TYPES.PDF:
      return 'PDF';
    case SUPPORTED_FILE_TYPES.JPEG:
    case SUPPORTED_FILE_TYPES.JPG:
      return 'JPEG';
    case SUPPORTED_FILE_TYPES.PNG:
      return 'PNG';
    default:
      return 'Desconocido';
  }
}

export function isFileTypeSupported(mimeType: string): boolean {
  return ALLOWED_TYPES.includes(mimeType as any);
}
