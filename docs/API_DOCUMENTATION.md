# C-Book API Documentation

**Sistema de Gestión y Control de Recursos — Biblioteca Escolar CECyT 9**

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Runtime** | Node.js ≥ 20 |
| **Framework Backend** | Express.js 5.1.0 |
| **Base de Datos** | Supabase (PostgreSQL) vía `@supabase/supabase-js` 2.84.0 |
| **Autenticación** | JWT (`jsonwebtoken` 9.0.3) + Supabase Auth |
| **Hashing** | bcryptjs 2.4.3 |
| **Email** | Nodemailer 7.0.10 (SMTP Gmail) |
| **Tareas programadas** | node-cron 4.2.1 |
| **Framework Frontend** | React 19.2.0 + Vite 7.3.1 |
| **Estilos** | Tailwind CSS 4.2.1 |
| **Despliegue** | Vercel (Serverless Functions) |

**URL Base (Producción):** `https://c-book-proyecto.vercel.app`  
**URL Base (Desarrollo):** `http://localhost:3000`  
**Prefijo global de rutas:** `/auth`

---

## Autenticación y Seguridad

Todos los endpoints marcados con 🔒 **requieren autenticación**. El mecanismo es una cookie HTTP-only llamada `app_session` que contiene un JWT firmado.

**Flujo de autenticación:**
1. El cliente realiza `POST /auth/login` y recibe la cookie `app_session` automáticamente.
2. En cada petición protegida, el middleware `sessionGuard` valida y renueva el JWT.
3. Si el token está expirado o ausente, se responde con `401 Unauthorized`.

**Configuración de la cookie:**

| Atributo | Valor |
|----------|-------|
| `httpOnly` | `true` |
| `secure` | `true` (solo producción) |
| `sameSite` | `lax` |
| `maxAge` | 2 horas |

---

## Convención de Errores

Todos los errores siguen el formato:

```json
{
  "success": false,
  "message": "Descripción del error"
}
```

---

## Índice

