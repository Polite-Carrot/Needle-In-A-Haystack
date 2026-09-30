/* Ad placement, with no ad network in it.

   The game calls NIAH.ads.interstitial() and NIAH.ads.rewarded(); this module
   owns *when* an ad is allowed, and hands the actual showing to whatever
   provider is plugged in. With nothing plugged in every call resolves
   immediately, so the game plays exactly as it does now — that is deliberate:
   the placement logic is testable today and the network is a one-file swap.

   A provider is an object with either or both of:
     interstitial() -> Promise<any>            resolve when the ad closes
     rewarded()     -> Promise<boolean>        true if it was watched to the end
   Both may reject; a rejection is treated as "no ad", never as a reward. */
window.NIAH = window.NIAH || {};

NIAH.ads = (function () {
  /* All three have to pass before an interstitial is allowed. A barn is about
     a minute, so a time gate on its own would land one every couple of levels;
     the barn counter is what stops that on a fast run. */
  const RULES = {
    firstBarn: 4,          // nothing until barn 4 has been cleared
    minBarns: 3,           // barns cleared since the last interstitial
    minGapMs: 3 * 60 * 1000,
    /* firstBarn only ever protects a brand-new player. Someone coming back at
       barn 30 has already passed it, and would otherwise catch an ad on their
       first barn of the session — the worst possible moment. */
    sessionGraceMs: 90 * 1000,
  };

  // a session is one page load, which for a web game is how players arrive
  const sessionStart = Date.now();

  /* An SDK that never resolves would leave the player staring at nothing with
     no way on, so every call is raced against a clock. Rewarded gets far
     longer because watching one to the end legitimately takes half a minute. */
  const TIMEOUT = { interstitial: 12000, rewarded: 90000 };

  let provider = null;
  let barnsSince = 0;
  let lastShownAt = 0;
  let showing = false;

  /* What the player has agreed to. Both start false — nothing is assumed, and
     the network adapter is told whenever it changes so it can pass the signal
     on. This is the game's own surface for the choice; the ad network still
     has to be given it through whatever consent API it provides. */
  let consent = { personalised: false, analytics: false };

  function setConsent(next) {
    consent = {
      personalised: !!(next && next.personalised),
      analytics: !!(next && next.analytics),
    };
    tellProvider();
  }
  function tellProvider() {
    if (provider && typeof provider.consent === 'function') {
      try { provider.consent(consent); } catch (e) { /* never break play */ }
    }
  }

  function within(ms, work) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new Error('ad timed out'));
      }, ms);
      Promise.resolve().then(work).then(
        (v) => { if (!settled) { settled = true; clearTimeout(timer); resolve(v); } },
        (e) => { if (!settled) { settled = true; clearTimeout(timer); reject(e); } }
      );
    });
  }

  function use(p) { provider = p || null; tellProvider(); }
  const canInterstitial = () => !!(provider && typeof provider.interstitial === 'function');
  const canReward = () => !!(provider && typeof provider.rewarded === 'function');

  /* Called when a barn is finished, whether or not an ad follows. */
  function barnCleared() { barnsSince++; }

  /* Why an interstitial is not allowed right now — null means it is. Kept
     separate from interstitial() so it can be asserted in tests and shown in
     a debug readout without side effects. */
  function blockedBecause(level) {
    if (!canInterstitial()) return 'no provider';
    if (showing) return 'one is already up';
    const intoSession = Date.now() - sessionStart;
    if (intoSession < RULES.sessionGraceMs) {
      return Math.round((RULES.sessionGraceMs - intoSession) / 1000) + 's into the session';
    }
    if (level < RULES.firstBarn) return 'barn ' + level + ' is before barn ' + RULES.firstBarn;
    if (barnsSince < RULES.minBarns) {
      return barnsSince + (barnsSince === 1 ? ' barn' : ' barns') + ' since the last, needs ' + RULES.minBarns;
    }
    if (lastShownAt) {
      const gap = Date.now() - lastShownAt;
      if (gap < RULES.minGapMs) return Math.round((RULES.minGapMs - gap) / 1000) + 's left on the gap';
    }
    return null;
  }

  const mayInterstitial = (level) => blockedBecause(level) === null;

  /* Resolves 'shown', or 'skipped' with the reason. Never rejects: an ad
     failing must not stop the player getting to the next barn. */
  function interstitial(level) {
    const why = blockedBecause(level);
    if (why) return Promise.resolve({ shown: false, why });
    showing = true;
    return within(TIMEOUT.interstitial, () => provider.interstitial())
      .then(() => {
        lastShownAt = Date.now();
        barnsSince = 0;
        return { shown: true };
      })
      .catch((e) => ({ shown: false, why: e && e.message === 'ad timed out' ? 'timed out' : 'provider failed' }))
      .then((r) => { showing = false; return r; });
  }

  /* Rewarded is always the player's choice, so it has no frequency rules —
     only the one guard that two cannot overlap. Resolves true only when the
     provider says it was watched. */
  function rewarded() {
    if (!canReward() || showing) return Promise.resolve(false);
    showing = true;
    return within(TIMEOUT.rewarded, () => provider.rewarded())
      .then((ok) => ok === true)
      .catch(() => false)
      .then((ok) => { showing = false; return ok; });
  }

  /* The counters ride along in the save, so closing the tab is not a way to
     dodge the gap. */
  function snapshot() { return { barnsSince, lastShownAt }; }
  function restore(s) {
    if (!s) return;
    barnsSince = s.barnsSince || 0;
    lastShownAt = s.lastShownAt || 0;
  }

  /* ---------------------------------------------------------- house stub */

  /* A fake provider for seeing the placements work before a real SDK is
     chosen. Only ever installed from ?adstub in the URL — it must never be
     possible for a player to be shown one of these. */
  function stubProvider() {
    const run = (label, ms, rewardable) => () => new Promise((resolve) => {
      const wrap = document.createElement('div');
      wrap.className = 'ad-stub';
      wrap.innerHTML = '<div class="ad-stub-card"><div class="ad-stub-tag">Test placeholder</div>'
        + '<div class="ad-stub-label"></div><div class="ad-stub-count"></div>'
        + '<button class="btn small" type="button"></button></div>';
      wrap.querySelector('.ad-stub-label').textContent = label;
      const count = wrap.querySelector('.ad-stub-count');
      const btn = wrap.querySelector('button');
      document.body.appendChild(wrap);

      let left = Math.ceil(ms / 1000);
      const tick = () => {
        count.textContent = left > 0 ? left + 's' : '';
        btn.textContent = left > 0 ? (rewardable ? 'Close (no reward)' : 'Skip') : 'Close';
      };
      tick();
      const iv = setInterval(() => { left--; tick(); if (left <= 0) clearInterval(iv); }, 1000);
      const done = (watched) => {
        clearInterval(iv);
        wrap.remove();
        resolve(rewardable ? watched : true);
      };
      btn.addEventListener('click', () => done(left <= 0));
      setTimeout(() => { if (wrap.isConnected) tick(); }, ms);
    });
    return { interstitial: run('Interstitial', 5000, false), rewarded: run('Rewarded', 5000, true) };
  }

  function installStubIfAsked() {
    try {
      if (/(^|[?&])adstub(=|&|$)/.test(location.search)) use(stubProvider());
    } catch (e) { /* no location, never mind */ }
  }

  return {
    RULES, TIMEOUT, use, installStubIfAsked, stubProvider, setConsent,
    get consent() { return { personalised: consent.personalised, analytics: consent.analytics }; },
    barnCleared, mayInterstitial, blockedBecause, interstitial, rewarded,
    snapshot, restore,
    get hasInterstitial() { return canInterstitial(); },
    get hasRewarded() { return canReward(); },
    get barnsSince() { return barnsSince; },
  };
})();
