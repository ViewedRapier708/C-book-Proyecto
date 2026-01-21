// Guardia de sesión: consulta al backend usando la cookie de sesión

(async function() {
    // Llamadas al backend siempre en el mismo origen (localhost:3000)
    // Usamos rutas relativas, no necesitamos API_BASE.

    const paginaActual = window.location.pathname;

    // Soporte cuando el proyecto se sirve bajo subcarpeta (ej: /C-book-Proyecto/)
    const basePrefix = paginaActual.includes('/C-book-Proyecto/') ? '/C-book-Proyecto' : '';
   

    // Páginas públicas: se puede entrar sin iniciar sesión
    const esIndex = paginaActual.includes('index.html') || paginaActual.endsWith('/') || paginaActual.endsWith('/C-book-Proyecto/');
    const esRegistro = paginaActual.includes('registro.html');
    const esConfirmacion = paginaActual.includes('confirmacionCorreo.html');
    const esPaginaPublica = esIndex || esRegistro || esConfirmacion;

    // Parámetros de espera para darle tiempo a la cookie de sesión
    const ESPERA_INICIAL_MS = 100;          // espera antes del primer intento
    const REINTENTOS_MAX = 2;               // número de reintentos adicionales
    const ESPERA_ENTRE_REINTENTOS_MS = 500; // espera entre reintentos

    function esperar(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function verificarSesionEnBackendConReintentos() {
        // Espera inicial para que la cookie se alcance a escribir
        await esperar(ESPERA_INICIAL_MS);

        let intento = 0;

        while (intento <= REINTENTOS_MAX) {
            try {
                const apiBase = window.API_BASE_URL || 'http://localhost:3000';
              
                const respuesta = await fetch(`${apiBase}/auth/session`, {
                    method: 'GET',
                    credentials: 'include' // IMPORTANTE: manda la cookie de sesión
                });

                if (!respuesta.ok) {
                    console.warn('SessionGuard - /auth/session no OK, intento', intento, 'status:', respuesta.status);
                } else {
                    const datos = await respuesta.json();
                    return {
                        autenticado: datos.autenticado === true,
                        usuario: datos.user || null,
                        rol: datos.user ? datos.user.rol : null
                    };
                }
            } catch (error) {
                console.error('SessionGuard - Error al verificar sesión (intento', intento, '):', error);
            }

            intento++;
            if (intento <= REINTENTOS_MAX) {
                await esperar(ESPERA_ENTRE_REINTENTOS_MS);
            }
        }

        // Si después de todos los intentos no se pudo confirmar, se asume no autenticado
        return { autenticado: false, usuario: null };
    }

    function esAdminRole(rol) {
        return rol === 'Admin' || rol === 'ADMIN' || rol === 'Administrador' || rol === 'administrador';
    }

    function persistirUsuarioLocal(usuario) {
        try {
            if (usuario) {
                localStorage.setItem('user_data', JSON.stringify(usuario));
                if (usuario.rol) localStorage.setItem('user_role', usuario.rol);
            }
        } catch (e) {
            // ignorar errores de storage
        }
    }

    function limpiarUsuarioLocal() {
        try {
            localStorage.removeItem('user_data');
            localStorage.removeItem('user_role');
        } catch (e) {
            // ignorar
        }
    }

    async function aplicarLogicaRedireccion() {
        const { autenticado, usuario } = await verificarSesionEnBackendConReintentos();

        if (autenticado) {
            // Mantener el rol sincronizado localmente
            persistirUsuarioLocal(usuario);

            const rolActual = usuario?.rol || localStorage.getItem('user_role');
            const esAdmin = esAdminRole(rolActual);

            // Si el usuario ya inició sesión y está en login/registro, mandarlo a su panel
            if (esPaginaPublica) {
                
              if (usuario && esAdmin) {
                    window.location.href = `${basePrefix}/PantallasAdmin/admin.html`;
                    return;
                }
                if (usuario && usuario.rol === 'alumno') {
                     window.location.href = `${basePrefix}/pantallasUs/usuario.html`;
                return;
                }
              
            }

            // Validación constante: no permitir Admin en pantallas de usuario, ni usuario normal en Admin
            const esPantallaAdmin = paginaActual.includes('/PantallasAdmin/') || paginaActual.includes('/pantallasAdmin/');
            const esPantallaUsuario = paginaActual.includes('/pantallasUs/');

            if (esPantallaAdmin && !esAdmin) {
                // Está autenticado pero no es admin -> lo mandamos al panel usuario
                window.location.href = `${basePrefix}/pantallasUs/usuario.html`;
                return;
            }

            if (esPantallaUsuario && esAdmin) {
                // Admin no debería navegar en pantallas de usuario
                window.location.href = `${basePrefix}/PantallasAdmin/admin.html`;
                return;
            }

            return;
        }

        // No autenticado
        limpiarUsuarioLocal();
        if (!esPaginaPublica) {
            window.location.href = `${basePrefix}/index.html`;
            return;
        }
    }

    // Primera evaluación inmediata
    await aplicarLogicaRedireccion();

    // Re-evaluar periódicamente con intervalo corto para que sea rápido
    setInterval(aplicarLogicaRedireccion, 3000); // cada 3 segundos
})();

// Evitar que el usuario use "atrás" para saltarse la verificación
// Sobrescribe la entrada actual del historial para que al ir atrás se quede en la misma ruta
if (window.history && window.history.replaceState) {
    window.history.replaceState(null, document.title, window.location.href);
    window.addEventListener('popstate', function () {
        // Cada vez que intenta retroceder, lo volvemos a llevar a la URL actual
        window.history.pushState(null, document.title, window.location.href);
    });
}
