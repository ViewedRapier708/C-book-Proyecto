# C-Book — Documentación de Filosofía de Diseño

**Versión legacy (HTML/CSS/JS vanilla)**  
**Fecha de documentación:** Mayo 2026  
**Propósito:** Tesina — registro del sistema de diseño previo a la migración a React

---

## 1. Introducción y Contexto

C-Book es un sistema de gestión de biblioteca digital desarrollado para la institución BTZ / IPN. La interfaz se divide en dos grandes módulos:

- **Panel de usuario** — Consulta de catálogo, solicitud de préstamos y seguimiento de recursos.
- **Panel de administrador** — Gestión del acervo, usuarios, préstamos y reportes.

La versión documentada en este archivo corresponde al **frontend legado**, construido sobre HTML, CSS y JavaScript vanilla, sin framework de interfaz. Esta documentación tiene como fin preservar las decisiones de diseño tomadas durante el desarrollo original para que sirvan como referencia en la migración al stack moderno basado en React.

---

## 2. Filosofía de Diseño General

### 2.1 Principio rector

El diseño de C-Book se rige por el equilibrio entre **autoridad institucional** y **accesibilidad humana**. El color primario (burdeos oscuro) comunica formalidad y confianza, mientras que los tonos rosados secundarios aportan calidez y cercanía, apropiados para un sistema que va a ser usado cotidianamente por estudiantes y personal académico.

### 2.2 Pilares de diseño

| Pilar | Descripción |
|---|---|
| **Consistencia** | Todas las pantallas comparten variables CSS centrales, lo que garantiza uniformidad visual sin repetir valores. |
| **Jerarquía visual** | El uso de gradientes, peso tipográfico y profundidad de sombras comunica claramente qué elementos son primarios y cuáles secundarios. |
| **Responsividad** | Se utiliza `clamp()` extensamente para escalar de manera fluida entre dispositivos móviles, tabletas y escritorio. |
| **Accesibilidad** | Estados de foco visibles, contraste adecuado, soporte para `prefers-reduced-motion` y HTML semántico. |
| **Eficiencia visual** | Las animaciones son cortas (0.2–0.4 s) y significativas; no son decorativas en exceso. |

---

## 3. Paleta de Colores

### 3.1 Colores primarios de marca

| Variable CSS | Valor hex | Nombre | Uso principal |
|---|---|---|---|
| `--primary-1` | `#7B0233` | Burdeos profundo | Color de marca principal — headers, botones primarios, gradientes |
| `--primary-2` | `#9D306C` | Marrón medio | Estados hover, extremo del gradiente, acentos |
| — | `#B0387A` | Marrón claro | Tercer punto en gradientes extendidos |

**Razonamiento del color primario:** El burdeos (`#7B0233`) es un color asociado a instituciones académicas y bibliotecas. Transmite seriedad, cultura y confianza sin caer en los azules corporativos genéricos. La progresión hacia el marrón-rosa en el secondary da un toque más moderno y diferenciador.

### 3.2 Colores de fondo y superficie

| Variable CSS | Valor hex | Nombre | Uso |
|---|---|---|---|
| `--accent` / `--bg-a` | `#F2D9E3` | Rosa pálido | Fondos de paneles de usuario, tarjetas |
| `--bg-b` | `#F8D7E8` | Rosa muy claro | Alternancia de fondos en gradientes |
| `--bg-c` | `#F0C1DA` | Rosa suave | Tercer punto del gradiente de fondo |
| `--surface` | `#FFFFFF` | Blanco puro | Tarjetas, contenedores, formularios |
| `--surface-alt` | `#FAFAFA` | Blanco cálido | Filas alternas de tablas, zonas secundarias |

### 3.3 Colores neutros

| Variable CSS | Valor hex | Uso |
|---|---|---|
| `--text` | `#1A1A1A` | Texto principal |
| `--text-muted` | `#6B6B6B` | Texto secundario, etiquetas auxiliares |
| `--border` | `#E8E8E8` | Bordes de formularios y separadores |
| — | `#F5F5F7` | Fondo del panel admin |

### 3.4 Colores semánticos (estados y badges)

