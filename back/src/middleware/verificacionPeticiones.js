// middlewares/verificacionMiddleware.js

const { ObtenerSolicitudesActivasPorBoleta } = require('../models/ModeloSolicitudes.js');
const { VerificarDisponibilidadRecurso } = require('../models/ModeloSolicitudes.js');
// Middleware para verificar restirador

const tipos = ['computadora', 'restirador', 'libro'];

async function verificarDisponibilidad(req, res, next) {
    console.log("Middleware Verificacion de Recursos activado");
    console.log("Cuerpo de la solicitud:", req.body);
    //Variable que se necesita para saber que tipo de material se esta solicitando
    const { tipo, idRecurso, boleta } = req.body;
    if (!idRecurso || !boleta || !tipo) {
        console.log("Faltan datos en la solicitud:", { tipo, idRecurso, boleta });
        return res.status(400).json({
            success: false,
            error: 'Se requieren mas datos para procesar la solicitud porfavor verifique y vuelve a intentarlo'
        });
    }
    if (!tipos.includes(tipo)) {
        console.log("Tipo de material inválido:", tipo);
        return res.status(400).json({
            success: false,
            error: 'Tipo de material inválido. Los tipos permitidos son: computadora, restirador, libro.'
        });
    }
    //Variables que se deben de verificar para que se pueda hacer la solicitud
    console.log(`TipoMaterial recibido: ${tipo}`);



    if (tipo === 'computadora' || tipo === 'restirador') {
        const numeroBoleta = Number(boleta);
        if (!Number.isInteger(numeroBoleta)) {
            return res.status(400).json({
                success: false,
                error: 'La boleta del usuario es inválida'
            });
        }
        const pendientes = await ObtenerSolicitudesActivasPorBoleta(tipo, numeroBoleta);//Verificar si tiene solicitudes activas del usuario

        if (!pendientes.success) {
            return res.status(500).json({
                success: false,
                error: pendientes.error || 'No se pudo validar las solicitudes activas'
            });
        }

        if (pendientes.total > 0 && (tipo === 'computadora' || tipo === 'restirador')) {
            return res.status(400).json({
                success: false,
                error: 'Ya tienes una solicitud activa pendiente. Debes concluirla antes de generar otra.'
            });
        } else if (pendientes.total < 0) {
            return res.status(500).json({
                success: false,
                error: 'Error al verificar las solicitudes activas'
            });
        } else if (pendientes.total === 2 && tipo === 'libro') {

        }
    }
    //Verificar disponibilidad del recurso segun el tipo
    const disponibilidad = await VerificarDisponibilidadRecurso(tipo, idRecurso); //Verificar si el recurso esta disponible
    console.log("Resultado de disponibilidad:", disponibilidad);
    if (disponibilidad.success === true && disponibilidad.message == null) {

        next();
    }
    if (disponibilidad.success === false) {
        return res.status(400).json({
            success: false,
            error: disponibilidad.message || 'Recurso no disponible'
        });
    }
}

module.exports = { verificarDisponibilidad };