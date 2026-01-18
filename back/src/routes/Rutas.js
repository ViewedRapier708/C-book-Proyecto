const express = require('express');
const router = express.Router();
const { verificarSesion,registro, verificarCorreo, login, cerrarSesion } = require('../controllers/ControladorUsuario.js');
const { obtenerRecursosPorTipo} = require('../controllers/ControladorRecursos.js');
const middlewareAutenticacion = require('../middleware/verificacionPeticiones.js');
const controladorSolicitudes = require('../controllers/ControladorSolicitudes.js');
const controladorAdministrador = require('../controllers/ControladorAdministrador.js');
const sessionGuard = require('../middleware/sessionGuard.js');


router.post('/registro', registro);
router.post('/verificar', verificarCorreo);
router.post('/login', login);
router.get('/session', verificarSesion);
router.post('/logout', sessionGuard, cerrarSesion);
router.get('/recursos', obtenerRecursosPorTipo);
router.get('/recursos/usuario', controladorSolicitudes.obtencionSolicitudesUsuario);
router.post('/solicitud', sessionGuard,middlewareAutenticacion.verificarDisponibilidad,controladorSolicitudes.crearSolicitud);
router.delete('/solicitud/:tipo/:id', sessionGuard, controladorSolicitudes.cancelarSolicitud);

// ==================== RUTAS DE ADMINISTRADOR ====================

// Crear materiales
router.post('/admin/libros', sessionGuard, controladorAdministrador.crearLibro);
router.post('/admin/computadoras', sessionGuard, controladorAdministrador.crearComputadora);
router.post('/admin/restiradores', sessionGuard, controladorAdministrador.crearRestirador);
router.post('/admin/guardarropas', sessionGuard, controladorAdministrador.crearGuardarropa);

// Eliminar materiales
router.delete('/admin/materiales/', sessionGuard, controladorAdministrador.eliminarMaterial);

// Actualizar materiales
router.put('/admin/libros', sessionGuard, controladorAdministrador.actualizarLibro);
router.put('/admin/computadoras', sessionGuard, controladorAdministrador.actualizarComputadora);
router.put('/admin/restiradores', sessionGuard, controladorAdministrador.actualizarRestirador);

// Obtener materiales
router.get('/admin/materiales/', sessionGuard, controladorAdministrador.obtenerMateriales);

module.exports = router;