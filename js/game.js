/* Needle in a Haystack — game state, barn flow, digging, economy, main loop. */
window.NIAH = window.NIAH || {};

NIAH.data = {
  SHOVELS: [
    { name: 'Bare Hands',     emoji: '🤲', cap: 10,   dig: 5,   price: 0,      unlock: 1,  desc: 'Splintery, but free.' },
    { name: 'Garden Trowel',  emoji: '🥄', cap: 24,   dig: 11,  price: 120,    unlock: 1,  desc: 'Borrowed from the flower bed.' },
    { name: 'Rusty Pitchfork',emoji: '🍴', cap: 55,   dig: 22,  price: 900,    unlock: 2,  desc: 'Tetanus sold separately.' },
    { name: 'Wooden Shovel',  emoji: '🪵', cap: 120,  dig: 42,  price: 5.5e3,  unlock: 3,  desc: 'Honest farm tooling.' },
    { name: 'Steel Spade',    emoji: '⚒️', cap: 260,  dig: 80,  price: 34e3,   unlock: 4,  desc: 'Cuts hay like butter.' },
    { name: "Farmer's Scoop", emoji: '🪣', cap: 580,  dig: 150, price: 2.1e5,  unlock: 5,  desc: 'Grain-grade capacity.' },
    { name: 'Bale Fork',      emoji: '🔱', cap: 1300, dig: 290, price: 1.3e6,  unlock: 7,  desc: 'Moves a bale per swing.' },
    { name: 'Hay Loader',     emoji: '🚜', cap: 3000, dig: 600, price: 9e6,    unlock: 9,  desc: 'Barely legal indoors.' },
  ],
  GEAR: {
    boots: { name: 'Work Boots',   emoji: '🥾', max: 5,  base: 250,  growth: 3,
             desc: (l) => l ? `+${l * 14}% walking speed` : 'Walk faster between pile and cart' },
    sense: { name: 'Needle Sense', emoji: '📡', max: 3,  base: 1500, growth: 10,
             desc: (l) => [
               'Reads how far off the needle is. Take readings from two spots and the rings cross',
               'Lv 1: warm / hot / burning, from where you stand',
               'Lv 2: the distance, to the nearest five metres',
               'Lv 3: the distance, to the metre',
             ][l] },
    sift:  { name: 'Sifting Screen', emoji: '🕸️', max: 10, base: 600, growth: 2.8,
             desc: (l) => l ? `×1.25 coins per hay (now ×${Math.pow(1.25, l).toFixed(2)})` : 'Sifted hay pays more' },
    hands: { name: 'Farmhand',     emoji: '👨‍🌾', max: 4,  base: 4000, growth: 3.2,
             desc: (l) => l ? `${l} working the barn with you` : 'Hire a hand who digs and carries while you do' },
  },
};

/* Odds and ends buried in the piles. `value` is in hay-equivalents, so a find
   is worth the same relative to the barn you are in. Metal pieces are what the
   detector actually hears — which is the point of them. */
NIAH.data.JUNK = [
  { id: 'can',   name: 'Tin Can',      emoji: '🥫', shape: 'can',   metal: true,  value: 10,  weight: 24,
    line: 'Somebody had lunch in here.' },
  { id: 'boot',  name: 'Old Boot',     emoji: '🥾', shape: 'boot',  metal: false, value: 18,  weight: 18,
    line: 'Just the one, of course.' },
  { id: 'key',   name: 'Rusty Key',    emoji: '🗝️', shape: 'key',   metal: true,  value: 35,  weight: 20,
    line: 'Fits nothing on this farm.' },
  { id: 'shoe',  name: 'Horseshoe',    emoji: '🧲', shape: 'shoe',  metal: true,  value: 80,  weight: 20,
    line: 'Lucky. Less so for the horse.' },
  { id: 'watch', name: 'Pocket Watch', emoji: '⌚', shape: 'watch', metal: true,  value: 240, weight: 12,
    line: 'Stopped at ten past four.' },
  { id: 'ring',  name: 'Wedding Ring', emoji: '💍', shape: 'ring',  metal: true,  value: 600, weight: 6,
    line: 'Someone has been looking for this.' },
];

