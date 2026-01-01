import { Client } from '@notionhq/client';
import { config } from '@/lib/config';
import { InvoiceData, NotionPage } from '@/lib/types';

export class NotionService {
  private static instance: NotionService;
  private notion: Client;

  private constructor() {
    this.notion = new Client({
      auth: config.notion.apiKey,
    });
  }

  public static getInstance(): NotionService {
    if (!NotionService.instance) {
      NotionService.instance = new NotionService();
    }
    return NotionService.instance;
  }

  /**
   * Crea un nuevo registro de factura en Notion
   */
  async createInvoice(invoiceData: InvoiceData): Promise<NotionPage> {
    try {
      // Obtener esquema actual de la base para mapear nombres
      const db = await this.notion.databases.retrieve({ database_id: config.notion.databaseId });
      const props = db.properties as Record<string, any>;

      // Helpers para localizar propiedades por nombre aproximado
      const findProp = (candidates: string[], type?: string) => {
        const keys = Object.keys(props);
        for (const c of candidates) {
          const k = keys.find((k) => k.toLowerCase() === c.toLowerCase());
          if (k && (!type || props[k].type === type)) return k;
        }
        // Fallback: por tipo
        if (type) {
          const byType = keys.find((k) => props[k].type === type);
          if (byType) return byType;
        }
        return undefined;
      };

      const titleKey = findProp(['Folio', 'Proveedor', 'Título', 'Title'], 'title');
      const dateKey = findProp(['Fecha', 'Emisión', 'Fecha de emisión'], 'date');
      const numberKey = findProp(['Importe ($ MXN)', 'Importe', 'Monto', 'Total'], 'number');
      const urlKey = findProp(['Link', 'Archivo', 'URL'], 'url');

      const properties: any = {};
      if (dateKey) properties[dateKey] = { date: { start: invoiceData.fecha } };
      if (numberKey) properties[numberKey] = { number: invoiceData.monto };
      if (titleKey) properties[titleKey] = { title: [{ text: { content: invoiceData.folioFiscal || invoiceData.proveedor || 'Factura' } }] };
      if (urlKey) properties[urlKey] = { url: invoiceData.archivoUrl };

      const response = await this.notion.pages.create({
        parent: { database_id: config.notion.databaseId },
        properties,
      });

      if (response) {
        return {
          id: response.id,
          properties: {
            Fecha: { date: { start: invoiceData.fecha } },
            Monto: { number: invoiceData.monto },
            Proveedor: { title: [{ text: { content: invoiceData.proveedor } }] },
            Descripcion: { rich_text: [{ text: { content: invoiceData.descripcion || '' } }] },
            Archivo: { url: invoiceData.archivoUrl },
            Estado: { select: { name: invoiceData.estado } },
          },
        };
      }

      throw new Error('Error al crear registro en Notion');
    } catch (error) {
      console.error('Error creando factura en Notion:', error);
      throw new Error('Error al crear registro en Notion');
    }
  }

