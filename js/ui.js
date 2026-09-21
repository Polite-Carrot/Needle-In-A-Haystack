/* Screens, HUD and shop. Reads game state at call time, never at load time. */
window.NIAH = window.NIAH || {};

NIAH.ui = (function () {
  const el = (id) => document.getElementById(id);
  const E = {};
  let shopTab = 'shovels', shopSig = '';
  let wardrobeTab = 'outfit', wardrobeSig = '', outfitCat = 'colour';

  const SUFFIX = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'];
  function fmt(n) {
    n = Math.floor(n);
    if (n < 1000) return String(n);
    let tier = Math.min(Math.floor(Math.log10(Math.abs(n)) / 3), SUFFIX.length - 1);
    const s = n / Math.pow(1000, tier);
    return (s < 10 ? s.toFixed(2) : s < 100 ? s.toFixed(1) : Math.floor(s)) + SUFFIX[tier];
  }

  function init() {
    [
      'menu', 'intro', 'hud', 'shop', 'pause', 'howto', 'stats', 'win', 'wardrobe',
      'wardrobeGrid', 'wardrobeCoins', 'wardrobeFoot', 'outfitCats', 'toast',
      'coinBox', 'coinCount', 'hudLevel', 'senseLine', 'pileCard', 'pileName', 'pileSearched',
      'pileFill', 'shovelName', 'loadText', 'loadFill', 'prompt', 'shopBody', 'shopCoins',
      'shopDot', 'stick', 'stickKnob', 'actionBtn', 'introNumber', 'introSub', 'statsList',
      'winText', 'winStats', 'btnContinue', 'continueLabel', 'btnWipe', 'menuSound',
      'btnCamera', 'btnSound', 'prestigeLine', 'offlineCard', 'offlineText', 'offlineCoins',
      'btnMenuRetire', 'btnPauseRetire', 'btnWinRetire', 'retire', 'retireText', 'retireStats',
      'shelf', 'shelfGrid', 'shelfSub', 'shelfFoot',
      'dailyCard', 'dailyHead', 'dailyText', 'dailyStats', 'dailyArt', 'btnDailyGo',
      'dailyNote', 'dailyTimer', 'dailyClock', 'coinBox', 'barnLabel', 'btnShop',
      'btnHaptics', 'btnPauseShop', 'btnPauseFarmer',
    ].forEach((id) => { E[id] = el(id); });

    const G = () => NIAH.game;

    el('btnPlay').addEventListener('click', () => { NIAH.audio.wake(); G().startNewGame(); });
    E.btnContinue.addEventListener('click', () => { NIAH.audio.wake(); G().continueGame(); });
    el('btnHowTo').addEventListener('click', () => screen('howto', true));
    el('closeHowto').addEventListener('click', () => screen('howto', false));
    el('btnMenuStats').addEventListener('click', () => { showStats(); });
    el('closeStats').addEventListener('click', () => screen('stats', false));
    el('btnWipe').addEventListener('click', () => G().wipeSave());
    E.menuSound.addEventListener('click', () => G().toggleSound());

    el('btnFarmerMenu').addEventListener('click', () => { NIAH.audio.wake(); G().openWardrobe(); });
    el('btnPauseFarmer').addEventListener('click', () => G().openWardrobe());
    el('btnWinFarmer').addEventListener('click', () => G().openWardrobe());
    el('closeWardrobe').addEventListener('click', () => G().closeWardrobe());
    document.querySelectorAll('.wtab').forEach((t) => t.addEventListener('click', () => {
      document.querySelectorAll('.wtab').forEach((x) => x.classList.remove('active'));
      t.classList.add('active');
      wardrobeTab = t.dataset.wtab;
      E.wardrobeGrid.scrollTop = 0;
      renderWardrobe(true);
      NIAH.audio.ui();
    }));

    el('btnMenuShelf').addEventListener('click', () => showShelf());
    el('btnPauseShelf').addEventListener('click', () => showShelf());
    el('closeShelf').addEventListener('click', () => screen('shelf', false));

    E.btnMenuRetire.addEventListener('click', () => G().openRetire());
    E.btnPauseRetire.addEventListener('click', () => G().openRetire());
    E.btnWinRetire.addEventListener('click', () => G().openRetire());
    el('closeRetire').addEventListener('click', () => screen('retire', false));
    el('btnDoRetire').addEventListener('click', () => G().retire());
    el('btnCollectOffline').addEventListener('click', () => G().claimOffline());

    el('btnMenuDaily').addEventListener('click', () => showDaily());
    el('btnDailyClose').addEventListener('click', () => closeDaily());
    E.btnDailyGo.addEventListener('click', () => {
      NIAH.audio.wake();
      if (dailyDone) { closeDaily(); return; }      // the card is a result, not an invitation
      screen('dailyCard', false);
      G().startDaily();
    });
    E.btnHaptics.addEventListener('click', () => G().toggleHaptics());

    el('btnSkipIntro').addEventListener('click', () => G().skipIntro());
    el('btnShop').addEventListener('click', () => openShop());
    el('closeShop').addEventListener('click', () => closeShop());
    el('btnPause').addEventListener('click', () => G().pause(true));
    el('btnResume').addEventListener('click', () => G().pause(false));
    el('btnPauseShop').addEventListener('click', () => openShop());
    el('btnCamera').addEventListener('click', () => G().toggleCamera());
    el('btnSound').addEventListener('click', () => G().toggleSound());
    el('btnQuit').addEventListener('click', () => G().quitToMenu());
    el('btnNextBarn').addEventListener('click', () => G().nextBarn());
    el('btnWinShop').addEventListener('click', () => openShop());

    document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((x) => x.classList.remove('active'));
      t.classList.add('active');
      shopTab = t.dataset.tab;
      E.shopBody.scrollTop = 0;
      renderShop(true);
      NIAH.audio.ui();
    }));

    setInterval(() => {
      if (E.shop.classList.contains('open')) renderShop();
      if (E.wardrobe.classList.contains('open')) renderWardrobe();
    }, 400);
  }

  /* --------------------------------------------------------- screens */

  function screen(id, open) {
    const node = E[id] || el(id);
    if (!node) return;
    node.hidden = false;
    node.classList.toggle('open', !!open);
    node.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open && (id === 'menu' || id === 'pause' || id === 'win')) syncPrestige();
  }
  function hudOn(on) { E.hud.classList.toggle('on', !!on); E.hud.setAttribute('aria-hidden', on ? 'false' : 'true'); }

  function openShop() {
    E.shop.classList.add('open');
    renderShop(true);
    NIAH.audio.ui();
  }
  function closeShop() { E.shop.classList.remove('open'); }
  function shopIsOpen() { return E.shop.classList.contains('open'); }

  /* ------------------------------------------------------------- HUD */

  function bumpCoins() {
    E.coinBox.classList.add('bump');
    setTimeout(() => E.coinBox.classList.remove('bump'), 120);
  }

  function setHud(s) {
    E.coinCount.textContent = fmt(s.coins);
    E.hudLevel.textContent = s.level;
    E.shovelName.textContent = s.shovelName;
    E.loadText.textContent = fmt(s.load) + ' / ' + fmt(s.capacity);
    const pct = s.capacity ? (s.load / s.capacity) * 100 : 0;
    E.loadFill.style.width = pct.toFixed(1) + '%';
    E.loadFill.classList.toggle('full', s.load >= s.capacity);
    E.shopDot.hidden = !s.affordable;
  }

  function setPileCard(pile) {
    if (!pile) { E.pileCard.hidden = true; return; }
    E.pileCard.hidden = false;
    E.pileName.textContent = 'Pile ' + pile.name;
    // digging is what uncovers the needle, so the card tracks hay off the pile
    const pct = pile.total ? ((pile.total - pile.hay) / pile.total) * 100 : 0;
    E.pileSearched.textContent = Math.floor(pct) + '% dug out';
    E.pileFill.style.width = pct.toFixed(1) + '%';
  }

  let toastTimer = null;
  function toast(text) {
    if (!E.toast) return;
    E.toast.textContent = text;
    E.toast.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => E.toast.classList.remove('on'), 2600);
  }

  function setPrompt(text) {
    if (!text) { E.prompt.hidden = true; return; }
    E.prompt.hidden = false;
    E.prompt.textContent = text;
  }

  function setAction(label, enabled) {
    E.actionBtn.textContent = label;
    E.actionBtn.disabled = !enabled;
  }

  function setSense(text) {
    E.senseLine.textContent = text || '';
    E.senseLine.classList.toggle('on', !!text);
  }

  function setIntro(level, sub) {
    E.introNumber.textContent = level;
    E.introSub.textContent = sub;
  }

  function setMenu(save) {
    E.btnContinue.hidden = !save;
    E.btnWipe.hidden = !save;
    if (save) E.continueLabel.textContent = 'Barn ' + save.level;
    E.menuSound.textContent = NIAH.audio.muted ? '🔇 Sound off' : '🔊 Sound on';
    E.btnSound.textContent = 'Sound: ' + (NIAH.audio.muted ? 'Off' : 'On');
    syncPrestige();
    if (NIAH.game && NIAH.game.dailyInfo) setDailyNote(NIAH.game.dailyInfo());
  }

  /* The rosette line and the three Retire buttons all say the same thing, so
     they are refreshed together whenever a screen that shows one opens. */
  function syncPrestige() {
    const G = NIAH.game;
    if (!G || !G.state) return;
    const r = G.rosettes();
    E.prestigeLine.hidden = r <= 0;
    if (r > 0) {
      E.prestigeLine.textContent = '🏅 ' + r + ' rosette' + (r === 1 ? '' : 's')
        + ' · ×' + G.prestigeMult().toFixed(1) + ' coins · ×' + G.prestigeGrunt().toFixed(2) + ' digging';
    }
    const show = G.canRetire() && !G.dailyActive();
    E.btnMenuRetire.hidden = !show;
    E.btnPauseRetire.hidden = !show;
    E.btnWinRetire.hidden = !show;
  }

  /* ------------------------------------------------ while you were away */

  function setOffline(away) {
    if (!away) { E.offlineCard.hidden = true; return; }
    const mins = Math.round(away.secs / 60);
    const hrs = Math.floor(mins / 60);
    const time = mins < 60 ? mins + ' minutes'
      : mins % 60 === 0 ? hrs + (hrs === 1 ? ' hour' : ' hours')
      : hrs + 'h ' + (mins % 60) + 'm';
    E.offlineCard.hidden = false;
    E.offlineText.textContent = away.hands + (away.hands === 1 ? ' farmhand' : ' farmhands')
      + ' kept baling in the yard for ' + time + (away.capped ? ', then knocked off.' : '.')
      + '  That is ' + (away.barns >= 0.995 ? 'a full barn' : Math.round(away.barns * 100) + '% of a barn')
      + ' worth of hay.';
    E.offlineCoins.textContent = fmt(away.coins);
  }
  function clearOffline() { E.offlineCard.hidden = true; }

  /* ------------------------------------------------------ barn shelf */

  function showShelf() {
    const G = NIAH.game, s = G.state;
    const shelf = s.shelf || {};
    const total = NIAH.data.JUNK.length;
    const have = G.shelfCount();
    E.shelfSub.textContent = have + ' of ' + total + ' kinds on the shelf';
    E.shelfGrid.innerHTML = '';
    NIAH.data.JUNK.forEach((j) => {
      const rec = shelf[j.id];
      const found = !!(rec && rec.n > 0);
      const d = document.createElement('div');
      d.className = 'shelf-item' + (found ? '' : ' empty');
      d.innerHTML = '<div class="shelf-emoji"></div><div class="shelf-info">'
        + '<div class="shelf-name"></div><div class="shelf-line"></div></div><div class="shelf-count"></div>';
      d.querySelector('.shelf-emoji').textContent = found ? j.emoji : '❔';
      d.querySelector('.shelf-name').textContent = found ? j.name : '???';
      d.querySelector('.shelf-line').textContent = found
        ? j.line + '  ·  first found in barn ' + (rec.first || '?')
        : 'Still buried out there somewhere.';
      d.querySelector('.shelf-count').textContent = found ? '×' + fmt(rec.n) : '';
      E.shelfGrid.appendChild(d);
    });
    E.shelfFoot.textContent = s.shelfDone
      ? '🏆 Shelf complete — the Tin Can Hat is in My Farmer.'
      : 'Fill every slot and the Tin Can Hat is yours, plus a one-off bounty.';
    screen('shelf', true);
    NIAH.audio.ui();
  }

  /* ---------------------------------------------------- daily barn */

  let dailyDone = false;     // is the card showing a result, or the invitation?

  function clock(ms) {
    const s = ms / 1000;
    if (s < 60) return s.toFixed(1) + 's';
    return Math.floor(s / 60) + 'm ' + (s % 60).toFixed(1).padStart(4, '0') + 's';
  }

  /* The clock is the only number that matters in a daily, so it takes the
     coin counter's place rather than crowding in beside it. */
  function setDailyMode(on) {
    E.dailyTimer.hidden = !on;
    E.coinBox.hidden = !!on;
    E.btnShop.hidden = !!on;
    E.barnLabel.textContent = on ? 'Daily' : 'Barn';
    E.hudLevel.hidden = !!on;
    // nothing bought during a daily would survive it, so the shops are shut
    E.btnPauseShop.hidden = !!on;
    E.btnPauseFarmer.hidden = !!on;
    setDailyTimer(0);
  }

  function setDailyTimer(ms) {
    E.dailyClock.textContent = clock(ms);
  }

  function setDailyNote(info) {
    if (!E.dailyNote) return;
    E.dailyNote.textContent = info.doneToday
      ? 'done · ' + clock(info.bestMs)
      : info.bestMs ? 'best ' + clock(info.bestMs) : 'new today';
  }

  function showDaily() {
    const info = NIAH.game.dailyInfo();
    dailyDone = false;
    E.dailyArt.textContent = '🗓️';
    E.dailyHead.textContent = 'Daily Barn';
    E.dailyText.textContent = 'The same barn for everyone today: ' + info.piles + ' piles, one needle, '
      + 'a ' + info.shovel + ' and a Lv 2 detector. No coins in here and nothing to buy — '
      + 'just the clock. It changes at midnight.';
    E.dailyStats.innerHTML = [
      ['Today', info.day],
      ["Today's best", info.bestMs ? clock(info.bestMs) : '—'],
      ['Run', info.streak + (info.streak === 1 ? ' day' : ' days')],
      ['Longest run', (info.bestStreak || 0) + (info.bestStreak === 1 ? ' day' : ' days')],
      ['Barns found', info.wins || 0],
    ].map((r) => '<div><span>' + r[0] + '</span><span>' + r[1] + '</span></div>').join('');
    E.btnDailyGo.textContent = info.doneToday ? 'Beat your time' : 'Start the clock';
    screen('dailyCard', true);
    NIAH.audio.ui();
  }

  function showDailyResult(r, info) {
    dailyDone = true;
    E.dailyArt.textContent = r.improved ? '🏆' : '🪡';
    E.dailyHead.textContent = r.improved ? 'New best!' : 'Found it';
    E.dailyText.textContent = r.first
      ? 'Today\u2019s barn is done in ' + clock(r.ms) + '.'
      : 'Another run: ' + clock(r.ms) + (r.improved ? ' — quicker than before.' : ', not your best.');
    const rows = [
      ['This run', clock(r.ms)],
      ["Today's best", clock(r.best)],
      ['Run', r.streak + (r.streak === 1 ? ' day' : ' days')],
      ['Longest run', (r.bestStreak || 0) + (r.bestStreak === 1 ? ' day' : ' days')],
    ];
    if (r.bounty) rows.push(['Daily bounty', '🪙 ' + fmt(r.bounty)]);
    E.dailyStats.innerHTML = rows.map((x) => '<div><span>' + x[0] + '</span><span>' + x[1] + '</span></div>').join('');
    E.btnDailyGo.textContent = 'Back to the farm';
    screen('dailyCard', true);
  }

  /* The invitation opens on top of the menu, which is still there underneath;
     the result card ends a run, so that one goes back through quitToMenu. */
  function closeDaily() {
    screen('dailyCard', false);
    if (NIAH.game.dailyActive()) NIAH.game.quitToMenu();
  }

  function setHapticsLabel(on) {
    if (!E.btnHaptics) return;
    E.btnHaptics.hidden = !NIAH.haptics.supported;
    E.btnHaptics.textContent = 'Vibration: ' + (on ? 'On' : 'Off');
  }

  /* --------------------------------------------------------- retire */

  const early = (n) => n === 0 ? 'on time' : n === 1 ? 'a barn early' : n + ' barns early';

  function showRetire(d) {
    E.retireText.textContent = d.can
      ? 'Hand the farm on and start again at barn 1. Your coins, shovels and gear all go; your farmer, '
        + 'your wardrobe and the Barn Shelf stay. Each rosette is +10% coins and +5% digging for good, '
        + 'and every eight of them brings the shovels forward a barn.'
      : 'You can retire from barn ' + d.at + ' onwards. Keep digging.';
    E.retireStats.innerHTML = [
      ['Retiring from', 'Barn ' + d.level],
      ['Rosettes earned', '🏅 ' + d.gain],
      ['Rosettes after', '🏅 ' + (d.rosettes + d.gain)],
      ['Coins', '×' + d.mult.toFixed(1) + '  →  ×' + d.nextMult.toFixed(1)],
      ['Digging and load', '×' + d.grunt.toFixed(2) + '  →  ×' + d.nextGrunt.toFixed(2)],
      ['Shovels come', early(d.skip) + '  →  ' + early(d.nextSkip)],
      ['Farms handed on', d.retires],
    ].map((r) => '<div><span>' + r[0] + '</span><span>' + r[1] + '</span></div>').join('');
    el('btnDoRetire').disabled = !d.can;
    el('btnDoRetire').textContent = d.can ? 'Hand the farm on' : 'Barn ' + d.at + ' to retire';
    screen('retire', true);
    NIAH.audio.ui();
  }

  function setCameraLabel(mode) {
    E.btnCamera.textContent = 'Camera: ' + (mode === 'first' ? 'First person' : 'Follow');
  }

  /* ------------------------------------------------------------ shop */

  function row(o) {
    const d = document.createElement('div');
    d.className = 'item ' + (o.cls || '');
    d.innerHTML = '<div class="item-emoji"></div><div class="item-info"><div class="item-name"></div><div class="item-desc"></div></div>';
    d.querySelector('.item-emoji').textContent = o.emoji;
    d.querySelector('.item-name').textContent = o.name;
    d.querySelector('.item-desc').textContent = o.desc;
    const b = document.createElement('button');
    b.className = 'btn-buy ' + (o.btnCls || '');
    b.textContent = o.label;
    b.disabled = !!o.disabled;
    if (o.onClick) b.addEventListener('click', o.onClick);
    d.appendChild(b);
    return d;
  }

  function renderShop(force) {
    const G = NIAH.game;
    if (!G || !G.state) return;
    const s = G.state;
    const sig = [
      shopTab, s.coins, s.shovel, s.owned.join(','), s.level,
      Object.keys(NIAH.data.GEAR).map((k) => s.gear[k]).join(','),
    ].join('|');
    if (!force && sig === shopSig) return;
    shopSig = sig;

    E.shopCoins.textContent = fmt(s.coins);
    const body = E.shopBody;
    const scroll = body.scrollTop;
    body.innerHTML = '';

    if (shopTab === 'shovels') {
      NIAH.data.SHOVELS.forEach((sh, i) => {
        const owned = s.owned.includes(i);
        const equipped = s.shovel === i;
        const at = G.unlockAt(sh);
        const gated = s.level < at;
        const desc = sh.desc + '  •  holds ' + fmt(sh.cap) + '  •  digs ' + fmt(sh.dig) + ' hay/sec';
        let label, cls = '', btnCls = '', disabled = false;
        if (equipped) { label = 'In hand'; btnCls = 'tag'; disabled = true; cls = 'equipped'; }
        else if (owned) { label = 'Equip'; btnCls = 'equip'; cls = 'owned'; }
        else if (gated) { label = 'Barn ' + at; btnCls = 'tag'; disabled = true; cls = 'locked'; }
        else { label = '🪙 ' + fmt(sh.price); disabled = s.coins < sh.price; }
        body.appendChild(row({
          emoji: sh.emoji, name: sh.name, desc, cls, label, btnCls, disabled,
          onClick: () => G.buyShovel(i),
        }));
      });
    } else {
      Object.keys(NIAH.data.GEAR).forEach((key) => {
        const g = NIAH.data.GEAR[key];
        const lvl = s.gear[key];
        const maxed = lvl >= g.max;
        const price = G.gearPrice(key);
        body.appendChild(row({
          emoji: g.emoji,
          name: g.name + (lvl ? ' — Lv ' + lvl : ''),
          desc: g.desc(lvl),
          cls: maxed ? 'owned' : '',
          label: maxed ? 'MAX' : '🪙 ' + fmt(price),
          btnCls: maxed ? 'tag' : '',
          disabled: maxed || s.coins < price,
          onClick: () => G.buyGear(key),
        }));
      });
      const info = document.createElement('div');
      info.className = 'item';
      info.innerHTML = '<div class="item-emoji">📈</div><div class="item-info"><div class="item-name">Current rates</div><div class="item-desc"></div></div>';
      info.querySelector('.item-desc').textContent =
        fmt(G.capacity()) + ' hay per load · ' + fmt(G.digRate()) + ' hay/sec · ' +
        (G.coinsPerHay() < 10 ? G.coinsPerHay().toFixed(2) : fmt(G.coinsPerHay())) + ' coins per hay' +
        (G.rosettes() ? ' · 🏅 ×' + G.prestigeMult().toFixed(1) : '');
      body.appendChild(info);
    }
    body.scrollTop = scroll;
  }

  /* ------------------------------------------------------- my farmer */

  const CAT_BLURB = {
    colour: 'Plain shirt and trousers, in every colour the farm stocks.',
    flag: 'Fly one on your back.',
    camo: 'Blend into anything except a haystack.',
    other: 'Check, hi-vis, cow print and the loud ones.',
  };
  const KIND_BLURB = {
    outfit: 'Shirt and trousers, sorted by the kind of statement you want.',
    hat: 'Sun protection, mostly. Some of it is not.',
    face: 'How you look at a barn full of hay.',
    shovel: 'Looks only — your dug-per-second comes from the shop.',
  };

  function kitRow(kind, item, state) {
    const G = NIAH.game;
    const owned = G.ownsCosmetic(kind, item.id);
    const worn = state.look[kind] === item.id;
    const locked = G.cosmeticLocked(kind, item.id);
    const canAfford = state.coins >= item.price;

    const b = document.createElement('button');
    b.className = 'kit' + (worn ? ' worn' : owned ? ' owned' : locked ? ' locked' : canAfford ? '' : ' cant');
    b.type = 'button';

    const sw = document.createElement('div');
    sw.className = 'kit-swatch';
    if (item.emoji) {
      // expressions read as themselves; colour bars all look like skin
      sw.classList.add('emoji');
      sw.textContent = item.emoji;
    } else {
      (item.swatch || ['#888']).forEach((c) => {
        const seg = document.createElement('span');
        seg.style.background = c;
        sw.appendChild(seg);
      });
    }

    const info = document.createElement('div');
    info.className = 'kit-info';
    const name = document.createElement('div');
    name.className = 'kit-name';
    name.textContent = item.name;
    const tag = document.createElement('div');
    if (worn) { tag.className = 'kit-tag'; tag.textContent = 'Wearing'; }
    else if (owned) { tag.className = 'kit-tag'; tag.textContent = 'Tap to wear'; }
    else if (locked) { tag.className = 'kit-tag locked'; tag.textContent = G.cosmeticGate(kind, item.id).tag; }
    else { tag.className = 'kit-tag price'; tag.textContent = '🪙 ' + fmt(item.price); }
    info.append(name, tag);

    b.append(sw, info);
    b.addEventListener('click', () => {
      if (locked) { NIAH.audio.nope(); setWardrobeFoot(G.cosmeticGate(kind, item.id).why); return; }
      if (!owned && !canAfford) {
        NIAH.audio.nope();
        setWardrobeFoot(fmt(item.price - state.coins) + ' more coins for ' + item.name + '.');
        return;
      }
      NIAH.game.buyCosmetic(kind, item.id);
      setWardrobeFoot(owned ? item.name + ' on.' : 'Bought ' + item.name + '. ' + item.desc);
    });
    return b;
  }

  function setWardrobeFoot(text) { E.wardrobeFoot.textContent = text; }

  function renderOutfitCats(items, s) {
    E.outfitCats.hidden = false;
    E.outfitCats.innerHTML = '';
    NIAH.cosmetics.OUTFIT_CATS.forEach((c) => {
      const inCat = items.filter((i) => i.cat === c.id);
      const owned = inCat.filter((i) => NIAH.game.ownsCosmetic('outfit', i.id)).length;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'subtab' + (outfitCat === c.id ? ' active' : '');
      b.innerHTML = '';
      b.textContent = c.name;
      const n = document.createElement('span');
      n.className = 'count';
      n.textContent = owned + '/' + inCat.length;
      b.appendChild(n);
      b.addEventListener('click', () => {
        outfitCat = c.id;
        E.wardrobeGrid.scrollTop = 0;
        renderWardrobe(true);
        setWardrobeFoot(CAT_BLURB[c.id]);
        NIAH.audio.ui();
      });
      E.outfitCats.appendChild(b);
    });
  }

  function syncOutfitCat() {
    const worn = NIAH.cosmetics.byId(NIAH.cosmetics.OUTFITS, NIAH.game.state.look.outfit);
    if (worn && worn.cat) outfitCat = worn.cat;
  }

  function renderWardrobe(force) {
    const G = NIAH.game;
    if (!G || !G.state) return;
    const s = G.state;
    const sig = [wardrobeTab, outfitCat, s.coins, s.level, JSON.stringify(s.look), JSON.stringify(s.wardrobe)].join('|');
    if (!force && sig === wardrobeSig) return;
    const changedTab = !wardrobeSig.startsWith(wardrobeTab + '|');
    wardrobeSig = sig;

    E.wardrobeCoins.textContent = fmt(s.coins);
    const grid = E.wardrobeGrid;
    const scroll = grid.scrollTop;
    grid.innerHTML = '';

    let items = NIAH.cosmetics.listFor(wardrobeTab);
    if (wardrobeTab === 'outfit') {
      renderOutfitCats(items, s);
      items = items.filter((i) => i.cat === outfitCat);
    } else {
      E.outfitCats.hidden = true;
    }
    items.forEach((item) => grid.appendChild(kitRow(wardrobeTab, item, s)));
    grid.scrollTop = changedTab ? 0 : scroll;
    if (force || changedTab) {
      setWardrobeFoot(wardrobeTab === 'outfit' ? CAT_BLURB[outfitCat] : KIND_BLURB[wardrobeTab]);
    }
  }

  /* ----------------------------------------------------------- misc */

  function showStats() {
    const G = NIAH.game, s = G.state;
    const mins = Math.floor((Date.now() - (s.started || Date.now())) / 60000);
    const rows = [
      ['Needles found', s.needles],
      ['Current barn', '#' + s.level],
      ['Rosettes', '🏅 ' + G.rosettes() + '  (×' + G.prestigeMult().toFixed(1) + ' coins, ×' + G.prestigeGrunt().toFixed(2) + ' digging)'],
      ['Farms handed on', (s.prestige && s.prestige.retires) || 0],
      ['Deepest barn reached', '#' + Math.max(s.level, (s.prestige && s.prestige.best) || 0)],
      ['Hay sifted (all time)', fmt(s.totalHay)],
      ['Odds and ends found', fmt(s.junkFound || 0)],
      ['Barn Shelf', G.shelfCount() + ' of ' + NIAH.data.JUNK.length + ' kinds'],
      ['Loads carried', fmt(s.totalLoads)],
      ['Coins', fmt(s.coins)],
      ['Shovel', NIAH.data.SHOVELS[s.shovel].name],
      ['Walking speed', G.moveSpeed().toFixed(1) + ' m/s'],
      ['Farmhands', s.gear.hands],
      ['Time on the farm', mins < 60 ? mins + ' min' : Math.floor(mins / 60) + 'h ' + (mins % 60) + 'm'],
    ];
    E.statsList.innerHTML = rows.map((r) => '<li><span>' + r[0] + '</span><span>' + r[1] + '</span></li>').join('');
    screen('stats', true);
  }

  function showWin(data) {
    E.winText.textContent = data.text;
    E.winStats.innerHTML = data.rows.map((r) => '<div><span>' + r[0] + '</span><span>' + r[1] + '</span></div>').join('');
    screen('win', true);
  }

  return {
    init, screen, hudOn, setHud, setPileCard, setPrompt, setAction, setSense, setIntro,
    setMenu, setCameraLabel, renderShop, openShop, closeShop, shopIsOpen, showStats, showWin, toast,
    renderWardrobe, syncOutfitCat, syncPrestige, setOffline, clearOffline, showRetire, showShelf,
    setDailyMode, setDailyTimer, setDailyNote, showDaily, showDailyResult, setHapticsLabel,
    bumpCoins, fmt,
    get stick() { return E.stick; },
    get stickKnob() { return E.stickKnob; },
    get actionBtn() { return E.actionBtn; },
  };
})();
