// ---------- funcionesRecursos.js ----------

// Detectar entorno: GitHub Pages o localhost
const API_URL_RECURSOS = window.location.hostname.includes('github.io')
    ? 'https://c-book-backend.onrender.com'  // Backend en Render/Railway/etc
    : 'http://localhost:3000';

/** Carga la tabla #tabla con los recursos del tipo indicado */
async function cargarTabla() {
  const tabla = document.getElementById('tabla');
  
  if (!tabla) {
    console.error('No se encontró la tabla #tabla');
    return;
  }


  const tipo = tabla.dataset.tipo;
 console.log('Cargando tabla de tipo:', tipo);

  // 2️⃣ Construir la URL con query‑string
  const url = new URL(`${API_URL_RECURSOS}/auth/recursos`);
  url.searchParams.set('tipo', tipo);

  try {
    // 3️⃣ Petición GET (sin cuerpo)
    const resp = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const json = await resp.json();               // esperamos { data: [...] }
    console.log('Datos recibidos para tipo', tipo, ':', json);

    // 4️⃣ Rellenar la tabla
    const filas = Array.isArray(json.data) ? json.data : [];

    //Filas que se ingresan a la tabla 
    console.log('Filas a insertar en la tabla:', filas);
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


        td.textContent = reg[col] != null ? reg[col] === false ?'Disponible' :reg[col] === true ? 'Ocupado' : reg[col] !==true? reg[col] : '' : '';
 
      });
    });

  } catch (err) {
    console.error('Error al cargar la tabla:', err);
  }
}