  /**
   * Obtiene todas las facturas de la base de datos
   */
  async getInvoices(): Promise<InvoiceData[]> {
    try {
      // Detectar esquema
      const db = await this.notion.databases.retrieve({ database_id: config.notion.databaseId });
      const props = db.properties as Record<string, any>;
      const findProp = (candidates: string[], type?: string) => {
        const keys = Object.keys(props);
        for (const c of candidates) {
          const k = keys.find((k) => k.toLowerCase() === c.toLowerCase());
          if (k && (!type || props[k].type === type)) return k;
        }
        if (type) {
          const byType = keys.find((k) => props[k].type === type);
          if (byType) return byType;
        }
        return undefined;
      };
      const titleKey = findProp(['Folio', 'Proveedor', 'Título', 'Title'], 'title') || 'title';
      const dateKey = findProp(['Fecha', 'Emisión', 'Fecha de emisión'], 'date');
      const numberKey = findProp(['Importe ($ MXN)', 'Importe', 'Monto', 'Total'], 'number');
      const urlKey = findProp(['Link', 'Archivo', 'URL'], 'url');
      const statusKey = findProp(['Estado', 'Status'], 'select');

      const allResults: any[] = [];
      let hasMore = true;
      let startCursor: string | undefined = undefined;

      while (hasMore) {
        const response: any = await this.notion.databases.query({
          database_id: config.notion.databaseId,
          start_cursor: startCursor,
          page_size: 100, // Máximo permitido por Notion
          sorts: dateKey
            ? [
              {
                property: dateKey,
                direction: 'descending',
              } as any,
            ]
            : undefined,
        });

        if (response.results) {
          allResults.push(...response.results);
        }

        hasMore = response.has_more;
        startCursor = response.next_cursor;
      }

      return allResults.map((page: any) => {
        const p = page.properties || {};
        const folio = p?.[titleKey]?.title?.[0]?.plain_text || p?.[titleKey]?.title?.[0]?.text?.content || '';
        return {
          id: page.id,
          fecha: dateKey ? p?.[dateKey]?.date?.start || '' : '',
          monto: numberKey ? p?.[numberKey]?.number || 0 : 0,
          proveedor: folio || '',
          descripcion: '',
          archivoUrl: urlKey ? p?.[urlKey]?.url || '' : '',
          estado: statusKey ? p?.[statusKey]?.select?.name || 'completado' : 'completado',
          fechaCreacion: page.created_time,
          fechaActualizacion: page.last_edited_time,
          folioFiscal: folio || undefined,
        };
      });
    } catch (error) {
      console.error('Error obteniendo facturas de Notion:', error);
      return [];
    }
  }

  /**
   * Actualiza el estado de una factura
   */
  async updateInvoiceStatus(invoiceId: string, status: string): Promise<boolean> {
    try {
      const response = await this.notion.pages.update({
        page_id: invoiceId,
        properties: {
          Estado: {
            select: {
              name: status,
            },
          },
        },
      });

      return !!response;
    } catch (error) {
      console.error('Error actualizando estado de factura:', error);
      return false;
    }
  }

  /**
   * Actualiza la URL de una factura
   */
  async updateInvoiceUrl(invoiceId: string, newUrl: string): Promise<boolean> {
    try {
      // Detectar nombre de propiedad URL dinámicamente
      const db = await this.notion.databases.retrieve({ database_id: config.notion.databaseId });
      const props = db.properties as Record<string, any>;
      const keys = Object.keys(props);
      const urlKey = keys.find((k) => k.toLowerCase() === 'archivo' || k.toLowerCase() === 'link' || k.toLowerCase() === 'url') || 'Archivo';

      const response = await this.notion.pages.update({
        page_id: invoiceId,
        properties: {
          [urlKey]: {
            url: newUrl,
          },
        },
      });

      return !!response;
    } catch (error) {
      console.error('Error actualizando URL de factura:', error);
      return false;
    }
  }

  /**
   * Actualiza el Monto de una factura y opcionalmente otros campos
   */
  async updateInvoiceData(invoiceId: string, data: { monto?: number, fecha?: string, proveedor?: string }): Promise<boolean> {
    try {
      // Detectar nombres de propiedades
      const db = await this.notion.databases.retrieve({ database_id: config.notion.databaseId });
      const props = db.properties as Record<string, any>;
      const findProp = (candidates: string[], type: string) => {
        const keys = Object.keys(props);
        for (const c of candidates) {
          const k = keys.find((k) => k.toLowerCase() === c.toLowerCase());
          if (k && props[k].type === type) return k;
        }
        return keys.find((k) => props[k].type === type);
      };

      const numberKey = findProp(['Importe ($ MXN)', 'Importe', 'Monto', 'Total'], 'number');
      const dateKey = findProp(['Fecha', 'Emisión', 'Fecha de emisión'], 'date');
      const titleKey = findProp(['Folio', 'Proveedor', 'Título', 'Title'], 'title');

      const properties: any = {};
      if (numberKey && data.monto !== undefined) properties[numberKey] = { number: data.monto };
      if (dateKey && data.fecha) properties[dateKey] = { date: { start: data.fecha } };
      // No actualizamos título (proveedor) por seguridad, a menos que sea necesario

      if (Object.keys(properties).length === 0) return false;

      const response = await this.notion.pages.update({
        page_id: invoiceId,
        properties,
      });

      return !!response;
    } catch (error) {
      console.error('Error actualizando datos de factura:', error);
      return false;
    }
  }

