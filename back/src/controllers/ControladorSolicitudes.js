//restirador:IDreg,semestre,grupo,hora_solicitud,numeroRestirador,estado
//computadora:IDreg,semestre,grupo,hora_solicitud,estado,computadoraID
//libro:IDreg,semestre,grupo,hora_solicitud,estado,libroID
//Esta funcion hace que cambie los estados de los materiales al momento de hacer una solicitud ejemplo si un restirador esta disponible pasa a ocupado
async function RegistroUsuario(req, res) {

    return res.status(200).json(req.body);
}
//Esta funcion registra la solicitud en la base de datos 
async function ActualizarMateriales(req, res) {

    return res.status(200).json({ success: true, message: 'Función de actualización de materiales en desarrollo' });
}   


module.exports = { RegistroUsuario, ActualizarMateriales };
