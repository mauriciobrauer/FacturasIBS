#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Configurando Sincronización de Facturas Médicas...\n');

// Crear archivo .env.local si no existe
const envPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), 'env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Archivo .env.local creado desde env.example');
  } else {
    const envContent = `# Dropbox Configuration
DROPBOX_ACCESS_TOKEN=your_dropbox_access_token_here

# Notion Configuration
NOTION_API_KEY=your_notion_api_key_here
NOTION_DATABASE_ID=your_notion_database_id_here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
`;
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Archivo .env.local creado');
  }
} else {
  console.log('ℹ️  Archivo .env.local ya existe');
}

// Crear directorios necesarios
const directories = [
  'public',
  'public/uploads',
  'logs',
];

directories.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Directorio ${dir} creado`);
  }
});

console.log('\n📋 Próximos pasos:');
console.log('1. Configura las variables de entorno en .env.local');
console.log('2. Configura tu aplicación de Dropbox');
console.log('3. Configura tu base de datos de Notion');
console.log('4. Ejecuta: npm run dev');
console.log('\n🎉 ¡Configuración completada!');