  /**
   * Obtiene estadísticas de facturas
   */
  async getInvoiceStats(): Promise<{
    total: number;
    totalAmount: number;
    pending: number;
  }> {
    try {
      const invoices = await this.getInvoices();

      const total = invoices.length;
      const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.monto, 0);
      const pending = invoices.filter(invoice => invoice.estado === 'procesando').length;

      return {
        total,
        totalAmount,
        pending,
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        total: 0,
        totalAmount: 0,
        pending: 0,
      };
    }
  }

  /**
   * Verifica si la base de datos existe y tiene la estructura correcta
   */
  async validateDatabase(): Promise<boolean> {
    try {
      const response = await this.notion.databases.retrieve({
        database_id: config.notion.databaseId,
      });

      if (response.properties) {
        const requiredProperties = ['Fecha', 'Monto', 'Proveedor', 'Descripcion', 'Archivo', 'Estado'];
        const existingProperties = Object.keys(response.properties);

        return requiredProperties.every(prop => existingProperties.includes(prop));
      }

      return false;
    } catch (error) {
      console.error('Error validando base de datos:', error);
      return false;
    }
  }

  /**
   * Corrige los links de Dropbox en todas las páginas usando el folio (title)
   */
  async fixDropboxLinks(folderLabel: string = '/Aplicaciones/FacturasIBS'): Promise<{ checked: number; updated: number }> {
    // Detectar esquema
    const db = await this.notion.databases.retrieve({ database_id: config.notion.databaseId });
    const props = db.properties as Record<string, any>;
    const findProp = (candidates: string[], type?: string) => {
      const keys = Object.keys(props);
      for (const c of candidates) {
        const k = keys.find((k) => k.toLowerCase() === c.toLowerCase());
        if (k && (!type || props[k].type === type)) return k;
      }
      if (type) {
        const byType = keys.find((k) => props[k].type === type);
        if (byType) return byType;
      }
      return undefined;
    };

    const titleKey = findProp(['Folio', 'Proveedor', 'Título', 'Title'], 'title');
    const urlKey = findProp(['Link', 'Archivo', 'URL'], 'url');
    if (!titleKey || !urlKey) return { checked: 0, updated: 0 };

    let startCursor: string | undefined = undefined;
    let checked = 0;
    let updated = 0;
    do {
      const res: any = await this.notion.databases.query({
        database_id: config.notion.databaseId,
        start_cursor: startCursor,
        page_size: 100,
      });
      for (const page of res.results || []) {
        checked++;
        const folio = page.properties?.[titleKey]?.title?.[0]?.plain_text || page.properties?.[titleKey]?.title?.[0]?.text?.content || '';
        if (!folio) continue;
        const desired = `https://www.dropbox.com/home${folderLabel}?preview=${encodeURIComponent(folio)}.pdf`;
        const current = page.properties?.[urlKey]?.url || '';
        if (current !== desired) {
          await this.notion.pages.update({
            page_id: page.id,
            properties: { [urlKey]: { url: desired } },
          });
          updated++;
        }
      }
      startCursor = res.has_more ? res.next_cursor : undefined;
    } while (startCursor);

    return { checked, updated };
  }
}
