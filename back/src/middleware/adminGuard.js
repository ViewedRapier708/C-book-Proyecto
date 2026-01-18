/**
 * Middleware para verificar que el usuario tenga permisos de administrador
 * Verificación local sin acceso a base de datos
 */
module.exports = async function adminGuard(req, res, next) {
  console.log("adminGuard - Verificando permisos de administrador");
  
  try {
    // Verificar si existe sesión de administrador
    const sessionAdmin = req.session.admin;
    
    if (!sessionAdmin) {
      console.log("adminGuard - No hay sesión de administrador activa");
      return res.status(401).json({ 
        success: false, 
        error: 'No hay sesión de administrador activa. Por favor inicia sesión como administrador.' 
      });
    }

    // Verificar que tenga el rol correcto
    if (sessionAdmin.rol !== 'admin') {
      console.log("adminGuard - Rol inválido:", sessionAdmin.rol);
      return res.status(403).json({ 
        success: false, 
        error: 'No tienes permisos de administrador para realizar esta acción' 
      });
    }

    // Verificar que tenga identificador válido (10 dígitos)
    if (!sessionAdmin.identificador || !/^\d{10}$/.test(sessionAdmin.identificador)) {
      console.log("adminGuard - Identificador inválido");
      return res.status(401).json({ 
        success: false, 
        error: 'Sesión de administrador inválida' 
      });
    }

    console.log("adminGuard - Usuario autorizado como administrador:", sessionAdmin.identificador);
    
    // Guardar datos del admin en res.locals para uso en controladores
    res.locals.adminIdentificador = sessionAdmin.identificador;
    res.locals.adminRol = sessionAdmin.rol;
    
    next();
  } catch (err) {
    console.error('Error en adminGuard:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Error validando permisos de administrador' 
    });
  }
};
