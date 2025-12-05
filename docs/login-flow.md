# Flujo de Inicio de Sesión

Este documento describe el recorrido completo que sigue un usuario para autenticarse en C-Book, desde que envía el formulario en el navegador hasta que el servidor responde y queda lista la sesión.

## 1. Disparo en el Frontend
- Archivo: `index.html`
- Script: `js/auth/funcionInicioSesion.js`
- Evento: el formulario `#form-login` llama a `iniciarSesion(event)`.
- Validaciones: boleta (10 dígitos) y contraseña no vacía.
- Llamada HTTP: `POST ${API_BASE}/auth/login` con `credentials: 'include'`.
- Resultado en cliente: si el backend responde `success`, se guarda la vista pública del usuario en `localStorage` y se redirige a `pantallasUs/usuario.html`.

## 2. Entrada en el Backend (Express)
- Archivo: `back/app.js` + `back/src/routes/Rutas.js`
- Middleware relevante:
  - `cors` con `credentials: true`.
  - `express-session` (cookie `connect.sid`).
- Ruta: `/auth/login` -> `ControladorUsuario.login`.

## 3. Controlador `login`
Archivo: `back/src/controllers/ControladorUsuario.js`.
1. Valida boleta y contraseña.
2. Llama a `buscarCorreoPorBoleta` (modelo) para obtener el correo asociado.
3. Ejecuta `loginConAuth` (Supabase Auth) para verificar las credenciales.
4. Recupera datos académicos con `traerUsuarioInfo` para obtener nombre y grupo.
5. Regenera la sesión de Express para evitar fixation y persiste:
   - `supabaseUserId`
   - nombre, email, boleta, grupo
   - tokens de Supabase (`access_token`, `refresh_token`, expiración)
6. Responde con `{ success, mensaje, user }`, donde `user` es una versión sin tokens para el frontend.

## 4. Persistencia de la Sesión
- Express envía la cookie `connect.sid`.
- El navegador la guarda porque la petición se hizo con `credentials: 'include'`.
- La próxima vez que el cliente llame a cualquier ruta bajo `/auth`, la cookie viaja automáticamente.

## 5. Guardia de Sesión en el Frontend
Archivo: `js/auth/sessionGuard.js` (referenciado en páginas públicas y privadas).
1. Determina si la página actual debe ser pública o protegida.
2. Llama a `GET ${API_BASE}/auth/session` para sincronizar estado.
3. Si el backend confirma la sesión, almacena/actualiza `localStorage.user_data` y evita que el usuario vuelva al login.
4. Si no hay sesión y la página es protegida, limpia datos locales, muestra alerta y redirige a `index.html`.

## 6. Guardia de Sesión en el Backend
Archivo: `back/src/middleware/sessionGuard.js`.
- Verifica `req.session.user` y que existan tokens.
- Si el `accessToken` está por expirar, usa `refrescarSesionSupabase` para obtener uno nuevo y guarda la sesión.
- Agrega `supabaseAccessToken` y `supabaseUserId` en `res.locals` para uso posterior.
- Responde `401` si no hay sesión válida.

## 7. Cierre de Sesión
- Frontend: `js/auth/funcionCerrarSesion.js` llama a `POST ${API_BASE}/auth/logout`.
- Backend: `ControladorUsuario.cerrarSesion` revoca la sesión en Supabase (`revocarSesionesSupabase`), destruye la sesión de Express y limpia la cookie.
- Frontend limpia `localStorage` y redirige a `index.html`.

## Archivos clave
| Etapa | Ubicación |
|-------|-----------|
| Formulario + fetch | `index.html`, `js/auth/funcionInicioSesion.js` |
| Guardia (front) | `js/auth/sessionGuard.js` |
| Config API base | `js/config/apiConfig.js`, meta `<meta name="api-base-url">` |
| Rutas Express | `back/src/routes/Rutas.js` |
| Controlador | `back/src/controllers/ControladorUsuario.js` |
| Modelos Supabase | `back/src/models/ModeloUsuario.js` |
| Guardia (back) | `back/src/middleware/sessionGuard.js` |

Con este mapa puedes ir de afuera hacia adentro (frontend -> controlador -> modelos) o al revés, según lo que necesites revisar primero.