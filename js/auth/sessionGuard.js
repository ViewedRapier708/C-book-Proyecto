// Guardia de sesión - Verificación constante en frontend (sin tocar backend)
// Objetivo: impedir navegar atrás a páginas públicas si el usuario tiene sesión
// y redirigir a login si está en páginas protegidas sin sesión.

(function() {
    // Detecta tipo de página actual (públicas vs protegidas)
    const paginaActual = window.location.pathname; // ruta actual del navegador
    const esIndex = paginaActual.includes('index.html') || paginaActual.endsWith('/') || paginaActual.endsWith('/C-book-Proyecto/'); // página de inicio/login
    const esRegistro = paginaActual.includes('registro.html'); // página de registro
    const esConfirmacion = paginaActual.includes('confirmacionCorreo.html'); // página de confirmación
    const esPaginaPublica = esIndex || esRegistro || esConfirmacion; // páginas accesibles sin sesión

    // Función auxiliar: evalúa si la sesión guardada en localStorage es válida
    function tieneSesionValida() {
        // Leemos la sesión y datos de usuario guardados por el login del backend
        const sessionData = localStorage.getItem('supabase_session');
        const userData = localStorage.getItem('user_data');

        let sesionValida = false;

        if (sessionData && userData) {
            try {
                const session = JSON.parse(sessionData);
                // Si hay timestamp de expiración, se compara contra el tiempo actual
                if (session.expires_at) {
                    const expiresAt = new Date(session.expires_at * 1000);
                    sesionValida = expiresAt > new Date();
                } else {
                    // Si no hay fecha, asumimos válida (backend controla vigencia)
                    sesionValida = true;
                }
            } catch (e) {
                // Si la sesión no se puede parsear, la invalidamos por seguridad
                console.error('Error parseando sesión:', e);
                sesionValida = false;
            }
        }

        return sesionValida;
    }

    // Función principal de control de navegación según estado de sesión
    function aplicarReglasDeSesion() {
        const sesionValida = tieneSesionValida();
        console.log('SessionGuard - Página:', paginaActual, 'Sesión válida:', sesionValida);

        if (sesionValida) {
            // Usuario autenticado: bloquear acceso a páginas públicas
            if (esPaginaPublica) {
                // Redirige siempre al dashboard del usuario
                // Nota: rutas relativas según ubicación del archivo
                const destino = esIndex ? './pantallasUs/usuario.html' : (esRegistro || esConfirmacion ? '../pantallasUs/usuario.html' : './pantallasUs/usuario.html');
                window.location.replace(destino);
                return;
            }

            // En páginas protegidas con sesión: impedir volver atrás a públicas
            // Empujamos un estado al historial y anulamos retroceso a públicas
            try {
                history.pushState(null, document.title, window.location.href);
                window.addEventListener('popstate', function(e) {
                    // Si intenta retroceder, re-enrutamos a la pantalla de usuario
                    const destinoUsuario = '../pantallasUs/usuario.html';
                    window.location.replace(destinoUsuario);
                });
            } catch (err) {
                console.warn('No fue posible manipular el historial:', err);
            }
        } else {
            // Usuario sin sesión: permitir páginas públicas y proteger privadas
            if (!esPaginaPublica) {
                // Limpieza defensiva del storage
                localStorage.removeItem('supabase_session');
                localStorage.removeItem('user_data');

                // Redirigir a login (index). Usar rutas relativas según ubicación
                const destinoLogin = paginaActual.includes('/pantallasUs/') ? '../index.html' : './index.html';
                window.location.replace(destinoLogin);
                return;
            }
        }
    }

    // Aplicación inicial de las reglas al cargar
    aplicarReglasDeSesion();

    // Verificación periódica: cada 15 segundos
    // Esto asegura que si la sesión expira o se cierra en otra pestaña,
    // la UI se actualiza y redirige apropiadamente.
    const INTERVALO_MS = 15000; // 15 segundos
    setInterval(aplicarReglasDeSesion, INTERVALO_MS);
})();
