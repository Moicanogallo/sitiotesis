/* ============================================================================
   RÚBRICAS — Evaluador interactivo de competencias (JavaScript Vanilla)
   Escuela Militar de Ingeniería — Maestría en Ciberseguridad y Ciberdefensa
   ----------------------------------------------------------------------------
   Adaptación del Apéndice B: captura de puntajes 1–4 pre/post por competencia,
   métricas grupales en vivo, gráfico de barras y exportación a CSV.
   Módulo aislado (IIFE); no interfiere con js/script.js. Sin servidor.
   ============================================================================ */
(function () {
  'use strict';

  const root = document.getElementById('rubricas');
  if (!root) return; // la sección no existe → no hacer nada

  /* -------- Utilidades locales (con nombres propios, sin chocar) -------- */
  const q  = (s) => root.querySelector(s);
  const f1 = (n) => isFinite(n) ? n.toFixed(1) : '—';
  const f2 = (n) => isFinite(n) ? n.toFixed(2) : '—';
  const prom = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
  const pct = (ini, fin) => (isFinite(ini) && isFinite(fin) && ini > 0) ? ((fin - ini) / ini) * 100 : NaN;
  const nivel = (p) => !isFinite(p) ? '—' : p >= 3.51 ? 'Excelente' : p >= 2.51 ? 'Bueno' : p >= 1.51 ? 'Suficiente' : 'Insuficiente';
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const COMPS = [
    { clave: 'critico',   nombre: 'Pensamiento crítico' },
    { clave: 'sistemico', nombre: 'Pensamiento sistémico' },
    { clave: 'creativo',  nombre: 'Pensamiento creativo' },
    { clave: 'productos', nombre: 'Productos de planeación' }
  ];

  /* -------- Estado en memoria -------- */
  const estado = { discentes: [] };
  let seq = 1;

  function nuevoDiscente(nombre) {
    const cal = {};
    COMPS.forEach((c) => { cal[c.clave] = { ini: 0, fin: 0 }; });
    estado.discentes.push({ id: seq++, nombre, cal });
  }

  /* -------- Cálculos -------- */
  function promIndividual(d, fase) {
    return prom(COMPS.map((c) => d.cal[c.clave][fase]).filter((v) => v > 0));
  }
  function promGrupal(fase, clave) {
    const vals = [];
    estado.discentes.forEach((d) => {
      if (clave) { const v = d.cal[clave][fase]; if (v > 0) vals.push(v); }
      else { const p = promIndividual(d, fase); if (isFinite(p)) vals.push(p); }
    });
    return prom(vals);
  }

  /* -------- Render: selector de puntaje -------- */
  function selector(idD, clave, fase, valor) {
    let ops = '<option value="0"' + (valor === 0 ? ' selected' : '') + '>—</option>';
    for (let v = 1; v <= 4; v++) ops += '<option value="' + v + '"' + (valor === v ? ' selected' : '') + '>' + v + '</option>';
    return '<select class="rub-select" data-d="' + idD + '" data-c="' + clave + '" data-f="' + fase + '" aria-label="' + clave + ' ' + fase + '">' + ops + '</select>';
  }

  /* -------- Render: lista de discentes -------- */
  function pintarLista() {
    const cont = q('#rb-list');
    if (!estado.discentes.length) {
      cont.innerHTML = '<div class="rub-empty">Aún no hay discentes registrados. Agregue uno o cargue el ejemplo del censo completo (n = 9).</div>';
    } else {
      cont.innerHTML = estado.discentes.map((d) => {
        const pIni = promIndividual(d, 'ini'), pFin = promIndividual(d, 'fin'), mej = pct(pIni, pFin);
        const comps = COMPS.map((c) => {
          const m = pct(d.cal[c.clave].ini, d.cal[c.clave].fin);
          const chip = isFinite(m)
            ? '<span class="rub-chip ' + (m > 0 ? 'rub-chip--up' : m < 0 ? 'rub-chip--down' : '') + '">' + (m > 0 ? '▲' : m < 0 ? '▼' : '•') + ' ' + f1(Math.abs(m)) + ' %</span>'
            : '<span class="rub-chip">sin datos</span>';
          return '<div class="rub-comp">' +
            '<div class="rub-comp__title">' + c.nombre + '</div>' +
            '<div class="rub-pair">' +
              '<div><label>Inicial</label>' + selector(d.id, c.clave, 'ini', d.cal[c.clave].ini) + '</div>' +
              '<div><label>Final</label>' + selector(d.id, c.clave, 'fin', d.cal[c.clave].fin) + '</div>' +
            '</div>' + chip +
          '</div>';
        }).join('');
        const resumen = 'Prom. inicial ' + f2(pIni) + ' · Prom. final ' + f2(pFin) +
          (isFinite(mej) ? ' · Mejora ' + f1(mej) + ' % · Nivel final: ' + nivel(pFin) : '');
        return '<div class="rub-disc">' +
          '<div class="rub-disc__head">' +
            '<span class="rub-disc__name">' + esc(d.nombre) + '</span>' +
            '<span class="rub-disc__sum">' + resumen + '</span>' +
            '<button class="btn btn--small btn--ghost" type="button" data-del="' + d.id + '">Eliminar</button>' +
          '</div>' +
          '<div class="rub-disc__body"><div class="rub-grid">' + comps + '</div></div>' +
        '</div>';
      }).join('');
    }
    pintarMetricas();
  }

  /* -------- Render: métricas + gráfico -------- */
  function pintarMetricas() {
    const gIni = promGrupal('ini'), gFin = promGrupal('fin'), mej = pct(gIni, gFin);
    q('#rb-metrics').innerHTML =
      '<div class="rub-metric"><div class="rub-metric__label">Discentes (n)</div><div class="rub-metric__value">' + estado.discentes.length + '</div><div class="rub-metric__detail">Censo evaluado</div></div>' +
      '<div class="rub-metric"><div class="rub-metric__label">Promedio inicial</div><div class="rub-metric__value">' + f2(gIni) + '<span class="u"> / 4</span></div><div class="rub-metric__detail">' + nivel(gIni) + '</div></div>' +
      '<div class="rub-metric"><div class="rub-metric__label">Promedio final</div><div class="rub-metric__value">' + f2(gFin) + '<span class="u"> / 4</span></div><div class="rub-metric__detail">' + nivel(gFin) + '</div></div>' +
      '<div class="rub-metric rub-metric--gold"><div class="rub-metric__label">Mejora grupal</div><div class="rub-metric__value ' + (isFinite(mej) ? (mej > 0 ? 'pos' : mej < 0 ? 'neg' : '') : '') + '">' + (isFinite(mej) ? (mej > 0 ? '+' : '') + f1(mej) : '—') + '<span class="u"> %</span></div><div class="rub-metric__detail">Entre pre y post</div></div>';

    q('#rb-bars').innerHTML = COMPS.map((c) => {
      const i = promGrupal('ini', c.clave), fn = promGrupal('fin', c.clave);
      const wi = isFinite(i) ? (i / 4 * 100) : 0, wf = isFinite(fn) ? (fn / 4 * 100) : 0;
      const m = pct(i, fn);
      return '<div class="rub-bar-group">' +
        '<div class="rub-bar-label"><span>' + c.nombre + '</span><span>' + (isFinite(m) ? (m > 0 ? '+' : '') + f1(m) + ' %' : '') + '</span></div>' +
        '<div class="rub-track"><div class="rub-fill rub-fill--ini" style="width:' + wi.toFixed(1) + '%">' + (isFinite(i) ? f2(i) : '') + '</div></div>' +
        '<div class="rub-track"><div class="rub-fill rub-fill--fin" style="width:' + wf.toFixed(1) + '%">' + (isFinite(fn) ? f2(fn) : '') + '</div></div>' +
      '</div>';
    }).join('');
  }

  /* -------- Eventos -------- */
  q('#rb-add').addEventListener('click', () => {
    const inp = q('#rb-nombre');
    const nombre = inp.value.trim() || ('Discente ' + String(estado.discentes.length + 1).padStart(2, '0'));
    nuevoDiscente(nombre); inp.value = ''; inp.focus(); pintarLista();
  });
  q('#rb-nombre').addEventListener('keydown', (e) => { if (e.key === 'Enter') q('#rb-add').click(); });

  q('#rb-list').addEventListener('change', (e) => {
    const s = e.target.closest('select.rub-select');
    if (!s) return;
    const d = estado.discentes.find((x) => x.id === +s.dataset.d);
    if (d) { d.cal[s.dataset.c][s.dataset.f] = +s.value; pintarLista(); }
  });
  q('#rb-list').addEventListener('click', (e) => {
    const b = e.target.closest('[data-del]');
    if (b) { estado.discentes = estado.discentes.filter((x) => x.id !== +b.dataset.del); pintarLista(); }
  });

  q('#rb-demo').addEventListener('click', () => {
    estado.discentes = [];
    // Datos ilustrativos coherentes con un diseño pre/post (n = 9, censo completo)
    const demo = [
      [2,3, 2,3, 1,3, 2,3],[1,3, 2,3, 2,3, 1,3],[2,4, 2,3, 2,3, 2,3],
      [2,3, 1,3, 2,4, 2,3],[3,4, 2,4, 2,3, 2,4],[1,3, 2,3, 1,3, 2,3],
      [2,3, 2,4, 2,3, 1,3],[2,4, 3,4, 2,4, 2,3],[1,3, 2,3, 2,3, 2,4]
    ];
    demo.forEach((v, i) => {
      nuevoDiscente('Discente ' + String(i + 1).padStart(2, '0'));
      const d = estado.discentes[estado.discentes.length - 1];
      COMPS.forEach((c, j) => { d.cal[c.clave].ini = v[j * 2]; d.cal[c.clave].fin = v[j * 2 + 1]; });
    });
    pintarLista();
  });

  /* -------- Exportación CSV (solo rúbricas) -------- */
  function csvCampo(v) {
    const s = String(v == null ? '' : v);
    return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function construirCSV() {
    const L = [];
    const fila = (arr) => L.push(arr.map(csvCampo).join(','));
    fila(['RUBRICAS ANALITICAS - EVALUACION DE COMPETENCIAS (escala 1-4)']);
    fila(['Escuela Militar de Ingenieria - Maestria en Ciberseguridad y Ciberdefensa']);
    fila(['Fecha de exportacion', new Date().toLocaleString('es-MX')]);
    L.push('');
    fila(['Discente',
      'Critico inicial', 'Critico final', 'Critico mejora %',
      'Sistemico inicial', 'Sistemico final', 'Sistemico mejora %',
      'Creativo inicial', 'Creativo final', 'Creativo mejora %',
      'Productos inicial', 'Productos final', 'Productos mejora %',
      'Promedio inicial', 'Promedio final', 'Mejora individual %', 'Nivel final']);
    estado.discentes.forEach((d) => {
      const r = [d.nombre];
      COMPS.forEach((c) => {
        const o = d.cal[c.clave];
        r.push(o.ini || '', o.fin || '', isFinite(pct(o.ini, o.fin)) ? f1(pct(o.ini, o.fin)) : '');
      });
      const pi = promIndividual(d, 'ini'), pf = promIndividual(d, 'fin');
      r.push(f2(pi), f2(pf), isFinite(pct(pi, pf)) ? f1(pct(pi, pf)) : '', nivel(pf));
      fila(r);
    });
    L.push('');
    fila(['METRICAS GRUPALES']);
    fila(['Competencia', 'Promedio inicial', 'Promedio final', 'Mejora %']);
    COMPS.forEach((c) => {
      const i = promGrupal('ini', c.clave), fn = promGrupal('fin', c.clave);
      fila([c.nombre, f2(i), f2(fn), isFinite(pct(i, fn)) ? f1(pct(i, fn)) : '']);
    });
    const gi = promGrupal('ini'), gf = promGrupal('fin');
    fila(['GLOBAL', f2(gi), f2(gf), isFinite(pct(gi, gf)) ? f1(pct(gi, gf)) : '']);
    return L.join('\r\n');
  }
  q('#rb-csv').addEventListener('click', () => {
    if (!estado.discentes.length) { q('#rb-nombre').focus(); return; }
    const blob = new Blob(['﻿' + construirCSV()], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rubricas_competencias_' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 3000);
  });

  /* -------- Inicio -------- */
  pintarLista();
})();
