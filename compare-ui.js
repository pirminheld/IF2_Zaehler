(function () {
  'use strict';
  const C = ComparisonModel, el = id => document.getElementById(id);
  let start = 3, time = 0, animation = null;
  let reset = { sync: 2, async: 2, reset: 0 }, resetRows = [];
  const two = v => v.toString(2).padStart(2, '0');
  const colors = ['#007b65', '#2262b8', '#8b3fb0'];
  function stopAnimation() {
    if (animation !== null) clearInterval(animation);
    animation = null;
    el('compare-play').textContent = '▶ Langsam abspielen';
    el('compare-play').setAttribute('aria-pressed', 'false');
  }
  function bitDisplay(value) {
    return [2, 1, 0].map(i => `<span class="bit-box ${(value >> i) & 1 ? 'on' : ''}"><small>Q${['₁','₂','₃'][i]}</small><b>${(value >> i) & 1}</b></span>`).join('');
  }
  function circuit(kind, data) {
    const value = kind === 'async' ? data.asynchronous : data.synchronous;
    const b = C.bits(value);
    let svg = `<svg class="compare-circuit" viewBox="0 0 560 175" role="img" aria-label="${kind === 'async' ? 'Asynchron: Taktweitergabe über Q1 und Q2' : 'Synchron: gemeinsamer Takt, T-Werte vor der Flanke'}">`;
    svg += '<text x="8" y="104">CLK ↓</text>';
    for (let i = 0; i < 3; i++) {
      const x = 90 + i * 157, active = time > 0 && (kind === 'async' ? data.events.some(e => e.stage === i + 1 && e.time === time) : time === 10 && data.toggle[i]);
      svg += `<rect class="ff ${active ? 'active' : ''}" x="${x}" y="48" width="91" height="76" rx="5"/><text x="${x+32}" y="37">FF${i+1}</text>`;
      svg += `<text x="${x+9}" y="72">T = ${kind === 'async' ? 1 : data.toggle[i]}</text><text x="${x+52}" y="90">Q${['₁','₂','₃'][i]}=${b[i]}</text>`;
      svg += `<path d="M ${x} 93 L ${x+9} 102 L ${x} 111"/><circle cx="${x-4}" cy="102" r="4" fill="white" stroke="#536b82" stroke-width="1.5"/>`;
      svg += `<path class="${b[i] ? 'on' : ''}" d="M ${x+91} 86 H ${x+110}"/>`;
      if (kind === 'async') {
        if (i === 0) svg += `<path d="M 63 102 H ${x-8}"/>`;
        if (i < 2) svg += `<path class="${b[i] ? 'on' : ''}" d="M ${x+110} 86 H ${x+125} V 102 H ${x+149}"/>`;
      } else {
        svg += `<path d="M ${x-18} 148 V 102 H ${x-8}"/><circle cx="${x-18}" cy="148" r="3" fill="#718398"/>`;
      }
    }
    if (kind === 'sync') svg += '<path d="M 62 104 V 148 H 386"/><text class="caption" x="90" y="170">T vor der Flanke: 1 · Q₁ · Q₁ ∧ Q₂</text>';
    else svg += '<text class="caption" x="90" y="163">Jede Stufe wartet auf die fallende Flanke ihres Takts.</text>';
    return svg + '</svg>';
  }
  function waves(kind) {
    const left=75, scale=12, x=t=>left+(t+5)*scale;
    let s='<svg class="comparison-wave" viewBox="0 0 605 185" role="img" aria-label="Ausgangssignale mit Zeitachse in Nanosekunden">';
    for (const t of [0,10,20,30]) s+=`<line x1="${x(t)}" x2="${x(t)}" y1="10" y2="150" stroke="#dbe3ee"/><text x="${x(t)}" y="175" text-anchor="middle">${t} ns</text>`;
    for(let i=0;i<3;i++) {
      const y=28+i*45, level=t=>{const data=C.transition(start,Math.max(0,t));const value=t<0?start:kind==='async'?data.asynchronous:data.synchronous;return y+((value>>i)&1?0:22);};
      let d=`M ${x(-5)} ${level(-5)}`;
      for(const t of [0,10,20,30,35])d+=` H ${x(t)} V ${level(t)}`;
      s+=`<text x="16" y="${y+14}">Q${['₁','₂','₃'][i]}</text><text x="54" y="${y+3}">1</text><text x="54" y="${y+25}">0</text><path d="${d}" stroke="${colors[i]}"/>`;
    }
    s+=`<line x1="${x(time)}" x2="${x(time)}" y1="8" y2="151" stroke="#be7700" stroke-width="2" stroke-dasharray="5 3"/>`;
    return s+'</svg>';
  }
  function renderComparison() {
    const data=C.transition(start,time);
    el('compare-time').textContent=`t = ${time} ns`;
    el('compare-range').value=String(time);
    el('compare-start').value=String(start);
    el('compare-step').disabled=time===30;
    el('compare-next').disabled=time!==30;
    for(const t of [0,10,20,30])el('time-'+t).setAttribute('aria-pressed',String(t===time));
    for(const kind of ['async','sync']) {
      const value=kind==='async'?data.asynchronous:data.synchronous;
      el(kind+'-bits').innerHTML=bitDisplay(value);
      el(kind+'-decimal').textContent=`${value} dezimal · Ziel: ${C.binary(data.target)} (${data.target})`;
      el(kind+'-circuit').innerHTML=circuit(kind,data);
      el(kind+'-waves').innerHTML=waves(kind);
    }
    el('async-status').textContent=time===0?'Die externe Taktflanke ist erfolgt. Noch kein Ausgang hat reagiert.':
      data.events.filter(e=>e.time===time).map(e=>`FF${e.stage}: Q${e.stage} wechselt von ${e.before} auf ${e.after}.`).join(' ') || 'Keine weitere Stufe schaltet zu diesem Zeitpunkt.';
    el('sync-status').textContent=time===0?'Alle Flipflops erhalten dieselbe externe Taktflanke. Die Ausgänge reagieren nach 10 ns.':
      time===10?`Gleichzeitig schalten: ${data.toggle.map((v,i)=>v?'FF'+(i+1):null).filter(Boolean).join(', ')}. Der Zielzustand ist erreicht.`:'Der Zielzustand bleibt erhalten; keine weitere Stufe wartet auf einen Vorgängerausgang.';
    el('compare-summary').textContent=`Start ${C.binary(start)} → Ziel ${C.binary(data.target)}. Im Modell stabil: asynchron nach ${data.asyncSettled} ns, synchron nach 10 ns. Orange markiert den gewählten Zeitpunkt; die Signalverläufe zeigen den gesamten Übergang.`;
    el('transition-rows').innerHTML=[0,10,20,30].map(t=>{const d=C.transition(start,t);return `<tr><th scope="row">${t} ns, danach</th><td>${C.binary(d.asynchronous)}</td><td>${C.binary(d.synchronous)}</td></tr>`;}).join('');
  }
  function recordReset(label) {
    resetRows.push({label,...reset});if(resetRows.length>8)resetRows.shift();
  }
  function renderResetComparison(message) {
    el('parallel-sync').textContent=two(reset.sync)+' = '+reset.sync;
    el('parallel-async').textContent=two(reset.async)+' = '+reset.async;
    el('parallel-toggle').textContent='Reset R = '+reset.reset;
    el('parallel-toggle').setAttribute('aria-pressed',String(!!reset.reset));
    el('parallel-pulse').disabled=!!reset.reset;
    el('parallel-status').textContent=message;
    el('parallel-rows').innerHTML=resetRows.map(r=>`<tr><td>${r.label}</td><td>${r.reset}</td><td>${two(r.sync)}</td><td>${two(r.async)}</td></tr>`).join('');
  }
  el('compare-start').addEventListener('change',()=>{stopAnimation();start=Number(el('compare-start').value);time=0;renderComparison();});
  el('compare-step').addEventListener('click',()=>{stopAnimation();time=Math.min(30,time+10);renderComparison();});
  el('compare-next').addEventListener('click',()=>{stopAnimation();start=(start+1)%8;time=0;renderComparison();});
  el('compare-restart').addEventListener('click',()=>{stopAnimation();start=3;time=0;renderComparison();});
  el('compare-range').addEventListener('input',()=>{stopAnimation();time=Number(el('compare-range').value);renderComparison();});
  for(const t of [0,10,20,30])el('time-'+t).addEventListener('click',()=>{stopAnimation();time=t;renderComparison();});
  el('compare-play').addEventListener('click',()=>{
    if(animation!==null){stopAnimation();return;}
    if(time===30)time=0;
    renderComparison();el('compare-play').textContent='Ⅱ Pause';el('compare-play').setAttribute('aria-pressed','true');
    animation=setInterval(()=>{time=Math.min(30,time+10);renderComparison();if(time===30)stopAnimation();},1000);
  });
  el('parallel-edge').addEventListener('click',()=>{reset=C.resetExperiment(reset,'rise');recordReset('Steigende Taktflanke');renderResetComparison(reset.reset?'R = 1: Beide Zähler bleiben auf 00.':'R = 0: Beide Zähler zählen an der steigenden Flanke weiter.');});
  el('parallel-toggle').addEventListener('click',()=>{reset=C.resetExperiment(reset,reset.reset?'off':'on');recordReset(reset.reset?'R wird 1 (zwischen Flanken)':'R wird 0 (zwischen Flanken)');renderResetComparison(reset.reset?'Nur der asynchrone Reset wirkt jetzt. Der synchrone Reset wartet auf die nächste aktive Taktflanke.':'Reset freigegeben. Ohne neue aktive Taktflanke ändert sich kein Zählerstand.');});
  el('parallel-pulse').addEventListener('click',()=>{
    if(reset.reset)return;
    reset=C.resetExperiment(reset,'on');recordReset('Impuls beginnt: R wird 1');
    reset=C.resetExperiment(reset,'off');recordReset('Impuls endet: R wird 0');
    renderResetComparison('Der Impuls liegt vollständig zwischen zwei aktiven Taktflanken: synchron unverändert, asynchron auf 00 zurückgesetzt.');
  });
  el('parallel-restart').addEventListener('click',()=>{reset={sync:2,async:2,reset:0};resetRows=[];recordReset('Start');renderResetComparison('Beide Zähler stehen auf 10 (2). Vergleichen Sie einen kurzen Resetimpuls.');});
  el('quiz-check').addEventListener('click',()=>{
    const a=el('quiz-clock').value,b=el('quiz-reset').value;
    el('quiz-feedback').textContent=!a||!b?'Bitte beantworten Sie beide Fragen.':a==='common'&&b==='yes'?'Richtig: Zähleraufbau und Resetart sind zwei getrennte Eigenschaften.':
      a!=='common'?'Prüfen Sie die Taktleitungen: Beim synchronen Aufbau erhalten alle Flipflops denselben externen Takt.':'Ein gemeinsamer Zählertakt schließt eine taktunabhängige Rücksetzung nicht aus.';
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAnimation();});
  window.addEventListener('hashchange',stopAnimation);
  for(const id of ['tab-counters','tab-reset'])el(id).addEventListener('click',stopAnimation);
  recordReset('Start');renderComparison();renderResetComparison('Beide Zähler stehen auf 10 (2). Vergleichen Sie einen kurzen Resetimpuls.');
})();
