# 🌾 Needle in a Haystack

A small 3D game about the world's least efficient search problem. You are a
farmhand in a barn full of hay. A needle is buried in **one** of the piles. Walk
over, dig it out one shovel-load at a time, sift it on the conveyor, and keep going
until the needle turns up — then move to a bigger barn.

Built with [three.js](https://threejs.org) (vendored, MIT). No build step, no
network calls, no dependencies to install.

**▶ Play it: https://needleinahaystack.politecarrot.com**

## How to play

| | Desktop | Touch |
| --- | --- | --- |
| Move | `W A S D` / arrow keys | left stick |
| Dig / sift | hold `Space` or `E` | hold the action button |
| Look around | drag the scene | drag the scene |
| Pause | `Esc` | ⏸ button |

1. Walk to a hay pile and **hold to dig** until your shovel is full.
2. Carry the load to the **conveyor sifter** in the corner and tip it into the
   hopper. The belt carries it to the crate, and sifted hay pays coins.
3. The needle is buried at a hidden depth in one pile. Dig that pile down far
   enough and you will **see it** lying in what is left, glinting — walk over
   and grab it. Digging the wrong pile is never wasted; it still pays.
4. Spend coins on shovels and gear between barns. Bigger shovels unlock as you
   clear barns, so the farm opens up gradually rather than all at once.

## What's in it

- **A barn you walk around** — procedural low-poly barn interior and exterior,
  lanterns, dust in the light shafts, a farmhand with a hand-animated walk,
  dig and dump cycle, and a conveyor sifter running in the corner.
- **A yard with livestock.** Walk back out of the doors and there is a fenced
  paddock in front of the barn with two cows, two sheep, a pig and three
  chickens wandering it, grazing, and trotting out of your way when you get
  close. Nothing to do out there — it is somewhere to be.
- **A walk-in cutscene** for every barn: the doors swing open, the camera
  follows you inside, and the barn number lands on screen. Skippable.
- **Spatial search, not tapping.** Each barn has labelled piles (A, B, C…) and
  exactly one holds the needle, at its own depth and its own spot inside the
  pile. The pile card shows how far down you have dug the pile you're standing
  at. The needle is a real object: uncover it and it lies there in the hay
  until you pick it up — your hired hands can dig it out for you, but only you
  can take it.
- **Needle Sense** — a detector that reads how far off the nearest *metal* is
  *from where you stand*, and never names the pile. One reading narrows it to a
  ring around you; walk somewhere else, take another, and the rings cross.
  Levels buy precision — warm/hot/burning, then metres to the nearest five,
  then metres — not the answer.
- **Odds and ends in the hay.** Horseshoes, a rusty key, a tin can, an old
  boot, a pocket watch, a wedding ring — buried at their own depths, worth
  coins, and dug out the same way the needle is. The metal ones are what the
  detector actually hears, so a promising reading can turn out to be a
  horseshoe; digging the scrap out is how you clear the noise.
- **8 shovels and 4 pieces of gear**: work boots, sifting screen, the detector,
  and farmhands — hired hands who actually walk the barn, each picking a pile,
  digging a load, carrying it to the conveyor and heading back for more.
- **My Farmer** — a wardrobe you spend barn coins in, with a turntable preview:
  56 outfits shelved under Colours, Flags (26 of them, named for the countries
  they belong to), Camo (woodland through digital, tiger stripe and one very
  loud pink) and Other (check, hi-vis, cow print, pinstripe, disco); 21 hats
  (caps, cowboy, sombrero, tricorn, wizard, hard hat, a bunny head, a pumpkin
  head, a traffic cone, a crown, and the Polite Carrot mascot worn as a full
  head); 15 facial expressions from Big Grin through Eyepatch and Monocle to a
  Full Beard; and 15 shovel skins (gold, trident, frying pan, umbrella, bone
  spade, candy cane, neon, diamond). The preview turns by itself and can be
  dragged round by hand.
  Three pieces are not for sale at any price — Rosette Claret, the Tin Can Hat
  and the Heirloom Spade are earned by retiring and by filling the Barn Shelf.
  Cosmetic only — every dig stat still comes from the shop. Patterns are drawn procedurally at
  runtime, so there are still no image assets in the repo.
- **The Daily Barn.** One barn a day, identical for everyone who plays it —
  the same ten piles, the same needle, the same scrap in the hay, generated
  from a seeded RNG keyed to the date. Fixed kit (a Steel Spade and a Lv 2
  detector), no coins and no shop: the only variable is the clock, which runs
  on wall time so a slow phone cannot post a fast lap. Your best time for the
  day is kept, along with a run of consecutive days, and the first win each day
  pays a bounty scaled to the farm you actually have. It never touches your
  campaign — level, coins, gear and Barn Shelf are all held aside and put back
  when you leave, so a daily can be replayed for a better time without
  becoming a place to farm.
- **The Barn Shelf.** Every kind of odd and end you dig out gets a slot of its
  own, with a running count and the barn the first one came out of. Fill all six
  and there is a one-off bounty and the **Tin Can Hat**.
- **Retire the farm.** From barn 8 you can hand the farm on: the coins, shovels
  and gear all go and you start again at barn 1, but you keep a **rosette** for
  every needle you found. Each rosette is **+10% coins and +5% digging** for
  good, and every eight of them brings every shovel's unlock forward by a barn —
  so each run is faster and reaches further than the last. Your farmer, your
  wardrobe and the Barn Shelf come with you, and retiring three times unlocks
  the **Heirloom Spade**.
- **Farmhands work while you're away.** Come back and the crew have been baling
  in the yard — a welcome-back card on the menu, worth 8% of your current barn
  per hand per hour, capped at one barn and at four hours. They never touch your
  piles, so the barn is exactly where you left it.
- **A proper win moment.** Grabbing the needle drops the barn into slow motion,
  turns the farmer away from the pile, has them hold the thing up to the light
  while hay rains down, and only then brings up the card. Tap to skip it; it is
  skipped outright for anyone who has asked for reduced motion.
- **Vibration**, on the dig, the reveal, the grab and every refusal. Android
  only — iOS Safari has never supported `navigator.vibrate`, so on an iPhone
  every call is a silent no-op and the toggle is hidden rather than offering
  a setting that does nothing.
- **Installable.** A web app manifest, icons and a service worker that precaches
  the whole game, so it can be added to a home screen and played with no signal.
- **First person or follow camera**, toggled from the pause menu. In first
  person the body is hidden and the camera sits at eye height — the arms and
  the shovel stay, so you can still see what you are carrying.
- Main menu, pause menu, first-person / follow camera toggle, synthesised sound
  effects (no audio files), and autosave to `localStorage`.
- The shared **Polite Carrot boot lockup** on startup, ported from Color Match &
  Merge and Tide Runner so every title opens the same way. It holds for the house
  beat, waits for the barn to finish building, and hard-caps at 4s.

## Balance

Each barn has more piles and bigger piles than the last (`×1.5` hay), and pays
`×1.85` per hay. Shovels are gated behind barn levels as well as price, so
clearing barns — not grinding one — is what opens the next tier.

That curve outruns its own sinks: by barn 10 a single barn pays about 6.4M
coins while everything buyable in the game costs about 9.8M put together, and
barn 13 pays 137M. **Retiring is the sink.** It puts the whole shop back in
front of you, and rosettes pay out in the two things a fresh run is actually
short of — dig rate and early shovels — rather than in coins alone, which the
barn gates would have swallowed.

## Running it

Open `index.html` in a browser, or serve the folder:

```sh
npx serve .     # or: python3 -m http.server
```

Progress is saved in `localStorage` under `niah.save.v2`; **Erase save** on the
main menu clears it. Older saves are migrated forward on load, so an existing
game keeps its coins, barn and wardrobe.

The service worker only registers over `http(s)`, so opening `index.html`
straight off disk still works. When you change any file in the shell, bump
`CACHE` in `sw.js` so returning players fetch it.

## Hosting on GitHub Pages

The site is the repository root on `main` — static files, relative paths, so it
serves from a project subpath. `.nojekyll` stops Pages running it through Jekyll.

**Settings → Pages → Build and deployment → Source: Deploy from a branch**, then
pick **`main`** and **`/ (root)`**.

`CNAME` points the site at **needleinahaystack.politecarrot.com**; GitHub reads
it on every deploy, so it has to stay at the repository root. On a custom
domain the game is served from `/`, which suits the relative paths and gives
the service worker the whole origin as its scope.

## Layout

| Path | What it does |
| --- | --- |
| `index.html` | Canvas plus every UI overlay (menu, HUD, shop, cutscene, modals) |
| `css/style.css` | Barn-themed UI, responsive down to small phones |
| `js/world.js` | Renderer, barn geometry, hay piles, sifter, particles |
| `js/player.js` | Farmhand mesh, walk/dig animation, movement, camera rig |
| `js/game.js` | State, economy, barn flow, digging, input, save/load |
| `js/ui.js` | Screens, HUD, shop and wardrobe rendering |
| `js/cosmetics.js` | Outfits, hats, faces, shovel skins and their procedural textures |
| `js/wardrobe.js` | The My Farmer preview scene and its auto-framing |
| `js/helpers.js` | Hired farmhands: their round trip, steering and animation |
| `js/animals.js` | The yard livestock: how they are built and how they wander |
| `js/audio.js` | WebAudio sound effects |
| `js/haptics.js` | Vibration patterns, and the feature test that hides them on iOS |
| `sw.js` | Service worker: precaches the shell so the game runs offline |
| `manifest.webmanifest` | Web app manifest — name, colours, icons, display mode |
| `assets/` | Polite Carrot logo and wordmark, plus the app icon in SVG and PNG |
| `CNAME` | The custom domain GitHub Pages serves the game from |
| `vendor/three.min.js` | three.js r160 (MIT, see `vendor/three.LICENSE`) |

The original 2D tap version lives in this repo's git history, before the 3D rework.
