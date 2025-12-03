// Registro de usuario - Llama al backend

const API_BASE = window.API_BASE_URL || 'http://localhost:3000';

async function registro(event) {
    event.preventDefault();

    const form = event.target;
    const boletaInput = form.querySelector('#boleta-registro') || form.querySelector('#boleta');
    const correoInput = form.querySelector('#correo');
    const passwordInput = form.querySelector('#password-registro') || form.querySelector('#contrasena');
    const confirmInput = form.querySelector('#confirmar-password') || form.querySelector('#confirmar_contrasena');
    const mensajeDiv = form.querySelector('.messaje') || document.querySelector('.messaje');

    if (!boletaInput || !correoInput || !passwordInput || !confirmInput) {
        console.error('Formulario de registro incompleto: faltan campos esperados');
        return false;
    }

    const boleta = boletaInput.value.trim();
    const correo = correoInput.value.trim();
    const password = passwordInput.value;
    const confPsw = confirmInput.value;

    // Validaciones básicas en frontend
    if (!boleta || !correo || !password || !confPsw) {
        mensajeDiv.textContent = 'Por favor, complete todos los campos obligatorios';
        mensajeDiv.style.color = 'red';
        return false;
    }

    if (!/^\d{10}$/.test(boleta)) {
        mensajeDiv.textContent = 'La boleta debe tener exactamente 10 dígitos numéricos';
        mensajeDiv.style.color = 'red';
        return false;
    }

    if (!/^[\w.-]+@[\w.-]+\.\w+$/.test(correo)) {
        mensajeDiv.textContent = 'Correo con formato inválido';
        mensajeDiv.style.color = 'red';
        return false;
    }

    if (password.length < 6 || password.length > 16) {
        mensajeDiv.textContent = 'La contraseña debe tener entre 6 y 16 caracteres';
        mensajeDiv.style.color = 'red';
        return false;
    }

    if (password !== confPsw) {
        mensajeDiv.textContent = 'Las contraseñas no coinciden';
        mensajeDiv.style.color = 'red';
        return false;
    }

    try {
        mensajeDiv.textContent = 'Registrando usuario...';
        mensajeDiv.style.color = 'blue';

        // Llamar al backend
        const res = await fetch(`${API_BASE}/auth/registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ boleta, correo, password, confPsw })
        });

        const data = await res.json();
        console.log('Registro response:', data); //debug

        if (!res.ok) {
            mensajeDiv.textContent = data.error || 'Error al registrar';
            mensajeDiv.style.color = 'red';
            return false;
        }

        // Guardar datos en localStorage para la verificación
        localStorage.setItem('datosRegistro', JSON.stringify({
            boleta,
            correo
        }));

        // Registro exitoso
        mensajeDiv.textContent = data.message || '¡Registro exitoso! Revisa tu correo.';
        mensajeDiv.style.color = 'green';

        // Redirigir a confirmación
        setTimeout(() => {
            window.location.href = './pantallasUs/confirmacion.html';
        }, 2000);

        return false;

    } catch (err) {
        console.error('Error en registro:', err);
        mensajeDiv.textContent = 'Error de conexión al servidor';
        mensajeDiv.style.color = 'red';
        return false;
    }
}

// Asignar al formulario
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-registro');
    if (form) {
        form.addEventListener('submit', registro);
    }
});
