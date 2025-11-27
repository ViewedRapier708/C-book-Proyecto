// Iniciar sesión directamente con Supabase (sin backend)
async function iniciarSesion(event) {
    event.preventDefault();

    const boleta = document.getElementById('boleta').value;
    const password = document.getElementById('password').value;
    const mensajeDiv = document.querySelector('.messaje');

    // Validaciones
    if (!boleta || !password) {
        mensajeDiv.textContent = 'Por favor, complete todos los campos';
        mensajeDiv.style.color = 'red';
        return false;
    }

    if (!/^\d{10}$/.test(boleta)) {
        mensajeDiv.textContent = 'La boleta debe tener exactamente 10 dígitos';
        mensajeDiv.style.color = 'red';
        return false;
    }

    const SUPABASE_URL = 'https://yondcnkwcekmkovdeaso.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvbmRjbmt3Y2VrbWtvdmRlYXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2ODYyMDQsImV4cCI6MjA3NjI2MjIwNH0.4NqF_hCv7RiXrOjO9fxfRHPzikpZ61siqMZV_rlUQew';

    try {
        mensajeDiv.textContent = 'Verificando credenciales...';
        mensajeDiv.style.color = 'blue';

        const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                storage: localStorage
            }
        });

        // Primero buscar el correo asociado a la boleta en usuarios_web_movil
        const { data: userData, error: userError } = await client
            .from('usuarios_web_movil')
            .select('correo')
            .eq('boleta', boleta)
            .maybeSingle();

        if (userError) {
            console.error('Error buscando usuario:', userError);
        }

        let email = userData?.correo;

        // Si no encontró en la tabla, intentar buscar por metadata en auth (backup)
        if (!email) {
            mensajeDiv.textContent = 'Usuario no encontrado. Verifica tu boleta o regístrate.';
            mensajeDiv.style.color = 'red';
            return false;
        }

        // Iniciar sesión con Supabase Auth
        const { data, error } = await client.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            console.error('Error de login:', error);
            if (error.message.includes('Invalid login credentials')) {
                mensajeDiv.textContent = 'Contraseña incorrecta';
            } else if (error.message.includes('Email not confirmed')) {
                mensajeDiv.textContent = 'Debes confirmar tu correo antes de iniciar sesión';
            } else {
                mensajeDiv.textContent = 'Error al iniciar sesión: ' + error.message;
            }
            mensajeDiv.style.color = 'red';
            return false;
        }

        // Login exitoso
        console.log('Login exitoso:', data);
        mensajeDiv.textContent = '¡Inicio de sesión exitoso!';
        mensajeDiv.style.color = 'green';

        // La sesión se guarda automáticamente en localStorage por Supabase
        // Redirigir al dashboard
        setTimeout(() => {
            window.location.href = './pantallasUs/usuario.html';
        }, 800);

        return false;

    } catch (err) {
        console.error('Error en iniciarSesion:', err);
        mensajeDiv.textContent = 'Error de conexión. Intenta de nuevo.';
        mensajeDiv.style.color = 'red';
        return false;
    }
}
