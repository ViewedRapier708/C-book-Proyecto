// ---------- funcionesRecursos.js ----------

// Variable global para almacenar el recurso seleccionado
let recursoSeleccionado = null;

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
      
      // Guardar los datos en el atributo data de la fila
      tr.dataset.recurso = JSON.stringify(reg);
    });

    // Inicializar eventos después de cargar los datos
    inicializarEventosTabla();

  } catch (err) {
    console.error('Error al cargar la tabla:', err);
  }
}

// Función para inicializar los eventos de la tabla
function inicializarEventosTabla() {
    console.log('🔧 Inicializando eventos de tabla...');
    
    const tabla = document.querySelector('#tabla');
    const btnApartar = document.querySelector('.btn-apartar');
    const modal = document.querySelector('#modal-confirmacion');
    const btnConfirmar = document.querySelector('#btn-confirmar-solicitud');
    const btnCancelar = document.querySelector('#btn-cancelar-solicitud');
    
    console.log('📋 Elementos encontrados:', {
        tabla: !!tabla,
        btnApartar: !!btnApartar,
        modal: !!modal,
        btnConfirmar: !!btnConfirmar,
        btnCancelar: !!btnCancelar
    });
    
    if (!tabla) {
        console.error('❌ No se encontró la tabla');
        return;
    }
    
    // Agregar eventos a las filas de la tabla
    const filas = tabla.querySelectorAll('tbody tr');
    console.log(`📊 Filas encontradas: ${filas.length}`);
    
    filas.forEach((fila, index) => {
        fila.addEventListener('click', function() {
            console.log(`🖱️ Click en fila ${index + 1}`);
            seleccionarFila(this);
        });
    });
    
    // Evento para el botón "Solicitar"
    if (btnApartar) {
        btnApartar.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('🔘 Click en botón Solicitar');
            abrirModal();
        });
    }
    
    // Eventos del modal
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', confirmarSolicitud);
    }
    
    if (btnCancelar) {
        btnCancelar.addEventListener('click', cerrarModal);
    }
    
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                cerrarModal();
            }
        });
    }
}

// Función para seleccionar una fila
function seleccionarFila(fila) {
    console.log('✅ Seleccionando fila...');
    
    const tabla = fila.closest('table');
    const todasLasFilas = tabla.querySelectorAll('tbody tr');
    
    // Remover selección previa
    todasLasFilas.forEach(f => f.classList.remove('seleccionada'));
    
    // Seleccionar la fila actual
    fila.classList.add('seleccionada');
    
    // Guardar datos del recurso
    try {
        recursoSeleccionado = JSON.parse(fila.dataset.recurso || '{}');
        console.log('💾 Recurso seleccionado:', recursoSeleccionado);
    } catch (error) {
        console.error('Error al parsear datos del recurso:', error);
        recursoSeleccionado = {};
    }
    
    // Mostrar el botón con animación
    const btnApartar = document.querySelector('.btn-apartar');
    if (btnApartar) {
        console.log('🎬 Aplicando animación al botón...');
        
        // Remover clase de animación si existe
        btnApartar.classList.remove('btn-aparecer');
        
        // Mostrar el botón
        btnApartar.style.display = 'inline-block';
        
        // Forzar reflow para reiniciar la animación
        void btnApartar.offsetWidth;
        
        // Agregar clase de animación
        btnApartar.classList.add('btn-aparecer');
        
        console.log('✨ Animación aplicada');
    } else {
        console.error('❌ No se encontró el botón .btn-apartar');
    }
}

// Función para abrir el modal
function abrirModal() {
    console.log('🔓 Abriendo modal...');
    
    const modal = document.querySelector('#modal-confirmacion');
    const detallesDiv = document.querySelector('#detalles-recurso');
    
    if (!modal || !detallesDiv) {
        console.error('❌ No se encontró el modal o el div de detalles');
        return;
    }
    
    // Construir HTML de los detalles
    let html = '<ul class="lista-detalles">';
    for (let key in recursoSeleccionado) {
        if (recursoSeleccionado.hasOwnProperty(key)) {
            let valor = recursoSeleccionado[key];
            
            // Formatear valores booleanos
            if (valor === true) valor = 'Ocupado';
            if (valor === false) valor = 'Disponible';
            
            html += `
                <li>
                    <strong>${key.toUpperCase()}:</strong>
                    <span>${valor}</span>
                </li>
            `;
        }
    }
    html += '</ul>';
    
    detallesDiv.innerHTML = html;
    
    // Mostrar modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    console.log('✅ Modal abierto');
}

// Función para cerrar el modal
function cerrarModal() {
    console.log('🔒 Cerrando modal...');
    
    const modal = document.querySelector('#modal-confirmacion');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Función para confirmar la solicitud
function confirmarSolicitud() {
    console.log('✅ Confirmando solicitud para:', recursoSeleccionado);
    
    // Aquí iría la lógica para enviar la solicitud al backend
    alert('Solicitud confirmada: ' + JSON.stringify(recursoSeleccionado, null, 2));
    
    cerrarModal();
    
    // Limpiar selección
    const todasLasFilas = document.querySelectorAll('tbody tr');
    todasLasFilas.forEach(f => f.classList.remove('seleccionada'));
    
    const btnApartar = document.querySelector('.btn-apartar');
    if (btnApartar) {
        btnApartar.style.display = 'none';
        btnApartar.classList.remove('btn-aparecer');
    }
    
    recursoSeleccionado = null;
}