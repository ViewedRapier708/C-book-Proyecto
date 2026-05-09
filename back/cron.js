const cron = require('node-cron');
const { verificarAsistencia } = require('./jobs/VerificacionAsistencia');

cron.schedule('*/10 * * * * *', async () => {
    try {
      await verificarAsistencia();
    } catch (err) {
      console.error('[Cron] Error en verificarAsistencia:', err);
    }
});


