/* The yard livestock. Chickens, sheep, cows and a pig, built from boxes and
   spheres like everything else here, wandering the fenced paddock in front of
   the barn. They keep out of your way rather than blocking you. */
window.NIAH = window.NIAH || {};

NIAH.animals = (function () {
  const T = THREE;

  const M = (c, flat) => new T.MeshLambertMaterial({ color: c, flatShading: flat !== false });
  const MAT = {
    white:  M(0xf2efe6),
    wool:   M(0xe8e4d6),
    dark:   M(0x2a2420),
    pink:   M(0xe79a9a),
    pinker: M(0xd97f86),
    comb:   M(0xc8342f),
    beak:   M(0xe8a032),
    hoof:   M(0x3a2f27),
    udder:  M(0xe0a0a6),
  };

  let group = null;
  const herd = [];

  /* ------------------------------------------------------- builders */

  /* Each builder returns { group, legs, head, ride } — `ride` is the body
     height the walk bob is applied to. */

  function chicken() {
    const g = new T.Group();
    const body = new T.Mesh(new T.SphereGeometry(0.26, 9, 7), MAT.white);
    body.scale.set(1, 0.92, 1.25);
    body.position.y = 0.44;
    const tail = new T.Mesh(new T.ConeGeometry(0.15, 0.3, 5), MAT.white);
    tail.position.set(0, 0.56, -0.3);
    tail.rotation.x = -0.9;
    const head = new T.Group();
    head.position.set(0, 0.66, 0.2);
    const skull = new T.Mesh(new T.SphereGeometry(0.14, 8, 6), MAT.white);
    const comb = new T.Mesh(new T.BoxGeometry(0.05, 0.1, 0.16), MAT.comb);
    comb.position.y = 0.15;
    const beak = new T.Mesh(new T.ConeGeometry(0.05, 0.14, 5), MAT.beak);
    beak.position.set(0, -0.01, 0.16);
    beak.rotation.x = Math.PI / 2;
    const wattle = new T.Mesh(new T.SphereGeometry(0.04, 6, 5), MAT.comb);
    wattle.position.set(0, -0.1, 0.11);
    head.add(skull, comb, beak, wattle);
    g.add(body, tail, head);

    const legs = [];
    for (const sx of [-1, 1]) {
      const leg = new T.Group();
      leg.position.set(sx * 0.1, 0.3, 0);
      const shin = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, 0.3, 5), MAT.beak);
      shin.position.y = -0.15;
      const foot = new T.Mesh(new T.BoxGeometry(0.12, 0.03, 0.16), MAT.beak);
      foot.position.set(0, -0.29, 0.03);
      leg.add(shin, foot);
      g.add(leg);
      legs.push(leg);
    }
    return { group: g, legs, head, ride: body };
  }

  function sheep() {
    const g = new T.Group();
    const body = new T.Group();
    body.position.y = 0.74;
    // a cluster of wool lumps reads fluffier than one smooth body
    [[0, 0, 0, 0.46], [0.3, 0.06, 0.2, 0.3], [-0.3, 0.06, 0.2, 0.3],
     [0.3, 0.04, -0.22, 0.3], [-0.3, 0.04, -0.22, 0.3], [0, 0.26, 0, 0.32]]
      .forEach(([x, y, z, r]) => {
        const lump = new T.Mesh(new T.SphereGeometry(r, 8, 6), MAT.wool);
        lump.position.set(x, y, z);
        body.add(lump);
      });
    g.add(body);

    const head = new T.Group();
    head.position.set(0, 0.86, 0.52);
    const skull = new T.Mesh(new T.SphereGeometry(0.2, 8, 6), MAT.dark);
    skull.scale.set(0.9, 1, 1.25);
    const fringe = new T.Mesh(new T.SphereGeometry(0.16, 7, 6), MAT.wool);
    fringe.position.set(0, 0.13, -0.08);
    head.add(skull, fringe);
    for (const sx of [-1, 1]) {
      const ear = new T.Mesh(new T.BoxGeometry(0.16, 0.06, 0.1), MAT.dark);
      ear.position.set(sx * 0.21, 0.04, -0.02);
      ear.rotation.z = sx * 0.3;
      head.add(ear);
    }
    g.add(head);

    const legs = [];
    for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
      const leg = new T.Group();
      leg.position.set(sx * 0.26, 0.46, sz * 0.26);
      const shin = new T.Mesh(new T.BoxGeometry(0.12, 0.46, 0.12), MAT.dark);
      shin.position.y = -0.23;
      leg.add(shin);
      g.add(leg);
      legs.push(leg);
    }
    return { group: g, legs, head, ride: body };
  }

  function cow() {
    const g = new T.Group();
    const body = new T.Group();
    body.position.y = 1.1;
    const barrel = new T.Mesh(new T.BoxGeometry(0.98, 0.96, 1.9), MAT.white);
    body.add(barrel);
    /* Patches sit just proud of the hide so they never z-fight: thin slabs on
       the flanks, flat ones along the back. */
    const flank = (sx, y, z, h, len) => {
      const m = new T.Mesh(new T.BoxGeometry(0.05, h, len), MAT.dark);
      m.position.set(sx * 0.5, y, z);
      body.add(m);
    };
    const back = (x, z, w, len) => {
      const m = new T.Mesh(new T.BoxGeometry(w, 0.05, len), MAT.dark);
      m.position.set(x, 0.49, z);
      body.add(m);
    };
    flank(1, 0.16, 0.38, 0.42, 0.46);
    flank(1, -0.12, -0.42, 0.34, 0.5);
    flank(-1, -0.04, -0.28, 0.46, 0.44);
    flank(-1, 0.2, 0.5, 0.3, 0.34);
    back(0.16, -0.5, 0.4, 0.42);
    back(-0.2, 0.46, 0.34, 0.36);
    g.add(body);

    const head = new T.Group();
    head.position.set(0, 1.28, 1.12);
    const skull = new T.Mesh(new T.BoxGeometry(0.52, 0.5, 0.6), MAT.white);
    const muzzle = new T.Mesh(new T.BoxGeometry(0.4, 0.3, 0.24), MAT.pink);
    muzzle.position.set(0, -0.14, 0.36);
    head.add(skull, muzzle);
    for (const sx of [-1, 1]) {
      const ear = new T.Mesh(new T.BoxGeometry(0.22, 0.1, 0.14), MAT.white);
      ear.position.set(sx * 0.34, 0.14, -0.06);
      const horn = new T.Mesh(new T.ConeGeometry(0.06, 0.22, 5), MAT.wool);
      horn.position.set(sx * 0.18, 0.32, -0.04);
      horn.rotation.z = sx * 0.5;
      const eye = new T.Mesh(new T.SphereGeometry(0.05, 6, 5), MAT.dark);
      eye.position.set(sx * 0.19, 0.1, 0.29);
      head.add(ear, horn, eye);
    }
    g.add(head);

    const udder = new T.Mesh(new T.SphereGeometry(0.22, 7, 6), MAT.udder);
    udder.position.set(0, 0.68, -0.4);
    udder.scale.y = 0.8;
    g.add(udder);

    const tail = new T.Mesh(new T.BoxGeometry(0.07, 0.7, 0.07), MAT.white);
    tail.position.set(0, 1.2, -0.98);
    const tuft = new T.Mesh(new T.SphereGeometry(0.11, 6, 5), MAT.dark);
    tuft.position.set(0, 0.86, -0.98);
    g.add(tail, tuft);

    const legs = [];
    for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
      const leg = new T.Group();
      leg.position.set(sx * 0.36, 0.72, sz * 0.66);
      const shin = new T.Mesh(new T.BoxGeometry(0.2, 0.72, 0.2), MAT.white);
      shin.position.y = -0.36;
      const hoof = new T.Mesh(new T.BoxGeometry(0.22, 0.14, 0.24), MAT.hoof);
      hoof.position.y = -0.68;
      leg.add(shin, hoof);
      g.add(leg);
      legs.push(leg);
    }
    return { group: g, legs, head, ride: body };
  }

  function pig() {
    const g = new T.Group();
    const body = new T.Mesh(new T.SphereGeometry(0.46, 9, 7), MAT.pink);
    body.scale.set(0.95, 0.88, 1.35);
    body.position.y = 0.62;
    g.add(body);

    const head = new T.Group();
    head.position.set(0, 0.7, 0.58);
    const skull = new T.Mesh(new T.SphereGeometry(0.26, 8, 6), MAT.pink);
    const snout = new T.Mesh(new T.CylinderGeometry(0.14, 0.15, 0.16, 8), MAT.pinker);
    snout.position.set(0, -0.04, 0.26);
    snout.rotation.x = Math.PI / 2;
    head.add(skull, snout);
    for (const sx of [-1, 1]) {
      const ear = new T.Mesh(new T.ConeGeometry(0.1, 0.18, 4), MAT.pinker);
      ear.position.set(sx * 0.17, 0.24, -0.02);
      ear.rotation.set(-0.4, 0, sx * 0.3);
      const eye = new T.Mesh(new T.SphereGeometry(0.04, 6, 5), MAT.dark);
      eye.position.set(sx * 0.13, 0.07, 0.21);
      head.add(ear, eye);
    }
    g.add(head);

    const curl = new T.Mesh(new T.TorusGeometry(0.09, 0.025, 5, 9, Math.PI * 1.6), MAT.pinker);
    curl.position.set(0, 0.74, -0.62);
    curl.rotation.y = Math.PI / 2;
    g.add(curl);

    const legs = [];
    for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
      const leg = new T.Group();
      leg.position.set(sx * 0.24, 0.34, sz * 0.32);
      const shin = new T.Mesh(new T.BoxGeometry(0.14, 0.34, 0.14), MAT.pinker);
      shin.position.y = -0.17;
      leg.add(shin);
      g.add(leg);
      legs.push(leg);
    }
    return { group: g, legs, head, ride: body };
  }

  const KINDS = {
    chicken: { build: chicken, speed: 2.6, turn: 7, stride: 13, shy: 5.5, size: 0.5, rest: [0.4, 1.6] },
    sheep:   { build: sheep,   speed: 1.3, turn: 3, stride: 6,  shy: 3.2, size: 1.0, rest: [2.0, 5.0] },
    cow:     { build: cow,     speed: 1.1, turn: 2.4, stride: 4.5, shy: 3.6, size: 1.5, rest: [3.0, 7.0] },
    pig:     { build: pig,     speed: 1.7, turn: 4, stride: 8,  shy: 3.0, size: 1.0, rest: [1.5, 4.0] },
  };

  /* ---------------------------------------------------------- flock */

  function randIn(b) {
    return {
      x: b.yardMinX + 2.5 + Math.random() * (b.yardMaxX - b.yardMinX - 5),
      z: b.wallMaxZ + 3 + Math.random() * (b.maxZ - b.wallMaxZ - 6),
    };
  }

  function build(parent, b) {
    clear();
    if (!b) return;
    group = new T.Group();
    const roster = ['cow', 'cow', 'sheep', 'sheep', 'pig', 'chicken', 'chicken', 'chicken'];
    roster.forEach((kind) => {
      const spec = KINDS[kind];
      const made = spec.build();
      const at = randIn(b);
      const a = {
        kind, spec, mesh: made.group, legs: made.legs, head: made.head, ride: made.ride,
        baseY: made.ride.position.y,
        x: at.x, z: at.z, yaw: Math.random() * Math.PI * 2,
        target: randIn(b), rest: Math.random() * 4, phase: Math.random() * 7, spooked: 0,
      };
      made.group.position.set(a.x, 0, a.z);
      made.group.rotation.y = a.yaw;
      made.group.userData.animal = kind;
      group.add(made.group);
      herd.push(a);
    });
    parent.add(group);
    return group;
  }

  function clear() {
    herd.length = 0;
    group = null;      // the level group owns it and disposes it on teardown
  }

  function update(dt, bounds) {
    if (!group || !bounds) return;
    const p = NIAH.player && NIAH.player.position;

    for (const a of herd) {
      const s = a.spec;

      /* Give way rather than block: anything you walk into trots off, so the
         yard never becomes an obstacle course. */
      let fleeing = false;
      if (p) {
        const dx = a.x - p.x, dz = a.z - p.z;
        const d = Math.hypot(dx, dz);
        if (d < s.shy) {
          fleeing = true;
          a.spooked = 0.8;
          // stood exactly on it there is no "away", so pick a direction
          const ang = d > 0.05 ? Math.atan2(dx, dz) : Math.random() * Math.PI * 2;
          a.target = { x: a.x + Math.sin(ang) * 9, z: a.z + Math.cos(ang) * 9 };
        }
      }
      a.spooked = Math.max(0, a.spooked - dt);

      // keep the target inside the paddock
      a.target.x = Math.min(bounds.yardMaxX - 2, Math.max(bounds.yardMinX + 2, a.target.x));
      a.target.z = Math.min(bounds.maxZ - 2.5, Math.max(bounds.wallMaxZ + 2.5, a.target.z));

      const tx = a.target.x - a.x, tz = a.target.z - a.z;
      const dist = Math.hypot(tx, tz);

      if (!fleeing && a.rest > 0) {
        a.rest -= dt;
        // heads down, grazing
        if (a.head) a.head.rotation.x += (0.55 - a.head.rotation.x) * Math.min(1, dt * 3);
        a.legs.forEach((l) => { l.rotation.x += (0 - l.rotation.x) * Math.min(1, dt * 6); });
        a.ride.position.y = a.baseY;
        continue;
      }

      if (!fleeing && dist < 0.8) {
        a.rest = s.rest[0] + Math.random() * (s.rest[1] - s.rest[0]);
        a.target = randIn(bounds);
        continue;
      }

      if (a.head) a.head.rotation.x += (0 - a.head.rotation.x) * Math.min(1, dt * 5);

      // turn toward the target, then walk
      const want = Math.atan2(tx, tz);
      const delta = ((want - a.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      a.yaw += delta * Math.min(1, dt * s.turn);
      const speed = s.speed * (a.spooked > 0 ? 2.1 : 1);
      a.x += Math.sin(a.yaw) * speed * dt;
      a.z += Math.cos(a.yaw) * speed * dt;

      a.mesh.position.set(a.x, 0, a.z);
      a.mesh.rotation.y = a.yaw;

      // legs and a little bob
      a.phase += dt * s.stride * (a.spooked > 0 ? 1.7 : 1);
      const swing = Math.sin(a.phase) * 0.5;
      a.legs.forEach((l, i) => { l.rotation.x = (i % 2 ? -swing : swing) * (i < 2 ? 1 : -1); });
      a.ride.position.y = a.baseY + Math.abs(Math.sin(a.phase)) * 0.04;
    }
  }

  return { build, update, clear, get count() { return herd.length; } };
})();
