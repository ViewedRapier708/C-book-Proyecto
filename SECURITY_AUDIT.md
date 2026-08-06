# 🔒 Auditoría de Seguridad - Proyecto C-Book

## Resumen Ejecutivo

Este documento presenta un análisis de seguridad del proyecto C-Book, una aplicación web para gestión bibliotecaria desarrollada con Node.js/Express en el backend y React en el frontend. Se identificaron **múltiples vulnerabilidades críticas y de media gravedad** que requieren atención inmediata.

---

## 📋 Índice

1. [Vulnerabilidades Críticas](#vulnerabilidades-críticas)
2. [Vulnerabilidades de Media Gravedad](#vulnerabilidades-de-media-gravedad)
3. [Vulnerabilidades de Baja Gravedad](#vulnerabilidades-de-baja-gravedad)
4. [Plan de Mejoras](#plan-de-mejoras)
5. [Recomendaciones Adicionales](#recomendaciones-adicionales)

---

## Vulnerabilidades Críticas

### 1. 🔴 SECRET_KEY Hardcodeada y Débil

**Ubicación:** `/back/app.js` (línea 11), `/back/src/controllers/ControladorUsuario.js` (líneas 279, 379, 418), `/back/src/middleware/sessionGuard.js` (línea 14)

**Descripción:**
```javascript
const sessionSecret = process.env.SESSION_SECRET || 'dev_session_secret_change_me';
```

El sistema utiliza un secret hardcodeado como fallback cuando la variable de entorno no está configurada. Esto representa un riesgo crítico porque:
- Un atacante puede predecir y firmar tokens JWT maliciosos
- En producción, si `SESSION_SECRET` no está configurado, todos los servidores usarían el mismo secret conocido
- Permite suplantación de identidad y escalada de privilegios

**Impacto:** CRÍTICO - Suplantación de identidad, acceso no autorizado a cuentas de administrador

**Recomendación:**
- Eliminar completamente el valor por defecto hardcodeado
- Hacer obligatorio el uso de `SESSION_SECRET` desde variables de entorno
- Usar un generador de secrets criptográficamente seguro (mínimo 256 bits)
- Rotar regularmente las claves secretas

---

### 2. 🔴 Falta de Rate Limiting / Protección contra Brute Force

**Ubicación:** Todo el backend (`/back/app.js`, rutas de autenticación)

**Descripción:**
No existe ningún mecanismo de limitación de peticiones en:
- Endpoint de login (`POST /auth/login`)
- Endpoint de registro (`POST /auth/registro`)
- Endpoint de recuperación de contraseña (`POST /auth/forgot-password`)
- Cualquier otro endpoint de la API

**Impacto:** CRÍTICO - Ataques de fuerza bruta, credential stuffing, DoS

**Recomendación:**
- Implementar `express-rate-limit` o middleware similar
- Configurar límites específicos por endpoint (ej: 5 intentos de login por minuto por IP)
- Implementar bloqueo temporal de cuenta después de múltiples intentos fallidos
- Considerar integración con servicios como Cloudflare para protección DDoS

---

### 3. 🔴 Uso de dangerouslySetInnerHTML sin Sanitización

**Ubicación:** `/frontend/src/pages/Login.jsx` (línea 54)

**Descripción:**
```jsx
<div dangerouslySetInnerHTML={{ __html: html }} />
```

Se está renderizando HTML dinámico sin sanitización adecuada, lo que puede permitir ataques XSS (Cross-Site Scripting) si el contenido `html` proviene de una fuente no confiable.

**Impacto:** ALTO - Ejecución de código JavaScript malicioso en el navegador del usuario, robo de sesiones

**Recomendación:**
- Eliminar el uso de `dangerouslySetInnerHTML` siempre que sea posible
- Si es estrictamente necesario, usar librerías de sanitización como DOMPurify
- Validar y sanitizar cualquier contenido HTML antes de renderizarlo

---

### 4. 🔴 Almacenamiento de Datos Sensibles en localStorage

**Ubicación:** `/frontend/src/pages/Login.jsx`, `/frontend/src/pages/EmailVerification.jsx`

**Descripción:**
```javascript
localStorage.setItem('datosRegistro', JSON.stringify({ boleta: form.boleta, correo: form.correo }));
```

Se almacenan datos sensibles (boleta y correo) en localStorage, que es vulnerable a ataques XSS y accesible por cualquier script en la página.

**Impacto:** MEDIO-ALTO - Exposición de información personal, facilitación de ataques dirigidos

**Recomendación:**
- No almacenar datos personales en localStorage
- Usar sessionStorage para datos temporales (se limpia al cerrar pestaña)
- Implementar cookies httpOnly para datos sensibles
- Minimizar la cantidad de datos almacenados client-side

---

### 5. 🔴 Logging Excesivo de Información Sensible

**Ubicación:** Múltiples archivos en `/back/src/controllers/` y `/back/src/utils/`

**Descripción:**
```javascript
console.log('[SoporteAPI] GET tickets', { query: req.query, actor: getUser(req)?.boleta || getUser(req)?.email });
console.log('Correo enviado: ' + info.messageId+' a ' + destinatario + ' con asunto: ' + asunto);
```

Se están registrando en consola:
- Boletas y correos electrónicos de usuarios
- Queries completas de peticiones
- Información detallada de errores

En producción, estos logs pueden exponer información sensible si son accesibles.

**Impacto:** MEDIO - Fuga de información personal, violación de privacidad

**Recomendación:**
- Implementar un sistema de logging estructurado (winston, morgan)
- Configurar diferentes niveles de log según el entorno (ERROR en producción)
- Nunca loggear datos personales sensibles (PII)
- Enmascarar información sensible en logs

---

## Vulnerabilidades de Media Gravedad

### 6. 🟠 CORS Configurado con Orígenes Múltiples

**Ubicación:** `/back/app.js` (líneas 34-76)

**Descripción:**
Aunque la configuración de CORS incluye validación de orígenes, la lista es extensa y permite patrones dinámicos:
```javascript
const allowedOriginPatterns = [
  /^https:\/\/c-book-proyecto(?:-[a-z0-9-]+)?\.vercel\.app$/i,
  /^https:\/\/c-book-proyecto-git-[a-z0-9-]+-[a-z0-9-]+\.vercel\.app$/i
];
```

**Impacto:** MEDIO - Posible explotación mediante subdominios maliciosos si hay vulnerabilidades en el regex

**Recomendación:**
- Restringir al mínimo necesario de orígenes permitidos
- Auditar regularmente la lista de orígenes permitidos
- Considerar usar una lista blanca estricta en lugar de patrones regex

---

### 7. 🟠 Cookies sin Flag Secure Forzado en Desarrollo

**Ubicación:** `/back/app.js` (líneas 14-19)

**Descripción:**
```javascript
const configuredSecure = process.env.SESSION_COOKIE_SECURE
  ? process.env.SESSION_COOKIE_SECURE === 'true'
  : isProduction;
```

En desarrollo, las cookies pueden enviarse sin HTTPS, lo que permite interceptación en redes no seguras.

**Impacto:** MEDIO - Interceptación de sesión en redes públicas (desarrollo)

**Recomendación:**
- Forzar siempre `secure: true` en cookies de sesión
- Usar HTTPS incluso en entornos de desarrollo local
- Documentar claramente la configuración requerida

---

### 8. 🟠 Falta de Validación de Tipo de Contenido (Content-Type)

**Ubicación:** Rutas que aceptan uploads (`/back/src/routes/Rutas.js`)

**Descripción:**
Las rutas que aceptan archivos usan multer pero no validan estrictamente el tipo de contenido:
```javascript
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
```

**Impacto:** MEDIO - Upload de archivos maliciosos, posible ejecución de código

**Recomendación:**
- Implementar validación estricta de MIME types
- Verificar la firma del archivo (magic numbers)
- Almacenar archivos fuera del root del servidor
- Usar nombres de archivo aleatorios

---

### 9. 🟠 Dependencias sin Actualizar / Sin Audit

**Ubicación:** `/back/package.json`, `/frontend/package.json`

**Descripción:**
No hay evidencia de auditoría regular de dependencias. Algunas versiones pueden contener vulnerabilidades conocidas.

**Impacto:** MEDIO - Vulnerabilidades heredadas de dependencias de terceros

**Recomendación:**
- Ejecutar regularmente `npm audit`
- Mantener dependencias actualizadas
- Usar herramientas como Snyk o Dependabot
- Bloquear versiones con vulnerabilidades críticas conocidas

---

### 10. 🟠 Middleware de Autenticación No Aplicado Uniformemente

**Ubicación:** `/back/src/routes/Rutas.js`

**Descripción:**
Algunas rutas tienen `sessionGuard` mientras otras no lo tienen claramente documentado. La consistencia en la aplicación de middleware es crucial.

**Impacto:** MEDIO - Acceso no autorizado a endpoints protegidos

**Recomendación:**
- Documentar claramente qué rutas requieren autenticación
- Aplicar middleware de autenticación a nivel de router cuando sea posible
- Implementar tests de seguridad para verificar protección de rutas

---

## Vulnerabilidades de Baja Gravedad

### 11. 🟡 Headers de Seguridad No Configurados

**Ubicación:** `/back/app.js`

**Descripción:**
Faltan headers de seguridad importantes:
- `Strict-Transport-Security` (HSTS)
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Content-Security-Policy`
- `Referrer-Policy`

Solo se deshabilita `x-powered-by`.

**Impacto:** BAJO-MEDIO - Vulnerabilidades clickjacking, MIME sniffing, etc.

**Recomendación:**
- Implementar `helmet` middleware para configurar headers de seguridad automáticamente
- Configurar CSP apropiado para la aplicación

---

### 12. 🟡 Mensajes de Error Genéricos vs Detallados

**Ubicación:** Múltiples controladores

**Descripción:**
Algunos errores devuelven mensajes muy genéricos ("Error interno del servidor") mientras otros pueden filtrar información del sistema.

**Impacto:** BAJO - Posible información para atacantes, mala experiencia de usuario

**Recomendación:**
- Estandarizar manejo de errores
- Loggear detalles internamente, mostrar mensajes genéricos al cliente
- Implementar sistema centralizado de manejo de errores

---

### 13. 🟡 Falta de Validación de Esquema de Entrada

**Ubicación:** Controladores varios

**Descripción:**
Aunque hay validaciones manuales, no se usa una librería de validación de esquemas como Joi, Yup o Zod.

**Impacto:** BAJO - Validaciones inconsistentes, posible bypass

**Recomendación:**
- Implementar librería de validación de esquemas
- Definir esquemas claros para cada endpoint
- Validar tanto tipo como rango de valores

---

### 14. 🟡 Variables de Entorno Expuestas en Frontend

**Ubicación:** `/frontend/src/lib/supabaseClient.js`

**Descripción:**
```javascript
const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
```

Las variables con prefijo `VITE_` son expuestas públicamente en el bundle. Aunque las keys de Supabase anon son diseñadas para ser públicas, deben tener RLS (Row Level Security) configurado correctamente.

**Impacto:** BAJO - Depende de la configuración de RLS en Supabase

**Recomendación:**
- Asegurar que Row Level Security esté habilitado en todas las tablas de Supabase
- Revisar políticas de seguridad regularmente
- No exponer keys de servicio (service_role) en el frontend

---

## Plan de Mejoras

### Fase 1: Crítico (Semana 1-2)

| Prioridad | Acción | Complejidad | Impacto |
|-----------|--------|-------------|---------|
| P0 | Implementar SESSION_SECRET obligatorio | Baja | Crítico |
| P0 | Agregar rate limiting a endpoints de auth | Media | Crítico |
| P0 | Eliminar/sanitizar dangerouslySetInnerHTML | Baja | Alto |
| P0 | Remover datos sensibles de localStorage | Baja | Alto |

**Tareas específicas:**
1. Crear script para generar secret criptográfico seguro
2. Actualizar documentación de deployment con variables requeridas
3. Instalar `express-rate-limit` y configurar:
   - Login: 5 intentos/minuto por IP
   - Registro: 3 solicitudes/hora por IP
   - Password recovery: 2 solicitudes/hora por email
4. Reemplazar `dangerouslySetInnerHTML` con texto plano o DOMPurify
5. Migrar almacenamiento local a sessionStorage o eliminar

---

### Fase 2: Alta Prioridad (Semana 3-4)

| Prioridad | Acción | Complejidad | Impacto |
|-----------|--------|-------------|---------|
| P1 | Implementar sistema de logging estructurado | Media | Medio |
| P1 | Configurar headers de seguridad con helmet | Baja | Medio |
| P1 | Forzar cookies secure en todos los entornos | Baja | Medio |
| P1 | Validación estricta de file uploads | Media | Medio |

**Tareas específicas:**
1. Instalar `winston` y `morgan`
2. Configurar niveles de log por entorno
3. Instalar `helmet` y configurar headers
4. Implementar validación de MIME types y magic numbers para uploads
5. Actualizar política de cookies

---

### Fase 3: Media Prioridad (Mes 2)

| Prioridad | Acción | Complejidad | Impacto |
|-----------|--------|-------------|---------|
| P2 | Auditoría y actualización de dependencias | Baja | Medio |
| P2 | Implementar validación de esquemas con Zod/Joi | Media | Bajo |
| P2 | Revisar y endurecer configuración CORS | Baja | Medio |
| P2 | Centralizar manejo de errores | Media | Bajo |

**Tareas específicas:**
1. Ejecutar `npm audit` y actualizar dependencias
2. Configurar Dependabot o renovate bot
3. Definir esquemas de validación para todos los endpoints
4. Refinar lista de orígenes CORS permitidos
5. Crear middleware de manejo de errores centralizado

---

### Fase 4: Mejora Continua (Mes 3+)

| Prioridad | Acción | Complejidad | Impacto |
|-----------|--------|-------------|---------|
| P3 | Implementar escaneo automatizado de seguridad | Media | Alto |
| P3 | Tests de penetración regulares | Alta | Alto |
| P3 | Documentación de seguridad para desarrolladores | Baja | Medio |
| P3 | Plan de respuesta a incidentes | Media | Alto |

**Tareas específicas:**
1. Integrar SAST (Static Application Security Testing) en CI/CD
2. Programar auditorías de seguridad trimestrales
3. Crear guía de desarrollo seguro
4. Establecer protocolo de respuesta a vulnerabilidades
5. Capacitación del equipo en seguridad OWASP Top 10

---

## Recomendaciones Adicionales

### Herramientas Recomendadas

1. **Para desarrollo:**
   - `npm audit` - Auditoría de dependencias
   - `eslint-plugin-security` - Reglas de seguridad en linting
   - `husky` + hooks de pre-commit para escaneos

2. **Para CI/CD:**
   - GitHub Actions con `npm audit`
   - Snyk o CodeQL para análisis estático
   - Dependabot para actualizaciones automáticas

3. **Para monitoreo:**
   - Sentry para tracking de errores
   - Log aggregator (ELK Stack, Datadog, etc.)
   - WAF (Web Application Firewall) como Cloudflare

### Checklist de Seguridad OWASP

Marcar elementos implementados:

- [ ] **A01: Broken Access Control** - Verificar controles de acceso en todas las rutas
- [ ] **A02: Cryptographic Failures** - Asegurar uso correcto de HTTPS y cifrado
- [x] **A03: Injection** - Supabase usa queries parametrizadas (bueno)
- [ ] **A04: Insecure Design** - Revisar arquitectura de seguridad
- [ ] **A05: Security Misconfiguration** - Completar configuración de headers
- [ ] **A06: Vulnerable Components** - Mantener dependencias actualizadas
- [ ] **A07: Authentication Failures** - Implementar rate limiting y MFA
- [ ] **A08: Software Integrity Failures** - Verificar integridad de updates
- [ ] **A09: Security Logging Failures** - Mejorar sistema de logging
- [ ] **A10: SSRF** - Validar URLs externas

### Métricas de Seguimiento

Establecer KPIs para medir mejora en seguridad:

1. Número de vulnerabilidades críticas abiertas → **Meta: 0**
2. Tiempo promedio para parchear vulnerabilidades críticas → **Meta: <24 horas**
3. Porcentaje de dependencias actualizadas → **Meta: >95%**
4. Cobertura de tests de seguridad → **Meta: >80%**
5. Frecuencia de auditorías de seguridad → **Meta: Trimestral**

---

## Conclusión

El proyecto C-Book tiene una base funcional sólida pero presenta **vulnerabilidades de seguridad significativas** que deben ser abordadas prioritariamente. Las issues más críticas relacionadas con la gestión de secretos, falta de rate limiting, y manipulación insegura de HTML representan riesgos reales que podrían comprometer la integridad del sistema y la privacidad de los usuarios.

Se recomienda seguir el plan de mejoras propuesto, comenzando por las acciones de **Fase 1 (Crítico)** de manera inmediata, y establecer un proceso continuo de revisión y mejora de seguridad.

---

**Fecha de auditoría:** Diciembre 2024  
**Auditor:** Sistema de Análisis de Seguridad  
**Versión del documento:** 1.0

---

## Apéndice: Comandos Útiles

```bash
# Auditoría de dependencias
npm audit --prefix back
npm audit --prefix frontend

# Actualizar dependencias
npm update --prefix back
npm update --prefix frontend

# Forzar actualización crítica
npm audit fix --force --prefix back

# Ver paquetes desactualizados
npm outdated --prefix back
npm outdated --prefix frontend

# Generar secret seguro (Node.js)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
