import { NextRequest, NextResponse } from 'next/server';
import { Dropbox } from 'dropbox';
import { config } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const dropbox = new Dropbox({
      accessToken: config.dropbox.accessToken,
      fetch: fetch,
    });

    const steps = [];

    // Verificar si la carpeta /FacturasIBS de la raíz está vacía
    try {
      const checkResponse = await dropbox.filesListFolder({
        path: '/FacturasIBS',
        recursive: false,
      });

      const files = checkResponse.result.entries.filter((entry: any) => entry['.tag'] === 'file');
      const folders = checkResponse.result.entries.filter((entry: any) => entry['.tag'] === 'folder');

      if (files.length === 0 && folders.length === 0) {
        // Eliminar carpeta vacía
        await dropbox.filesDeleteV2({
          path: '/FacturasIBS'
        });
        steps.push('✅ Carpeta vacía /FacturasIBS eliminada');
      } else {
        steps.push(`⚠️ Carpeta /FacturasIBS no está vacía: ${files.length} archivos, ${folders.length} carpetas`);
      }
    } catch (error: any) {
      if (error.status === 404) {
        steps.push('ℹ️ Carpeta /FacturasIBS no existe');
      } else {
        steps.push(`⚠️ Error verificando /FacturasIBS: ${error.message}`);
      }
    }

    // Verificar estructura final
    try {
      const finalCheck = await dropbox.filesListFolder({
        path: '',
        recursive: false,
      });

      const rootFolders = finalCheck.result.entries
        .filter((entry: any) => entry['.tag'] === 'folder')
        .map((folder: any) => folder.name);

      steps.push(`✅ Carpetas en la raíz: ${rootFolders.join(', ')}`);
    } catch (error: any) {
      steps.push(`⚠️ Error verificando raíz: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Limpieza de carpeta antigua',
      steps: steps
    });

  } catch (error) {
    console.error('Error limpiando carpeta antigua:', error);
    return NextResponse.json(
      { 
        error: 'Error limpiando carpeta antigua',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
