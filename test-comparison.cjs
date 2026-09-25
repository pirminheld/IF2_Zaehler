const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const C = require('./compare-model.js');
let checks = 0;
const check = (a,b) => { assert.deepEqual(a,b); checks++; };
// Unabhängige Erwartungstabellen für Übertrag, Überlauf und einzelne Stufen.
for(const [start,trace] of [[3,[3,2,0,4]],[7,[7,6,4,0]],[1,[1,0,2,2]],[0,[0,1,1,1]],[5,[5,4,6,6]]]) {
  check([0,10,20,30].map(t=>C.transition(start,t).asynchronous),trace);
  check([0,10,20,30].map(t=>C.transition(start,t).synchronous),[start,(start+1)%8,(start+1)%8,(start+1)%8]);
}
check(C.transition(3,9).asynchronous,3);check(C.transition(3,19).asynchronous,2);
check(C.transition(3,29).asynchronous,0);check(C.transition(3,30).asynchronous,4);
check(C.transition(3,0).toggle,[1,1,1]);check(C.transition(4,0).toggle,[1,0,0]);
for(let start=0;start<8;start++) {
  const d=C.transition(start,30);
  check(d.asynchronous,(start+1)%8);check(d.synchronous,(start+1)%8);
  check(C.transition(start,d.asyncSettled).asynchronous,d.target);
}
for(let value=0;value<4;value++) {
  const state={sync:value,async:value,reset:0};
  check(C.resetExperiment(state,'pulse'),{sync:value,async:0,reset:0});
  check(C.resetExperiment(state,'on'),{sync:value,async:0,reset:1});
  check(C.resetExperiment(state,'rise'),{sync:(value+1)%4,async:(value+1)%4,reset:0});
  check(C.resetExperiment(C.resetExperiment(state,'on'),'rise'),{sync:0,async:0,reset:1});
  check(state,{sync:value,async:value,reset:0});
}
// Tatsächliche Ereignisbehandlung ohne Browser ausführen.
class Element {
  constructor(id){this.id=id;this.listeners={};this.attrs={};this.innerHTML='';this.textContent='';this.value='';this.hidden=false;this.disabled=false;this.classList={toggle(){}};}
  addEventListener(name,fn){(this.listeners[name]??=[]).push(fn);}
  setAttribute(k,v){this.attrs[k]=v;}
  querySelector(){return this.reading??=new Element('reading');}
  fire(name){if(this.disabled)return;for(const fn of this.listeners[name]??[])fn();}
}
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);check(new Set(ids).size,ids.length);
const elements=Object.fromEntries(ids.map(id=>[id,new Element(id)]));
for(const id of ['a','b','c','d'])elements['variant-'+id]=new Element(id);
const radios=['sync','async'].map(value=>Object.assign(new Element(value),{value}));
elements.speed.value='800';
const windowEvents={},docEvents={};let tick=null;
const context={ComparisonModel:C,CounterModel:require('./counter.js'),
 document:{getElementById(id){assert.ok(elements[id],id);return elements[id];},querySelectorAll(){return radios;},addEventListener(k,fn){(docEvents[k]??=[]).push(fn);}},
 window:{location:{hash:'#vergleich'},addEventListener(k,fn){(windowEvents[k]??=[]).push(fn);}},
 setInterval(fn){tick=fn;return 1;},clearInterval(){tick=null;}};
vm.createContext(context);
for(const file of ['app.js','compare-ui.js'])vm.runInContext(fs.readFileSync(__dirname+'/'+file,'utf8'),context);
check(elements['comparison-panel'].hidden,false);check(elements['counter-panel'].hidden,true);
check(elements['compare-time'].textContent,'t = 0 ns');
elements['compare-step'].fire('click');check(elements['async-decimal'].textContent,'2 dezimal · Ziel: 100 (4)');
check(elements['sync-decimal'].textContent,'4 dezimal · Ziel: 100 (4)');
elements['compare-step'].fire('click');check(elements['async-decimal'].textContent,'0 dezimal · Ziel: 100 (4)');
elements['compare-step'].fire('click');check(elements['async-decimal'].textContent,'4 dezimal · Ziel: 100 (4)');
check(elements['compare-step'].disabled,true);check(elements['compare-next'].disabled,false);
elements['compare-next'].fire('click');check(elements['compare-start'].value,'4');check(elements['compare-time'].textContent,'t = 0 ns');
elements['compare-start'].value='7';elements['compare-start'].fire('change');
elements['compare-play'].fire('click');for(let i=0;i<3;i++)tick();check(tick,null);
check(elements['async-decimal'].textContent,'0 dezimal · Ziel: 000 (0)');
elements['compare-range'].value='10';elements['compare-range'].fire('input');check(elements['async-decimal'].textContent,'6 dezimal · Ziel: 000 (0)');
elements['compare-play'].fire('click');elements['tab-reset'].fire('click');check(tick,null);check(elements['comparison-panel'].hidden,true);
elements['tab-comparison'].fire('click');check(elements['comparison-panel'].hidden,false);
elements['parallel-pulse'].fire('click');check(elements['parallel-sync'].textContent,'10 = 2');check(elements['parallel-async'].textContent,'00 = 0');
elements['parallel-edge'].fire('click');check(elements['parallel-sync'].textContent,'11 = 3');check(elements['parallel-async'].textContent,'01 = 1');
elements['parallel-toggle'].fire('click');check(elements['parallel-pulse'].disabled,true);
elements['parallel-edge'].fire('click');check(elements['parallel-sync'].textContent,'00 = 0');
elements['parallel-restart'].fire('click');check(elements['parallel-sync'].textContent,'10 = 2');check(elements['parallel-pulse'].disabled,false);
elements['quiz-check'].fire('click');check(elements['quiz-feedback'].textContent,'Bitte beantworten Sie beide Fragen.');
elements['quiz-clock'].value='common';elements['quiz-reset'].value='yes';elements['quiz-check'].fire('click');
assert.match(elements['quiz-feedback'].textContent,/Richtig/);checks++;
for(const id of ['async-circuit','sync-circuit','async-waves','sync-waves','transition-rows','parallel-rows']){assert.ok(!/NaN|undefined/.test(elements[id].innerHTML),id);checks++;}
for(const path of [...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(m=>m[1]))if(!/^https?:/.test(path)){assert.ok(fs.existsSync(__dirname+'/'+path),path);checks++;}
console.log(checks+' Prüfungen bestanden: Laufzeiten, Überlauf, T-Logik, Resetvergleich, Bedienung und Links.');
