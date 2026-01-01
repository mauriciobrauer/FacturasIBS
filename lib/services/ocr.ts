import Tesseract from 'tesseract.js';
import { OCRResult } from '@/lib/types';
import { config } from '@/lib/config';

export class OCRService {
  private static instance: OCRService;

  private constructor() { }

  public static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  /**
   * Procesa una imagen y extrae texto usando OCR
   */
  /**
   * Procesa una imagen y extrae texto usando OCR
   */
  async extractTextFromImage(imageInput: File | Buffer): Promise<string> {
    try {
      // Tesseract.js accepta File, Blob, Buffer, etc.
      const { data: { text } } = await Tesseract.recognize(
        imageInput,
        config.ocr.language,
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          },
        }
      );
      return text;
    } catch (error) {
      console.error('Error en OCR:', error);
      throw new Error('Error al procesar la imagen con OCR');
    }
  }

  /**
   * Extrae información estructurada de una factura médica
   */
  async extractInvoiceData(text: string): Promise<OCRResult> {
    try {
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

      console.log('Texto extraído:', text);
      console.log('Líneas procesadas:', lines);

      // Patrones específicos para facturas mexicanas (CFDI)
      const folioFiscalPattern = /folio\s*fiscal[:\s]*([A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12})/i;
      // Total: prioriza líneas que contienen la palabra "Total"
      const totalPattern = /\btotal\b[\s:]*\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+\.[0-9]{2})/i;

      // Fechas más robustas - múltiples contextos
      const fechaEmisionPatterns = [
        // "Código postal, fecha y hora de emisión:" - patrón específico
        /(?:c[oó]digo\s*postal,?\s*)?fecha\s*(?:y\s*hora\s*de\s*)?emisi[oó]n[:\s]*([0-9]{4}[\/\-\.][0-9]{2}[\/\-\.][0-9]{2}(?:\s+[0-9]{2}:[0-9]{2}:[0-9]{2})?)/i,
        // "fecha de emisión:" o "fecha y hora de emisión:"
        /(?:fecha\s*(?:y\s*hora\s*de\s*)?de\s*emisi[oó]n)[:\s]*([0-9]{4}[\/\-\.][0-9]{2}[\/\-\.][0-9]{2}(?:\s+[0-9]{2}:[0-9]{2}:[0-9]{2})?)/i,
        // "Fecha de emisión del CFDI:"
        /fecha\s*de\s*emisi[oó]n\s*del\s*cfdi[:\s]*([0-9]{4}[\/\-\.][0-9]{2}[\/\-\.][0-9]{2}(?:\s+[0-9]{2}:[0-9]{2}:[0-9]{2})?)/i,
        // Patrón genérico para fechas con hora (evitar cadenas de certificación)
        /(?!.*\|\|.*)([0-9]{4}[\/\-\.][0-9]{2}[\/\-\.][0-9]{2}\s+[0-9]{2}:[0-9]{2}:[0-9]{2})/,
        // Patrón genérico para fechas sin hora (evitar cadenas de certificación)
        /(?!.*\|\|.*)([0-9]{4}[\/\-\.][0-9]{2}[\/\-\.][0-9]{2})/
      ];

      const fechaCertificacionPatterns = [
        /(?:fecha\s*(?:y\s*hora\s*de\s*)?de\s*certificaci[oó]n)[:\s]*([0-9]{4}[\/\-\.][0-9]{2}[\/\-\.][0-9]{2}(?:\s+[0-9]{2}:[0-9]{2}:[0-9]{2})?)/i,
        /fecha\s*y\s*hora\s*de\s*certificaci[oó]n[:\s]*([0-9]{4}[\/\-\.][0-9]{2}[\/\-\.][0-9]{2}(?:\s+[0-9]{2}:[0-9]{2}:[0-9]{2})?)/i
      ];

      // Monto genérico (sin flag global para capturar el primer grupo)
      const anyAmountPattern = /(?:\$\s*)?([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2}))/;
      const proveedorPattern = /(clínica|hospital|farmacia|médico|doctor|dr\.|dra\.|centro médico|consultorio|laboratorio)/i;

      let fecha: string | undefined;
      let monto: number | undefined;
      let proveedor: string | undefined;
      let descripcion: string | undefined;
      let folioFiscal: string | undefined;
      let confianza = 0;

      // Buscar Folio Fiscal (UUID)
      for (const line of lines) {
        const folioMatch = line.match(folioFiscalPattern);
        if (folioMatch) {
          folioFiscal = folioMatch[1];
          confianza += 0.3;
          console.log('Folio Fiscal encontrado:', folioFiscal);
          break;
        }
      }

      // Buscar Total específico
      for (const line of lines) {
        const totalMatch = line.match(totalPattern);
        if (totalMatch) {
          monto = this.parseAmount(totalMatch[1]);
          confianza += 0.4; // mayor confianza al encontrar etiqueta Total
          console.log('Total encontrado:', monto);
          break;
        }
      }

      // Si no encontramos "Total", elegir el mejor candidato por contexto
      if (!monto) {
        const excludePatterns = /(sello|certificaci[oó]n|cadena\s*original|sat|uuid|no\.?\s*de\s*serie|csd|certificado|rfc)/i;
        const bonusTotal = /(\btotal\b)/i;
        const bonusOthers = /(subtotal|importe)/i;
        const upperReasonable = 1000000; // 1M MXN como límite de seguridad

        type Candidate = { amount: number; score: number; line: string };
        const candidates: Candidate[] = [];

        for (const line of lines) {
          if (excludePatterns.test(line)) continue;
          const m = line.match(anyAmountPattern);
          if (!m) continue;
          const amount = this.parseAmount(m[1]);
          if (Number.isNaN(amount) || amount <= 0) continue;
          if (amount > upperReasonable) continue;
          let score = 0;
          if (bonusTotal.test(line)) score += 3;
          if (bonusOthers.test(line)) score += 1;
          // pequeña preferencia por montos mayores, sin excederse
          score += Math.min(amount / 1000, 3); // hasta +3 por monto
          candidates.push({ amount, score, line });
        }

        if (candidates.length > 0) {
          candidates.sort((a, b) => b.score - a.score);
          monto = candidates[0].amount;
          confianza += candidates[0].score >= 3 ? 0.25 : 0.15;
          console.log('Monto por contexto:', { monto, linea: candidates[0].line, score: candidates[0].score });
        }
      }

      // Buscar fecha de emisión con múltiples patrones
      for (const line of lines) {
        for (const pattern of fechaEmisionPatterns) {
          const match = line.match(pattern);
          if (match) {
            const dateStr = match[1] || match[0];
            // Si la fecha viene con hora, separarla
            const onlyDate = dateStr.split(' ')[0];
            fecha = this.formatDate(onlyDate);
            confianza += 0.3;
            console.log('Fecha de emisión encontrada:', fecha, 'en línea:', line);
            break;
          }
        }
        if (fecha) break;
      }

      // Si no encontramos emisión, buscar certificación
      if (!fecha) {
        for (const line of lines) {
          for (const pattern of fechaCertificacionPatterns) {
            const match = line.match(pattern);
            if (match) {
              const dateStr = match[1] || match[0];
              const onlyDate = dateStr.split(' ')[0];
              fecha = this.formatDate(onlyDate);
              confianza += 0.25;
              console.log('Fecha de certificación encontrada:', fecha, 'en línea:', line);
              break;
            }
          }
          if (fecha) break;
        }
      }

      // Buscar proveedor
      for (const line of lines) {
        if (proveedorPattern.test(line)) {
          proveedor = line;
          confianza += 0.2;
          console.log('Proveedor encontrado:', proveedor);
          break;
        }
      }

      // Buscar descripción (generalmente líneas con texto descriptivo)
      const allFechaPatterns = [...fechaEmisionPatterns, ...fechaCertificacionPatterns];
      const descripcionLines = lines.filter(line => {
        if (line.length <= 10) return false;
        // Verificar si la línea coincide con algún patrón de fecha
        for (const pattern of allFechaPatterns) {
          if (pattern.test(line)) return false;
        }
        return !totalPattern.test(line) &&
          !proveedorPattern.test(line) &&
          !folioFiscalPattern.test(line);
      });

      if (descripcionLines.length > 0) {
        descripcion = descripcionLines.slice(0, 3).join(' ');
        confianza += 0.1;
        console.log('Descripción encontrada:', descripcion);
      }

      const result = {
        fecha,
        monto,
        proveedor,
        descripcion,
        folioFiscal,
        confianza: Math.min(confianza, 1.0)
      };

      console.log('Resultado final:', result);
      return result;
    } catch (error) {
      console.error('Error extrayendo datos de factura:', error);
      throw new Error('Error al extraer datos de la factura');
    }
  }

  /**
   * Formatea una fecha encontrada en el texto
   */
  private formatDate(dateString: string): string {
    try {
      console.log('Formateando fecha:', dateString);

      // Si ya está en formato YYYY-MM-DD, devolverlo
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }

      // Si tiene hora, separarla
      const dateOnly = dateString.split(' ')[0];

      // Normalizar separadores
      const normalized = dateOnly.replace(/[\/\-\.]/g, '/');
      const parts = normalized.split('/');

      if (parts.length === 3) {
        let day, month, year;

        // Detectar formato YYYY/MM/DD
        if (parts[0].length === 4) {
          [year, month, day] = parts;
        } else {
          // Formato DD/MM/YYYY o DD/MM/YY
          [day, month, year] = parts;
          if (year.length === 2) {
            year = '20' + year;
          }
        }

        const result = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        console.log('Fecha formateada:', result);
        return result;
      }

      console.log('No se pudo formatear la fecha:', dateString);
      return dateString;
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return dateString;
    }
  }

  /**
   * Parsea un monto encontrado en el texto
   */
  private parseAmount(amountString: string): number {
    try {
      // Remover símbolos de moneda y espacios
      const cleaned = amountString.replace(/[€$,\s]/g, '').replace(',', '.');
      return parseFloat(cleaned);
    } catch (error) {
      console.error('Error parseando monto:', error);
      return 0;
    }
  }
}
