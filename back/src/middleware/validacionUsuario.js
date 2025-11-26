
async function verificarBoleta(req, res, next) {
    const {getClient} = require('../config/supabaseClient.js');
    try {
        const { boleta } = req.body;
        const supabase = getClient();
        const { data, error } = await supabase.from('auth.users').select('user_metadata').eq('user_metadata->boleta', boleta);
        console.log("Verificacion de boleta en middleware:", data); // Debug
        if (error) {    
            return res.status(400).json({ component: 'Error al verificar boleta' });
        }




        next();
        
    } catch (error) {
        console.error('Error en middleware verificarRestirador:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor durante la verificación' 
        });
    }
};

module.exports = { verificarRestirador };