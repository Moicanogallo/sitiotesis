/* ============================================================================
   PORTAL INSTITUCIONAL DE TESIS — Lógica de la aplicación (JavaScript Vanilla)
   Escuela Militar de Ingeniería (EMI)
   ----------------------------------------------------------------------------
   Sin librerías externas (ni jQuery). Incluye:
     · Loader, barra de progreso, header dinámico, nav móvil, scrollspy
     · Breadcrumb dinámico, reveal on scroll, volver arriba, buscador en vivo
     · Modelo Pedagógico: línea de tiempo interactiva (acordeón accesible)
     · Galería con lightbox, visor de documentos
     · Consentimiento informado: firma en canvas + generación de PDF nativa
   ============================================================================ */
'use strict';

document.addEventListener('DOMContentLoaded', function () {

  /* ==========================================================================
     0. UTILIDADES
     ========================================================================== */
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ==========================================================================
     1. LOADER
     ========================================================================== */
  const loader = $('#loader');
  function hideLoader() {
    if (!loader) return;
    loader.classList.add('is-hidden');
    window.setTimeout(() => { loader.style.display = 'none'; }, 400);
  }
  window.addEventListener('load', () => window.setTimeout(hideLoader, 350));
  window.setTimeout(hideLoader, 3500); // respaldo

  /* ==========================================================================
     2. AÑO DINÁMICO
     ========================================================================== */
  const yearEl = $('#footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ==========================================================================
     3. HEADER + SCROLL MAESTRO (un solo listener)
     ========================================================================== */
  const header = $('#site-header');
  const progressBar = $('#reading-progress-bar');
  const progressWrap = $('#reading-progress');
  const backToTop = $('#back-to-top');

  function onScrollHeader() { if (header) header.classList.toggle('is-scrolled', window.scrollY > 8); }
  function updateReadingProgress() {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - doc.clientHeight;
    const pct = scrollable > 0 ? (doc.scrollTop / scrollable) * 100 : 0;
    if (progressBar) progressBar.style.width = pct.toFixed(2) + '%';
    if (progressWrap) progressWrap.setAttribute('aria-valuenow', Math.round(pct));
  }
  function updateBackToTop() {
    if (!backToTop) return;
    const show = window.scrollY > 600;
    backToTop.hidden = !show;
    if (show) requestAnimationFrame(() => backToTop.classList.add('is-visible'));
    else backToTop.classList.remove('is-visible');
  }
  if (backToTop) backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' }));

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScrollHeader(); updateReadingProgress(); updateBackToTop(); updateScrollSpy(); ticking = false; });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', updateReadingProgress, { passive: true });
  onScrollHeader(); updateReadingProgress();

  /* ==========================================================================
     4. NAV MÓVIL
     ========================================================================== */
  const navToggle = $('#nav-toggle');
  const primaryNav = $('#primary-nav');
  function closeNav() {
    if (!navToggle || !primaryNav) return;
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Abrir menú de navegación');
    primaryNav.classList.remove('is-open');
  }
  if (navToggle && primaryNav) {
    navToggle.addEventListener('click', () => {
      const open = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!open));
      navToggle.setAttribute('aria-label', open ? 'Abrir menú de navegación' : 'Cerrar menú de navegación');
      primaryNav.classList.toggle('is-open', !open);
    });
    primaryNav.addEventListener('click', (e) => { if (e.target.closest('a')) closeNav(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); });
  }

  /* ==========================================================================
     5. SCROLLSPY + BREADCRUMB
     ========================================================================== */
  const sections = $$('main section[id]');
  const navLinks = $$('.primary-nav__link');
  const breadcrumbCurrent = $('#breadcrumb-current');
  const sectionNames = {
    inicio: 'Inicio', proyecto: 'Proyecto', modelo: 'Modelo Pedagógico',
    consentimiento: 'Consentimiento', repositorio: 'Repositorio', galeria: 'Galería',
    investigador: 'Investigador', contacto: 'Contacto'
  };
  let currentSectionId = '';
  function updateScrollSpy() {
    const offset = (header ? header.offsetHeight : 72) + 120;
    let active = sections.length ? sections[0].id : 'inicio';
    for (const sec of sections) if (sec.getBoundingClientRect().top <= offset) active = sec.id;
    if (active === currentSectionId) return;
    currentSectionId = active;
    navLinks.forEach(link => {
      const isActive = link.getAttribute('href') === '#' + active;
      link.classList.toggle('is-active', isActive);
      if (isActive) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
    });
    if (breadcrumbCurrent) breadcrumbCurrent.textContent = sectionNames[active] || 'Inicio';
  }
  updateScrollSpy();

  /* ==========================================================================
     6. REVEAL ON SCROLL
     ========================================================================== */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); obs.unobserve(entry.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ==========================================================================
     7. BUSCADOR EN VIVO
     ========================================================================== */
  const searchInput = $('#search-input');
  const searchables = $$('[data-searchable]');
  searchables.forEach(el => { el.dataset.originalHtml = el.innerHTML; });

  function clearHighlights(el) { if (el.dataset.originalHtml != null) el.innerHTML = el.dataset.originalHtml; }
  function highlight(el, term) {
    const rx = new RegExp('(' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      if (!rx.test(node.nodeValue)) return;
      const span = document.createElement('span');
      span.innerHTML = node.nodeValue.replace(rx, '<mark class="search-hit">$1</mark>');
      node.replaceWith(span);
    });
  }
  function runSearch(raw) {
    const term = raw.trim().toLowerCase();
    searchables.forEach(el => {
      clearHighlights(el);
      if (!term) { el.classList.remove('is-hidden-search'); return; }
      const match = el.textContent.toLowerCase().includes(term);
      el.classList.toggle('is-hidden-search', !match);
      if (match) highlight(el, raw.trim());
    });
  }
  if (searchInput) {
    let debounce;
    searchInput.addEventListener('input', () => { clearTimeout(debounce); debounce = setTimeout(() => runSearch(searchInput.value), 140); });
    searchInput.addEventListener('keydown', (e) => { if (e.key === 'Escape') { searchInput.value = ''; runSearch(''); } });
  }

  /* ==========================================================================
     8. MODELO PEDAGÓGICO — LÍNEA DE TIEMPO INTERACTIVA
     --------------------------------------------------------------------------
     Datos de la línea de tiempo: cada etapa declara su descripción, sus
     "entradas" (qué recibe de la etapa previa), sus "salidas" (qué produce
     para la siguiente) y el documento vinculado. Esto materializa la
     TRAZABILIDAD del modelo: programa → plan → modelo → productos →
     instrumentos → IPB-MDMP → evaluación → resultados.
     ========================================================================== */
  const TIMELINE = [
    {
      n: 1, title: 'Programa de estudios', sub: 'Define las competencias y los resultados de aprendizaje',
      desc: 'Punto de partida del modelo. Establece la unidad de aprendizaje, las competencias a desarrollar y los resultados esperados que alinean todo el proceso formativo con la planeación de operaciones de ciberdefensa.',
      in: ['Necesidad institucional de capacidades de ciberdefensa', 'Perfil de egreso de la maestría'],
      out: ['Competencias declaradas', 'Resultados de aprendizaje', 'Carga horaria y secuencia'],
      file: 'pdf/programa.pdf', fileLabel: 'Programa de estudios'
    },
    {
      n: 2, title: 'Plan de clase', sub: 'Operacionaliza el programa en sesiones',
      desc: 'Traduce las competencias del programa en sesiones concretas con objetivos, actividades y recursos, vinculando cada sesión con los marcos NIST CSF 2.0 y MITRE ATT&CK.',
      in: ['Competencias y resultados (etapa 1)'],
      out: ['Sesiones con objetivos', 'Actividades y recursos', 'Criterios de logro por sesión'],
      file: 'pdf/plan-clase.pdf', fileLabel: 'Plan de clase'
    },
    {
      n: 3, title: 'Ejercicio integrador', sub: 'Escenario realista de ciberdefensa',
      desc: 'Plantea un escenario operacional que integra las sesiones en una situación-problema. Define roles, restricciones y el estado final deseado sobre el que se aplicará la metodología ADM.',
      in: ['Sesiones del plan de clase (etapa 2)'],
      out: ['Escenario y problema operacional', 'Roles y reglas de actuación'],
      file: 'pdf/plan-clase.pdf', fileLabel: 'Plan de clase (anexo del ejercicio)'
    },
    {
      n: 4, title: 'Modelo ADM', sub: 'Metodología del Planeamiento Táctico aplicada',
      desc: 'Núcleo del modelo. Aplica la Army Design Methodology: enmarcar el entorno, enmarcar el problema y desarrollar la aproximación a la solución, adaptada al dominio cibernético.',
      in: ['Escenario del ejercicio integrador (etapa 3)'],
      out: ['Entorno operacional enmarcado', 'Problema definido', 'Aproximación a la solución'],
      file: 'pdf/ipb-mdmp.pdf', fileLabel: 'Documento IPB–MDMP'
    },
    {
      n: 5, title: 'Productos de aprendizaje', sub: 'Salidas tangibles del planeamiento',
      desc: 'Productos elaborados por los participantes al aplicar el modelo: líneas de acción, matrices de decisión y la orden de operaciones de ciberdefensa.',
      in: ['Aproximación a la solución (etapa 4)'],
      out: ['Líneas de acción', 'Matrices de decisión', 'Orden de operaciones'],
      file: 'pdf/matrices.pdf', fileLabel: 'Matrices de decisión'
    },
    {
      n: 6, title: 'IPB–MDMP', sub: 'Entregable integrador de inteligencia y decisión',
      desc: 'Preparación de Inteligencia del Campo de Batalla integrada al Proceso de Toma de Decisiones Militares, enriquecida con MITRE ATT&CK. Es el entregable que demuestra la implementación completa del modelo.',
      in: ['Productos de aprendizaje (etapa 5)'],
      out: ['Análisis de amenazas (ATT&CK)', 'Calcos y matrices IPB', 'Recomendación de decisión'],
      file: 'pdf/ipb-mdmp.pdf', fileLabel: 'IPB–MDMP (entregable)'
    },
    {
      n: 7, title: 'Evaluación', sub: 'Rúbricas e instrumentos de medición',
      desc: 'Mide el desempeño sobre los productos generados mediante rúbricas por competencia e instrumentos aplicados antes y después de la intervención.',
      in: ['Entregable IPB–MDMP y productos (etapas 5–6)'],
      out: ['Puntajes por competencia', 'Evidencia de desempeño', 'Datos pre/post'],
      file: 'pdf/rubricas.pdf', fileLabel: 'Rúbricas'
    },
    {
      n: 8, title: 'Resultados', sub: 'Verificación de la hipótesis',
      desc: 'Contrasta los datos de la evaluación con la hipótesis: la aplicación del modelo basado en ADM, alineado con NIST y MITRE, mejora las competencias de planeación de ciberdefensa. Cierra el ciclo de trazabilidad.',
      in: ['Datos de evaluación (etapa 7)'],
      out: ['Mejora de competencias verificada', 'Conclusiones y recomendaciones'],
      file: 'pdf/instrumentos.pdf', fileLabel: 'Instrumentos (datos)'
    }
  ];

  function buildTimeline() {
    const root = $('#timeline');
    if (!root) return;
    TIMELINE.forEach(step => {
      const item = document.createElement('div');
      item.className = 'tl-item reveal';
      item.dataset.searchable = '';

      const panelId = 'tlp-' + step.n;
      const inList = step.in.map(t => '<li>' + t + '</li>').join('');
      const outList = step.out.map(t => '<li>' + t + '</li>').join('');

      item.innerHTML =
        '<span class="tl-marker" aria-hidden="true">' + step.n + '</span>' +
        '<button class="tl-head" type="button" aria-expanded="false" aria-controls="' + panelId + '">' +
          '<span class="tl-head__txt">' +
            '<span class="tl-head__title">' + step.title + '</span>' +
            '<span class="tl-head__sub">' + step.sub + '</span>' +
          '</span>' +
          '<svg class="tl-chevron" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</button>' +
        '<div class="tl-panel" id="' + panelId + '" role="region" aria-label="Detalle: ' + step.title + '">' +
          '<div class="tl-panel__inner">' +
            '<p>' + step.desc + '</p>' +
            '<div class="tl-io">' +
              '<div class="tl-io__box"><p class="tl-io__label">Entradas</p><ul>' + inList + '</ul></div>' +
              '<div class="tl-io__box tl-io__box--out"><p class="tl-io__label">Salidas</p><ul>' + outList + '</ul></div>' +
            '</div>' +
            '<a class="tl-link" href="' + step.file + '" data-view-file="' + step.file + '" data-view-title="' + step.fileLabel + '">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 2v6h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
              'Documento: ' + step.fileLabel +
            '</a>' +
          '</div>' +
        '</div>';
      root.appendChild(item);
    });

    // Acordeón accesible
    const items = $$('.tl-item', root);
    function toggleItem(item, open) {
      const head = $('.tl-head', item);
      const panel = $('.tl-panel', item);
      item.classList.toggle('is-open', open);
      head.setAttribute('aria-expanded', String(open));
      panel.style.maxHeight = open ? (panel.scrollHeight + 40) + 'px' : '0px';
    }
    items.forEach(item => {
      const head = $('.tl-head', item);
      head.addEventListener('click', () => {
        const willOpen = !item.classList.contains('is-open');
        toggleItem(item, willOpen);
      });
    });

    // Controles: expandir / contraer todo
    const expandAll = $('#tl-expand');
    const collapseAll = $('#tl-collapse');
    if (expandAll) expandAll.addEventListener('click', () => items.forEach(i => toggleItem(i, true)));
    if (collapseAll) collapseAll.addEventListener('click', () => items.forEach(i => toggleItem(i, false)));

    // Reajustar altura del panel abierto al redimensionar.
    window.addEventListener('resize', () => {
      items.forEach(i => { if (i.classList.contains('is-open')) { const p = $('.tl-panel', i); p.style.maxHeight = (p.scrollHeight + 40) + 'px'; } });
    });

    // Abrir la primera etapa por defecto (orientación del lector).
    if (items[0]) toggleItem(items[0], true);

    // Observar las nuevas .reveal generadas dinámicamente.
    if ('IntersectionObserver' in window && !prefersReducedMotion) {
      const io2 = new IntersectionObserver((entries, obs) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target); } });
      }, { threshold: 0.1 });
      items.forEach(i => io2.observe(i));
    } else { items.forEach(i => i.classList.add('is-visible')); }
  }
  buildTimeline();

  /* ==========================================================================
     9. CADENA DE TRAZABILIDAD (banner) → desplaza a la etapa del timeline
     ========================================================================== */
  $$('[data-chain-target]').forEach(node => {
    node.addEventListener('click', () => {
      const n = node.getAttribute('data-chain-target');
      const target = $('#tlp-' + n);
      const item = target ? target.closest('.tl-item') : null;
      document.getElementById('modelo').scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      if (item && !item.classList.contains('is-open')) {
        const head = $('.tl-head', item);
        window.setTimeout(() => head.click(), 350);
      }
    });
  });

  /* ==========================================================================
     10. GALERÍA + LIGHTBOX
     ========================================================================== */
  const galleryBtns = $$('.gallery__btn');
  const lightbox = $('#lightbox');
  const lightboxImg = $('#lightbox-img');
  const lightboxCaption = $('#lightbox-caption');
  let lightboxIndex = 0, lastFocusedLightbox = null;
  const galleryData = galleryBtns.map(btn => ({ src: btn.getAttribute('data-lightbox'), caption: btn.getAttribute('data-caption') || '' }));

  function openLightbox(i) {
    if (!lightbox) return;
    lightboxIndex = i;
    const item = galleryData[i];
    lightboxImg.src = item.src; lightboxImg.alt = item.caption; lightboxCaption.textContent = item.caption;
    lightbox.hidden = false; document.body.style.overflow = 'hidden';
    lastFocusedLightbox = document.activeElement; $('.lightbox__close', lightbox).focus();
  }
  function closeLightbox() { if (!lightbox) return; lightbox.hidden = true; document.body.style.overflow = ''; if (lastFocusedLightbox) lastFocusedLightbox.focus(); }
  function navLightbox(d) { lightboxIndex = (lightboxIndex + d + galleryData.length) % galleryData.length; openLightbox(lightboxIndex); }
  galleryBtns.forEach((btn, i) => btn.addEventListener('click', () => openLightbox(i)));
  if (lightbox) {
    $$('[data-close-lightbox]', lightbox).forEach(b => b.addEventListener('click', closeLightbox));
    $('[data-lightbox-prev]', lightbox).addEventListener('click', () => navLightbox(-1));
    $('[data-lightbox-next]', lightbox).addEventListener('click', () => navLightbox(1));
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', (e) => {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') navLightbox(-1);
      else if (e.key === 'ArrowRight') navLightbox(1);
    });
  }

  /* ==========================================================================
     11. VISOR DE DOCUMENTOS (iframe)
     ========================================================================== */
  const viewer = $('#viewer');
  const viewerFrame = $('#viewer-frame');
  const viewerTitle = $('#viewer-title');
  const viewerDownload = $('#viewer-download');
  const viewerFallback = $('#viewer-fallback');
  const viewerFallbackLink = $('#viewer-fallback-link');
  let lastFocusedViewer = null;

  function openViewer(file, title) {
    if (!viewer) return;
    const isPdf = /\.pdf($|\?)/i.test(file);
    viewerTitle.textContent = title || 'Visor de documento';
    viewerDownload.href = file; viewerDownload.setAttribute('download', '');
    if (isPdf) {
      viewerFrame.hidden = false; viewerFallback.hidden = true; viewerFrame.src = file + '#view=FitH';
    } else {
      viewerFrame.hidden = true; viewerFrame.removeAttribute('src'); viewerFallback.hidden = false; viewerFallbackLink.href = file;
    }
    viewer.hidden = false; document.body.style.overflow = 'hidden';
    lastFocusedViewer = document.activeElement; $('.viewer__close', viewer).focus();
  }
  function closeViewer() { if (!viewer) return; viewer.hidden = true; viewerFrame.removeAttribute('src'); document.body.style.overflow = ''; if (lastFocusedViewer) lastFocusedViewer.focus(); }

  // Botones "Visualizar" de las tarjetas del repositorio
  $$('.doc-card [data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.doc-card');
      openViewer(card.getAttribute('data-file'), card.getAttribute('data-title'));
    });
  });
  // Enlaces "Documento" del timeline → abren en el visor en vez de navegar
  $$('[data-view-file]').forEach(a => {
    a.addEventListener('click', (e) => { e.preventDefault(); openViewer(a.getAttribute('data-view-file'), a.getAttribute('data-view-title')); });
  });
  if (viewer) {
    $$('[data-close-viewer]', viewer).forEach(b => b.addEventListener('click', closeViewer));
    document.addEventListener('keydown', (e) => { if (!viewer.hidden && e.key === 'Escape') closeViewer(); });
  }

  /* ==========================================================================
     12. CONTENIDO DEL CONSENTIMIENTO (única fuente de verdad: pantalla + PDF)
     ========================================================================== */
  const CONSENT = {
    titulo: 'Consentimiento Informado',
    organizacion: 'Escuela Militar de Ingeniería - Maestría en Ciberseguridad y Ciberdefensa',
    intro: 'Título de la investigación: "Modelo pedagógico basado en la Metodología del Planeamiento Táctico para el desarrollo de competencias de planeación de operaciones de ciberdefensa en discentes de la Maestría en Ciberseguridad y Ciberdefensa". Investigador responsable: Teniente de Transmisiones Marco Yair Barrios Jaime. Antes de decidir su participación, lea con atención la siguiente información.',
    secciones: [
      { titulo: 'Propósito de la investigación', texto: 'Se me ha informado que esta investigación tiene como finalidad analizar la contribución de un modelo pedagógico basado en la Metodología del Planeamiento Táctico para el desarrollo de competencias relacionadas con la planeación de operaciones de ciberdefensa en discentes de posgrado.' },
      { titulo: 'Procedimiento', texto: 'Mi participación consistirá en: responder instrumentos de evaluación antes y después de la intervención educativa; participar en actividades académicas relacionadas con la planeación de operaciones de ciberdefensa; y desarrollar ejercicios prácticos y productos académicos vinculados con el estudio.' },
      { titulo: 'Riesgos', texto: 'La participación en esta investigación no implica riesgos físicos, psicológicos, legales o económicos superiores a los asociados a las actividades académicas normales del programa de estudios.' },
      { titulo: 'Beneficios', texto: 'La participación permitirá fortalecer competencias relacionadas con el análisis, planeación y toma de decisiones en escenarios de ciberdefensa. Asimismo, contribuirá a la generación de conocimiento académico en el ámbito de la educación militar y la ciberseguridad.' },
      { titulo: 'Confidencialidad', texto: 'La información obtenida será utilizada exclusivamente con fines académicos y de investigación. Los resultados serán presentados de manera agregada, sin identificar individualmente a los discentes. Los datos recopilados serán resguardados por el investigador y utilizados únicamente para el desarrollo de la presente investigación.' },
      { titulo: 'Participación voluntaria', texto: 'Entiendo que mi participación es voluntaria. Puedo retirarme de la investigación en cualquier momento sin que ello genere consecuencias académicas o administrativas.' }
    ],
    declaracion: 'He leído y comprendido la información anterior. He tenido la oportunidad de realizar preguntas y recibir respuestas satisfactorias. De manera libre y voluntaria acepto participar en esta investigación.'
  };

  function renderConsentText() {
    const box = $('#consent-text');
    if (!box) return;
    let html = '<p class="consent__doc-title">' + CONSENT.titulo + '</p>';
    html += '<p class="consent__org">' + CONSENT.organizacion + '</p>';
    html += '<p>' + CONSENT.intro + '</p>';
    CONSENT.secciones.forEach(s => { html += '<h3>' + s.titulo + '</h3><p>' + s.texto + '</p>'; });
    html += '<h3>Declaración</h3><p>' + CONSENT.declaracion + '</p>';
    box.innerHTML = html;
  }
  renderConsentText();

  /* ==========================================================================
     13. FECHA AUTOMÁTICA
     ========================================================================== */
  const fechaInput = $('#c-fecha');
  function fechaLarga() {
    const d = new Date();
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return d.getDate() + ' de ' + meses[d.getMonth()] + ' de ' + d.getFullYear();
  }
  if (fechaInput) fechaInput.value = fechaLarga();

  /* ==========================================================================
     14. FIRMA DIGITAL (Canvas, mouse + táctil)
     ========================================================================== */
  const pad = $('#signature-pad');
  const sigStatus = $('#signature-status');
  let sigHasContent = false;

  if (pad) {
    const ctx = pad.getContext('2d');
    let drawing = false, lastX = 0, lastY = 0;

    function resizePad() {
      const ratio = window.devicePixelRatio || 1;
      const rect = pad.getBoundingClientRect();
      const prev = sigHasContent ? pad.toDataURL() : null;
      pad.width = Math.round(rect.width * ratio);
      pad.height = Math.round(rect.height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = 2.2; ctx.strokeStyle = '#1f291d';
      if (prev) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height); img.src = prev; }
    }
    requestAnimationFrame(resizePad);
    window.addEventListener('resize', () => { window.clearTimeout(pad._rt); pad._rt = window.setTimeout(resizePad, 200); });

    function getPos(e) {
      const rect = pad.getBoundingClientRect();
      const p = e.touches ? e.touches[0] : e;
      return { x: p.clientX - rect.left, y: p.clientY - rect.top };
    }
    function markSigned() {
      if (sigHasContent) return;
      sigHasContent = true;
      if (sigStatus) { sigStatus.textContent = 'Firma registrada'; sigStatus.classList.add('is-signed'); }
    }
    function startDraw(e) {
      drawing = true; const p = getPos(e); lastX = p.x; lastY = p.y;
      ctx.beginPath(); ctx.arc(lastX, lastY, 1.1, 0, Math.PI * 2); ctx.fillStyle = '#1f291d'; ctx.fill();
      markSigned();
    }
    function moveDraw(e) {
      if (!drawing) return; e.preventDefault(); const p = getPos(e);
      ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(p.x, p.y); ctx.stroke(); lastX = p.x; lastY = p.y;
    }
    function endDraw() { drawing = false; }

    pad.addEventListener('mousedown', startDraw);
    pad.addEventListener('mousemove', moveDraw);
    window.addEventListener('mouseup', endDraw);
    pad.addEventListener('touchstart', startDraw, { passive: true });
    pad.addEventListener('touchmove', moveDraw, { passive: false });
    pad.addEventListener('touchend', endDraw);

    const clearBtn = $('#signature-clear');
    if (clearBtn) clearBtn.addEventListener('click', () => {
      ctx.clearRect(0, 0, pad.width, pad.height);
      sigHasContent = false;
      if (sigStatus) { sigStatus.textContent = 'Sin firma'; sigStatus.classList.remove('is-signed'); }
    });

    pad._isSigned = () => sigHasContent;
  }

  /* ==========================================================================
     15. CONSENTIMIENTO: validación, FIRMAR y DESCARGAR PDF
     ========================================================================== */
  const consentForm = $('#consent-form');
  const consentFeedback = $('#consent-feedback');
  const btnDescargar = $('#consent-download');
  let consentReady = false; // pasa a true tras "Firmar"

  function setError(id, show) {
    const input = $('#' + id);
    const err = $('#err-' + id.replace('c-', ''));
    if (input) input.setAttribute('aria-invalid', show ? 'true' : 'false');
    if (err) err.hidden = !show;
  }
  function validateConsent() {
    let ok = true;
    const nombre = $('#c-nombre'), grado = $('#c-grado'), institucion = $('#c-institucion'), correo = $('#c-correo'), acepto = $('#c-acepto');
    if (!nombre.value.trim()) { setError('c-nombre', true); ok = false; } else setError('c-nombre', false);
    if (!grado.value.trim()) { setError('c-grado', true); ok = false; } else setError('c-grado', false);
    if (!institucion.value.trim()) { setError('c-institucion', true); ok = false; } else setError('c-institucion', false);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.value.trim())) { setError('c-correo', true); ok = false; } else setError('c-correo', false);
    if (!acepto.checked) { $('#err-acepto').hidden = false; ok = false; } else $('#err-acepto').hidden = true;
    let firmaOk = !(pad && !pad._isSigned());
    return { ok: ok && firmaOk, firmaOk };
  }
  function collectDatos() {
    return {
      nombre: $('#c-nombre').value.trim(), grado: $('#c-grado').value.trim(),
      institucion: $('#c-institucion').value.trim(), correo: $('#c-correo').value.trim(),
      fecha: $('#c-fecha').value.trim()
    };
  }
  function firmaJpegFromPad() {
    if (!(pad && pad._isSigned())) return null;
    const tmp = document.createElement('canvas');
    tmp.width = pad.width; tmp.height = pad.height;
    const t = tmp.getContext('2d');
    t.fillStyle = '#ffffff'; t.fillRect(0, 0, tmp.width, tmp.height);
    t.drawImage(pad, 0, 0);
    return { data: tmp.toDataURL('image/jpeg', 0.92), w: tmp.width, h: tmp.height };
  }
  function descargarPDF() {
    const datos = collectDatos();
    const firma = firmaJpegFromPad();
    const blob = construirPDFConsentimiento(datos, firma ? firma.data : null, firma ? firma.w : 0, firma ? firma.h : 0);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safe = datos.nombre.replace(/[^\wáéíóúñ ]/gi, '').replace(/\s+/g, '_');
    a.href = url; a.download = 'Consentimiento_' + (safe || 'participante') + '.pdf';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  if (consentForm) {
    // "Firmar" valida y habilita la descarga
    consentForm.addEventListener('submit', function (e) {
      e.preventDefault();
      consentFeedback.textContent = ''; consentFeedback.className = 'consent__feedback';
      const res = validateConsent();
      if (!res.ok) {
        consentFeedback.classList.add('is-error');
        consentFeedback.textContent = !res.firmaOk ? 'Complete los campos obligatorios y registre su firma.' : 'Revise los campos marcados.';
        const firstErr = consentForm.querySelector('[aria-invalid="true"]');
        if (firstErr) firstErr.focus();
        return;
      }
      consentReady = true;
      if (btnDescargar) btnDescargar.disabled = false;
      try {
        descargarPDF();
        consentFeedback.classList.add('is-ok');
        consentFeedback.textContent = '✓ Consentimiento firmado. La descarga del PDF se ha iniciado.';
      } catch (err) {
        console.error(err);
        consentFeedback.classList.add('is-error');
        consentFeedback.textContent = 'Ocurrió un error al generar el PDF. Intente nuevamente.';
      }
    });

    // Botón "Descargar consentimiento" (re-descarga si ya se firmó)
    if (btnDescargar) {
      btnDescargar.addEventListener('click', function () {
        const res = validateConsent();
        if (!res.ok) { consentForm.requestSubmit(); return; }
        try { descargarPDF(); consentFeedback.className = 'consent__feedback is-ok'; consentFeedback.textContent = '✓ Descarga iniciada.'; }
        catch (err) { console.error(err); consentFeedback.className = 'consent__feedback is-error'; consentFeedback.textContent = 'Error al generar el PDF.'; }
      });
    }
  }

  /* ==========================================================================
     16. GENERADOR DE PDF EN JAVASCRIPT PURO
     --------------------------------------------------------------------------
     PDF 1.4 multipágina con Helvetica/Helvetica-Bold (WinAnsiEncoding para el
     español) y firma JPEG embebida (DCTDecode). El archivo se ensambla como
     cadena "binaria" donde cada carácter equivale a un byte.
     ========================================================================== */

  // Mapa de caracteres tipográficos Unicode → byte WinAnsi (CP1252).
  const WINANSI_MAP = {
    '—': 0x97, '–': 0x96, '‘': 0x91, '’': 0x92,
    '“': 0x93, '”': 0x94, '…': 0x85, '•': 0x95,
    '€': 0x80, '™': 0x99, ' ': 0x20
  };
  function toWinAnsi(str) {
    // Devuelve una cadena donde cada carácter tiene código 0..255 (WinAnsi).
    let out = '';
    for (const ch of String(str)) {
      const code = ch.codePointAt(0);
      if (code <= 0xFF) out += ch;
      else if (WINANSI_MAP[ch] != null) out += String.fromCharCode(WINANSI_MAP[ch]);
      else out += '?';
    }
    return out;
  }

  function construirPDFConsentimiento(datos, firmaDataURL, imgW, imgH) {
    const PAGE_W = 595.28, PAGE_H = 841.89;
    const MARGIN = 56, CONTENT_W = PAGE_W - MARGIN * 2;
    const FS = 10.5, LEAD = 15.5, BOTTOM = MARGIN + 30;

    function esc(s) {
      // Normaliza a WinAnsi y escapa los caracteres especiales del PDF.
      return toWinAnsi(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    }
    function charWidth(ch) {
      if (ch === ' ') return 278;
      if ('iIl.,:;\'|!'.includes(ch)) return 240;
      if ('fjtr()[]/\\'.includes(ch)) return 320;
      if ('mwMW'.includes(ch)) return 830;
      if (ch >= 'A' && ch <= 'Z') return 680;
      const c = ch.charCodeAt(0);
      if (c >= 48 && c <= 57) return 556;
      return 530;
    }
    function textWidth(str, size) { let w = 0; for (const ch of str) w += charWidth(ch); return (w / 1000) * size; }
    function wrap(text, size, maxW) {
      const words = String(text).split(/\s+/); const lines = []; let line = '';
      words.forEach(word => {
        const test = line ? line + ' ' + word : word;
        if (textWidth(test, size) > maxW && line) { lines.push(line); line = word; } else line = test;
      });
      if (line) lines.push(line);
      return lines;
    }

    const pages = []; let ops = ''; let y = PAGE_H - MARGIN;
    function newPage() { pages.push(ops); ops = ''; y = PAGE_H - MARGIN; }
    function ensureSpace(n) { if (y - n < BOTTOM) newPage(); }
    function drawLine(str, x, size, font) {
      ops += 'BT /' + font + ' ' + size + ' Tf 1 0 0 1 ' + x.toFixed(2) + ' ' + y.toFixed(2) + ' Tm (' + esc(str) + ') Tj ET\n';
    }
    function paragraph(text, opts) {
      opts = opts || {};
      const size = opts.size || FS, font = opts.font || 'F1', lead = opts.lead || LEAD, indent = opts.indent || 0;
      wrap(text, size, CONTENT_W - indent).forEach(ln => { ensureSpace(lead); drawLine(ln, MARGIN + indent, size, font); y -= lead; });
    }
    function gap(h) { ensureSpace(h); y -= h; }
    function rule() {
      ensureSpace(10);
      ops += '0.80 0.66 0.15 RG 1 w ' + MARGIN.toFixed(2) + ' ' + y.toFixed(2) + ' m ' + (PAGE_W - MARGIN).toFixed(2) + ' ' + y.toFixed(2) + ' l S\n';
      y -= 14;
    }

    // --- Contenido ---
    paragraph('ESCUELA MILITAR DE INGENIERÍA', { font: 'F2', size: 12, lead: 16 });
    paragraph('Maestría en Ciberseguridad y Ciberdefensa', { size: 9.5, lead: 13 });
    gap(6); rule();
    paragraph(CONSENT.titulo.toUpperCase(), { font: 'F2', size: 15, lead: 20 });
    gap(4); paragraph(CONSENT.intro, { size: FS, lead: LEAD }); gap(8);
    CONSENT.secciones.forEach(s => {
      ensureSpace(LEAD * 2);
      paragraph(s.titulo, { font: 'F2', size: 11.5, lead: 16 });
      paragraph(s.texto, { size: FS, lead: LEAD });
      gap(6);
    });
    ensureSpace(LEAD * 2);
    paragraph('Declaración', { font: 'F2', size: 11.5, lead: 16 });
    paragraph(CONSENT.declaracion, { size: FS, lead: LEAD });
    gap(10); rule();
    paragraph('DATOS DEL PARTICIPANTE', { font: 'F2', size: 11.5, lead: 17 });
    paragraph('Nombre: ' + datos.nombre, { size: FS, lead: LEAD });
    paragraph('Grado / Título: ' + datos.grado, { size: FS, lead: LEAD });
    paragraph('Institución: ' + datos.institucion, { size: FS, lead: LEAD });
    paragraph('Correo electrónico: ' + datos.correo, { size: FS, lead: LEAD });
    paragraph('Fecha: ' + datos.fecha, { size: FS, lead: LEAD });
    gap(10);

    const hasImg = !!firmaDataURL;
    const sigBoxW = 220, sigBoxH = 74;
    ensureSpace(sigBoxH + 30);
    paragraph('Firma del participante:', { font: 'F2', size: 10.5, lead: 16 });
    gap(2);
    if (hasImg) {
      const ratio = imgW > 0 ? (imgH / imgW) : 0.33;
      let drawW = sigBoxW, realH = drawW * ratio;
      if (realH > sigBoxH) { realH = sigBoxH; drawW = realH / ratio; }
      const imgX = MARGIN, imgY = y - realH;
      ops += 'q ' + drawW.toFixed(2) + ' 0 0 ' + realH.toFixed(2) + ' ' + imgX.toFixed(2) + ' ' + imgY.toFixed(2) + ' cm /Im0 Do Q\n';
      y = imgY - 6;
    } else { gap(40); }
    ensureSpace(20);
    ops += '0.25 0.29 0.20 RG 0.8 w ' + MARGIN.toFixed(2) + ' ' + y.toFixed(2) + ' m ' + (MARGIN + 240).toFixed(2) + ' ' + y.toFixed(2) + ' l S\n';
    y -= 12;
    drawLine(datos.nombre, MARGIN, 9, 'F1'); y -= 12;
    drawLine('Documento generado en el navegador - ' + datos.fecha, MARGIN, 8, 'F1');
    newPage();

    // --- Ensamblado ---
    let jpegBin = '';
    if (hasImg) { const b64 = firmaDataURL.split(',')[1] || ''; jpegBin = atob(b64); }

    const objects = [];
    const imgObjNum = hasImg ? 5 : 0;
    const firstPageObj = hasImg ? 6 : 5;
    const pageCount = pages.length;
    const pageRefs = [];
    for (let i = 0; i < pageCount; i++) pageRefs.push((firstPageObj + i * 2) + ' 0 R');

    objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    const resources = '/Resources << /Font << /F1 3 0 R /F2 4 0 R >>' + (hasImg ? ' /XObject << /Im0 ' + imgObjNum + ' 0 R >>' : '') + ' >>';
    objects[2] = '<< /Type /Pages /Count ' + pageCount + ' /Kids [' + pageRefs.join(' ') + '] /MediaBox [0 0 ' + PAGE_W.toFixed(2) + ' ' + PAGE_H.toFixed(2) + '] ' + resources + ' >>';
    objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
    if (hasImg) {
      objects[imgObjNum] = '<< /Type /XObject /Subtype /Image /Width ' + imgW + ' /Height ' + imgH + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpegBin.length + ' >>\nstream\n' + jpegBin + '\nendstream';
    }
    for (let i = 0; i < pageCount; i++) {
      const pageNum = firstPageObj + i * 2, contentNum = pageNum + 1;
      objects[pageNum] = '<< /Type /Page /Parent 2 0 R /Contents ' + contentNum + ' 0 R >>';
      const stream = pages[i];
      objects[contentNum] = '<< /Length ' + stream.length + ' >>\nstream\n' + stream + 'endstream';
    }

    let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    const offsets = []; const maxObj = objects.length - 1;
    for (let n = 1; n <= maxObj; n++) {
      if (objects[n] == null) continue;
      offsets[n] = pdf.length;
      pdf += n + ' 0 obj\n' + objects[n] + '\nendobj\n';
    }
    const xrefStart = pdf.length, total = maxObj + 1;
    pdf += 'xref\n0 ' + total + '\n0000000000 65535 f \n';
    for (let n = 1; n <= maxObj; n++) pdf += String(offsets[n] != null ? offsets[n] : 0).padStart(10, '0') + ' 00000 n \n';
    pdf += 'trailer\n<< /Size ' + total + ' /Root 1 0 R >>\nstartxref\n' + xrefStart + '\n%%EOF';

    const bytes = new Uint8Array(pdf.length);
    for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
    return new Blob([bytes], { type: 'application/pdf' });
  }

  /* ==========================================================================
     17. CONTACTO (mailto, sin backend)
     ========================================================================== */
  const contactForm = $('#contact-form');
  const contactFeedback = $('#contact-feedback');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      contactFeedback.className = 'consent__feedback';
      const nombre = $('#ct-nombre').value.trim(), correo = $('#ct-correo').value.trim();
      const asunto = $('#ct-asunto').value.trim(), mensaje = $('#ct-mensaje').value.trim();
      if (!nombre || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || !mensaje) {
        contactFeedback.classList.add('is-error');
        contactFeedback.textContent = 'Complete su nombre, un correo válido y el mensaje.';
        return;
      }
      const destino = 'correo@ejemplo.edu'; // ← sustituir por el correo institucional real
      const cuerpo = 'Nombre: ' + nombre + '\nCorreo: ' + correo + '\n\n' + mensaje;
      window.location.href = 'mailto:' + destino + '?subject=' + encodeURIComponent(asunto || 'Contacto desde el repositorio de tesis') + '&body=' + encodeURIComponent(cuerpo);
      contactFeedback.classList.add('is-ok');
      contactFeedback.textContent = 'Se abrirá su cliente de correo para enviar el mensaje.';
    });
  }

});
