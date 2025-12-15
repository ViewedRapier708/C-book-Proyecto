// Validación en frontend + flujo controlado por backend

async function registro(event) {
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
        event.preventDefault();
        mensajeDiv.textContent = 'Por favor, complete todos los campos obligatorios';
        mensajeDiv.style.color = 'red';
        return false;
    }

    if (!/^\d{10}$/.test(boleta)) {
        event.preventDefault();
        mensajeDiv.textContent = 'La boleta debe tener exactamente 10 dígitos numéricos';
        mensajeDiv.style.color = 'red';
        return false;
    }

    if (!/^[\w.-]+@[\w.-]+\.\w+$/.test(correo)) {
        event.preventDefault();
        mensajeDiv.textContent = 'Correo con formato inválido';
        mensajeDiv.style.color = 'red';
        return false;
    }

    if (password.length < 6 || password.length > 16) {
        event.preventDefault();
        mensajeDiv.textContent = 'La contraseña debe tener entre 6 y 16 caracteres';
        mensajeDiv.style.color = 'red';
        return false;
    }

    if (password !== confPsw) {
        event.preventDefault();
        mensajeDiv.textContent = 'Las contraseñas no coinciden';
        mensajeDiv.style.color = 'red';
        return false;
    }

    event.preventDefault();

    try {
        mensajeDiv.textContent = 'Registrando usuario...';
        mensajeDiv.style.color = 'blue';

        const apiBase = window.API_BASE_URL || 'http://localhost:3000';
        const res = await fetch(`${apiBase}/auth/registro`, {
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

        // Guardar datos para la pantalla de confirmación
        try {
            localStorage.setItem('datosRegistro', JSON.stringify({ boleta, correo }));
        } catch (e) {
            console.warn('No se pudo guardar datos de registro en localStorage', e);
        }

        mensajeDiv.textContent = data.message || '¡Registro exitoso! Revisa tu correo.';
        mensajeDiv.style.color = 'green';

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

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-registro');
    if (form) {
        form.addEventListener('submit', registro);
    }
});
