import { NextRequest, NextResponse } from 'next/server';
import { NotionService } from '@/lib/services/notion';
import { validateConfig } from '@/lib/config';

export async function POST(req: NextRequest) {
  try {
    validateConfig();
    const { folder } = await req.json().catch(() => ({ folder: '/Aplicaciones/FacturasIBS' }));
    const notion = NotionService.getInstance();
    const result = await notion.fixDropboxLinks(folder || '/Aplicaciones/FacturasIBS');
    return NextResponse.json({ success: true, data: result });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: 'No se pudieron corregir los links', details: e?.message },
      { status: 500 }
    );
  }
}


