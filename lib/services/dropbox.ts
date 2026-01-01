import { Dropbox } from 'dropbox';
import { config } from '@/lib/config';
import { DropboxFile } from '@/lib/types';

export class DropboxService {
  private static instance: DropboxService;
  private dropbox: Dropbox;
  private isRefreshing = false;

  private constructor() {
    this.dropbox = new Dropbox({
      accessToken: config.dropbox.accessToken,
      fetch: fetch,
    });
  }

  public static getInstance(): DropboxService {
    if (!DropboxService.instance) {
      DropboxService.instance = new DropboxService();
    }
    return DropboxService.instance;
  }

  /**
   * Sube un archivo a Dropbox
   */
  async uploadFile(file: File, folderPath: string = '', desiredBaseName?: string): Promise<DropboxFile> {
    const exec = async () => {
      const arrayBuffer = await file.arrayBuffer();
      // Determinar extensión
      const originalName = file.name || 'archivo';
      const extMatch = originalName.match(/\.[A-Za-z0-9]+$/);
      const ext = extMatch ? extMatch[0] : (file.type === 'application/pdf' ? '.pdf' : '');
      const safeBase = (desiredBaseName || `${Date.now()}-${originalName}`).replace(/[^A-Za-z0-9._-]/g, '_');
      const fileName = safeBase.endsWith(ext) ? safeBase : `${safeBase}${ext}`;
      const filePath = folderPath ? `${folderPath}/${fileName}` : `/${fileName}`;

      const response = await this.dropbox.filesUpload({
        path: filePath,
        contents: arrayBuffer,
        mode: { '.tag': 'add' },
        autorename: true,
      });

      if (response.status === 200 && response.result) {
        return {
          id: response.result.id,
          name: response.result.name,
          path_display: response.result.path_display || filePath,
          size: response.result.size,
          client_modified: response.result.client_modified,
          server_modified: response.result.server_modified,
          content_hash: response.result.content_hash || '',
        } as DropboxFile;
      }
      throw new Error('Error al subir archivo a Dropbox');
    };

    return await this.withRefresh(exec);
  }

  /**
   * Genera un enlace compartido persistente para el archivo.
   * Si ya existe, lo recupera.
   */
  async createSharedLink(path: string): Promise<string> {
    const exec = async () => {
      try {
        // Intentar crear un nuevo enlace compartido
        const response = await this.dropbox.sharingCreateSharedLinkWithSettings({ path });
        return response.result.url;
      } catch (error: any) {
        // Si ya existe, recuperar el existente
        if (error?.error?.['.tag'] === 'shared_link_already_exists' ||
          JSON.stringify(error).includes('shared_link_already_exists')) {
          const listResponse = await this.dropbox.sharingListSharedLinks({
            path,
            direct_only: true
          });
          if (listResponse.result.links.length > 0) {
            return listResponse.result.links[0].url;
          }
        }
        throw error;
      }
    };

    try {
      let url = await this.withRefresh(exec);
      // Convertir ?dl=0 a ?raw=1 o mantenerlo para vista previa
      // El usuario quiere vista previa, así que el default de Dropbox (?dl=0) suele abrir la vista web, que es lo deseado.
      return url;
    } catch (e) {
      console.error('Error creating shared link:', e);
      // Fallback: Construir link manual basado en path_display real del archivo
      // path es ej: "/Aplicaciones/FacturasIBS/archivo.pdf"
      // Queremos: https://www.dropbox.com/home/Aplicaciones/FacturasIBS?preview=archivo.pdf

      try {
        const pathParts = path.split('/');
        const fileName = pathParts.pop() || '';
        const folderPath = pathParts.join('/'); // ej: "/Aplicaciones/FacturasIBS"

        return `https://www.dropbox.com/home${folderPath}?preview=${encodeURIComponent(fileName)}`;
      } catch (err) {
        console.error('Error constructing fallback link:', err);
        return 'https://www.dropbox.com/home';
      }
    }
  }

  /**
   * Obtiene un enlace público para un archivo (Deprecated, use createSharedLink)
   */
  async getPublicLink(filePath: string): Promise<string> {
    return this.createSharedLink(filePath);
  }

  /**
   * Convierte una URL de compartir de Dropbox a una URL directa de descarga
   */
  private convertToDirectUrl(shareUrl: string): string {
    // Extraer el nombre del archivo de la URL de compartir si es posible
    const urlParts = shareUrl.split('/');
    const fileName = urlParts[urlParts.length - 1] || 'archivo';

    // Generar URL con preview del archivo específico
    const dropboxWebUrl = `https://www.dropbox.com/home?preview=${encodeURIComponent(fileName)}`;

    console.log('URL de Dropbox web:', dropboxWebUrl);
    return dropboxWebUrl;
  }

