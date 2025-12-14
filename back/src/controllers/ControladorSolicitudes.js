const { CrearSolicitud,CancelarSolicitud } = require("../models/ModeloSolicitudes");

const tipos = ['computadora', 'restirador', 'libro'];
async function crearSolicitud(req,res) {
    const { tipo ,boleta,idRecurso } = req.body;
    const regularExpression = /^[0-9 ]{10}$/;
    const regularExpressiontipo = /^[a-zA-Z]+$/;

    
    if (!tipo || !boleta || !idRecurso) {
        return res.status(400).json({ success: false, message: 'Faltan datos obligatorios' });
    }
    if (!regularExpression.test(boleta)) {
        return res.status(400).json({ success: false, message: 'La boleta debe ser un número válido de longitud 10' });
    }else if (!regularExpressiontipo.test(tipo).toLowerCase()) {
        return res.status(400).json({ success: false, message: 'El tipo de solicitud debe contener solo letras' });
    }else if (!Number.isInteger(idRecurso) || idRecurso <= 0) {
        return res.status(400).json({ success: false, message: 'El ID del recurso debe ser un número entero positivo' });
    }
    if (!tipos.includes(tipo)) {
        return res.status(400).json({ success: false, message: 'Tipo de solicitud inválido' });
    }
    await CrearSolicitud(tipo, boleta, idRecurso)
        .then((resultado) => {
            if (resultado.success) {
                return res.status(201).json({ success: true, message: 'Solicitud creada exitosamente' });
            } else {
                return res.status(500).json({ success: false, message: resultado.message || 'Error al crear la solicitud' });
            }
        })
        .catch((error) => {
            console.error('Error al crear la solicitud:', error);
            return res.status(500).json({ success: false, message: 'Error interno del servidor' });
        });

}
async function cancelarSolicitud(req,res) {
    const { tipo, ID } = req.body;
    if (!ID || !Number.isInteger(ID) || ID <= 0) {
        return res.status(400).json({ success: false, message: 'El ID de la solicitud debe ser un número entero positivo' });
    }
    const tipos = ['computadora', 'restirador', 'libro'];
    if (!tipo || !tipos.includes(tipo)) {
        return res.status(400).json({ success: false, message: 'Tipo de solicitud inválido' });
    }


    const resultado = await CancelarSolicitud(tipo, ID);
    if (resultado.success) {
        return res.status(200).json({ success: true, message: 'Solicitud cancelada exitosamente' });
    } else {
        return res.status(500).json({ success: false, message: resultado.message || 'Error al cancelar la solicitud' });
    }
}

async function obtenerSolicitudesUsuario(req, res) {
    const { boleta } = req.params;
    if (!boleta) {
        return res.status(400).json({ success: false, message: 'Falta la boleta del usuario' });
    }
    const resultado = await ObtenerSolicitudesUsuario(boleta);
    if (resultado.success) {
        return res.status(200).json({ success: true, solicitudes: resultado.solicitudes });
    } else {
        return res.status(500).json({ success: false, message: resultado.message || 'Error al obtener las solicitudes' });
    }
}   

module.exports = { crearSolicitud, cancelarSolicitud, obtenerSolicitudesUsuario };