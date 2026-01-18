const cron = require('node-cron');

<<<<<<< HEAD

cron.schedule('*/10 * * * * *', () => {
  //Se tiene que verificar si el alumno asistio a la actividad programada y en caso que la fecha de la actividad ya haya pasado, se le debe cambiar el estado a "no asistio"
    //esto cancelara la peticion y se liberara el espacio en la actividad
=======
// Importa el job (tu función) y ejecútalo desde el cron
const { verificarAsistencia } = require('./jobs/VerificacionAsistencia');


cron.schedule('*/10 * * * * *', async () => {
  //Se tiene que verificar si el alumno asistio a la actividad programada y en caso que la fecha de la actividad ya haya pasado, se le debe cambiar el estado a "no asistio"
    //esto cancelara la peticion y se liberara el espacio en la actividad

    try {
      await verificarAsistencia();
    } catch (err) {
      console.error('[Cron] Error en verificarAsistencia:', err);
    }
>>>>>>> 1a1caeb681b5f56f22bb59c4f76f7bdc8d624129
});
