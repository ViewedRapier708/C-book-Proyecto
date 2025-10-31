

async function obtenerRecursosPorTipo(req, res) {
const modelosRecursos = require("../models/ModeloRecursos");
    const { tipo } = req.body;

   if (!tipo) {
       return res.status(400).json({ error: 'Falta el parámetro tipo' + tipo });
   }
   if(tipo==="computadoras"){
            const { error, data } = await modelosRecursos.obtenerComputadoras();
        if (error) {
            return res.status(500).json({ error: 'Error al obtener los recursos por tipo' });
        }
        return res.status(200).json({ recursos: data });
   } else if(tipo==="restiradores"){
       const { error, data } = await modelosRecursos.obtenerRestiradores;
       if (error) {
           return res.status(500).json({ error: 'Error al obtener los recursos por tipo' });
       }
       return res.status(200).json({ recursos: data });
   }else if(tipo==="libros"){
       const { error, data } = await modelosRecursos.obtenerLibros();
       if (error) {
           return res.status(500).json({ error: 'Error al obtener los recursos por tipo' });
       }
       return res.status(200).json({ recursos: data });
   }

}

module.exports = { obtenerRecursosPorTipo };