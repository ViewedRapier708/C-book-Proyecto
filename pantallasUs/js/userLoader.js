// Sistema de carga dinámica de componentes para el panel de estudiantes

document.addEventListener('DOMContentLoaded', function() {
    const contentLoader = document.getElementById('content-loader');
    const pageTitle = document.getElementById('page-title');
    const navLinks = document.querySelectorAll('.nav-link');
    const aside = document.querySelector('aside');
    const overlay = document.querySelector('.menu-overlay');
    const toggle = document.querySelector('.menu-toggle');

    // Gestión del menú móvil
    const closeMenu = () => {
        if (aside) {
            aside.classList.remove('open');
        }
        if (overlay) {
            overlay.classList.remove('show', 'active');
        }
    };

    const openMenu = () => {
        if (aside) {
            aside.classList.add('open');
        }
        if (overlay) {
            overlay.classList.add('show', 'active');
        }
    };

    if (toggle) {
        toggle.addEventListener('click', openMenu);
    }
    
    if (overlay) {
        overlay.addEventListener('click', closeMenu);
    }

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMenu();
    });

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
                const buttons = contentLoader.querySelectorAll('.container-btn-apartar');
                
                tables.forEach(el => el.classList.add('component-enter-table'));
                buttons.forEach(el => el.classList.add('component-enter-buttons'));
                
                if (pageTitle) {
                    pageTitle.textContent = title;
                }

                // Cerrar menú en móvil después de cargar
                if (window.innerWidth <= 1024) {
                    closeMenu();
                }
            })
            .catch(err => {
                console.error('Error cargando componente:', err);
                contentLoader.innerHTML = `
                    <div style="padding: 20px; color: #d32f2f; background: #ffebee; border-radius: 4px;">
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
        loadComponent('inicio', 'BIENVENIDO USUARIO');
    }
});
