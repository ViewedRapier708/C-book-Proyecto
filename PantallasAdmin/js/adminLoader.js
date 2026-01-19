// Sistema de carga dinámica de componentes para el panel administrativo

document.addEventListener('DOMContentLoaded', function() {
    const contentLoader = document.getElementById('content-loader');
    const pageTitle = document.getElementById('page-title');
    const navLinks = document.querySelectorAll('.nav-link');
    const aside = document.querySelector('aside');
    const overlay = document.querySelector('.menu-overlay');
    const toggle = document.querySelector('.menu-toggle');


    // Sistema de carga de componentes
    const loadComponent = (componentName, title) => {
        if (!contentLoader) return;

        const componentPath = `componentes/${componentName}.html`;

        fetch(componentPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: No se pudo cargar ${componentName}`);
                }
                return response.text();
            })
            .then(html => {
                // Agregar clase de animación al contenedor
                contentLoader.classList.remove('component-enter');
                contentLoader.innerHTML = html;
                
                // Forzar reflow para que la animación se ejecute
                void contentLoader.offsetWidth;
                contentLoader.classList.add('component-enter');
                
                // Animar elementos dentro del componente
                const tables = contentLoader.querySelectorAll('.container-tabla');
                const forms = contentLoader.querySelectorAll('.container-formulario');
                const stats = contentLoader.querySelectorAll('.container-datos-sistema, .container-datos-usuario');
                const buttons = contentLoader.querySelectorAll('.container-btn-alta, .container-btn-apartar');
                
                tables.forEach(el => el.classList.add('component-enter-table'));
                forms.forEach(el => el.classList.add('component-enter-form'));
                stats.forEach(el => el.classList.add('component-enter-stats'));
                buttons.forEach(el => el.classList.add('component-enter-buttons'));
                
                if (pageTitle) {
                    pageTitle.textContent = title;
                }

                // Inicializar funcionalidades específicas del componente
                if (componentName === 'altaComputadoras') {
                    inicializarModalComputadoras();
                    cargarComputadoras();
                } else if (componentName === 'altaLibros') {
                    inicializarModalLibros();
                    cargarLibros();
                } else if (componentName === 'altaRestiradores') {
                    inicializarModalRestiradores();
                    cargarRestiradores();
                } else if (componentName === 'altaGuardaropas') {
                    inicializarModalGuardaropas();
                    cargarGuardaropas();
                }
              
            })
            .catch(err => {
                console.error('Error cargando componente:', err);
                contentLoader.innerHTML = `
                    <div style="padding: 20px; color: #d32f2f; background: #ffebee; border-radius: 4px; animation: fadeInUp 0.5s ease-out;">
                        <h3>Error al cargar componente</h3>
                        <p>${err.message}</p>
                    </div>
                `;
            });
    };

    // Configurar eventos de los enlaces de navegación
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            const component = link.getAttribute('data-component');
            const title = link.getAttribute('data-title');

            if (component && title) {
                // Actualizar estado activo
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                // Cargar componente
                loadComponent(component, title);
            }
        });
    });

    // Cargar componente inicial (inicio)
    const inicioLink = Array.from(navLinks).find(link => 
        link.getAttribute('data-component') === 'inicio'
    );
    
    if (inicioLink) {
        inicioLink.click();
    } else {
        // Si no existe enlace de inicio, cargar directamente
        loadComponent('inicio', 'BIENVENIDO ADMINISTRADOR');
    }
    
    // Función para inicializar componentes con backend
    function inicializarComponente(componentName) {
        // Esperar un poco para que el DOM esté listo
        setTimeout(() => {
            switch(componentName) {
                case 'altaComputadoras':
                    if (typeof inicializarComputadoras === 'function') {
                        inicializarComputadoras();
                    }
                    break;
                case 'altaLibros':
                    if (typeof inicializarLibros === 'function') {
                        inicializarLibros();
                    }
                    break;
                case 'altaRestiradores':
                    if (typeof inicializarRestiradores === 'function') {
                        inicializarRestiradores();
                    }
                    break;
                case 'altaGuardaropas':
                    if (typeof inicializarGuardaropas === 'function') {
                        inicializarGuardaropas();
                    }
                    break;
                case 'solicitudesLibros':
                    if (typeof inicializarSolicitudes === 'function') {
                        inicializarSolicitudes();
                    }
                    break;
                default:
                    console.log(`No hay inicialización para: ${componentName}`);
            }
        }, 100);
    }
});

// Función para inicializar el modal de computadoras
function inicializarModalComputadoras() {
    const modal = document.getElementById('modalFormulario');
    const modalTitulo = document.getElementById('modal-titulo');
    const btnAgregar = document.getElementById('btn-agregar');
    const btnCerrar = document.querySelector('.modal-cerrar');
    const btnLimpiar = document.getElementById('btn-limpiar');
    const btnGuardar = document.getElementById('btn-guardar');
    const tbody = document.querySelector('tbody');

    if (!modal) return;

    // Función para abrir modal
    function abrirModal() {
        modal.classList.add('activo');
    }

    // Función para cerrar modal
    function cerrarModal() {
        modal.classList.remove('activo');
    }

    // Función para limpiar formulario
    function limpiarFormulario() {
        document.getElementById('procesador').value = '';
        document.getElementById('programas').value = '';
        document.getElementById('carrera').value = '';
        document.getElementById('ram').value = '';
        document.getElementById('estado').value = 'disponible';
    }

    // Evento: Botón Agregar
    if (btnAgregar) {
        btnAgregar.addEventListener('click', () => {
            modalTitulo.textContent = 'Nueva Computadora';
            limpiarFormulario();
            abrirModal();
        });
    }

    // Evento: Botones Editar (delegación de eventos para filas dinámicas)
    if (tbody) {
        tbody.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-editar')) {
                const fila = e.target.closest('tr');
                
                // Cargar datos de la fila en el formulario
                document.getElementById('procesador').value = fila.cells[1].textContent;
                document.getElementById('ram').value = fila.cells[2].textContent;
                document.getElementById('carrera').value = fila.cells[3].textContent;
                document.getElementById('estado').value = fila.cells[4].textContent.toLowerCase();
                
                modalTitulo.textContent = 'Editar Computadora';
                abrirModal();
            }
        });
    }

    // Evento: Cerrar con la X
    if (btnCerrar) {
        btnCerrar.addEventListener('click', cerrarModal);
    }

    // Evento: Botón Limpiar
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', limpiarFormulario);
    }

    // Evento: Botón Guardar
    if (btnGuardar) {
        btnGuardar.addEventListener('click', async () => {
            const procesador = document.getElementById('procesador')?.value;
            const programas = document.getElementById('programas')?.value;
            const carrera = document.getElementById('carrera')?.value;
            const ram = document.getElementById('ram')?.value;
            const estado = document.getElementById('estado')?.value;
            
            if (!procesador || !programas || !carrera) {
                alert('Por favor complete los campos requeridos: Procesador, Programas y Carrera');
                return;
            }
            
            const datos = {
                procesador,
                programas,
                carrera,
                ram: ram || '',
                estado: estado || 'disponible'
            };
            
            try {
                await crearComputadora(datos);
                alert('Computadora guardada correctamente');
                cerrarModal();
                cargarComputadoras(); // Recargar la tabla
            } catch (error) {
                alert('Error al guardar: ' + error.message);
            }
        });
    }

    // Evento: Cerrar al hacer clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            cerrarModal();
        }
    });

    // Evento: Cerrar con tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('activo')) {
            cerrarModal();
        }
    });
}

// Función para inicializar el modal de libros
function inicializarModalLibros() {
    const modal = document.getElementById('modalFormulario');
    const modalTitulo = document.getElementById('modal-titulo');
    const btnAgregar = document.getElementById('btn-agregar');
    const btnCerrar = document.querySelector('.modal-cerrar');
    const btnLimpiar = document.getElementById('btn-limpiar');
    const btnGuardar = document.getElementById('btn-guardar');
    const tbody = document.querySelector('tbody');

    if (!modal) return;

    function abrirModal() {
        modal.classList.add('activo');
    }

    function cerrarModal() {
        modal.classList.remove('activo');
    }

    function limpiarFormulario() {
        document.getElementById('titulo').value = '';
        document.getElementById('autor').value = '';
        document.getElementById('editorial').value = '';
        document.getElementById('isbn').value = '';
        document.getElementById('carrera').value = '';
        document.getElementById('cantidad').value = '';
    }

    if (btnAgregar) {
        btnAgregar.addEventListener('click', () => {
            modalTitulo.textContent = 'Nuevo Libro';
            limpiarFormulario();
            abrirModal();
        });
    }

    if (tbody) {
        tbody.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-editar')) {
                const fila = e.target.closest('tr');
                document.getElementById('titulo').value = fila.cells[1].textContent;
                document.getElementById('autor').value = fila.cells[2].textContent;
                document.getElementById('editorial').value = fila.cells[3].textContent;
                document.getElementById('carrera').value = fila.cells[4].textContent;
                document.getElementById('cantidad').value = fila.cells[5].textContent;
                
                modalTitulo.textContent = 'Editar Libro';
                abrirModal();
            }
        });
    }

    if (btnCerrar) {
        btnCerrar.addEventListener('click', cerrarModal);
    }

    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', limpiarFormulario);
    }

    if (btnGuardar) {
        btnGuardar.addEventListener('click', async () => {
            const titulo = document.getElementById('titulo')?.value;
            const autor = document.getElementById('autor')?.value;
            const editorial = document.getElementById('editorial')?.value;
            const isbn = document.getElementById('isbn')?.value;
            const carrera = document.getElementById('carrera')?.value;
            const cantidad = document.getElementById('cantidad')?.value;
            
            if (!titulo || !autor) {
                alert('Por favor complete los campos requeridos: Título y Autor');
                return;
            }
            
            const datos = {
                titulo,
                autor,
                editorial: editorial || '',
                isbn: isbn || '',
                carrera: carrera || '',
                cantidad: cantidad || '1'
            };
            
            try {
                await crearLibro(datos);
                alert('Libro guardado correctamente');
                cerrarModal();
                cargarLibros();
            } catch (error) {
                alert('Error al guardar: ' + error.message);
            }
        });
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) cerrarModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('activo')) cerrarModal();
    });
}

// Función para inicializar el modal de restiradores
function inicializarModalRestiradores() {
    const modal = document.getElementById('modalFormulario');
    const modalTitulo = document.getElementById('modal-titulo');
    const btnAgregar = document.getElementById('btn-agregar');
    const btnCerrar = document.querySelector('.modal-cerrar');
    const btnLimpiar = document.getElementById('btn-limpiar');
    const btnGuardar = document.getElementById('btn-guardar');
    const tbody = document.querySelector('tbody');

    if (!modal) return;

    function abrirModal() {
        modal.classList.add('activo');
    }

    function cerrarModal() {
        modal.classList.remove('activo');
    }

    function limpiarFormulario() {
        const noInventario = document.getElementById('no_inventario');
        const noRestirador = document.getElementById('no_restirador');
        const observacion = document.getElementById('observacion');
        
        if (noInventario) noInventario.value = '';
        if (noRestirador) noRestirador.value = '';
        if (observacion) observacion.value = '';
    }

    if (btnAgregar) {
        btnAgregar.addEventListener('click', () => {
            modalTitulo.textContent = 'Nuevo Restirador';
            limpiarFormulario();
            abrirModal();
        });
    }
    

    if (tbody) {
        tbody.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-editar')) {
                const fila = e.target.closest('tr');
                const noRestirador = document.getElementById('no_restirador');
                const noInventario = document.getElementById('no_inventario');
                
                if (noRestirador) noRestirador.value = fila.cells[0].textContent;
                if (noInventario) noInventario.value = fila.cells[1].textContent;
                
                modalTitulo.textContent = 'Editar Restirador';
                abrirModal();
            }
        });
    }

    if (btnCerrar) {
        btnCerrar.addEventListener('click', cerrarModal);
    }

    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', limpiarFormulario);
    }

    if (btnGuardar) {
        btnGuardar.addEventListener('click', async () => {
            const noInventario = document.getElementById('no_inventario');
            const noRestirador = document.getElementById('no_restirador');
            const Observacion = document.getElementById('Observacion');
            
            if (!noInventario?.value || !noRestirador?.value) {
                alert('Por favor complete los campos requeridos: No. Inventario y No. Restirador');
                return;
            }
            
            const datos = {
                no_inventario: noInventario.value,
                no_restirador: parseInt(noRestirador.value),
                Observacion: Observacion?.value || ''
            };
            
            try {
                await crearRestirador(datos);
                alert('Restirador guardado correctamente');
                cerrarModal();
                cargarRestiradores(); // Recargar la tabla
            } catch (error) {
                alert('Error al guardar: ' + error.message);
            }
        });
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) cerrarModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('activo')) cerrarModal();
    });
}

// Función para inicializar el modal de guardaropas
function inicializarModalGuardaropas() {
    const modal = document.getElementById('modalFormulario');
    const modalTitulo = document.getElementById('modal-titulo');
    const btnAgregar = document.getElementById('btn-agregar');
    const btnCerrar = document.querySelector('.modal-cerrar');
    const btnLimpiar = document.getElementById('btn-limpiar');
    const btnGuardar = document.getElementById('btn-guardar');
    const tbody = document.querySelector('tbody');

    if (!modal) return;

    function abrirModal() {
        modal.classList.add('activo');
    }

    function cerrarModal() {
        modal.classList.remove('activo');
    }

    function limpiarFormulario() {
        const cantidad = document.getElementById('cantidad');
        const estado = document.getElementById('estado');
        
        if (cantidad) cantidad.value = '';
        if (estado) estado.value = 'disponible';
    }

    if (btnAgregar) {
        btnAgregar.addEventListener('click', () => {
            modalTitulo.textContent = 'Nuevo Guardaropa';
            limpiarFormulario();
            abrirModal();
        });
    }

    if (tbody) {
        tbody.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-editar')) {
                const fila = e.target.closest('tr');
                const estado = document.getElementById('estado');
                
                // Cargar el estado de la fila (columna 4)
                if (estado && fila.cells[4]) {
                    estado.value = fila.cells[4].textContent.toLowerCase();
                }
                
                modalTitulo.textContent = 'Editar Guardaropa';
                abrirModal();
            }
        });
    }

    if (btnCerrar) {
        btnCerrar.addEventListener('click', cerrarModal);
    }

    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', limpiarFormulario);
    }

    if (btnGuardar) {
        btnGuardar.addEventListener('click', async () => {
            const cantidad = document.getElementById('cantidad');
            const estado = document.getElementById('estado');
            
            const cantidadVal = cantidad ? parseInt(cantidad.value) : 1;
            
            if (!cantidadVal || cantidadVal < 1) {
                alert('Por favor ingrese una cantidad válida (mínimo 1)');
                return;
            }
            
            const datos = {
                cantidad: cantidadVal,
                estado: estado ? estado.value : 'disponible'
            };
            
            try {
                await crearGuardaropa(datos);
                alert(`${cantidadVal} guardaropa(s) guardado(s) correctamente`);
                cerrarModal();
                cargarGuardaropas();
            } catch (error) {
                alert('Error al guardar: ' + error.message);
            }
        });
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) cerrarModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('activo')) cerrarModal();
    });
}

// ==========================================
// FUNCIONES DE CARGA DE DATOS DIN�MICOS
// ==========================================

/**
 * Cargar computadoras desde el backend
 */
async function cargarComputadoras() {
    try {
        const computadoras = await obtenerComputadoras();
        const tbody = document.querySelector('tbody');
        
        if (!tbody) return;

        if (!computadoras || computadoras.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No hay computadoras registradas</td></tr>';
            return;
        }

        tbody.innerHTML = computadoras.map(comp => `
            <tr data-id="${comp.id}">
                <td>${comp.id || '-'}</td>
                <td>${comp.procesador || '-'}</td>
                <td>${comp.ram || '-'}</td>
                <td>${comp.carrera || '-'}</td>
                <td>${comp.ocupado ? 'Ocupado' : 'Disponible'}</td>
                <td><button class="btn-editar">Editar</button></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error cargando computadoras:', error);
        const tbody = document.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6">Error al cargar datos</td></tr>';
        }
    }
}

/**
 * Cargar libros desde el backend
 */
async function cargarLibros() {
    try {
        const libros = await obtenerLibros();
        const tbody = document.querySelector('tbody');
        
        if (!tbody) return;

        if (!libros || libros.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">No hay libros registrados</td></tr>';
            return;
        }

        tbody.innerHTML = libros.map(libro => `
            <tr data-id="${libro.id}">
                <td>${libro.id || '-'}</td>
                <td>${libro.titulo || '-'}</td>
                <td>${libro.autor || '-'}</td>
                <td>${libro.editorial || '-'}</td>
                <td>${libro.carrera || '-'}</td>
                <td>${libro.cantidad_disponible || 0}</td>
                <td><button class="btn-editar">Editar</button></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error cargando libros:', error);
        const tbody = document.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7">Error al cargar datos</td></tr>';
        }
    }
}

/**
 * Cargar restiradores desde el backend
 */
async function cargarRestiradores() {
    try {
        const restiradores = await obtenerRestiradores();
        const tbody = document.querySelector('tbody');
        
        if (!tbody) return;

        if (!restiradores || restiradores.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">No hay restiradores registrados</td></tr>';
            return;
        }

        tbody.innerHTML = restiradores.map(rest => `
            <tr data-id="${rest.id}">
                <td>${rest.no_restirador || '-'}</td>
                <td>${rest.no_inventario || '-'}</td>
                <td>${rest.ocupado ? 'Ocupado' : 'Disponible'}</td>
                <td><button class="btn-editar">Editar</button></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error cargando restiradores:', error);
        const tbody = document.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="4">Error al cargar datos</td></tr>';
        }
    }
}

/**
 * Cargar guardaropas desde el backend
 */
async function cargarGuardaropas() {
    try {
        const guardaropas = await obtenerGuardaropas();
        const tbody = document.querySelector('tbody');
        
        if (!tbody) return;

        if (!guardaropas || guardaropas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No hay guardaropas registrados</td></tr>';
            return;
        }

        tbody.innerHTML = guardaropas.map(guard => `
            <tr data-id="${guard.id}">
                <td>${guard.id || '-'}</td>
                <td>${guard.ubicacion || '-'}</td>
                <td>${guard.piso || '-'}</td>
                <td>${guard.tipo || '-'}</td>
                <td>${guard.ocupado ? 'Ocupado' : 'Disponible'}</td>
                <td><button class="btn-editar">Editar</button></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error cargando guardaropas:', error);
        const tbody = document.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6">Error al cargar datos</td></tr>';
        }
    }
}