| Variable | Hex | Estado |
|---|---|---|
| `--success` | `#38A169` | Aprobado / Disponible / Activo |
| `--warning` | `#D69E2E` / `#FFC107` | Pendiente / En proceso |
| `--danger` | `#E53E3E` | Rechazado / Error / No disponible |
| `--info` | `#3182CE` | Informativo / En consulta |
| — | `#2B6CB0` | Funcional (estado especial) |
| — | `#DD6B20` | Dañado / Advertencia naranja |

### 3.5 Fondos especiales por página

**Pantalla de inicio de sesión (index.html):**
- Panel izquierdo: `#FFFFFF` (limpio, formulario)
- Panel derecho: gradiente `135deg` desde `#2d1b69` → `#4a2774` → `#7B0233` → `#9D306C` → `#4a2774`

> Esta combinación inusual de azul-morado profundo hacia burdeos en el panel decorativo introduce una dimensión de profundidad nocturna que refuerza la sensación de un sistema de consulta (como una biblioteca de noche).

**Panel de usuario:**
- Fondo general: gradiente `135deg` de `#F2D9E3` → `#F8D7E8` → `#F0C1DA`

**Panel de administrador:**
- Fondo general: `#F5F5F7` (neutro, más sobrio, orientado a productividad)

---

## 4. Sistema Tipográfico

### 4.1 Familias tipográficas

| Fuente | Pesos | Área de uso | Proveedor |
|---|---|---|---|
| **Poppins** | 300, 400, 600, 700 | Panel de usuario | Google Fonts |
| **Inter** | 300, 400, 500, 600, 700 | Panel de administrador | Google Fonts |
| Segoe UI / Tahoma / Verdana | — | Página de inicio y fallback | Sistema operativo |

**Razonamiento tipográfico:**
- *Poppins* tiene formas geométricas redondeadas que aportan modernidad y son amigables para usuarios no técnicos.
- *Inter* fue diseñada específicamente para interfaces digitales, con excelente legibilidad en pantalla a tamaños pequeños, ideal para el panel de administración con tablas densas.
- La separación de fuentes entre los dos paneles refuerza visualmente el cambio de rol y contexto.

### 4.2 Escala de tamaños

| Elemento | Valor (clamp / fijo) |
|---|---|
| Base HTML | `clamp(14px, 1.2vw, 16px)` — panel usuario; `15px` — admin |
| Títulos de página (h1) | `clamp(1.5rem, 2.8vw, 1.8rem)` a `clamp(2rem, 4vw, 3rem)` |
| Subtítulos de sección (h2) | `clamp(0.95rem, 1.8vw, 1.3rem)` |
| Texto de cuerpo | `0.88rem` a `1rem` |
| Texto secundario/labels | `0.65rem` a `0.85rem` |
| Badges/mini etiquetas | `0.65rem` a `0.7rem` |

### 4.3 Pesos y efectos tipográficos

- **700–800** en encabezados principales con `text-shadow: 2px 2px 4px rgba(0,0,0,0.3)` para profundidad.
- **600** en labels, encabezados de tabla y texto de botones.
- **400–500** para texto de cuerpo y descripciones.
- Las etiquetas de estado y los encabezados de tabla usan `text-transform: uppercase` con `letter-spacing: 0.3px–1.5px` para mejorar la legibilidad a tamaños pequeños.

---

## 5. Sistema de Espaciado y Layout

### 5.1 Estructura de layout principal

```
┌──────────────────────────────────────────────────────┐
│  Sidebar fijo (280px)  │  Área de contenido principal │
│  (oculto en <600px)    │  calc(100% - 280px)          │
└──────────────────────────────────────────────────────┘
```

- **Sidebar:** `position: fixed`, `width: 280px`, `z-index: 100`
- **Contenido principal:** `margin-left: 280px`, `width: calc(100% - 280px)`
- **Mobile (<600px):** sidebar oculto, contenido a 100%

### 5.2 Valores de espaciado estándar

| Tipo | Rango de valores |
|---|---|
| Padding de contenedores | `1rem` a `3rem` (clamp con `1.8vw`) |
| Padding de tarjetas | `0.75rem` a `1.5rem` |
| Padding de inputs | `0.75rem–1rem` vertical, `1rem–1.5rem` horizontal |
| Padding de botones | `0.6rem–1.1rem` vertical, `1.2rem–3rem` horizontal |
| Márgenes entre componentes | `1rem` a `2rem` |
| Gaps en grids/flex | `0.75rem` a `2rem` |

