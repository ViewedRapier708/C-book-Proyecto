<<<<<<< HEAD
// Iniciar sesión - Llama al backend
=======
// Iniciar sesión - Llama al backend en el mismo origen (localhost:3000)
>>>>>>> 1a1caeb681b5f56f22bb59c4f76f7bdc8d624129

async function iniciarSesion(event) {
    const API_BASE = window.API_BASE_URL || 'http://localhost:3000';
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

        // Llamar al backend usando ruta relativa (mismo origen)
        const apiBase = window.API_BASE_URL || 'http://localhost:3000';
        console.log('Usando API base:', apiBase); //debug
        const res = await fetch(`${apiBase}/auth/login`, {
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
        console.log('Login exitoso! Sesión:', data); //debug
        
        // Guardar datos del usuario en localStorage (solo información pública)
        if (data.user) {
            localStorage.setItem('user_data', JSON.stringify(data.user));
        }

        mensajeDiv.textContent = '¡Inicio de sesión exitoso!';
        mensajeDiv.style.color = 'green';

<<<<<<< HEAD
        // Redirigir al dashboard según tipo de usuario
        setTimeout(() => {
            if (data.user && data.user.tipo_usuario === 'administrador') {
                window.location.href = './PantallasAdmin/admin.html';
            } else {
                window.location.href = './pantallasUs/usuario.html';
            }
=======
        // Redirigir al dashboard

        console.log('Redirigiendo al dashboard...'); //debug
        alert(data.rol); //debug
        setTimeout(() => {

            if (data.rol === 'admin') {
                window.location.href = './pantallasUs/admin.html';
            }   else if (data.rol === 'docente') {
            window.location.href = './pantallasUs/usuario.html';
            }


>>>>>>> 1a1caeb681b5f56f22bb59c4f76f7bdc8d624129
        }, 400);

        return false;

    } catch (err) {
        console.error('Error en iniciarSesion:', err);
        mensajeDiv.textContent = 'Error de conexión al servidor';
        mensajeDiv.style.color = 'red';
        return false;
    }
}
