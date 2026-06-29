# Portal Institucional de Tesis — Modelo Pedagógico de Ciberdefensa (ADM)

Portal web **estático** que funciona como **repositorio digital** y, sobre todo, como
**demostración** del modelo de la investigación de **Maestría en Ciberseguridad y
Ciberdefensa** de la **Escuela Militar de Ingeniería (EMI)**:

> *Propuesta de un Modelo Pedagógico para la Planeación de Operaciones de Ciberdefensa
> basado en la Metodología del Planeamiento Táctico (ADM).*

Construido con **HTML5 + CSS3 + JavaScript Vanilla**. Sin React/Vue/Angular, sin
Bootstrap/Tailwind, sin jQuery, sin Node/PHP, sin backend ni base de datos. **Sin
dependencias externas.** Listo para **GitHub Pages**.

---

## ✨ Lo que hace especial a este portal

No es solo una lista de archivos. La sección **Modelo Pedagógico** es una **línea de
tiempo interactiva** que evidencia la **trazabilidad completa** de la investigación:

```
Programa de estudios → Plan de clase → Ejercicio integrador → Modelo ADM →
Productos de aprendizaje → IPB-MDMP → Evaluación → Resultados
```

Cada etapa se expande y muestra sus **entradas** (qué recibe de la etapa anterior), sus
**salidas** (qué produce para la siguiente) y el **documento** vinculado. Así, un sinodal
puede comprender la implementación íntegra del modelo **sin abrir los descargables**.

---

## 📁 Estructura del proyecto

```
/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
├── assets/
│   ├── logo.png
│   ├── hero.jpg
│   ├── favicon.ico
│   └── icons/
│       ├── icon-192.png
│       ├── icon-512.png
│       └── maskable-512.png
├── pdf/
│   ├── consentimiento.pdf      (plantilla)
│   ├── plan-clase.pdf         (documento real)
│   ├── programa.pdf            (muestra)
│   ├── rubricas.pdf            (muestra)
│   ├── instrumentos.pdf        (muestra)
│   └── matrices.pdf            (muestra)
├── img/
│   ├── modelo.png
│   ├── arquitectura.png
│   ├── diagramas.png
│   ├── og-image.png
│   └── qr-placeholder.svg
├── README.md
├── robots.txt
├── manifest.json
└── sitemap.xml
```

---

## ✅ Características

- **Diseño institucional premium** (verde militar, gris oscuro, blanco, dorado discreto)
  inspirado en portales de gobierno, NIST, MITRE y academias militares.
- **Responsive** (PC, tablet, celular), modo claro, mucho espacio en blanco.
- **Secciones**: Hero · Acerca del proyecto · **Modelo Pedagógico (timeline)** ·
  Consentimiento · Repositorio · Galería · Investigador · Contacto.
- **Funciones**: menú fijo, buscador en vivo, scroll suave, volver arriba, barra de
  progreso, loader, breadcrumb dinámico, footer profesional.
- **Consentimiento informado digital** funcional: datos + fecha automática + **firma en
  Canvas** + **generación de PDF en el navegador** (generador propio en JS puro, sin
  librerías) que incrusta la firma. **Nada se envía a un servidor.**
- **Repositorio** con visor integrado (iframe) y descarga.
- **Galería** con **lightbox** (teclado: ←/→/Esc).
- **Accesibilidad WCAG 2.2 AA**: ARIA, foco visible, navegación por teclado, contraste,
  `prefers-reduced-motion` y `prefers-contrast`.
- **SEO**: meta tags, Open Graph, Twitter Card, JSON-LD, favicon, manifest, robots, sitemap.

---

## 🚀 Publicación en GitHub Pages

1. Cree un repositorio (p. ej. `tesis-ciberdefensa`) y suba **el contenido de esta
   carpeta** a la raíz.
2. **Settings → Pages** → rama `main`, carpeta `/root`.
3. El sitio quedará en `https://USUARIO.github.io/tesis-ciberdefensa/`.

### Local
```bash
python -m http.server 8080   # abra http://localhost:8080
```

---

## 🛠️ Personalización

| Para cambiar… | Edite… |
|---|---|
| Colores / tipografías | Variables `:root` en `css/style.css` |
| Etapas del modelo (timeline) | Arreglo `TIMELINE` en `js/script.js` |
| Texto del consentimiento | Objeto `CONSENT` en `js/script.js` (alimenta pantalla y PDF) |
| Datos del investigador | Sección `#investigador` en `index.html` |
| Correo de contacto | Constante `destino` en `js/script.js` |
| Documentos | Reemplace los archivos de `pdf/` (mismos nombres) |
| Imágenes | Reemplace los archivos de `img/` y `assets/` |
| Código QR | Sustituya `img/qr-placeholder.svg` |
| URL del sitio | `robots.txt`, `sitemap.xml`, `og:url` y `canonical` |
| Logotipos | `assets/logo.png` y los placeholders del perfil **(solo material autorizado)** |

---

## 🧾 Generador de PDF (JS puro)

El consentimiento se exporta con `construirPDFConsentimiento` (`js/script.js`):
PDF 1.4 multipágina, fuentes **Helvetica/Helvetica-Bold** con **WinAnsiEncoding**
(acentos del español), firma incrustada como **JPEG (DCTDecode)**, xref y trailer
correctos. Descarga mediante `Blob`. **Cero dependencias, cero servidores.**

---

© 2026 Marco Yair Barrios Jaime · Escuela Militar de Ingeniería.
