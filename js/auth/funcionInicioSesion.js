// Iniciar sesión - Llama al backend

async function iniciarSesion(event) {
    event.preventDefault();

    const boleta = document.getElementById('boleta').value;
    const password = document.getElementById('password').value;
    const mensajeDiv = document.querySelector('.messaje');

    // Validaciones básicas
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

    try {
        mensajeDiv.textContent = 'Verificando credenciales...';
        mensajeDiv.style.color = 'blue';

        console.log('Intentando login para boleta:', boleta); //debug

        // Llamar al backend
        const res = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ boleta, password })
        });

        const data = await res.json();
        console.log('Login response:', data); //debug

        if (!res.ok) {
            mensajeDiv.textContent = data.error || 'Error al iniciar sesión';
            mensajeDiv.style.color = 'red';
            return false;
        }

        // Login exitoso
        console.log('Login exitoso! Sesión:', data.session); //debug
        
        // Guardar la sesión en localStorage para usarla en el frontend
        if (data.session) {
            localStorage.setItem('supabase_session', JSON.stringify(data.session));
            localStorage.setItem('user_data', JSON.stringify(data.user));
        }

        mensajeDiv.textContent = '¡Inicio de sesión exitoso!';
        mensajeDiv.style.color = 'green';

        // Redirigir al dashboard
        setTimeout(() => {
            window.location.href = './pantallasUs/usuario.html';
        }, 800);

        return false;

    } catch (err) {
        console.error('Error en iniciarSesion:', err);
        mensajeDiv.textContent = 'Error de conexión al servidor';
        mensajeDiv.style.color = 'red';
        return false;
    }
}
