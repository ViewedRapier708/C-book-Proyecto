const express = require('express');
const router = express.Router();
const { LoginUser, RegisterUser } = require('../controllers/ControladorUsuario.js');
const { obtenerRecursosPorTipo } = require('../controllers/ControladorRecursos.js');
const controladorSolicitudes = require('../controllers/ControladorSolicitudes.js');
const {verificarDisponibilidad} = require('../middleware/verificacionRecursos.js');
router.post('/login', LoginUser);
router.post('/register', RegisterUser);
router.get('/recursos', obtenerRecursosPorTipo);
//Lo que hace esta ruta es primero verificar la disponibilidad del recurso y despues manda a llamar al controlador de solicitudes para que registre la solicitud en la base de datos
//cuando se ingresa el dato a la base de datos se activa un trigger que cambia el estado del recurso a ocupado ,
router.post('/solicitud', verificarDisponibilidad, controladorSolicitudes.crearSolicitud);

module.exports = router;