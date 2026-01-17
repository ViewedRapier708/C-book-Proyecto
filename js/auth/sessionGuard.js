// Guardia de sesión sincronizada con el backend

(async function() {
    const API_BASE = window.API_BASE_URL || 'http://localhost:3000';

    const paginaActual = window.location.pathname;
    const esIndex = paginaActual.includes('index.html') || paginaActual.endsWith('/') || paginaActual.endsWith('/C-book-Proyecto/');
    const esRegistro = paginaActual.includes('registro.html');
    const esConfirmacion = paginaActual.includes('confirmacion.html') || paginaActual.includes('confirmacionCorreo.html');
    const esPaginaPublica = esIndex || esRegistro || esConfirmacion;
    const esPaginaAdmin = paginaActual.includes('/PantallasAdmin/');
    const esPaginaUsuario = paginaActual.includes('/pantallasUs/');

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

        console.log('SessionGuard - Página:', paginaActual, '- Sesión:', sesionValida, '- Usuario:', usuario);

        if (sesionValida) {
            const esAdmin = usuario.tipo_usuario === 'administrador';

            // Si está en página pública, redirigir a su dashboard
            if (esPaginaPublica) {
                let destino;
                if (esAdmin) {
                    destino = esIndex ? './PantallasAdmin/admin.html' : '../PantallasAdmin/admin.html';
                } else {
                    destino = esIndex ? './pantallasUs/usuario.html' : '../pantallasUs/usuario.html';
                }
                window.location.replace(destino);
                return;
            }

            // Verificar que el usuario esté en la sección correcta
            if (esAdmin && esPaginaUsuario) {
                // Admin intentando acceder a páginas de usuario
                window.location.replace('../PantallasAdmin/admin.html');
                return;
            }

            if (!esAdmin && esPaginaAdmin) {
                // Usuario normal intentando acceder a páginas de admin
                alert('Acceso denegado. No tienes permisos de administrador.');
                window.location.replace('../pantallasUs/usuario.html');
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
