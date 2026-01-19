/**
 * Middleware para verificar que el usuario tenga permisos de administrador
 * Soporta sistema unificado (req.session.user) y sistema legacy (req.session.admin)
 */
module.exports = async function adminGuard(req, res, next) {
  console.log("adminGuard - Verificando permisos de administrador");
  
  try {
    // Verificar si existe sesión de usuario (sistema unificado)
    const sessionUser = req.session.user;
    
    // Si no hay sesión de usuario, verificar sesión de admin (sistema legacy)
    const sessionAdmin = req.session.admin;
    
    // Si no hay ninguna sesión activa
    if (!sessionUser && !sessionAdmin) {
      console.log("adminGuard - No hay sesión activa");
      return res.status(401).json({ 
        success: false, 
        error: 'No hay sesión activa. Por favor inicia sesión.' 
      });
    }

    // Si hay sesión de usuario (sistema unificado)
    if (sessionUser) {
      // Verificar que tenga tipo de usuario administrador
      if (sessionUser.tipo_usuario !== 'administrador') {
        console.log("adminGuard - Usuario no es administrador:", sessionUser.tipo_usuario);
        return res.status(403).json({ 
          success: false, 
          error: 'No tienes permisos de administrador para realizar esta acción' 
        });
      }

      // Verificar que tenga boleta válida (10 dígitos)
      if (!sessionUser.boleta || !/^\d{10}$/.test(sessionUser.boleta)) {
        console.log("adminGuard - Boleta inválida");
        return res.status(401).json({ 
          success: false, 
          error: 'Sesión de administrador inválida' 
        });
      }

      console.log("adminGuard - Usuario autorizado como administrador:", sessionUser.boleta);
      
      // Guardar datos del admin en res.locals para uso en controladores
      res.locals.adminBoleta = sessionUser.boleta;
      res.locals.adminNombre = sessionUser.nombre;
      res.locals.adminEmail = sessionUser.email;
      
    } else if (sessionAdmin) {
      // Sistema legacy de admin
      console.log("adminGuard - Admin autorizado (sistema legacy):", sessionAdmin.identificador);
      
      // Guardar datos del admin legacy en res.locals
      res.locals.adminIdentificador = sessionAdmin.identificador;
      res.locals.adminRol = sessionAdmin.rol;
    }
    
    next();
  } catch (err) {
    console.error('Error en adminGuard:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Error validando permisos de administrador' 
    });
  }
};
