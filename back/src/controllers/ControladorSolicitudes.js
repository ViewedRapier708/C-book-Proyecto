//restirador:IDreg,semestre,grupo,hora_solicitud,numeroRestirador,estado
//computadora:IDreg,semestre,grupo,hora_solicitud,estado,computadoraID
//libro:IDreg,semestre,grupo,hora_solicitud,estado,libroID
//Esta funcion hace que cambie los estados de los materiales al momento de hacer una solicitud ejemplo si un restirador esta disponible pasa a ocupado

async function RegistroSolicitud(req, res) {
    const { IDreg, semestre, grupo, hora_solicitud, tipo_material, estado, materialID } = req.body;

   // Aquí iría la lógica para registrar la solicitud en la base de datos

   return res.status(200).json({ success: true, message: 'Solicitud registrada', data: req.body });
}


module.exports = { RegistroSolicitud };