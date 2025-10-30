import { NextRequest, NextResponse } from 'next/server';
import { Dropbox } from 'dropbox';
import { config } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const dropbox = new Dropbox({
      accessToken: config.dropbox.accessToken,
      fetch: fetch,
    });

    // Probar obtener información de la cuenta
    const response = await dropbox.usersGetCurrentAccount();
    
    return NextResponse.json({
      success: true,
      message: 'Autenticación exitosa',
      account: {
        account_id: response.result.account_id,
        name: response.result.name.display_name,
        email: response.result.email
      }
    });

  } catch (error) {
    console.error('Error de autenticación:', error);
    return NextResponse.json(
      { 
        error: 'Error de autenticación',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
