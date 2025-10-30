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

    // 1. Eliminar carpeta /FacturasIBS (la de la raíz)
    try {
      await dropbox.filesDeleteV2({
        path: '/FacturasIBS'
      });
      steps.push('✅ Carpeta /FacturasIBS eliminada');
    } catch (error: any) {
      if (error.status === 409) {
        steps.push('ℹ️ Carpeta /FacturasIBS no existe o no se puede eliminar');
      } else {
        steps.push(`⚠️ Error eliminando /FacturasIBS: ${error.message}`);
      }
    }

    // 2. Verificar si existe /Aplicaciones/FacturasIBS
    try {
      const checkResponse = await dropbox.filesListFolder({
        path: '/Aplicaciones/FacturasIBS',
        recursive: false,
      });
      steps.push('✅ Carpeta /Aplicaciones/FacturasIBS ya existe');
    } catch (error: any) {
      if (error.status === 404) {
        // 3. Crear /Aplicaciones si no existe
        try {
          await dropbox.filesCreateFolderV2({
            path: '/Aplicaciones',
            autorename: false
          });
          steps.push('✅ Carpeta /Aplicaciones creada');
        } catch (error: any) {
          if (error.status === 409) {
            steps.push('ℹ️ Carpeta /Aplicaciones ya existe');
          } else {
            throw error;
          }
        }

        // 4. Crear /Aplicaciones/FacturasIBS
        try {
          await dropbox.filesCreateFolderV2({
            path: '/Aplicaciones/FacturasIBS',
            autorename: false
          });
          steps.push('✅ Carpeta /Aplicaciones/FacturasIBS creada');
        } catch (error: any) {
          throw error;
        }
      } else {
        throw error;
      }
    }

    // 5. Verificar estructura final
    try {
      const finalCheck = await dropbox.filesListFolder({
        path: '/Aplicaciones/FacturasIBS',
        recursive: false,
      });
      
      const files = finalCheck.result.entries.filter((entry: any) => entry['.tag'] === 'file');
      steps.push(`✅ Estructura final: /Aplicaciones/FacturasIBS con ${files.length} archivos`);
    } catch (error: any) {
      steps.push(`⚠️ Error verificando estructura final: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Limpieza y estructura corregida',
      steps: steps
    });

  } catch (error) {
    console.error('Error en limpieza:', error);
    return NextResponse.json(
      { 
        error: 'Error en limpieza',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
