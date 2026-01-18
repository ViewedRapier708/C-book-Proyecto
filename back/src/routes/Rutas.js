const express = require('express');
const router = express.Router();
const { verificarSesion,registro, verificarCorreo, login, cerrarSesion } = require('../controllers/ControladorUsuario.js');
const { obtenerRecursosPorTipo} = require('../controllers/ControladorRecursos.js');
const middlewareAutenticacion = require('../middleware/verificacionPeticiones.js');
const controladorSolicitudes = require('../controllers/ControladorSolicitudes.js');
const controladorAdministrador = require('../controllers/ControladorAdministrador.js');
const sessionGuard = require('../middleware/sessionGuard.js');
const adminGuard = require('../middleware/adminGuard.js');


router.post('/registro', registro);
router.post('/verificar', verificarCorreo);
router.post('/login', login);
router.get('/session', verificarSesion);
router.post('/logout', sessionGuard, cerrarSesion);
router.get('/recursos', obtenerRecursosPorTipo);
router.get('/recursos/usuario', controladorSolicitudes.obtencionSolicitudesUsuario);
router.post('/solicitud', sessionGuard,middlewareAutenticacion.verificarDisponibilidad,controladorSolicitudes.crearSolicitud);
router.delete('/solicitud/:tipo/:id', sessionGuard, controladorSolicitudes.cancelarSolicitud);

// ==================== AUTENTICACIÓN DE ADMINISTRADOR ====================
router.post('/admin/login', controladorAdministrador.loginAdministrador);
router.post('/admin/logout', adminGuard, controladorAdministrador.cerrarSesionAdministrador);
router.get('/admin/session', controladorAdministrador.verificarSesionAdministrador);

// ==================== RUTAS DE ADMINISTRADOR ====================
// Restiradores
router.get('/admin/restiradores', adminGuard, controladorAdministrador.obtenerRestiradores);
router.post('/admin/restiradores', adminGuard, controladorAdministrador.crearRestirador);
router.post('/admin/restiradores/actualizar', adminGuard, controladorAdministrador.actualizarRestirador);
router.post('/admin/restiradores/eliminar', adminGuard, controladorAdministrador.eliminarRestirador);

// Computadoras
router.get('/admin/computadoras', adminGuard, controladorAdministrador.obtenerComputadoras);
router.post('/admin/computadoras', adminGuard, controladorAdministrador.crearComputadora);
router.post('/admin/computadoras/actualizar', adminGuard, controladorAdministrador.actualizarComputadora);
router.post('/admin/computadoras/eliminar', adminGuard, controladorAdministrador.eliminarComputadora);

// Libros
router.get('/admin/libros', adminGuard, controladorAdministrador.obtenerLibros);
router.post('/admin/libros', adminGuard, controladorAdministrador.crearLibro);
router.post('/admin/libros/actualizar', adminGuard, controladorAdministrador.actualizarLibro);
router.post('/admin/libros/eliminar', adminGuard, controladorAdministrador.eliminarLibro);

// Guardaropas
router.get('/admin/guardaropas', adminGuard, controladorAdministrador.obtenerGuardaropas);
router.post('/admin/guardaropas', adminGuard, controladorAdministrador.crearGuardaropa);
router.post('/admin/guardaropas/actualizar', adminGuard, controladorAdministrador.actualizarGuardaropa);
router.post('/admin/guardaropas/eliminar', adminGuard, controladorAdministrador.eliminarGuardaropa);

// Solicitudes
router.get('/admin/solicitudes', adminGuard, controladorAdministrador.obtenerSolicitudes);
router.post('/admin/solicitudes/detalle', adminGuard, controladorAdministrador.obtenerSolicitudPorId);
router.post('/admin/solicitudes/aprobar', adminGuard, controladorAdministrador.aprobarSolicitud);
router.post('/admin/solicitudes/rechazar', adminGuard, controladorAdministrador.rechazarSolicitud);
router.post('/admin/solicitudes/cancelar', adminGuard, controladorAdministrador.cancelarSolicitud);

// Estadísticas
router.get('/admin/estadisticas', adminGuard, controladorAdministrador.obtenerEstadisticas);

module.exports = router;