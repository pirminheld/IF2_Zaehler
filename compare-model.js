/* Q1 = LSB. Modelle zu Aufgaben 6–8; keine Abhängigkeiten. */
(function (root) {
  'use strict';
  const bits = value => [value & 1, (value >> 1) & 1, (value >> 2) & 1];
  const binary = value => value.toString(2).padStart(3, '0');
  function transition(start, time, delay = 10) {
    if (!Number.isInteger(start) || start < 0 || start > 7 || time < 0 || delay <= 0) throw new RangeError('Ungültiger Zählzustand oder Zeitpunkt');
    let asynchronous = start, carry = true;
    const events = [];
    for (let i = 0; i < 3 && carry; i++) {
      const before = (start >> i) & 1;
      events.push({ stage: i + 1, time: (i + 1) * delay, before, after: 1 - before });
      if (time >= (i + 1) * delay) asynchronous ^= 1 << i;
      carry = before === 1;
    }
    const b = bits(start);
    return { asynchronous, synchronous: time >= delay ? (start + 1) % 8 : start,
      target: (start + 1) % 8, toggle: [1, b[0], b[0] & b[1]], events,
      asyncSettled: events.length * delay, syncSettled: delay };
  }
  function resetExperiment(state, action) {
    const next = { ...state };
    if (action === 'rise') {
      next.sync = next.reset ? 0 : (next.sync + 1) % 4;
      next.async = next.reset ? 0 : (next.async + 1) % 4;
    } else if (action === 'on') { next.reset = 1; next.async = 0; }
    else if (action === 'off') next.reset = 0;
    else if (action === 'pulse') { if (next.reset) return next; next.async = 0; }
    else throw new RangeError('Unbekanntes Ereignis');
    return next;
  }
  const api = { bits, binary, transition, resetExperiment };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ComparisonModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
