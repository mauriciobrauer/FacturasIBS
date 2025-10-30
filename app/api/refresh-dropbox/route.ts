import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const response = await fetch('https://api.dropbox.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: config.dropbox.refreshToken,
        client_id: config.dropbox.appKey,
        client_secret: config.dropbox.appSecret,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Token refrescado exitosamente',
      access_token: data.access_token,
      expires_in: data.expires_in
    });

  } catch (error) {
    console.error('Error refrescando token:', error);
    return NextResponse.json(
      { 
        error: 'Error refrescando token',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
