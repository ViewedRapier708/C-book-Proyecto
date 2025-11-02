
// Modelo para el registro de las solicitudes de recursos, este es el que se llama al controlador para registrar los datos
const modeloSolicitudes = {
    solicitudRestirador: async (IDreg,semestre,grupo,hora_solicitud,numeroRestirador,estado) => {
        const usoMaterial= await modeloUsoMaterial.solicitarRestirador(numeroRestirador);

   if(usoMaterial){
    const { getClient } = require('../config/db.js');
    const supabase = getClient();
    const { data, error } = await supabase
    .from('solicitud_restiradores')
    .insert([{ IDreg, semestre, grupo, hora_solicitud, numeroRestirador, estado }])
    .select()
    if(error){ return {error, data:null}; }
}
    
    },solicitudLibro: async (IDreg,semestre,grupo,hora_solicitud,estado,libroID) => {
    const { getClient } = require('../config/db.js');
    const supabase = getClient();
    const { data, error } = await supabase
    .from('solicitud_libros')
    .insert([{ IDreg, semestre, grupo, libroID, hora_solicitud, estado }])
    .select()

    if(error){ return {error, data:null}; }
    },solicitudComputadora: async (IDreg,semestre,grupo,hora_solicitud,estado,computadoraID) => {
    const { getClient } = require('../config/db.js');
    const supabase = getClient();
    const { data, error } = await supabase
    .from('solicitud_computadoras')
    .insert([{ IDreg, semestre, grupo, hora_solicitud,computadoraID, estado }])
    .select()
    if(error){ return {error, data:null}; }
}
}
/*Estos modelos funcionan correctamente*/
//Modelo para verificar la disponibilidad de los recursos esta funcion debe de ser la primera para hacer la solicitud
const modeloVerificacion = {
    verificarSolicitudRestirador: async (numeroRestirador) => {
    const { getClient } = require('../config/db.js');
    const supabase = getClient();
    const { data, error } = await supabase
    .from('restiradores')
    .select('id,ocupado')
    .eq('id', numeroRestirador).maybeSingle();
    if(error){ return {error, data:null}; }

    if(data.ocupado == true){
        return { error: new Error('Restirador no disponible'), data: null };
    }else{
        return { success: true, data: data };
    }
},verificarSolicitudComputadora: async (computadoraID) => {
    const { getClient } = require('../config/db.js');
    const supabase = getClient();
    const { data, error } = await supabase
    .from('computadoras')
    .select('id,ocupado')
    .eq('id', computadoraID).maybeSingle();

    if(error){ return {error, data:null}; }

    if(data.ocupado == true){
        return { error: new Error('Computadora no disponible'), data: null };
    }else{
                console.log("Computadora Disponible:"+data.id);
              return { success: true, data: data };

    }
},verificarSolicitudLibro: async (libroID) => {
    const { getClient } = require('../config/db.js');
    const supabase = getClient();
    const { data, error } = await supabase
    .from('libros')
    .select('id,cantidad_disponible')
    .eq('id', libroID).maybeSingle();
        console.log("Verificacion Libro:");
    if(error){ return {error, data:null}; }
    if(data.cantidad_disponible <= 0){
        return { error: new Error('Libro no disponible'), data: null };
    }else{
        console.log("Cantidad Disponible:"+data.cantidad_disponible);
              return { success: true, data: data };

    }
    

}
};

const modeloUsoMaterial = {
    solicitarRestirador: async (numeroRestirador) => {
        const { getClient } = require('../config/db.js');
        const supabase = getClient();
        const { data, error } = await supabase
        .from('restiradores')
        .update({ ocupado: true })
        .eq('id', numeroRestirador)
        .select()
    if(error){ return {error, data:null}; }else{return true}
},
    solicitarComputadora: async (computadoraID) => {
        const { getClient } = require('../config/db.js');
        const supabase = getClient();
        const { data, error } = await supabase
        .from('computadoras')
        .update({ ocupado: true })
        .eq('id', computadoraID)
        .select()
    if(error){ return {error, data:null}; }else{return true}
}, solicitarLibro: async (libroID) => {
    const cantidad_disponible = await modeloVerificacion.verificarSolicitudLibro(libroID);
        const { getClient } = require('../config/db.js');
        const supabase = getClient();
        const { data, error } = await supabase
        .from('libros')
        .update({ cantidad_disponible: cantidad_disponible-1 })
        .eq('id', libroID)
        .select()
    if(error){ return {error, data:null}; }else{return true}
}};
modeloVerificacion.verificarSolicitudLibro(1);
module.exports = { modeloSolicitudes, modeloVerificacion };