import { ValidationError } from './error-handler';

export function validateFileType(file: File, allowedTypes: string[]): void {
  if (!allowedTypes.includes(file.type)) {
    throw new ValidationError(`Tipo de archivo no soportado. Tipos permitidos: ${allowedTypes.join(', ')}`);
  }
}

export function validateFileSize(file: File, maxSize: number): void {
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    throw new ValidationError(`El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`);
  }
}

export function validateRequired(value: any, fieldName: string): void {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    throw new ValidationError(`El campo ${fieldName} es requerido`);
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Formato de email inválido');
  }
}

export function validateDate(dateString: string): void {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new ValidationError('Formato de fecha inválido');
  }
}

export function validateNumber(value: any, fieldName: string, min?: number, max?: number): void {
  const num = Number(value);
  if (isNaN(num)) {
    throw new ValidationError(`El campo ${fieldName} debe ser un número válido`);
  }
  
  if (min !== undefined && num < min) {
    throw new ValidationError(`El campo ${fieldName} debe ser mayor o igual a ${min}`);
  }
  
  if (max !== undefined && num > max) {
    throw new ValidationError(`El campo ${fieldName} debe ser menor o igual a ${max}`);
  }
}

export function validateStringLength(value: string, fieldName: string, minLength?: number, maxLength?: number): void {
  if (minLength !== undefined && value.length < minLength) {
    throw new ValidationError(`El campo ${fieldName} debe tener al menos ${minLength} caracteres`);
  }
  
  if (maxLength !== undefined && value.length > maxLength) {
    throw new ValidationError(`El campo ${fieldName} no puede tener más de ${maxLength} caracteres`);
  }
}

export function sanitizeString(value: string): string {
  return value.trim().replace(/[<>]/g, '');
}

export function validateInvoiceData(data: {
  fecha?: string;
  monto?: number;
  proveedor?: string;
  descripcion?: string;
}): void {
  if (data.fecha) {
    validateDate(data.fecha);
  }
  
  if (data.monto !== undefined) {
    validateNumber(data.monto, 'monto', 0);
  }
  
  if (data.proveedor) {
    validateStringLength(data.proveedor, 'proveedor', 1, 255);
  }
  
  if (data.descripcion) {
    validateStringLength(data.descripcion, 'descripcion', 0, 1000);
  }
}
