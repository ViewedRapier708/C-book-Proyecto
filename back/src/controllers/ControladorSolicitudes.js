async function RegistroMateriales(req, res) {
   const modelosSolicitudes = require('../models/ModeloSolicitudes');
   const { TipoMaterial, IDMaterial} = req.body;
    switch (TipoMaterial) {
        case 'restirador':
            var resultado = await modelosSolicitudes.modeloVerificacion.verificarSolicitudRestirador(IDMaterial);
             if (resultado) {
            
            }
       case 'computadora':
            var resultado = await modelosSolicitudes.modeloVerificacion.verificarSolicitudComputadora(IDMaterial);
            if (resultado) {
            
            }
        case 'libro':
            var resultado = await modelosSolicitudes.modeloVerificacion.verificarSolicitudLibro(IDMaterial);

            if (resultado) {
              
            }
    }
}
