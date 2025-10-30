# Configuración de Dropbox

Esta guía te ayudará a configurar Dropbox para almacenar los archivos de facturas.

## Paso 1: Crear una Aplicación de Dropbox

1. Ve a [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Haz clic en "Create app"
3. Selecciona "Scoped access"
4. Elige "Full Dropbox" o "App folder" (recomendado)
5. Completa los siguientes campos:
   - **App name**: `Sincronización de Facturas Médicas`
   - **App description**: `Aplicación para gestionar facturas médicas`
6. Haz clic en "Create app"

## Paso 2: Configurar Permisos

En la pestaña "Permissions", habilita los siguientes permisos:

- `files.metadata.write` - Escribir metadatos de archivos
- `files.content.write` - Escribir contenido de archivos
- `sharing.write` - Crear enlaces compartidos

## Paso 3: Generar Token de Acceso

1. Ve a la pestaña "Settings"
2. En la sección "OAuth 2", haz clic en "Generate access token"
3. Copia el token generado (lo necesitarás para la variable `DROPBOX_ACCESS_TOKEN`)

## Paso 4: Configurar Variables de Entorno

Agrega la siguiente variable a tu archivo `.env.local`:

```env
DROPBOX_ACCESS_TOKEN=sl.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Verificación

Para verificar que la configuración es correcta:

1. Ejecuta la aplicación: `npm run dev`
2. Ve a `http://localhost:3000/api/health`
3. Verifica que el servicio de Dropbox esté marcado como "healthy"

## Solución de Problemas

### Error: "Invalid access token"
- Verifica que el token sea correcto
- Asegúrate de que el token no haya expirado

### Error: "Insufficient permissions"
- Verifica que todos los permisos necesarios estén habilitados
- Regenera el token si es necesario
