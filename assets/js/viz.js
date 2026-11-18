(() => {
const D = window.DATOS;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const nf = d => new Intl.NumberFormat('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (x, d = 1) => nf(d).format(x * 100) + '\u00A0%';
const mm = x => (x < 0 ? '-' : '') + '$' + nf(0).format(Math.abs(x)) + ' M';
const C = { teja: '#A3322A', naranja: '#C9A06B', mostaza: '#D9A43A', crema: '#EEE7D7', cremaOsc: '#E0D4BA', tinta: '#2A211B', oliva: '#2F6B3F', gris: '#9C9283' };
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

Chart.defaults.font.family = '"DM Sans", system-ui, sans-serif';
Chart.defaults.font.size = 12.5;
Chart.defaults.color = C.tinta;
Chart.defaults.borderColor = 'rgba(42,27,23,.16)';
Chart.defaults.maintainAspectRatio = false;
Chart.defaults.animation.duration = reduce ? 0 : 450;
Chart.defaults.plugins.legend.labels.boxWidth = 12;
Chart.defaults.plugins.tooltip.backgroundColor = C.tinta;
Chart.defaults.plugins.tooltip.titleFont = { family: '"DM Sans"', weight: '700' };
Chart.defaults.plugins.tooltip.cornerRadius = 6;

/* ---------- animación de números ---------- */
const tw = new WeakMap();
function tween(el, to, fmt, dur = 420) {
  const from = tw.get(el) ?? to; tw.set(el, to);
  if (reduce || from === to) { el.textContent = fmt(to); return; }
  const t0 = performance.now(); cancelAnimationFrame(el._r);
  const paso = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(from + (to - from) * e); if (k < 1) el._r = requestAnimationFrame(paso); };
  el._r = requestAnimationFrame(paso);
}
function fillRange(inp) { const k = (inp.value - inp.min) / (inp.max - inp.min); inp.style.setProperty('--lleno', (k * 100) + '%'); }
$$('input[type=range]').forEach(i => { fillRange(i); i.addEventListener('input', () => fillRange(i)); });

/* ---------- hero: sellos ---------- */
const FM = { pct: v => nf(1).format(v) + ' %', mm: v => '$' + nf(0).format(v) + ' M', ent: v => nf(0).format(v) + ' %', ent0: v => nf(0).format(v) };
$$('[data-cuenta]').forEach((b, i) => {
  const to = +b.dataset.cuenta, f = FM[b.dataset.f];
  if (reduce) { b.textContent = f(to); return; }
  setTimeout(() => { const t0 = performance.now(), d = 1300; const p = t => { const k = Math.min(1, (t - t0) / d); b.textContent = f(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(p); }; requestAnimationFrame(p); }, 1100 + i * 180);
});
const frases = ['Una de cada cinco reservas se cancela', 'Habitaciones vacías que ya no se pueden vender', 'Depósito para quien más cancela', 'Booking y Airbnb en la mira', 'Reservas adicionales con criterio'];
$('#cinta').innerHTML = [...frases, ...frases, ...frases].map(f => `${f}<img src="../assets/img/grano.svg" alt="">`).join('');

/* ---------- navegación y paralaje ---------- */
const secs = $$('main section[id]'), links = $$('.subnav a');
secs.forEach(s => new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle('activo', a.getAttribute('href') === '#' + s.id)); }), { rootMargin: '-45% 0px -50% 0px' }).observe(s));
const par = $$('.deco[data-par]'); let tick = false;
function mover() { tick = false; par.forEach(el => { const r = el.getBoundingClientRect(); el.style.transform = `translateY(${(r.top + r.height / 2 - innerHeight / 2) * -(+el.dataset.par)}px)`; }); }
if (!reduce) addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(mover); } }, { passive: true });

