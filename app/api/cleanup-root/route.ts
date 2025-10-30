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

    // Eliminar carpeta /FacturasIBS de la raíz
    try {
      await dropbox.filesDeleteV2({
        path: '/FacturasIBS'
      });
      steps.push('✅ Carpeta /FacturasIBS de la raíz eliminada');
    } catch (error: any) {
      if (error.status === 409) {
        steps.push('ℹ️ Carpeta /FacturasIBS de la raíz no existe o no se puede eliminar');
      } else {
        steps.push(`⚠️ Error eliminando /FacturasIBS: ${error.message}`);
      }
    }

    // Verificar estructura final
    try {
      const finalCheck = await dropbox.filesListFolder({
        path: '/Aplicaciones/FacturasIBS',
        recursive: false,
      });
      
      const files = finalCheck.result.entries.filter((entry: any) => entry['.tag'] === 'file');
      steps.push(`✅ Estructura final correcta: /Aplicaciones/FacturasIBS con ${files.length} archivos`);
    } catch (error: any) {
      steps.push(`⚠️ Error verificando estructura final: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Limpieza completada',
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
