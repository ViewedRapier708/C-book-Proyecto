async function iniciarSesion(event) {
    event.preventDefault(); // Evita que el formulario recargue la página

    const boleta = document.getElementById('boleta').value;
    const password = document.getElementById('password').value;
    const mensajeDiv = document.querySelector('.messaje');
    const remember = !!document.getElementById('remember')?.checked;

    // Validaciones simples antes de enviar
    if (!boleta || !password) {
        mensajeDiv.textContent = 'Por favor, complete todos los campos';
        mensajeDiv.style.color = 'red';
        return;
    }

    try {
        // Enviar datos al backend
        const res = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // importante para enviar y recibir cookies de sesión
            body: JSON.stringify({ boleta, password, remember })
        });
        
        const data = await res.json();
        console.log('Login status:', res.status, 'respuesta:', data);
        if (!res.ok) {
            mensajeDiv.textContent = `${data.mensaje || 'Usuario o contraseña incorrectos'}`;
            mensajeDiv.style.color = 'red';
        } else {
            mensajeDiv.textContent = `${data.mensaje || 'Inicio de sesión correcto'}`;
            mensajeDiv.style.color = 'green';
            // Redirigir al dashboard (ruta relativa desde index.html)
            setTimeout(() => {
                console.log('Redirigiendo a pantallasUs/postInicio.html');
                window.location.href = './pantallasUs/postInicio.html';
            }, 600);
        }
        return false; // asegura que el form no recargue

    } catch (error) {
        mensajeDiv.textContent = 'Error de conexión al servidor';
        mensajeDiv.style.color = 'red';
        console.error(error);
    }
}
