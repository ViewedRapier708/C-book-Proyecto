# C-Book — Filosofía de Diseño (Evolución Sprint 1 → Sprint 5)

**Stack actual:** React + Vite + Tailwind CSS v4  
**Fecha de documentación:** Mayo 2026  
**Propósito:** Tesina — registro completo del sistema de diseño de C-Book, cubriendo la versión legado y la evolución sprint a sprint hasta el estado actual en producción.

> Este documento es el complemento del archivo `DESIGN_PHILOSOPHY.md`, que documenta en detalle el sistema legado (Sprint 1 / HTML+CSS+JS vanilla). Aquí se registra la evolución a partir del Sprint 2 y el estado actual consolidado.

---

## Índice

1. [Cronología del Diseño por Sprint](#1-cronología-del-diseño-por-sprint)
2. [Sprint 1 — Sistema Legado (resumen)](#2-sprint-1--sistema-legado-resumen)
3. [Sprint 2 — Migración a React y Tema Oscuro](#3-sprint-2--migración-a-react-y-tema-oscuro)
4. [Sprint 3 — Modo Claro y Módulo de Soporte](#4-sprint-3--modo-claro-y-módulo-de-soporte)
5. [Sprint 4 — Nuevo Sistema de Navegación](#5-sprint-4--nuevo-sistema-de-navegación)
6. [Sistema de Diseño Actual (v3)](#6-sistema-de-diseño-actual-v3)
7. [Decisiones de Diseño Transversales](#7-decisiones-de-diseño-transversales)
8. [Apéndice — Variables CSS Actuales](#8-apéndice--variables-css-actuales)

---

## 1. Cronología del Diseño por Sprint

| Sprint | Fechas | Cambio principal de diseño | Stack |
|--------|--------|----------------------------|-------|
| **S1** | Antes de abr 2026 | Sistema legado — paleta burdeos/rosa, sidebar fijo 280px | HTML + CSS + JS vanilla |
| **S2** | 14 abr – 27 abr 2026 | Migración a React; nueva paleta oscura (negros, slate, azul marino); glassmorphism | React + Vite + Tailwind CSS v4 |
| **S3** | 27 abr – 09 may 2026 | Modo claro (verde teal + ámbar); módulo de soporte completo (6 pantallas) | React — dual-theme CSS variables |
| **S4** | 09 may – 17 may 2026 | Sidebar reemplazado por navbar horizontal con dropdowns y Command Palette | React — Navbar + Lucide Icons |
| **S5** | 17 may – 05 jun 2026 | Refinamientos y despliegue en producción (Render + Vercel) | React — producción |

> **Nota sobre fechas y commits:** El historial de Git muestra que parte del trabajo técnico de cada sprint comenzó antes de la fecha oficial de inicio (por ejemplo, los commits de migración a React son de principios de marzo 2026). Las fechas de sprint reflejan el calendario académico del proyecto; los commits son la fuente de verdad técnica.

---

## 2. Sprint 1 — Sistema Legado (resumen)

El Sprint 1 estableció la identidad visual original de C-Book. Los detalles completos están documentados en `DESIGN_PHILOSOPHY.md`. A continuación se presenta un resumen de los elementos clave que sirven como punto de comparación con los sprints posteriores.

| Elemento | Valor en el legado |
|----------|--------------------|
| Color primario | `#7B0233` (burdeos) |
| Fondos | Rosa pálido `#F2D9E3` → `#F8D7E8` (usuario); gris `#F5F5F7` (admin) |
| Tipografía | Poppins (usuario) + Inter (admin) — dos fuentes con roles diferenciados |
| Navegación | Sidebar fijo de 280px a la izquierda |
| Sombras | Teñidas con el color de marca: `rgba(123, 2, 51, X)` |
| Iconografía | Emojis Unicode (`📚`, `✓`, `✕`) y pseudo-elementos CSS |
| Responsividad | `clamp()` extensivo + 5 breakpoints (480, 600, 768, 1200px) |
| Tecnología CSS | Variables CSS manuales en múltiples archivos separados por panel |

---

## 3. Sprint 2 — Migración a React y Tema Oscuro

**Fechas:** 14 abr – 27 abr 2026  
**Commits de referencia:** `842bb01` — *Se hizo toda la migración a React*; `73b47a0` — *Se editó la paleta de colores y se eliminó el aside*

### 3.1 Contexto del cambio

El Sprint 2 fue la ruptura más radical en la historia visual de C-Book. Se abandonó completamente el stack HTML/CSS/JS vanilla en favor de **React + Vite + Tailwind CSS v4** y, con ello, se reinventó la identidad cromática del sistema. Los burdeos y rosas del legado fueron reemplazados por una paleta de **negros, azules profundos y grises pizarra**, propia de dashboards técnicos y herramientas de productividad modernas.

### 3.2 Por qué cambiar la paleta por completo

| Decisión | Razonamiento |
|----------|-------------|
| Fondos negros (`#000000`) | Máximo contraste, aspecto premium de herramienta profesional. |
| Azules profundos como acento (`#2b3e55`) | Diferenciación clara del legado sin perder sobriedad institucional. |
| Glassmorphism con `backdrop-filter: blur` | Aporta profundidad y modernidad sin saturar la interfaz con color. |
| Una sola fuente (Inter) para todo el sistema | Unificación tipográfica — en el legado la división Poppins/Inter era entre paneles; en React existe un solo sistema de componentes compartido. |

### 3.3 Nueva paleta — Tema oscuro

#### Fondos

| Variable | Valor | Uso |
|----------|-------|-----|
| `--bg-primary` | `#000000` | Fondo de página principal |
| `--bg-secondary` | `#0b0f15` | Fondo de modales y paneles secundarios |
| `--bg-card` | `rgba(22, 31, 42, 0.86)` | Tarjetas con transparencia (glassmorphism) |
| `--bg-card-hover` | `rgba(32, 46, 63, 0.92)` | Tarjetas en hover |
| `--bg-glass` | `rgba(255, 255, 255, 0.035)` | Glassmorphism sutil |
| `--bg-glass-strong` | `rgba(255, 255, 255, 0.07)` | Glassmorphism con más presencia |
| `--bg-input` | `rgba(255, 255, 255, 0.06)` | Fondos de campos de texto |
| `--bg-sidebar` | `rgba(0, 0, 0, 0.96)` | Sidebar casi opaco |
| `--bg-modal-overlay` | `rgba(0, 0, 0, 0.6)` | Fondo de overlays de modal |

#### Texto

| Variable | Valor | Uso |
|----------|-------|-----|
| `--text-primary` | `#f5f7f8` | Texto principal |
| `--text-secondary` | `#b4bfca` | Texto secundario |
| `--text-muted` | `#738296` | Labels, metadatos, texto auxiliar |
| `--text-inverse` | `#000000` | Texto sobre fondos claros |

#### Acentos y gradientes

| Variable | Valor |
|----------|-------|
| `--accent-primary` | `#2b3e55` |
| `--accent-primary-light` | `#3b536f` |
| `--accent-primary-dark` | `#161f2a` |
| `--accent-secondary` | `#738296` |
| `--accent-gradient` | `linear-gradient(135deg, #000000 → #0b0f15 → #161f2a → #2b3e55)` |
| `--accent-gradient-btn` | `linear-gradient(135deg, #0b0f15 → #202e3f)` |
| `--button-primary-bg` | `#161f2a` |
| `--button-primary-hover` | `#202e3f` |
| `--primary` | `#202e3f` |
| `--accent` | `#738296` |
| `--gradient-primary` | `linear-gradient(135deg, #0b0f15 → #2b3e55)` |

#### Bordes

| Variable | Valor |
|----------|-------|
| `--border-color` | `rgba(115, 130, 150, 0.2)` |
| `--border-glow` | `rgba(43, 62, 85, 0.35)` |

#### Sombras (tema oscuro)

Las sombras migran de colores de marca (`rgba(123,2,51,x)`) a negro neutro, coherente con la nueva paleta monocromática:

| Variable | Valor |
|----------|-------|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.3)` |
| `--shadow-md` | `0 4px 16px rgba(0,0,0,0.3)` |
| `--shadow-lg` | `0 8px 32px rgba(0,0,0,0.4)` |
| `--shadow-glow` | `0 10px 24px rgba(11, 15, 21, 0.24)` |

### 3.4 Sistema de radios de borde formalizado

El legado usaba valores ad hoc (`8px`, `20px`, `50px`). En el Sprint 2 se establece una escala sistemática:

| Variable | Valor | Uso |
|----------|-------|-----|
| `--radius-xs` | `6px` | Micro-elementos, chips |
| `--radius-sm` | `10px` | Botones, inputs, dropdowns |
| `--radius-md` | `14px` | Tarjetas, paneles |
| `--radius-lg` | `20px` | Modales |
| `--radius-xl` | `28px` | Hero cards, auth |
| `--radius-full` | `9999px` | Badges, avatares, pills |

### 3.5 Tailwind CSS v4 y tokens de diseño

El sistema migra de variables CSS manuales a **tokens de Tailwind definidos en `@theme`**:

```css
@theme {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --color-primary-500: #1f8a70;   /* verde teal — preparado para modo claro */
  --color-accent-500:  #de8a2e;   /* ámbar — acento cálido */
  --color-success:     #1f9d74;
  --color-warning:     #d97706;
  --color-danger:      #dc4c3f;
  --color-info:        #0284c7;
}
```

> Los colores `primary` (verde teal) y `accent` (ámbar) se definieron en el Sprint 2 anticipando el modo claro del Sprint 3, aunque en ese momento el sistema solo activaba el tema oscuro.

### 3.6 Nuevos componentes introducidos en el Sprint 2

#### Glass Cards
```
background:       var(--bg-card)  ← rgba semitransparente
backdrop-filter:  blur(12px)      ← efecto glassmorphism
border:           1px solid var(--border-color)
border-radius:    var(--radius-md)
hover:            translateY(-2px) + border → --border-glow + --shadow-glow
```

#### Stat Cards
Tarjetas de métricas con una línea de acento de 3px en la parte superior (pseudo-elemento `::before`) cuyo color varía según el tipo de métrica vía `--stat-accent`.

#### Badges rediseñados
Los badges migran de fondos sólidos a la combinación `fondo semitransparente / color vivo`:
```
.badge-success:  rgba(31,157,116,0.14)  /  #1f9d74
.badge-warning:  rgba(217,119,6,0.14)   /  #d97706  + punto pulsante ●
.badge-danger:   rgba(220,76,63,0.14)   /  #dc4c3f
.badge-info:     rgba(2,132,199,0.14)   /  #0284c7
```

#### Skeleton Loading (nuevo)
Sistema de placeholders animados para estados de carga:
```css
background: linear-gradient(90deg,
  var(--bg-glass) 25%,
  var(--bg-glass-strong) 37%,
  var(--bg-glass) 63%
);
background-size: 200% 100%;
animation: shimmer 1.5s ease infinite;
```

#### Command Palette (nuevo)
Paleta de comandos activable con `Ctrl+K`: overlay con `backdrop-filter: blur(6px)`, animación `slideUp`, búsqueda de rutas en tiempo real. Z-index 300 (sobre modales).

### 3.7 Pantalla de autenticación rediseñada

Mantiene el patrón de dos paneles del legado pero con estética completamente nueva:

```
Panel izquierdo (hero):
  background: linear-gradient(135deg,
    #000000 0%, #000000 30%, #0b0f15 52%, #161f2a 76%, #2b3e55 100%)
  + "auth-hero" card con glassmorphism
    (border rgba(255,255,255,0.12), backdrop-filter blur(14px))

Panel derecho (formulario):
  background: linear-gradient(180deg, #10151c 0%, #0b0f15 100%)
  + auth-form: fondo rgba(255,255,255,0.94)
    → el formulario "flota" como elemento de luz sobre fondo oscuro
```

### 3.8 Estructura de archivos — Sprint 2

```
frontend/src/
├── styles/
│   └── globals.css            ← Sistema de diseño completo
├── components/
│   ├── layout/
│   │   ├── DashboardLayout.jsx
│   │   ├── Sidebar.jsx        ← Sidebar de React (sustituido en Sprint 4)
│   │   ├── ProtectedRoute.jsx
│   │   └── AnimatedPage.jsx
│   └── ui/
│       ├── StatCard.jsx
│       ├── Modal.jsx
│       ├── Pagination.jsx
│       ├── Skeleton.jsx
│       ├── CommandPalette.jsx
│       └── ExportButtons.jsx
├── pages/
│   ├── Login.jsx
│   ├── admin/
│   └── user/
└── context/
    └── AuthContext.jsx
```

---

## 4. Sprint 3 — Modo Claro y Módulo de Soporte

**Fechas:** 27 abr – 09 may 2026  
**Commit de referencia:** `962d9f6` — *Se hicieron las pantallas de soporte v1*

### 4.1 Sistema de tema dual

El Sprint 3 introduce el toggle claro/oscuro mediante `data-theme="light"` en `<html>`. La implementación usa:

1. **`ThemeContext.jsx`** — Context API que lee y persiste el tema en `localStorage` (`cbook-theme`). El tema por defecto es `'dark'`.
2. **`ThemeToggle.jsx`** — Botón sol/luna ubicado en el topbar del dashboard.
3. **CSS custom properties** — Los mismos nombres de variable con valores distintos según el bloque activo:
   - `:root, [data-theme="dark"]` — paleta oscura
   - `[data-theme="light"]` — paleta clara

### 4.2 Paleta del modo claro

#### Fondos y superficies

| Variable | Valor | Contraste con el modo oscuro |
|----------|-------|------------------------------|
| `--bg-primary` | `#f6f4ee` | Crema cálido vs negro absoluto |
| `--bg-secondary` | `#fffdf8` | Blanco marfil vs `#0b0f15` |
| `--bg-card` | `rgba(255, 253, 248, 0.92)` | Superficie cálida vs azul-oscuro |
| `--bg-sidebar` | `rgba(255, 252, 246, 0.95)` | Sidebar casi blanco |
| `--bg-modal-overlay` | `rgba(0, 0, 0, 0.3)` | Overlay más suave |

#### Texto

| Variable | Valor |
|----------|-------|
| `--text-primary` | `#111111` |
| `--text-secondary` | `#1e2422` |
| `--text-muted` | `#5f6e69` |
| `--text-inverse` | `#f8fafc` |

#### Acentos — verde teal y ámbar

El modo claro activa los tokens `primary` y `accent` que habían sido definidos pero dormidos desde el Sprint 2:

| Variable | Valor |
|----------|-------|
| `--accent-primary` | `#176d5a` (verde oscuro) |
| `--accent-primary-light` | `#1f8a70` |
| `--accent-primary-dark` | `#10453c` |
| `--accent-secondary` | `#c46f21` (ámbar) |
| `--accent-gradient` | `linear-gradient(135deg, #176d5a → #c46f21)` |
| `--button-primary-bg` | `#176d5a` |
| `--primary` | `#176d5a` |
| `--accent` | `#c46f21` |
| `--gradient-primary` | `linear-gradient(135deg, #176d5a → #c46f21)` |

> **Decisión cromática:** El modo claro no recupera los burdeos del legado. Se eligió verde teal + ámbar para mantener la continuidad tecnológica con el stack React (Inter, radios, glassmorphism) y evitar confusión entre el sistema antiguo y el actual, mientras se ofrece una identidad cromática fresca y accesible.

#### Sombras en modo claro

```css
--shadow-sm:   0 1px 3px rgba(0,0,0,0.08)
--shadow-md:   0 4px 16px rgba(0,0,0,0.08)
--shadow-lg:   0 8px 32px rgba(0,0,0,0.1)
--shadow-glow: 0 10px 24px rgba(23, 109, 90, 0.1)   /* teñida de verde */
```

Las sombras en modo claro son más sutiles y se tiñen del color de acento verde, recuperando la filosofía de "sombras de marca" del sistema legado pero adaptada a la nueva paleta.

---

### 4.3 Módulo de Soporte — 6 pantallas

El Sprint 3 agrega un módulo completamente nuevo. Todas las páginas viven en `frontend/src/pages/support/` y comparten un archivo de estilos dedicado: `frontend/src/styles/support.css`.

| Archivo | Rol |
|---------|-----|
| `SoporteDashboard.jsx` | Panel principal con métricas de tickets (KPIs) |
| `BandejaTickets.jsx` | Listado de todos los tickets con filtros y tabla |
| `DetalleTicket.jsx` | Vista individual de un ticket con historial y acciones |
| `ReportarError.jsx` | Formulario de creación de nuevo reporte |
| `MisReportes.jsx` | Vista del usuario con sus propios tickets |
| `ConfiguracionSoporte.jsx` | Panel de configuración del módulo (admin) |

#### Convención de nombres CSS del módulo

El módulo usa el prefijo `.sup-` para aislar sus estilos del sistema global y evitar colisiones:

```css
.sup-badge        /* badges de estado de ticket */
.sup-stat-card    /* tarjetas de métricas de soporte */
.sup-sla-bar      /* barras de tiempo SLA */
.sup-ticket-id    /* identificador de ticket en monospace */
```

#### Paleta de estados de ticket

Todos los colores usan fondos semitransparentes sobre `--bg-card`, lo que los hace compatibles con ambos temas sin necesitar reglas duplicadas:

| Clase | Background | Color texto | Estado |
|-------|-----------|-------------|--------|
| `.sup-estado-nuevo` | `rgba(2,132,199,0.18)` | `#7dd3fc` | Recién creado |
| `.sup-estado-abierto` | `rgba(196,111,33,0.18)` | `#fbbf24` | En atención |
| `.sup-estado-pendiente` | `rgba(217,119,6,0.20)` | `#fde68a` | Esperando información |
| `.sup-estado-espera` | `rgba(139,92,246,0.18)` | `#c4b5fd` | En espera de terceros |
| `.sup-estado-resuelto` | `rgba(31,157,116,0.20)` | `#6ee7b7` | Resuelto |
| `.sup-estado-cerrado` | `rgba(207,217,230,0.10)` | `var(--text-muted)` | Cerrado |

#### Paleta de categorías de error

| Clase | Color | Categoría |
|-------|-------|-----------|
| `.sup-badge-funcional` | `#38bdf8` | Error funcional |
| `.sup-badge-visual` | `#a78bfa` | Error visual |
| `.sup-badge-rendimiento` | `#fbbf24` | Rendimiento |
| `.sup-badge-datos` | `#34d399` | Datos / integridad |
| `.sup-badge-acceso` | `#f87171` | Acceso / permisos |

#### Tipografía especial: Ticket ID

Los identificadores de ticket usan fuente monoespaciada con color ámbar para distinguirlos visualmente del texto normal:

```css
.sup-ticket-id {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size:   0.78rem;
  color:       #e89a4f;
  font-weight: 700;
}
```

#### Barras de SLA

Componente visual para el tiempo restante de atención:

```css
.sup-sla-bar  { height: 5px; border-radius: 999px; background: rgba(255,255,255,0.07); }
.sup-sla-fill { height: 5px; border-radius: 999px; transition: width 0.3s; }
/* El color del fill se asigna dinámicamente según % de tiempo consumido */
```

---

## 5. Sprint 4 — Nuevo Sistema de Navegación

**Fechas:** 09 may – 17 may 2026  
**Commit de referencia:** `73b47a0` — *Se editó la paleta de colores y se eliminó el aside para pasar a ser un nav*

### 5.1 El cambio: de sidebar lateral a navbar horizontal

El cambio más significativo del Sprint 4 fue reemplazar la navegación lateral fija por un **navbar horizontal superior con menús desplegables por sección**. El sidebar había existido desde el legado y se mantuvo en los primeros sprints de React; este sprint lo elimina por completo de la navegación principal.

| Aspecto | Sidebar (anterior) | Navbar horizontal (actual) |
|---------|--------------------|---------------------------|
| Posición | Izquierda, fijo, 260px | Superior, fijo, 56px de alto |
| Espacio de contenido | `calc(100% - 260px)` | 100% del ancho, `padding-top: 80px` |
| Organización | Secciones verticales lineales | Grupos con dropdowns desplegables |
| Responsive | Overlay deslizable en móvil | Hamburguesa → panel lateral en móvil |
| Íconos | Lucide a la izquierda de cada ítem | Lucide dentro de cada ítem del dropdown |

### 5.2 Estructura del Navbar actual

El componente `Navbar.jsx` organiza la navegación en **secciones que se convierten en menús dropdown**:

**Secciones del panel de administrador:**
```
General       → Inicio, Analytics, Reportes
Altas         → Libros
Gestión       → Usuarios, Documentos, Solicitudes Libros, Préstamos Libros
Soporte       → Dashboard Soporte, Bandeja de Tickets, Reportar Error,
                Mis Reportes, Config. Soporte
```

**Secciones del panel de usuario:**
```
General       → Inicio
Servicios     → Libros
Mis Solicitudes → Solicitudes, Solicitudes Libros
Cuenta        → Mi Perfil, Cambiar Contraseña
Soporte       → Reportar Error, Mis Reportes
```

### 5.3 Comportamiento de los dropdowns

```
Trigger:   Botón con etiqueta de sección + ChevronDown
           (rota 180° cuando está abierto)
Panel:     background var(--bg-card)
           backdrop-blur-xl
           border var(--border-color)
           rounded-lg
           shadow-xl
           z-index 50

Ítem activo:  background var(--button-primary-bg), color white
Ítem hover:   background var(--bg-glass-strong), color var(--text-primary)
Cierre:       Click fuera del dropdown (useRef + mousedown listener)
```

### 5.4 Menú de usuario (UserMenu)

Dropdown en el extremo derecho del navbar:
- Avatar circular con iniciales de boleta (fondo `--gradient-primary`)
- Nombre / boleta y correo truncado (visible en desktop)
- Botón de cierre de sesión con ícono `LogOut`

### 5.5 Topbar de utilidades

Barra de herramientas ubicada sobre el contenido principal (fuera del navbar):

```
Posición: flex justify-end, padding 1rem 0
Elementos:
  1. Botón Ctrl+K → abre CommandPalette
     (estilo monospace, border, opacity 0.7)
  2. ThemeToggle → icono sol/luna
     (cambia data-theme en <html> y persiste en localStorage)
```

### 5.6 Impacto en el layout

```
Antes (sidebar):                 Después (navbar):
┌────────┬──────────┐            ┌──────────────────────┐  ← Navbar fijo (56px)
│Sidebar │Contenido │            ├──────────────────────┤
│ 260px  │ flex:1   │            │  Contenido            │
│ fixed  │          │            │  max-w-[1600px]       │
└────────┴──────────┘            │  mx-auto, px-4/px-8   │
                                 │  pt-20 (compensa nav) │
                                 └──────────────────────┘
```

El contenido pasa a centrarse con `max-width: 1600px` y `margin: 0 auto`, mejorando la legibilidad en monitores ultra-wide.

---

## 6. Sistema de Diseño Actual (v3)

Estado consolidado del sistema de diseño en el Sprint 5.

### 6.1 Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework UI | React 18 + Vite |
| Estilos globales | Tailwind CSS v4 + CSS custom properties en `globals.css` |
| Estilos de módulo | CSS scoped por módulo (`support.css` con prefijo `.sup-`) |
| Animaciones | Framer Motion (`AnimatePresence`, `motion.div`) |
| Iconos | Lucide React |
| Tipografía | Inter (única fuente en todo el sistema) |
| Gestión de tema | Context API + `data-theme` en `<html>` + `localStorage` |
| Routing | React Router v6 |
| Despliegue | Vercel (frontend) + Render (backend) |

### 6.2 Paleta comparada — dark vs light

| Variable | Modo oscuro | Modo claro |
|----------|-------------|------------|
| `--bg-primary` | `#000000` | `#f6f4ee` |
| `--bg-secondary` | `#0b0f15` | `#fffdf8` |
| `--bg-card` | `rgba(22,31,42,0.86)` | `rgba(255,253,248,0.92)` |
| `--text-primary` | `#f5f7f8` | `#111111` |
| `--text-secondary` | `#b4bfca` | `#1e2422` |
| `--text-muted` | `#738296` | `#5f6e69` |
| `--accent-primary` | `#2b3e55` | `#176d5a` |
| `--accent-secondary` | `#738296` | `#c46f21` |
| `--button-primary-bg` | `#161f2a` | `#176d5a` |
| `--primary` | `#202e3f` | `#176d5a` |
| `--accent` | `#738296` | `#c46f21` |
| `--shadow-glow` | `rgba(11,15,21,0.24)` | `rgba(23,109,90,0.1)` |

### 6.3 Tipografía actual

**Inter** — única familia tipográfica para todo el sistema:

| Elemento | Tamaño | Peso |
|----------|--------|------|
| Títulos de página (h1) | `1.75rem` (1.35rem móvil) | 800 |
| Títulos de sección | `1.1rem`–`1.25rem` | 700 |
| Cuerpo de texto | `0.85rem`–`0.9rem` | 400–500 |
| Labels de formulario | `0.82rem` | 600 |
| Texto auxiliar / muted | `0.72rem`–`0.78rem` | 400–500 |
| Badges y chips | `0.7rem` | 600 |
| Secciones de nav | `0.65rem` | 700 + uppercase |

Características globales:
```css
-webkit-font-smoothing: antialiased;
letter-spacing: -0.02em;   /* en títulos grandes */
```

### 6.4 Componentes del sistema actual

#### Glass Card (base universal)
```
.glass-card
  background:       var(--bg-card)
  backdrop-filter:  blur(12px)
  border:           1px solid var(--border-color)
  border-radius:    var(--radius-md)
  padding:          1.25rem
  transition:       all 0.25s cubic-bezier(0.4, 0, 0.2, 1)

hover → translateY(-2px) + border → --border-glow + shadow-glow
```

#### Botones
```
.btn-primary  → background var(--button-primary-bg), sombra con --button-primary-shadow
.btn-ghost    → background var(--bg-glass), border var(--border-color)
.btn-outline  → transparent, border var(--border-color)
.btn-success  → background var(--success)
.btn-danger   → background var(--danger)

Tamaños: .btn-sm / .btn (default) / .btn-lg / .btn-icon
Todos: hover translateY(-1px), disabled opacity 0.5
```

#### Tabla de datos
```
Encabezado:   background var(--bg-glass-strong)
              font-size 0.72rem, weight 700, uppercase, letter-spacing 0.06em
              clickable para ordenar (cursor pointer, sort-icon)
Fila hover:   background var(--bg-glass)
Última fila:  sin border-bottom
```

#### Modal
```
Overlay:      backdrop-filter blur(8px), z-index 200
Contenido:    bg var(--bg-secondary), border-radius --radius-lg (20px)
              max-h 90vh, overflow-y auto
Animación:    slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)
Estructura:   .modal-header / .modal-body / .modal-footer
```

#### Resource Cards
Grid `auto-fill, minmax(310px, 1fr)`:
- `.resource-card-title` — encabezado con borde inferior
- `.resource-card-body` — filas dato/valor (`.resource-card-row`)
- `.resource-card-actions` — botones con borde superior

#### Page Loader (Suspense fallback)
Ícono con `animation: pulse-glow` (brillo pulsante), barra indeterminada con `animation: loader-slide`, texto de estado.

### 6.5 Animaciones actuales

| Nombre | Uso | Duración |
|--------|-----|----------|
| `fadeIn` | Entrada de overlays | `0.2s` |
| `slideUp` | Modales, command palette | `0.25s` |
| `pulse` | Punto de badge warning | `2s infinite` |
| `spin` | Spinner de carga | `0.7s linear infinite` |
| `shimmer` | Skeleton loading | `1.5s ease infinite` |
| `pulse-glow` | Ícono del page loader | `1.8s ease-in-out infinite` |
| `loader-slide` | Barra del page loader | `1.2s ease-in-out infinite` |

Curva estándar: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-out de Material Design).

### 6.6 Iconografía actual

Se abandonan los emojis Unicode del legado. Todos los íconos son SVG de **Lucide React**:

| Ícono | Uso |
|-------|-----|
| `LayoutDashboard` | Inicio de paneles |
| `BookOpen` | Catálogo de libros |
| `Users` | Gestión de usuarios |
| `FileText` | Documentos |
| `ClipboardList` | Solicitudes |
| `BookCheck` | Préstamos |
| `BarChart3` | Analytics |
| `Bug` | Reportar error |
| `Inbox` | Bandeja de tickets |
| `Settings` | Configuración |
| `Command` | Atajo Ctrl+K |
| `LogOut` | Cierre de sesión |
| `ChevronDown` | Indicador de dropdown |

### 6.7 Responsive actual

| Breakpoint | Comportamiento |
|------------|----------------|
| > 768px | Navbar completo con dropdowns, `px-8` |
| ≤ 768px | Menú hamburguesa, sidebar deslizable + overlay, `px-4`, `pt-20` |
| ≤ 480px | Stats grid 2 columnas, resource grid 1 columna |

El sistema simplifica los 5 breakpoints del legado a 2 puntos principales (768px, 480px).

### 6.8 Z-index actuales

| Contexto | Z-index |
|----------|---------|
| Tarjetas normales | 1 |
| Dropdowns de nav | 50 |
| Navbar fijo | 97–98 |
| Overlay mobile | 99 |
| Sidebar mobile | 100 |
| Modales | 200 |
| Command Palette | 300 |

### 6.9 Estructura de archivos actual

```
frontend/src/
├── styles/
│   ├── globals.css              ← Sistema de diseño completo (dark + light + componentes)
│   ├── globals-original.css     ← Backup de referencia
│   └── support.css              ← Estilos del módulo de soporte (prefijo .sup-)
│
├── context/
│   ├── AuthContext.jsx          ← Autenticación global
│   └── ThemeContext.jsx         ← Gestión dark/light + localStorage
│
├── components/
│   ├── layout/
│   │   ├── DashboardLayout.jsx  ← Shell: Navbar + main + CommandPalette
│   │   ├── Navbar.jsx           ← Navbar horizontal con dropdowns (Sprint 4)
│   │   ├── Sidebar.jsx          ← Sidebar React (referencia, no activo)
│   │   ├── AnimatedPage.jsx     ← Wrapper Framer Motion para transiciones de ruta
│   │   └── ProtectedRoute.jsx   ← Guard de rutas autenticadas
│   └── ui/
│       ├── ThemeToggle.jsx
│       ├── CommandPalette.jsx
│       ├── StatCard.jsx
│       ├── Modal.jsx
│       ├── Pagination.jsx
│       ├── Skeleton.jsx
│       ├── Feedback.jsx
│       ├── ExportButtons.jsx
│       ├── PageLoader.jsx
│       └── ErrorBoundary.jsx
│
├── pages/
│   ├── Login.jsx
│   ├── ForgotPassword.jsx
│   ├── ResetPassword.jsx
│   ├── EmailVerification.jsx
│   ├── NotFound.jsx
│   ├── admin/
│   │   ├── AdminHome.jsx
│   │   ├── AltaLibros.jsx
│   │   ├── AltaAlumnos.jsx
│   │   ├── Usuarios.jsx
│   │   ├── Documentos.jsx
│   │   ├── SolicitudesLibros.jsx
│   │   ├── PrestamosLibros.jsx
│   │   ├── Analytics.jsx
│   │   └── Reportes.jsx
│   ├── user/
│   │   ├── UserHome.jsx
│   │   ├── SolicitudLibros.jsx
│   │   ├── MisSolicitudes.jsx
│   │   ├── MisSolicitudesLibros.jsx
│   │   ├── UserProfile.jsx
│   │   ├── EditarPerfil.jsx
│   │   ├── CambiarCorreo.jsx
│   │   └── ModificarCuenta.jsx
│   └── support/
│       ├── SoporteDashboard.jsx
│       ├── BandejaTickets.jsx
│       ├── DetalleTicket.jsx
│       ├── ReportarError.jsx
│       ├── MisReportes.jsx
│       └── ConfiguracionSoporte.jsx
│
├── App.jsx                      ← Definición de rutas (React Router v6)
└── main.jsx                     ← ThemeProvider + AuthProvider + StrictMode
```

---

## 7. Decisiones de Diseño Transversales

### 7.1 La evolución filosófica del color

| Sprint | Color de marca | Filosofía |
|--------|---------------|-----------|
| S1 | Burdeos `#7B0233` | Biblioteca académica — formalidad e institución |
| S2 | Negro `#000000` / Slate `#2b3e55` | Dashboard técnico — eficiencia y profesionalismo |
| S3 (light) | Verde teal `#176d5a` / Ámbar `#c46f21` | Naturaleza y calidez — accesibilidad sin perder sobriedad |

Los tres momentos de color son coherentes en que ninguno usa el azul corporativo genérico, y todos mantienen contraste adecuado para uso intensivo de pantalla.

### 7.2 Glassmorphism como lenguaje de profundidad

En el legado la profundidad se comunicaba con sombras de color de marca. En el sistema React el glassmorphism (`backdrop-filter: blur`, `rgba` con transparencia baja) reemplaza las sombras pesadas como mecanismo principal de jerarquía visual. El efecto es más perceptible sobre fondos oscuros — por eso encaja especialmente bien en el tema por defecto.

### 7.3 Consistencia semántica de los estados

A lo largo de todos los sprints, los colores semánticos mantienen su significado aunque cambien sus valores exactos:

| Estado | Legado | React |
|--------|--------|-------|
| Éxito | `#38A169` | `#1f9d74` |
| Advertencia | `#D69E2E` | `#d97706` |
| Error | `#E53E3E` | `#dc4c3f` |
| Info | `#3182CE` | `#0284c7` |

Verde, ámbar, rojo y azul se mantienen como señales universales que el usuario reconoce sin necesidad de re-aprender el sistema.

### 7.4 Reducción de complejidad estructural sprint a sprint

| Métrica | Legado (S1) | Actual (S4/S5) |
|---------|-------------|----------------|
| Archivos CSS | ~8 archivos por panel | 2 archivos (`globals.css`, `support.css`) |
| Familias tipográficas | 2 (Poppins + Inter) | 1 (Inter) |
| Breakpoints activos | 5 (480, 600, 768, 1200…) | 2 (768, 480) |
| Variables de color definidas | ~15 | ~35 × 2 temas |
| Gestión de estado global | Sin state management | Context API (Auth + Theme) |
| Patrón de navegación | Sidebar fijo | Navbar horizontal + dropdowns |

### 7.5 Compatibilidad dual-theme del módulo de soporte

El módulo de soporte fue diseñado desde el inicio como *theme-aware*: usa `var(--bg-card)`, `var(--border-color)` y `var(--text-muted)` como base, y sus colores propios (estados de ticket, categorías) son semitransparentes (`rgba(..., 0.15–0.20)`), lo que los hace correctamente legibles en fondo oscuro y en fondo crema sin necesitar bloques CSS duplicados por tema.

---

## 8. Apéndice — Variables CSS Actuales

### Modo oscuro (`:root`, `[data-theme="dark"]`)

```css
/* Fondos */
--bg-primary:           #000000;
--bg-secondary:         #0b0f15;
--bg-card:              rgba(22, 31, 42, 0.86);
--bg-card-hover:        rgba(32, 46, 63, 0.92);
--bg-glass:             rgba(255, 255, 255, 0.035);
--bg-glass-strong:      rgba(255, 255, 255, 0.07);
--bg-input:             rgba(255, 255, 255, 0.06);
--bg-sidebar:           rgba(0, 0, 0, 0.96);
--bg-modal-overlay:     rgba(0, 0, 0, 0.6);

/* Bordes */
--border-color:         rgba(115, 130, 150, 0.2);
--border-glow:          rgba(43, 62, 85, 0.35);

/* Texto */
--text-primary:         #f5f7f8;
--text-secondary:       #b4bfca;
--text-muted:           #738296;
--text-inverse:         #000000;

/* Acentos */
--accent-primary:       #2b3e55;
--accent-primary-light: #3b536f;
--accent-primary-dark:  #161f2a;
--accent-secondary:     #738296;
--primary:              #202e3f;
--accent:               #738296;
--gradient-primary:     linear-gradient(135deg, #0b0f15 0%, #2b3e55 100%);

/* Botones */
--button-primary-bg:    #161f2a;
--button-primary-hover: #202e3f;
--button-primary-shadow: rgba(11, 15, 21, 0.32);
--button-ghost-hover:   rgba(43, 62, 85, 0.16);
--focus-ring:           rgba(43, 62, 85, 0.24);

/* Semánticos */
--success:              #1f9d74;
--success-bg:           rgba(31, 157, 116, 0.14);
--warning:              #d97706;
--warning-bg:           rgba(217, 119, 6, 0.14);
--danger:               #dc4c3f;
--danger-bg:            rgba(220, 76, 63, 0.14);
--info:                 #0284c7;
--info-bg:              rgba(2, 132, 199, 0.14);

/* Sombras */
--shadow-sm:            0 1px 3px rgba(0,0,0,0.3);
--shadow-md:            0 4px 16px rgba(0,0,0,0.3);
--shadow-lg:            0 8px 32px rgba(0,0,0,0.4);
--shadow-glow:          0 10px 24px rgba(11, 15, 21, 0.24);

/* Radios */
--radius-xs:            6px;
--radius-sm:            10px;
--radius-md:            14px;
--radius-lg:            20px;
--radius-xl:            28px;
--radius-full:          9999px;

/* Layout */
--sidebar-width:        260px;
--header-height:        56px;
```

### Modo claro (`[data-theme="light"]`)

```css
/* Fondos */
--bg-primary:           #f6f4ee;
--bg-secondary:         #fffdf8;
--bg-card:              rgba(255, 253, 248, 0.92);
--bg-card-hover:        rgba(255, 253, 248, 1);
--bg-glass:             rgba(19, 37, 33, 0.03);
--bg-glass-strong:      rgba(19, 37, 33, 0.06);
--bg-input:             rgba(19, 37, 33, 0.05);
--bg-sidebar:           rgba(255, 252, 246, 0.95);
--bg-modal-overlay:     rgba(0, 0, 0, 0.3);

/* Bordes */
--border-color:         rgba(17, 24, 39, 0.1);
--border-glow:          rgba(23, 109, 90, 0.18);

/* Texto */
--text-primary:         #111111;
--text-secondary:       #1e2422;
--text-muted:           #5f6e69;
--text-inverse:         #f8fafc;

/* Acentos */
--accent-primary:       #176d5a;
--accent-primary-light: #1f8a70;
--accent-primary-dark:  #10453c;
--accent-secondary:     #c46f21;
--primary:              #176d5a;
--accent:               #c46f21;
--gradient-primary:     linear-gradient(135deg, #176d5a 0%, #c46f21 100%);

/* Botones */
--button-primary-bg:    #176d5a;
--button-primary-hover: #10453c;
--button-primary-shadow: rgba(23, 109, 90, 0.18);
--button-ghost-hover:   rgba(19, 37, 33, 0.08);
--focus-ring:           rgba(23, 109, 90, 0.14);

/* Sombras */
--shadow-sm:            0 1px 3px rgba(0,0,0,0.08);
--shadow-md:            0 4px 16px rgba(0,0,0,0.08);
--shadow-lg:            0 8px 32px rgba(0,0,0,0.1);
--shadow-glow:          0 10px 24px rgba(23, 109, 90, 0.1);
```

---

*Documento generado para tesina. Cubre la evolución del sistema de diseño de C-Book del Sprint 2 al Sprint 5. Complemento de `DESIGN_PHILOSOPHY.md` (Sprint 1 / legado). Commit de referencia más reciente: `962d9f6` (2026-05-13).*
