# Cambios Realizados: Eliminación de Funcionalidad de Computadoras y Restiradores

## Resumen
Se eliminó toda la funcionalidad relacionada con **computadoras** y **restiradores** tanto en el frontend como en el backend, dejando únicamente las funciones relacionadas con **libros**.

---

## Backend (`back/`)

### `back/src/routes/Rutas.js`
- Eliminadas rutas POST/PUT para `/admin/computadoras` y `/admin/restiradores`

### `back/src/controllers/ControladorAdministrador.js`
- Eliminadas las funciones: `crearComputadora`, `crearRestirador`, `actualizarComputadora`, `actualizarRestirador`
- Eliminados los casos `'computadoras'` y `'restiradores'` del switch en `eliminarMaterial`
- Eliminadas las importaciones de `CrearComputadora`, `CrearRestirador`, `eliminarComputadora`, `eliminarRestirador`, `actualizarDatosComputadora`, `actualizarDatosRestirador`
- Eliminadas las exportaciones correspondientes

### `back/src/controllers/ControladorSolicitudes.js`
- Cambiado `tipos` de `['computadora', 'restirador', 'libro']` a `['libro']`
- Eliminada la lógica de envío de correo para computadoras y restiradores

### `back/src/models/ModeloAdministrador.js`
- Eliminadas las funciones: `CrearComputadora`, `CrearRestirador`, `eliminarComputadora`, `eliminarRestirador`, `actualizarDatosComputadora`, `actualizarDatosRestirador`, `obtenerComputadoras`, `obtenerRestiradores`
- Eliminados los casos `'computadoras'` y `'restiradores'` del switch en `ObtenerMateriales`
- Eliminadas las exportaciones correspondientes

### `back/src/models/ModeloSolicitudes.js`
- Eliminadas las funciones: `CrearSolicitudComputadora`, `CrearSolicitudRestiradores`
- Eliminados los casos `'computadora'` y `'restirador'` de `CrearSolicitud`, `VerificarDisponibilidadRecurso`, `CancelarSolicitud`
- Eliminadas las funciones internas: `VerificarDisponibilidadComputadora`, `VerificarDisponibilidadRestirador`
- Simplificada la función `ObtenerSolicitudesActivasPorBoleta` para solo manejar libros
- Simplificada la función `getSolicitudes` para solo consultar `solicitudes_libros`
- Simplificada la función `anexarNumeroMaterialSolicitudes` para solo consultar ejemplares

### `back/src/models/ModeloRecursos.js`
- Eliminadas las funciones: `computadoras()`, `restiradores()`
- Eliminados los casos `'computadora'` y `'restirador'` del switch en `ObtenerRecurzos`

### `back/src/models/ModeloAnalytics.js`
- Eliminadas todas las referencias a `computadoras` y `restiradores`
- Simplificadas las consultas para solo usar `solicitudes_libros`, `ejemplares`, `prestamos_libros`

### `back/src/models/modeloVerificacionRecursos.js`
- Eliminadas las funciones: `verificarSolicitudRestirador`, `verificarSolicitudComputadora`
- Solo queda `verificarSolicitudLibro`

### `back/src/middleware/verificacionPeticiones.js`
- Cambiado `tipos` de `['computadora', 'restirador', 'libro']` a `['libro']`
- Eliminada la lógica de verificación para computadoras y restiradores

### `back/jobs/VerificacionAsistencia.js`
- Eliminadas las variables `Act_computadoras` y `Act_restiradores`
- Eliminados los bucles para verificar asistencia de computadoras y restiradores
- Simplificada la función `obtenerActividades` para solo consultar `solicitudes_libros`
- Simplificada la función `cancelarActividad` para solo manejar libros

### `back/src/test/modelsTest.js`
- Eliminada la función `modelComputadoras()` y su llamada

---

## Frontend (`frontend/`)

