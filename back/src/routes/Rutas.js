const express = require('express');
const router = express.Router();
const { LoginUser, RegisterUser } = require('../controllers/ControladorUsuario.js');
const { obtenerRecursosPorTipo } = require('../controllers/ControladorRecursos.js');
const controladorSolicitudes = require('../controllers/ControladorSolicitudes.js');
const {verificarDisponibilidad} = require('../middleware/verificacionRecursos.js');
router.post('/login', LoginUser);
router.post('/register', RegisterUser);
router.get('/recursos', obtenerRecursosPorTipo);
//Necesitamos hacer 2 rutas una que haga el registro de los datos del usuario y otra que haga el cambio de los datos en la db
router.post('/solicitud', verificarDisponibilidad, controladorSolicitudes.RegistroUsuario);
router.put('/solicitud', verificarDisponibilidad, controladorSolicitudes.ActualizarMateriales);
module.exports = router;