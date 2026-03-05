// Sistema de carga dinámica de componentes para el panel administrativo

document.addEventListener('DOMContentLoaded', function() {
    const contentLoader = document.getElementById('content-loader');
    const pageTitle = document.getElementById('page-title');
    const navLinks = document.querySelectorAll('.nav-link');
    const aside = document.querySelector('nav');
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
                
                // Cambiar vista según el componente (inicio vs tablas)
                const containerInfo = document.querySelector('.container-informacion');
                if (containerInfo) {
                    if (componentName === 'inicio') {
                        containerInfo.classList.add('vista-inicio');
                        containerInfo.classList.remove('vista-tablas');
                    } else {
                        containerInfo.classList.add('vista-tablas');
                        containerInfo.classList.remove('vista-inicio');
                    }
                }
                
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

                inicializarComponente(componentName);
              
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
                case 'solicitudesLibros':
                    if (typeof inicializarSolicitudesLibros === 'function') {
                        inicializarSolicitudesLibros();
                    }
                    break;
                case 'prestamosLibros':
                    if (typeof inicializarPrestamosLibros === 'function') {
                        inicializarPrestamosLibros();
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
                case 'usuarios':
                    if (typeof inicializarUsuarios === 'function') {
                        inicializarUsuarios();
                    }
                    break;
                case 'documentos':
                    if (typeof inicializarDocumentos === 'function') {
                        inicializarDocumentos();
                    }
                    break;
                default:
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
        btnGuardar.addEventListener('click', () => {
            // Aquí puedes agregar la lógica para guardar
            const datos = {
                procesador: document.getElementById('procesador').value,
                programas: document.getElementById('programas').value,
                carrera: document.getElementById('carrera').value,
                ram: document.getElementById('ram').value,
                estado: document.getElementById('estado').value
            };
            
            // Aquí iría la lógica para enviar al servidor
            
            alert('Computadora guardada correctamente');
            cerrarModal();
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
        btnGuardar.addEventListener('click', () => {
            const datos = {
                titulo: document.getElementById('titulo').value,
                autor: document.getElementById('autor').value,
                editorial: document.getElementById('editorial').value,
                isbn: document.getElementById('isbn').value,
                carrera: document.getElementById('carrera').value,
                cantidad: document.getElementById('cantidad').value
            };
            alert('Libro guardado correctamente');
            cerrarModal();
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
        document.getElementById('cantidad').value = '';
        document.getElementById('tamano').value = '';
        document.getElementById('estado').value = 'disponible';
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
                document.getElementById('tamano').value = fila.cells[1].textContent;
                document.getElementById('estado').value = fila.cells[2].textContent.toLowerCase();
                
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
        btnGuardar.addEventListener('click', () => {
            const datos = {
                cantidad: document.getElementById('cantidad').value,
                tamano: document.getElementById('tamano').value,
                estado: document.getElementById('estado').value
            };
            alert('Restirador guardado correctamente');
            cerrarModal();
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
        document.getElementById('cantidad').value = '';
        document.getElementById('estado').value = 'disponible';
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
                // Cargar el estado de la fila
                document.getElementById('estado').value = fila.cells[4].textContent.toLowerCase();
                
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
        btnGuardar.addEventListener('click', () => {
            const datos = {
                cantidad: document.getElementById('cantidad').value,
                estado: document.getElementById('estado').value
            };
            alert('Guardaropa guardado correctamente');
            cerrarModal();
        });
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) cerrarModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('activo')) cerrarModal();
    });
}
