// Guardia de sesión: consulta al backend usando la cookie de sesión

(async function() {
    // Llamadas al backend siempre en el mismo origen (localhost:3000)
    // Usamos rutas relativas, no necesitamos API_BASE.

    const paginaActual = window.location.pathname;
   

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
                    // Intento fallido
                } else {
                    const datos = await respuesta.json();
                    return {
                        autenticado: datos.autenticado === true,
                        usuario: datos.user || null,
                        rol: datos.user ? datos.user.rol : null
                    };
                }
            } catch (error) {
                // Error en la verificación
            }

            intento++;
            if (intento <= REINTENTOS_MAX) {
                await esperar(ESPERA_ENTRE_REINTENTOS_MS);
            }
        }

        // Si después de todos los intentos no se pudo confirmar, se asume no autenticado
        return { autenticado: false, usuario: null };
    }

    async function aplicarLogicaRedireccion() {
        const { autenticado, usuario } = await verificarSesionEnBackendConReintentos();

        if (autenticado) {
            // Si el usuario ya inició sesión y está en login/registro, mandarlo a su panel
            if (esPaginaPublica) {
                
              if (usuario && usuario.rol === 'Admin') {
                    window.location.href = './pantallasAdmin/administrador.html';
                    return;
                }
                if (usuario && usuario.rol === 'Alumno') {
                     window.location.href = './pantallasUs/usuario.html';
                return;
                }
              
            }
            return;
        }

        // No autenticado
        if (!esPaginaPublica) {
            window.location.href = '../index.html';
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
