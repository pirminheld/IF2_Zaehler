'use strict';
const M = CounterModel;
const $ = id => document.getElementById(id);
const qrImage = $('qr-code');
function updateQr() {
  const ready = qrImage.complete && qrImage.naturalWidth > 0;
  qrImage.hidden = !ready;
  $('qr-fallback').hidden = ready;
}
qrImage.addEventListener('load', updateQr);
qrImage.addEventListener('error', updateQr);
updateQr();
const HIGH = '#007b65', LOW = '#8695a7';
let clock = 0, stepNumber = 0, selected = 'b', timer = null;
let states, records, sequences, lastEvents, lastActive;
let resetState = { value: 0, clock: 0, r: 0, mode: 'sync', history: [] };
const qHtml = inverted => inverted ? '<span class="over">Q</span>' : 'Q';
const bitsOf = (value, count) => Array.from({ length: count }, (_, i) => (value >> i) & 1);
const binary = bits => bits.slice().reverse().join('');
const line = (d, value, extra = '') => `<path class="wire" d="${d}" stroke="${value ? HIGH : LOW}" ${extra}/>`;
const txt = (x, y, value, extra = '') => `<text x="${x}" y="${y}" ${extra}>${value}</text>`;

function initializeCounters() {
  clock = 0; stepNumber = 0; states = {}; records = {}; sequences = {}; lastEvents = {}; lastActive = {};
  for (const v of M.variants) {
    states[v.id] = [0, 0, 0];
    records[v.id] = [{ clock: 0, bits: [0, 0, 0], n: 0 }];
    sequences[v.id] = [0]; lastEvents[v.id] = []; lastActive[v.id] = false;
  }
}
function stop() {
  if (timer !== null) clearInterval(timer);
  timer = null; $('play').textContent = '▶ Automatisch'; $('play').setAttribute('aria-pressed', 'false');
}
function advance() {
  const before = clock; clock = 1 - clock; stepNumber++;
  for (const v of M.variants) {
    const result = M.ripple(states[v.id], before, clock, v);
    states[v.id] = result.bits; lastEvents[v.id] = result.events;
    lastActive[v.id] = M.active(before, clock, v.edge);
    records[v.id].push({ clock, bits: result.bits.slice(), n: stepNumber });
    if (lastActive[v.id]) sequences[v.id].push(M.decimal(result.bits));
    if (records[v.id].length > 33) records[v.id].shift();
    if (sequences[v.id].length > 17) sequences[v.id].shift();
  }
  renderCounters();
}
function circuit(variant, bits) {
  let s = '<svg class="circuit" viewBox="0 0 1060 210" role="img" aria-label="Drei T-Flipflops in Reihe; ' + (variant.edge === 'rising' ? 'steigende' : 'fallende') + ' Taktflanke; Weiterleitung über ' + (variant.inverted ? 'Q negiert' : 'Q') + '">';
  s += txt(8, 139, 'Takt');
  s += line('M 55 132 H 110', clock);
  for (let i = 0; i < 3; i++) {
    const x = 110 + 315 * i, q = bits[i], input = i ? (variant.inverted ? 1 - bits[i - 1] : bits[i - 1]) : clock;
    const end = x + 165;
    s += `<rect class="box" x="${x}" y="42" width="165" height="125" rx="3"/>`;
    s += txt(x + 82, 27, 'FF' + (i + 1), 'text-anchor="middle" class="small-label"');
    s += txt(x + 12, 78, 'T'); s += txt(x - 31, 78, '1');
    s += line(`M ${x - 17} 72 H ${x}`, 1);
    s += `<path d="M ${x} 121 L ${x + 15} 132 L ${x} 143" fill="none" stroke="#315777" stroke-width="2"/>`;
    if (variant.edge === 'falling') s += `<circle cx="${x - 6}" cy="132" r="6" fill="white" stroke="${input ? HIGH : LOW}" stroke-width="2"/>`;
    s += txt(end - 14, 85, 'Q' + (i + 1), 'text-anchor="end"');
    s += txt(end - 14, 143, 'Q' + (i + 1), 'text-anchor="end" text-decoration="overline"');
    s += line(`M ${end} 80 H ${end + 50}`, q);
    s += `<circle cx="${end + 6}" cy="137" r="6" fill="white" stroke="${1 - q ? HIGH : LOW}" stroke-width="2"/>`;
    s += line(`M ${end + 12} 137 H ${end + 50}`, 1 - q);
    s += txt(end + 33, 66, q, 'text-anchor="middle"');
    s += txt(end + 33, 162, 1 - q, 'text-anchor="middle"');
    if (i < 2) {
      const y = variant.inverted ? 137 : 80;
      const target = x + 315 - (variant.edge === 'falling' ? 12 : 0);
      s += line(`M ${end + 50} ${y} H ${end + 82} V 132 H ${target}`, variant.inverted ? 1 - q : q);
    }
  }
  s += txt(525, 204, 'Ausgänge ablesen: Q₃ Q₂ Q₁ · Bitgewichte: 4  2  1', 'text-anchor="middle" class="small-label"');
  return s + '</svg>';
}
function waveform(history, rows, title) {
  const width = 1060, left = 70, right = 20, rowHeight = 49;
  const count = Math.max(history.length, 17), dx = (width - left - right) / count;
  const height = rows.length * rowHeight + 28;
  let s = `<div class="wave-scroll"><svg class="wave" viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}">`;
  history.forEach((entry, i) => {
    if (i === history.length - 1) s += `<rect x="${left + i * dx}" y="0" width="${dx}" height="${height - 20}" fill="#eaf3fa"/>`;
    s += `<path d="M ${left + i * dx} 0 V ${height - 22}" stroke="#dbe3ee" stroke-width="1"/>`;
    if (history.length <= 20 || i % 2 === 0) s += txt(left + (i + .5) * dx, height - 3, entry.n, 'text-anchor="middle"');
  });
  rows.forEach((row, j) => {
    const baseline = j * rowHeight + 36, high = baseline - 24;
    s += txt(5, baseline - 6, row.label);
    s += `<path d="M ${left} ${baseline} H ${width - right} M ${left} ${high} H ${width - right}" stroke="#e2e8ef" stroke-width="1"/>`;
    let d = '';
    history.forEach((entry, i) => {
      const y = baseline - row.get(entry) * 24, x = left + i * dx;
      if (i === 0) d += `M ${x} ${y}`;
      else d += ` H ${x} V ${y}`;
      d += ` H ${x + dx}`;
    });
    s += `<path d="${d}" stroke="${row.color}"/>`;
  });
  return s + '</svg></div>';
}
const counterRows = [
  { label: 'Takt', color: '#223a53', get: h => h.clock },
  { label: 'Q₁', color: '#007b65', get: h => h.bits[0] },
  { label: 'Q₂', color: '#2262b8', get: h => h.bits[1] },
  { label: 'Q₃', color: '#8b3fb0', get: h => h.bits[2] }
];
function renderCounters() {
  for (const v of M.variants) {
    const button = $('variant-' + v.id);
    button.classList.toggle('selected', selected === v.id);
    button.setAttribute('aria-pressed', String(selected === v.id));
    button.querySelector('.reading').innerHTML = `<b>${binary(states[v.id])}</b><span>= ${M.decimal(states[v.id])}</span>`;
  }
  const v = M.variants.find(v => v.id === selected), bits = states[selected];
  $('step').textContent = 'Nächste Flanke ' + (clock ? '↓' : '↑');
  $('clock-pill').innerHTML = 'Takt <b>' + clock + '</b>';
  $('case-label').textContent = 'Aufgabe 3' + v.letter + ' · ' + (v.edge === 'rising' ? 'steigende' : 'fallende') + ' Flanke';
  $('circuit-title').innerHTML = v.title + ' mit ' + qHtml(v.inverted);
  $('value').innerHTML = `<span class="binary">${binary(bits)}</span><small>binär</small><span class="decimal">${M.decimal(bits)}</span><small>dezimal</small>`;
  $('schematic').innerHTML = circuit(v, bits);
  const edge = clock ? 'Steigende' : 'Fallende';
  $('event').textContent = stepNumber === 0 ? 'Start bei 000. Schalte die erste Taktflanke weiter.' : lastActive[selected] ? `${edge} Taktflanke: ${lastEvents[selected].length} Flipflop${lastEvents[selected].length === 1 ? '' : 's'} ${lastEvents[selected].length === 1 ? 'wechselt' : 'wechseln'} den Zustand. Neuer Zählerstand: ${M.decimal(bits)}.` : `${edge} Taktflanke: Für diese Schaltung nicht aktiv. Alle Ausgänge bleiben unverändert.`;
  $('chain').innerHTML = lastEvents[selected].map((e, i) => `<span>${i ? '→ ' : ''}FF${e.stage}: Q${e.stage} ${e.before} → ${e.after}</span>`).join('');
  const shown = $('compare').checked ? M.variants : [v];
  $('waves').innerHTML = shown.map(variant => ($('compare').checked ? `<h3 class="wave-title">${variant.title} · ${variant.edge === 'rising' ? '↑' : '↓'} · ${qHtml(variant.inverted)}</h3>` : '') + waveform(records[variant.id], counterRows, 'Signalverlauf ' + variant.title)).join('');
  $('sequence').innerHTML = sequences[selected].map(n => `<span>${n}</span>`).join('');
}
function recordReset() {
  const h = resetState.history;
  h.push({ clock: resetState.clock, r: resetState.r, value: resetState.value, n: h.length ? h[h.length - 1].n + 1 : 0 });
  if (h.length > 33) h.shift();
}
function resetDiagram() {
  const r = resetState, bits = bitsOf(r.value, 2);
  let s = '<svg class="circuit" viewBox="0 0 1060 210" role="img" aria-label="Synchron getakteter 2-Bit-Vorwärtszähler mit aktiv-high Reset">';
  s += '<rect class="box" x="300" y="22" width="430" height="160" rx="6"/>';
  s += txt(515, 61, '2-Bit-Vorwärtszähler', 'text-anchor="middle"');
  s += txt(515, 88, 'gemeinsame steigende Taktflanke', 'text-anchor="middle" class="small-label"');
  s += line('M 120 115 H 300', r.clock) + txt(120, 104, 'Takt = ' + r.clock);
  s += '<path d="M 300 105 L 315 115 L 300 125" stroke="#315777" stroke-width="2" fill="none"/>';
  s += line('M 120 155 H 300', r.r) + txt(120, 179, 'Reset R = ' + r.r);
  s += txt(325, 161, r.mode === 'sync' ? 'R synchron' : 'R asynchron');
  s += line('M 730 115 H 910', bits[1]) + txt(785, 102, 'Q₁ = ' + bits[1]);
  s += line('M 730 155 H 910', bits[0]) + txt(785, 181, 'Q₀ = ' + bits[0]);
  return s + '</svg>';
}
function renderReset(message) {
  $('reset-step').textContent = 'Nächste Flanke ' + (resetState.clock ? '↓' : '↑');
  $('reset-toggle').textContent = 'Reset R = ' + resetState.r;
  $('reset-toggle').setAttribute('aria-pressed', String(!!resetState.r));
  $('reset-pulse').disabled = !!resetState.r;
  $('reset-pulse').title = resetState.r ? 'Zuerst Reset R auf 0 stellen.' : 'R kurz ein- und ausschalten, ohne den Takt zu verändern.';
  $('reset-rule').textContent = resetState.mode === 'sync' ? 'R = 1 wird erst an der nächsten steigenden Taktflanke übernommen.' : 'R = 1 setzt den Zähler sofort auf 00 und hält ihn dort, unabhängig vom Takt.';
  $('reset-value').innerHTML = `<span class="binary">${resetState.value.toString(2).padStart(2, '0')}</span><small>binär</small><span class="decimal">${resetState.value}</span><small>dezimal</small>`;
  $('reset-diagram').innerHTML = resetDiagram();
  if (message) $('reset-event').textContent = message;
  $('reset-wave').innerHTML = waveform(resetState.history, [
    { label: 'Takt', color: '#223a53', get: h => h.clock },
    { label: 'R', color: '#c16a00', get: h => h.r },
    { label: 'Q₁', color: '#2262b8', get: h => (h.value >> 1) & 1 },
    { label: 'Q₀', color: '#007b65', get: h => h.value & 1 }
  ], 'Takt, Reset und Zählerausgänge. Spalten sind Bedienereignisse, keine festen Zeitintervalle.');
}
function initializeReset() {
  resetState.value = 0; resetState.clock = 0; resetState.r = 0; resetState.history = [];
  recordReset(); renderReset('Start bei 00 und R = 0. Zähle zunächst bis 2, dann probiere den Reset aus.');
}
function setPanel(panel) {
  stop();
  for (const name of ['counters', 'reset']) {
    $('tab-' + name).classList.toggle('selected', panel === name);
    $('tab-' + name).setAttribute('aria-pressed', String(panel === name));
  }
  $('counter-panel').hidden = panel !== 'counters'; $('reset-panel').hidden = panel !== 'reset';
}
$('variants').innerHTML = M.variants.map(v => `<button id="variant-${v.id}" class="variant" aria-pressed="false"><strong>${v.title}</strong><small>${v.edge === 'rising' ? '↑ Steigende' : '↓ Fallende'} Flanke · ${qHtml(v.inverted)}</small><div class="reading"></div></button>`).join('');
for (const v of M.variants) $('variant-' + v.id).addEventListener('click', () => { selected = v.id; renderCounters(); });
$('step').addEventListener('click', () => { stop(); advance(); });
$('play').addEventListener('click', () => {
  if (timer !== null) { stop(); return; }
  timer = setInterval(advance, Number($('speed').value));
  $('play').textContent = 'Ⅱ Pause'; $('play').setAttribute('aria-pressed', 'true');
});
$('speed').addEventListener('change', () => { if (timer !== null) { clearInterval(timer); timer = setInterval(advance, Number($('speed').value)); } });
$('restart').addEventListener('click', () => { stop(); initializeCounters(); renderCounters(); });
$('compare').addEventListener('change', renderCounters);
$('tab-counters').addEventListener('click', () => setPanel('counters'));
$('tab-reset').addEventListener('click', () => setPanel('reset'));
$('reset-step').addEventListener('click', () => {
  const before = resetState.clock; resetState.clock = 1 - before;
  resetState.value = M.resetCounter(resetState.value, before, resetState.clock, resetState.r, resetState.mode);
  recordReset();
  renderReset(resetState.r && resetState.mode === 'async' ? 'R = 1: Der asynchrone Reset hält den Zähler auf 00.' : resetState.clock ? resetState.r ? 'Steigende Flanke bei R = 1: Reset hat Vorrang. Der Zähler übernimmt 00.' : 'Steigende Flanke bei R = 0: Der Zähler zählt um eins weiter.' : 'Fallende Flanke: Der synchron getaktete Zähler behält seinen Zustand.');
});
$('reset-toggle').addEventListener('click', () => {
  resetState.r = 1 - resetState.r;
  resetState.value = M.resetCounter(resetState.value, resetState.clock, resetState.clock, resetState.r, resetState.mode);
  recordReset();
  renderReset(resetState.r ? resetState.mode === 'sync' ? 'R wurde 1. Noch keine steigende Taktflanke: Q bleibt unverändert.' : 'R wurde 1. Asynchroner Reset: Q wird sofort 00.' : 'R wurde 0. Der Zustand bleibt erhalten; an der nächsten steigenden Flanke wird weitergezählt.');
});
$('reset-pulse').addEventListener('click', () => {
  if (resetState.r) return;
  resetState.r = 1;
  resetState.value = M.resetCounter(resetState.value, resetState.clock, resetState.clock, 1, resetState.mode); recordReset();
  resetState.r = 0; recordReset();
  renderReset(resetState.mode === 'sync' ? 'Kurzer Impuls R: 0 → 1 → 0 zwischen den Flanken. Synchron: Der Zählerstand bleibt erhalten.' : 'Kurzer Impuls R: 0 → 1 → 0 zwischen den Flanken. Asynchron: Der Zähler wurde sofort auf 00 zurückgesetzt.');
});
document.querySelectorAll('input[name="reset-mode"]').forEach(input => input.addEventListener('change', () => { resetState.mode = input.value; initializeReset(); }));
$('reset-start').addEventListener('click', initializeReset);
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
initializeCounters(); renderCounters(); initializeReset();
