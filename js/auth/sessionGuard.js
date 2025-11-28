// Guardia de sesión - Verifica autenticación en páginas protegidas

(function() {
    // Obtener la página actual
    const paginaActual = window.location.pathname;
    const esIndex = paginaActual.includes('index.html') || paginaActual.endsWith('/') || paginaActual.endsWith('/C-book-Proyecto/');
    const esRegistro = paginaActual.includes('registro.html');
    const esConfirmacion = paginaActual.includes('confirmacionCorreo.html');
    const esPaginaPublica = esIndex || esRegistro || esConfirmacion;

    // Verificar si hay sesión guardada
    const sessionData = localStorage.getItem('supabase_session');
    const userData = localStorage.getItem('user_data');

    let sesionValida = false;

    if (sessionData && userData) {
        try {
            const session = JSON.parse(sessionData);
            // Verificar si la sesión no ha expirado
            if (session.expires_at) {
                const expiresAt = new Date(session.expires_at * 1000);
                sesionValida = expiresAt > new Date();
            } else {
                sesionValida = true; // Asumir válida si no hay fecha
            }
        } catch (e) {
            console.error('Error parseando sesión:', e);
            sesionValida = false;
        }
    }

    console.log('SessionGuard - Página:', paginaActual, 'Sesión válida:', sesionValida); //debug

    // Si hay sesión activa
    if (sesionValida) {
        console.log('Usuario autenticado');
        
        // Si está en página pública (login/registro), redirigir a usuario.html
        if (esIndex || esRegistro) {
            window.location.href = './pantallasUs/usuario.html';
            return;
        }
    } else {
        // No hay sesión
        console.log('Sin sesión activa');
        
        // Si está en página protegida, redirigir a login
        if (!esPaginaPublica) {
            // Limpiar datos de sesión
            localStorage.removeItem('supabase_session');
            localStorage.removeItem('user_data');
            window.location.href = '../index.html';
            return;
        }
    }
})();