### 5.3 Anchos máximos de contenedores

| Elemento | Ancho máximo |
|---|---|
| Formularios | `400px` a `700px` |
| Áreas de contenido | `1000px` a `1200px` |
| Tablas | `98%` a `100%` (scroll horizontal en móvil) |

### 5.4 Breakpoints de responsividad

| Breakpoint | Rango | Comportamiento |
|---|---|---|
| Desktop | > 1200px | Sidebar visible, grids multi-columna (2–4 col) |
| Tablet | 768px – 1200px | Grid 2 → 1 columna, padding reducido |
| Móvil | 480px – 768px | Layout compacto, elementos apilados |
| Extra pequeño | < 480px | Una sola columna, padding mínimo |
| Ocultar sidebar | < 600px | `--aside-width: 0` |

---

## 6. Componentes UI — Especificaciones

### 6.1 Botones

**Botón primario (acción principal):**
```
Fondo:        linear-gradient(135deg, #7B0233 0%, #9D306C 100%)
Color texto:  #FFFFFF
Border-radius: 8px a 50px (según contexto)
Sombra:       0 4px 15px rgba(123, 2, 51, 0.2)
Hover:        translateY(-2px a -4px), sombra aumentada
Active:       translateY(0), sombra reducida
Efecto extra: Ripple en ::before, gradiente animado (background-size 200%)
```

**Botón secundario (acción alternativa):**
```
Fondo:        #FFFFFF
Color texto:  #7B0233
Borde:        2px solid #7B0233
Hover:        Fondo → #7B0233, texto → #FFFFFF
```

**Botones de acción en tabla (compactos):**
```
Padding:      0.3rem–0.6rem vertical, 0.4rem–0.7rem horizontal
Font-size:    0.6rem–0.8rem
.btn-editar:  Fondo verde (#38A169)
.btn-eliminar: Fondo rojo (#E53E3E)
```

**Estado deshabilitado:**
```
Opacity:      0.5–0.6
Cursor:       not-allowed
Pointer-events: none
```

### 6.2 Inputs y Selects

```
Padding:       0.75rem–0.9rem (v), 1rem (h)
Borde:         2px solid #E8E8E8
Border-radius: 8px–10px
Fondo:         #F9F9F9
Focus:         border #9D306C, bg #FFFFFF, box-shadow 0 0 0 3px rgba(157,48,108,0.1)
Placeholder:   Color #999, font-style italic
Error:         border #dc3545, bg #ffe6e6
```

### 6.3 Tarjetas (Cards)

```
Fondo:         #FFFFFF o linear-gradient(rgba(255,255,255,0.95))
Borde:         1px solid rgba(123, 2, 51, 0.08)
Border-radius: 8px–20px
Sombra:        0 6px 16px rgba(123, 2, 51, 0.09)
Hover:         translateY(-2px), sombra aumentada

Header de tarjeta:
  Fondo:       linear-gradient(135deg, #7B0233, #9D306C)
  Color:       #FFFFFF
  Padding:     0.75rem–1.1rem
  Font-weight: 600

Footer de tarjeta:
  Fondo:       rgba(242, 217, 227, 0.15)
  Display:     flex, centrado, con wrap
```

### 6.4 Tablas

**Encabezado (thead):**
```
Fondo:           linear-gradient(135deg, #7B0233, #9D306C)
Color:           #FFFFFF
Padding:         0.75rem–1.2rem
Font-size:       0.8rem–0.95rem
Text-transform:  uppercase
Letter-spacing:  0.3px–0.5px
Position:        sticky top: 0, z-index: 10
Border-radius:   10px en esquinas externas
```

**Filas del cuerpo (tbody):**
```
Fondo:         #FFFFFF (filas impares: gradiente rosa pálido)
Hover:         Fondo rosado, translateX(6px)
Seleccionada:  Gradiente #7B0233→#C94B8C, color #FFFFFF
Border-bottom: 1px solid rgba(123, 2, 51, 0.05)
Font-size:     0.8rem–0.95rem
```

