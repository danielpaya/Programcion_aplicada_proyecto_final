(() => {
const D = window.DATOS, MOD = window.MOD, TEC = window.TEC;
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const nf = d => new Intl.NumberFormat('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (x, d = 1) => nf(d).format(x * 100) + ' %';
const mm = x => (x < 0 ? '-' : '') + '$' + nf(0).format(Math.abs(x)) + ' M';
const C = { teja: '#A3322A', mostaza: '#D9A43A', crema: '#EEE7D7', cremaOsc: '#E0D4BA', tinta: '#2A211B', oliva: '#2F6B3F', gris: '#9C9283' };
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
Chart.defaults.font.family = '"DM Sans", system-ui, sans-serif';
Chart.defaults.font.size = 13; Chart.defaults.color = C.tinta;
Chart.defaults.borderColor = 'rgba(42,27,23,.15)'; Chart.defaults.maintainAspectRatio = false;
Chart.defaults.devicePixelRatio = 2; Chart.defaults.animation.duration = reduce ? 0 : 700;
Chart.defaults.plugins.legend.labels.boxWidth = 12;
Chart.defaults.plugins.tooltip.backgroundColor = C.tinta;

/* ---------- cálculos compartidos ---------- */
function pmf(ps) { const a = new Float64Array(ps.length + 1); a[0] = 1; let m = 0; for (const p of ps) { m++; for (let k = m; k >= 1; k--) a[k] = a[k] * (1 - p) + a[k - 1] * p; a[0] *= 1 - p; } return a; }
const N = D.noches.map(n => { const a = pmf(n.p), cdf = []; let s = 0; for (const v of a) { s += v; cdf.push(s); } return { real: n.real, cdf }; });
const sumReal = N.reduce((s, n) => s + n.real, 0);
const quant = (n, q) => { for (let k = 0; k < n.cdf.length; k++) if (n.cdf[k] >= q - 1e-9) return k; return n.cdf.length - 1; };
function ev(qp) { const q = qp / 100; let cub = 0, inc = 0, ex = 0; for (const n of N) { const e = quant(n, q); ex += e; cub += Math.min(e, n.real); if (e > n.real) inc++; } return { extra: ex / N.length, cob: cub / sumReal, inc: inc / N.length }; }
const curva = []; for (let q = 1; q <= 40; q++) { const e = ev(q); curva.push({ x: e.inc, y: e.cob, q }); }
const S = D.sin, R = D.r;
function calc2(t, g) { let n = 0, perd = 0, quedan = 0, perdAll = 0; const tot = S.p.length;
  for (let i = 0; i < tot; i++) { const pi = S.ing[i] * S.c[i]; perdAll += pi; if (S.p[i] > t) { n++; perd += pi; quedan += S.ing[i] * (1 - S.c[i]); } }
  const prot = perd * (1 - R) / 1000; return { pm: n / tot, prot, neto: prot - g * quedan / 1000, recup: perdAll * (1 - R) / 1000 }; }
const UM = []; for (let t = 5; t <= 70; t += 5) UM.push(t);
function p3(canal, g) { const P = D.p3[canal]; const tn = (x) => P.tasa_canal - P.sh_afect * (P.hoy - x);
  return { hoy: P.tasa_canal, mod: tn(P.mod), dep: tn(P.dep), neto: P.afect * P.ticket * ((1 - g) * (1 - P.dep) - (1 - P.hoy)) / 1e6 }; }

/* ---------- fábricas de gráficos ---------- */
const ejePct = (min, max, txt) => ({ min, max, title: txt ? { display: true, text: txt } : undefined, ticks: { callback: v => pct(v, 0) } });
function gCal(el, oscuro) {
  return new Chart(el, { type: 'line', data: { datasets: [
    { label: 'Calibración perfecta', data: [{ x: 0, y: 0 }, { x: .55, y: .55 }], borderColor: C.gris, borderDash: [6, 5], pointRadius: 0, borderWidth: 2 },
    { label: 'Modelo (deciles)', data: MOD.cal.map(c => ({ x: c.p, y: c.real })), borderColor: C.teja, backgroundColor: C.teja, borderWidth: 3, pointRadius: 5 }] },
    options: { parsing: false, plugins: { tooltip: { callbacks: { label: c => `estimado ${pct(c.parsed.x)} · real ${pct(c.parsed.y)}` } } },
      scales: { x: { type: 'linear', ...ejePct(0, .55, 'probabilidad estimada') }, y: ejePct(0, .55, 'tasa real') } } });
}
function gImp(el) {
  return new Chart(el, { type: 'bar', data: { labels: MOD.imp.map(i => i.k), datasets: [{ data: MOD.imp.map(i => i.v), backgroundColor: MOD.imp.map((_, i) => i < 4 ? C.teja : C.gris), borderColor: C.tinta, borderWidth: 1.5, borderRadius: 3 }] },
    options: { indexAxis: 'y', plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => 'Caída del AUC: ' + nf(3).format(c.parsed.x) } } }, scales: { x: { beginAtZero: true, title: { display: true, text: 'caída del AUC' } }, y: { grid: { display: false } } } } });
}
function gCurva(el, q) {
  const e = curva[q - 1];
  return new Chart(el, { type: 'line', data: { datasets: [
    { label: 'Percentil 1 a 40', data: curva, borderColor: C.tinta, backgroundColor: C.tinta, pointRadius: 2, borderWidth: 2 },
    { label: 'Cobertura ≥ 70 %', data: [{ x: 0, y: .7 }, { x: .4, y: .7 }], borderColor: C.oliva, borderDash: [6, 5], pointRadius: 0, borderWidth: 2 },
    { label: 'Incidencia < 6 %', data: [{ x: .06, y: .5 }, { x: .06, y: 1 }], borderColor: C.teja, borderDash: [6, 5], pointRadius: 0, borderWidth: 2 },
    { type: 'scatter', label: 'Percentil ' + q, data: [e], backgroundColor: C.mostaza, borderColor: C.tinta, borderWidth: 3, pointRadius: 10, pointStyle: 'rectRot' }] },
    options: { parsing: false, plugins: { tooltip: { callbacks: { label: c => c.raw.q ? `P${c.raw.q}: cobertura ${pct(c.raw.y)}, incidencia ${pct(c.raw.x)}` : c.dataset.label } } },
      scales: { x: { type: 'linear', ...ejePct(0, .4, 'noches con incidencia') }, y: ejePct(.5, 1, 'cobertura') } } });
}
function gNeto(el, u, g) {
  const todos = UM.map(t => calc2(t / 100, g / 100));
  return new Chart(el, { type: 'line', data: { labels: UM.map(t => t + ' %'), datasets: [
    { label: 'Beneficio neto', data: todos.map(r => r.neto), borderColor: C.teja, backgroundColor: C.teja, borderWidth: 3, pointRadius: 3, tension: .25 },
    { label: 'Umbral elegido', data: UM.map((t, i) => t === u ? todos[i].neto : null), borderColor: C.tinta, backgroundColor: C.mostaza, borderWidth: 3, pointRadius: 10, pointStyle: 'rectRot', showLine: false }] },
    options: { plugins: { tooltip: { callbacks: { label: c => c.dataset.label + ': ' + mm(c.parsed.y) } } }, scales: { y: { beginAtZero: true, ticks: { callback: v => mm(v) } }, x: { title: { display: true, text: 'umbral de riesgo' }, grid: { display: false } } } } });
}
function gP3(el, canal) {
  const B = p3('Booking', 0), A = p3('Airbnb', 0);
  const sets = canal ? [p3(canal, 0)] : [B, A];
  return new Chart(el, { type: 'bar', data: { labels: canal ? ['Hoy', 'Moderada', 'Depósito'] : ['Booking', 'Airbnb'], datasets: canal
      ? [{ label: canal, data: [sets[0].hoy, sets[0].mod, sets[0].dep], backgroundColor: [C.teja, C.mostaza, C.oliva], borderColor: C.tinta, borderWidth: 2, borderRadius: 4 }]
      : [{ label: 'Hoy', data: [B.hoy, A.hoy], backgroundColor: C.teja }, { label: 'Moderada', data: [B.mod, A.mod], backgroundColor: C.mostaza }, { label: 'Depósito', data: [B.dep, A.dep], backgroundColor: C.oliva }].map(d => ({ ...d, borderColor: C.tinta, borderWidth: 2, borderRadius: 4 })) },
    options: { plugins: { legend: { display: !canal }, tooltip: { callbacks: { label: c => c.dataset.label + ': ' + pct(c.parsed.y) } } }, scales: { y: { beginAtZero: true, max: .3, ticks: { callback: v => pct(v, 0) } }, x: { grid: { display: false } } } },
    plugins: [{ id: 'meta', afterDatasetsDraw(ch) { if (canal && canal !== 'Booking') return; const y = ch.scales.y.getPixelForValue(.216), c = ch.ctx; c.save(); c.setLineDash([6, 5]); c.strokeStyle = C.tinta; c.lineWidth = 2; c.beginPath(); c.moveTo(ch.chartArea.left, y); c.lineTo(ch.chartArea.right, y); c.stroke(); c.setLineDash([]); c.font = '700 12px "DM Sans"'; const tw = c.measureText('Meta Booking 21,6 %').width, x0 = ch.chartArea.right - tw - 10; c.fillStyle = '#FBF3DF'; c.fillRect(x0 - 4, y - 20, tw + 8, 16); c.fillStyle = C.tinta; c.fillText('Meta Booking 21,6 %', x0, y - 7); c.restore(); } }] });
}
function gBarra(el, rows, lab) {
  return new Chart(el, { type: 'bar', data: { labels: rows.map(lab), datasets: [{ data: rows.map(r => r.tasa), backgroundColor: rows.map(r => r.tasa > D.kpi.tasa ? C.teja : C.oliva), borderColor: C.tinta, borderWidth: 1.5, borderRadius: 3 },
    { type: 'line', data: rows.map(() => D.kpi.tasa), borderColor: C.tinta, borderDash: [6, 5], pointRadius: 0, borderWidth: 2 }] },
    options: { plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => pct(c.parsed.y) } } }, scales: { y: { beginAtZero: true, ticks: { callback: v => pct(v, 0) } }, x: { grid: { display: false } } } } });
}