/* ---------- panorama ---------- */
const prom = D.kpi.tasa;
const dsPan = {
  antic: { rows: D.antic, lab: r => r.k + ' días', t: 'Tasa de cancelación según los días de anticipación' },
  canal: { rows: [...D.canal].sort((a, b) => b.tasa - a.tasa), lab: r => r.k, t: 'Tasa de cancelación por canal' },
  politica: { rows: [...D.politica].sort((a, b) => b.tasa - a.tasa), lab: r => r.k, t: 'Tasa de cancelación por política' },
  deposito: { rows: D.deposito, lab: r => r.k === '1' ? 'Con pago anticipado' : 'Sin pago anticipado', t: 'Tasa de cancelación según el pago anticipado' },
  previas: { rows: D.previas, lab: r => r.k === '3' ? '3 o más' : r.k + (r.k === '1' ? ' cancelación' : ' cancelaciones'), t: 'Tasa de cancelación según cancelaciones previas del huésped' },
};
const F = (rows, k) => rows.find(r => r.k === k);
function textoPan(k) {
  const r = dsPan[k].rows;
  if (k === 'antic') return [`Entre más lejos se reserva, más se cancela: de ${pct(r[0].tasa)} en reservas de la última semana a ${pct(r[r.length - 1].tasa)} en las de más de 180 días.`, 'La anticipación es la variable más asociada con cancelar, junto con las cancelaciones previas y el pago anticipado. En el modelo pesan más la política y el canal, porque combinan varias de estas señales.'];
  if (k === 'canal') { const b = F(D.canal, 'Booking'), a = F(D.canal, 'Airbnb'), w = F(D.canal, 'Directo web'); return [`Booking cancela ${pct(b.tasa)} y Airbnb ${pct(a.tasa)}, frente a ${pct(w.tasa)} de la venta directa por web.`, `Booking trae el ${pct(b.sh_n, 0)} de las reservas y el ${pct(b.sh_perd, 0)} del ingreso perdido; Airbnb, el ${pct(a.sh_perd, 0)}.`]; }
  if (k === 'politica') { const f = F(D.politica, 'Flexible'), n = F(D.politica, 'No reembolsable'); return [`La tarifa Flexible cancela ${pct(f.tasa)}; la No reembolsable, ${pct(n.tasa)}.`, 'Casi toda la tarifa No reembolsable ya viene con pago anticipado, por eso las dos señales se mezclan: conviene separarlas.']; }
  if (k === 'deposito') return [`Sin pago anticipado se cancela ${pct(r[0].tasa)}; con pago, ${pct(r[1].tasa)}.`, `Esa comparación exagera el efecto. Dentro de las políticas Flexible y Moderada, donde pagar es una decisión, la brecha es ${pct(D.fm.sin)} contra ${pct(D.fm.con)}: casi el doble, no casi el triple.`];
  return [`Con dos cancelaciones previas la tasa sube a ${pct(F(r, '2').tasa, 0)}; sin historial, ${pct(F(r, '0').tasa, 0)}.`, 'El historial del huésped es la segunda señal más fuerte para anticipar una cancelación.'];
}
let chPan;
function pintaPan(k) {
  const d = dsPan[k], [l, n] = textoPan(k);
  $('#lecturaPan').textContent = l; $('#notaPan').textContent = n;
  const labels = d.rows.map(d.lab), vals = d.rows.map(r => r.tasa);
  const cols = vals.map(v => v > prom ? C.teja : C.oliva);
  if (!chPan) {
    chPan = new Chart($('#cPan'), { type: 'bar', data: { labels, datasets: [{ label: 'Tasa de cancelación', data: vals, backgroundColor: cols, borderColor: C.tinta, borderWidth: 2, borderRadius: 4 }, { type: 'line', label: 'Promedio del hotel', data: vals.map(() => prom), borderColor: C.tinta, borderDash: [6, 5], pointRadius: 0, borderWidth: 2 }] },
      options: { plugins: { title: { display: true, text: d.t, font: { size: 14, weight: '700' } }, tooltip: { callbacks: { label: c => c.dataset.label + ': ' + pct(c.parsed.y) } } }, scales: { y: { beginAtZero: true, ticks: { callback: v => pct(v, 0) } }, x: { grid: { display: false } } } } });
  } else {
    chPan.data.labels = labels; chPan.data.datasets[0].data = vals; chPan.data.datasets[0].backgroundColor = cols; chPan.data.datasets[1].data = vals.map(() => prom); chPan.options.plugins.title.text = d.t; chPan.update();
  }
}
pintaPan('antic');
$('#fichasPan').addEventListener('click', e => { const b = e.target.closest('.ficha'); if (!b) return; $$('#fichasPan .ficha').forEach(x => x.setAttribute('aria-pressed', x === b)); pintaPan(b.dataset.k); });