NIAH.game = (function () {
  const D = NIAH.data;
  const SAVE_KEY = 'niah.save.v2';
  const LETTERS = 'ABCDEFGHIJKL';
  const RETIRE_AT = 8;            // earliest barn you are allowed to retire from
  const OFFLINE_CAP = 4 * 3600;   // the crew work at most four hours unattended
  const OFFLINE_MIN = 120;        // under two minutes away is not worth a card

  /* The Daily Barn is the same barn and the same kit for everybody, so the
     only variable is how fast you find it. Barn 6 is ten piles; a Steel Spade
     clears the needle's pile in one load, and the Lv 2 detector gives you
     distance to the nearest five metres — enough to triangulate, not enough
     to be told the answer, especially with scrap metal in the hay. */
  const DAILY = { level: 6, shovel: 4, gear: { boots: 2, sense: 2, sift: 0, hands: 0 } };
  const T = THREE;

  /* ---------------------------------------------------------- state */

  const state = {
    coins: 0,
    shovel: 0,
    owned: [0],
    gear: { boots: 0, sense: 0, sift: 0, hands: 0 },
    level: 1,
    lv: null,
    needles: 0,
    totalHay: 0,
    totalLoads: 0,
    junkFound: 0,
    shelf: {},                 // junk id -> { n, first } : the Barn Shelf
    shelfDone: false,
    prestige: { rosettes: 0, retires: 0, best: 0 },
    daily: { day: '', bestMs: 0, lastWon: '', streak: 0, bestStreak: 0, wins: 0 },
    haptics: true,
    lastSeen: Date.now(),
    started: Date.now(),
    camera: 'follow',
    muted: false,
    look: { outfit: 'farmhand', hat: 'straw', face: 'plain', shovel: 'auto' },
    wardrobe: { outfit: ['farmhand'], hat: ['straw'], face: ['plain'], shovel: ['auto'] },
  };

  let phase = 'boot';            // boot | menu | intro | play | paused | win
  const input = { x: 0, y: 0 };
  let held = false, lastTime = 0, elapsed = 0;
  let digSfx = 0, saveTimer = 0, handBank = 0, senseTimer = 0, actionLock = 0, stickActive = false;
  let wardrobeReturn = null;
  /* While a Daily Barn is being played the campaign's own level, kit and coins
     are held here and swapped back on the way out — so the daily never spends
     or earns anything on the farm, and a save written mid-daily is the
     campaign's, not the daily's. */
  let dailySnap = null;
  let dailyRun = null;
  const intro = { t: 0, done: false };
  const keys = Object.create(null);
  const tmpV = new T.Vector3();

  /* ----------------------------------------------------------- rng */

  /* The campaign rolls its barns off Math.random. The Daily Barn needs every
     player to get the identical barn, so it rolls off a seeded generator
     instead — same date, same seed, same piles, needle and scrap. */
  function hashSeed(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  /* Local date, so the barn turns over at the player's own midnight. */
  function dayKey(d) {
    const t = d || new Date();
    return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0')
      + '-' + String(t.getDate()).padStart(2, '0');
  }
  function shiftDay(key, days) {
    const [y, m, d] = key.split('-').map(Number);
    return dayKey(new Date(y, m - 1, d + days));
  }

  /* ------------------------------------------------------- economy */

  const shovel = () => D.SHOVELS[state.shovel];
  const rosettes = () => (state.prestige && state.prestige.rosettes) || 0;

  /* A rosette is worth three things, because coins alone would not carry a
     restarted farm: the shovels are gated by barn, not by price, so a coin
     bonus on its own leaves you re-digging barns 1-8 bare-handed. */
  const prestigeMult = () => 1 + 0.1 * rosettes();          // coins
  const prestigeGrunt = () => 1 + 0.05 * rosettes();        // dig rate and load
  const prestigeSkip = () => Math.floor(rosettes() / 8);    // barns off every unlock

  const capacity = () => Math.round(shovel().cap * prestigeGrunt());
  const digRate = () => shovel().dig * prestigeGrunt();
  const moveSpeed = () => 6 * (1 + state.gear.boots * 0.14);
  const unlockAt = (sh) => Math.max(1, sh.unlock - prestigeSkip());
  const coinsPerHay = () => Math.pow(1.25, state.gear.sift) * Math.pow(1.85, state.level - 1) * prestigeMult();
  const pileCount = (lvl) => Math.min(4 + Math.floor((lvl - 1) * 1.2), 12);
  const pileHay = (lvl) => Math.round(55 * Math.pow(1.5, lvl - 1));
  const gearPrice = (k) => Math.floor(D.GEAR[k].base * Math.pow(D.GEAR[k].growth, state.gear[k]));

  function affordable() {
    const next = D.SHOVELS.findIndex((s, i) => !state.owned.includes(i) && unlockAt(s) <= state.level);
    if (next >= 0 && state.coins >= D.SHOVELS[next].price) return true;
    return Object.keys(D.GEAR).some((k) => state.gear[k] < D.GEAR[k].max && state.coins >= gearPrice(k));
  }

  /* ---------------------------------------------------- persistence */

  function persistable() {
    return dailySnap ? Object.assign({}, state, dailySnap) : state;
  }
  function save() {
    state.lastSeen = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(persistable())); } catch (e) { /* private mode */ }
  }
  function readSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function applySave(data) {
    Object.assign(state, data);
    state.gear = Object.assign({ boots: 0, sense: 0, sift: 0, hands: 0 }, data.gear || {});
    // saves from before My Farmer arrive without a wardrobe
    state.look = Object.assign({ outfit: 'farmhand', hat: 'straw', face: 'plain', shovel: 'auto' }, data.look || {});
    state.wardrobe = Object.assign({ outfit: ['farmhand'], hat: ['straw'], face: ['plain'], shovel: ['auto'] }, data.wardrobe || {});
    ['outfit', 'hat', 'face', 'shovel'].forEach((kind) => {
      if (!Array.isArray(state.wardrobe[kind]) || !state.wardrobe[kind].length) {
        state.wardrobe[kind] = [NIAH.cosmetics.listFor(kind)[0].id];
      }
      if (!state.wardrobe[kind].includes(state.look[kind])) state.look[kind] = state.wardrobe[kind][0];
    });
    if (state.lv && !state.lv.needle) {
      const legacy = state.lv;
      const total = (legacy.piles[0] && legacy.piles[0].total) || 1;
      state.lv.needle = {
        pile: legacy.needlePile || 0,
        depth: Math.max(0.3, Math.min(0.9, (legacy.needleDepth || total * 0.6) / total)),
        ox: (Math.random() - 0.5) * 3.4,
        oz: (Math.random() - 0.5) * 3.4,
        revealed: false,
      };
    }
    // saves from before the Barn Shelf counted odds and ends as one number
    state.shelf = (data.shelf && typeof data.shelf === 'object') ? data.shelf : {};
    state.junkFound = data.junkFound || 0;
    state.shelfDone = !!data.shelfDone;
    state.prestige = Object.assign({ rosettes: 0, retires: 0, best: 0 }, data.prestige || {});
    state.daily = Object.assign({ day: '', bestMs: 0, lastWon: '', streak: 0, bestStreak: 0, wins: 0 }, data.daily || {});
    state.haptics = data.haptics !== false;
    NIAH.haptics.on = state.haptics;
    if (!Array.isArray(state.owned) || !state.owned.length) state.owned = [0];
    state.shovel = Math.max(0, Math.min(D.SHOVELS.length - 1, state.shovel | 0));
    NIAH.audio.muted = !!state.muted;
  }
  function wipeSave() {
    if (!confirm('Erase your save and start the farm over?')) return;
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
    location.reload();
  }

  /* --------------------------------------------------- level set-up */

  function rollJunkType(rnd) {
    const table = NIAH.data.JUNK;
    const total = table.reduce((a, j) => a + j.weight, 0);
    let roll = rnd() * total;
    for (const j of table) { roll -= j.weight; if (roll <= 0) return j.id; }
    return table[0].id;
  }

  function makeJunk(count, rnd) {
    rnd = rnd || Math.random;
    const out = [];
    let id = 0;
    for (let pile = 0; pile < count; pile++) {
      // most piles hide one thing, some two, some nothing at all
      const n = rnd() < 0.18 ? 0 : rnd() < 0.75 ? 1 : 2;
      for (let k = 0; k < n; k++) {
        out.push({
          id: id++,
          type: rollJunkType(rnd),
          pile,
          depth: 0.12 + rnd() * 0.8,
          ox: (rnd() - 0.5) * 3.6,
          oz: (rnd() - 0.5) * 3.6,
          out: false,        // dug up and lying on the floor
          taken: false,
        });
      }
    }
    return out;
  }

  function makeLevel(level, rnd) {
    rnd = rnd || Math.random;
    const count = pileCount(level);
    const hay = pileHay(level);
    const piles = [];
    for (let i = 0; i < count; i++) piles.push({ name: LETTERS[i], total: hay, hay: hay, sifted: 0 });
    return {
      junk: makeJunk(count, rnd),
      junkFound: 0,
      level,
      piles,
      // the needle has a place inside its pile: how far down, and whereabouts
      needle: {
        pile: Math.floor(rnd() * count),
        depth: 0.3 + rnd() * 0.6,                // fraction of the pile dug before it shows
        ox: (rnd() - 0.5) * 3.4,
        oz: (rnd() - 0.5) * 3.4,
        revealed: false,
      },
      load: [],
      loadTotal: 0,
      startedAt: Date.now(),
      sifted: 0,
      opened: 0,
    };
  }

  function buildWorldForLevel() {
    const lv = state.lv;
    NIAH.world.buildLevel({ level: lv.level, piles: lv.piles });
    lv.piles.forEach((p, i) => NIAH.world.setPileVisual(NIAH.world.piles[i], p.hay / p.total));
    NIAH.world.setCartFill(0);
    NIAH.world.hideNeedle();
    if (lv.needle.revealed) NIAH.world.showNeedle(lv.needle.pile, lv.needle.ox, lv.needle.oz);
    NIAH.world.clearAllJunk();
    if (!lv.junk) { lv.junk = makeJunk(lv.piles.length); lv.junkFound = lv.junkFound || 0; }
    lv.junk.forEach((j) => { if (j.out && !j.taken) dropJunk(j, true); });
    NIAH.helpers.sync(state.gear.hands);
    NIAH.helpers.reset();
    NIAH.player.applyLook(state.look, state.shovel);
    NIAH.player.setLoadVisual(lv.loadTotal / capacity());   // a resumed save can arrive mid-load
  }

  /* ------------------------------------------------------ level flow */

  function startLevel(withIntro) {
    buildWorldForLevel();
    const L = NIAH.world.layout;
    NIAH.ui.setIntro(state.lv.level, state.lv.piles.length + ' piles · one needle');
    if (withIntro) {
      phase = 'intro';
      intro.t = 0;
      intro.done = false;
      NIAH.player.place(0, L.doorZ + 16, Math.PI);
      NIAH.player.camYaw = Math.PI;
      NIAH.helpers.setVisible(false);
      NIAH.world.setDoorOpen(0);
      NIAH.ui.screen('intro', true);
      NIAH.ui.hudOn(false);
      NIAH.audio.door();
    } else {
      finishIntro();
    }
    save();
  }

  function finishIntro() {
    const L = NIAH.world.layout;
    if (NIAH.player.position.z > L.cartZ + 5.5) {
      NIAH.player.place(0, L.cartZ + 5, Math.PI);
      NIAH.player.camYaw = Math.PI;
    }
    NIAH.world.setDoorOpen(1);
    NIAH.ui.screen('intro', false);
    NIAH.ui.hudOn(true);
    NIAH.player.updateCamera(NIAH.world.camera, 1, state.camera, true, NIAH.world.bounds);
    NIAH.helpers.setVisible(true);
    phase = 'play';
    intro.done = true;
    dailyClock(true);
  }

  function updateIntro(dt) {
    intro.t += dt;
    const t = intro.t;
    NIAH.world.setDoorOpen(Math.min(1, t / 1.7));

    const L = NIAH.world.layout;
    const walking = t > 0.8 && NIAH.player.position.z > L.cartZ + 5;
    NIAH.player.camYaw = Math.PI;
    NIAH.player.update(dt, walking ? { x: 0, y: 1 } : { x: 0, y: 0 }, NIAH.world, { speed: 3.4 });

    // camera keyframes: a wide approach shot easing into the follow position
    const cam = NIAH.world.camera;
    const p = NIAH.player.position;
    const s1 = smooth(t, 0, 3.2);
    const s2 = smooth(t, 3.2, 6.4);
    const wide = cam.aspect < 0.8 ? 1.4 : cam.aspect < 1.2 ? 1.15 : 1;   // portrait needs more room
    const from = tmpV.set(17 * wide, 8 * wide, L.doorZ + 30 * wide);
    const mid = new T.Vector3(6.5 * wide, 3.6 + wide, L.doorZ + 12 * wide);
    const to = new T.Vector3(p.x, 7.8, p.z + 12.5);
    const a = from.clone().lerp(mid, s1);
    const b = a.clone().lerp(to, s2);
    cam.position.copy(b);
    cam.lookAt(p.x, 1.6, p.z - 2);

    if (!walking && t > 1.2) finishIntro();
    if (t > 12) finishIntro();
  }

  function smooth(t, a, b) {
    const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
    return x * x * (3 - 2 * x);
  }

  function skipIntro() { if (phase === 'intro') finishIntro(); }

  /* -------------------------------------------------------- digging */

  function nearestPile() {
    const p = NIAH.player.position;
    let best = null, bestD = Infinity;
    NIAH.world.piles.forEach((mesh, i) => {
      const data = state.lv.piles[i];
      if (data.hay <= 0) return;
      const d = Math.hypot(p.x - mesh.x, p.z - mesh.z);
      const reach = 1.3 + 1.9 * mesh.cone.scale.x + 2.2;
      if (d < reach && d < bestD) { bestD = d; best = i; }
    });
    return best;
  }

  function nearCart() {
    const c = NIAH.world.cart;
    if (!c) return false;
    const p = NIAH.player.position;
    return Math.hypot(p.x - c.x, p.z - c.z) < 5.4;
  }

  function addLoad(pileIndex, amount) {
    const lv = state.lv;
    const entry = lv.load.find((e) => e.pile === pileIndex);
    if (entry) entry.amount += amount;
    else lv.load.push({ pile: pileIndex, amount });
    lv.loadTotal += amount;
  }

  /* Enough hay off the top and the needle is lying there in what is left. */
  function checkReveal(pileIndex) {
    const lv = state.lv;
    const n = lv.needle;
    if (!n || n.revealed || pileIndex !== n.pile) return;
    const data = lv.piles[pileIndex];
    const dugFraction = 1 - data.hay / data.total;
    if (dugFraction < n.depth) return;
    n.revealed = true;
    NIAH.world.showNeedle(n.pile, n.ox, n.oz);
    NIAH.audio.ping();
    NIAH.audio.coin();
    NIAH.haptics.reveal();
    NIAH.ui.setSense('✨ Something glinted in pile ' + data.name);
    save();
  }

  function junkType(j) { return NIAH.cosmetics.byId(NIAH.data.JUNK, j.type); }

  function dropJunk(j, silent) {
    const mesh = NIAH.world.piles[j.pile];
    const radial = Math.hypot(j.ox, j.oz);
    const y = NIAH.world.pileSurfaceAt(j.pile, radial);
    NIAH.world.popJunk(j.id, junkType(j).shape, mesh.x + j.ox, y, mesh.z + j.oz, j.pile);
    if (!silent) NIAH.audio.ping();
  }

  function checkJunk(pileIndex) {
    const lv = state.lv;
    if (!lv.junk) return;
    const data = lv.piles[pileIndex];
    const dug = 1 - data.hay / data.total;
    lv.junk.forEach((j) => {
      if (j.out || j.taken || j.pile !== pileIndex || dug < j.depth) return;
      const before = nearestMetal();          // with this piece still buried
      j.out = true;
      const after = nearestMetal();           // without it
      dropJunk(j);
      const t = junkType(j);
      // if pulling it out made the reading jump, it was what the detector heard
      const wasLoudest = state.gear.sense > 0 && t.metal && before !== null &&
        (after === null || after > before + 0.5);
      NIAH.ui.toast(t.emoji + ' ' + t.name + (wasLoudest ? ' — so that is what the detector heard' : ''));
    });
  }

  function collectJunk() {
    const lv = state.lv;
    if (!lv.junk) return;
    const p = NIAH.player.position;
    NIAH.world.junkPieces().slice().forEach((piece) => {
      const j = lv.junk.find((x) => x.id === piece.id);
      if (!j || j.taken) return;
      const d = Math.hypot(p.x - piece.mesh.position.x, p.z - piece.mesh.position.z);
      if (d > 3.0) return;
      j.taken = true;
      const t = junkType(j);
      const daily = dailyActive();
      const coins = daily ? 0 : Math.max(1, Math.floor(t.value * coinsPerHay()));
      let firstEver = false;
      if (!daily) {
        state.coins += coins;
        state.junkFound = (state.junkFound || 0) + 1;
        lv.junkFound = (lv.junkFound || 0) + 1;
        firstEver = shelfAdd(t.id);
      }
      const pos = NIAH.world.clearJunkMesh(j.id);
      if (pos) NIAH.world.hayBurst(pos.x, pos.y + 0.4, pos.z, 5);
      NIAH.audio.coin();
      NIAH.haptics.junk();
      if (!daily) NIAH.ui.bumpCoins();
      NIAH.ui.toast(daily
        ? t.emoji + ' ' + t.name + '  ·  not the needle'
        : t.emoji + ' ' + t.name + '  +' + NIAH.ui.fmt(coins)
          + (firstEver ? '  ·  new on the shelf!' : '  ·  ' + t.line));
      if (!daily) checkShelfComplete();
      save();
    });
  }

  /* --------------------------------------------------------- shelf */

  /* One row per kind of thing you can dig out: how many you have turned up,
     and the barn the first one came out of. */
  function shelfAdd(id) {
    if (!state.shelf) state.shelf = {};
    const rec = state.shelf[id] || (state.shelf[id] = { n: 0, first: 0 });
    const firstEver = rec.n === 0;
    rec.n++;
    if (!rec.first) rec.first = state.level;
    return firstEver;
  }

  function shelfCount() {
    return NIAH.data.JUNK.filter((j) => (state.shelf[j.id] || {}).n > 0).length;
  }

  function shelfComplete() { return shelfCount() >= NIAH.data.JUNK.length; }

  function checkShelfComplete() {
    if (state.shelfDone || !shelfComplete()) return;
    state.shelfDone = true;
    const bonus = Math.max(2000, Math.floor(1200 * coinsPerHay()));
    state.coins += bonus;
    NIAH.audio.fanfare();
    NIAH.ui.bumpCoins();
    NIAH.ui.toast('🗄️ Barn Shelf complete — 🪙 ' + NIAH.ui.fmt(bonus) + ' and the Tin Can Hat is yours');
  }

  /* --------------------------------------------------- daily barn */

  const dailyActive = () => !!dailySnap;

  /* Wall clock, not frame time: update()'s dt is clamped at 80ms, so a phone
     dropping frames would otherwise clock a barn faster than it really took.
     The clock stops whenever the run is not actually in your hands. */
  function dailyElapsed() {
    if (!dailyRun) return 0;
    return dailyRun.accum + (dailyRun.running ? performance.now() - dailyRun.since : 0);
  }
  function dailyClock(running) {
    if (!dailyRun || dailyRun.finished || dailyRun.running === running) return;
    if (running) dailyRun.since = performance.now();
    else dailyRun.accum += performance.now() - dailyRun.since;
    dailyRun.running = running;
  }

  function dailyToday() {
    const d = state.daily || (state.daily = { day: '', bestMs: 0, lastWon: '', streak: 0, bestStreak: 0, wins: 0 });
    const key = dayKey();
    if (d.day !== key) { d.day = key; d.bestMs = 0; }   // yesterday's time is not today's
    // a missed day breaks the run
    if (d.lastWon && d.lastWon !== key && d.lastWon !== shiftDay(key, -1)) d.streak = 0;
    return d;
  }

  function dailyInfo() {
    const d = dailyToday();
    return {
      day: d.day,
      bestMs: d.bestMs,
      doneToday: d.lastWon === d.day,
      streak: d.streak,
      bestStreak: d.bestStreak,
      wins: d.wins,
      level: DAILY.level,
      piles: pileCount(DAILY.level),
      shovel: D.SHOVELS[DAILY.shovel].name,
    };
  }

  function startDaily() {
    if (dailyActive()) return;
    const d = dailyToday();
    dailySnap = {
      level: state.level, shovel: state.shovel, owned: state.owned,
      gear: state.gear, lv: state.lv, coins: state.coins,
    };
    state.level = DAILY.level;
    state.shovel = DAILY.shovel;
    state.owned = [DAILY.shovel];
    state.gear = Object.assign({}, DAILY.gear);
    state.lv = makeLevel(DAILY.level, mulberry32(hashSeed('niah-daily-' + d.day)));
    dailyRun = { accum: 0, since: 0, running: false, finished: false };
    NIAH.helpers.sync(0);
    NIAH.ui.screen('menu', false);
    NIAH.ui.closeShop();
    NIAH.ui.setDailyMode(true);
    startLevel(true);
  }

  /* Leaving without the needle records nothing. */
  function endDaily() {
    if (!dailyActive()) return;
    Object.assign(state, dailySnap);
    dailySnap = null;
    dailyRun = null;
    NIAH.ui.setDailyMode(false);
    NIAH.helpers.sync(state.gear.hands);
    NIAH.player.applyLook(state.look, state.shovel);
    save();
  }

  function dailyWin() {
    const d = dailyToday();
    const ms = Math.round(dailyElapsed());
    const first = d.lastWon !== d.day;
    const improved = !d.bestMs || ms < d.bestMs;
    if (improved) d.bestMs = ms;
    if (first) {
      d.streak = d.lastWon === shiftDay(d.day, -1) ? d.streak + 1 : 1;
      d.bestStreak = Math.max(d.bestStreak || 0, d.streak);
      d.wins = (d.wins || 0) + 1;
      d.lastWon = d.day;
    }
    /* The bounty rides on the farm you actually have, so it stays worth
       collecting however far along you are — and only the first run counts. */
    const campaignLevel = dailySnap ? dailySnap.level : state.level;
    const bounty = first
      ? Math.max(500, Math.floor(pileHay(campaignLevel) * Math.pow(1.25, dailySnap.gear.sift)
          * Math.pow(1.85, campaignLevel - 1) * prestigeMult() * 0.75))
      : 0;
    if (bounty) dailySnap.coins += bounty;
    dailyRun.finished = true;
    save();
    return { ms, best: d.bestMs, improved, first, bounty, streak: d.streak, bestStreak: d.bestStreak };
  }

  /* ------------------------------------------------------- prestige */

  const retireGain = () => Math.max(0, state.level - 1);
  const canRetire = () => state.level >= RETIRE_AT;

  /* Hand the farm on: the barns, the coins, the shovels and the gear all go;
     the wardrobe and the shelf stay. One rosette per needle found, and they
     pay out for good in coins, dig rate and earlier shovel unlocks. */
  function retire() {
    if (!canRetire()) { NIAH.audio.nope(); NIAH.haptics.nope(); return; }
    const gain = retireGain();
    state.prestige.rosettes += gain;
    state.prestige.retires++;
    state.prestige.best = Math.max(state.prestige.best || 0, state.level);
    state.coins = 0;
    state.shovel = 0;
    state.owned = [0];
    state.gear = { boots: 0, sense: 0, sift: 0, hands: 0 };
    state.level = 1;
    state.lv = makeLevel(1);
    NIAH.helpers.sync(0);
    NIAH.ui.screen('retire', false);
    NIAH.ui.screen('pause', false);
    NIAH.ui.screen('win', false);
    NIAH.ui.screen('menu', false);
    NIAH.ui.closeShop();
    NIAH.audio.fanfare();
    save();
    startLevel(true);
  }

  function openRetire() {
    NIAH.ui.showRetire({
      can: canRetire(),
      at: RETIRE_AT,
      level: state.level,
      gain: retireGain(),
      rosettes: rosettes(),
      mult: prestigeMult(),
      nextMult: 1 + 0.1 * (rosettes() + retireGain()),
      grunt: prestigeGrunt(),
      nextGrunt: 1 + 0.05 * (rosettes() + retireGain()),
      skip: prestigeSkip(),
      nextSkip: Math.floor((rosettes() + retireGain()) / 8),
      retires: state.prestige.retires,
    });
  }

  /* ------------------------------------------------ offline farmhands */

  let offlinePot = 0;

  /* Farmhands keep working the yard while the game is shut — they never touch
     your piles, so the barn is exactly as you left it.

     The yield is measured in barns, not in seconds times dig rate: at a late
     shovel that second figure runs to a hundred barns of coins for one night
     away, which would undo the whole economy. One hand bales 8% of the barn
     you are on per hour, it stops at one barn's worth, and after four hours
     they go home. */
  function offlineEarnings(saved) {
    if (!saved || !saved.lastSeen) return null;
    const hands = (saved.gear && saved.gear.hands) || 0;
    if (hands <= 0) return null;
    const secs = Math.min(Math.max(0, (Date.now() - saved.lastSeen) / 1000), OFFLINE_CAP);
    if (secs < OFFLINE_MIN) return null;
    const barnHay = pileHay(state.level) * pileCount(state.level);
    const hay = Math.min(barnHay * 0.08 * hands * (secs / 3600), barnHay);
    const coins = Math.floor(hay * coinsPerHay());
    if (coins < 1) return null;
    return {
      secs: Math.round(secs), coins, hands,
      barns: hay / barnHay,
      capped: secs >= OFFLINE_CAP - 1 || hay >= barnHay - 0.001,
    };
  }

  function claimOffline() {
    if (offlinePot <= 0) return;
    state.coins += offlinePot;
    offlinePot = 0;
    NIAH.audio.coin();
    NIAH.ui.bumpCoins();
    NIAH.ui.clearOffline();
    save();
  }

  function needleInReach() {
    const lv = state.lv;
    if (!lv || !lv.needle.revealed) return false;
    const pos = NIAH.world.needlePosition();
    if (!pos) return false;
    const p = NIAH.player.position;
    return Math.hypot(p.x - pos.x, p.z - pos.z) < 3.6;
  }

  function grabNeedle() {
    if (!needleInReach()) return false;
    winLevel();
    return true;
  }

  function dig(dt, pileIndex) {
    const lv = state.lv;
    const data = lv.piles[pileIndex];
    const room = capacity() - lv.loadTotal;
    const amount = Math.min(digRate() * dt, room, data.hay);
    if (amount <= 0) return false;
    data.hay -= amount;
    addLoad(pileIndex, amount);
    NIAH.world.setPileVisual(NIAH.world.piles[pileIndex], data.hay / data.total);
    checkReveal(pileIndex);
    checkJunk(pileIndex);
    NIAH.player.setLoadVisual(lv.loadTotal / capacity());
    NIAH.player.setAction('dig');

    digSfx -= dt;
    if (digSfx <= 0) {
      digSfx = 0.26;
      NIAH.audio.dig();
      NIAH.haptics.dig();
      const m = NIAH.world.piles[pileIndex];
      NIAH.world.hayBurst(m.x, 2 + Math.random(), m.z, 3);
    }
    return true;
  }

  function dump() {
    const lv = state.lv;
    if (lv.loadTotal <= 0) { NIAH.audio.nope(); NIAH.haptics.nope(); return; }
    const c = NIAH.world.cart;
    let gained = 0;

    for (const entry of lv.load) {
      const data = lv.piles[entry.pile];
      const before = data.sifted;
      data.sifted = Math.min(data.total, data.sifted + entry.amount);
      if (before === 0 && data.sifted > 0) lv.opened++;
      gained += entry.amount * coinsPerHay();
      lv.sifted += entry.amount;
      state.totalHay += entry.amount;
    }

    if (!dailyActive()) state.coins += Math.max(1, Math.floor(gained));
    state.totalLoads++;
    lv.load = [];
    lv.loadTotal = 0;

    NIAH.player.setAction('dump');
    actionLock = 0.5;
    NIAH.player.setLoadVisual(0);
    NIAH.world.setCartFill(Math.min(1, NIAH.world.cart.fill + 0.25));
    NIAH.world.sifterLoad(4);
    NIAH.world.hayBurst(c.x, NIAH.world.cart.beltTop + 1.4, c.z, 14);
    NIAH.audio.dump();
    NIAH.audio.coin();
    NIAH.haptics.dump();
    NIAH.ui.bumpCoins();

    save();
  }

  /* ---------------------------------------------------------- hands */

  const helperApi = {
    ratePerHelper: () => digRate() * 0.12,
    piles: () => state.lv.piles,
    takeFromPile(i, amount) {
      const data = state.lv.piles[i];
      if (!data) return 0;
      const got = Math.min(amount, data.hay);
      if (got <= 0) return 0;
      data.hay -= got;
      NIAH.world.setPileVisual(NIAH.world.piles[i], data.hay / data.total);
      checkReveal(i);
      checkJunk(i);
      return got;
    },
    deliver(i, amount) {
      const lv = state.lv;
      const data = lv.piles[i];
      if (!data || amount <= 0) return;
      const before = data.sifted;
      data.sifted = Math.min(data.total, data.sifted + amount);
      if (before === 0 && data.sifted > 0) lv.opened++;
      lv.sifted += amount;
      state.totalHay += amount;
      if (!dailyActive()) state.coins += Math.max(1, Math.floor(amount * coinsPerHay()));
      NIAH.world.sifterLoad(2);
    },
  };

  function farmhands(dt) {
    if (phase !== 'play') return;
    NIAH.helpers.sync(state.gear.hands);
    NIAH.helpers.update(dt, helperApi);
  }

  /* ----------------------------------------------------------- sense */

  /* Distance to the closest buried metal: the needle, or any metal scrap
     still in a pile. Null once there is nothing left to hear. */
  function nearestMetal() {
    const lv = state.lv;
    const p = NIAH.player.position;
    let best = null;
    if (!lv.needle.revealed) {
      const m = NIAH.world.piles[lv.needle.pile];
      best = Math.hypot(p.x - (m.x + lv.needle.ox), p.z - (m.z + lv.needle.oz));
    }
    (lv.junk || []).forEach((j) => {
      if (j.out || j.taken) return;
      const t = NIAH.cosmetics.byId(NIAH.data.JUNK, j.type);
      if (!t.metal) return;
      const m = NIAH.world.piles[j.pile];
      const d = Math.hypot(p.x - (m.x + j.ox), p.z - (m.z + j.oz));
      if (best === null || d < best) best = d;
    });
    return best;
  }

  function updateSense(dt) {
    if (phase !== 'play') return;
    senseTimer -= dt;
    if (senseTimer > 0) return;
    senseTimer = 0.2;

    const lv = state.lv;
    const n = lv.needle;

    if (n.revealed) {
      NIAH.ui.setSense(needleInReach()
        ? '✨ The needle — grab it!'
        : '✨ The needle is lying in pile ' + lv.piles[n.pile].name);
      return;
    }

    const sense = state.gear.sense;
    if (!sense) { NIAH.ui.setSense(''); return; }

    /* A reading off your own position, never a name. One reading narrows it
       to a ring; walk somewhere else and take another and the rings cross.
       It hears the nearest *metal*, though, and there is scrap buried out
       there too — so a reading can turn out to be a horseshoe. Digging the
       scrap out is how you clear the noise. */
    const d = nearestMetal();
    if (d === null) { NIAH.ui.setSense('📡 nothing metal left in range'); return; }

    if (sense >= 3) {
      NIAH.ui.setSense('📡 ' + d.toFixed(1) + ' m to the nearest metal');
    } else if (sense >= 2) {
      const paces = Math.max(5, Math.round(d / 5) * 5);
      NIAH.ui.setSense('📡 about ' + paces + ' m away');
    } else {
      const band = d < 6 ? 'BURNING' : d < 12 ? 'hot' : d < 20 ? 'warm' : d < 32 ? 'cool' : 'stone cold';
      NIAH.ui.setSense('📡 ' + band);
    }
  }

  /* ------------------------------------------------------- win / flow */

  /* --------------------------------------------------------- finale */

  /* Forty-odd seconds of searching used to end with a card sliding in. Now the
     farmer holds the thing up, the barn goes quiet and slow for a beat, and
     the card waits its turn. Tapping skips straight to it. */
  const finale = { t: 0, burst: 0, data: null, ax: 0, az: 1 };

  function finaleScale(t) {
    if (t < 0.45) return 1 - 0.72 * (t / 0.45);          // drop into slow motion
    if (t < 1.65) return 0.28;                            // hold there
    return 0.28 + 0.72 * Math.min(1, (t - 1.65) / 0.75);  // and back up to speed
  }

  function winLevel() {
    if (phase === 'finale' || phase === 'win') return;
    const lv = state.lv;
    const pos = NIAH.world.needlePosition();

    if (dailyActive()) {
      dailyClock(false);
      finale.data = { daily: dailyWin() };
    } else {
      state.needles++;
      const bonus = Math.max(50, Math.floor(pileHay(state.level) * coinsPerHay() * 0.6));
      state.coins += bonus;
      const secs = Math.round((Date.now() - lv.startedAt) / 1000);
      finale.data = {
        text: `You pulled it out of pile ${lv.piles[lv.needle.pile].name}, `
          + `${Math.round(lv.needle.depth * 100)}% of the way down. Barn ${lv.level} is done.`,
        rows: [
          ['Needle bounty', '🪙 ' + NIAH.ui.fmt(bonus)],
          ['Hay sifted here', NIAH.ui.fmt(lv.sifted)],
          ['Piles opened', lv.opened + ' of ' + lv.piles.length],
          ['Odds and ends', (lv.junkFound || 0) + ' dug up'],
          ['Time in the barn', secs < 60 ? secs + 's' : Math.floor(secs / 60) + 'm ' + (secs % 60) + 's'],
          ['Barn Shelf', shelfCount() + ' of ' + NIAH.data.JUNK.length + ' kinds'],
          ['Next barn pays', '×1.85 coins'],
        ],
      };
      save();
    }

    phase = 'finale';
    finale.t = 0;
    finale.burst = 0;

    /* You grab the needle standing against the pile you just dug, so a camera
       swung round to your face would be looking through six metres of hay.
       Turn away from the pile first and shoot over the open floor instead. */
    const p = NIAH.player.position;
    let ax = pos ? p.x - pos.x : 0;
    let az = pos ? p.z - pos.z : 1;
    const len = Math.hypot(ax, az);
    if (len < 0.2) { ax = 0; az = 1; }
    else { ax /= len; az /= len; }
    finale.ax = ax;
    finale.az = az;
    NIAH.player.faceTowards(p.x + ax, p.z + az);
    if (pos) NIAH.world.hayBurst(pos.x, pos.y + 1, pos.z, 20);
    NIAH.world.hideNeedle();
    NIAH.player.setAction('hold');
    NIAH.player.holdNeedle(true);
    NIAH.ui.hudOn(false);
    NIAH.ui.setPrompt('');
    NIAH.ui.setSense('');
    NIAH.audio.ping();
    NIAH.haptics.grab();

    // someone who has asked for less motion does not want a swooping camera
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      NIAH.audio.fanfare();
      NIAH.haptics.win();
      endFinale();
    }
  }

  function updateFinale(dt) {
    finale.t += dt;
    const t = finale.t;
    const p = NIAH.player.position;
    const cam = NIAH.world.camera;

    // keep the pose animating while everything else is held still
    NIAH.player.update(dt, null, NIAH.world, { locked: true });

    /* In front of the farmer, pushing in on the raised hand and drifting a
       little to one side, then easing back out as normal speed returns. */
    const base = Math.atan2(finale.ax, finale.az);
    const ang = base + (smooth(t, 0, 2.7) - 0.5) * 0.8;
    const r = 6.2 - smooth(t, 0.15, 1.5) * 2.9 + smooth(t, 1.75, 2.75) * 1.0;
    // just under eye level, so the shot looks up at the face and the raised
    // hand rather than down onto the brim of the hat
    const h = 2.55 - smooth(t, 0.15, 1.6) * 0.3;
    cam.position.set(p.x + Math.sin(ang) * r, h, p.z + Math.cos(ang) * r);
    cam.lookAt(p.x, 2.4 + smooth(t, 0.3, 1.6) * 0.5, p.z);

    if (t > 0.85 && finale.burst === 0) {
      finale.burst = 1;
      NIAH.audio.fanfare();
      NIAH.haptics.win();
      NIAH.world.hayBurst(p.x, 3.4, p.z, 28);
    }
    if (t > 1.25 && finale.burst === 1) {
      finale.burst = 2;
      NIAH.world.hayBurst(p.x, 4.2, p.z, 22);
    }
    if (t > 2.75) endFinale();
  }

  function endFinale() {
    if (phase !== 'finale') return;
    phase = 'win';
    NIAH.player.holdNeedle(false);
    NIAH.player.setAction('idle');
    if (finale.data && finale.data.daily) NIAH.ui.showDailyResult(finale.data.daily, dailyInfo());
    else NIAH.ui.showWin(finale.data);
  }

  function nextBarn() {
    state.level++;
    state.lv = makeLevel(state.level);
    NIAH.ui.screen('win', false);
    NIAH.ui.closeShop();
    startLevel(true);
  }

  function startNewGame() {
    state.level = 1;
    state.lv = makeLevel(1);
    NIAH.ui.screen('menu', false);
    startLevel(true);
  }

  function continueGame() {
    if (!state.lv) state.lv = makeLevel(state.level);
    NIAH.ui.screen('menu', false);
    startLevel(true);
  }

  function quitToMenu() {
    endDaily();
    save();
    NIAH.ui.screen('dailyCard', false);
    NIAH.helpers.setVisible(false);
    phase = 'menu';
    NIAH.ui.screen('pause', false);
    NIAH.ui.closeShop();
    NIAH.ui.hudOn(false);
    NIAH.ui.setMenu(readSave());
    NIAH.ui.setOffline(null);
    NIAH.ui.screen('menu', true);
  }

  function pause(on) {
    if (on && phase === 'play') { phase = 'paused'; dailyClock(false); NIAH.ui.screen('pause', true); save(); }
    else if (!on && phase === 'paused') { phase = 'play'; dailyClock(true); NIAH.ui.screen('pause', false); NIAH.ui.closeShop(); }
  }

  /* -------------------------------------------------------- shopping */

  function buyShovel(i) {
    const sh = D.SHOVELS[i];
    if (state.owned.includes(i)) {
      state.shovel = i;
      NIAH.player.applyLook(state.look, i);
      if (state.lv && state.lv.loadTotal > capacity()) trimLoad();
      NIAH.audio.buy();
      NIAH.haptics.buy();
    } else {
      if (state.level < unlockAt(sh) || state.coins < sh.price) { NIAH.audio.nope(); NIAH.haptics.nope(); return; }
      state.coins -= sh.price;
      state.owned.push(i);
      state.shovel = i;
      NIAH.player.applyLook(state.look, i);
      NIAH.audio.buy();
      NIAH.haptics.buy();
    }
    save();
    NIAH.ui.renderShop(true);
  }

  function trimLoad() {
    const lv = state.lv;
    let over = lv.loadTotal - capacity();
    while (over > 0 && lv.load.length) {
      const last = lv.load[lv.load.length - 1];
      const cut = Math.min(over, last.amount);
      last.amount -= cut;
      lv.loadTotal -= cut;
      over -= cut;
      if (last.amount <= 0.001) lv.load.pop();
    }
    NIAH.player.setLoadVisual(lv.loadTotal / capacity());
  }

  function buyGear(key) {
    const g = D.GEAR[key];
    if (state.gear[key] >= g.max) { NIAH.audio.nope(); NIAH.haptics.nope(); return; }
    const price = gearPrice(key);
    if (state.coins < price) { NIAH.audio.nope(); NIAH.haptics.nope(); return; }
    state.coins -= price;
    state.gear[key]++;
    NIAH.audio.buy();
    NIAH.haptics.buy();
    if (key === 'hands' && state.lv) {
      NIAH.helpers.sync(state.gear.hands);
      NIAH.helpers.setVisible(phase === 'play' || phase === 'paused');
    }
    save();
    NIAH.ui.renderShop(true);
  }

  /* --------------------------------------------------------- My Farmer */

  function ownsCosmetic(kind, id) {
    return (state.wardrobe[kind] || []).includes(id);
  }

  /* Most kit unlocks by barn; a couple of pieces are rewards instead —
     `need: 'shelf'` for a full Barn Shelf, `need: <n>` for n retirements. */
  function cosmeticLocked(kind, id) {
    const item = NIAH.cosmetics.byId(NIAH.cosmetics.listFor(kind), id);
    if (item.need === 'shelf') return !state.shelfDone;
    if (typeof item.need === 'number') return (state.prestige.retires || 0) < item.need;
    return !!item.unlock && state.level < item.unlock;
  }

  /* What the locked chip says, and what the footer says when you tap it. */
  function cosmeticGate(kind, id) {
    const item = NIAH.cosmetics.byId(NIAH.cosmetics.listFor(kind), id);
    if (item.need === 'shelf') {
      return { tag: 'Shelf', why: 'Fill the Barn Shelf — every odd and end, once — to unlock ' + item.name + '.' };
    }
    if (typeof item.need === 'number') {
      const n = item.need;
      return { tag: n === 1 ? 'Retire' : 'Retire ×' + n,
               why: 'Retire the farm ' + (n === 1 ? 'once' : n + ' times') + ' to unlock ' + item.name + '.' };
    }
    return { tag: 'Barn ' + item.unlock, why: 'Clear barn ' + item.unlock + ' to unlock ' + item.name + '.' };
  }

  function buyCosmetic(kind, id) {
    const item = NIAH.cosmetics.byId(NIAH.cosmetics.listFor(kind), id);
    if (!ownsCosmetic(kind, id)) {
      if (cosmeticLocked(kind, id) || state.coins < item.price) { NIAH.audio.nope(); NIAH.haptics.nope(); return; }
      state.coins -= item.price;
      state.wardrobe[kind].push(id);
    }
    state.look[kind] = id;
    NIAH.player.applyLook(state.look, state.shovel);
    NIAH.wardrobe.preview(state.look, state.shovel);
    if (state.lv) NIAH.player.setLoadVisual(state.lv.loadTotal / capacity());
    NIAH.audio.buy();
    NIAH.haptics.buy();
    save();
    NIAH.ui.renderWardrobe(true);
  }

  function openWardrobe() {
    if (phase === 'wardrobe') return;
    wardrobeReturn = phase;
    phase = 'wardrobe';
    NIAH.wardrobe.open(state.look, state.shovel);
    NIAH.ui.closeShop();
    NIAH.ui.screen('menu', false);
    NIAH.ui.screen('pause', false);
    NIAH.ui.screen('win', false);
    NIAH.ui.screen('shelf', false);
    NIAH.ui.screen('retire', false);
    NIAH.ui.hudOn(false);
    NIAH.ui.screen('wardrobe', true);
    NIAH.ui.syncOutfitCat();
    NIAH.ui.renderWardrobe(true);
    NIAH.audio.ui();
  }

  function closeWardrobe() {
    NIAH.ui.screen('wardrobe', false);
    const back = wardrobeReturn || 'menu';
    wardrobeReturn = null;
    if (back === 'menu') {
      phase = 'menu';
      NIAH.ui.setMenu(readSave());
      NIAH.ui.screen('menu', true);
    } else if (back === 'win') {
      phase = 'win';
      NIAH.ui.screen('win', true);
    } else {
      phase = 'paused';
      NIAH.ui.screen('pause', true);
    }
    save();
  }

  function toggleHaptics() {
    state.haptics = !state.haptics;
    NIAH.haptics.on = state.haptics;
    if (state.haptics) NIAH.haptics.ui();
    NIAH.ui.setHapticsLabel(state.haptics);
    save();
  }

  function toggleSound() {
    NIAH.audio.muted = !NIAH.audio.muted;
    state.muted = NIAH.audio.muted;
    NIAH.audio.wake();
    NIAH.ui.setMenu(readSave());
    save();
  }

  function toggleCamera() {
    state.camera = state.camera === 'follow' ? 'first' : 'follow';
    NIAH.ui.setCameraLabel(state.camera);
    save();
  }

  /* ------------------------------------------------------------ loop */

  function update(dt) {
    if (phase === 'intro') { updateIntro(dt); return; }
    if (phase === 'finale') { updateFinale(dt); return; }
    if (phase !== 'play') {
      if (phase === 'menu') updateMenuCamera(dt);
      if (phase === 'wardrobe') NIAH.wardrobe.update(dt);
      return;
    }

    const lv = state.lv;
    const pileIndex = nearestPile();
    const atCart = nearCart();
    let digging = false;

    if (dailyRun) NIAH.ui.setDailyTimer(dailyElapsed());

    actionLock = Math.max(0, actionLock - dt);
    if (held && pileIndex !== null && lv.loadTotal < capacity()) {
      digging = dig(dt, pileIndex);
    }
    if (!digging && actionLock <= 0) {
      NIAH.player.setAction(NIAH.player.speed > 0.4 ? 'walk' : 'idle');
    }

    // keyboard drives the same input vector the stick does
    if (!stickActive) {
      const k = readKeys();
      input.x = k.x; input.y = k.y;
    }

    NIAH.player.update(dt, input, NIAH.world, { speed: moveSpeed() });
    NIAH.player.updateCamera(NIAH.world.camera, dt, state.camera, false, NIAH.world.bounds);

    farmhands(dt);
    collectJunk();
    updateSense(dt);

    // contextual prompt + action button label
    let label = 'Dig', enabled = false, prompt = '';
    if (needleInReach()) {
      label = 'Grab'; enabled = true;
      prompt = 'The needle! Grab it';
    } else if (atCart && lv.loadTotal > 0) {
      label = 'Sift'; enabled = true;
      prompt = 'Tip ' + NIAH.ui.fmt(lv.loadTotal) + ' hay onto the belt';
    } else if (pileIndex !== null) {
      if (lv.loadTotal >= capacity()) { label = 'Full'; prompt = 'Shovel full — carry it to the sifter'; }
      else { label = 'Dig'; enabled = true; prompt = 'Hold to dig pile ' + lv.piles[pileIndex].name; }
    } else if (lv.loadTotal >= capacity()) {
      prompt = 'Shovel full — carry it to the sifter';
    }
    NIAH.ui.setAction(label, enabled);
    NIAH.ui.setPrompt(prompt);
    NIAH.ui.setPileCard(pileIndex !== null ? lv.piles[pileIndex] : null);
    NIAH.ui.setHud({
      coins: state.coins, level: state.level, shovelName: shovel().name,
      load: lv.loadTotal, capacity: capacity(), affordable: affordable(),
    });

    saveTimer += dt;
    if (saveTimer > 10) { saveTimer = 0; save(); }
  }

  function updateMenuCamera(dt) {
    const cam = NIAH.world.camera;
    const L = NIAH.world.layout;
    if (!L) return;
    elapsed += dt;
    const a = Math.sin(elapsed * 0.06) * 0.9;
    const r = 34;
    cam.position.set(Math.sin(a) * r, 9 + Math.sin(elapsed * 0.1) * 1.5, L.doorZ + 8 + Math.cos(a) * r);
    cam.lookAt(0, 5.5, L.doorZ - 4);
  }

  function frame(now) {
    // Keep the loop alive whatever happens in a frame: this used to sit after
    // update(), so a single thrown error stopped the game for good.
    requestAnimationFrame(frame);
    const dt = Math.min((now - lastTime) / 1000, 0.08);
    lastTime = now;
    elapsed += dt;
    try {
      update(dt);
      if (phase === 'wardrobe') {
        NIAH.wardrobe.render();
      } else {
        NIAH.world.update(phase === 'finale' ? dt * finaleScale(finale.t) : dt, elapsed);
        NIAH.world.render();
      }
    } catch (err) {
      if (!frame.warned) { frame.warned = true; console.error('frame error', err); }
    }
  }

  /* ----------------------------------------------------------- input */

  function readKeys() {
    let x = 0, y = 0;
    if (keys['KeyW'] || keys['ArrowUp']) y += 1;
    if (keys['KeyS'] || keys['ArrowDown']) y -= 1;
    if (keys['KeyA'] || keys['ArrowLeft']) x -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) x += 1;
    const m = Math.hypot(x, y);
    if (m > 1) { x /= m; y /= m; }
    return { x, y };
  }

  function actionPress() {
    NIAH.audio.wake();
    held = true;
    if (phase === 'intro') { skipIntro(); return; }
    if (phase === 'finale') { endFinale(); return; }
    if (phase !== 'play') return;
    if (grabNeedle()) return;
    if (nearCart() && state.lv.loadTotal > 0) dump();
  }
  function actionRelease() {
    held = false;
    if (phase === 'play') NIAH.player.setAction('idle');
  }

  function bindInput(canvas) {
    document.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      keys[e.code] = true;
      if (e.code === 'Space' || e.code === 'KeyE') { e.preventDefault(); actionPress(); }
      if (e.code === 'Escape') {
        e.preventDefault();
        if (phase === 'wardrobe') closeWardrobe();
        else if (phase === 'paused') pause(false);
        else pause(true);
      }
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if (phase === 'play' || phase === 'intro') NIAH.audio.wake();
    });
    document.addEventListener('keyup', (e) => {
      keys[e.code] = false;
      if (e.code === 'Space' || e.code === 'KeyE') actionRelease();
    });

    // drag to swing the camera
    let dragId = null, dragX = 0;
    canvas.addEventListener('pointerdown', (e) => {
      if (phase === 'intro') { skipIntro(); return; }
      dragId = e.pointerId; dragX = e.clientX;
    });
    canvas.addEventListener('pointermove', (e) => {
      if (e.pointerId !== dragId) return;
      const dx = e.clientX - dragX;
      dragX = e.clientX;
      NIAH.player.nudgeCamera(dx * 0.006);
    });
    const endDrag = (e) => { if (e.pointerId === dragId) dragId = null; };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // drag the farmer round in My Farmer
    const wardrobeEl = document.getElementById('wardrobe');
    let turnId = null, turnX = 0;
    wardrobeEl.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.wardrobe-panel, .wardrobe-top')) return;   // panel scrolls, not spins
      turnId = e.pointerId;
      turnX = e.clientX;
      NIAH.wardrobe.grab();
    });
    wardrobeEl.addEventListener('pointermove', (e) => {
      if (e.pointerId !== turnId) return;
      NIAH.wardrobe.turn(e.clientX - turnX);
      turnX = e.clientX;
    });
    const endTurn = (e) => {
      if (turnId !== null && e.pointerId !== turnId) return;
      turnId = null;
      NIAH.wardrobe.release();
    };
    wardrobeEl.addEventListener('pointerup', endTurn);
    wardrobeEl.addEventListener('pointercancel', endTurn);
    wardrobeEl.addEventListener('pointerleave', endTurn);

    // action button
    const btn = NIAH.ui.actionBtn;
    btn.addEventListener('pointerdown', (e) => { e.preventDefault(); actionPress(); });
    btn.addEventListener('pointerup', (e) => { e.preventDefault(); actionRelease(); });
    btn.addEventListener('pointercancel', actionRelease);
    btn.addEventListener('pointerleave', actionRelease);

    // virtual stick
    const stick = NIAH.ui.stick, knob = NIAH.ui.stickKnob;
    if (window.matchMedia('(pointer: coarse)').matches) stick.hidden = false;
    let stickId = null, cx = 0, cy = 0;
    const R = 46;
    stick.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      stickId = e.pointerId;
      stickActive = true;
      const r = stick.getBoundingClientRect();
      cx = r.left + r.width / 2; cy = r.top + r.height / 2;
      moveStick(e);
      NIAH.audio.wake();
    });
    stick.addEventListener('pointermove', (e) => { if (e.pointerId === stickId) { e.preventDefault(); moveStick(e); } });
    const endStick = (e) => {
      if (e.pointerId !== stickId) return;
      stickId = null; stickActive = false; input.x = 0; input.y = 0;
      knob.style.transform = '';
    };
    stick.addEventListener('pointerup', endStick);
    stick.addEventListener('pointercancel', endStick);
    function moveStick(e) {
      let dx = e.clientX - cx, dy = e.clientY - cy;
      const d = Math.hypot(dx, dy);
      if (d > R) { dx = (dx / d) * R; dy = (dy / d) * R; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      input.x = dx / R;
      input.y = -dy / R;
    }

    // Mobile browsers zoom on a quick second tap and on pinch. Both wreck a
    // game where tapping fast is the point, and iOS ignores user-scalable=no.
    let lastTap = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      // leave real controls alone so a fast double-buy still registers
      const onControl = e.target && e.target.closest && e.target.closest('button, .stick, .drawer-body');
      if (now - lastTap <= 350 && !onControl) e.preventDefault();
      lastTap = now;
    }, { passive: false });
    document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
    ['gesturestart', 'gesturechange', 'gestureend'].forEach((type) => {
      document.addEventListener(type, (e) => e.preventDefault(), { passive: false });
    });

    window.addEventListener('resize', () => NIAH.world.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => NIAH.world.resize(), 150));
    document.addEventListener('visibilitychange', () => { if (document.hidden) { save(); if (phase === 'play') pause(true); } });
    window.addEventListener('beforeunload', save);
  }

  /* ------------------------------------------------------------ boot */

  function boot() {
    NIAH.ui.init();
    const canvas = document.getElementById('scene');
    NIAH.world.init(canvas);
    NIAH.player.create(NIAH.world.scene);

    const saved = readSave();
    if (saved) applySave(saved);
    if (!state.lv) state.lv = makeLevel(state.level);
    const away = saved ? offlineEarnings(saved) : null;
    offlinePot = away ? away.coins : 0;

    buildWorldForLevel();
    const L = NIAH.world.layout;
    NIAH.player.place(0, L.doorZ + 9, Math.PI);
    NIAH.haptics.on = state.haptics !== false;
    NIAH.ui.setCameraLabel(state.camera);
    NIAH.ui.setHapticsLabel(state.haptics !== false);
    NIAH.ui.setMenu(saved);
    NIAH.ui.setOffline(away);
    bindInput(canvas);

    phase = 'menu';
    NIAH.ui.screen('menu', true);
    NIAH.ui.setDailyNote(dailyInfo());
    lastTime = performance.now();
    requestAnimationFrame(frame);
    // the barn is built and the first frame is scheduled — let the boot
    // lockup fade once it has had its beat
    if (window.politeCarrotBootReady) window.politeCarrotBootReady();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  return {
    state, startNewGame, continueGame, nextBarn, quitToMenu, pause, skipIntro,
    buyShovel, buyGear, gearPrice, toggleSound, toggleCamera, wipeSave,
    openWardrobe, closeWardrobe, buyCosmetic, ownsCosmetic, cosmeticLocked, cosmeticGate,
    capacity, digRate, coinsPerHay, moveSpeed,
    retire, openRetire, canRetire, retireGain, prestigeMult, prestigeGrunt, rosettes, unlockAt,
    shelfCount, shelfComplete, claimOffline, toggleHaptics,
    startDaily, endDaily, dailyInfo, dailyActive, dailyElapsed, skipFinale: endFinale,
    get phase() { return phase; },
  };
})();
