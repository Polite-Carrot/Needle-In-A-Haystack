/* My Farmer — outfits, hats and shovel skins. Everything is built from
   geometry and procedurally drawn textures, so there are no art assets. */
window.NIAH = window.NIAH || {};

NIAH.cosmetics = (function () {
  const T = THREE;

  /* ------------------------------------------------------- textures */

  const texCache = {};
  function canvasTex(key, w, h, draw) {
    if (texCache[key]) return texCache[key];
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    tex.anisotropy = 2;
    texCache[key] = tex;
    return tex;
  }

  function bandsTex(key, colors, vertical, weights) {
    const wts = weights || colors.map(() => 1);
    const total = wts.reduce((a, b) => a + b, 0);
    return canvasTex(key, vertical ? 120 : 90, vertical ? 80 : 120, (g, w, h) => {
      let at = 0;
      colors.forEach((c, i) => {
        const size = (wts[i] / total) * (vertical ? w : h);
        g.fillStyle = c;
        if (vertical) g.fillRect(at, 0, Math.ceil(size), h);
        else g.fillRect(0, at, w, Math.ceil(size));
        at += size;
      });
    });
  }

  /* A cross laid on a ground: centred (England) or offset toward the hoist
     the way the Nordic flags do it. */
  function crossTex(key, bg, cross, nordic, inner) {
    return canvasTex(key, 128, 88, (g, w, h) => {
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      const cx = nordic ? w * 0.34 : w / 2;
      const bar = h * (inner ? 0.26 : 0.18);
      g.fillStyle = cross;
      g.fillRect(cx - bar / 2, 0, bar, h);
      g.fillRect(0, h / 2 - bar / 2, w, bar);
      if (inner) {
        g.fillStyle = inner;
        const b2 = bar * 0.45;
        g.fillRect(cx - b2 / 2, 0, b2, h);
        g.fillRect(0, h / 2 - b2 / 2, w, b2);
      }
    });
  }

  /* A diagonal cross — Scotland, Jamaica. */
  function saltireTex(key, bg, cross, quarters) {
    return canvasTex(key, 128, 88, (g, w, h) => {
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      if (quarters) {
        g.fillStyle = quarters;
        g.beginPath(); g.moveTo(0, 0); g.lineTo(w / 2, h / 2); g.lineTo(w, 0); g.closePath(); g.fill();
        g.beginPath(); g.moveTo(0, h); g.lineTo(w / 2, h / 2); g.lineTo(w, h); g.closePath(); g.fill();
      }
      g.strokeStyle = cross;
      g.lineWidth = h * 0.2;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h); g.moveTo(w, 0); g.lineTo(0, h); g.stroke();
    });
  }

  /* Bands with something in the middle: Japan, Mexico, India, Argentina. */
  function bandsDiscTex(key, colors, vertical, disc) {
    return canvasTex(key, vertical ? 128 : 96, vertical ? 86 : 128, (g, w, h) => {
      const size = (vertical ? w : h) / colors.length;
      colors.forEach((c, i) => {
        g.fillStyle = c;
        if (vertical) g.fillRect(i * size, 0, Math.ceil(size), h);
        else g.fillRect(0, i * size, w, Math.ceil(size));
      });
      if (!disc) return;
      const r = Math.min(w, h) * (disc.r || 0.16);
      g.fillStyle = disc.color;
      if (disc.ring) {
        g.strokeStyle = disc.color;
        g.lineWidth = Math.max(2, r * 0.22);
        g.beginPath(); g.arc(w / 2, h / 2, r, 0, 7); g.stroke();
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          g.beginPath();
          g.moveTo(w / 2, h / 2);
          g.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r);
          g.stroke();
        }
      } else if (disc.sun) {
        g.beginPath(); g.arc(w / 2, h / 2, r * 0.6, 0, 7); g.fill();
        g.strokeStyle = disc.color;
        g.lineWidth = Math.max(2, r * 0.2);
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          g.beginPath();
          g.moveTo(w / 2 + Math.cos(a) * r * 0.75, h / 2 + Math.sin(a) * r * 0.75);
          g.lineTo(w / 2 + Math.cos(a) * r * 1.25, h / 2 + Math.sin(a) * r * 1.25);
          g.stroke();
        }
      } else {
        g.beginPath(); g.arc(w / 2, h / 2, r, 0, 7); g.fill();
      }
    });
  }

  /* Blocky digital camo, as opposed to the soft blobs above. */
  function pixelCamo(key, colors) {
    return canvasTex(key, 64, 64, (g) => {
      const cell = 8;
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          g.fillStyle = colors[Math.floor(Math.random() * colors.length)];
          g.fillRect(x * cell, y * cell, cell, cell);
          if (Math.random() < 0.5) {
            g.fillStyle = colors[Math.floor(Math.random() * colors.length)];
            g.fillRect(x * cell + cell / 2, y * cell, cell / 2, cell / 2);
          }
        }
      }
    });
  }

  function stripeTex(key, base, stripe, count, wobble) {
    return canvasTex(key, 96, 96, (g, w, h) => {
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      g.strokeStyle = stripe;
      g.lineCap = 'round';
      for (let i = 0; i < count; i++) {
        g.lineWidth = wobble ? 4 + Math.random() * 7 : 5;
        g.beginPath();
        const y = (i / count) * h + 4;
        g.moveTo(-4, y);
        if (wobble) {
          g.bezierCurveTo(w * 0.3, y + 10, w * 0.6, y - 12, w + 4, y + 4);
        } else {
          g.lineTo(w + 4, y);
        }
        g.stroke();
      }
    });
  }

  function camoTex(key, colors) {
    return canvasTex(key, 128, 128, (g, w, h) => {
      g.fillStyle = colors[0];
      g.fillRect(0, 0, w, h);
      // blobs, drawn wrapped so the pattern tiles without a visible seam
      for (let i = 1; i < colors.length; i++) {
        g.fillStyle = colors[i];
        for (let n = 0; n < 16; n++) {
          const x = Math.random() * w, y = Math.random() * h;
          const r = 9 + Math.random() * 15;
          for (const [ox, oy] of [[0, 0], [w, 0], [-w, 0], [0, h], [0, -h]]) {
            g.beginPath();
            for (let a = 0; a < 7; a++) {
              const ang = (a / 7) * Math.PI * 2;
              const rr = r * (0.6 + Math.random() * 0.7);
              const px = x + ox + Math.cos(ang) * rr;
              const py = y + oy + Math.sin(ang) * rr;
              a ? g.lineTo(px, py) : g.moveTo(px, py);
            }
            g.closePath();
            g.fill();
          }
        }
      }
    });
  }

  const TEXTURES = {
    camoWoodland: () => camoTex('camoWoodland', ['#4a5834', '#2f3a22', '#6b7a47', '#25301b']),
    camoDesert:   () => camoTex('camoDesert', ['#cbb188', '#a8895c', '#e0d0a8', '#7d6440']),
    camoPink:     () => camoTex('camoPink', ['#ff8fc4', '#d9508f', '#ffd0e6', '#a63472']),
    camoUrban:    () => camoTex('camoUrban', ['#6d7178', '#43474d', '#9aa0a8', '#2b2e33']),
    camoSnow:     () => camoTex('camoSnow', ['#e8eef4', '#c2cdd8', '#ffffff', '#93a2b0']),
    camoNavy:     () => camoTex('camoNavy', ['#24486e', '#16304a', '#3f6f9c', '#0d1c2b']),
    camoDigital:  () => pixelCamo('camoDigital', ['#5c6b4a', '#3c472f', '#8a9a6d', '#28301f']),
    camoTiger:    () => stripeTex('camoTiger', '#c98a2e', '#2a2018', 9, true),
    cow:          () => camoTex('cow', ['#f6f2ea', '#20201e', '#f6f2ea', '#20201e']),
    pinstripe:    () => stripeTex('pinstripe', '#232838', '#b9c2d6', 12, false),
    racing:       () => canvasTex('racing', 96, 96, (g, w, h) => {
      g.fillStyle = '#e8eaee'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#c8322f'; g.fillRect(w * 0.3, 0, w * 0.12, h); g.fillRect(w * 0.55, 0, w * 0.12, h);
      g.fillStyle = '#1e2a4a'; g.fillRect(w * 0.44, 0, w * 0.09, h);
    }),
    boiler:       () => canvasTex('boiler', 64, 64, (g, w, h) => {
      g.fillStyle = '#2f6f5e'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, h * 0.46, w, h * 0.08);
      g.fillStyle = '#d8b24a'; g.fillRect(w * 0.1, h * 0.2, w * 0.16, h * 0.1);
    }),
    flagSCT:  () => saltireTex('flagSCT', '#005EB8', '#FFFFFF'),
    flagENG:  () => crossTex('flagENG', '#FFFFFF', '#CE1124', false),
    flagNL:   () => bandsTex('flagNL', ['#AE1C28', '#FFFFFF', '#21468B'], false),
    flagPL:   () => bandsTex('flagPL', ['#FFFFFF', '#DC143C'], false),
    flagNO:   () => crossTex('flagNO', '#BA0C2F', '#FFFFFF', true, '#00205B'),
    flagDK:   () => crossTex('flagDK', '#C60C30', '#FFFFFF', true),
    flagFI:   () => crossTex('flagFI', '#FFFFFF', '#003580', true),
    flagGR:   () => canvasTex('flagGR', 135, 90, (g, w, h) => {
      for (let i = 0; i < 9; i++) {
        g.fillStyle = i % 2 ? '#FFFFFF' : '#0D5EAF';
        g.fillRect(0, (i * h) / 9, w, h / 9 + 1);
      }
      g.fillStyle = '#0D5EAF'; g.fillRect(0, 0, (h / 9) * 5, (h / 9) * 5);
      g.fillStyle = '#FFFFFF';
      const b = (h / 9) * 5, t = b * 0.2;
      g.fillRect(b / 2 - t / 2, 0, t, b);
      g.fillRect(0, b / 2 - t / 2, b, t);
    }),
    flagMX:   () => bandsDiscTex('flagMX', ['#006847', '#FFFFFF', '#CE1126'], true, { color: '#7a5a2e', r: 0.13 }),
    flagAR:   () => bandsDiscTex('flagAR', ['#74ACDF', '#FFFFFF', '#74ACDF'], false, { color: '#F6B40E', r: 0.14, sun: true }),
    flagIN:   () => bandsDiscTex('flagIN', ['#FF9933', '#FFFFFF', '#138808'], false, { color: '#000088', r: 0.13, ring: true }),
    flagJM:   () => saltireTex('flagJM', '#000000', '#FFB915', '#009B3A'),
    flagAU:   () => canvasTex('flagAU', 128, 64, (g, w, h) => {
      g.fillStyle = '#00247D'; g.fillRect(0, 0, w, h);
      // union canton, quartered
      const cw = w * 0.5, ch = h * 0.5;
      g.save();
      g.beginPath(); g.rect(0, 0, cw, ch); g.clip();
      g.strokeStyle = '#FFFFFF'; g.lineWidth = 7;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(cw, ch); g.moveTo(cw, 0); g.lineTo(0, ch); g.stroke();
      g.strokeStyle = '#CF142B'; g.lineWidth = 3.5;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(cw, ch); g.moveTo(cw, 0); g.lineTo(0, ch); g.stroke();
      g.strokeStyle = '#FFFFFF'; g.lineWidth = 11;
      g.beginPath(); g.moveTo(cw / 2, 0); g.lineTo(cw / 2, ch); g.moveTo(0, ch / 2); g.lineTo(cw, ch / 2); g.stroke();
      g.strokeStyle = '#CF142B'; g.lineWidth = 6;
      g.beginPath(); g.moveTo(cw / 2, 0); g.lineTo(cw / 2, ch); g.moveTo(0, ch / 2); g.lineTo(cw, ch / 2); g.stroke();
      g.restore();
      g.fillStyle = '#FFFFFF';
      const star = (x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
      star(w * 0.25, h * 0.78, 4);
      star(w * 0.72, h * 0.22, 3.4); star(w * 0.83, h * 0.45, 3);
      star(w * 0.7, h * 0.7, 3); star(w * 0.86, h * 0.78, 2.4); star(w * 0.78, h * 0.5, 2);
    }),
    hiVis: () => canvasTex('hiVis', 64, 64, (g, w, h) => {
      g.fillStyle = '#d8f235'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#9aa7b0'; g.fillRect(0, h * 0.34, w, h * 0.12); g.fillRect(0, h * 0.62, w, h * 0.12);
      g.fillStyle = '#e8f7ff'; g.fillRect(0, h * 0.46, w, h * 0.04); g.fillRect(0, h * 0.74, w, h * 0.04);
    }),
    check: () => canvasTex('check', 64, 64, (g, w, h) => {
      g.fillStyle = '#8c2f2a'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(20,10,8,.55)';
      for (let i = 0; i < 4; i++) { g.fillRect(i * 16, 0, 7, h); g.fillRect(0, i * 16, w, 7); }
      g.fillStyle = 'rgba(255,230,200,.25)';
      for (let i = 0; i < 4; i++) { g.fillRect(i * 16 + 9, 0, 3, h); g.fillRect(0, i * 16 + 9, w, 3); }
    }),
    /* Simple band helper: colours across (vertical) or down (horizontal),
       with optional weights for flags whose middle band is wider. */
    flagIE: () => bandsTex('flagIE', ['#169B62', '#FFFFFF', '#FF883E'], true),
    flagFR: () => bandsTex('flagFR', ['#002395', '#FFFFFF', '#ED2939'], true),
    flagIT: () => bandsTex('flagIT', ['#008C45', '#F4F5F0', '#CD212A'], true),
    flagDE: () => bandsTex('flagDE', ['#000000', '#DD0000', '#FFCE00'], false),
    flagES: () => bandsTex('flagES', ['#AA151B', '#F1BF00', '#AA151B'], false, [1, 2, 1]),
    flagJP: () => canvasTex('flagJP', 120, 80, (g, w, h) => {
      g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#BC002D';
      g.beginPath(); g.arc(w / 2, h / 2, h * 0.3, 0, 7); g.fill();
    }),
    flagCH: () => canvasTex('flagCH', 80, 80, (g, w, h) => {
      g.fillStyle = '#D52B1E'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#FFFFFF';
      g.fillRect(w * 0.4, h * 0.2, w * 0.2, h * 0.6);
      g.fillRect(w * 0.2, h * 0.4, w * 0.6, h * 0.2);
    }),
    flagSE: () => canvasTex('flagSE', 128, 80, (g, w, h) => {
      g.fillStyle = '#006AA7'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#FECC00';
      g.fillRect(w * 0.28, 0, w * 0.13, h);
      g.fillRect(0, h * 0.43, w, h * 0.16);
    }),
    flagCA: () => canvasTex('flagCA', 120, 60, (g, w, h) => {
      g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#D80621';
      g.fillRect(0, 0, w * 0.25, h); g.fillRect(w * 0.75, 0, w * 0.25, h);
      // a maple leaf, near enough at this size
      g.beginPath();
      const cx = w / 2, cy = h * 0.54, r = h * 0.3;
      for (let i = 0; i < 11; i++) {
        const a = -Math.PI / 2 + (i / 11) * Math.PI * 2;
        const rr = i % 2 ? r * 0.42 : r;
        g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 1.05);
      }
      g.closePath(); g.fill();
      g.fillRect(cx - w * 0.012, cy + r * 0.6, w * 0.024, h * 0.16);
    }),
    flagBR: () => canvasTex('flagBR', 120, 84, (g, w, h) => {
      g.fillStyle = '#009B3A'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#FEDF00';
      g.beginPath();
      g.moveTo(w / 2, h * 0.1); g.lineTo(w * 0.9, h / 2);
      g.lineTo(w / 2, h * 0.9); g.lineTo(w * 0.1, h / 2);
      g.closePath(); g.fill();
      g.fillStyle = '#002776';
      g.beginPath(); g.arc(w / 2, h / 2, h * 0.22, 0, 7); g.fill();
      g.strokeStyle = '#FFFFFF'; g.lineWidth = 3;
      g.beginPath(); g.arc(w / 2, h * 0.68, h * 0.22, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
    }),
    flagUK: () => canvasTex('flagUK', 120, 60, (g, w, h) => {
      g.fillStyle = '#012169'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#fff'; g.lineWidth = 14;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h); g.moveTo(w, 0); g.lineTo(0, h); g.stroke();
      g.strokeStyle = '#C8102E'; g.lineWidth = 7;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h); g.moveTo(w, 0); g.lineTo(0, h); g.stroke();
      g.strokeStyle = '#fff'; g.lineWidth = 22;
      g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
      g.strokeStyle = '#C8102E'; g.lineWidth = 12;
      g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
    }),
    flagUS: () => canvasTex('flagUS', 120, 63, (g, w, h) => {
      for (let i = 0; i < 7; i++) {
        g.fillStyle = i % 2 ? '#fff' : '#B22234';
        g.fillRect(0, (i * h) / 6.5, w, h / 13);
      }
      g.fillStyle = '#B22234';
      for (let i = 0; i < 7; i++) g.fillRect(0, (i * h) / 6.5, w, h / 13);
      g.fillStyle = '#fff';
      for (let i = 0; i < 6; i++) g.fillRect(0, (i * h) / 6.5 + h / 13, w, h / 13);
      g.fillStyle = '#3C3B6E'; g.fillRect(0, 0, w * 0.42, h * 0.54);
      g.fillStyle = '#fff';
      for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {
        g.beginPath(); g.arc(w * 0.05 + c * w * 0.08, h * 0.08 + r * h * 0.13, 2.1, 0, 7); g.fill();
      }
    }),
    jolly: () => canvasTex('jolly', 96, 96, (g, w, h) => {
      g.fillStyle = '#12100e'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#f4efe4';
      g.beginPath(); g.ellipse(w / 2, h * 0.42, 22, 25, 0, 0, 7); g.fill();
      g.fillRect(w / 2 - 15, h * 0.58, 30, 12);
      g.fillStyle = '#12100e';
      g.beginPath(); g.arc(w / 2 - 8, h * 0.4, 6, 0, 7); g.arc(w / 2 + 8, h * 0.4, 6, 0, 7); g.fill();
      g.fillRect(w / 2 - 3, h * 0.52, 6, 7);
      g.strokeStyle = '#f4efe4'; g.lineWidth = 7; g.lineCap = 'round';
      g.beginPath(); g.moveTo(14, h - 14); g.lineTo(w - 14, h - 34); g.moveTo(14, h - 34); g.lineTo(w - 14, h - 14); g.stroke();
    }),
    disco: () => canvasTex('disco', 64, 64, (g, w, h) => {
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
        g.fillStyle = `hsl(${(x * 37 + y * 61) % 360}, 85%, ${55 + ((x + y) % 3) * 12}%)`;
        g.fillRect(x * 8, y * 8, 8, 8);
      }
    }),
    rosette: () => canvasTex('rosette', 96, 96, (g, w, h) => {
      g.fillStyle = '#6d1224'; g.fillRect(0, 0, w, h);
      // show rosettes, pinned in rows
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
        const x = 16 + c * 32 + (r % 2) * 8, y = 16 + r * 32;
        g.fillStyle = '#f3d477';
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2;
          g.beginPath(); g.ellipse(x + Math.cos(a) * 7, y + Math.sin(a) * 7, 4.5, 3, a, 0, 7); g.fill();
        }
        g.fillStyle = '#c8102e';
        g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill();
        g.fillStyle = '#f3d477';
        g.fillRect(x - 4, y + 7, 3, 10); g.fillRect(x + 1, y + 7, 3, 10);
      }
    }),
    hay: () => canvasTex('hayPrint', 64, 64, (g, w, h) => {
      g.fillStyle = '#e8c463'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#b98f2c'; g.lineWidth = 1.5;
      for (let i = 0; i < 60; i++) {
        const x = Math.random() * w, y = Math.random() * h, a = Math.random() * Math.PI;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 9, y + Math.sin(a) * 9); g.stroke();
      }
    }),
  };

  function material(spec) {
    if (spec.tex) {
      const tex = TEXTURES[spec.tex]();
      return new T.MeshLambertMaterial({ map: tex, color: 0xffffff });
    }
    return new T.MeshLambertMaterial({ color: spec.color, flatShading: !!spec.flat });
  }

  /* -------------------------------------------------------- outfits */

  const OUTFIT_CATS = [
    { id: 'colour', name: 'Colours' },
    { id: 'flag', name: 'Flags' },
    { id: 'camo', name: 'Camo' },
    { id: 'other', name: 'Other' },
  ];

  const OUTFITS = [
    { id: 'farmhand', name: 'Farmhand Red', cat: 'colour', price: 0, desc: 'Where every farmer starts.',
      shirt: { color: 0xc9543f }, trousers: { color: 0x3f6390 }, swatch: ['#c9543f', '#3f6390'] },
    { id: 'denim', name: 'Double Denim', cat: 'colour', price: 400, desc: 'Head to toe, no apologies.',
      shirt: { color: 0x5b8dc4 }, trousers: { color: 0x2f4f77 }, swatch: ['#5b8dc4', '#2f4f77'] },
    { id: 'forest', name: 'Forest Green', cat: 'colour', price: 600, desc: 'Blends with absolutely no hay.',
      shirt: { color: 0x3f8f5a }, trousers: { color: 0x27503a }, swatch: ['#3f8f5a', '#27503a'] },
    { id: 'sunflower', name: 'Sunflower', cat: 'colour', price: 800, desc: 'Brighter than the barn lamps.',
      shirt: { color: 0xf0c03a }, trousers: { color: 0x7a5a1c }, swatch: ['#f0c03a', '#7a5a1c'] },
    { id: 'sunday', name: 'Sunday Best', cat: 'colour', price: 1200, desc: 'Too good for a barn.',
      shirt: { color: 0xf4ecd8 }, trousers: { color: 0x2b2b33 }, swatch: ['#f4ecd8', '#2b2b33'] },
    { id: 'plum', name: 'Plum', cat: 'colour', price: 1600, desc: 'Nobody asked, but it works.',
      shirt: { color: 0x8a4a97 }, trousers: { color: 0x40274a }, swatch: ['#8a4a97', '#40274a'] },
    { id: 'coral', name: 'Coral', cat: 'colour', price: 2400, desc: 'Sunset on the south field.',
      shirt: { color: 0xf07a5f }, trousers: { color: 0x3c5a68 }, swatch: ['#f07a5f', '#3c5a68'] },
    { id: 'charcoal', name: 'Charcoal', cat: 'colour', price: 5000, desc: 'Hides the dirt. All of it.',
      shirt: { color: 0x3a3d44 }, trousers: { color: 0x22242a }, swatch: ['#3a3d44', '#22242a'] },
    { id: 'ice', name: 'Ice Blue', cat: 'colour', price: 9000, desc: 'Cool head, warm barn.',
      shirt: { color: 0x9fd8e8 }, trousers: { color: 0x2f6c85 }, swatch: ['#9fd8e8', '#2f6c85'] },
    { id: 'rust', name: 'Rust', cat: 'colour', price: 700, desc: 'Matches the pitchfork.',
      shirt: { color: 0xb5622f }, trousers: { color: 0x4a2d1c }, swatch: ['#b5622f', '#4a2d1c'] },
    { id: 'mint', name: 'Mint', cat: 'colour', price: 1400, desc: 'Fresher than the barn.',
      shirt: { color: 0x8fd8bb }, trousers: { color: 0x2f6b57 }, swatch: ['#8fd8bb', '#2f6b57'] },
    { id: 'midnight', name: 'Midnight', cat: 'colour', price: 3200, desc: 'For the late shift.',
      shirt: { color: 0x2b3566 }, trousers: { color: 0x151a33 }, swatch: ['#2b3566', '#151a33'] },
    { id: 'butter', name: 'Buttermilk', cat: 'colour', price: 6000, desc: 'Churned this morning.',
      shirt: { color: 0xf6e7bd }, trousers: { color: 0x9c7c45 }, swatch: ['#f6e7bd', '#9c7c45'] },

    { id: 'flagUK', name: 'United Kingdom', cat: 'flag', price: 20000, desc: 'Hay and country.',
      shirt: { tex: 'flagUK' }, trousers: { color: 0x1d2b4a }, swatch: ['#012169', '#C8102E'] },
    { id: 'flagUS', name: 'United States', cat: 'flag', price: 20000, desc: 'Barn of the free.',
      shirt: { tex: 'flagUS' }, trousers: { color: 0x2c3358 }, swatch: ['#B22234', '#3C3B6E'] },
    { id: 'flagIE', name: 'Ireland', cat: 'flag', price: 22000, desc: 'Forty shades of hay.',
      shirt: { tex: 'flagIE' }, trousers: { color: 0x14432a }, swatch: ['#169B62', '#FF883E'] },
    { id: 'flagFR', name: 'France', cat: 'flag', price: 22000, desc: 'Liberté, égalité, foin.',
      shirt: { tex: 'flagFR' }, trousers: { color: 0x1b2447 }, swatch: ['#002395', '#ED2939'] },
    { id: 'flagDE', name: 'Germany', cat: 'flag', price: 22000, desc: 'Heuhaufen, efficiently.',
      shirt: { tex: 'flagDE' }, trousers: { color: 0x2b2b2b }, swatch: ['#DD0000', '#FFCE00'] },
    { id: 'flagIT', name: 'Italy', cat: 'flag', price: 24000, desc: 'Ago nel pagliaio.',
      shirt: { tex: 'flagIT' }, trousers: { color: 0x1f3a26 }, swatch: ['#008C45', '#CD212A'] },
    { id: 'flagES', name: 'Spain', cat: 'flag', price: 24000, desc: 'Aguja en un pajar.',
      shirt: { tex: 'flagES' }, trousers: { color: 0x4a2116 }, swatch: ['#AA151B', '#F1BF00'] },
    { id: 'flagJP', name: 'Japan', cat: 'flag', price: 26000, desc: 'One needle, rising.',
      shirt: { tex: 'flagJP' }, trousers: { color: 0x2b2b33 }, swatch: ['#FFFFFF', '#BC002D'] },
    { id: 'flagCA', name: 'Canada', cat: 'flag', price: 26000, desc: 'Sorry about the hay.',
      shirt: { tex: 'flagCA' }, trousers: { color: 0x4a1b1b }, swatch: ['#D80621', '#FFFFFF'] },
    { id: 'flagSE', name: 'Sweden', cat: 'flag', price: 30000, desc: 'Flat-packed barn.',
      shirt: { tex: 'flagSE' }, trousers: { color: 0x123b52 }, swatch: ['#006AA7', '#FECC00'] },
    { id: 'flagCH', name: 'Switzerland', cat: 'flag', price: 34000, desc: 'Precision haystacking.',
      shirt: { tex: 'flagCH' }, trousers: { color: 0x521818 }, swatch: ['#D52B1E', '#FFFFFF'] },
    { id: 'flagBR', name: 'Brazil', cat: 'flag', price: 38000, desc: 'Ordem e progresso e feno.',
      shirt: { tex: 'flagBR' }, trousers: { color: 0x14502b }, swatch: ['#009B3A', '#FEDF00'] },
    { id: 'flagSCT', name: 'Scotland', cat: 'flag', price: 20000, desc: 'Needle in a haystack, ken.',
      shirt: { tex: 'flagSCT' }, trousers: { color: 0x123a5c }, swatch: ['#005EB8', '#FFFFFF'] },
    { id: 'flagENG', name: 'England', cat: 'flag', price: 20000, desc: 'For barn and country.',
      shirt: { tex: 'flagENG' }, trousers: { color: 0x6b1218 }, swatch: ['#FFFFFF', '#CE1124'] },
    { id: 'flagNL', name: 'Netherlands', cat: 'flag', price: 22000, desc: 'Hooiberg, technically.',
      shirt: { tex: 'flagNL' }, trousers: { color: 0x16284a }, swatch: ['#AE1C28', '#21468B'] },
    { id: 'flagPL', name: 'Poland', cat: 'flag', price: 22000, desc: 'Igła w stogu siana.',
      shirt: { tex: 'flagPL' }, trousers: { color: 0x6b1424 }, swatch: ['#FFFFFF', '#DC143C'] },
    { id: 'flagNO', name: 'Norway', cat: 'flag', price: 26000, desc: 'Barn is Norwegian for children.',
      shirt: { tex: 'flagNO' }, trousers: { color: 0x0f1c3a }, swatch: ['#BA0C2F', '#00205B'] },
    { id: 'flagDK', name: 'Denmark', cat: 'flag', price: 26000, desc: 'Hygge in the hayloft.',
      shirt: { tex: 'flagDK' }, trousers: { color: 0x5c1420 }, swatch: ['#C60C30', '#FFFFFF'] },
    { id: 'flagFI', name: 'Finland', cat: 'flag', price: 26000, desc: 'Quietly efficient digging.',
      shirt: { tex: 'flagFI' }, trousers: { color: 0x11305c }, swatch: ['#FFFFFF', '#003580'] },
    { id: 'flagGR', name: 'Greece', cat: 'flag', price: 30000, desc: 'Βελόνα στα άχυρα.',
      shirt: { tex: 'flagGR' }, trousers: { color: 0x0d3a6b }, swatch: ['#0D5EAF', '#FFFFFF'] },
    { id: 'flagMX', name: 'Mexico', cat: 'flag', price: 32000, desc: 'Aguja en un pajar, otra vez.',
      shirt: { tex: 'flagMX' }, trousers: { color: 0x123d2c }, swatch: ['#006847', '#CE1126'] },
    { id: 'flagAR', name: 'Argentina', cat: 'flag', price: 34000, desc: 'Sol de mayo, sobre el heno.',
      shirt: { tex: 'flagAR' }, trousers: { color: 0x2f5f86 }, swatch: ['#74ACDF', '#F6B40E'] },
    { id: 'flagIN', name: 'India', cat: 'flag', price: 36000, desc: 'A very large haystack indeed.',
      shirt: { tex: 'flagIN' }, trousers: { color: 0x0d3a1e }, swatch: ['#FF9933', '#138808'] },
    { id: 'flagAU', name: 'Australia', cat: 'flag', price: 40000, desc: 'Needle in a haystack, mate.',
      shirt: { tex: 'flagAU' }, trousers: { color: 0x0e1c46 }, swatch: ['#00247D', '#CF142B'] },
    { id: 'flagJM', name: 'Jamaica', cat: 'flag', price: 44000, desc: 'No hay, no cry.',
      shirt: { tex: 'flagJM' }, trousers: { color: 0x0d3d1c }, swatch: ['#009B3A', '#FFB915'] },
    { id: 'jolly', name: 'Jolly Roger', cat: 'flag', price: 60000, desc: 'Yo ho ho and a bale of hay.',
      shirt: { tex: 'jolly' }, trousers: { color: 0x17150f }, swatch: ['#12100e', '#f4efe4'] },

    { id: 'lumber', name: 'Lumberjack', cat: 'other', price: 2200, desc: 'Smells faintly of pine.',
      shirt: { tex: 'check' }, trousers: { color: 0x3b3027 }, swatch: ['#8c2f2a', '#3b3027'] },
    { id: 'hivis', name: 'Hi-Vis', cat: 'other', price: 4000, desc: 'Visible from three barns away.',
      shirt: { tex: 'hiVis' }, trousers: { tex: 'hiVis' }, swatch: ['#d8f235', '#9aa7b0'] },
    { id: 'woodland', name: 'Woodland Camo', cat: 'camo', price: 7500, desc: 'Hides you from the hay.',
      shirt: { tex: 'camoWoodland' }, trousers: { tex: 'camoWoodland' }, swatch: ['#4a5834', '#6b7a47'] },
    { id: 'desert', name: 'Desert Camo', cat: 'camo', price: 7500, desc: 'For a very dry harvest.',
      shirt: { tex: 'camoDesert' }, trousers: { tex: 'camoDesert' }, swatch: ['#cbb188', '#7d6440'] },
    { id: 'urbancamo', name: 'Urban Camo', cat: 'camo', price: 9000, desc: 'Concrete, in a barn.',
      shirt: { tex: 'camoUrban' }, trousers: { tex: 'camoUrban' }, swatch: ['#6d7178', '#2b2e33'] },
    { id: 'snowcamo', name: 'Snow Camo', cat: 'camo', price: 11000, desc: 'Winter barn, winter hay.',
      shirt: { tex: 'camoSnow' }, trousers: { tex: 'camoSnow' }, swatch: ['#e8eef4', '#93a2b0'] },
    { id: 'navycamo', name: 'Navy Camo', cat: 'camo', price: 13000, desc: 'Nowhere near the sea.',
      shirt: { tex: 'camoNavy' }, trousers: { tex: 'camoNavy' }, swatch: ['#3f6f9c', '#0d1c2b'] },
    { id: 'pinkcamo', name: 'Pink Camo', cat: 'camo', price: 16000, desc: 'Tactical, but make it loud.',
      shirt: { tex: 'camoPink' }, trousers: { tex: 'camoPink' }, swatch: ['#ff8fc4', '#a63472'] },
    { id: 'digicamo', name: 'Digital Camo', cat: 'camo', price: 24000, desc: 'Pixels, in three dimensions.',
      shirt: { tex: 'camoDigital' }, trousers: { tex: 'camoDigital' }, swatch: ['#5c6b4a', '#28301f'] },
    { id: 'tigercamo', name: 'Tiger Stripe', cat: 'camo', price: 40000, desc: 'Nobody will mistake you for hay.',
      shirt: { tex: 'camoTiger' }, trousers: { tex: 'camoTiger' }, swatch: ['#c98a2e', '#2a2018'] },
    { id: 'hayprint', name: 'Full Hay Print', cat: 'other', price: 90000, desc: 'Become the haystack.',
      shirt: { tex: 'hay' }, trousers: { tex: 'hay' }, swatch: ['#e8c463', '#b98f2c'] },
    { id: 'boilersuit', name: 'Boiler Suit', cat: 'other', price: 3000, desc: 'Ready for the tractor.',
      shirt: { tex: 'boiler' }, trousers: { tex: 'boiler' }, swatch: ['#2f6f5e', '#d8b24a'] },
    { id: 'cow', name: 'Cow Print', cat: 'other', price: 12000, desc: 'The herd accepts you.',
      shirt: { tex: 'cow' }, trousers: { tex: 'cow' }, swatch: ['#f6f2ea', '#20201e'] },
    { id: 'pinstripe', name: 'Pinstripe', cat: 'other', price: 26000, desc: 'Hay futures are up.',
      shirt: { tex: 'pinstripe' }, trousers: { tex: 'pinstripe' }, swatch: ['#232838', '#b9c2d6'] },
    { id: 'racing', name: 'Racing Stripes', cat: 'other', price: 45000, desc: 'Faster, in spirit.',
      shirt: { tex: 'racing' }, trousers: { color: 0x1e2a4a }, swatch: ['#c8322f', '#1e2a4a'] },
    { id: 'disco', name: 'Disco Sequins', cat: 'other', price: 150000, unlock: 6, desc: 'The barn becomes a dancefloor.',
      shirt: { tex: 'disco' }, trousers: { tex: 'disco' }, swatch: ['#ff5ea8', '#5ed4ff'] },
    { id: 'rosettes', name: 'Rosette Claret', cat: 'other', price: 0, need: 1,
      desc: 'Every rosette you have ever won, worn at once.',
      shirt: { tex: 'rosette' }, trousers: { color: 0x3a0a14 }, swatch: ['#6d1224', '#f3d477'] },
  ];

  /* ----------------------------------------------------------- hats */

  const M = (c, flat) => new T.MeshLambertMaterial({ color: c, flatShading: !!flat });

  const HATS = [
    { id: 'straw', name: 'Straw Hat', price: 0, swatch: ['#e0b657'], desc: 'Standard issue sun protection.',
      build: () => {
        const g = new T.Group();
        const m = M(0xe0b657, true);
        const brim = new T.Mesh(new T.CylinderGeometry(0.62, 0.62, 0.07, 12), m);
        brim.position.y = 0.06;
        const crown = new T.Mesh(new T.ConeGeometry(0.33, 0.36, 10), m);
        crown.position.y = 0.22;
        g.add(brim, crown);
        return g;
      } },
    { id: 'capRed', name: 'Red Ball Cap', price: 500, swatch: ['#c23b34'], desc: 'Sweat-stained, lucky.',
      build: () => cap(0xc23b34) },
    { id: 'capBlue', name: 'Blue Ball Cap', price: 500, swatch: ['#2f6fb5'], desc: 'For away days.',
      build: () => cap(0x2f6fb5) },
    { id: 'capGreen', name: 'Green Ball Cap', price: 500, swatch: ['#3f8f4f'], desc: 'Tractor dealership freebie.',
      build: () => cap(0x3f8f4f) },
    { id: 'beanie', name: 'Woolly Beanie', price: 1500, swatch: ['#8b5ec9'], desc: 'Barns get cold.',
      build: () => {
        const g = new T.Group();
        const m = M(0x8b5ec9);
        const dome = new T.Mesh(new T.SphereGeometry(0.34, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), m);
        dome.position.y = 0.06;
        const band = new T.Mesh(new T.CylinderGeometry(0.35, 0.35, 0.12, 12), M(0xf0e9dd));
        band.position.y = 0.02;
        const bobble = new T.Mesh(new T.SphereGeometry(0.11, 8, 6), M(0xf0e9dd));
        bobble.position.y = 0.42;
        g.add(dome, band, bobble);
        return g;
      } },
    { id: 'bucket', name: 'Bucket Hat', price: 2500, swatch: ['#6f8f4a'], desc: 'Festival farmer.',
      build: () => {
        const g = new T.Group();
        const m = M(0x6f8f4a);
        const brim = new T.Mesh(new T.CylinderGeometry(0.56, 0.48, 0.1, 14), m);
        brim.position.y = 0.04;
        const top = new T.Mesh(new T.CylinderGeometry(0.33, 0.37, 0.28, 14), m);
        top.position.y = 0.2;
        g.add(brim, top);
        return g;
      } },
    { id: 'flatcap', name: 'Flat Cap', price: 900, swatch: ['#6b6250'], desc: 'What the old boy wore.',
      build: () => {
        const g = new T.Group();
        const m = M(0x6b6250, true);
        const dome = new T.Mesh(new T.SphereGeometry(0.34, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), m);
        dome.position.y = 0.03;
        dome.scale.y = 0.72;
        const peak = new T.Mesh(new T.CylinderGeometry(0.38, 0.38, 0.05, 14, 1, false, -0.8, 1.6), m);
        peak.position.set(0, 0.02, 0.2);
        peak.scale.z = 1.1;
        g.add(dome, peak);
        return g;
      } },
    { id: 'hardhat', name: 'Hard Hat', price: 1800, swatch: ['#f2c318'], desc: 'Barn safety officer.',
      build: () => {
        const g = new T.Group();
        const m = M(0xf2c318, true);
        const dome = new T.Mesh(new T.SphereGeometry(0.36, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), m);
        dome.position.y = 0.02;
        const brim = new T.Mesh(new T.CylinderGeometry(0.46, 0.46, 0.05, 14), m);
        brim.position.y = 0.02;
        const ridge = new T.Mesh(new T.BoxGeometry(0.08, 0.1, 0.62), M(0xd9a90f));
        ridge.position.y = 0.26;
        g.add(brim, dome, ridge);
        return g;
      } },
    { id: 'cowboy', name: 'Cowboy Hat', price: 5000, swatch: ['#6b4423'], desc: 'This barn ain’t big enough.',
      build: () => {
        const g = new T.Group();
        const m = M(0x6b4423, true);
        const brim = new T.Mesh(new T.TorusGeometry(0.52, 0.16, 6, 16), m);
        brim.rotation.x = Math.PI / 2;
        brim.scale.y = 0.35;
        brim.position.y = 0.06;
        const disc = new T.Mesh(new T.CylinderGeometry(0.52, 0.52, 0.06, 16), m);
        disc.position.y = 0.06;
        const crown = new T.Mesh(new T.CylinderGeometry(0.27, 0.32, 0.42, 10), m);
        crown.position.y = 0.3;
        const band = new T.Mesh(new T.CylinderGeometry(0.33, 0.33, 0.09, 12), M(0x2b1d10));
        band.position.y = 0.14;
        g.add(brim, disc, crown, band);
        return g;
      } },
    { id: 'sombrero', name: 'Sombrero', price: 6500, swatch: ['#e0b657', '#c8322f'], desc: 'Shade for a whole pile.',
      build: () => {
        const g = new T.Group();
        const straw = M(0xe0b657, true);
        const brim = new T.Mesh(new T.CylinderGeometry(0.95, 0.95, 0.06, 16), straw);
        brim.position.y = 0.06;
        const rim = new T.Mesh(new T.TorusGeometry(0.95, 0.05, 6, 18), M(0xc8322f));
        rim.rotation.x = Math.PI / 2;
        rim.position.y = 0.07;
        const cone = new T.Mesh(new T.ConeGeometry(0.34, 0.5, 12), straw);
        cone.position.y = 0.32;
        const band = new T.Mesh(new T.CylinderGeometry(0.33, 0.36, 0.09, 12), M(0xc8322f));
        band.position.y = 0.12;
        g.add(brim, rim, cone, band);
        return g;
      } },
    { id: 'tricorn', name: 'Pirate Tricorn', price: 9000, swatch: ['#2a2118', '#d8c48a'], desc: 'Arr, more hay.',
      build: () => {
        const g = new T.Group();
        const felt = M(0x2a2118, true);
        const crown = new T.Mesh(new T.CylinderGeometry(0.3, 0.36, 0.34, 10), felt);
        crown.position.y = 0.2;
        g.add(crown);
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI * 2 + 0.5;
          const flap = new T.Mesh(new T.BoxGeometry(0.62, 0.06, 0.34), felt);
          flap.position.set(Math.cos(a) * 0.3, 0.12, Math.sin(a) * 0.3);
          flap.rotation.y = -a;
          flap.rotation.x = -0.35;
          const trim = new T.Mesh(new T.BoxGeometry(0.62, 0.05, 0.06), M(0xd8c48a));
          trim.position.copy(flap.position);
          trim.position.y += 0.05;
          trim.rotation.copy(flap.rotation);
          g.add(flap, trim);
        }
        return g;
      } },
    { id: 'tophat', name: 'Top Hat', price: 12000, swatch: ['#14131a'], desc: 'Gentleman of the soil.',
      build: () => {
        const g = new T.Group();
        const m = M(0x14131a);
        const brim = new T.Mesh(new T.CylinderGeometry(0.56, 0.56, 0.06, 16), m);
        brim.position.y = 0.04;
        const tube = new T.Mesh(new T.CylinderGeometry(0.33, 0.35, 0.7, 14), m);
        tube.position.y = 0.42;
        const band = new T.Mesh(new T.CylinderGeometry(0.36, 0.36, 0.1, 14), M(0xc23b34));
        band.position.y = 0.13;
        g.add(brim, tube, band);
        return g;
      } },
    { id: 'viking', name: 'Viking Helm', price: 25000, swatch: ['#b9c2c9', '#e8dfc8'], desc: 'Pillage the hay.',
      build: () => {
        const g = new T.Group();
        const dome = new T.Mesh(new T.SphereGeometry(0.36, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(0xb9c2c9, true));
        dome.position.y = 0.04;
        const rim = new T.Mesh(new T.CylinderGeometry(0.38, 0.38, 0.1, 14), M(0x8a949c));
        rim.position.y = 0.03;
        g.add(dome, rim);
        for (const s of [-1, 1]) {
          const horn = new T.Mesh(new T.ConeGeometry(0.1, 0.44, 8), M(0xe8dfc8, true));
          horn.position.set(s * 0.34, 0.26, 0);
          horn.rotation.z = s * -0.9;
          g.add(horn);
        }
        return g;
      } },
    { id: 'wizard', name: 'Wizard Hat', price: 30000, swatch: ['#4b3f8f', '#ffd75e'], desc: 'The hay obeys.',
      build: () => {
        const g = new T.Group();
        const cloth = M(0x4b3f8f, true);
        const brim = new T.Mesh(new T.CylinderGeometry(0.62, 0.62, 0.06, 14), cloth);
        brim.position.y = 0.05;
        const cone = new T.Mesh(new T.ConeGeometry(0.36, 1.15, 12), cloth);
        cone.position.y = 0.62;
        cone.rotation.z = 0.16;
        const band = new T.Mesh(new T.CylinderGeometry(0.37, 0.4, 0.1, 12), M(0x2e265c));
        band.position.y = 0.12;
        g.add(brim, cone, band);
        for (let i = 0; i < 5; i++) {
          const star = new T.Mesh(new T.OctahedronGeometry(0.055), M(0xffd75e, true));
          const t = 0.2 + (i / 5) * 0.75;
          const a = i * 2.3;
          star.position.set(Math.cos(a) * 0.3 * (1 - t) + 0.16 * t, 0.2 + t * 0.9, Math.sin(a) * 0.3 * (1 - t));
          g.add(star);
        }
        return g;
      } },
    { id: 'party', name: 'Party Hat', price: 35000, swatch: ['#ff5ea8', '#5ed4ff'], desc: 'Barn cleared, barn celebrated.',
      build: () => {
        const g = new T.Group();
        const cone = new T.Mesh(new T.ConeGeometry(0.3, 0.75, 12), M(0xff5ea8, true));
        cone.position.y = 0.42;
        cone.rotation.z = -0.12;
        g.add(cone);
        for (let i = 0; i < 4; i++) {
          const ring = new T.Mesh(new T.TorusGeometry(0.26 - i * 0.055, 0.022, 5, 12), M(i % 2 ? 0x5ed4ff : 0xffe14d));
          ring.rotation.x = Math.PI / 2;
          ring.position.set(0.02 * i, 0.16 + i * 0.16, 0);
          g.add(ring);
        }
        const puff = new T.Mesh(new T.SphereGeometry(0.09, 8, 6), M(0xffe14d, true));
        puff.position.set(-0.07, 0.82, 0);
        g.add(puff);
        return g;
      } },
    { id: 'bunny', name: 'Bunny Head', price: 45000, swatch: ['#f6eee6', '#ff9dc0'], desc: 'Nobody asks why.',
      build: () => {
        const g = new T.Group();
        const fur = M(0xf6eee6);
        const head = new T.Mesh(new T.SphereGeometry(0.42, 14, 12), fur);
        head.position.y = 0.02;
        head.scale.z = 1.1;
        const snout = new T.Mesh(new T.SphereGeometry(0.2, 10, 8), fur);
        snout.position.set(0, -0.08, 0.34);
        const nose = new T.Mesh(new T.SphereGeometry(0.07, 8, 6), M(0xff6f9b));
        nose.position.set(0, -0.04, 0.52);
        g.add(head, snout, nose);
        for (const s of [-1, 1]) {
          const ear = new T.Mesh(new T.CapsuleGeometry(0.1, 0.5, 4, 8), fur);
          ear.position.set(s * 0.17, 0.55, -0.02);
          ear.rotation.z = s * 0.2;
          const inner = new T.Mesh(new T.CylinderGeometry(0.055, 0.055, 0.42, 8), M(0xff9dc0));
          inner.position.set(s * 0.19, 0.58, 0.06);
          inner.rotation.z = s * 0.2;
          const eye = new T.Mesh(new T.SphereGeometry(0.05, 8, 6), M(0x1a1410));
          eye.position.set(s * 0.17, 0.04, 0.36);
          g.add(ear, inner, eye);
        }
        return g;
      } },
    { id: 'cone', name: 'Traffic Cone', price: 70000, swatch: ['#f06424', '#f4efe4'], desc: 'Found it on the way in.',
      build: () => {
        const g = new T.Group();
        const cone = new T.Mesh(new T.ConeGeometry(0.34, 0.8, 12), M(0xf06424, true));
        cone.position.y = 0.42;
        const base = new T.Mesh(new T.BoxGeometry(0.62, 0.08, 0.62), M(0xf06424));
        base.position.y = 0.05;
        const stripe = new T.Mesh(new T.ConeGeometry(0.26, 0.16, 12), M(0xf4efe4));
        stripe.position.y = 0.53;
        g.add(cone, base, stripe);
        return g;
      } },
    { id: 'carrot', name: 'Polite Carrot', price: 120000, unlock: 6, swatch: ['#FF6B1A', '#65B84F'],
      desc: 'Become the mascot. Smile included.',
      build: () => {
        const g = new T.Group();
        g.rotation.z = -0.09;              // the logo's jaunty lean, gentler on a head

        /* A carrot head rather than a carrot hat: one lathed profile, domed at
           the crown and tapering to a tip that ends up inside the chest, so the
           farmer's own head is swallowed and the silhouette still reads carrot.
           x is the radius, y the height; the head it has to cover is a 0.3
           sphere centred at -0.12. */
        const profile = [
          [0.0, -1.0], [0.05, -0.95], [0.15, -0.78], [0.25, -0.56],
          [0.33, -0.36], [0.385, -0.16], [0.41, 0.02], [0.40, 0.20],
          [0.355, 0.38], [0.27, 0.50], [0.15, 0.575], [0.02, 0.60],
        ].map(([x, y]) => new T.Vector2(x, y));   // tip first: lathe winds
                                                  // outward-facing from the
                                                  // bottom up
        const body = new T.Mesh(new T.LatheGeometry(profile, 14), M(0xff6b1a, true));
        g.add(body);

        // leaves out of the crown
        const leaves = [[0x65b84f, -0.46, 0.54], [0x4b9d43, 0.44, 0.6], [0x7bcb59, -0.02, 0.46]];
        leaves.forEach(([col, lean, len], i) => {
          const leaf = new T.Mesh(new T.ConeGeometry(0.1, len, 7), M(col, true));
          leaf.position.set(Math.sin(lean) * 0.14, 0.56 + Math.cos(lean) * len * 0.42, i === 2 ? -0.09 : 0.05);
          leaf.rotation.z = -lean;
          leaf.rotation.x = i === 2 ? -0.3 : 0.14;
          g.add(leaf);
        });

        // face, on the widest part of the body as in the logo
        for (const sx of [-1, 1]) {
          const eye = new T.Mesh(new T.SphereGeometry(0.058, 12, 10), M(0x111111));
          eye.scale.y = 1.3;
          eye.position.set(sx * 0.145, 0.13, 0.345);
          const glint = new T.Mesh(new T.SphereGeometry(0.022, 7, 6), M(0xffffff));
          glint.position.set(sx * 0.145 - 0.024, 0.172, 0.375);
          g.add(eye, glint);
        }
        const smile = new T.Mesh(new T.TorusGeometry(0.115, 0.021, 7, 16, Math.PI * 0.8), M(0x421a12));
        smile.position.set(0, -0.02, 0.37);
        smile.rotation.z = Math.PI + Math.PI * 0.1;      // closed, turned up at the ends
        g.add(smile);

        // root dashes down the taper
        [[-0.1, -1, 0.36], [-0.26, 1, 0.32], [-0.42, -1, 0.26]].forEach(([y, sx, r]) => {
          const dash = new T.Mesh(new T.CylinderGeometry(0.015, 0.015, 0.09, 5), M(0xd9470b));
          dash.position.set(sx * r * 0.62, y, r * 0.72);
          dash.rotation.z = Math.PI / 2 - sx * 0.5;
          g.add(dash);
        });

        return g;
      } },
    { id: 'pumpkin', name: 'Pumpkin Head', price: 90000, unlock: 5, swatch: ['#e8761f', '#3f2a12'],
      desc: 'Harvest festival, all year round.',
      build: () => {
        const g = new T.Group();
        const flesh = M(0xe8761f, true);
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const lobe = new T.Mesh(new T.SphereGeometry(0.26, 10, 8), flesh);
          lobe.position.set(Math.cos(a) * 0.17, 0, Math.sin(a) * 0.17);
          lobe.scale.set(1, 0.92, 1);
          g.add(lobe);
        }
        const core = new T.Mesh(new T.SphereGeometry(0.3, 12, 10), flesh);
        g.add(core);
        const stalk = new T.Mesh(new T.CylinderGeometry(0.05, 0.08, 0.22, 6), M(0x4e7a2e, true));
        stalk.position.y = 0.42;
        stalk.rotation.z = 0.3;
        g.add(stalk);
        // carved face
        const dark = M(0x3f2a12);
        for (const sx of [-1, 1]) {
          const eye = new T.Mesh(new T.ConeGeometry(0.075, 0.12, 3), dark);
          eye.position.set(sx * 0.13, 0.09, 0.4);
          eye.rotation.x = Math.PI / 2;
          eye.rotation.z = sx * 0.3;
          g.add(eye);
        }
        const nose = new T.Mesh(new T.ConeGeometry(0.05, 0.08, 3), dark);
        nose.position.set(0, -0.02, 0.42);
        nose.rotation.x = Math.PI / 2;
        g.add(nose);
        for (let i = 0; i < 4; i++) {
          const tooth = new T.Mesh(new T.BoxGeometry(0.055, 0.075, 0.04), dark);
          tooth.position.set(-0.1 + i * 0.07, -0.14 + (i % 2) * 0.03, 0.4);
          g.add(tooth);
        }
        return g;
      } },
    { id: 'scarecrow', name: 'Scarecrow Head', price: 0, need: 'stash', swatch: ['#c9a96a', '#5a4326'],
      desc: 'Found in a crate behind barn 4. It has been watching the field for years.',
      build: () => {
        const g = new T.Group();
        g.position.y = -0.06;
        g.rotation.z = 0.05;
        const sack = M(0xc9a96a, true);

        /* A stuffed sack pulled right down over the head and tied at the neck.
           It has to swallow a 0.3 sphere centred at world 2.23, or the
           farmer's own chin shows underneath. */
        const head = new T.Mesh(new T.SphereGeometry(0.4, 10, 8), sack);
        head.scale.set(1, 1.12, 0.96);
        head.position.y = 0.02;
        const tie = new T.Mesh(new T.CylinderGeometry(0.26, 0.34, 0.16, 10), M(0x8d6f3d, true));
        tie.position.y = -0.36;
        const gather = new T.Mesh(new T.SphereGeometry(0.13, 8, 6), sack);
        gather.position.y = 0.5;
        gather.scale.y = 1.4;
        g.add(head, tie, gather);

        // straw poking out of the seams
        for (let i = 0; i < 9; i++) {
          const a = (i / 9) * Math.PI * 2;
          const straw = new T.Mesh(new T.CylinderGeometry(0.018, 0.012, 0.3, 4), M(0xe0b657, true));
          straw.position.set(Math.cos(a) * 0.3, -0.4, Math.sin(a) * 0.26);
          straw.rotation.set(Math.cos(a) * 0.7, 0, Math.sin(a) * 0.7 - 0.3);
          g.add(straw);
        }

        // stitched cross eyes and a sewn-up mouth
        const thread = M(0x4a3218);
        for (const sx of [-1, 1]) {
          for (const r of [0.7, -0.7]) {
            const st = new T.Mesh(new T.BoxGeometry(0.16, 0.04, 0.03), thread);
            st.position.set(sx * 0.15, 0.1, 0.37);
            st.rotation.z = r;
            g.add(st);
          }
        }
        for (let i = 0; i < 5; i++) {
          const st = new T.Mesh(new T.BoxGeometry(0.03, 0.1, 0.03), thread);
          st.position.set(-0.13 + i * 0.065, -0.12, 0.36);
          g.add(st);
        }
        const seam = new T.Mesh(new T.BoxGeometry(0.36, 0.028, 0.03), thread);
        seam.position.set(0, -0.12, 0.36);
        g.add(seam);
        return g;
      } },
    { id: 'tincan', name: 'Tin Can Hat', price: 0, need: 'shelf', swatch: ['#b9c2c9', '#c0392b'],
      desc: 'The first thing you ever dug out, worn with pride.',
      build: () => {
        const g = new T.Group();
        g.position.y = 0.12;               // perched on the crown, not pulled down over the eyes
        g.rotation.z = 0.11;               // and at a jaunty angle, because it is a tin can
        const tin = M(0xb9c2c9, true);
        const body = new T.Mesh(new T.CylinderGeometry(0.32, 0.32, 0.44, 14, 1, true), tin);
        body.position.y = 0.2;
        body.material.side = T.DoubleSide;
        const base = new T.Mesh(new T.CylinderGeometry(0.32, 0.32, 0.04, 14), tin);
        base.position.y = 0.42;
        const rimA = new T.Mesh(new T.TorusGeometry(0.32, 0.028, 6, 16), tin);
        rimA.position.y = 0.4; rimA.rotation.x = Math.PI / 2;
        const rimB = rimA.clone(); rimB.position.y = 0;
        const label = new T.Mesh(new T.CylinderGeometry(0.332, 0.332, 0.26, 14, 1, true), M(0xc0392b));
        label.material.side = T.DoubleSide;
        label.position.y = 0.2;
        const band = new T.Mesh(new T.CylinderGeometry(0.336, 0.336, 0.05, 14, 1, true), M(0xf3e6c8));
        band.material.side = T.DoubleSide;
        band.position.y = 0.25;
        // the lid, levered off and bent up on one side of the rim
        const lid = new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 0.02, 14), M(0xd7dee3, true));
        lid.position.set(-0.3, 0.52, 0.02);
        lid.rotation.set(0.1, 0, 1.35);
        g.add(body, base, rimA, rimB, label, band, lid);
        return g;
      } },
    { id: 'crown', name: 'Golden Crown', price: 250000, unlock: 8, swatch: ['#ffcf4d', '#ff4d6d'], desc: 'King of the haystack.',
      build: () => {
        const g = new T.Group();
        const gold = new T.Mesh(new T.CylinderGeometry(0.36, 0.36, 0.26, 12), M(0xffcf4d, true));
        gold.position.y = 0.16;
        g.add(gold);
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const spike = new T.Mesh(new T.ConeGeometry(0.09, 0.26, 6), M(0xffcf4d, true));
          spike.position.set(Math.cos(a) * 0.3, 0.38, Math.sin(a) * 0.3);
          g.add(spike);
          const jewel = new T.Mesh(new T.SphereGeometry(0.06, 8, 6), M(0xff4d6d));
          jewel.position.set(Math.cos(a) * 0.36, 0.2, Math.sin(a) * 0.36);
          g.add(jewel);
        }
        return g;
      } },
  ];

  function cap(color) {
    const g = new T.Group();
    const m = M(color);
    const dome = new T.Mesh(new T.SphereGeometry(0.34, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), m);
    dome.position.y = 0.04;
    const peak = new T.Mesh(new T.CylinderGeometry(0.4, 0.4, 0.05, 14, 1, false, -0.7, 1.4), m);
    peak.position.set(0, 0.05, 0.16);
    peak.scale.z = 1.35;
    const btn = new T.Mesh(new T.SphereGeometry(0.06, 6, 5), m);
    btn.position.y = 0.36;
    g.add(dome, peak, btn);
    return g;
  }


  /* ---------------------------------------------------------- faces */

  /* All built on a 0.3 head: eyes sit at z 0.26-0.28, mouths just below.
     Pieces are small, so shapes are kept blunt and readable at game size. */
  const SKIN_DARK = 0x3a2a1c;

  function eyeBall(x, y, r, squash) {
    const m = new T.Mesh(new T.SphereGeometry(r, 10, 8), M(0x1a1410));
    m.position.set(x, y, 0.245);
    m.scale.y = squash || 1;
    return m;
  }
  function eyeShut(x, y, w) {
    const m = new T.Mesh(new T.BoxGeometry(w || 0.1, 0.022, 0.04), M(0x1a1410));
    m.position.set(x, y, 0.27);
    return m;
  }
  function brow(x, y, tilt) {
    const m = new T.Mesh(new T.BoxGeometry(0.12, 0.028, 0.04), M(SKIN_DARK));
    m.position.set(x, y, 0.27);
    m.rotation.z = tilt;
    return m;
  }
  function mouthArc(y, r, up, tube) {
    const m = new T.Mesh(new T.TorusGeometry(r, tube || 0.023, 6, 14, Math.PI * 0.9), M(0x5a2b20));
    m.position.set(0, y, 0.25);
    m.rotation.z = up ? Math.PI : 0;     // PI opens the arc downward: a smile
    return m;
  }
  function mouthLine(y, w) {
    const m = new T.Mesh(new T.BoxGeometry(w || 0.13, 0.03, 0.04), M(0x5a2b20));
    m.position.set(0, y, 0.265);
    return m;
  }

  const FACES = [
    { id: 'plain', name: 'Happy', emoji: '🙂', price: 0, swatch: ['#e8b98c', '#1a1410'], desc: 'The face you turned up with.',
      build: () => {
        const g = new T.Group();
        g.add(eyeBall(-0.1, 0.06, 0.036), eyeBall(0.1, 0.06, 0.036), mouthArc(-0.02, 0.075, true));
        return g;
      } },
    { id: 'grin', name: 'Big Grin', emoji: '😁', price: 600, swatch: ['#f4efe4', '#5a2b20'], desc: 'Found something, have we?',
      build: () => {
        const g = new T.Group();
        const mouth = new T.Mesh(new T.SphereGeometry(0.1, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M(0x5a2b20));
        mouth.position.set(0, -0.02, 0.23);
        mouth.scale.set(1, 0.7, 0.5);
        const teeth = new T.Mesh(new T.BoxGeometry(0.17, 0.03, 0.03), M(0xf8f4ea));
        teeth.position.set(0, -0.025, 0.28);
        g.add(eyeBall(-0.1, 0.07, 0.038), eyeBall(0.1, 0.07, 0.038), mouth, teeth);
        return g;
      } },
    { id: 'focus', name: 'Focused', emoji: '🧐', price: 1500, swatch: ['#3a2a1c', '#1a1410'], desc: 'The needle is out there.',
      build: () => {
        const g = new T.Group();
        g.add(eyeBall(-0.1, 0.05, 0.032, 0.6), eyeBall(0.1, 0.05, 0.032, 0.6),
              brow(-0.1, 0.12, 0.22), brow(0.1, 0.12, -0.22), mouthLine(-0.05, 0.11));
        return g;
      } },
    { id: 'wink', name: 'Wink', emoji: '😉', price: 3000, swatch: ['#1a1410', '#5a2b20'], desc: 'Knows exactly which pile.',
      build: () => {
        const g = new T.Group();
        g.add(eyeBall(-0.1, 0.06, 0.036), eyeShut(0.1, 0.06), mouthArc(-0.02, 0.08, true));
        return g;
      } },
    { id: 'surprise', name: 'Surprised', emoji: '😮', price: 5000, swatch: ['#f4efe4', '#5a2b20'], desc: 'It was in pile C all along.',
      build: () => {
        const g = new T.Group();
        const o = new T.Mesh(new T.SphereGeometry(0.055, 10, 8), M(0x5a2b20));
        o.position.set(0, -0.05, 0.25);
        o.scale.set(0.8, 1.1, 0.5);
        g.add(eyeBall(-0.1, 0.07, 0.048), eyeBall(0.1, 0.07, 0.048),
              brow(-0.1, 0.16, -0.1), brow(0.1, 0.16, 0.1), o);
        return g;
      } },
    { id: 'sleepy', name: 'Sleepy', emoji: '😴', price: 8000, swatch: ['#3a2a1c', '#e8b98c'], desc: 'Barn four of the day.',
      build: () => {
        const g = new T.Group();
        g.add(eyeShut(-0.1, 0.06, 0.11), eyeShut(0.1, 0.06, 0.11),
              brow(-0.1, 0.13, -0.18), brow(0.1, 0.13, 0.18), mouthArc(-0.06, 0.05, false));
        return g;
      } },
    { id: 'grumpy', name: 'Grumpy', emoji: '😠', price: 14000, swatch: ['#5a2b20', '#3a2a1c'], desc: 'It is always the last pile.',
      build: () => {
        const g = new T.Group();
        g.add(eyeBall(-0.1, 0.05, 0.034), eyeBall(0.1, 0.05, 0.034),
              brow(-0.1, 0.13, -0.42), brow(0.1, 0.13, 0.42), mouthArc(-0.07, 0.07, false));
        return g;
      } },
    { id: 'tongue', name: 'Tongue Out', emoji: '😛', price: 22000, swatch: ['#ff8fa3', '#1a1410'], desc: 'Hay tastes fine, actually.',
      build: () => {
        const g = new T.Group();
        const tongue = new T.Mesh(new T.BoxGeometry(0.1, 0.13, 0.06), M(0xff8fa3));
        tongue.position.set(0.01, -0.13, 0.245);
        tongue.rotation.x = 0.45;
        g.add(eyeShut(-0.1, 0.07, 0.1), eyeBall(0.1, 0.06, 0.036), mouthLine(-0.045, 0.12), tongue);
        return g;
      } },
    { id: 'freckles', name: 'Freckles', emoji: '😊', price: 2000, swatch: ['#c98a5e', '#1a1410'], desc: 'Summers in the field.',
      build: () => {
        const g = new T.Group();
        g.add(eyeBall(-0.1, 0.06, 0.036), eyeBall(0.1, 0.06, 0.036), mouthArc(-0.02, 0.08, true));
        for (const sx of [-1, 1]) {
          for (let i = 0; i < 3; i++) {
            const f = new T.Mesh(new T.SphereGeometry(0.018, 6, 5), M(0xc9865a));
            f.position.set(sx * (0.13 + (i % 2) * 0.05), -0.01 - i * 0.035, 0.255);
            g.add(f);
          }
        }
        return g;
      } },
    { id: 'whistle', name: 'Whistling', emoji: '😗', price: 6000, swatch: ['#5a2b20', '#1a1410'], desc: 'Happy in his work.',
      build: () => {
        const g = new T.Group();
        const o = new T.Mesh(new T.SphereGeometry(0.042, 9, 7), M(0x5a2b20));
        o.position.set(0.02, -0.06, 0.26);
        o.scale.set(1, 0.9, 0.6);
        g.add(eyeShut(-0.1, 0.07, 0.1), eyeShut(0.1, 0.07, 0.1),
              brow(-0.1, 0.13, -0.14), brow(0.1, 0.13, 0.14), o);
        return g;
      } },
    { id: 'eyepatch', name: 'Eyepatch', emoji: '🏴‍☠️', price: 18000, swatch: ['#14131a', '#1a1410'], desc: 'Pairs with the tricorn.',
      build: () => {
        const g = new T.Group();
        const patch = new T.Mesh(new T.BoxGeometry(0.13, 0.11, 0.035), M(0x14131a));
        patch.position.set(-0.1, 0.07, 0.265);
        patch.rotation.z = 0.12;
        const strap = new T.Mesh(new T.TorusGeometry(0.3, 0.012, 5, 16), M(0x14131a));
        strap.position.y = 0.09;
        strap.rotation.y = Math.PI / 2;
        strap.rotation.z = 0.18;
        g.add(patch, strap, eyeBall(0.1, 0.06, 0.036), mouthArc(-0.03, 0.075, true));
        return g;
      } },
    { id: 'monocle', name: 'Monocle', emoji: '🧐', price: 55000, swatch: ['#dfe9f0', '#ffcf4d'], desc: 'Quite the find, old chap.',
      build: () => {
        const g = new T.Group();
        const rim = new T.Mesh(new T.TorusGeometry(0.075, 0.016, 6, 14), M(0xffcf4d, true));
        rim.position.set(0.1, 0.06, 0.26);
        const lens = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 0.012, 12), M(0xdfe9f0));
        lens.rotation.x = Math.PI / 2;
        lens.position.set(0.1, 0.06, 0.258);
        const chain = new T.Mesh(new T.BoxGeometry(0.012, 0.14, 0.012), M(0xffcf4d));
        chain.position.set(0.16, -0.02, 0.25);
        chain.rotation.z = -0.3;
        g.add(eyeBall(-0.1, 0.06, 0.036), eyeBall(0.1, 0.06, 0.03), rim, lens, chain,
              brow(-0.1, 0.13, 0.18), mouthLine(-0.06, 0.1));
        return g;
      } },
    { id: 'stache', name: 'Moustache', emoji: '🥸', price: 40000, swatch: ['#3a2a1c', '#e8b98c'], desc: 'Grown over four barns.',
      build: () => {
        const g = new T.Group();
        const bar = new T.Mesh(new T.BoxGeometry(0.19, 0.045, 0.05), M(SKIN_DARK));
        bar.position.set(0, -0.045, 0.26);
        for (const sx of [-1, 1]) {
          const tip = new T.Mesh(new T.BoxGeometry(0.05, 0.06, 0.05), M(SKIN_DARK));
          tip.position.set(sx * 0.105, -0.03, 0.25);
          tip.rotation.z = sx * 0.5;
          g.add(tip);
        }
        g.add(eyeBall(-0.1, 0.07, 0.036), eyeBall(0.1, 0.07, 0.036), bar, mouthArc(-0.1, 0.06, true));
        return g;
      } },
    { id: 'beard', name: 'Full Beard', emoji: '🧔', price: 95000, swatch: ['#3a2a1c', '#e8b98c'], desc: 'Three barns in the making.',
      build: () => {
        const g = new T.Group();
        const hair = M(SKIN_DARK, true);
        const jaw = new T.Mesh(new T.SphereGeometry(0.3, 12, 10, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.58), hair);
        jaw.position.set(0, 0.005, 0.005);
        jaw.scale.set(1.04, 1.12, 1.04);
        const chin = new T.Mesh(new T.SphereGeometry(0.12, 8, 7), hair);
        chin.position.set(0, -0.2, 0.16);
        const tash = new T.Mesh(new T.BoxGeometry(0.18, 0.04, 0.05), hair);
        tash.position.set(0, -0.04, 0.26);
        g.add(jaw, chin, tash, eyeBall(-0.1, 0.08, 0.036), eyeBall(0.1, 0.08, 0.036), mouthLine(-0.1, 0.1));
        return g;
      } },
    { id: 'shades', name: 'Shades', emoji: '😎', price: 70000, unlock: 5, swatch: ['#14131a', '#ffcf4d'], desc: 'The barn just got cooler.',
      build: () => {
        const g = new T.Group();
        const frame = new T.Mesh(new T.BoxGeometry(0.3, 0.02, 0.04), M(0x14131a));
        frame.position.set(0, 0.11, 0.265);
        for (const sx of [-1, 1]) {
          const lens = new T.Mesh(new T.BoxGeometry(0.115, 0.075, 0.03), M(0x14131a));
          lens.position.set(sx * 0.082, 0.06, 0.265);
          lens.rotation.z = sx * 0.06;
          const shine = new T.Mesh(new T.BoxGeometry(0.03, 0.05, 0.02), M(0x6d7a86));
          shine.position.set(sx * 0.082 - 0.03, 0.065, 0.285);
          shine.rotation.z = 0.5;
          g.add(lens, shine);
        }
        g.add(frame, mouthArc(-0.06, 0.07, true));
        return g;
      } },
  ];

  /* ------------------------------------------------------- shovels */

  function hayLoad(y, w) {
    const load = new T.Mesh(new T.BoxGeometry(w || 0.56, 0.3, 0.3), M(0xe0b043, true));
    load.position.y = y;
    load.scale.set(0.02, 0.02, 0.02);
    return load;
  }

  function spadeSkin(handleColor, bladeColor, flat) {
    return () => {
      const g = new T.Group();
      const handle = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 1.9, 6), M(handleColor));
      handle.position.y = -0.95;
      const blade = new T.Mesh(new T.BoxGeometry(0.62, 0.72, 0.1), M(bladeColor, flat !== false));
      blade.position.y = -1.95;
      const load = hayLoad(-2.08);
      g.add(handle, blade, load);
      return { group: g, blade, load };
    };
  }

  const SHOVEL_SKINS = [
    { id: 'auto', name: 'Standard', price: 0, swatch: ['#cdd6dd', '#8b5a2b'], desc: 'Whatever you bought in the shop.',
      build: spadeSkin(0x8b5a2b, 0xcdd6dd) },
    { id: 'blue', name: 'Blue Steel', price: 1500, swatch: ['#5b9bd5'], desc: 'Powder coated, barn ready.',
      build: spadeSkin(0x24405c, 0x5b9bd5) },
    { id: 'copper', name: 'Copper Spade', price: 3500, swatch: ['#c87d3f'], desc: 'Turns green if you sweat.',
      build: spadeSkin(0x5a3a1c, 0xc87d3f) },
    { id: 'pitchfork', name: 'Pitchfork', price: 8000, swatch: ['#b9c2c9'], desc: 'Four tines, no waiting.',
      build: () => {
        const g = new T.Group();
        const m = M(0xb9c2c9, true);
        const handle = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 1.9, 6), M(0x7c4f2a));
        handle.position.y = -0.95;
        const cross = new T.Mesh(new T.BoxGeometry(0.62, 0.1, 0.1), m);
        cross.position.y = -1.9;
        g.add(handle, cross);
        for (let i = 0; i < 4; i++) {
          const tine = new T.Mesh(new T.ConeGeometry(0.05, 0.62, 6), m);
          tine.position.set(-0.24 + i * 0.16, -2.2, 0);
          tine.rotation.x = Math.PI;
          g.add(tine);
        }
        const load = hayLoad(-2.16, 0.5);
        g.add(load);
        return { group: g, blade: cross, load };
      } },
    { id: 'spoon', name: 'Giant Spoon', price: 15000, swatch: ['#dfe7ee'], desc: 'Borrowed from a very big kitchen.',
      build: () => {
        const g = new T.Group();
        const m = M(0xdfe7ee, true);
        const handle = new T.Mesh(new T.CylinderGeometry(0.055, 0.075, 1.9, 8), m);
        handle.position.y = -0.95;
        const bowl = new T.Mesh(new T.SphereGeometry(0.42, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2), m);
        bowl.position.y = -2.0;
        bowl.rotation.x = Math.PI;
        bowl.scale.z = 0.75;
        const load = hayLoad(-2.1, 0.5);
        g.add(handle, bowl, load);
        return { group: g, blade: bowl, load };
      } },
    { id: 'snow', name: 'Snow Shovel', price: 6000, swatch: ['#3fa7d6', '#d9e6ee'], desc: 'Wrong season, right shape.',
      build: () => {
        const g = new T.Group();
        const handle = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 1.8, 6), M(0x3a4650));
        handle.position.y = -0.9;
        const grip = new T.Mesh(new T.TorusGeometry(0.12, 0.035, 6, 10, Math.PI), M(0x3fa7d6));
        grip.position.y = 0.05;
        grip.rotation.y = Math.PI / 2;
        const scoop = new T.Mesh(new T.BoxGeometry(0.95, 0.5, 0.12), M(0x3fa7d6, true));
        scoop.position.y = -1.95;
        scoop.rotation.x = -0.25;
        const lip = new T.Mesh(new T.BoxGeometry(0.95, 0.07, 0.16), M(0xd9e6ee));
        lip.position.set(0, -2.18, 0.05);
        const load = hayLoad(-2.0, 0.85);
        g.add(handle, grip, scoop, lip, load);
        return { group: g, blade: scoop, load };
      } },
    { id: 'pan', name: 'Frying Pan', price: 22000, swatch: ['#2f3338', '#6b4423'], desc: 'The barn kitchen wants it back.',
      build: () => {
        const g = new T.Group();
        const handle = new T.Mesh(new T.CylinderGeometry(0.055, 0.055, 1.5, 6), M(0x2f3338));
        handle.position.y = -0.8;
        const grip = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 0.5, 6), M(0x6b4423));
        grip.position.y = -0.2;
        const pan = new T.Mesh(new T.CylinderGeometry(0.46, 0.42, 0.18, 14), M(0x2f3338, true));
        pan.position.y = -1.66;
        const inside = new T.Mesh(new T.CylinderGeometry(0.4, 0.4, 0.04, 14), M(0x4a5056));
        inside.position.y = -1.57;
        const load = hayLoad(-1.55, 0.6);
        g.add(handle, grip, pan, inside, load);
        return { group: g, blade: pan, load };
      } },
    { id: 'bone', name: 'Bone Spade', price: 60000, swatch: ['#efe6d2', '#c9bfa4'], desc: 'Dug up in barn one.',
      build: () => {
        const g = new T.Group();
        const bone = M(0xefe6d2, true);
        const shaft = new T.Mesh(new T.CylinderGeometry(0.07, 0.085, 1.7, 7), bone);
        shaft.position.y = -0.9;
        for (const sy of [-0.05, -1.76]) {
          for (const sx of [-1, 1]) {
            const knob = new T.Mesh(new T.SphereGeometry(0.11, 8, 6), bone);
            knob.position.set(sx * 0.09, sy, 0);
            g.add(knob);
          }
        }
        const blade = new T.Mesh(new T.CylinderGeometry(0.5, 0.34, 0.12, 3), M(0xc9bfa4, true));
        blade.position.y = -2.1;
        blade.rotation.x = Math.PI / 2;
        const load = hayLoad(-2.05, 0.5);
        g.add(shaft, blade, load);
        return { group: g, blade, load };
      } },
    { id: 'brolly', name: 'Umbrella', price: 140000, swatch: ['#2b3f72', '#c8322f'], desc: 'It does not even rain in here.',
      build: () => {
        const g = new T.Group();
        const shaft = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 2.1, 6), M(0x4a4038));
        shaft.position.y = -1.05;
        const hook = new T.Mesh(new T.TorusGeometry(0.13, 0.038, 6, 10, Math.PI), M(0x4a4038));
        hook.position.y = 0.05;
        hook.rotation.y = Math.PI / 2;
        const canopy = new T.Group();
        for (let i = 0; i < 8; i++) {
          const panel = new T.Mesh(new T.ConeGeometry(0.34, 0.5, 4), M(i % 2 ? 0x2b3f72 : 0xc8322f, true));
          const a = (i / 8) * Math.PI * 2;
          panel.position.set(Math.cos(a) * 0.3, -1.95, Math.sin(a) * 0.3);
          panel.rotation.z = Math.cos(a) * 0.5;
          panel.rotation.x = -Math.sin(a) * 0.5;
          canopy.add(panel);
        }
        const tip = new T.Mesh(new T.ConeGeometry(0.05, 0.16, 6), M(0x4a4038));
        tip.position.y = -2.25;
        tip.rotation.x = Math.PI;
        const load = hayLoad(-1.85, 0.5);
        g.add(shaft, hook, canopy, tip, load);
        return { group: g, blade: tip, load };
      } },
    { id: 'gold', name: 'Gold Shovel', price: 40000, swatch: ['#ffcf4d', '#c99a1e'], desc: 'Heavier than it looks.',
      build: () => {
        const r = spadeSkin(0xc99a1e, 0xffcf4d)();
        const collar = new T.Mesh(new T.CylinderGeometry(0.09, 0.09, 0.14, 8), M(0xfff0b8, true));
        collar.position.y = -1.6;
        r.group.add(collar);
        return r;
      } },
    { id: 'candy', name: 'Candy Cane', price: 80000, swatch: ['#f4efe4', '#d8384f'], desc: 'Festive. Sticky.',
      build: () => {
        const g = new T.Group();
        const white = M(0xf4efe4), red = M(0xd8384f);
        const stripe = (i) => (i % 2 ? red : white);

        // straight shaft
        for (let i = 0; i < 7; i++) {
          const seg = new T.Mesh(new T.CylinderGeometry(0.075, 0.075, 0.22, 8), stripe(i));
          seg.position.y = -0.18 - i * 0.21;
          g.add(seg);
        }

        /* The hook is the scoop: a half circle of striped segments curving
           down and forward from the bottom of the shaft, cradling the hay.
           Each segment is turned to the tangent — rotating +Y by the angle
           lands it along (-sin a, cos a), which is exactly the tangent. */
        const R = 0.32, CX = R, CY = -1.62, N = 9;
        let mid = null;
        for (let i = 0; i <= N; i++) {
          const a = Math.PI + (i / N) * Math.PI;
          const seg = new T.Mesh(new T.CylinderGeometry(0.075, 0.075, 0.2, 8), stripe(i));
          seg.position.set(CX + Math.cos(a) * R, CY + Math.sin(a) * R, 0);
          seg.rotation.z = a;
          g.add(seg);
          if (i === Math.floor(N / 2)) mid = seg;
        }

        const load = hayLoad(CY - R + 0.18, 0.4);
        load.position.x = CX;
        g.add(load);
        return { group: g, blade: mid, load };
      } },
    { id: 'trident', name: 'Trident', price: 120000, swatch: ['#7fe3d4', '#ffcf4d'], desc: 'Ruler of hay and sea.',
      build: () => {
        const g = new T.Group();
        const shaft = M(0x2f7f74), tip = M(0x7fe3d4, true);
        const handle = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 2.0, 8), shaft);
        handle.position.y = -1.0;
        const cross = new T.Mesh(new T.BoxGeometry(0.72, 0.1, 0.1), tip);
        cross.position.y = -1.98;
        g.add(handle, cross);
        for (const x of [-0.32, 0, 0.32]) {
          const prong = new T.Mesh(new T.ConeGeometry(0.07, x === 0 ? 0.82 : 0.66, 6), tip);
          prong.position.set(x, -2.36 - (x === 0 ? 0.08 : 0), 0);
          prong.rotation.x = Math.PI;
          g.add(prong);
        }
        const gem = new T.Mesh(new T.SphereGeometry(0.1, 10, 8), M(0xffcf4d, true));
        gem.position.y = -1.86;
        g.add(gem);
        const load = hayLoad(-2.2, 0.56);
        g.add(load);
        return { group: g, blade: cross, load };
      } },
    { id: 'neon', name: 'Neon Spade', price: 250000, unlock: 6, swatch: ['#39ff9e', '#1b1e2b'], desc: 'Visible from the loft.',
      build: () => {
        const g = new T.Group();
        const dark = M(0x1b1e2b);
        const glow = new T.MeshLambertMaterial({ color: 0x39ff9e, emissive: 0x24c878, flatShading: true });
        const handle = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 1.9, 6), dark);
        handle.position.y = -0.95;
        for (let i = 0; i < 5; i++) {
          const band = new T.Mesh(new T.CylinderGeometry(0.068, 0.068, 0.08, 6), glow);
          band.position.y = -0.3 - i * 0.34;
          g.add(band);
        }
        const blade = new T.Mesh(new T.BoxGeometry(0.62, 0.72, 0.1), dark);
        blade.position.y = -1.95;
        const edge = new T.Mesh(new T.BoxGeometry(0.66, 0.1, 0.13), glow);
        edge.position.y = -2.3;
        const load = hayLoad(-2.08);
        g.add(handle, blade, edge, load);
        return { group: g, blade, load };
      } },
    { id: 'diamond', name: 'Diamond', price: 400000, unlock: 7, swatch: ['#bff3ff', '#7ad7f0'], desc: 'Cuts hay it has not met yet.',
      build: () => {
        const g = new T.Group();
        const handle = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 1.9, 6), M(0x4a6b78));
        handle.position.y = -0.95;
        const blade = new T.Mesh(new T.OctahedronGeometry(0.46, 0), new T.MeshLambertMaterial({
          color: 0xbff3ff, flatShading: true, transparent: true, opacity: 0.85,
        }));
        blade.position.y = -2.0;
        blade.scale.set(0.8, 1.1, 0.5);
        const load = hayLoad(-2.1, 0.5);
        g.add(handle, blade, load);
        return { group: g, blade, load };
      } },
    { id: 'lantern', name: 'Lantern Spade', price: 0, need: 'stash', swatch: ['#3f3a33', '#ffd98a'],
      desc: 'Found behind barn 8. Somebody used to dig by its light.',
      build: () => {
        const g = new T.Group();
        const iron = M(0x3f3a33);
        const handle = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 1.9, 6), M(0x5a4a35));
        handle.position.y = -0.95;
        const blade = new T.Mesh(new T.BoxGeometry(0.6, 0.7, 0.09), iron);
        blade.position.y = -1.95;
        const edge = new T.Mesh(new T.BoxGeometry(0.6, 0.09, 0.12), M(0xb9c2c9, true));
        edge.position.y = -2.3;
        g.add(handle, blade, edge);

        /* The lantern, hung off a bracket. It has to be big enough and bright
           enough to read as a lantern at arm's length, not a lump on the
           shaft — so brass, a glass belly and a flame that lights the blade. */
        const brass = M(0xc9a244, true);
        const bracket = new T.Mesh(new T.BoxGeometry(0.4, 0.06, 0.06), iron);
        bracket.position.set(0.2, -0.5, 0);
        const hook = new T.Mesh(new T.TorusGeometry(0.06, 0.018, 5, 9), brass);
        hook.position.set(0.4, -0.56, 0);
        const glass = new T.Mesh(new T.CylinderGeometry(0.17, 0.19, 0.34, 8),
          new T.MeshLambertMaterial({ color: 0xffe2a8, emissive: 0xffa82e, transparent: true, opacity: 0.9 }));
        glass.position.set(0.4, -0.84, 0);
        const cap = new T.Mesh(new T.ConeGeometry(0.23, 0.16, 8), brass);
        cap.position.set(0.4, -0.63, 0);
        const base = new T.Mesh(new T.CylinderGeometry(0.21, 0.21, 0.07, 8), brass);
        base.position.set(0.4, -1.04, 0);
        for (let i = 0; i < 4; i++) {           // cage bars down the glass
          const a = (i / 4) * Math.PI * 2;
          const bar = new T.Mesh(new T.BoxGeometry(0.03, 0.36, 0.03), iron);
          bar.position.set(0.4 + Math.cos(a) * 0.18, -0.84, Math.sin(a) * 0.18);
          g.add(bar);
        }
        const flame = new T.Mesh(new T.SphereGeometry(0.09, 8, 6),
          new T.MeshLambertMaterial({ color: 0xfff0c4, emissive: 0xffc255 }));
        flame.position.set(0.4, -0.86, 0);
        const light = new T.PointLight(0xffc477, 9, 8, 2);
        light.position.set(0.4, -0.86, 0);
        g.add(bracket, hook, glass, cap, base, flame, light);

        const load = hayLoad(-2.06);
        g.add(load);
        return { group: g, blade, load };
      } },
    { id: 'diamondx', name: 'Diamond Excavator', price: 0, need: 'stash', swatch: ['#9ef0ff', '#ffd76b'],
      desc: 'Found behind barn 12. Nobody leaves this in a crate by accident.',
      build: () => {
        const g = new T.Group();
        const chrome = new T.MeshLambertMaterial({ color: 0xdfe7ec, flatShading: true });
        const gold = M(0xffcf4d, true);
        const handle = new T.Mesh(new T.CylinderGeometry(0.065, 0.055, 1.9, 8), chrome);
        handle.position.y = -0.95;
        g.add(handle);
        [-0.35, -1.0, -1.62].forEach((y) => {
          const collar = new T.Mesh(new T.TorusGeometry(0.082, 0.026, 6, 14), gold);
          collar.position.y = y;
          collar.rotation.x = Math.PI / 2;
          g.add(collar);
        });
        const grip = new T.Mesh(new T.TorusGeometry(0.15, 0.05, 6, 14), gold);
        grip.position.y = 0.04;
        g.add(grip);

        // a faceted gem where the blade should be
        const gem = new T.MeshLambertMaterial({
          color: 0x9ef0ff, flatShading: true, transparent: true, opacity: 0.92, emissive: 0x1d5f74,
        });
        const blade = new T.Mesh(new T.OctahedronGeometry(0.52, 0), gem);
        blade.position.y = -2.02;
        blade.scale.set(0.92, 1.25, 0.55);
        const crown = new T.Mesh(new T.ConeGeometry(0.4, 0.3, 6), gem);
        crown.position.y = -1.64;
        const shard = new T.Mesh(new T.OctahedronGeometry(0.16, 0), gem);
        shard.position.set(0.3, -2.3, 0);
        shard.rotation.z = 0.7;
        const shard2 = new T.Mesh(new T.OctahedronGeometry(0.14, 0), gem);
        shard2.position.set(-0.29, -2.26, 0);
        shard2.rotation.z = -0.6;
        const glint = new T.PointLight(0xbdf3ff, 4, 5, 2);
        glint.position.y = -2.0;
        g.add(blade, crown, shard, shard2, glint);

        const load = hayLoad(-2.1, 0.5);
        g.add(load);
        return { group: g, blade, load };
      } },
    { id: 'heirloom', name: 'Heirloom Spade', price: 0, need: 3, swatch: ['#8a6a3a', '#d8a944'],
      desc: 'Three farms handed on, and this came back every time.',
      build: () => {
        const g = new T.Group();
        const worn = M(0x8a6a3a);
        const handle = new T.Mesh(new T.CylinderGeometry(0.062, 0.055, 1.9, 8), worn);
        handle.position.y = -0.95;
        // brass collars where three owners each re-bound the shaft
        [-0.42, -1.02, -1.6].forEach((y) => {
          const collar = new T.Mesh(new T.TorusGeometry(0.075, 0.022, 6, 14), M(0xd8a944, true));
          collar.position.y = y;
          collar.rotation.x = Math.PI / 2;
          g.add(collar);
        });
        const grip = new T.Mesh(new T.TorusGeometry(0.14, 0.045, 6, 14), worn);
        grip.position.y = 0.04;
        const blade = new T.Mesh(new T.BoxGeometry(0.62, 0.72, 0.09), M(0x8f9aa2, true));
        blade.position.y = -1.96;
        const edge = new T.Mesh(new T.BoxGeometry(0.62, 0.1, 0.12), M(0xeef4f7, true));
        edge.position.y = -2.32;
        // a brass name plate, re-stamped by each owner
        const plate = new T.Mesh(new T.BoxGeometry(0.34, 0.12, 0.02), M(0xd8a944, true));
        plate.position.set(0, -1.82, 0.055);
        const load = hayLoad(-2.08);
        g.add(handle, grip, blade, edge, plate, load);
        return { group: g, blade, load };
      } },
  ];

  /* ---------------------------------------------------------- apply */

  const byId = (list, id) => list.find((x) => x.id === id) || list[0];

  function applyLook(rig, look, tier) {
    const p = rig.parts;
    const outfit = byId(OUTFITS, look.outfit);
    const shirtMat = material(outfit.shirt);
    const trouserMat = material(outfit.trousers);
    p.shirtMeshes.forEach((m) => { m.material = shirtMat; });
    p.trouserMeshes.forEach((m) => { m.material = trouserMat; });
    // the look is re-applied on every equip and every barn, so drop the
    // materials it replaces (their textures are cached and shared, so the
    // cache keeps owning those)
    (p.outfitMats || []).forEach((m) => m.dispose());
    p.outfitMats = [shirtMat, trouserMat];

    // face
    if (p.faceAnchor) {
      if (p.face) { p.faceAnchor.remove(p.face); disposeTree(p.face); }
      p.face = byId(FACES, look.face).build();
      p.faceAnchor.add(p.face);
    }

    // hat
    if (p.hat) { p.hatAnchor.remove(p.hat); disposeTree(p.hat); }
    p.hat = byId(HATS, look.hat).build();
    p.hatAnchor.add(p.hat);

    // shovel — 'auto' keeps the shop tier's own look
    if (p.shovel) { p.armR.remove(p.shovel); disposeTree(p.shovel); }
    const skin = byId(SHOVEL_SKINS, look.shovel);
    const built = skin.id === 'auto' ? autoShovel(tier || 0) : skin.build();
    p.shovel = built.group;
    p.blade = built.blade;
    p.load = built.load;
    p.shovel.position.set(0.02, -0.66, 0.06);
    p.shovel.rotation.set(-2.45, 0, 0.22);
    const s = 0.85 + Math.min(tier || 0, 7) * 0.055;
    p.shovel.scale.setScalar(s);
    p.armR.add(p.shovel);
  }

  function autoShovel(tier) {
    const handle = tier >= 6 ? 0x4f3117 : tier >= 3 ? 0x8b5a2b : 0xc9a06a;
    const blade = tier >= 7 ? 0xffe9a8 : tier >= 4 ? 0xcdd6dd : tier >= 2 ? 0xa4703f : 0xe8c79a;
    return spadeSkin(handle, blade)();
  }

  function disposeTree(obj) {
    obj.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
    });
  }

  function priceOf(kind, id) {
    const item = byId(listFor(kind), id);
    return item ? item.price : 0;
  }
  function listFor(kind) {
    return kind === 'outfit' ? OUTFITS
      : kind === 'hat' ? HATS
      : kind === 'face' ? FACES
      : SHOVEL_SKINS;
  }

  return { OUTFITS, OUTFIT_CATS, HATS, FACES, SHOVEL_SKINS, applyLook, listFor, priceOf, byId };
})();
