//restirador:IDreg,semestre,grupo,hora_solicitud,numeroRestirador,estado
//computadora:IDreg,semestre,grupo,hora_solicitud,estado,computadoraID
//libro:IDreg,semestre,grupo,hora_solicitud,estado,libroID
//Esta funcion hace que cambie los estados de los materiales al momento de hacer una solicitud ejemplo si un restirador esta disponible pasa a ocupado
<<<<<<< HEAD

async function RegistroSolicitud(req, res) {
    const { IDreg, semestre, grupo, hora_solicitud, tipo_material, estado, materialID } = req.body;

   // Aquí iría la lógica para registrar la solicitud en la base de datos

   return res.status(200).json({ success: true, message: 'Solicitud registrada', data: req.body });
}


module.exports = { RegistroSolicitud };
=======
async function RegistroUsuario(req, res) {

    return res.status(200).json(req.body);
}
//Esta funcion registra la solicitud en la base de datos 
async function ActualizarMateriales(req, res) {

    return res.status(200).json({ success: true, message: 'Función de actualización de materiales en desarrollo' });
}   


module.exports = { RegistroUsuario, ActualizarMateriales };
>>>>>>> 51d369c53e37d0f6b32cb768ddf4dfc8cedd9e2b
