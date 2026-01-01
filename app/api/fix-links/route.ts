
import { NextResponse } from 'next/server';
import { NotionService } from '@/lib/services/notion';

export async function GET() {
    try {
        const notion = NotionService.getInstance();

        // Ejecutar la corrección de links usando la carpeta correcta
        const result = await notion.fixDropboxLinks('/Aplicaciones/FacturasIBS');

        return NextResponse.json({
            success: true,
            message: `Proceso finalizado.`,
            stats: result
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
