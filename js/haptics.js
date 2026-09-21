/* Vibration feedback. Android Chrome and Firefox support navigator.vibrate;
   iOS Safari never has, so on an iPhone every call here is a silent no-op and
   the toggle is hidden rather than offering something that does nothing. */
window.NIAH = window.NIAH || {};

NIAH.haptics = (function () {
  const supported = typeof navigator !== 'undefined' &&
    typeof navigator.vibrate === 'function';
  let on = true;
  let lastTick = 0;

  function buzz(pattern) {
    if (!on || !supported) return;
    try { navigator.vibrate(pattern); } catch (e) { /* blocked, never mind */ }
  }

  /* Digging fires every frame, so the tick is rate-limited — a continuous
     rattle reads as a fault rather than as feedback. */
  function tick(ms, gap) {
    const now = Date.now();
    if (now - lastTick < gap) return;
    lastTick = now;
    buzz(ms);
  }

  return {
    get supported() { return supported; },
    get on() { return on; },
    set on(v) { on = !!v; if (!on && supported) { try { navigator.vibrate(0); } catch (e) {} } },

    dig()    { tick(14, 150); },
    dump()   { buzz(28); },
    junk()   { buzz([0, 18, 40, 26]); },
    reveal() { buzz([0, 26, 55, 26, 55, 60]); },
    grab()   { buzz([0, 40, 60, 100]); },
    win()    { buzz([0, 60, 70, 40, 70, 140]); },
    buy()    { buzz(18); },
    nope()   { buzz([0, 34, 50, 34]); },
    ui()     { buzz(10); },
  };
})();
