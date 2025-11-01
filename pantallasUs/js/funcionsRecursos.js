// ---------- funcionesRecursos.js ----------
/** Carga la tabla #tabla con los recursos del tipo indicado */
async function cargarTabla() {
  const tabla = document.getElementById('tabla');
  
  if (!tabla) {
    console.error('No se encontró la tabla #tabla');
    return;
  }

  console.log('Tabla encontrada:', tabla);
  const tipo = tabla.dataset.tipo;
  console.log('Parametros que usaremos →', { tipo });

  // 2️⃣ Construir la URL con query‑string
  const url = new URL('http://localhost:3000/auth/recursos');
  url.searchParams.set('tipo', tipo);

  try {
    // 3️⃣ Petición GET (sin cuerpo)
    const resp = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const json = await resp.json();               // esperamos { data: [...] }


    // 4️⃣ Rellenar la tabla
    const filas = Array.isArray(json.data) ? json.data : [];
 
    const tbody = tabla.querySelector('tbody');
   
    // 4.2 Insertar filas
    tbody.innerHTML = '';
    
    if (filas.length === 0) {
      const tr = tbody.insertRow();
      const td = tr.insertCell();
      td.colSpan = tabla.querySelectorAll('th').length; // abarcar todas las columnas
      td.textContent = 'No hay recursos disponibles';
      td.style.textAlign = 'center';
      return; // salir si no hay filas
    }
    filas.forEach(reg => {
      const tr = tbody.insertRow();
      const columnas = Object.keys(reg);
      console.log('Insertando fila para registro:', reg);
      
      columnas.forEach(col => {
        
        const td = tr.insertCell();


        td.textContent = reg[col] != null ? reg[col] === false ?'Disponible' :reg[col] !== true?reg[col] : '' : '';
 
      });
    });

  } catch (err) {
    console.error('Error al cargar la tabla:', err);
    alert('No se pudieron cargar los recursos. Revisa la consola.');
  }
}

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', cargarTabla);

// Ejemplo de uso:
// cargarTabla('/api/users');                 // llamada simple
// cargarTabla('/api/users', 'TU_TOKEN_AQUI'); // con token Bearer