**Scrollbar personalizado:**
```
Width:        8px–10px
Track:        rgba(242, 217, 227, 0.1)
Thumb:        linear-gradient(135deg, #7B0233, #9D306C)
Border-radius: 10px
```

### 6.5 Modales y Overlays

```
Overlay:      rgba(0, 0, 0, 0.5–0.75), backdrop-filter: blur(3px–4px)
Contenido:    #FFFFFF, border-radius 20px, max-width 500px–1200px
Sombra:       0 25px 70px rgba(0,0,0,0.4)
Borde:        3px solid #7B0233 (en algunos modales)
Animación:    slideUp 0.3s–0.4s cubic-bezier(0.34, 1.56, 0.64, 1)
Cierre:       Botón absoluto en esquina superior derecha, 28px–40px
```

### 6.6 Badges y etiquetas de estado

```
Padding:        0.2rem–0.5rem
Border-radius:  4px–12px
Font-size:      0.65rem–0.75rem
Font-weight:    600
Text-transform: uppercase

Colores por estado:
  Disponible:   bg #38A169,  texto #FFFFFF
  Rechazado:    bg #E53E3E,  texto #FFFFFF
  Pendiente:    bg #FFC107,  texto #333333
  En Consulta:  bg #3182CE,  texto #FFFFFF
  Funcional:    bg #2B6CB0,  texto #FFFFFF
  Dañado:       bg #DD6B20,  texto #FFFFFF
```

### 6.7 Sidebar / Navegación lateral

```
Width:            280px (fijo en desktop)
Fondo:            linear-gradient(180deg, #FFFFFF 0%, #F9F9F9 100%)
Sombra:           0 30px rgba(11,8,12,0.06)
Borde derecho:    1px solid rgba(157,48,108,0.06)
Backdrop-filter:  blur(6px) saturate(120%)
Z-index:          100
Transición:       0.28s ease

Ítem de navegación:
  Padding:        0.45rem–0.65rem (v), 0.65rem–0.75rem (h)
  Color:          #333
  Border-radius:  7px–8px
  Font-size:      0.8rem–0.84rem
  Font-weight:    500–600
  Hover:          Fondo gradiente #7B0233→#9D306C, color #FFFFFF, translateX(5px)
```

---

## 7. Animaciones y Transiciones

### 7.1 Keyframes definidos

| Nombre | Descripción |
|---|---|
| `fadeIn` | Opacidad 0→1 + translateY(20px)→0, 0.5s–0.8s |
| `slideInLeft` | translateX(-20px)→0 + opacidad 0→1 |
| `slideInUp` | translateY(80px)→0 + scale(0.9)→1 |
| `fadeInUp` | translateY(20px)→0 + opacidad 0→1, 0.5s–0.6s |
| `slideDown` | translateY(-20px)→0 + opacidad 0→1 (notificaciones) |
| `pulse` | scale 1→1.01→1, 0.4s (feedback de selección) |
| `spin` | rotate 0→360deg, 0.8s linear infinite (carga) |
| `moveStars` | Movimiento de partículas en el fondo del login, 60s |
| `shimmer` | Animación de brillo en el borde superior de tarjetas |
| `gradientShift` | Animación de gradiente en botones, 3s infinite |
| `selectGlow` | Efecto de selección en filas de tabla |

### 7.2 Duraciones de transición por tipo

| Elemento | Duración | Curva |
|---|---|---|
| Interacciones generales | `0.3s` | `ease` |
| Botones | `0.25s–0.35s` | `ease` / `cubic-bezier(0.4, 0, 0.2, 1)` |
| Filas de tabla | `0.15s–0.35s` | `cubic-bezier` |
| Sidebar | `0.28s` | `ease` |
| Modales | `0.3s–0.4s` | `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring) |
| Colores y sombras | `0.2s–0.3s` | `ease` |

### 7.3 Efectos especiales

- **Ripple en botones:** Pseudo-elemento `::before` que expande un fondo circular desde el centro del botón al hacer clic.
- **Subrayado animado en hover:** Línea que crece de 0% a 100% de ancho desde la izquierda.
- **Aceleración GPU:** `will-change: transform` y `transform: translateZ(0)` en elementos animados para rendimiento.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` establece `animation-duration: 0.01ms` en todos los elementos.

