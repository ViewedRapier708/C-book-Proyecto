const express = require('express');
const router = express.Router();
const { verificarSesion,registro, verificarCorreo, login, cerrarSesion } = require('../controllers/ControladorUsuario.js');
const { obtenerRecursosPorTipo} = require('../controllers/ControladorRecursos.js');
const middlewareAutenticacion = require('../middleware/verificacionPeticiones.js');
const controladorSolicitudes = require('../controllers/ControladorSolicitudes.js');
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

module.exports = router;