### Archivos eliminados
- `frontend/src/pages/admin/AltaComputadoras.jsx` (página completa de gestión de computadoras)
- `frontend/src/pages/admin/AltaRestiradores.jsx` (página completa de gestión de restiradores)
- `frontend/src/pages/user/SolicitudComputadoras.jsx` (página de solicitud de computadoras)
- `frontend/src/pages/user/SolicitudRestiradores.jsx` (página de solicitud de restiradores)

### `frontend/src/App.jsx`
- Eliminadas las importaciones de `SolicitudComputadoras`, `SolicitudRestiradores`, `AltaComputadoras`, `AltaRestiradores`
- Eliminadas las rutas `/user/computadoras`, `/user/restiradores`, `/admin/computadoras`, `/admin/restiradores`

### `frontend/src/api/admin.js`
- Eliminadas las funciones: `createComputer`, `createRestirador`, `updateComputer`, `updateRestirador`

### `frontend/src/components/layout/Navbar.jsx`
- Eliminados los enlaces de navegación para Computadoras y Restiradores (admin y usuario)
- Eliminados los iconos `Monitor` y `PenTool` de los imports

### `frontend/src/components/layout/Sidebar.jsx`
- Eliminados los enlaces de navegación para Computadoras y Restiradores (admin y usuario)
- Eliminados los iconos `Monitor` y `PenTool` de los imports

### `frontend/src/components/ui/CommandPalette.jsx`
- Eliminados los comandos para Computadoras y Restiradores (admin y usuario)

### `frontend/src/pages/admin/AdminHome.jsx`
- Eliminadas las tarjetas de estadísticas de Computadoras y Restiradores
- Eliminados los enlaces rápidos a Computadoras y Restiradores
- Eliminados los datos del gráfico circular para Computadoras y Restiradores
- Eliminados los iconos `Monitor` y `PenTool` de los imports

### `frontend/src/pages/admin/Analytics.jsx`
- Eliminadas las tarjetas de estadísticas de Computadoras y Restiradores
- Eliminados los datos del gráfico de disponibilidad para Computadoras y Restiradores
- Eliminados los datos del gráfico de distribución para Computadoras y Restiradores
- Eliminados los iconos `Monitor` y `PenTool` de los imports

### `frontend/src/pages/admin/Reportes.jsx`
- Eliminados los tipos de reporte para Computadoras y Restiradores
- Eliminadas las columnas de reporte para Computadoras y Restiradores
- Eliminada la carga de datos de Computadoras y Restiradores
- Eliminados los iconos `Monitor`, `PenTool`, `ClipboardList` de los imports

### `frontend/src/pages/user/MisSolicitudes.jsx`
- Cambiado el filtro de `s.tipo_solicitud !== 'libro'` a `s.tipo_solicitud === 'libro'`
- Eliminadas las opciones de filtro para Computadora y Restirador

### `frontend/src/pages/user/UserHome.jsx`
- Eliminadas las tarjetas de servicio para Computadoras y Restiradores
- Eliminados los iconos `Monitor` y `PenTool` de los imports
- Simplificada la lógica de `getEstadoStr`, `getTipoSolicitud`, `isActiva`
- Eliminada la constante `ESTADO_ASISTENCIA`

### `frontend/src/pages/user/UserProfile.jsx`
- Eliminadas las tarjetas de estadísticas para Computadoras y Restiradores
- Eliminados los iconos `Monitor` y `PenTool` de los imports

### `frontend/src/pages/Login.jsx`
- Cambiado el texto descriptivo de "Solicita computadoras, libros y restiradores" a "Solicita libros"

---

## Funcionalidad Preservada
Toda la funcionalidad relacionada con **libros** permanece intacta:
- Rutas CRUD de libros (`/admin/libros`)
- Rutas de solicitudes y préstamos de libros
- Modelos para libros, ejemplares, solicitudes_libros, prestamos_libros
- Páginas de frontend: AltaLibros, SolicitudLibros, SolicitudesLibros, PrestamosLibros, MisSolicitudesLibros
