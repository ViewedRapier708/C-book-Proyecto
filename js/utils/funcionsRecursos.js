// ---------- funcionesRecursos.js ----------

// Variable global para almacenar el recurso seleccionado
let recursoSeleccionado = null;

/** Inicializa los event listeners para las filas de la tabla */
function inicializarEventosTabla() {
  const tabla = document.getElementById('tabla');
  if (!tabla) return;

  const filas = tabla.querySelectorAll('tbody tr');
  filas.forEach(fila => {
    // Extraer datos de la fila
    const celdas = fila.querySelectorAll('td');
    if (celdas.length > 0) {
      const datos = {};
      const headers = tabla.querySelectorAll('thead th');
      
      celdas.forEach((celda, index) => {
        if (headers[index]) {
          const nombreColumna = headers[index].textContent.trim();
          datos[nombreColumna] = celda.textContent.trim();
        }
      });
      
      // Guardar datos en el dataset de la fila
      fila.dataset.recurso = JSON.stringify(datos);
      fila.classList.add('fila-recurso');
      
      // Agregar evento de clic
      fila.addEventListener('click', function() {
        seleccionarFila(this);
      });
    }
  });

  console.log('Event listeners inicializados para', filas.length, 'filas');
}

/** Carga la tabla #tabla con los recursos del tipo indicado */
async function cargarTabla() {
  const API_BASE = window.API_BASE_URL || 'http://localhost:3000';
  const tabla = document.getElementById('tabla');
  
  if (!tabla) {
    console.error('No se encontró la tabla #tabla');
    return;
  }

  const tipo = tabla.dataset.tipo;
  console.log('Cargando tabla de tipo:', tipo);

  // Construir la URL con query‑string
  const url = new URL(`${API_BASE}/auth/recursos`);
  url.searchParams.set('tipo', tipo);

  try {
    // Petición GET (sin cuerpo)
    const resp = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const json = await resp.json();
    console.log('Datos recibidos para tipo', tipo, ':', json);

    // Rellenar la tabla
    const filas = Array.isArray(json.data) ? json.data : [];

    console.log('Filas a insertar en la tabla:', filas);
    const tbody = tabla.querySelector('tbody');
   
    // Insertar filas
    tbody.innerHTML = '';
    
    if (filas.length === 0) {
      const tr = tbody.insertRow();
      const td = tr.insertCell();
      td.colSpan = tabla.querySelectorAll('th').length;
      td.textContent = 'No hay recursos disponibles';
      td.style.textAlign = 'center';
      return;
    }
    
    filas.forEach(reg => {
      const tr = tbody.insertRow();
      tr.classList.add('fila-recurso');
      tr.dataset.recurso = JSON.stringify(reg);

      const columnas = Object.keys(reg);
      console.log('Insertando fila para registro:', reg);
      
      columnas.forEach(col => {
        const td = tr.insertCell();
        td.textContent = reg[col] != null ? reg[col] === false ? 'Disponible' : reg[col] === true ? 'Ocupado' : reg[col] !== true ? reg[col] : '' : '';
      });

      // Agregar evento de clic a la fila
      tr.addEventListener('click', function() {
        seleccionarFila(this);
      });
    });

  } catch (err) {
    console.error('Error al cargar la tabla:', err);
    // Si falla la carga del API, usar los datos estáticos que ya están en el HTML
    console.log('Usando datos estáticos de la tabla HTML');
    inicializarEventosTabla();
  }
}

