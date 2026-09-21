/* The farmhand: low-poly character, procedural walk/dig animation, camera rig. */
window.NIAH = window.NIAH || {};

NIAH.player = (function () {
  const T = THREE;

  const MAT = {
    denim:  new T.MeshLambertMaterial({ color: 0x3f6390 }),
    shirt:  new T.MeshLambertMaterial({ color: 0xc9543f }),
    skin:   new T.MeshLambertMaterial({ color: 0xe8b98c }),
    boot:   new T.MeshLambertMaterial({ color: 0x3a2413 }),
    hat:    new T.MeshLambertMaterial({ color: 0xe0b657, flatShading: true }),
    handle: new T.MeshLambertMaterial({ color: 0x8b5a2b }),
    blade:  new T.MeshLambertMaterial({ color: 0xcdd6dd, flatShading: true }),
    hay:    new T.MeshLambertMaterial({ color: 0xe0b043, flatShading: true }),
    shadow: new T.MeshBasicMaterial({ color: 0x120c05, transparent: true, opacity: 0.35, depthWrite: false }),
  };

  const CARRY = -2.45;   // shaft over the shoulder, blade up, when not digging
  const parts = {};
  let group = null, playerRig = null;
  const pos = new T.Vector3();
  const vel = new T.Vector3();
  let yaw = Math.PI;               // facing -Z is "into the barn"
  let walkPhase = 0, digPhase = 0, action = 'idle', speedNow = 0;
  let camYaw = Math.PI, camDistance = 12.5, stepFlag = false;
  const tmp = new T.Vector3();

  /* ----------------------------------------------------------- build */

  /* Builds one farmhand rig. The player uses one; the wardrobe preview uses
     another, so this returns the rig rather than keeping a singleton. */
  function buildRig() {
    const g = new T.Group();
    const p = { shirtMeshes: [], trouserMeshes: [] };

    const hips = new T.Group();
    hips.position.y = 0.95;
    g.add(hips);
    p.hips = hips;

    const torso = new T.Mesh(new T.BoxGeometry(0.8, 0.95, 0.46), MAT.denim);
    torso.position.y = 0.48;
    hips.add(torso);
    p.trouserMeshes.push(torso);

    const chest = new T.Mesh(new T.BoxGeometry(0.84, 0.42, 0.5), MAT.shirt);
    chest.position.y = 0.82;
    hips.add(chest);
    p.shirtMeshes.push(chest);

    const head = new T.Mesh(new T.SphereGeometry(0.3, 12, 10), MAT.skin);
    head.position.y = 1.28;
    hips.add(head);
    p.head = head;

    // faces are built by the cosmetics module and hung on the head itself,
    // so they turn with it
    const faceAnchor = new T.Group();
    head.add(faceAnchor);
    p.faceAnchor = faceAnchor;
    p.face = null;

    // hats are built by the cosmetics module and hung off this anchor
    const hatAnchor = new T.Group();
    hatAnchor.position.y = 1.4;
    hips.add(hatAnchor);
    p.hatAnchor = hatAnchor;
    p.hat = null;

    const legGeo = new T.BoxGeometry(0.3, 0.82, 0.32);
    const bootGeo = new T.BoxGeometry(0.34, 0.2, 0.44);
    ['L', 'R'].forEach((side, i) => {
      const sx = i === 0 ? -1 : 1;
      const leg = new T.Group();
      leg.position.set(sx * 0.22, 0, 0);
      const thigh = new T.Mesh(legGeo, MAT.denim);
      thigh.position.y = -0.41;
      const boot = new T.Mesh(bootGeo, MAT.boot);
      boot.position.set(0, -0.88, 0.05);
      leg.add(thigh, boot);
      hips.add(leg);
      p['leg' + side] = leg;
      p.trouserMeshes.push(thigh);

      const arm = new T.Group();
      arm.position.set(sx * 0.52, 0.86, 0);
      const upper = new T.Mesh(new T.BoxGeometry(0.22, 0.78, 0.24), MAT.shirt);
      upper.position.y = -0.36;
      const hand = new T.Mesh(new T.SphereGeometry(0.14, 8, 6), MAT.skin);
      hand.position.y = -0.76;
      arm.add(upper, hand);
      hips.add(arm);
      p['arm' + side] = arm;
      p.shirtMeshes.push(upper);
    });

    const shadow = new T.Mesh(new T.CircleGeometry(0.62, 14), MAT.shadow);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.04;
    g.add(shadow);
    p.shadow = shadow;

    return { group: g, parts: p };
  }

  function create(scene) {
    const rig = buildRig();
    group = rig.group;
    Object.assign(parts, rig.parts);
    playerRig = rig;
    scene.add(group);
    return group;
  }

  function place(x, z, facing) {
    pos.set(x, 0, z);
    vel.set(0, 0, 0);
    yaw = facing !== undefined ? facing : Math.PI;
    camYaw = yaw;
    group.position.copy(pos);
    group.rotation.y = yaw;
  }

  /* -------------------------------------------------------- movement */

  function collide(world) {
    const b = world.bounds;
    if (!b) return;

    // hay piles push the player out
    for (const p of world.piles) {
      if (!p.group.visible) continue;
      const r = 1.3 + 1.9 * p.cone.scale.x;
      const dx = pos.x - p.x, dz = pos.z - p.z;
      const d = Math.hypot(dx, dz);
      if (d < r && d > 0.0001) {
        pos.x = p.x + (dx / d) * r;
        pos.z = p.z + (dz / d) * r;
      }
    }

    // the sifter, whose footprint the world reports
    const c = world.cart && world.cart.collide;
    if (c) {
      const dx = pos.x - c.x, dz = pos.z - c.z;
      if (Math.abs(dx) < c.hx && Math.abs(dz) < c.hz) {
        if (c.hx - Math.abs(dx) < c.hz - Math.abs(dz)) pos.x = c.x + Math.sign(dx || 1) * c.hx;
        else pos.z = c.z + Math.sign(dz || 1) * c.hz;
      }
    }

    // walls, with a gap where the doors are
    pos.x = Math.max(b.minX, Math.min(b.maxX, pos.x));
    pos.z = Math.max(b.minZ, pos.z);
    if (pos.z > b.innerMaxZ) {
      if (Math.abs(pos.x) > b.doorHalf) pos.z = b.innerMaxZ;
      else pos.z = Math.min(b.maxZ, pos.z);
    }
  }

  function update(dt, input, world, opts) {
    const o = opts || {};
    const maxSpeed = o.speed || 6;
    const locked = o.locked;

    let ix = 0, iz = 0;
    if (!locked && input) { ix = input.x; iz = input.y; }
    const mag = Math.min(1, Math.hypot(ix, iz));

    if (mag > 0.05) {
      // input is camera-relative: rotate it by the camera yaw
      // forward is (sin, cos) of the camera yaw; screen-right is (-cos, sin)
      const cos = Math.cos(camYaw), sin = Math.sin(camYaw);
      const dirX = iz * sin - ix * cos;
      const dirZ = iz * cos + ix * sin;
      const len = Math.hypot(dirX, dirZ) || 1;
      const target = maxSpeed * mag;
      vel.x += ((dirX / len) * target - vel.x) * Math.min(1, dt * 12);
      vel.z += ((dirZ / len) * target - vel.z) * Math.min(1, dt * 12);
      yaw = Math.atan2(vel.x, vel.z);
    } else {
      vel.x -= vel.x * Math.min(1, dt * 14);
      vel.z -= vel.z * Math.min(1, dt * 14);
    }

    pos.x += vel.x * dt;
    pos.z += vel.z * dt;
    collide(world);

    speedNow = Math.hypot(vel.x, vel.z);
    group.position.copy(pos);
    group.rotation.y += ((yaw - group.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * 12);

    animate(dt);
    return speedNow;
  }

  function animate(dt) {
    const moving = speedNow > 0.4;
    walkPhase += dt * (moving ? 2.2 + speedNow * 1.25 : 0);

    // footsteps
    const s = Math.sin(walkPhase);
    if (moving && s > 0 !== stepFlag) {
      stepFlag = s > 0;
      if (stepFlag) NIAH.audio.step();
    }

    const swing = moving ? Math.sin(walkPhase) * 0.75 : 0;
    parts.legL.rotation.x = swing;
    parts.legR.rotation.x = -swing;
    parts.hips.position.y = 0.95 + (moving ? Math.abs(Math.sin(walkPhase * 2)) * 0.07 : Math.sin(performance.now() / 900) * 0.02);
    parts.hips.rotation.z = moving ? Math.sin(walkPhase) * 0.04 : 0;
    parts.head.rotation.y = moving ? Math.sin(walkPhase * 0.5) * 0.12 : 0;

    if (!parts.shovel) return;
    if (action === 'dig') {
      digPhase += dt * 6.5;
      const d = Math.sin(digPhase);
      parts.armR.rotation.x = -0.4 + d * 1.15;
      parts.armL.rotation.x = -0.3 + d * 0.9;
      parts.hips.rotation.x = 0.16 + d * 0.12;
      parts.shovel.rotation.x = -0.15 - d * 0.5;
    } else if (action === 'hold') {
      // arm swings up and settles, with a small proud sway
      digPhase += dt * 3.4;
      const raise = Math.min(1, digPhase);
      const e = raise * raise * (3 - 2 * raise);
      const sway = Math.sin(digPhase * 1.6) * 0.05 * e;
      parts.armR.rotation.x = -e * 2.75 + sway;
      parts.armR.rotation.z = -e * 0.22;
      parts.armL.rotation.x = e * 0.45;
      parts.hips.rotation.x = -e * 0.14;
      parts.head.rotation.x = -e * 0.2;
      /* The needle hangs off the arm, so it inherits the arm's rotation and
         would end up pointing at the floor. Cancel that out and it stays
         upright in the hand however far the arm has swung. */
      if (parts.heldNeedle) parts.heldNeedle.rotation.x = -parts.armR.rotation.x - 0.22;
    } else if (action === 'dump') {
      digPhase += dt * 5;
      const d = Math.sin(Math.min(Math.PI, digPhase));
      parts.armR.rotation.x = -d * 2.1;
      parts.armL.rotation.x = -d * 1.7;
      parts.hips.rotation.x = -d * 0.2;
      parts.shovel.rotation.x = CARRY + d * 1.6;
    } else {
      digPhase = 0;
      parts.armR.rotation.x = -swing * 0.65;
      parts.armR.rotation.z += (0 - parts.armR.rotation.z) * Math.min(1, dt * 8);
      parts.armL.rotation.x = swing * 0.65;
      parts.head.rotation.x += (0 - parts.head.rotation.x) * Math.min(1, dt * 8);
      parts.hips.rotation.x += (0 - parts.hips.rotation.x) * Math.min(1, dt * 8);
      parts.shovel.rotation.x += (CARRY - parts.shovel.rotation.x) * Math.min(1, dt * 8);
    }
  }

  /* ---------------------------------------------------------- camera */

  function updateCamera(camera, dt, mode, instant, bounds) {
    if (mode === 'first') {
      camera.position.set(pos.x, 1.95, pos.z);
      camera.position.x -= Math.sin(group.rotation.y) * 0.1;
      camera.position.z -= Math.cos(group.rotation.y) * 0.1;
      tmp.set(pos.x + Math.sin(group.rotation.y) * 6, 1.6, pos.z + Math.cos(group.rotation.y) * 6);
      camera.lookAt(tmp);
      camYaw = group.rotation.y;
      return;
    }
    // follow camera trails behind the direction of travel
    if (speedNow > 0.6) {
      const delta = ((yaw - camYaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      camYaw += delta * Math.min(1, dt * 2.2);
    }
    // the boom runs backwards from the player; shorten it rather than let it
    // punch through a wall, and lift it as it shortens so the view stays useful
    const dirX = -Math.sin(camYaw), dirZ = -Math.cos(camYaw);
    let back = camDistance * (camera.aspect < 0.8 ? 1.15 : 1);
    if (bounds && pos.z < bounds.innerMaxZ - 0.5) {
      const m = 1.8;
      const hitX = dirX > 0.001 ? (bounds.maxX - m - pos.x) / dirX
                 : dirX < -0.001 ? (bounds.minX + m - pos.x) / dirX : Infinity;
      // the open doorway is a hole the camera may back out through
      const zLimit = Math.abs(pos.x + dirX * back) < bounds.doorHalf ? bounds.maxZ : bounds.innerMaxZ - m;
      const hitZ = dirZ > 0.001 ? (zLimit - pos.z) / dirZ
                 : dirZ < -0.001 ? (bounds.minZ + m - pos.z) / dirZ : Infinity;
      back = Math.min(back, Math.max(4.5, Math.min(hitX, hitZ)));
    }
    const lift = 7.8 + Math.max(0, camDistance - back) * 0.42;
    const want = tmp.set(pos.x + dirX * back, Math.min(10.2, lift), pos.z + dirZ * back);
    if (instant) camera.position.copy(want);
    else camera.position.lerp(want, Math.min(1, dt * 4.5));
    const ahead = 3.4 * Math.min(1, back / camDistance);
    camera.lookAt(pos.x + Math.sin(camYaw) * ahead, 2.3, pos.z + Math.cos(camYaw) * ahead);
  }

  function nudgeCamera(dx) { camYaw -= dx; }

  function faceTowards(x, z) {
    yaw = Math.atan2(x - pos.x, z - pos.z);
  }

  /* ----------------------------------------------------------- state */

  function setAction(a) {
    if (action !== a) digPhase = 0;
    action = a;
  }

  /* The needle, pinched between finger and thumb and held up to the light.
     The shovel goes out of sight while it is up — one prop at a time. */
  function holdNeedle(on) {
    if (on && !parts.heldNeedle) {
      const g = new T.Group();
      const steel = new T.MeshLambertMaterial({ color: 0xeef3f7, flatShading: true });
      const shaft = new T.Mesh(new T.CylinderGeometry(0.024, 0.008, 0.62, 6), steel);
      shaft.position.y = 0.3;
      const eye = new T.Mesh(new T.TorusGeometry(0.05, 0.019, 6, 10), steel);
      eye.position.y = 0.6;
      eye.rotation.y = Math.PI / 2;
      const glow = new T.PointLight(0xfff0c0, 9, 7, 2);
      glow.position.y = 0.42;
      g.add(shaft, eye, glow);
      g.position.set(0.02, -0.72, 0.04);
      parts.armR.add(g);
      parts.heldNeedle = g;
    } else if (!on && parts.heldNeedle) {
      parts.armR.remove(parts.heldNeedle);
      parts.heldNeedle.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
      parts.heldNeedle = null;
    }
    if (parts.shovel) parts.shovel.visible = !on;
  }
  function setLoadVisual(fraction) {
    if (!parts.load) return;
    const f = Math.max(0, Math.min(1, fraction));
    const s = f <= 0.001 ? 0.02 : 0.35 + f * 0.9;
    parts.load.scale.set(s, Math.max(0.02, f * 1.3), s);
    parts.load.visible = f > 0.001;
  }
  function applyLook(look, tier) {
    if (!playerRig) return;
    NIAH.cosmetics.applyLook(playerRig, look, tier);
    parts.shovel = playerRig.parts.shovel;
    parts.blade = playerRig.parts.blade;
    parts.load = playerRig.parts.load;
    parts.hat = playerRig.parts.hat;
  }

  return {
    create, buildRig, place, update, updateCamera, nudgeCamera, setAction, setLoadVisual, applyLook,
    holdNeedle, faceTowards,
    get position() { return pos; },
    get yaw() { return yaw; },
    get speed() { return speedNow; },
    get group() { return group; },
    set camYaw(v) { camYaw = v; },
    get camYaw() { return camYaw; },
  };
})();
