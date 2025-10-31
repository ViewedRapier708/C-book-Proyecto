async function cargarTabla() {
  try {
    const resp = await fetch('http://localhost:3000/auth/recursos', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },body:{
        tipo: 'computadoras'
      }
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const json = await resp.json();

    const filas = Array.isArray(json.data) ? json.data : [];
    const tabla = document.getElementById('usuarios');
    if (!tabla) throw new Error('No se encontró la tabla #usuarios');
    const tbody = tabla.querySelector('tbody');

    // determinar columnas (si no las tienes definidas globalmente)
    const columnas = window.columnas || (filas.length ? Object.keys(filas[0]) : []);
   
    // insertar filas
    tbody.innerHTML = '';
    filas.forEach(reg => {
      const tr = tbody.insertRow();
      columnas.forEach(col => {
        const td = tr.insertCell();
        td.textContent = reg[col] != null ? reg[col] : '';
      });
    });
  } catch (e) {
    console.error('Error al cargar la tabla:', e);
  }
}

// Ejemplo de uso:
// cargarTabla('/api/users');                 // llamada simple
// cargarTabla('/api/users', 'TU_TOKEN_AQUI'); // con token Bearer