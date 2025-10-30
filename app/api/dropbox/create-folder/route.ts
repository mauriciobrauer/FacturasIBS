import { NextRequest, NextResponse } from 'next/server';
import { DropboxService } from '@/lib/services/dropbox';
import { validateConfig } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    validateConfig();
    const { path } = await request.json();
    if (!path || typeof path !== 'string') {
      return NextResponse.json({ success: false, error: 'path requerido' }, { status: 400 });
    }
    const svc = DropboxService.getInstance();
    const ok = await svc.createFolder(path);
    return NextResponse.json({ success: ok });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}


