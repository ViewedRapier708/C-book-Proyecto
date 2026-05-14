// middlewares/verificacionMiddleware.js

const { ObtenerSolicitudesActivasPorBoleta } = require('../models/ModeloSolicitudes.js');
const { VerificarDisponibilidadRecurso } = require('../models/ModeloSolicitudes.js');

const tipos = ['libro'];

async function verificarDisponibilidad(req, res, next) {
    //Variable que se necesita para saber que tipo de material se esta solicitando
    const { tipo, idRecurso, boleta } = req.body;
    if (!idRecurso || !boleta || !tipo) {
        return res.status(400).json({
            success: false,
            error: 'Se requieren mas datos para procesar la solicitud porfavor verifique y vuelve a intentarlo'
        });
    }
    if (!tipos.includes(tipo)) {
        return res.status(400).json({
            success: false,
            error: 'Tipo de material invǭlido. Los tipos permitidos son: libro.'
        });
    }
    //Variables que se deben de verificar para que se pueda hacer la solicitud
    if (tipo === 'libro') {
        const numeroBoleta = Number(boleta);
        if (!Number.isInteger(numeroBoleta)) {
            return res.status(400).json({
                success: false,
                error: 'La boleta del usuario es invǭlida'
            });
        }
        // Ejecutar ambas verificaciones en paralelo para libros
        const [pendientes, disponibilidad] = await Promise.all([
            ObtenerSolicitudesActivasPorBoleta(tipo, numeroBoleta),
            VerificarDisponibilidadRecurso(tipo, idRecurso),
        ]);

        if (!pendientes.success) {
            return res.status(500).json({
                success: false,
                error: pendientes.error || 'No se pudo validar las solicitudes activas'
            });
        }

        if (pendientes.total >= 3) {
            return res.status(400).json({
                success: false,
                error: 'Ya tienes 3 solicitudes de libros activas. Debes concluir alguna antes de solicitar otro.'
            });
        }

        if (!disponibilidad.success) {
            return res.status(400).json({
                success: false,
                error: disponibilidad.message || 'Recurso no disponible'
            });
        }

        return next();
    }
}

module.exports = { verificarDisponibilidad };