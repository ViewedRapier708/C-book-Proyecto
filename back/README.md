# Backend C-Book

API Express de C-Book. El entrypoint real es `app.js` y las rutas principales se montan bajo `/auth`.

## Requisitos

- Node.js 20 o superior.
- npm.
- Variables de entorno basadas en `.env.example`.

## Desarrollo local

```powershell
cd back
npm install
Copy-Item .env.example .env
npm run dev
```

Comprobacion rapida:

```powershell
Invoke-WebRequest http://localhost:3000/health
```

## Scripts

- `npm start`: arranca `node app.js`.
- `npm run start:azure`: alias explicito para Azure.
- `npm run dev`: arranca con `nodemon`.
- `npm run check`: valida sintaxis del entrypoint.

## Despliegue en Azure App Service

El repositorio tiene el backend dentro de `back/`. El archivo `../.deployment` apunta Kudu/Azure a esta subcarpeta:

```ini
[config]
project = back
```

Configura el App Service como Node.js y usa como startup command:

```text
npm start
```

Para Linux App Service, usa Node 24 LTS cuando este disponible:

```powershell
az webapp config set --resource-group <grupo> --name <app> --linux-fx-version "NODE|24-lts"
az webapp config set --resource-group <grupo> --name <app> --startup-file "npm start"
```

Variables de entorno obligatorias en Azure App Settings:

```text
NODE_ENV=production
SUPABASE_URL=<url_de_supabase>
SUPABASE_SERVICE_KEY=<service_role_key>
FRONTEND_URL=https://<frontend>
CORS_ALLOWED_ORIGINS=https://<frontend>
SESSION_SECRET=<clave_larga>
RESET_PASSWORD_SECRET=<clave_larga_diferente>
SESSION_COOKIE_SAME_SITE=none
SESSION_COOKIE_SECURE=true
SMTP_SERVICE=gmail
SMTP_USER=<correo>
SMTP_PASS=<app_password>
SMTP_FROM=C-Book System <correo>
WEBSITE_NODE_DEFAULT_VERSION=~24
```

Si usas un proveedor SMTP que no sea Gmail, usa `SMTP_HOST`, `SMTP_PORT` y `SMTP_SECURE` en lugar de `SMTP_SERVICE`.

## Health check

Azure puede usar esta ruta para validar que el backend esta vivo:

```text
GET /health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "service": "c-book-api",
  "environment": "production"
}
```

## Despues del despliegue

Actualiza el frontend para apuntar a:

```text
https://<nombre-app>.azurewebsites.net
```

Tambien agrega ese dominio al origen permitido del frontend si lo mueves a Azure Static Web Apps u otro hosting.