const ventana = { ini: '2023-05', fin: '2025-06' };
new Chart($('#cMes'), { data: { labels: D.mensual.map(m => m.mes), datasets: [
  { type: 'bar', label: 'Reservas por día de llegada', data: D.mensual.map(m => m.rpd), backgroundColor: 'rgba(233,174,63,.75)', borderColor: C.tinta, borderWidth: 1.5, yAxisID: 'y2', borderRadius: 3 },
  { type: 'line', label: 'Tasa de cancelación', data: D.mensual.map(m => m.tasa), borderColor: C.teja, backgroundColor: C.teja, borderWidth: 3, pointRadius: 3, tension: .25, yAxisID: 'y' }] },
  options: { interaction: { mode: 'index', intersect: false }, plugins: { tooltip: { callbacks: { label: c => c.dataset.label + ': ' + (c.dataset.yAxisID === 'y' ? pct(c.parsed.y) : nf(0).format(c.parsed.y)) } } },
    scales: { y: { beginAtZero: true, position: 'left', ticks: { callback: v => pct(v, 0) } }, y2: { beginAtZero: true, position: 'right', grid: { display: false }, title: { display: true, text: 'reservas por día' } }, x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } } } },
  plugins: [{ id: 'ventana', beforeDatasetsDraw(ch) { const x = ch.scales.x, i0 = D.mensual.findIndex(m => m.mes === ventana.ini), i1 = D.mensual.findIndex(m => m.mes === ventana.fin); const a = x.getPixelForValue(i0) - (x.getPixelForValue(1) - x.getPixelForValue(0)) / 2, b = x.getPixelForValue(i1) + (x.getPixelForValue(1) - x.getPixelForValue(0)) / 2; const c = ch.ctx; c.save(); c.fillStyle = 'rgba(107,122,58,.16)'; c.fillRect(a, ch.chartArea.top, b - a, ch.chartArea.height); c.restore(); } }] });