  /**
   * Lista archivos en una carpeta
   */
  async listFiles(folderPath: string = ''): Promise<DropboxFile[]> {
    const exec = async () => {
      let response = await this.dropbox.filesListFolder({
        path: folderPath,
        recursive: false,
      });

      let allEntries = response.result.entries;

      while (response.result.has_more) {
        response = await this.dropbox.filesListFolderContinue({
          cursor: response.result.cursor
        });
        allEntries = allEntries.concat(response.result.entries);
      }

      return allEntries
        .filter((entry: any) => entry['.tag'] === 'file')
        .map((file: any) => ({
          id: file.id,
          name: file.name,
          path_display: file.path_display,
          size: file.size,
          client_modified: file.client_modified,
          server_modified: file.server_modified,
          content_hash: file.content_hash || '',
        }));
    };

    try {
      return await this.withRefresh(exec);
    } catch (e) {
      console.error('Error listando archivos:', e);
      return [];
    }
  }

  async downloadFile(path: string): Promise<Buffer> {
    const execDownload = async () => {
      const res = await this.dropbox.filesDownload({ path });
      const r: any = res.result as any;
      if (r.fileBinary) {
        const bin: any = r.fileBinary;
        return Buffer.isBuffer(bin) ? bin : Buffer.from(bin);
      }
      if (r.fileBlob) {
        const arrayBuffer = await r.fileBlob.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
      throw new Error('No file content returned by Dropbox');
    };

    try {
      return await this.withRefresh(execDownload);
    } catch (err) {
      console.warn('[DropboxService.downloadFile] filesDownload failed, trying filesGetTemporaryLink. err=', (err as any)?.toString?.());
      // Fallback: get temporary link and fetch content
      try {
        // @ts-ignore - SDK types
        const tmp = await this.withRefresh(async () => (this.dropbox as any).filesGetTemporaryLink({ path }));
        const url = tmp.result.link as string;
        console.log('[DropboxService.downloadFile] temporaryLink=', url);
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('Temporary link fetch failed ' + resp.status);
        const arrayBuffer = await resp.arrayBuffer();
        return Buffer.from(arrayBuffer);
      } catch (e) {
        console.error('[DropboxService.downloadFile] Fallback failed for path=', path, e);
        throw e;
      }
    }
  }

  async uploadContent(path: string, content: Buffer, mode: 'add' | 'overwrite' = 'overwrite') {
    const exec = async () => {
      await this.dropbox.filesUpload({
        path,
        contents: content,
        mode: mode === 'overwrite' ? { '.tag': 'overwrite' } as any : 'add',
        autorename: false,
      });
    };
    await this.withRefresh(exec);
  }

  async createFolder(path: string): Promise<boolean> {
    try {
      const exec = async () => (this.dropbox as any).filesCreateFolderV2({ path, autorename: false });
      const res = await this.withRefresh(exec);
      return (res as any).status === 200;
    } catch (e) {
      console.error('[DropboxService.createFolder] error', e);
      return false;
    }
  }

  /**
   * Elimina un archivo de Dropbox
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const exec = async () => this.dropbox.filesDeleteV2({ path: filePath });
      const response = await this.withRefresh(exec);
      return (response as any).status === 200;
    } catch (error) {
      console.error('Error eliminando archivo:', error);
      return false;
    }
  }

  private async withRefresh<T>(fn: () => Promise<T>, hasRetried = false): Promise<T> {
    try {
      return await fn();
    } catch (e: any) {
      const is401 = e?.status === 401 || e?.error?.error?.['.tag'] === 'expired_access_token' || (e?.error?.error_summary || '').includes('expired_access_token');
      if (is401 && !hasRetried) {
        await this.refreshAccessToken();
        return this.withRefresh(fn, true);
      }
      throw e;
    }
  }

  private async refreshAccessToken(): Promise<void> {
    if (this.isRefreshing) return;
    this.isRefreshing = true;
    try {
      const basic = Buffer.from(`${config.dropbox.appKey}:${config.dropbox.appSecret}`).toString('base64');
      const resp = await fetch('https://api.dropbox.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${basic}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: config.dropbox.refreshToken,
        }) as any,
      });
      if (!resp.ok) {
        throw new Error(`Refresh token failed: HTTP ${resp.status}`);
      }
      const json = await resp.json();
      const newAccessToken = json.access_token as string;
      if (!newAccessToken) throw new Error('No access_token in refresh response');
      // @ts-ignore dropbox sdk auth accessor
      (this.dropbox as any).auth.setAccessToken(newAccessToken);
      console.log('[DropboxService] Access token refreshed');
    } finally {
      this.isRefreshing = false;
    }
  }
}
