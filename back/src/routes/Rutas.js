const express = require('express');
const router = express.Router();
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { verificarSesion, registro, verificarCorreo, confirmarRegistro, login, cerrarSesion, CambioDatos, solicitarRecuperacion, actualizarContraseña, cambiarContrasenaPropia, obtenerCorreoPorBoleta } = require('../controllers/ControladorUsuario.js');
const { obtenerRecursosPorTipo, obtenerLibrosMasSolicitados } = require('../controllers/ControladorRecursos.js');
const middlewareAutenticacion = require('../middleware/verificacionPeticiones.js');
const controladorSolicitudes = require('../controllers/ControladorSolicitudes.js');
const controladorAdministrador = require('../controllers/ControladorAdministrador.js');
const controladorAnalytics = require('../controllers/ControladorAnalytics.js');
const controladorSoporte = require('../controllers/ControladorSoporte.js');
const sessionGuard = require('../middleware/sessionGuard.js');
const adminGuard = require('../middleware/adminGuard.js');
const horarioGuard = require('../middleware/horarioGuard.js');

const limiterOpts = (max, windowMs, msg) => ({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: msg },
});

const loginLimiter = rateLimit(limiterOpts(10, 15 * 60 * 1000, 'Demasiados intentos de acceso, intenta de nuevo en 15 minutos'));
const forgotLimiter = rateLimit(limiterOpts(5, 15 * 60 * 1000, 'Demasiadas solicitudes de recuperación, intenta de nuevo en 15 minutos'));
const soporteLoginLimiter = rateLimit(limiterOpts(10, 15 * 60 * 1000, 'Demasiados intentos de acceso, intenta de nuevo en 15 minutos'));
const registroLimiter = rateLimit(limiterOpts(5, 60 * 60 * 1000, 'Demasiados registros desde esta IP, intenta más tarde'));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });


router.post('/registro', registroLimiter, registro);
router.post('/obtener-correo', sessionGuard, obtenerCorreoPorBoleta);
router.post('/forgot-password', forgotLimiter, solicitarRecuperacion);
router.post('/reset-password', actualizarContraseña);
router.post('/confirmar-registro', confirmarRegistro);
router.post('/verificar', verificarCorreo);
router.post('/login', loginLimiter, login);
router.get('/session', verificarSesion);
router.post('/logout', sessionGuard, cerrarSesion);
router.get('/recursos', obtenerRecursosPorTipo);
router.get('/libros/mas-solicitados', sessionGuard, obtenerLibrosMasSolicitados);
router.get('/recursos/usuario', sessionGuard, controladorSolicitudes.obtencionSolicitudesUsuario);
router.post('/solicitud', sessionGuard, horarioGuard, middlewareAutenticacion.verificarDisponibilidad, controladorSolicitudes.crearSolicitud);
router.delete('/solicitud/:tipo/:id', sessionGuard, controladorSolicitudes.cancelarSolicitud);
router.patch('/CuentaUpdate', sessionGuard, CambioDatos);
router.post('/cambiar-contrasena', sessionGuard, cambiarContrasenaPropia);
// ==================== RUTAS DE ADMINISTRADOR ====================

// Crear materiales
router.post('/admin/libros/preview', sessionGuard, adminGuard, upload.single('file'), controladorAdministrador.previewCargaMasivaLibros);
router.post('/admin/libros/bulk', sessionGuard, adminGuard, controladorAdministrador.confirmarCargaMasivaLibros);
router.post('/admin/libros', sessionGuard, adminGuard, controladorAdministrador.crearLibro);

// Eliminar materiales
router.delete('/admin/materiales/:tipo/:id', sessionGuard, adminGuard, controladorAdministrador.eliminarMaterial);

// Actualizar materiales
router.put('/admin/libros', sessionGuard, adminGuard, controladorAdministrador.actualizarLibro);

// Obtener materiales
router.get('/admin/materiales/:tipo', sessionGuard, adminGuard, controladorAdministrador.obtenerMateriales);

// Usuarios (documentación)
router.get('/admin/usuarios', sessionGuard, adminGuard, controladorAdministrador.obtenerUsuarios);
router.put('/admin/usuarios/:id/habilitar', sessionGuard, adminGuard, controladorAdministrador.habilitarDocumentacion);

// Solicitudes y Préstamos
router.get('/admin/solicitudes/libros', sessionGuard, adminGuard, controladorAdministrador.obtenerSolicitudesLibros);
router.post('/admin/solicitudes/libros/:id/gestionar', sessionGuard, adminGuard, controladorAdministrador.gestionarSolicitud);
router.post('/admin/solicitudes/libros/:id/entregar', sessionGuard, adminGuard, controladorAdministrador.registrarEntrega);
router.get('/admin/prestamos/libros', sessionGuard, adminGuard, controladorAdministrador.obtenerPrestamosLibros);
router.post('/admin/prestamos/libros/:id/devolver', sessionGuard, adminGuard, controladorAdministrador.marcarPrestamoDevuelto);

// ==================== RUTAS DE BOLETAS ====================
// IMPORTANT: specific routes (/preview, /bulk) must come before parameterized (/:boleta)
router.get('/admin/boletas', sessionGuard, adminGuard, controladorAdministrador.obtenerBoletas);
router.post('/admin/boletas/preview', sessionGuard, adminGuard, upload.single('file'), controladorAdministrador.previewCargaMasiva);
router.post('/admin/boletas/bulk', sessionGuard, adminGuard, controladorAdministrador.confirmarCargaMasiva);
router.post('/admin/boletas', sessionGuard, adminGuard, controladorAdministrador.crearBoleta);
router.put('/admin/boletas/:boleta', sessionGuard, adminGuard, controladorAdministrador.actualizarBoleta);
router.delete('/admin/boletas/:boleta', sessionGuard, adminGuard, controladorAdministrador.eliminarBoleta);

// ==================== RUTAS DE ANALYTICS ====================
router.get('/admin/stats', sessionGuard, adminGuard, controladorAnalytics.obtenerEstadisticas);
router.get('/admin/tendencias', sessionGuard, adminGuard, controladorAnalytics.obtenerTendencias);
router.get('/admin/actividad', sessionGuard, adminGuard, controladorAnalytics.obtenerActividad);

// ==================== RUTAS DE SOPORTE ====================
router.post('/soporte/login', soporteLoginLimiter, controladorSoporte.loginSoporte);
router.get('/soporte/tipos', controladorSoporte.listarTipos);
router.post('/soporte/public/tickets', controladorSoporte.crearTicketPublico);
router.post('/soporte/tickets', sessionGuard, controladorSoporte.crearTicket);
router.get('/soporte/tickets', sessionGuard, controladorSoporte.listarTickets);
router.get('/soporte/tickets/:id', sessionGuard, controladorSoporte.obtenerTicket);
router.post('/soporte/tickets/:id/tomar', sessionGuard, controladorSoporte.tomarTicket);
router.patch('/soporte/tickets/:id/estado', sessionGuard, controladorSoporte.cambiarEstado);
router.post('/soporte/tickets/:id/comentarios', sessionGuard, controladorSoporte.agregarComentario);
router.post('/soporte/tickets/:id/tiempo', sessionGuard, controladorSoporte.registrarTiempo);
router.get('/soporte/dashboard', sessionGuard, controladorSoporte.dashboard);
router.get('/soporte/config', sessionGuard, controladorSoporte.configuracion);
router.get('/soporte/agentes', sessionGuard, controladorSoporte.listarAgentes);
router.post('/soporte/agentes', sessionGuard, controladorSoporte.crearAgente);

module.exports = router;
