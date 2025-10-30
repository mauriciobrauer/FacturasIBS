export const config = {
  dropbox: {
    accessToken: process.env.DROPBOX_ACCESS_TOKEN || '',
    appKey: process.env.DROPBOX_APP_KEY || '',
    appSecret: process.env.DROPBOX_APP_SECRET || '',
    refreshToken: process.env.DROPBOX_REFRESH_TOKEN || '',
  },
  notion: {
    apiKey: process.env.NOTION_API_KEY || '',
    databaseId: process.env.NOTION_DATABASE_ID || '',
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'application/pdf', 
      'image/jpeg', 
      'image/png', 
      'image/jpg',
      'image/jpeg',
      'application/octet-stream', // Fallback para PDFs
      'text/plain' // Algunos PDFs pueden tener este tipo
    ],
  },
  ocr: {
    language: 'spa', // Spanish
    confidence: 0.6,
  },
} as const;

export const validateConfig = () => {
  const missingVars: string[] = [];
  
  if (!config.dropbox.accessToken) {
    missingVars.push('DROPBOX_ACCESS_TOKEN');
  }
  
  if (!config.notion.apiKey) {
    missingVars.push('NOTION_API_KEY');
  }
  
  if (!config.notion.databaseId) {
    missingVars.push('NOTION_DATABASE_ID');
  }
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  return true;
};
