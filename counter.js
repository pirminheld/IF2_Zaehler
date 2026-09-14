/* Reine Zustandslogik. Q[0] = Q1 (LSB), Q[2] = Q3 (MSB). */
(function (root) {
  'use strict';
  const variants = [
    { id: 'b', edge: 'falling', inverted: false, direction: 1, title: 'Vorwärts', label: 'Fallende Flanke · Q', letter: 'b' },
    { id: 'a', edge: 'rising', inverted: false, direction: -1, title: 'Rückwärts', label: 'Steigende Flanke · Q', letter: 'a' },
    { id: 'd', edge: 'falling', inverted: true, direction: -1, title: 'Rückwärts', label: 'Fallende Flanke · Q̅', letter: 'd' },
    { id: 'c', edge: 'rising', inverted: true, direction: 1, title: 'Vorwärts', label: 'Steigende Flanke · Q̅', letter: 'c' }
  ];
  function active(before, after, edge) {
    return edge === 'rising' ? before === 0 && after === 1 : before === 1 && after === 0;
  }
  function ripple(bits, beforeClock, afterClock, variant) {
    const next = bits.slice(), events = [];
    let before = beforeClock, after = afterClock;
    for (let i = 0; i < 3; i++) {
      if (!active(before, after, variant.edge)) break;
      const old = next[i]; next[i] = 1 - old;
      events.push({ stage: i + 1, before: old, after: next[i] });
      before = variant.inverted ? 1 - old : old;
      after = variant.inverted ? 1 - next[i] : next[i];
    }
    return { bits: next, events };
  }
  function decimal(bits) { return bits.reduce((n, bit, i) => n + bit * 2 ** i, 0); }
  function resetCounter(value, beforeClock, afterClock, reset, mode) {
    if (mode === 'async' && reset) return 0;
    if (active(beforeClock, afterClock, 'rising')) return reset ? 0 : (value + 1) % 4;
    return value;
  }
  const api = { variants, active, ripple, decimal, resetCounter };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CounterModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