/* ---------- P1: reservas adicionales ---------- */
function pmf(ps) { const a = new Float64Array(ps.length + 1); a[0] = 1; let m = 0; for (const p of ps) { m++; for (let k = m; k >= 1; k--) a[k] = a[k] * (1 - p) + a[k - 1] * p; a[0] *= 1 - p; } return a; }
const N = D.noches.map(n => { const a = pmf(n.p), cdf = new Float64Array(a.length); let s = 0; a.forEach((v, i) => { s += v; cdf[i] = s; }); return { f: n.f, real: n.real, n: n.p.length, esp: n.p.reduce((x, y) => x + y, 0), pmf: a, cdf }; });
const quant = (n, q) => { for (let k = 0; k < n.cdf.length; k++) if (n.cdf[k] >= q - 1e-9) return k; return n.cdf.length - 1; };
const sumReal = N.reduce((s, n) => s + n.real, 0);
function ev(qp) { const q = qp / 100; let cub = 0, inc = 0, ex = 0; for (const n of N) { const e = quant(n, q); ex += e; cub += Math.min(e, n.real); if (e > n.real) inc++; } return { extra: ex / N.length, cob: cub / sumReal, inc: inc / N.length }; }
const fechaCorta = s => new Date(s + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '');
const selNoche = $('#selNoche'); N.forEach((n, i) => { const o = document.createElement('option'); o.value = i; o.textContent = fechaCorta(n.f) + ' · ' + n.real + ' cancelaciones'; selNoche.appendChild(o); });
selNoche.value = Math.max(0, N.findIndex(n => n.f === '2025-03-15'));
const curva = []; for (let q = 1; q <= 40; q++) { const e = ev(q); curva.push({ x: e.inc, y: e.cob, q }); }
const marcaP1 = [{ x: 0, y: 0 }];
const chCurva = new Chart($('#cCurva'), { type: 'line', data: { datasets: [
  { label: 'Percentil 1 a 40', data: curva, borderColor: C.tinta, backgroundColor: C.tinta, pointRadius: 2, borderWidth: 2 },
  { label: 'Cobertura mínima (70 %)', data: [{ x: 0, y: .7 }, { x: .5, y: .7 }], borderColor: C.oliva, borderDash: [6, 5], pointRadius: 0, borderWidth: 2 },
  { label: 'Incidencia máxima (6 %)', data: [{ x: .06, y: 0 }, { x: .06, y: 1 }], borderColor: C.teja, borderDash: [6, 5], pointRadius: 0, borderWidth: 2 },
  { type: 'scatter', label: 'Tu percentil', data: marcaP1, backgroundColor: C.mostaza, borderColor: C.tinta, borderWidth: 3, pointRadius: 9, pointStyle: 'rectRot' }] },
  options: { parsing: false, scales: { x: { type: 'linear', min: 0, max: .4, title: { display: true, text: 'noches con incidencia' }, ticks: { callback: v => pct(v, 0) } }, y: { min: .3, max: 1, title: { display: true, text: 'cobertura' }, ticks: { callback: v => pct(v, 0) } } },
    plugins: { tooltip: { callbacks: { label: c => c.raw.q ? `Percentil ${c.raw.q}: cobertura ${pct(c.raw.y)}, incidencia ${pct(c.raw.x)}` : c.dataset.label } } } } });
const chNoche = new Chart($('#cNoche'), { type: 'bar', data: { labels: [], datasets: [{ label: 'Probabilidad', data: [], backgroundColor: [], borderColor: C.tinta, borderWidth: 1, borderRadius: 2 }] },
  options: { plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => 'Probabilidad: ' + pct(c.parsed.y) } } }, scales: { x: { title: { display: true, text: 'cancelaciones en la noche' }, grid: { display: false } }, y: { ticks: { callback: v => pct(v, 0) } } } } });
const fechas = N.map(n => n.f), selPt = N.map(() => null);
const chSerie = new Chart($('#cSerie'), { type: 'line', data: { labels: fechas, datasets: [
  { label: 'Cancelaciones reales', data: N.map(n => n.real), borderColor: C.gris, borderWidth: 1.2, pointRadius: 0 },
  { label: 'Esperadas por el modelo', data: N.map(n => +n.esp.toFixed(2)), borderColor: C.tinta, borderWidth: 2, pointRadius: 0 },
  { label: 'Reservas adicionales que se aceptarían', data: N.map(() => 0), borderColor: C.teja, borderWidth: 2.2, pointRadius: 0, stepped: true },
  { label: 'Noche elegida', data: selPt, borderColor: C.tinta, backgroundColor: C.mostaza, pointRadius: 7, pointBorderWidth: 3, showLine: false }] },
  options: { interaction: { mode: 'index', intersect: false }, plugins: { tooltip: { callbacks: { title: i => fechaCorta(fechas[i[0].dataIndex]) } } }, scales: { x: { ticks: { maxTicksLimit: 9, callback(v) { return fechaCorta(this.getLabelForValue(v)).replace(/^\d+ /, ''); } }, grid: { display: false } }, y: { beginAtZero: true, title: { display: true, text: 'por noche' } } } } });