---

## 8. Sombras y Profundidad

### 8.1 Sistema de elevación

| Variable | Valor | Uso |
|---|---|---|
| `--soft-shadow` | `0 2px 8px rgba(0,0,0,0.04)` | Elementos base, mínima elevación |
| `--card-shadow` | `0 6px 16px rgba(123,2,51,0.09)` | Tarjetas en reposo |
| `--shadow-sm` | `0 2px 6px rgba(0,0,0,0.05)` | Sombra sutil |
| `--shadow-md` | `0 4px 15px rgba(123,2,51,0.15)` | Tarjetas hover, modales pequeños |
| `--shadow-lg` | `0 16px 40px rgba(123,2,51,0.4)` | Modales, overlays, elementos floatantes |

**Decisión de diseño:** Las sombras se tiñen con el color primario (`rgba(123, 2, 51, ...)`) en lugar de negro puro. Esto crea una coherencia cromática que hace que las sombras se perciban como parte del sistema visual y no como un elemento genérico.

### 8.2 Z-index definidos

| Contexto | Z-index |
|---|---|
| Componentes normales | 1–10 |
| Sidebar / Header fijo | 100 |
| Modales | 1000 |
| Elementos de tope (toasts, alertas) | 9999 |

---

## 9. Assets e Imágenes

### 9.1 Logos institucionales

Ubicación: `/img/`

| Archivo | Descripción | Uso |
|---|---|---|
| `logo-BTZ.png` | Logo de la institución BTZ | Header y sidebar |
| `logo-IPN.png` | Logo del IPN | Header y sidebar |
| `logo_C_Book.jpg` | Logo de marca C-Book | Favicon y branding |
| `Gemini_Generated_Image_*.jpg/png` | Imagen decorativa | Fondos / paneles decorativos |

**Estilo de logos en sidebar:**
```
Height:       32px–70px, width: auto, object-fit: contain
Hover:        scale(1.05), filter brightness(1.1)
Contenedor:   Flex centrado, fondo blanco con sombra
```

### 9.2 Iconografía

- Se utilizan **emojis Unicode** como íconos dentro de botones y etiquetas: `📚`, `✕`, `✓`.
- Algunos íconos decorativos se implementan vía pseudo-elementos CSS (`::before`, `::after`).
- **Decisión de migración:** En React se recomienda reemplazar los emojis por una librería de íconos SVG (React Icons, Lucide, Heroicons) para mayor consistencia y control de estilos.

---

## 10. Estructura de Archivos CSS (Legacy)

```
/
├── cssGeneral/
│   └── styleIndex.css          ← Estilos de login/registro
│
├── pantallasUs/
│   └── css/
│       ├── StyleGeneral.css           ← Base + wrapper + contenedor (usuario)
│       ├── EstiloAside.css            ← Sidebar de usuario
│       ├── componentes-base.css       ← Componentes compartidos usuario
│       └── componentes/
│           ├── form.css
│           ├── filters.css
│           └── ...
│
└── PantallasAdmin/
    └── css/
        ├── StyleGeneralAdmin.css      ← Estilos completos admin (2000+ líneas)
        ├── EstiloAsideAdmin.css       ← Sidebar de admin
        ├── componentes-base.css       ← Componentes compartidos admin
        └── componentes/
            └── ...
```

---

## 11. Estructura HTML (Legacy)

```
/
├── index.html                  ← Login y registro (formularios con toggle de display)
├── pantallasUs/
│   ├── usuario.html            ← Shell del panel de usuario (carga componentes dinámicamente)
│   └── componentes/            ← HTML de cada sección (catálogo, préstamos, perfil, etc.)
└── PantallasAdmin/
    ├── admin.html              ← Shell del panel de administrador
    └── componentes/            ← HTML de cada sección administrativa
```

### Patrón de carga dinámica

El sistema legacy usa JavaScript para inyectar HTML de componentes en el DOM del shell (admin.html / usuario.html) según la navegación del sidebar. Esto es el precursor directo del sistema de rutas y componentes de React Router.

---

## 12. Decisiones de Diseño Notables

