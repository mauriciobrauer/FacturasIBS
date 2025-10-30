# Sincronización de Facturas Médicas

Una aplicación web para automatizar el registro de facturas médicas usando Next.js, Dropbox y Notion.

## Características

- 📄 **Subida de archivos**: Soporte para PDF, PNG y JPG
- 🔍 **OCR inteligente**: Extracción automática de datos de facturas
- ☁️ **Almacenamiento en Dropbox**: Archivos seguros en la nube
- 📊 **Base de datos Notion**: Registro estructurado de facturas
- 🎨 **Interfaz moderna**: Diseño responsive con Tailwind CSS
- 🔒 **Seguridad**: Variables de entorno para API keys

## Stack Tecnológico

- **Frontend/Backend**: Next.js 14 con TypeScript
- **Estilos**: Tailwind CSS
- **Almacenamiento**: Dropbox API
- **Base de datos**: Notion API
- **OCR**: Tesseract.js
- **Procesamiento PDF**: pdf-parse

## Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd SubirFacturasMedicas
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp env.example .env.local
   ```

4. **Configurar las variables de entorno en `.env.local`**:
   ```env
   # Dropbox Configuration
   DROPBOX_ACCESS_TOKEN=tu_token_de_dropbox_aqui

   # Notion Configuration
   NOTION_API_KEY=tu_api_key_de_notion_aqui
   NOTION_DATABASE_ID=tu_database_id_de_notion_aqui

   # Application Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

## Configuración de Dropbox

1. Ve a [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Crea una nueva aplicación
3. Selecciona "Scoped access"
4. Configura los permisos necesarios:
   - `files.metadata.write`
   - `files.content.write`
   - `sharing.write`
5. Genera un token de acceso
6. Agrega el token a tu archivo `.env.local`

## Configuración de Notion

1. Ve a [Notion Developers](https://www.notion.so/my-integrations)
2. Crea una nueva integración
3. Copia el "Internal Integration Token"
4. Crea una base de datos en Notion con las siguientes propiedades:
   - **Fecha** (Date)
   - **Monto** (Number)
   - **Proveedor** (Title)
   - **Descripción** (Rich Text)
   - **Archivo** (URL)
   - **Estado** (Select) con opciones: "procesando", "completado", "error"
5. Comparte la base de datos con tu integración
6. Copia el ID de la base de datos (de la URL)
7. Agrega el token y el ID a tu archivo `.env.local`

## Uso

1. **Iniciar el servidor de desarrollo**
   ```bash
   npm run dev
   ```

2. **Abrir la aplicación**
   Navega a [http://localhost:3000](http://localhost:3000)

3. **Subir una factura**
   - Haz clic en "Subir Nueva Factura"
   - Arrastra y suelta un archivo PDF o imagen
   - La aplicación extraerá automáticamente los datos
   - El archivo se guardará en Dropbox
   - Los datos se registrarán en Notion

## Estructura del Proyecto

```
├── app/                    # App Router de Next.js
│   ├── api/               # Rutas API
│   │   ├── upload/        # Subida de archivos
│   │   ├── invoices/      # Gestión de facturas
│   │   ├── stats/         # Estadísticas
│   │   └── health/        # Health check
│   ├── globals.css        # Estilos globales
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página principal
├── components/            # Componentes React
│   ├── ui/               # Componentes base
│   ├── layout/           # Componentes de layout
│   ├── upload/           # Componentes de subida
│   └── dashboard/        # Componentes del dashboard
├── lib/                  # Utilidades y servicios
│   ├── services/         # Servicios (OCR, Dropbox, Notion)
│   ├── types.ts          # Tipos TypeScript
│   └── config.ts         # Configuración
└── public/               # Archivos estáticos
```

## API Endpoints

- `POST /api/upload` - Subir y procesar factura
- `GET /api/invoices` - Obtener todas las facturas
- `POST /api/invoices` - Crear nueva factura
- `GET /api/stats` - Obtener estadísticas
- `GET /api/health` - Health check del sistema

## Desarrollo

### Scripts disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run start    # Servidor de producción
npm run lint     # Linter
```

### Estructura de datos

La aplicación extrae automáticamente:
- **Fecha**: Fecha de la factura
- **Monto**: Cantidad monetaria
- **Proveedor**: Nombre del proveedor médico
- **Descripción**: Descripción de los servicios

## Solución de Problemas

### Error de configuración
Si ves errores relacionados con variables de entorno, verifica que:
- El archivo `.env.local` existe
- Todas las variables están configuradas correctamente
- Los tokens de API son válidos

### Error de OCR
Si el OCR no extrae datos correctamente:
- Verifica que la imagen/PDF tenga buena calidad
- Asegúrate de que el texto esté en español
- Revisa los logs de la consola para más detalles

### Error de Dropbox/Notion
Si hay problemas con las integraciones:
- Verifica que los tokens sean válidos
- Asegúrate de que los permisos estén configurados correctamente
- Revisa el endpoint `/api/health` para diagnosticar problemas

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.
