# API de Administrador - C-Book Proyecto

## Configuración de Credenciales

Las credenciales del administrador se configuran mediante variables de entorno o valores por defecto:

**Credenciales por defecto:**
- **Identificador:** `1234567890` (10 dígitos)
- **Contraseña:** `admin123`

**Variables de entorno (opcional):**
```bash
ADMIN_IDENTIFICADOR=1234567890
ADMIN_PASSWORD=admin123
```

---

## Autenticación de Administrador

### 1. Login de Administrador
```
POST /admin/login
Content-Type: application/json

{
  "identificador": "1234567890",
  "password": "admin123"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Login de administrador exitoso",
  "data": {
    "identificador": "1234567890",
    "rol": "admin"
  }
}
```

### 2. Verificar Sesión de Administrador
```
GET /admin/session
```

### 3. Cerrar Sesión de Administrador
```
POST /admin/logout
```

---

## Rutas CRUD - Restiradores

### Obtener todos los restiradores
```
GET /admin/restiradores
```

### Crear restirador
```
POST /admin/restiradores
Content-Type: application/json

{
  "no_inventario": "INV-REST-001",
  "no_restirador": 1,
  "Observacion": "En buen estado"
}
```

### Actualizar restirador
```
POST /admin/restiradores/actualizar
Content-Type: application/json

{
  "id": 1,
  "no_inventario": "INV-REST-001",
  "no_restirador": 1,
  "Disponible": true,
  "estado_de_material": true,
  "Observacion": "Actualizado"
}
```

### Eliminar restirador
```
POST /admin/restiradores/eliminar
Content-Type: application/json

{
  "id": 1
}
```

---

## Rutas CRUD - Computadoras

### Obtener todas las computadoras
```
GET /admin/computadoras
```

### Crear computadora
```
POST /admin/computadoras
Content-Type: application/json

{
  "no_inventario": "INV-COMP-001",
  "no_computadora": 1,
  "procesador": "Intel Core i5",
  "programas": "AutoCAD, Revit, Office",
  "carrera": "Arquitectura",
  "Observacion": "Nueva"
}
```

### Actualizar computadora
```
POST /admin/computadoras/actualizar
Content-Type: application/json

{
  "id": 1,
  "no_inventario": "INV-COMP-001",
  "no_computadora": 1,
  "procesador": "Intel Core i7",
  "programas": "AutoCAD, Revit, Office, Photoshop",
  "carrera": "Arquitectura",
  "Disponible": true,
  "En_funcionamiento": true,
  "Observacion": "Actualizada"
}
```

### Eliminar computadora
```
POST /admin/computadoras/eliminar
Content-Type: application/json

{
  "id": 1
}
```

---

## Rutas CRUD - Libros

### Obtener todos los libros
```
GET /admin/libros
```

### Crear libro
```
POST /admin/libros
Content-Type: application/json

{
  "titulo": "Introducción a la Programación",
  "autor": "Juan Pérez",
  "clasificacion": "005.1",
  "isbn": "978-3-16-148410-0",
  "tipo_material": "Libro físico"
}
```

### Actualizar libro
```
POST /admin/libros/actualizar
Content-Type: application/json

{
  "id": 1,
  "titulo": "Introducción a la Programación - 2da Edición",
  "autor": "Juan Pérez",
  "clasificacion": "005.1",
  "isbn": "978-3-16-148410-0",
  "tipo_material": "Libro físico"
}
```

### Eliminar libro
```
POST /admin/libros/eliminar
Content-Type: application/json

{
  "id": 1
}
```

---

## Rutas CRUD - Guardaropas

### Obtener todos los guardaropas
```
GET /admin/guardaropas
```

### Crear guardaropa
```
POST /admin/guardaropas
Content-Type: application/json

{
  "id": 1
}
```
*Nota: Los campos `ocupado` y `estado` se inicializan automáticamente en `false` y `true` respectivamente.*

### Actualizar guardaropa
```
POST /admin/guardaropas/actualizar
Content-Type: application/json

{
  "id": 1,
  "ocupado": true,
  "estado": true
}
```

### Eliminar guardaropa
```
POST /admin/guardaropas/eliminar
Content-Type: application/json

{
  "id": 1
}
```

---

## Rutas de Solicitudes

### Obtener todas las solicitudes
```
GET /admin/solicitudes
```

### Obtener detalle de una solicitud
```
POST /admin/solicitudes/detalle
Content-Type: application/json

{
  "id": 1
}
```

### Aprobar solicitud
```
POST /admin/solicitudes/aprobar
Content-Type: application/json

{
  "id": 1
}
```

### Rechazar solicitud
```
POST /admin/solicitudes/rechazar
Content-Type: application/json

{
  "id": 1,
  "motivo": "No cumple con los requisitos"
}
```

### Cancelar solicitud
```
POST /admin/solicitudes/cancelar
Content-Type: application/json

{
  "id": 1,
  "motivo": "Cancelada por el administrador"
}
```

---

## Estadísticas

### Obtener estadísticas del sistema
```
GET /admin/estadisticas
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "recursos": {
      "computadoras": { "total": 50, "disponibles": 30, "ocupadas": 20 },
      "libros": { "total": 500, "disponibles": 400, "ocupadas": 100 },
      "restiradores": { "total": 30, "disponibles": 25, "ocupadas": 5 },
      "guardaropas": { "total": 100, "disponibles": 90, "ocupadas": 10 }
    },
    "solicitudes": {
      "pendientes": 15,
      "aprobadas": 100,
      "rechazadas": 5,
      "total": 120
    }
  }
}
```

---

## Estructura de Tablas en la Base de Datos

### Tabla: restiradores
```sql
- id (integer, PK)
- Disponible (boolean, default: true)
- estado_de_material (boolean, default: true)
- Observacion (text, default: 'N/A')
- no_inventario (varchar, unique)
- no_restirador (integer)
```

### Tabla: computadoras
```sql
- id (integer, PK)
- procesador (varchar)
- programas (varchar)
- carrera (varchar)
- Disponible (boolean, default: true)
- En_funcionamiento (boolean, default: true)
- Observacion (text)
- no_inventario (text, unique)
- no_computadora (bigint)
```

### Tabla: libros
```sql
- id (integer, PK)
- titulo (text)
- clasificacion (varchar)
- isbn (varchar)
- tipo_material (varchar)
- autor (varchar)
```

### Tabla: guardarropas
```sql
- id (integer, PK)
- ocupado (boolean)
- estado (boolean)
```

---

## Seguridad

- Todas las rutas de administrador están protegidas con el middleware `adminGuard`
- El administrador debe iniciar sesión antes de acceder a cualquier ruta CRUD
- La autenticación es local (no requiere base de datos)
- La sesión se almacena en `req.session.admin`
- El identificador debe tener exactamente 10 dígitos

---

## Notas Importantes

1. **Todas las operaciones de actualización y eliminación usan POST** con el ID en el body
2. **Los campos opcionales** se pueden omitir en las peticiones de creación
3. **Los campos booleanos** deben enviarse como `true` o `false` (no como strings)
4. **Los valores por defecto** se aplican automáticamente si no se especifican en la creación