### 12.1 Gradiente de login de alta saturación

La pantalla de login usa un gradiente de panel derecho que va de azul-violeta profundo (`#2d1b69`) hasta burdeos (`#9D306C`). Esta combinación no es obvia pero tiene una función: diferencia visualmente la pantalla de acceso del resto del sistema (que usa rosados y blancos), marcando el punto de entrada al sistema como algo especial y diferente. Genera una primera impresión de profundidad y modernidad.

### 12.2 Sombras de color de marca

En lugar de sombras negras neutras, se usan sombras teñidas con `rgba(123, 2, 51, X)`. Esto hace que todas las elevaciones sean coherentes con la identidad de color, reforzando la paleta incluso en elementos tan sutiles como las sombras.

### 12.3 Diferenciación visual admin vs. usuario

El panel de usuario usa fondo rosado con `Poppins` (redondeada, amigable). El panel de administrador usa fondo gris neutro con `Inter` (precisa, eficiente). Esto comunica visualmente el cambio de rol: el usuario es "bienvenido", el admin está en "modo trabajo".

### 12.4 Responsive con `clamp()` en lugar de breakpoints puros

El sistema de diseño usa `clamp(min, valor-fluido, max)` para la mayoría de fuentes, paddings y gaps. Esto produce una escala continua y fluida en lugar de saltos bruscos entre breakpoints, lo que se percibe más refinado en dispositivos intermedios.

### 12.5 Tabla con efecto de slide horizontal en hover

Las filas de tabla tienen `transform: translateX(6px)` en hover. Esto es un micro-detalle que da feedback sin ser intrusivo, dejando claro qué fila está siendo leída sin cambiar el color de fondo dramáticamente.

---

## 13. Recomendaciones para la Migración a React

| Área | Recomendación |
|---|---|
| **Tokens de diseño** | Migrar las variables CSS a un archivo de constantes TypeScript o a un tema de Tailwind CSS. |
| **Componentes** | Extraer Card, Button, Modal, Table, Badge, Sidebar como componentes React reutilizables. |
| **Sistema de temas** | Usar Context API + CSS variables, o Tailwind CSS con paleta personalizada en `tailwind.config`. |
| **Animaciones** | Considerar Framer Motion para animaciones de entrada/salida de componentes. |
| **Formularios** | Reemplazar la validación manual con React Hook Form o Formik. |
| **Routing** | React Router v6 replica el patrón de carga dinámica actual. |
| **Iconos** | Reemplazar emojis con Lucide React o React Icons para SVGs escalables. |
| **Fuentes** | Mantener Poppins e Inter; importar desde `next/font` o `@fontsource` si se usa Next.js. |
| **Responsive** | Los valores `clamp()` existentes pueden copiarse directamente a CSS Modules o a clases Tailwind personalizadas. |

---

## Apéndice A — Variables CSS Centrales

```css
/* Colores primarios */
--primary-1:    #7B0233;
--primary-2:    #9D306C;

/* Fondos */
--accent:       #F2D9E3;
--bg-a:         #F2D9E3;
--bg-b:         #F8D7E8;
--bg-c:         #F0C1DA;

/* Superficies */
--surface:      #FFFFFF;
--surface-alt:  #FAFAFA;

/* Texto */
--text:         #1A1A1A;
--text-muted:   #6B6B6B;

/* Bordes */
--border:       #E8E8E8;

/* Semánticos */
--success:      #38A169;
--warning:      #D69E2E;
--danger:       #E53E3E;
--info:         #3182CE;

/* Sombras */
--soft-shadow:  0 2px 8px rgba(0, 0, 0, 0.04);
--card-shadow:  0 6px 16px rgba(123, 2, 51, 0.09);
--shadow-sm:    0 2px 6px rgba(0, 0, 0, 0.05);
--shadow-md:    0 4px 15px rgba(123, 2, 51, 0.15);
--shadow-lg:    0 16px 40px rgba(123, 2, 51, 0.40);

/* Layout */
--aside-width:  280px;
```

---

*Documento generado para uso en tesina. Refleja el estado del sistema de diseño de C-Book en su versión legacy (HTML/CSS/JS vanilla) previo a la migración al stack React.*
