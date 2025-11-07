
//Se debe crear una funcion para que se haga el registro de las solicitudes en la base de datos los datos que se ingresan a la solicitud son los siguientes
//semestre,grupo,id de registro, id del material solicitado

//en caso que no se nos permita pedir los datos de grupo y carrera del alumno se quitan estos campos de la solicitud y se quita los campos en la base de datos
//El tipo de material puede ser restirador, computadora o libro, este se saca dependiendo de que pantalla se haga la solicitud
async function solicitudes(ID_registro,ID_Material,tipo,carrera,grupo,semestre){
    console.log('andamo en solicitudes si paso lo anterior');
    console.log("Modelo Solicitudes:", ID_registro, ID_Material, tipo, carrera, grupo, semestre);
    const { getClient } = require('../config/db');
    const supabase = getClient();
    const { data, error } = await supabase
    .from('solicitudes')
    .insert([{registro_id:ID_registro,semestre:semestre,grupo:grupo,carrera:carrera,recurso_id:ID_Material,tipo:tipo}])
    .select()
    if(error){ return {error, messaje:"Error al crear la solicitud"}; }
    return {error:null, data};
}



module.exports = { solicitudes};