/* ---------- presentación ---------- */
const slides = $$('.slide'), esc = $('#escenario'), puntos = $('#puntos');
let actual = 0; const hechos = {};
slides.forEach((s, i) => { const b = document.createElement('button'); b.setAttribute('aria-label', 'Ir a la diapositiva ' + (i + 1)); b.onclick = () => ir(i); puntos.appendChild(b); const n = document.createElement('span'); n.className = 'num'; n.textContent = (i + 1) + ' / ' + slides.length; s.appendChild(n); });
const graficosSlide = {
  sAntic: () => gBarra($('#sAntic'), D.antic, r => r.k + ' días'),
  sCal: () => gCal($('#sCal')), sImp: () => gImp($('#sImp')),
  sP1: () => gCurva($('#sP1'), 5), sP2: () => gNeto($('#sP2'), 30, 5), sP3: () => gP3($('#sP3')),
};
function ir(i) {
  i = Math.max(0, Math.min(slides.length - 1, i)); actual = i;
  slides.forEach((s, j) => { s.classList.toggle('activa', j === i); s.classList.toggle('antes', j < i); s.setAttribute('aria-hidden', j !== i); });
  $$('#puntos button').forEach((b, j) => b.setAttribute('aria-current', j === i));
  $('#ant').disabled = i === 0; $('#sig').disabled = i === slides.length - 1;
  $('#progreso').style.width = ((i + 1) / slides.length * 100) + '%';
  slides[i].querySelectorAll('canvas').forEach(cv => { if (!hechos[cv.id] && graficosSlide[cv.id]) { hechos[cv.id] = graficosSlide[cv.id](); } });
  try { history.replaceState(null, '', '#s' + (i + 1)); } catch (e) {}
}
function escala() { const w = innerWidth - 40, h = innerHeight - 52 - 72 - 16; esc.style.transform = `scale(${Math.min(w / 1280, h / 720)})`; }
addEventListener('resize', escala); escala();
$('#ant').onclick = () => ir(actual - 1); $('#sig').onclick = () => ir(actual + 1);
addEventListener('keydown', e => {
  if (document.body.classList.contains('tablero')) return;
  if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); ir(actual + 1); }
  if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); ir(actual - 1); }
  if (e.key === 'Home') ir(0); if (e.key === 'End') ir(slides.length - 1);
  if (e.key === 'f' || e.key === 'F') { try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch (er) {} }
});
let tx = null; esc.addEventListener('touchstart', e => tx = e.touches[0].clientX, { passive: true });
esc.addEventListener('touchend', e => { if (tx === null) return; const d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 50) ir(actual + (d < 0 ? 1 : -1)); tx = null; });

