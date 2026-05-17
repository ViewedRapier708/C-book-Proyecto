# Frontend C-Book

Aplicacion React/Vite del sistema C-Book.

## Desarrollo local

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

En local puedes dejar `VITE_API_URL` vacio. Vite manda `/auth/*` al backend local definido en `vite.config.js`.

## Produccion en Azure

Si el frontend se publica en Azure Static Web Apps, configura:

```text
App location: frontend
Output location: dist
Build command: npm run build
```

Variable de entorno obligatoria en el hosting del frontend:

```text
VITE_API_URL=https://<tu-backend>.azurewebsites.net
```

No agregues `/auth` a `VITE_API_URL`; el cliente API lo agrega automaticamente.

El archivo `staticwebapp.config.json` permite que las rutas de React como `/user`, `/admin` y `/reset-password` funcionen al recargar la pagina.
