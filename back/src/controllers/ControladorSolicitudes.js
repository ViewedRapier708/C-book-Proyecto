//restirador:IDreg,semestre,grupo,hora_solicitud,,estado,IDrestirador
//computadora:IDreg,semestre,grupo,hora_solicitud,estado,computadoraID
//libro:IDreg,semestre,grupo,hora_solicitud,estado,libroID
//Esta funcion hace que cambie los estados de los materiales al momento de hacer una solicitud ejemplo si un restirador esta disponible pasa a ocupado
async function crearSolicitud(req,res) {
    const modeloSolicitudes = require('../models/ModeloSolicitudes');
    const {ID_registro,ID_Material,tipo} = req.body;
    const result = await modeloSolicitudes.solicitudes(ID_registro,ID_Material,tipo);

    //Mensaje en base al error que arroje la base de datos
    if (result.error) {
        return res.status(400).json({ error: result.error});
    }

}


module.exports = { crearSolicitud };