/* ---------- modos ---------- */
let tabListo = false;
function modo(t) {
  document.body.classList.toggle('tablero', t); $$('.entregables a').forEach(a => a.removeAttribute('aria-current')); $(`.entregables a[data-e="${t ? 'tab' : 'pres'}"]`).setAttribute('aria-current', 'page');
  $('#ayuda').textContent = t ? 'Mueve los controles para explorar' : 'Flechas ← → para avanzar · F para pantalla completa';
  if (t && !tabListo) { tabListo = true; montarTablero(); }
  
}
function porHash(e, h = location.hash) { if (h === '#tablero') { modo(true); return; } const m = h.match(/^#s(\d+)$/); modo(false); if (m) ir(+m[1] - 1); }
addEventListener('hashchange', porHash);

/* ---------- tablero ---------- */
function montarTablero() {
  // OKR
  const e5 = ev(5), x30 = calc2(.3, .05), B = p3('Booking', 0);
  const filas = [
    ['P1 · Cobertura de cancelaciones', e5.cob, .70, 1, v => pct(v), true, 'ok'],
    ['P1 · Noches con incidencia', e5.inc, .06, .15, v => pct(v), false, 'ok'],
    ['P1 · Error medio por noche', TEC.p1_mae, 3.0, 5, v => nf(2).format(v), false, TEC.p1_mae <= 3 ? 'ok' : 'no'],
    ['P2 · Reservas sin pago marcadas de alto riesgo', x30.pm, .38, 1, v => pct(v, 0), null, 'ok'],
    ['P2 · Ingreso protegido al año', x30.prot, 1149, 2000, v => mm(v), true, 'ok'],
    ['P3 · Tasa de cancelación de Booking', B.dep, .216, .3, v => pct(v), false, 'ok'],
    ['P3 · Caída de volumen en el piloto', null, .125, .3, v => '—', false, 'pend'],
  ];
  $('#okr').innerHTML = filas.map(([n, v, meta, max, f, mayor, st]) => {
    const w = v === null ? 0 : Math.min(100, v / max * 100), m = meta / max * 100;
    const txt = st === 'pend' ? 'Se mide en el piloto' : (st === 'ok' ? 'Cumple' : 'Cerca');
    return `<div class="fila"><span>${n}<br><small style="opacity:.75">Meta: ${mayor === true ? '≥ ' : mayor === false ? '≤ ' : '≈ '}${f(meta).replace('—', pct(meta))} · Modelo: ${v === null ? 'pendiente' : f(v)}</small></span>
      <div class="barra" role="img" aria-label="${n}: ${v === null ? 'pendiente' : f(v)} frente a meta ${f(meta)}"><i class="${st === 'no' ? 'mal' : ''}" style="width:0" data-w="${w}"></i><s style="left:calc(${m}% - 1px)"></s></div>
      <span class="estado ${st === 'ok' ? 'ok' : st === 'pend' ? 'pend' : 'no'}">${txt}</span></div>`; }).join('');
  requestAnimationFrame(() => $$('#okr .barra i').forEach(i => i.style.width = i.dataset.w + '%'));
  gCal($('#dCal')); gImp($('#dImp'));
  gBarra($('#dCan'), [...D.canal].sort((a, b) => b.tasa - a.tasa), r => r.k);
  gBarra($('#dAnt'), D.antic, r => r.k + ' días');
  // P1
  let c1 = gCurva($('#dP1'), 5);
  const f1 = () => { const q = +$('#dQ').value, e = curva[q - 1]; $('#oQ').textContent = q; const ex = ev(q);
    $('#mExtra').textContent = nf(1).format(ex.extra); $('#mCob').textContent = pct(e.y); $('#mInc').textContent = pct(e.x);
    $('#cCob').className = e.y >= .7 ? 'ok' : 'mal'; $('#cInc').className = e.x < .06 ? 'ok' : 'mal';
    c1.data.datasets[3].data = [e]; c1.data.datasets[3].label = 'Percentil ' + q; c1.update(); };
  $('#dQ').oninput = f1; f1();
  // P2
  let c2 = gNeto($('#dP2'), 30, 5);
  const f2 = () => { const u = +$('#dU').value, g = +$('#dG').value; $('#oU').textContent = u + ' %'; $('#oG').textContent = g + ' %';
    const x = calc2(u / 100, g / 100); $('#mPm').textContent = pct(x.pm, 0); $('#mProt').textContent = mm(x.prot); $('#mNeto').textContent = mm(x.neto); $('#cNeto').className = x.neto >= 0 ? 'ok' : 'mal';
    const todos = UM.map(t => calc2(t / 100, g / 100)); c2.data.datasets[0].data = todos.map(r => r.neto); c2.data.datasets[1].data = UM.map((t, i) => t === u ? todos[i].neto : null); c2.update(); };
  $('#dU').oninput = f2; $('#dG').oninput = f2; f2();
  // P3
  let canal = 'Booking', c3 = gP3($('#dP3'), canal);
  const f3 = () => { const g = +$('#dG3').value / 100; $('#oG3').textContent = Math.round(g * 100) + ' %'; const x = p3(canal, g);
    $('#mHoy').textContent = pct(x.hoy); $('#mDep').textContent = pct(x.dep); $('#mN3').textContent = mm(x.neto); $('#cN3').className = x.neto >= 0 ? 'ok' : 'mal'; };
  $('#dCanal').onclick = e => { const b = e.target.closest('.ficha'); if (!b) return; canal = b.dataset.v; $$('#dCanal .ficha').forEach(z => z.setAttribute('aria-pressed', z === b)); c3.destroy(); c3 = gP3($('#dP3'), canal); f3(); };
  $('#dG3').oninput = f3; f3();
}

/* ---------- inicio ---------- */
{ const h0 = location.hash; ir(0); porHash(null, h0); }
window.__chk = { p5: ev(5), p10: ev(10), p2: calc2(.3, .05), bk: p3('Booking', 0) };
})();
