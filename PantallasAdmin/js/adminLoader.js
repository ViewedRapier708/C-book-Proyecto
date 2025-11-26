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
                
                // Inicializar funciones del backend según el componente cargado
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
