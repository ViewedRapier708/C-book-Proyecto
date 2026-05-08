const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verificarSesion, registro, verificarCorreo, login, cerrarSesion, CambioDatos, solicitarRecuperacion, actualizarContraseña } = require('../controllers/ControladorUsuario.js');
const { obtenerRecursosPorTipo} = require('../controllers/ControladorRecursos.js');
const middlewareAutenticacion = require('../middleware/verificacionPeticiones.js');
const controladorSolicitudes = require('../controllers/ControladorSolicitudes.js');
const controladorAdministrador = require('../controllers/ControladorAdministrador.js');
const controladorAnalytics = require('../controllers/ControladorAnalytics.js');
const sessionGuard = require('../middleware/sessionGuard.js');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });


router.post('/registro', registro);
router.post('/forgot-password', solicitarRecuperacion);
router.post('/reset-password', actualizarContraseña);
router.post('/verificar', verificarCorreo);
router.post('/login', login);
router.get('/session', verificarSesion);
router.post('/logout', sessionGuard, cerrarSesion);
router.get('/recursos', obtenerRecursosPorTipo);
router.get('/recursos/usuario', sessionGuard, controladorSolicitudes.obtencionSolicitudesUsuario);
router.post('/solicitud', sessionGuard,middlewareAutenticacion.verificarDisponibilidad,controladorSolicitudes.crearSolicitud);
router.delete('/solicitud/:tipo/:id', sessionGuard, controladorSolicitudes.cancelarSolicitud);
router.patch('/CuentaUpdate', sessionGuard, CambioDatos);
// ==================== RUTAS DE ADMINISTRADOR ====================

// Crear materiales
router.post('/admin/libros', sessionGuard, controladorAdministrador.crearLibro);
router.post('/admin/computadoras', sessionGuard, controladorAdministrador.crearComputadora);
router.post('/admin/restiradores', sessionGuard, controladorAdministrador.crearRestirador);

// Eliminar materiales
router.delete('/admin/materiales/:tipo/:id', sessionGuard, controladorAdministrador.eliminarMaterial);

// Actualizar materiales
router.put('/admin/libros', sessionGuard, controladorAdministrador.actualizarLibro);
router.put('/admin/computadoras', sessionGuard, controladorAdministrador.actualizarComputadora);
router.put('/admin/restiradores', sessionGuard, controladorAdministrador.actualizarRestirador);

// Obtener materiales
router.get('/admin/materiales/:tipo', sessionGuard, controladorAdministrador.obtenerMateriales);

// Usuarios (documentación)
router.get('/admin/usuarios', sessionGuard, controladorAdministrador.obtenerUsuarios);
router.put('/admin/usuarios/:id/habilitar', sessionGuard, controladorAdministrador.habilitarDocumentacion);

// Solicitudes y Préstamos
router.get('/admin/solicitudes/libros', sessionGuard, controladorAdministrador.obtenerSolicitudesLibros);
router.post('/admin/solicitudes/libros/:id/gestionar', sessionGuard, controladorAdministrador.gestionarSolicitud);
router.post('/admin/solicitudes/libros/:id/entregar', sessionGuard, controladorAdministrador.registrarEntrega);
router.get('/admin/prestamos/libros', sessionGuard, controladorAdministrador.obtenerPrestamosLibros);
router.post('/admin/prestamos/libros/:id/devolver', sessionGuard, controladorAdministrador.marcarPrestamoDevuelto);

// ==================== RUTAS DE BOLETAS ====================
// IMPORTANT: specific routes (/preview, /bulk) must come before parameterized (/:boleta)
router.get('/admin/boletas', sessionGuard, controladorAdministrador.obtenerBoletas);
router.post('/admin/boletas/preview', sessionGuard, upload.single('file'), controladorAdministrador.previewCargaMasiva);
router.post('/admin/boletas/bulk', sessionGuard, controladorAdministrador.confirmarCargaMasiva);
router.post('/admin/boletas', sessionGuard, controladorAdministrador.crearBoleta);
router.put('/admin/boletas/:boleta', sessionGuard, controladorAdministrador.actualizarBoleta);
router.delete('/admin/boletas/:boleta', sessionGuard, controladorAdministrador.eliminarBoleta);

// ==================== RUTAS DE ANALYTICS ====================
router.get('/admin/stats', sessionGuard, controladorAnalytics.obtenerEstadisticas);
router.get('/admin/tendencias', sessionGuard, controladorAnalytics.obtenerTendencias);
router.get('/admin/actividad', sessionGuard, controladorAnalytics.obtenerActividad);

module.exports = router;