/* Ausführen mit Node.js: node test.cjs. Für die Homepage nicht erforderlich. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const M = require('./counter.js');
let checks = 0;
function check(value, expected) { assert.deepEqual(value, expected); checks++; }
for (const variant of M.variants) {
  for (let value = 0; value < 8; value++) {
    const bits = [value & 1, (value >> 1) & 1, (value >> 2) & 1];
    for (const [before, after] of [[0, 1], [1, 0], [0, 0], [1, 1]]) {
      const active = M.active(before, after, variant.edge);
      const result = M.ripple(bits, before, after, variant);
      check(M.decimal(result.bits), active ? (value + variant.direction + 8) % 8 : value);
      check(M.decimal(bits), value); // Eingabe bleibt unverändert.
    }
  }
  let bits = [0, 0, 0], clock = 0, sequence = [0];
  for (let i = 0; i < 16; i++) {
    const next = 1 - clock;
    const result = M.ripple(bits, clock, next, variant);
    if (M.active(clock, next, variant.edge)) sequence.push(M.decimal(result.bits));
    bits = result.bits; clock = next;
  }
  check(sequence, variant.direction === 1 ? [0,1,2,3,4,5,6,7,0] : [0,7,6,5,4,3,2,1,0]);
}
for (const mode of ['sync','async']) for (let value = 0; value < 4; value++) {
  check(M.resetCounter(value,0,1,0,mode),(value+1)%4);
  check(M.resetCounter(value,1,0,0,mode),value);
  check(M.resetCounter(value,0,1,1,mode),0);
  check(M.resetCounter(value,0,0,1,mode),mode === 'async' ? 0 : value);
  check(M.resetCounter(value,1,0,1,mode),mode === 'async' ? 0 : value);
}
// Ereignisfolge der Oberfläche ohne Browser: echte Handler und Zeichenfunktionen.
class Element {
  constructor(id) { this.id=id; this.listeners={}; this.attrs={}; this.innerHTML=''; this.textContent=''; this.checked=false; this.value=''; this.hidden=false; this.classList={toggle(){}}; }
  addEventListener(name, fn) { this.listeners[name]=fn; }
  setAttribute(k,v) { this.attrs[k]=v; }
  querySelector() { return this.reading || (this.reading=new Element('reading')); }
  click() { if (!this.disabled) this.listeners.click?.(); }
}
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const elements=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element(m[1])]));
for (const v of M.variants) elements['variant-'+v.id]=new Element('variant-'+v.id);
elements.speed.value='800';
const radios=['sync','async'].map(value=>Object.assign(new Element(value),{value}));
const sandbox={CounterModel:M,document:{getElementById(id){assert.ok(elements[id],id);return elements[id];},querySelectorAll(){return radios;},addEventListener(){}},setInterval(){return 1;},clearInterval(){}};
vm.createContext(sandbox); vm.runInContext(fs.readFileSync(__dirname+'/app.js','utf8'),sandbox);
elements.step.click(); check(vm.runInContext('states.a.join("")',sandbox),'111');
check(vm.runInContext('states.b.join("")',sandbox),'000');
elements.step.click(); check(vm.runInContext('M.decimal(states.b)',sandbox),1);
elements['variant-d'].click(); check(elements['circuit-title'].innerHTML,'Rückwärts mit <span class="over">Q</span>');
assert.ok(elements.schematic.innerHTML.includes('text-decoration="overline"'));checks++;
elements.compare.checked=true;elements.compare.listeners.change();check((elements.waves.innerHTML.match(/class="wave"/g)||[]).length,4);
elements.restart.click();check(vm.runInContext('stepNumber',sandbox),0);
elements['tab-reset'].click();check(elements['counter-panel'].hidden,true);
elements['reset-step'].click();elements['reset-step'].click();elements['reset-step'].click();
check(vm.runInContext('resetState.value',sandbox),2);
elements['reset-pulse'].click();check(vm.runInContext('resetState.value',sandbox),2);
elements['reset-toggle'].click();check(vm.runInContext('resetState.value',sandbox),2);
elements['reset-step'].click();check(vm.runInContext('resetState.value',sandbox),2);
elements['reset-step'].click();check(vm.runInContext('resetState.value',sandbox),0);
radios[1].listeners.change();check(vm.runInContext('resetState.mode',sandbox),'async');
elements['reset-step'].click();check(vm.runInContext('resetState.value',sandbox),1);
elements['reset-pulse'].click();check(vm.runInContext('resetState.value',sandbox),0);
check(vm.runInContext('resetState.r',sandbox),0);
for(let i=0;i<100;i++)elements.step.click();
check(vm.runInContext('records.a.length',sandbox),33);
check(vm.runInContext('sequences.a.length',sandbox),17);
for (const name of ['schematic','waves','reset-wave','reset-diagram']) {
  assert.ok(!/NaN|undefined/.test(elements[name].innerHTML),name);checks++;
}
for (const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  if (!/^https?:/.test(m[1]) && m[1] !== 'QR_Code.svg') { assert.ok(fs.existsSync(__dirname+'/'+m[1]),m[1]);checks++; }
}
console.log(checks+' Prüfungen bestanden: Zählfolgen, Flanken, Reset, UI-Ereignisse, Diagramme und lokale Verweise.');