1. [Autenticación](#1-autenticación)
   - [Registro de usuario](#11-registro-de-usuario)
   - [Verificación de correo](#12-verificación-de-correo)
   - [Inicio de sesión](#13-inicio-de-sesión)
   - [Verificar sesión activa](#14-verificar-sesión-activa)
   - [Cerrar sesión](#15-cerrar-sesión)
   - [Solicitar recuperación de contraseña](#16-solicitar-recuperación-de-contraseña)
   - [Restablecer contraseña](#17-restablecer-contraseña)
   - [Actualizar datos de cuenta](#18-actualizar-datos-de-cuenta)
2. [Recursos y Solicitudes (Alumno)](#2-recursos-y-solicitudes-alumno)
   - [Obtener recursos disponibles](#21-obtener-recursos-disponibles)
   - [Obtener solicitudes del usuario](#22-obtener-solicitudes-del-usuario)
   - [Crear solicitud de recurso](#23-crear-solicitud-de-recurso)
   - [Cancelar solicitud](#24-cancelar-solicitud)
3. [Administración — Materiales](#3-administración--materiales)
   - [Obtener materiales paginados](#31-obtener-materiales-paginados)
   - [Crear libro](#32-crear-libro)
   - [Crear computadora](#33-crear-computadora)
   - [Crear restirador](#34-crear-restirador)
   - [Actualizar libro](#35-actualizar-libro)
   - [Actualizar computadora](#36-actualizar-computadora)
   - [Actualizar restirador](#37-actualizar-restirador)
   - [Eliminar material](#38-eliminar-material)
4. [Administración — Usuarios](#4-administración--usuarios)
   - [Obtener usuarios paginados](#41-obtener-usuarios-paginados)
   - [Habilitar documentación de usuario](#42-habilitar-documentación-de-usuario)
5. [Administración — Solicitudes de Libros](#5-administración--solicitudes-de-libros)
   - [Obtener solicitudes de libros pendientes](#51-obtener-solicitudes-de-libros-pendientes)
   - [Gestionar solicitud (aprobar/rechazar)](#52-gestionar-solicitud-aprobarrechazar)
   - [Registrar entrega de libro](#53-registrar-entrega-de-libro)
6. [Administración — Préstamos](#6-administración--préstamos)
   - [Obtener préstamos activos](#61-obtener-préstamos-activos)
   - [Registrar devolución de libro](#62-registrar-devolución-de-libro)
7. [Analytics](#7-analytics)
   - [Estadísticas generales](#71-estadísticas-generales)
   - [Tendencias de uso](#72-tendencias-de-uso)
   - [Actividad reciente](#73-actividad-reciente)

---

## 1. Autenticación

### 1.1 Registro de Usuario

**`POST /auth/registro`**

Registra un nuevo alumno en el sistema. Inicia el flujo de verificación de correo electrónico vía Supabase Auth; el usuario deberá confirmar su cuenta antes de poder iniciar sesión.

#### Body (JSON)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `boleta` | `string` | Sí | Número de boleta (exactamente 10 dígitos numéricos) |
| `correo` | `string` | Sí | Dirección de correo electrónico válida |
| `password` | `string` | Sí | Contraseña (6–16 caracteres) |
| `confPsw` | `string` | Sí | Confirmación de contraseña (debe coincidir con `password`) |

```json
{
  "boleta": "2023640100",
  "correo": "alumno@ejemplo.com",
  "password": "Segura123",
  "confPsw": "Segura123"
}
```

#### Respuesta Exitosa `201 Created`

```json
{
  "success": true,
  "message": "Registro exitoso. Revisa tu correo para confirmar tu cuenta."
}
```

#### Errores

| Código | Causa |
|--------|-------|
| `400 Bad Request` | Boleta con formato incorrecto, contraseñas que no coinciden, campos faltantes o con formato inválido |
| `409 Conflict` | La boleta o el correo ya están registrados en el sistema |
| `500 Internal Server Error` | Fallo al comunicarse con Supabase Auth |

---

### 1.2 Verificación de Correo

**`POST /auth/verificar`**

Consulta si el usuario ya confirmó su correo en Supabase Auth y, de ser así, crea su registro en la tabla `usuarios_web_movil`. Debe llamarse desde la página de redirección post-confirmación.

#### Body (JSON)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `boleta` | `string` | Sí | Número de boleta del alumno |
| `correo` | `string` | Sí | Correo electrónico con el que se registró |

```json
{
  "boleta": "2023640100",
  "correo": "alumno@ejemplo.com"
}
```

#### Respuesta Exitosa `200 OK`

```json
{
  "confirmado": true,
  "mensaje": "Correo verificado correctamente. Ya puedes iniciar sesión."
}
```

#### Errores

| Código | Causa |
|--------|-------|
| `400 Bad Request` | El correo aún no ha sido confirmado en Supabase Auth |
| `404 Not Found` | No existe ningún usuario registrado con esa boleta y correo |
| `500 Internal Server Error` | Error al insertar el registro en la base de datos |

---

### 1.3 Inicio de Sesión

**`POST /auth/login`**

Autentica al usuario con su boleta y contraseña. Establece la cookie `app_session` con un JWT válido por 2 horas.

#### Body (JSON)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `boleta` | `string` | Sí | Número de boleta (10 dígitos) |
| `password` | `string` | Sí | Contraseña del usuario |

```json
{
  "boleta": "2023640100",
  "password": "Segura123"
}
```

#### Respuesta Exitosa `200 OK`

```json
{
  "success": true,
  "mensaje": "Inicio de sesión exitoso",
  "user": {
    "supabaseUserId": "uuid-del-usuario",
    "nombre": "Juan Pérez López",
    "email": "alumno@ejemplo.com",
    "boleta": "2023640100",
    "grupo": "1TV1",
    "rol": "alumno"
  },
  "rol": "alumno"
}
```

> La cookie `app_session` se establece automáticamente en la respuesta (`Set-Cookie`).

#### Errores

| Código | Causa |
|--------|-------|
| `400 Bad Request` | Boleta con formato inválido o campos faltantes |
| `401 Unauthorized` | Credenciales incorrectas |
| `403 Forbidden` | El correo del usuario no ha sido verificado |
| `404 Not Found` | La boleta no existe en el sistema |
| `500 Internal Server Error` | Fallo al generar el JWT o comunicarse con Supabase |

---

### 1.4 Verificar Sesión Activa

**`GET /auth/session`**

Verifica si la cookie `app_session` del cliente contiene un JWT válido y devuelve los datos del usuario autenticado.

#### Respuesta Exitosa `200 OK`

```json
{
  "autenticado": true,
  "user": {
    "nombre": "Juan Pérez López",
    "email": "alumno@ejemplo.com",
    "boleta": "2023640100",
    "grupo": "1TV1",
    "rol": "alumno"
  }
}
```

**Sin sesión activa:**

```json
{
  "autenticado": false
}
```

#### Errores

| Código | Causa |
|--------|-------|
| `500 Internal Server Error` | Error al leer o decodificar la cookie |

---

### 1.5 Cerrar Sesión

🔒 **Requiere autenticación**

**`POST /auth/logout`**

Invalida la sesión actual revocando los tokens de Supabase y eliminando la cookie `app_session` del cliente.

#### Respuesta Exitosa `200 OK`

```json
{
  "mensaje": "Sesión cerrada correctamente"
}
```

#### Errores

| Código | Causa |
|--------|-------|
| `401 Unauthorized` | No hay sesión activa o el JWT es inválido |
| `500 Internal Server Error` | Fallo al revocar tokens en Supabase |

---

### 1.6 Solicitar Recuperación de Contraseña

**`POST /auth/forgot-password`**

Inicia el flujo de recuperación de contraseña. Busca el correo asociado a la boleta y envía un enlace de restablecimiento vía Supabase Auth. La respuesta es genérica para no revelar si la boleta existe.

#### Body (JSON)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `boleta` | `string` | Sí | Número de boleta del alumno |

```json
{
  "boleta": "2023640100"
}
```

#### Respuesta Exitosa `200 OK`

```json
{
  "success": true,
  "message": "Si la boleta está registrada, recibirás un correo con instrucciones."
}
```

#### Errores

| Código | Causa |
|--------|-------|
| `400 Bad Request` | Formato de boleta inválido |
| `500 Internal Server Error` | Fallo al enviar el correo de recuperación |

---

### 1.7 Restablecer Contraseña

**`POST /auth/reset-password`**

Establece una nueva contraseña usando el `access_token` recibido en el enlace de recuperación enviado al correo.

#### Body (JSON)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `access_token` | `string` | Sí | Token de acceso de Supabase incluido en el enlace de recuperación |
| `newPassword` | `string` | Sí | Nueva contraseña (6–16 caracteres) |
| `confPassword` | `string` | Sí | Confirmación de la nueva contraseña |

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5...",
  "newPassword": "NuevaClave456",
  "confPassword": "NuevaClave456"
}
```

#### Respuesta Exitosa `200 OK`

```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}
```

#### Errores

| Código | Causa |
|--------|-------|
| `400 Bad Request` | Las contraseñas no coinciden, longitud inválida, o token ausente |
| `401 Unauthorized` | El `access_token` es inválido o ha expirado |
| `500 Internal Server Error` | Fallo al actualizar la contraseña en Supabase Auth |

---

### 1.8 Actualizar Datos de Cuenta

🔒 **Requiere autenticación**

**`PATCH /auth/CuentaUpdate`**

Actualiza el correo electrónico o la contraseña del usuario autenticado.

#### Body (JSON)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `boleta` | `string` | Sí | Número de boleta del usuario |
| `TipoDatoACambiar` | `string` | Sí | `"correo"` o `"contraseña"` |
| `nuevoCorreo` | `string` | Condicional | Nuevo correo (requerido si `TipoDatoACambiar = "correo"`) |
| `nuevaContraseña` | `string` | Condicional | Nueva contraseña (requerido si `TipoDatoACambiar = "contraseña"`) |

**Cambio de correo:**

```json
{
  "boleta": "2023640100",
  "TipoDatoACambiar": "correo",
  "nuevoCorreo": "nuevo.correo@ejemplo.com"
}
```

**Cambio de contraseña:**

```json
{
  "boleta": "2023640100",
  "TipoDatoACambiar": "contraseña",
  "nuevaContraseña": "OtraClave789"
}
```

#### Respuesta Exitosa `200 OK`

```json
{
  "success": true,
  "message": "Correo actualizado exitosamente"
}
```

#### Errores

| Código | Causa |
|--------|-------|
| `400 Bad Request` | `TipoDatoACambiar` con valor no permitido, campos requeridos ausentes |
| `401 Unauthorized` | Sesión inválida o expirada |
| `409 Conflict` | El nuevo correo ya está en uso por otro usuario |
| `500 Internal Server Error` | Fallo al actualizar en Supabase Auth o en la base de datos |

---

## 2. Recursos y Solicitudes (Alumno)

### 2.1 Obtener Recursos Disponibles

**`GET /auth/recursos`**

Retorna el catálogo de recursos del tipo solicitado.

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `tipo` | `string` | Sí | `"libro"`, `"computadora"` o `"restirador"` |

**Ejemplo:** `GET /auth/recursos?tipo=libro`

#### Respuesta Exitosa `200 OK` — Libros

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "libro_id": 10,
      "titulo": "Cálculo Diferencial e Integral",
      "autor": "James Stewart",
      "clasificacion": "515.3 S84",
      "isbn": "978-0-538-49781-7",
      "tipo_material": "Libro de texto",
      "codigo_barras": "BC001234",
      "numero_ejemplar": "1",
      "anio": 2015,
      "estatus_item": "Bueno",
      "Disponible": true,
      "coleccion": "Matemáticas"
    }
  ]
}
```

#### Respuesta Exitosa `200 OK` — Computadoras

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "no_computadora": 101,
      "no_inventario": "INV-2024-101",
      "procesador": "Intel Core i5-10400",
      "programas": "Office 365, AutoCAD 2024",
      "carrera": "Mecatrónica",
      "Disponible": true,
      "En_funcionamiento": true,
      "Observacion": "Sin observaciones"
    }
  ]
}
```

#### Respuesta Exitosa `200 OK` — Restiradores

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "no_restirador": 5,
      "no_inventario": "RST-005",
      "Disponible": true,
      "estado_de_material": true,
      "Observacion": "N/A"
    }
  ]
}
```

#### Errores

| Código | Causa |
|--------|-------|
| `400 Bad Request` | El parámetro `tipo` está ausente o tiene un valor no permitido |
| `500 Internal Server Error` | Error al consultar la base de datos |

---

### 2.2 Obtener Solicitudes del Usuario

🔒 **Requiere autenticación**

**`GET /auth/recursos/usuario`**

Retorna todas las solicitudes activas del usuario autenticado agrupadas por tipo de recurso.

#### Respuesta Exitosa `200 OK`

```json
{
  "success": true,
  "data": {
    "libros": [
      {
        "id": 42,
        "ejemplar_id": 1,
        "titulo": "Cálculo Diferencial e Integral",
        "estado_asistencia_id": 1,
        "fecha_solicitud": "2026-04-25T10:30:00-06:00",
        "fecha_limite_respuesta": "2026-04-27T10:30:00-06:00"
      }
    ],
    "computadoras": [],
    "restiradores": []
  }
}
```

#### Errores

| Código | Causa |
|--------|-------|
| `401 Unauthorized` | Sesión inválida o expirada |
| `500 Internal Server Error` | Error al consultar la base de datos |

---

### 2.3 Crear Solicitud de Recurso

🔒 **Requiere autenticación**

**`POST /auth/solicitud`**

Registra una solicitud de préstamo para el recurso indicado. El middleware `verificarDisponibilidad` valida las restricciones de negocio antes de crear el registro.

**Reglas de negocio:**

| Tipo | Límite por usuario | Condición del recurso |
|------|-------------------|-----------------------|
| `computadora` | 1 solicitud activa | `Disponible = true` |
| `restirador` | 1 solicitud activa | `Disponible = true` |
| `libro` | 3 solicitudes activas | `Disponible = true` |

#### Body (JSON)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `tipo` | `string` | Sí | `"computadora"`, `"restirador"` o `"libro"` |
| `boleta` | `string` | Sí | Número de boleta (10 dígitos) |
| `idRecurso` | `integer` | Sí | ID del recurso (`no_computadora`, `no_restirador` o `id` del ejemplar) |

```json
{
  "tipo": "libro",
  "boleta": "2023640100",
  "idRecurso": 1
}
```

#### Respuesta Exitosa `201 Created`

```json
{
  "success": true,
  "message": "Solicitud creada exitosamente"
}
```

#### Errores

| Código | Causa |
|--------|-------|
| `400 Bad Request` | Parámetros faltantes, tipo inválido o formato de boleta incorrecto |
| `401 Unauthorized` | Sesión inválida o expirada |
| `409 Conflict` | El usuario ya alcanzó el límite de solicitudes activas para ese tipo, o el recurso ya no está disponible |
| `500 Internal Server Error` | Error al insertar en la base de datos o al enviar la notificación por correo |

---

### 2.4 Cancelar Solicitud

🔒 **Requiere autenticación**

**`DELETE /auth/solicitud/:tipo/:id`**

Elimina una solicitud activa del usuario. Solo el propietario de la solicitud (validado por boleta del JWT) puede cancelarla.

#### Path Variables

| Variable | Tipo | Descripción |
|----------|------|-------------|
| `tipo` | `string` | `"computadora"`, `"restirador"` o `"libro"` |
| `id` | `integer` | ID de la solicitud a cancelar |

**Ejemplo:** `DELETE /auth/solicitud/libro/42`

#### Respuesta Exitosa `200 OK`

```json
{
  "success": true,
  "message": "Solicitud cancelada exitosamente"
}
```

#### Errores

| Código | Causa |
|--------|-------|
| `400 Bad Request` | Tipo de recurso inválido |
| `401 Unauthorized` | Sesión inválida o expirada |
| `403 Forbidden` | La solicitud no pertenece al usuario autenticado |
| `404 Not Found` | No existe una solicitud con el ID proporcionado |
| `500 Internal Server Error` | Error al eliminar en la base de datos |

---

## 3. Administración — Materiales

### 3.1 Obtener Materiales Paginados

🔒 **Requiere autenticación**

**`GET /auth/admin/materiales/:tipo`**

Retorna todos los registros del tipo de material especificado con paginación.

#### Path Variables

| Variable | Tipo | Descripción |
|----------|------|-------------|
| `tipo` | `string` | `"libros"`, `"computadoras"`, `"restiradores"` o `"guardarropas"` |

#### Query Parameters

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `page` | `integer` | `1` | Número de página (≥ 1) |
| `limit` | `integer` | `25` | Registros por página |

**Ejemplo:** `GET /auth/admin/materiales/libros?page=2&limit=10`

#### Respuesta Exitosa `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "titulo": "Cálculo Diferencial e Integral",
      "autor": "James Stewart",
      "clasificacion": "515.3 S84",
      "isbn": "978-0-538-49781-7",
      "tipo_material": "Libro de texto"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 340
  }
}
```

#### Errores

| Código | Causa |
|--------|-------|
| `400 Bad Request` | Tipo de material no reconocido |
| `401 Unauthorized` | Sesión inválida o expirada |
| `500 Internal Server Error` | Error al consultar la base de datos |

---

### 3.2 Crear Libro

🔒 **Requiere autenticación**

**`POST /auth/admin/libros`**

Crea un nuevo libro junto con su primer ejemplar en la base de datos.

#### Body (JSON)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `titulo` | `string` | Sí | Título del libro (1–500 caracteres) |
| `autor` | `string` | Sí | Nombre del autor (1–200 caracteres) |
| `clasificacion` | `string` | Sí | Código de clasificación (1–50 caracteres) |
| `isbn` | `string` | Sí | ISBN único del libro |
| `tipo_material` | `string` | Sí | Tipo de material (1–50 caracteres) |
| `coleccion` | `string` | Sí | Colección a la que pertenece (1–200 caracteres) |
| `codigo_barras` | `string` | Sí | Código de barras único del ejemplar (3–50 caracteres) |
| `numero_ejemplar` | `integer` | Sí | Número del ejemplar (≥ 0, sin decimales) |
| `anio` | `integer` | Sí | Año de publicación (1000–2100) |
| `estatus_item` | `string` | Sí | Estado del ejemplar (ej. `"Bueno"`, `"Regular"`) |
| `Disponible` | `boolean` | No | Disponibilidad (default: `true`) |

```json
{
  "titulo": "Física Universitaria",
  "autor": "Hugh D. Young",
  "clasificacion": "530 Y68",
  "isbn": "978-0-321-50130-1",
  "tipo_material": "Libro de texto",
  "coleccion": "Ciencias Exactas",
  "codigo_barras": "FIS001",
  "numero_ejemplar": 1,
  "anio": 2018,
  "estatus_item": "Bueno",
  "Disponible": true
}
```

#### Respuesta Exitosa `201 Created`

```json
{
  "success": true,
  "data": {
    "libro": [
      {
        "id": 55,
        "titulo": "Física Universitaria",
        "autor": "Hugh D. Young",
        "clasificacion": "530 Y68",
        "isbn": "978-0-321-50130-1",
        "tipo_material": "Libro de texto"
      }
    ],
    "ejemplar": [
      {
        "id": 88,
        "libro_id": 55,
        "codigo_barras": "FIS001",
        "numero_ejemplar": "1",
        "anio": 2018,
        "estatus_item": "Bueno",
        "Disponible": true,
        "coleccion": "Ciencias Exactas"
      }
    ]
  }
}
```

#### Errores

| Código | Causa |
|--------|-------|
| `400 Bad Request` | Campos faltantes, año fuera de rango, `numero_ejemplar` con decimales, o caracteres no permitidos |
| `401 Unauthorized` | Sesión inválida o expirada |
| `409 Conflict` | El ISBN o el código de barras ya existen en la base de datos |
| `500 Internal Server Error` | Error al insertar en la base de datos |

---

### 3.3 Crear Computadora

🔒 **Requiere autenticación**

**`POST /auth/admin/computadoras`**

Registra una nueva computadora en el catálogo de recursos.

#### Body (JSON)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `no_computadora` | `integer` | Sí | Número identificador único de la computadora |
| `no_inventario` | `string` | Sí | Número de inventario institucional único |
| `procesador` | `string` | Sí | Especificaciones del procesador |
| `programas` | `string` | Sí | Software instalado |
| `carrera` | `string` | Sí | Carrera o departamento asignado |
| `Disponible` | `boolean` | No | Disponibilidad (default: `true`) |
| `En_funcionamiento` | `boolean` | No | Estado operativo (default: `true`) |
| `Observacion` | `string` | No | Notas u observaciones adicionales |

```json
{
  "no_computadora": 205,
  "no_inventario": "INV-2024-205",
  "procesador": "AMD Ryzen 5 5600X",
  "programas": "Office 365, AutoCAD 2024, MATLAB R2023b",
  "carrera": "Sistemas",
  "Disponible": true,
  "En_funcionamiento": true,
  "Observacion": "Equipo nuevo, sin incidencias"
}
```

#### Respuesta Exitosa `201 Created`

```json
{
  "success": true,
  "data": [
    {
      "id": 45,
      "no_computadora": 205,
      "no_inventario": "INV-2024-205",
      "procesador": "AMD Ryzen 5 5600X",
      "programas": "Office 365, AutoCAD 2024, MATLAB R2023b",
      "carrera": "Sistemas",
      "Disponible": true,
      "En_funcionamiento": true,
      "Observacion": "Equipo nuevo, sin incidencias"
    }
  ]
}
```

#### Errores

| Código | Causa |
|--------|-------|
| `400 Bad Request` | Campos requeridos faltantes o `no_computadora` no entero |
| `401 Unauthorized` | Sesión inválida o expirada |
| `409 Conflict` | `no_computadora` o `no_inventario` ya registrados |
| `500 Internal Server Error` | Error al insertar en la base de datos |

---

### 3.4 Crear Restirador

🔒 **Requiere autenticación**

**`POST /auth/admin/restiradores`**

Registra un nuevo restirador (tablero de dibujo) en el catálogo de recursos.

#### Body (JSON)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `no_restirador` | `integer` | Sí | Número identificador único del restirador |
| `no_inventario` | `string` | Sí | Número de inventario institucional único |
| `Disponible` | `boolean` | No | Disponibilidad (default: `true`) |
| `estado_de_material` | `boolean` | No | Condición física del material (default: `true`) |
| `Observacion` | `string` | No | Notas u observaciones (default: `"N/A"`) |

```json
{
  "no_restirador": 12,
  "no_inventario": "RST-012",
  "Disponible": true,
  "estado_de_material": true,
  "Observacion": "N/A"
}
```

#### Respuesta Exitosa `201 Created`

```json
{
  "success": true,
  "data": [
    {
      "id": 12,
      "no_restirador": 12,
      "no_inventario": "RST-012",
      "Disponible": true,
      "estado_de_material": true,
      "Observacion": "N/A"
    }
  ]
}
```

#### Errores

| Código | Causa |
|--------|-------|
| `400 Bad Request` | Campos requeridos faltantes |
| `401 Unauthorized` | Sesión inválida o expirada |
| `409 Conflict` | `no_restirador` o `no_inventario` ya registrados |
| `500 Internal Server Error` | Error al insertar en la base de datos |

---

### 3.5 Actualizar Libro

🔒 **Requiere autenticación**

**`PUT /auth/admin/libros`**

Actualiza los datos de un libro existente y, opcionalmente, los de uno de sus ejemplares.

#### Body (JSON)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | `integer` | Sí | ID del libro en la tabla `libros` |
| `ejemplar_id` | `integer` | No | ID del ejemplar a actualizar en `ejemplares` |
| `titulo` | `string` | No | Nuevo título |
| `autor` | `string` | No | Nuevo autor |
| `clasificacion` | `string` | No | Nueva clasificación |
| `isbn` | `string` | No | Nuevo ISBN (debe ser único) |
| `tipo_material` | `string` | No | Nuevo tipo de material |
| `coleccion` | `string` | No | Nueva colección |
| `codigo_barras` | `string` | No | Nuevo código de barras (debe ser único) |
| `numero_ejemplar` | `integer` | No | Nuevo número de ejemplar |
| `anio` | `integer` | No | Nuevo año de publicación |
| `estatus_item` | `string` | No | Nuevo estado del ejemplar |
| `Disponible` | `boolean` | No | Nueva disponibilidad |

```json
{
  "id": 55,
  "ejemplar_id": 88,
  "estatus_item": "Regular",
  "Disponible": false,
  "anio": 2019
}
```

#### Respuesta Exitosa `200 OK`

```json
{
  "success": true,
  "data": {
    "libro": { "id": 55, "titulo": "Física Universitaria" },
    "ejemplar": { "id": 88, "estatus_item": "Regular", "Disponible": false }
  }
}
```

#### Errores

| Código | Causa |
|--------|-------|
| `400 Bad Request` | `id` faltante, año fuera de rango o caracteres inválidos |
| `401 Unauthorized` | Sesión inválida o expirada |
| `404 Not Found` | No existe un libro con el `id` proporcionado |
| `409 Conflict` | El nuevo ISBN o código de barras ya pertenece a otro registro |
| `500 Internal Server Error` | Error al actualizar en la base de datos |

---

### 3.6 Actualizar Computadora

🔒 **Requiere autenticación**

**`PUT /auth/admin/computadoras`**

Actualiza los datos de una computadora existente.

#### Body (JSON)

Mismos campos que [Crear Computadora](#33-crear-computadora), más el campo `id` (requerido).

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | `integer` | Sí | ID del registro en la tabla `computadoras` |
| *(resto de campos)* | — | No | Cualquier campo del modelo |

```json
{
  "id": 45,
  "En_funcionamiento": false,
  "Observacion": "Falla en la fuente de poder, enviada a mantenimiento"
}
```

#### Respuesta Exitosa `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": 45,
      "En_funcionamiento": false,
      "Observacion": "Falla en la fuente de poder, enviada a mantenimiento"
    }
  ]
}
```

#### Errores

| Código | Causa |
|--------|-------|
| `400 Bad Request` | `id` faltante |
| `401 Unauthorized` | Sesión inválida o expirada |
| `404 Not Found` | No existe una computadora con el `id` proporcionado |
| `409 Conflict` | Nuevo `no_computadora` o `no_inventario` duplicado |
| `500 Internal Server Error` | Error al actualizar en la base de datos |

---

### 3.7 Actualizar Restirador

🔒 **Requiere autenticación**

**`PUT /auth/admin/restiradores`**

Actualiza los datos de un restirador existente.

#### Body (JSON)

Mismos campos que [Crear Restirador](#34-crear-restirador), más el campo `id` (requerido).

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | `integer` | Sí | ID del registro en la tabla `restiradores` |
| *(resto de campos)* | — | No | Cualquier campo del modelo |

```json
{
  "id": 12,
  "estado_de_material": false,
  "Observacion": "Superficie dañada, requiere reparación"
}
```

#### Respuesta Exitosa `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": 12,
      "estado_de_material": false,
      "Observacion": "Superficie dañada, requiere reparación"
    }
  ]
}
```

#### Errores

| Código | Causa |
|--------|-------|
| `400 Bad Request` | `id` faltante |
| `401 Unauthorized` | Sesión inválida o expirada |
| `404 Not Found` | No existe un restirador con el `id` proporcionado |
| `500 Internal Server Error` | Error al actualizar en la base de datos |

---

### 3.8 Eliminar Material

🔒 **Requiere autenticación**

**`DELETE /auth/admin/materiales/:tipo/:id`**

Elimina permanentemente un material del catálogo. Las eliminaciones en cascada se gestionan según las restricciones de la base de datos.

#### Path Variables

| Variable | Tipo | Descripción |
|----------|------|-------------|
| `tipo` | `string` | `"libros"`, `"computadoras"`, `"restiradores"` o `"guardarropas"` |
| `id` | `integer` | ID del registro a eliminar |

**Ejemplo:** `DELETE /auth/admin/materiales/computadoras/45`

#### Respuesta Exitosa `200 OK`

```json
{
  "success": true,
  "data": {
    "id": 45,
    "mensaje": "Material eliminado correctamente"
  }
}
```

#### Errores

| Código | Causa |
|--------|-------|
| `400 Bad Request` | Tipo de material no reconocido |
| `401 Unauthorized` | Sesión inválida o expirada |
| `404 Not Found` | No existe un registro con el `id` y `tipo` proporcionados |
| `409 Conflict` | El material no puede eliminarse porque tiene registros dependientes activos |
| `500 Internal Server Error` | Error al eliminar en la base de datos |

---

## 4. Administración — Usuarios

### 4.1 Obtener Usuarios Paginados

🔒 **Requiere autenticación**

**`GET /auth/admin/usuarios`**

Retorna la lista de todos los usuarios registrados en el sistema con sus datos de boleta asociados.

#### Query Parameters

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `page` | `integer` | `1` | Número de página |
| `limit` | `integer` | `25` | Registros por página |

**Ejemplo:** `GET /auth/admin/usuarios?page=1&limit=25`

#### Respuesta Exitosa `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "boleta": 2023640100,
      "correo": "alumno@ejemplo.com",
      "tiene_documentos": false,
      "rol": "alumno",
      "nombre": "Juan Pérez López",
      "Grupo": "1TV1"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 120
  }
}
```

#### Errores

| Código | Causa |
|--------|-------|
| `401 Unauthorized` | Sesión inválida o expirada |
| `500 Internal Server Error` | Error al consultar la base de datos |

---

### 4.2 Habilitar Documentación de Usuario

🔒 **Requiere autenticación**

**`PUT /auth/admin/usuarios/:id/habilitar`**

Establece `tiene_documentos = true` para el usuario indicado. Este campo es requisito para que el administrador pueda aprobar préstamos de libros.

#### Path Variables

| Variable | Tipo | Descripción |
|----------|------|-------------|
| `id` | `integer` | ID del usuario en la tabla `usuarios_web_movil` |

**Ejemplo:** `PUT /auth/admin/usuarios/3/habilitar`

#### Respuesta Exitosa `200 OK`

```json
{
  "success": true,
  "data": {
    "id": 3,
    "tiene_documentos": true
  }
}
```

#### Errores

| Código | Causa |
|--------|-------|
| `401 Unauthorized` | Sesión inválida o expirada |
| `404 Not Found` | No existe un usuario con el `id` proporcionado |
| `500 Internal Server Error` | Error al actualizar en la base de datos |

---

## 5. Administración — Solicitudes de Libros

### 5.1 Obtener Solicitudes de Libros Pendientes

🔒 **Requiere autenticación**

**`GET /auth/admin/solicitudes/libros`**

Retorna todas las solicitudes de préstamo de libros registradas en el sistema, junto con los datos del alumno y del ejemplar solicitado.

#### Respuesta Exitosa `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": 42,
      "estado_asistencia_id": 1,
      "fecha_solicitud": "2026-04-25T10:30:00-06:00",
      "fecha_limite_respuesta": "2026-04-27T10:30:00-06:00",
      "fecha_aprobacion": null,
      "motivo_rechazo": null,
      "usuario_boleta": 2023640100,
      "nombre": "Juan Pérez López",
      "grupo": "1TV1",
      "tiene_documentos": false,
      "ejemplar_id": 1,
      "codigo_barras": "BC001234",
      "numero_ejemplar": "1",
      "titulo": "Cálculo Diferencial e Integral",
      "autor": "James Stewart"
    }
  ]
}
```

#### Errores

| Código | Causa |
|--------|-------|
| `401 Unauthorized` | Sesión inválida o expirada |
| `500 Internal Server Error` | Error al consultar la base de datos |

---

### 5.2 Gestionar Solicitud (Aprobar/Rechazar)

🔒 **Requiere autenticación**

**`POST /auth/admin/solicitudes/libros/:id/gestionar`**

Aprueba o rechaza una solicitud de libro. Al aprobar, verifica que el alumno tenga documentos habilitados y calcula la fecha límite de recolección. Envía un correo de notificación al alumno.

#### Path Variables

| Variable | Tipo | Descripción |
|----------|------|-------------|
| `id` | `integer` | ID de la solicitud en `solicitudes_libros` |

#### Body (JSON)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `estado` | `integer` | Sí | `2` = Aprobar, `3` = Rechazar |
| `boletaUser` | `string` | Sí | Número de boleta del alumno solicitante |
| `motivo` | `string` | No | Motivo de rechazo (recomendado si `estado = 3`) |

**Aprobar:**

```json
{
  "estado": 2,
  "boletaUser": "2023640100"
}
```

**Rechazar:**

```json
{
  "estado": 3,
  "boletaUser": "2023640100",
  "motivo": "El ejemplar presenta daños y se encuentra en reparación"
}
```

#### Respuesta Exitosa `200 OK`

```json
{
  "success": true,
  "message": "Estado actualizado correctamente"
}
```

#### Errores

| Código | Causa |
|--------|-------|
| `400 Bad Request` | `estado` con valor no permitido, `boletaUser` faltante |
| `401 Unauthorized` | Sesión inválida o expirada |
| `403 Forbidden` | El alumno no tiene documentación habilitada (solo al aprobar) |
| `404 Not Found` | No existe una solicitud con el `id` proporcionado |
| `500 Internal Server Error` | Error al actualizar la base de datos o al enviar el correo |

---

### 5.3 Registrar Entrega de Libro

🔒 **Requiere autenticación**

**`POST /auth/admin/solicitudes/libros/:id/entregar`**

Formaliza la entrega física del libro al alumno. Crea el registro de préstamo en `prestamos_libros`, calcula la fecha límite de devolución y envía un correo de confirmación.

#### Path Variables

| Variable | Tipo | Descripción |
|----------|------|-------------|
| `id` | `integer` | ID de la solicitud en `solicitudes_libros` |

#### Body (JSON)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `boleta` | `string` | No | Boleta del alumno (por defecto usa `solicitud.usuario_boleta`) |
| `idEjemplar` | `integer` | No | ID del ejemplar entregado (por defecto usa el de la solicitud) |

```json
{
  "boleta": "2023640100",
  "idEjemplar": 1
}
```

#### Respuesta Exitosa `201 Created`

```json
{
  "success": true,
  "message": "Libro entregado. Préstamo activo.",
  "data": {
    "prestamo_id": 15,
    "fecha_inicio_prestamo": "2026-04-29T09:00:00-06:00",
    "fecha_limite_devolucion": "2026-05-13T09:00:00-06:00"
  }
}
```

#### Errores

| Código | Causa |
|--------|-------|
| `400 Bad Request` | La solicitud no está en estado aprobado |
| `401 Unauthorized` | Sesión inválida o expirada |
| `403 Forbidden` | El alumno no tiene documentos habilitados |
| `404 Not Found` | No existe la solicitud con el `id` proporcionado |
| `500 Internal Server Error` | Error al crear el préstamo o al enviar el correo |

---

## 6. Administración — Préstamos

### 6.1 Obtener Préstamos Activos

🔒 **Requiere autenticación**

**`GET /auth/admin/prestamos/libros`**

Retorna todos los préstamos de libros registrados en el sistema, con información del alumno, el ejemplar y las fechas relevantes.

#### Respuesta Exitosa `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "estado_prestamo_id": 1,
      "fecha_inicio_prestamo": "2026-04-29T09:00:00-06:00",
      "fecha_limite_devolucion": "2026-05-13T09:00:00-06:00",
      "fecha_devolucion_real": null,
      "observaciones": null,
      "solicitud_id": 42,
      "usuario_boleta": 2023640100,
      "nombre": "Juan Pérez López",
      "grupo": "1TV1",
      "titulo": "Cálculo Diferencial e Integral",
      "codigo_barras": "BC001234"
    }
  ]
}
```

#### Errores

| Código | Causa |
|--------|-------|
| `401 Unauthorized` | Sesión inválida o expirada |
| `500 Internal Server Error` | Error al consultar la base de datos |

---

### 6.2 Registrar Devolución de Libro

🔒 **Requiere autenticación**

**`POST /auth/admin/prestamos/libros/:id/devolver`**

Registra la devolución física del libro, cierra el préstamo y envía un correo de confirmación al alumno.

#### Path Variables

| Variable | Tipo | Descripción |
|----------|------|-------------|
| `id` | `integer` | ID del préstamo en `prestamos_libros` |

#### Body (JSON)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `observaciones` | `string` | No | Notas sobre el estado del libro al momento de la devolución |

```json
{
  "observaciones": "Libro devuelto en buen estado"
}
```

#### Respuesta Exitosa `200 OK`

```json
{
  "success": true,
  "message": "Préstamo marcado como devuelto correctamente"
}
```

#### Errores

| Código | Causa |
|--------|-------|
| `400 Bad Request` | El préstamo ya fue cerrado previamente |
| `401 Unauthorized` | Sesión inválida o expirada |
| `404 Not Found` | No existe un préstamo con el `id` proporcionado |
| `500 Internal Server Error` | Error al actualizar la base de datos o al enviar el correo |

---

## 7. Analytics

### 7.1 Estadísticas Generales

🔒 **Requiere autenticación**

**`GET /auth/admin/stats`**

Retorna conteos y métricas agregadas del sistema para el panel de control administrativo.

#### Respuesta Exitosa `200 OK`

```json
{
  "success": true,
  "data": {
    "totalUsuarios": 120,
    "totalLibros": 340,
    "totalPrestamosActivos": 18,
    "totalSolicitudesPendientes": 5,
    "totalComputadoras": 30,
    "totalRestiradores": 15
  }
}
```

#### Errores

| Código | Causa |
|--------|-------|
| `401 Unauthorized` | Sesión inválida o expirada |
| `500 Internal Server Error` | Error al ejecutar las consultas de agregación |

---

### 7.2 Tendencias de Uso

🔒 **Requiere autenticación**

**`GET /auth/admin/tendencias`**

Retorna datos de series de tiempo para graficar la actividad de préstamos y solicitudes a lo largo del tiempo.

#### Respuesta Exitosa `200 OK`

```json
{
  "success": true,
  "data": [
    { "mes": "2026-01", "prestamos": 45, "solicitudes": 60 },
    { "mes": "2026-02", "prestamos": 38, "solicitudes": 52 },
    { "mes": "2026-03", "prestamos": 51, "solicitudes": 70 }
  ]
}
```

#### Errores

| Código | Causa |
|--------|-------|
| `401 Unauthorized` | Sesión inválida o expirada |
| `500 Internal Server Error` | Error al consultar los datos históricos |

---

### 7.3 Actividad Reciente

🔒 **Requiere autenticación**

**`GET /auth/admin/actividad`**

Retorna los eventos más recientes del sistema (solicitudes, préstamos, devoluciones) para el panel de actividad en tiempo real.

#### Query Parameters

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `limite` | `integer` | `20` | Número de eventos a retornar |

**Ejemplo:** `GET /auth/admin/actividad?limite=10`

#### Respuesta Exitosa `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "tipo": "prestamo",
      "descripcion": "Préstamo de 'Cálculo Diferencial' entregado a Juan Pérez",
      "fecha": "2026-04-29T09:00:00-06:00",
      "boleta": 2023640100
    },
    {
      "tipo": "solicitud",
      "descripcion": "Nueva solicitud de computadora #205 por María García",
      "fecha": "2026-04-29T08:45:00-06:00",
      "boleta": 2023640101
    }
  ]
}
```

#### Errores

| Código | Causa |
|--------|-------|
| `401 Unauthorized` | Sesión inválida o expirada |
| `500 Internal Server Error` | Error al consultar la base de datos |

---

## Apéndice — Tabla de Referencia de Estados

### Estados de Solicitud (`estados_solicitud`)

| ID | Estado |
|----|--------|
| 1 | Pendiente |
| 2 | Aprobado |
| 3 | Rechazado |

### Estados de Asistencia (`estados_asistencia`)

| ID | Estado |
|----|--------|
| 1 | Pendiente |
| 2 | Presente |
| 3 | Ausente |

### Estados de Préstamo (`estados_prestamo`)

| ID | Estado |
|----|--------|
| 1 | Activo |
| 2 | Devuelto |
| 3 | Vencido |
