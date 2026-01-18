// ============================================
// EJEMPLO DE INTEGRACIÓN FRONTEND - ADMIN
// ============================================

// Configuración de la API
const API_BASE_URL = '/api'; // Ajusta según tu configuración

// ============================================
// 1. FUNCIONES DE AUTENTICACIÓN
// ============================================

/**
 * Login de administrador
 */
async function loginAdmin(identificador, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // Importante para las cookies de sesión
      body: JSON.stringify({ identificador, password })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('Login exitoso:', data);
      // Redirigir al panel de administrador
      window.location.href = '/PantallasAdmin/admin.html';
    } else {
      alert(data.message || 'Error en el login');
    }
    
    return data;
  } catch (error) {
    console.error('Error en login:', error);
    alert('Error de conexión');
    return { success: false };
  }
}

/**
 * Verificar sesión de administrador
 */
async function verificarSesionAdmin() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/session`, {
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (!data.success) {
      // Redirigir al login si no hay sesión
      window.location.href = '/index.html';
    }
    
    return data;
  } catch (error) {
    console.error('Error verificando sesión:', error);
    return { success: false };
  }
}

/**
 * Cerrar sesión de administrador
 */
async function cerrarSesionAdmin() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      window.location.href = '/index.html';
    }
    
    return data;
  } catch (error) {
    console.error('Error cerrando sesión:', error);
    return { success: false };
  }
}

// ============================================
// 2. FUNCIONES CRUD - RESTIRADORES
// ============================================

/**
 * Obtener todos los restiradores
 */
async function obtenerRestiradores() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/restiradores`, {
      credentials: 'include'
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error obteniendo restiradores:', error);
    return { success: false };
  }
}

/**
 * Crear restirador
 */
async function crearRestirador(restirador) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/restiradores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(restirador)
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Restirador creado exitosamente');
    } else {
      alert(data.message || 'Error al crear restirador');
    }
    
    return data;
  } catch (error) {
    console.error('Error creando restirador:', error);
    return { success: false };
  }
}

/**
 * Actualizar restirador
 */
async function actualizarRestirador(restirador) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/restiradores/actualizar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(restirador)
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Restirador actualizado exitosamente');
    } else {
      alert(data.message || 'Error al actualizar restirador');
    }
    
    return data;
  } catch (error) {
    console.error('Error actualizando restirador:', error);
    return { success: false };
  }
}

/**
 * Eliminar restirador
 */
async function eliminarRestirador(id) {
  if (!confirm('¿Estás seguro de eliminar este restirador?')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/admin/restiradores/eliminar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ id })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Restirador eliminado exitosamente');
    } else {
      alert(data.message || 'Error al eliminar restirador');
    }
    
    return data;
  } catch (error) {
    console.error('Error eliminando restirador:', error);
    return { success: false };
  }
}

// ============================================
// 3. FUNCIONES CRUD - COMPUTADORAS
// ============================================

async function obtenerComputadoras() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/computadoras`, {
      credentials: 'include'
    });
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    return { success: false };
  }
}

async function crearComputadora(computadora) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/computadoras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(computadora)
    });
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    return { success: false };
  }
}

async function actualizarComputadora(computadora) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/computadoras/actualizar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(computadora)
    });
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    return { success: false };
  }
}

async function eliminarComputadora(id) {
  if (!confirm('¿Eliminar computadora?')) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/admin/computadoras/eliminar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id })
    });
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    return { success: false };
  }
}

// ============================================
// 4. EJEMPLO DE USO EN FORMULARIO DE LOGIN
// ============================================

// HTML del formulario de login:
/*
<form id="loginAdminForm">
  <input type="text" id="identificador" placeholder="Identificador (10 dígitos)" required>
  <input type="password" id="password" placeholder="Contraseña" required>
  <button type="submit">Iniciar Sesión</button>
</form>
*/

// JavaScript para manejar el formulario:
document.getElementById('loginAdminForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const identificador = document.getElementById('identificador').value;
  const password = document.getElementById('password').value;
  
  // Validar formato del identificador
  if (!/^\d{10}$/.test(identificador)) {
    alert('El identificador debe tener exactamente 10 dígitos');
    return;
  }
  
  await loginAdmin(identificador, password);
});

// ============================================
// 5. EJEMPLO DE USO EN PANEL DE ADMIN
// ============================================

// Al cargar la página del panel de administrador:
window.addEventListener('DOMContentLoaded', async () => {
  // Verificar sesión
  const sesion = await verificarSesionAdmin();
  
  if (sesion.success) {
    console.log('Administrador autenticado:', sesion.data);
    // Cargar datos iniciales
    await cargarDatosIniciales();
  }
});

async function cargarDatosIniciales() {
  // Ejemplo: cargar restiradores
  const resultado = await obtenerRestiradores();
  
  if (resultado.success) {
    mostrarRestiradores(resultado.data);
  }
}

function mostrarRestiradores(restiradores) {
  const contenedor = document.getElementById('listaRestiradores');
  
  contenedor.innerHTML = restiradores.map(r => `
    <div class="restirador-item">
      <h3>Restirador #${r.no_restirador}</h3>
      <p>Inventario: ${r.no_inventario}</p>
      <p>Disponible: ${r.Disponible ? 'Sí' : 'No'}</p>
      <p>Estado: ${r.estado_de_material ? 'Bueno' : 'Malo'}</p>
      <p>Observación: ${r.Observacion}</p>
      <button onclick="editarRestirador(${r.id})">Editar</button>
      <button onclick="eliminarRestirador(${r.id})">Eliminar</button>
    </div>
  `).join('');
}

// ============================================
// 6. EJEMPLO DE FORMULARIO DE CREACIÓN
// ============================================

// HTML del formulario:
/*
<form id="formCrearRestirador">
  <input type="text" id="no_inventario" placeholder="No. Inventario" required>
  <input type="number" id="no_restirador" placeholder="No. Restirador" required>
  <textarea id="observacion" placeholder="Observación"></textarea>
  <button type="submit">Crear Restirador</button>
</form>
*/

// JavaScript:
document.getElementById('formCrearRestirador')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const restirador = {
    no_inventario: document.getElementById('no_inventario').value,
    no_restirador: parseInt(document.getElementById('no_restirador').value),
    Observacion: document.getElementById('observacion').value || 'N/A'
  };
  
  const resultado = await crearRestirador(restirador);
  
  if (resultado.success) {
    // Recargar lista
    await cargarDatosIniciales();
    // Limpiar formulario
    e.target.reset();
  }
});

// ============================================
// 7. PROTECCIÓN DE PÁGINAS DE ADMIN
// ============================================

// Agregar al inicio de cada página de administrador:
(async function protegerPaginaAdmin() {
  const sesion = await verificarSesionAdmin();
  
  if (!sesion.success) {
    // Redirigir al login si no hay sesión
    window.location.href = '/index.html';
  }
})();

// ============================================
// NOTAS IMPORTANTES:
// ============================================
/*
1. Credenciales por defecto:
   - Identificador: 1234567890
   - Contraseña: admin123

2. Todas las peticiones deben incluir:
   credentials: 'include'
   
3. Las rutas de actualización y eliminación usan POST
   con el ID en el body

4. Validar el formato del identificador (10 dígitos)
   antes de enviar el formulario

5. Usar try-catch para manejar errores de red

6. Mostrar mensajes claros al usuario
*/
