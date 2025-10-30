import { InvoiceData } from '@/lib/types';

export class StorageService {
  private static instance: StorageService;
  private invoices: InvoiceData[] = [];

  private constructor() {}

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Agrega una nueva factura al almacenamiento
   */
  async addInvoice(invoice: InvoiceData): Promise<void> {
    this.invoices.push(invoice);
  }

  /**
   * Busca una factura por Folio Fiscal
   */
  async findInvoiceByFolio(folioFiscal: string): Promise<InvoiceData | null> {
    return this.invoices.find(invoice => 
      invoice.folioFiscal && 
      invoice.folioFiscal.toLowerCase() === folioFiscal.toLowerCase()
    ) || null;
  }

  /**
   * Obtiene todas las facturas
   */
  async getAllInvoices(): Promise<InvoiceData[]> {
    return [...this.invoices];
  }

  /**
   * Verifica si existe una factura con el mismo Folio Fiscal
   */
  async isDuplicateFolio(folioFiscal: string): Promise<boolean> {
    if (!folioFiscal) return false;
    
    const existing = await this.findInvoiceByFolio(folioFiscal);
    return existing !== null;
  }

  /**
   * Obtiene estadísticas de facturas
   */
  async getStats(): Promise<{
    total: number;
    totalAmount: number;
    byMonth: { [key: string]: number };
  }> {
    const total = this.invoices.length;
    const totalAmount = this.invoices.reduce((sum, inv) => sum + inv.monto, 0);
    
    const byMonth: { [key: string]: number } = {};
    this.invoices.forEach(invoice => {
      const month = invoice.fecha.substring(0, 7); // YYYY-MM
      byMonth[month] = (byMonth[month] || 0) + 1;
    });

    return { total, totalAmount, byMonth };
  }
}