function pintaP1() {
  const q = +$('#qP1').value; $('#oQ').textContent = q;
  const e = ev(q);
  tween($('#vExtra'), e.extra, v => nf(1).format(v)); tween($('#vCob'), e.cob, v => pct(v)); tween($('#vInc'), e.inc, v => pct(v));
  $('#bCob').className = e.cob >= .7 ? 'ok' : 'mal'; $('#bInc').className = e.inc < .06 ? 'ok' : 'mal';
  chCurva.data.datasets[3].data = [{ x: e.inc, y: e.cob, q }]; chCurva.update();
  chSerie.data.datasets[2].data = N.map(n => quant(n, q / 100)); pintaNoche(false); chSerie.update();
  $$('[data-q]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.q === q));
}
function pintaNoche(upd = true) {
  const i = +selNoche.value, n = N[i], q = +$('#qP1').value, ex = quant(n, q / 100);
  const lo = Math.max(0, Math.floor(n.esp - 3.4 * Math.sqrt(n.esp)) - 1), hi = Math.min(n.n, Math.ceil(n.esp + 3.4 * Math.sqrt(n.esp)) + 1);
  const ks = []; for (let k = lo; k <= hi; k++) ks.push(k);
  chNoche.data.labels = ks; chNoche.data.datasets[0].data = ks.map(k => n.pmf[k]);
  chNoche.data.datasets[0].backgroundColor = ks.map(k => k === ex ? C.teja : k === n.real ? C.tinta : C.mostaza);
  chNoche.update();
  $('#tNoche').textContent = `${fechaCorta(n.f)}: ${n.n} reservas, se cancelaron ${n.real}`;
  chSerie.data.datasets[3].data = N.map((m, j) => j === i ? m.real : null); if (upd) chSerie.update();
}
$('#qP1').addEventListener('input', pintaP1); selNoche.addEventListener('change', () => pintaNoche());
$$('[data-q]').forEach(b => b.addEventListener('click', () => { $('#qP1').value = b.dataset.q; fillRange($('#qP1')); pintaP1(); }));
pintaP1();

/* ---------- P2: pago por adelantado ---------- */
const S = D.sin, R = D.r, nS = S.p.length;
const selCan = $('#fCanal'), selPol = $('#fPol');
selCan.innerHTML = '<option value="-1">Todos los canales</option>' + D.cats.canal.map((c, i) => `<option value="${i}">${c}</option>`).join('');
selPol.innerHTML = '<option value="-1">Todas las políticas</option>' + D.cats.pol.map((c, i) => `<option value="${i}">${c}</option>`).join('');
function calc2(t, g, ef, fc, fp) {
  let n = 0, tot = 0, cm = 0, perd = 0, quedan = 0, perdAll = 0, cAll = 0;
  for (let i = 0; i < nS; i++) {
    if ((fc >= 0 && S.ca[i] !== fc) || (fp >= 0 && S.po[i] !== fp)) continue;
    tot++; const pi = S.ing[i] * S.c[i]; perdAll += pi; cAll += S.c[i];
    if (S.p[i] > t) { n++; cm += S.c[i]; perd += pi; quedan += S.ing[i] * (1 - S.c[i]); }
  }
  const prot = perd * (1 - R) * ef / 1000, costo = g * quedan / 1000, recup = perdAll * (1 - R) * ef / 1000;
  return { n, tot, tasa: n ? cm / n : 0, resto: tot - n ? (cAll - cm) / (tot - n) : 0, prot, costo, neto: prot - costo, recup, pm: tot ? n / tot : 0, pr: recup ? prot / recup : 0 };
}
const UM = []; for (let t = 5; t <= 70; t += 5) UM.push(t);
const chNeto = new Chart($('#cNeto'), { type: 'line', data: { labels: UM.map(u => u + ' %'), datasets: [
  { label: 'Beneficio neto', data: [], borderColor: C.teja, backgroundColor: C.teja, borderWidth: 3, pointRadius: 3, tension: .25 },
  { label: 'Tu umbral', data: [], borderColor: C.tinta, backgroundColor: C.mostaza, borderWidth: 3, pointRadius: 9, pointStyle: 'rectRot', showLine: false }] },
  options: { plugins: { tooltip: { callbacks: { label: c => c.dataset.label + ': ' + mm(c.parsed.y) } } }, scales: { y: { ticks: { callback: v => mm(v) }, title: { display: true, text: 'millones de pesos' } }, x: { title: { display: true, text: 'umbral de riesgo' }, grid: { display: false } } } } });
const chLift = new Chart($('#cLift'), { type: 'line', data: { datasets: [
  { label: 'Ingreso protegido', data: [], borderColor: C.oliva, backgroundColor: C.oliva, borderWidth: 3, pointRadius: 3, tension: .2 },
  { label: 'Sin focalizar', data: [{ x: 0, y: 0 }, { x: 1, y: 1 }], borderColor: C.gris, borderDash: [6, 5], pointRadius: 0, borderWidth: 2 },
  { type: 'scatter', label: 'Tu umbral', data: [], backgroundColor: C.mostaza, borderColor: C.tinta, borderWidth: 3, pointRadius: 9, pointStyle: 'rectRot' }] },
  options: { parsing: false, scales: { x: { type: 'linear', min: 0, max: 1, title: { display: true, text: 'reservas sin pago a las que se les pide' }, ticks: { callback: v => pct(v, 0) } }, y: { min: 0, max: 1, title: { display: true, text: 'ingreso protegido' }, ticks: { callback: v => pct(v, 0) } } },
    plugins: { tooltip: { callbacks: { label: c => `${pct(c.parsed.x, 0)} de las reservas → ${pct(c.parsed.y, 0)} del ingreso` } } } } });
function pintaP2() {
  const u = +$('#uP2').value, g = +$('#gP2').value, ef = +$('#eP2').value, fc = +selCan.value, fp = +selPol.value;
  $('#oU').textContent = u + ' %'; $('#oG').textContent = g + ' %'; $('#oE').textContent = ef + ' %';
  const x = calc2(u / 100, g / 100, ef / 100, fc, fp);
  tween($('#v2n'), x.n, v => nf(0).format(v)); $('#v2np').textContent = `reservas marcadas (${pct(x.pm, 0)} de las que no pagaron)`;
  tween($('#v2t'), x.tasa, v => pct(v, 0)); $('#v2r').textContent = pct(x.resto, 0);
  tween($('#v2p'), x.prot, mm); tween($('#v2neto'), x.neto, mm);
  $('#v2nb').className = x.neto >= 0 ? 'ok' : 'mal';
  const todos = UM.map(t => calc2(t / 100, g / 100, ef / 100, fc, fp));
  chNeto.data.datasets[0].data = todos.map(r => +r.neto.toFixed(1));
  const iu = UM.indexOf(u); chNeto.data.datasets[1].data = UM.map((t, i) => i === iu ? +x.neto.toFixed(1) : null);
  chLift.data.datasets[0].data = todos.map(r => ({ x: r.pm, y: r.pr })); chLift.data.datasets[0].data.unshift({ x: 0, y: 0 });
  chLift.data.datasets[2].data = [{ x: x.pm, y: x.pr }];
  chNeto.update(); chLift.update();
}
['uP2', 'gP2', 'eP2'].forEach(id => $('#' + id).addEventListener('input', pintaP2)); selCan.addEventListener('change', pintaP2); selPol.addEventListener('change', pintaP2);
pintaP2();

/* ---------- P3: Booking y Airbnb ---------- */
const st3 = { canal: 'Booking', esc: 'dep' };
const chA = new Chart($('#c3a'), { type: 'bar', data: { labels: ['Hoy', 'Con el cambio'], datasets: [{ data: [], backgroundColor: [C.teja, C.oliva], borderColor: C.tinta, borderWidth: 2, borderRadius: 4 }] },
  options: { plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => pct(c.parsed.y) } } }, scales: { y: { beginAtZero: true, max: .35, ticks: { callback: v => pct(v, 0) } }, x: { grid: { display: false } } } } });
