export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Recurso no encontrado') {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'No autorizado') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Acceso denegado') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflicto') {
    super(message, 409);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Servicio no disponible') {
    super(message, 503);
  }
}

export function handleError(error: unknown): {
  message: string;
  statusCode: number;
  isOperational: boolean;
} {
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      isOperational: error.isOperational,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      statusCode: 500,
      isOperational: false,
    };
  }

  return {
    message: 'Error desconocido',
    statusCode: 500,
    isOperational: false,
  };
}

export function logError(error: unknown, context?: string): void {
  const errorInfo = handleError(error);
  
  console.error(`[${new Date().toISOString()}] Error${context ? ` en ${context}` : ''}:`, {
    message: errorInfo.message,
    statusCode: errorInfo.statusCode,
    isOperational: errorInfo.isOperational,
    stack: error instanceof Error ? error.stack : undefined,
  });
}
