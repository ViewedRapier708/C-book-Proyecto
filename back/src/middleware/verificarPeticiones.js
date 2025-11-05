
//Esta funcion se encarga de verificar las solicitudes que se hacen a la hora de pedir un recurso, en caso que se detecte que hay alguna peticion y se quiera hacer una nueva
//se debe de rechazar la solicitud y mandar un mensaje de error al usuario que no se pueden hacer 2 solicitudes de los lugares de la biblioteca
async function verificarSolicitudes(req, res, next) {
 /*Se necesita hacer una consulta a la base de datos de solicitudes y verificar si ya existe una solicitud activa de algun recurso*/





}


//Esta funcion se encarga en verificar que el alumno no haya pedido mas de 3 libros en caso que se intent pedir un cuarto mostrar un error
async function verificarLibrosSolicitados(req, res, next) {
    /*Necesito hacer una consulta a la base de datos de solicitudes y hacer la suma de las solicitudes de libros del alumno activas*/

    next();
}