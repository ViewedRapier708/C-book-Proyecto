// Guardia de sesión - Adaptado para desarrollo y producción
// En desarrollo usa localStorage, en producción verifica contra backend

(function() {
    // Detectar entorno
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    const API_URL = isProduction 
        ? 'https://tu-backend-en-produccion.com'  // Cambiar por URL real del backend
        : 'http://localhost:3000';

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

    // Verificar sesión contra el backend (para producción con cookies)
    async function verificarSesionBackend() {
        try {
            const res = await fetch(`${API_URL}/auth/sesion`, {
                method: 'GET',
                credentials: 'include'
            });
            const data = await res.json();
            if (data.autenticado && data.user) {
                // Sincronizar con localStorage
                localStorage.setItem('user_data', JSON.stringify(data.user));
                return data.user;
            }
            return null;
        } catch (err) {
            console.error('Error verificando sesión con backend:', err);
            return null;
        }
    }

    // Obtener usuario según el entorno
    async function obtenerUsuario() {
        // Siempre verificar localStorage primero (más rápido)
        let usuario = obtenerUsuarioLocal();
        
        // En producción, también verificar con backend para sincronizar
        if (isProduction && !usuario) {
            usuario = await verificarSesionBackend();
        }
        
        return usuario;
    }

    // Función principal de control de navegación
    async function aplicarReglasDeSesion() {
        const usuario = await obtenerUsuario();
        const sesionValida = !!usuario;
        
        console.log('SessionGuard -', isProduction ? 'PROD' : 'DEV', '- Página:', paginaActual, '- Sesión:', sesionValida);

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

    // Función global para obtener la URL del API
    window.getApiUrl = function() {
        return API_URL;
    };

    // Aplicar reglas al cargar
    aplicarReglasDeSesion();

    // Verificación periódica cada 30 segundos
    setInterval(aplicarReglasDeSesion, 30000);
})();
