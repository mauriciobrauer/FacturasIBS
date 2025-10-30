# Configuración de la Base de Datos de Notion

Esta guía te ayudará a configurar la base de datos de Notion para la aplicación de facturas médicas.

## Paso 1: Crear una Integración de Notion

1. Ve a [Notion Developers](https://www.notion.so/my-integrations)
2. Haz clic en "New integration"
3. Completa los siguientes campos:
   - **Name**: `Sincronización de Facturas Médicas`
   - **Logo**: (opcional) Sube un logo para tu integración
   - **Associated workspace**: Selecciona tu workspace
4. Haz clic en "Submit"
5. Copia el **Internal Integration Token** (lo necesitarás para la variable `NOTION_API_KEY`)

## Paso 2: Crear la Base de Datos

1. En Notion, crea una nueva página
2. Agrega una base de datos con la siguiente estructura:

### Propiedades de la Base de Datos

| Nombre | Tipo | Descripción |
|--------|------|-------------|
| **Fecha** | Date | Fecha de la factura |
| **Monto** | Number | Cantidad monetaria |
| **Proveedor** | Title | Nombre del proveedor médico |
| **Descripción** | Rich Text | Descripción de los servicios |
| **Archivo** | URL | Enlace al archivo en Dropbox |
| **Estado** | Select | Estado del procesamiento |

### Configuración de la Propiedad "Estado"

La propiedad **Estado** debe tener las siguientes opciones:

- `procesando` (Color: Amarillo)
- `completado` (Color: Verde)
- `error` (Color: Rojo)

## Paso 3: Compartir la Base de Datos

1. En la página de tu base de datos, haz clic en "Share" en la esquina superior derecha
2. Haz clic en "Invite"
3. Busca tu integración por nombre: `Sincronización de Facturas Médicas`
4. Selecciona la integración y dale permisos de "Can edit"
5. Haz clic en "Invite"

## Paso 4: Obtener el ID de la Base de Datos

1. Abre tu base de datos en Notion
2. Copia la URL de la página
3. El ID de la base de datos es la parte larga de la URL que se ve así:
   ```
   https://www.notion.so/your-workspace/DATABASE_ID?v=VIEW_ID
   ```
4. Copia solo el `DATABASE_ID` (sin los guiones)

## Paso 5: Configurar las Variables de Entorno

Agrega las siguientes variables a tu archivo `.env.local`:

```env
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Verificación

Para verificar que la configuración es correcta:

1. Ejecuta la aplicación: `npm run dev`
2. Ve a `http://localhost:3000/api/health`
3. Verifica que el servicio de Notion esté marcado como "healthy"

## Solución de Problemas

### Error: "Unauthorized"
- Verifica que el token de API sea correcto
- Asegúrate de que la integración tenga permisos en la base de datos

### Error: "Database not found"
- Verifica que el ID de la base de datos sea correcto
- Asegúrate de que la base de datos esté compartida con tu integración

### Error: "Invalid property"
- Verifica que todas las propiedades estén creadas con los nombres exactos
- Asegúrate de que los tipos de propiedades sean correctos

## Estructura de Datos Esperada

La aplicación espera que la base de datos tenga exactamente esta estructura:

```json
{
  "properties": {
    "Fecha": {
      "type": "date"
    },
    "Monto": {
      "type": "number"
    },
    "Proveedor": {
      "type": "title"
    },
    "Descripcion": {
      "type": "rich_text"
    },
    "Archivo": {
      "type": "url"
    },
    "Estado": {
      "type": "select",
      "select": {
        "options": [
          { "name": "procesando", "color": "yellow" },
          { "name": "completado", "color": "green" },
          { "name": "error", "color": "red" }
        ]
      }
    }
  }
}
```