const GS = []; for (let g = 0; g <= 40; g++) GS.push(g);
const chB = new Chart($('#c3b'), { type: 'line', data: { labels: GS.map(g => g + ' %'), datasets: [
  { label: 'Cambio en el ingreso confirmado', data: [], borderColor: C.teja, backgroundColor: C.teja, borderWidth: 3, pointRadius: 0 },
  { label: 'Sin cambio', data: GS.map(() => 0), borderColor: C.tinta, borderDash: [6, 5], pointRadius: 0, borderWidth: 2 },
  { label: 'Tu supuesto', data: [], borderColor: C.tinta, backgroundColor: C.mostaza, pointRadius: 9, pointStyle: 'rectRot', borderWidth: 3, showLine: false }] },
  options: { plugins: { tooltip: { callbacks: { title: i => 'Se pierde ' + GS[i[0].dataIndex] + ' % de las reservas afectadas', label: c => mm(c.parsed.y) } } }, scales: { y: { ticks: { callback: v => mm(v) } }, x: { title: { display: true, text: 'reservas afectadas que se pierden' }, ticks: { maxTicksLimit: 9 }, grid: { display: false } } } } });
function pintaP3() {
  const g = +$('#gP3').value / 100; $('#oG3').textContent = Math.round(g * 100) + ' %';
  const P = D.p3[st3.canal], nuevo = st3.esc === 'mod' ? P.mod : P.dep, hoy = P.hoy;
  const tasaNueva = P.tasa_canal - P.sh_afect * (hoy - nuevo);
  const rec = P.afect * P.ticket * (hoy - nuevo) / 1e6, be = 1 - (1 - hoy) / (1 - nuevo), tope = 1 - ((1 - hoy) + .5 * (hoy - nuevo)) / (1 - nuevo);
  const neto = gg => P.afect * P.ticket * ((1 - gg) * (1 - nuevo) - (1 - hoy)) / 1e6;
  tween($('#v3a'), P.tasa_canal, v => pct(v)); tween($('#v3b'), tasaNueva, v => pct(v)); tween($('#v3c'), rec, mm); tween($('#v3d'), be, v => pct(v));
  chA.data.datasets[0].data = [P.tasa_canal, tasaNueva]; chA.update();
  chB.data.datasets[0].data = GS.map(x => +neto(x / 100).toFixed(1)); chB.data.datasets[0].borderColor = C.teja;
  chB.data.datasets[2].data = GS.map(x => x === Math.round(g * 100) ? +neto(g).toFixed(1) : null); chB.update();
  const nn = neto(g), v = $('#ver3');
  v.className = 'veredicto ' + (nn >= 0 ? 'bajo' : 'alto');
  v.textContent = nn >= 0 ? `Si se pierde ${Math.round(g * 100)} % de las reservas afectadas, el cambio todavía suma ${mm(nn)} de ingreso confirmado al año.` : `Si se pierde ${Math.round(g * 100)} % de las reservas afectadas, el cambio resta ${mm(-nn)}: se perdió más demanda de la que se ahorró en cancelaciones.`;
  const kr = st3.canal === 'Booking' && st3.esc === 'dep' ? ` La meta de Booking es 21,6 %; con depósito quedaría en ${pct(tasaNueva)}.` : '';
  $('#nota3').textContent = `Afecta a unas ${nf(0).format(P.afect)} reservas del año de prueba. Tope sugerido para el piloto: perder como máximo ${pct(tope)} de las reservas afectadas, que conserva la mitad del beneficio.` + kr + ' Es un techo optimista: supone que los clientes que se quedan se comportan como los que hoy ya aceptan esa condición.';
}
$('#fCan3').addEventListener('click', e => { const b = e.target.closest('.ficha'); if (!b) return; st3.canal = b.dataset.v; $$('#fCan3 .ficha').forEach(x => x.setAttribute('aria-pressed', x === b)); pintaP3(); });
$('#fEsc3').addEventListener('click', e => { const b = e.target.closest('.ficha'); if (!b) return; st3.esc = b.dataset.v; $$('#fEsc3 .ficha').forEach(x => x.setAttribute('aria-pressed', x === b)); pintaP3(); });
$('#gP3').addEventListener('input', pintaP3); pintaP3();

