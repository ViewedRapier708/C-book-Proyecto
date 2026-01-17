const { modeloVerificacion } = require('../models/modeloVerificacionRecursos.js');

const verificarDisponibilidad = async (req, res, next) => {
    try {
        const { tipo, id } = req.body;

        if (!tipo || !id) {
            return res.status(400).json({ error: 'Tipo y ID son requeridos' });
        }

        let resultado;

        switch (tipo.toLowerCase()) {
            case 'restirador':
                resultado = await modeloVerificacion.verificarSolicitudRestirador({ id });
                break;
            case 'computadora':
                resultado = await modeloVerificacion.verificarSolicitudComputadora({ id });
                break;
            case 'libro':
                resultado = await modeloVerificacion.verificarSolicitudLibro({ id });
                break;
            default:
                return res.status(400).json({ error: 'Tipo de recurso no válido' });
        }

        if (resultado.error) {
            return res.status(400).json({ error: resultado.error.message || resultado.error });
        }

        if (!resultado.success && !resultado.cantidad_disponible && resultado.mensaje) {
            return res.status(400).json({ error: resultado.mensaje });
        }

        // Si la verificación fue exitosa, continuar con el siguiente middleware
        next();
    } catch (error) {
        console.error('Error en verificarDisponibilidad:', error);
        res.status(500).json({ error: 'Error al verificar disponibilidad del recurso' });
    }
};

module.exports = { verificarDisponibilidad };