/** Selecciona una fila y muestra el botón Solicitar */
function seleccionarFila(fila) {
  // Remover selección previa
  const filasPrevias = document.querySelectorAll('.fila-recurso.seleccionada');
  filasPrevias.forEach(f => f.classList.remove('seleccionada'));

  // Marcar la fila como seleccionada
  fila.classList.add('seleccionada');

  // Guardar el recurso seleccionado
  recursoSeleccionado = JSON.parse(fila.dataset.recurso);

  // Mostrar el botón Solicitar con animación
  const btnApartar = document.querySelector('.btn-apartar');
  if (btnApartar) {
    // Remover clase de animación si existe
    btnApartar.classList.remove('btn-aparecer');
    
    // Forzar reflow para reiniciar la animación
    void btnApartar.offsetWidth;
    
    // Mostrar y animar
    btnApartar.style.display = 'inline-block';
    btnApartar.classList.add('btn-aparecer');
    btnApartar.textContent = 'Solicitar';
    
    // Hacer scroll suave hacia el botón
    setTimeout(() => {
      btnApartar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }

  console.log('Recurso seleccionado:', recursoSeleccionado);
}

/** Abre el modal de confirmación */
function abrirModal() {
  if (!recursoSeleccionado) {
    alert('Por favor selecciona un recurso primero');
    return;
  }

  const modal = document.getElementById('modal-confirmacion');
  if (!modal) {
    console.error('No se encontró el modal de confirmación');
    return;
  }

  // Llenar los datos del modal
  const detallesModal = document.getElementById('detalles-recurso');
  if (detallesModal) {
    let htmlDetalles = '<ul class="lista-detalles">';
    for (const [key, value] of Object.entries(recursoSeleccionado)) {
      const valorFormateado = value === false ? 'Disponible' : value === true ? 'Ocupado' : value;
      htmlDetalles += `<li><strong>${key}:</strong> ${valorFormateado}</li>`;
    }
    htmlDetalles += '</ul>';
    detallesModal.innerHTML = htmlDetalles;
  }

  // Mostrar el modal con animación
  modal.style.display = 'flex';
  console.log('Modal abierto para recurso:', recursoSeleccionado);
}

/** Cierra el modal de confirmación */
function cerrarModal() {
  const modal = document.getElementById('modal-confirmacion');
  if (modal) {
    modal.style.display = 'none';
  }
}

/** Confirma la solicitud del recurso */
async function confirmarSolicitud() {
  if (!recursoSeleccionado) {
    alert('No hay recurso seleccionado');
    return;
  }

  console.log('Confirmando solicitud para:', recursoSeleccionado);
  
  // Simulación de confirmación (puedes conectar con API después)
  alert('¡Solicitud confirmada exitosamente!\n\nRecurso apartado.');
  
  cerrarModal();
  
  // Limpiar selección
  const filasPrevias = document.querySelectorAll('.fila-recurso.seleccionada');
  filasPrevias.forEach(f => f.classList.remove('seleccionada'));
  
  // Ocultar el botón
  const btnApartar = document.querySelector('.btn-apartar');
  if (btnApartar) {
    btnApartar.style.display = 'none';
  }
  
  recursoSeleccionado = null;
}

// Inicializar cuando se carga el componente
document.addEventListener('DOMContentLoaded', function() {
  console.log('Inicializando funcionsRecursos.js');
  
  // Usar datos estáticos del HTML directamente
  inicializarEventosTabla();

  // Event listener para el botón Solicitar
  const btnApartar = document.querySelector('.btn-apartar');
  if (btnApartar) {
    btnApartar.style.display = 'none'; // Ocultar inicialmente
    btnApartar.addEventListener('click', function(e) {
      e.preventDefault();
      abrirModal();
    });
  }

  // Event listeners para los botones del modal
  const btnConfirmar = document.getElementById('btn-confirmar-solicitud');
  if (btnConfirmar) {
    btnConfirmar.addEventListener('click', function(e) {
      e.preventDefault();
      confirmarSolicitud();
    });
  }

  const btnCancelar = document.getElementById('btn-cancelar-solicitud');
  if (btnCancelar) {
    btnCancelar.addEventListener('click', function(e) {
      e.preventDefault();
      cerrarModal();
    });
  }

  // Cerrar modal al hacer clic fuera de él
  const modal = document.getElementById('modal-confirmacion');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        cerrarModal();
      }
    });
  }
});