// Guardia de sesión sincronizada con el backend

(async function() {
    const API_BASE = window.API_BASE_URL || 'http://localhost:3000';

    const paginaActual = window.location.pathname;
    const esIndex = paginaActual.includes('index.html') || paginaActual.endsWith('/') || paginaActual.endsWith('/C-book-Proyecto/');
    const esRegistro = paginaActual.includes('registro.html');
    const esConfirmacion = paginaActual.includes('confirmacion.html') || paginaActual.includes('confirmacionCorreo.html');
    const esPaginaPublica = esIndex || esRegistro || esConfirmacion;

    function obtenerUsuarioLocal() {
        const userData = localStorage.getItem('user_data');
        if (!userData) {
            return null;
        }
        try {
            return JSON.parse(userData);
        } catch (e) {
            localStorage.removeItem('user_data');
            return null;
        }
    }

    function guardarUsuarioLocal(user) {
        if (user) {
            localStorage.setItem('user_data', JSON.stringify(user));
        } else {
            localStorage.removeItem('user_data');
        }
    }

    async function obtenerUsuarioServidor() {
        try {
            const respuesta = await fetch(`${API_BASE}/auth/session`, {
                credentials: 'include'
            });

            if (!respuesta.ok) {
                guardarUsuarioLocal(null);
                return null;
            }

            const payload = await respuesta.json();
            if (payload.autenticado && payload.user) {
                guardarUsuarioLocal(payload.user);
                return payload.user;
            }

            guardarUsuarioLocal(null);
            return null;
        } catch (error) {
            console.warn('No se pudo sincronizar la sesión con el servidor:', error);
            return obtenerUsuarioLocal();
        }
    }

    async function aplicarReglasDeSesion() {
        const usuario = await obtenerUsuarioServidor();
        const sesionValida = !!usuario;

        console.log('SessionGuard - Página:', paginaActual, '- Sesión:', sesionValida);

        if (sesionValida) {
            if (esPaginaPublica) {
                const destino = esIndex ? './pantallasUs/usuario.html' : '../pantallasUs/usuario.html';
                window.location.replace(destino);
                return;
            }

            try {
                history.pushState(null, document.title, window.location.href);
                window.addEventListener('popstate', function() {
                    window.location.replace(window.location.href);
                });
            } catch (err) {
                console.warn('No fue posible manipular el historial:', err);
            }
        } else if (!esPaginaPublica) {
            guardarUsuarioLocal(null);
            alert('Su sesión ha expirado. Por favor, inicie sesión de nuevo.');
            const destinoLogin = paginaActual.includes('/pantallasUs/') || paginaActual.includes('/PantallasAdmin/') 
                ? '../index.html' 
                : './index.html';
            window.location.replace(destinoLogin);
        }
    }

    window.obtenerUsuarioActual = function() {
        return obtenerUsuarioLocal();
    };

    await aplicarReglasDeSesion();
    setInterval(aplicarReglasDeSesion, 30000);
})();