/* ---------- calculadora (regresión logística simplificada) ---------- */
const L = D.lr, cs = D.cats.canal, ps = D.cats.pol, labs = D.cats.antic;
$('#kCanal').innerHTML = cs.map((c, i) => `<option value="${i}">${c}</option>`).join('');
$('#kPol').innerHTML = ps.map((c, i) => `<option value="${i}">${c}</option>`).join('');
$('#kHab').innerHTML = L.hab.map((c, i) => `<option value="${i}">${c}</option>`).join('');
$('#kCanal').value = Math.max(0, cs.indexOf('Booking')); $('#kPol').value = 0;
function riesgo(dep) {
  const g = id => +$('#' + id).value, ant = g('kAnt'); let z = L.b;
  const add = (k, v) => { if (L.w[k] !== undefined) z += L.w[k] * v; };
  add('deposito_pagado', dep); add('huesped_recurrente', g('kRec')); add('solicitudes_especiales', g('kSol')); add('cancelaciones_previas', g('kPrev')); add('noches', g('kNoc')); add('tarifa_100k', g('kTar') / 1e5);
  const bin = ant <= 7 ? 0 : ant <= 30 ? 1 : ant <= 60 ? 2 : ant <= 90 ? 3 : ant <= 180 ? 4 : 5; if (bin > 0) add('ant_' + labs[bin], 1);
  const c = cs[g('kCanal')], po = ps[g('kPol')], h = L.hab[g('kHab')];
  if (g('kCanal') > 0) add('canal_' + c, 1); if (g('kPol') > 0) add('pol_' + po, 1); if (g('kHab') > 0) add('hab_' + h, 1);
  return 1 / (1 + Math.exp(-z));
}
function pintaCalc() {
  $('#oAnt').textContent = $('#kAnt').value;
  const dep = +$('#kDep').value, p = riesgo(dep), u = +$('#uP2').value / 100, f = Math.min(1, p / .8);
  $('#arco').style.strokeDashoffset = 251 * (1 - f); $('#aguja').style.transform = `rotate(${-90 + 180 * f}deg)`;
  tween($('#kP'), p, v => pct(v, 0)); $('#kProm').textContent = `El promedio del hotel es ${pct(prom)}.`;
  const v = $('#kVer');
  if (dep) { v.className = 'veredicto bajo'; v.textContent = 'Ya pagó por adelantado: el riesgo ya incluye ese efecto.'; $('#kDepNota').textContent = ''; }
  else if (p > u) { v.className = 'veredicto alto'; v.textContent = `Riesgo alto (más de ${pct(u, 0)}): conviene pedirle pago por adelantado.`; $('#kDepNota').textContent = `Con pago anticipado, el modelo estima que su riesgo bajaría a ${pct(riesgo(1), 0)}.`; }
  else { v.className = 'veredicto bajo'; v.textContent = `Riesgo por debajo del umbral de ${pct(u, 0)}: no hace falta pedir pago.`; $('#kDepNota').textContent = `El umbral es el que elegiste en la sección de pago por adelantado.`; }
}
$$('#calculadora select,#calculadora input').forEach(e => e.addEventListener('input', pintaCalc)); $('#uP2').addEventListener('input', pintaCalc); pintaCalc();

/* ---------- propuesta ---------- */
{ const e5 = ev(5), x = calc2(.3, .05, 1, -1, -1), P = D.p3.Booking, tn = P.tasa_canal - P.sh_afect * (P.hoy - P.dep);
  const vis = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { tween($('#pr1'), e5.extra, v => nf(1).format(v)); tween($('#pr2'), x.prot, mm); tween($('#pr3'), tn, v => pct(v)); vis.disconnect(); } }), { threshold: .3 }); vis.observe($('#propuesta'));
  window.__cifras = { p5: e5, p10: ev(10), p2: x, tn }; }
})();
