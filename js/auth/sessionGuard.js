// Guardia de sesión

(function() {
    // Detecta tipo de página actual (públicas vs protegidas)
    const paginaActual = window.location.pathname;
    const esIndex = paginaActual.includes('index.html') || paginaActual.endsWith('/') || paginaActual.endsWith('/C-book-Proyecto/');
    const esRegistro = paginaActual.includes('registro.html');
    const esConfirmacion = paginaActual.includes('confirmacion.html') || paginaActual.includes('confirmacionCorreo.html');
    const esPaginaPublica = esIndex || esRegistro || esConfirmacion;

    // Verificar sesión desde localStorage
    function obtenerUsuarioLocal() {
        const userData = localStorage.getItem('user_data');
        if (userData) {
            try {
                return JSON.parse(userData);
            } catch (e) {
                localStorage.removeItem('user_data');
                return null;
            }
        }
        return null;
    }

    // Función principal de control de navegación
    function aplicarReglasDeSesion() {
        const usuario = obtenerUsuarioLocal();
        const sesionValida = !!usuario;
        
        console.log('SessionGuard - Página:', paginaActual, '- Sesión:', sesionValida);

        if (sesionValida) {
            // Usuario autenticado: bloquear acceso a páginas públicas
            if (esPaginaPublica) {
                const destino = esIndex ? './pantallasUs/usuario.html' : '../pantallasUs/usuario.html';
                window.location.replace(destino);
                return;
            }

            // En páginas protegidas: impedir volver atrás
            try {
                history.pushState(null, document.title, window.location.href);
                window.addEventListener('popstate', function() {
                    window.location.replace(window.location.href);
                });
            } catch (err) {
                console.warn('No fue posible manipular el historial:', err);
            }
        } else {
            // Sin sesión: proteger páginas privadas
            if (!esPaginaPublica) {
                localStorage.removeItem('user_data');
                const destinoLogin = paginaActual.includes('/pantallasUs/') || paginaActual.includes('/PantallasAdmin/') 
                    ? '../index.html' 
                    : './index.html';
                window.location.replace(destinoLogin);
                return;
            }
        }
    }

    // Función global para obtener datos del usuario actual
    window.obtenerUsuarioActual = function() {
        return obtenerUsuarioLocal();
    };

    // Aplicar reglas al cargar
    aplicarReglasDeSesion();

    // Verificación periódica cada 30 segundos
    setInterval(aplicarReglasDeSesion, 30000);
})();
