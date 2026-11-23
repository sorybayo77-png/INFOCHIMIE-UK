/* compose.js — création rapide de composés : bibliothèque de composés standard, noms (nomenclature simple),
   formules semi-développées (CH3-CH2-OH), formules brutes (C2H6O → isomères connus) et SMILES (CCO, c1ccccc1).
   Toutes les entrées produisent une molécule 2D (coordonnées de l'éditeur, liaison = 48 px). */
(function (G) {
  'use strict';
  const C = G.Chem, L = 48;
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘`]/g, "'").replace(/\s+/g, ' ').trim();
  const SUBD = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' };
  const fail = (msg) => { const e = new Error(msg); e.user = true; throw e; };

  // =====================================================================
  // SMILES → graphe
  // =====================================================================
  const TWO = ['Cl', 'Br'], ONE = ['B', 'C', 'N', 'O', 'P', 'S', 'F', 'I'], AROM = ['b', 'c', 'n', 'o', 'p', 's'];
  function parseSMILES(s) {
    s = String(s).trim(); if (!s) fail('SMILES vide.');
    const atoms = [], bonds = [], stack = [], rings = {};
    let prev = -1, bond = null, i = 0;
    const addAtom = (a) => {
      const k = atoms.push(a) - 1;
      if (prev >= 0) bonds.push({ a: prev, b: k, o: bond != null ? bond : (atoms[prev].ar && a.ar ? 1.5 : 1) });
      prev = k; bond = null;
    };
    while (i < s.length) {
      const ch = s[i];
      if (ch === '(') { if (prev < 0) fail('Parenthèse mal placée dans le SMILES.'); stack.push(prev); i++; continue; }
      if (ch === ')') { if (!stack.length) fail('Parenthèse fermante en trop dans le SMILES.'); prev = stack.pop(); i++; continue; }
      if (ch === '-') { bond = 1; i++; continue; }
      if (ch === '=') { bond = 2; i++; continue; }
      if (ch === '#') { bond = 3; i++; continue; }
      if (ch === ':') { bond = 1.5; i++; continue; }
      if (ch === '/' || ch === '\\') { i++; continue; }
      if (ch === '.') { prev = -1; bond = null; i++; continue; }
      if (/[0-9%]/.test(ch)) {
        let num; if (ch === '%') { num = s.slice(i + 1, i + 3); i += 3; } else { num = ch; i++; }
        if (prev < 0) fail('Numéro de cycle mal placé dans le SMILES.');
        if (rings[num]) { const r = rings[num]; if (r.a === prev) fail('Cycle invalide dans le SMILES.'); bonds.push({ a: r.a, b: prev, o: bond != null ? bond : r.o != null ? r.o : (atoms[r.a].ar && atoms[prev].ar ? 1.5 : 1) }); delete rings[num]; }
        else rings[num] = { a: prev, o: bond };
        bond = null; continue;
      }
      if (ch === '[') {
        const j = s.indexOf(']', i); if (j < 0) fail('Crochet non fermé dans le SMILES.');
        const inner = s.slice(i + 1, j); i = j + 1;
        const m = inner.match(/^(\d*)([A-Z][a-z]?|[bcnops])(@*)(?:H(\d?))?([+-]+\d*)?(?::\d+)?$/);
        if (!m) fail('Atome entre crochets non reconnu : [' + inner + '].');
        if (m[5] && !/^[+-]0$/.test(m[5])) fail('Les ions et charges (' + m[5] + ') ne sont pas pris en charge par l’éditeur.');
        const ar = /^[a-z]/.test(m[2]), el = ar ? m[2].toUpperCase() : m[2];
        if (!C.EL[el]) fail('Élément non pris en charge : ' + el + '.');
        addAtom({ el, ar, hx: m[4] !== undefined ? (m[4] === '' ? 1 : +m[4]) : 0, br: true });
        continue;
      }
      const two = s.slice(i, i + 2);
      if (TWO.includes(two)) { addAtom({ el: two, ar: false }); i += 2; continue; }
      if (ONE.includes(ch)) { addAtom({ el: ch, ar: false }); i++; continue; }
      if (AROM.includes(ch)) { addAtom({ el: ch.toUpperCase(), ar: true }); i++; continue; }
      if (ch === ' ') { i++; continue; }
      fail('Caractère inattendu « ' + ch + ' » dans le SMILES.');
    }
    if (stack.length) fail('Parenthèse non fermée dans le SMILES.');
    if (Object.keys(rings).length) fail('Cycle non fermé dans le SMILES (chiffre ' + Object.keys(rings)[0] + ').');
    kekulize(atoms, bonds);
    return { atoms: atoms.map((a) => ({ el: a.el })), bonds: bonds.map((b) => ({ a: b.a, b: b.b, o: b.o })) };
  }
  // liaisons aromatiques → alternance simple/double (structure de Kekulé)
  function kekulize(atoms, bonds) {
    const arB = bonds.filter((b) => b.o === 1.5); if (!arB.length) return;
    const VAL = { C: 4, N: 3, O: 2, S: 2, P: 3, B: 3 };
    const need = atoms.map((a, i) => {
      if (!a.ar) return false;
      let used = a.hx || 0; bonds.forEach((b) => { if (b.a === i || b.b === i) used += b.o === 1.5 ? 1 : b.o; });
      return (VAL[a.el] || 4) - used >= 1 && !(a.br && a.el === 'N' && a.hx);
    });
    const nb = atoms.map(() => []); arB.forEach((b) => { if (need[b.a] && need[b.b]) { nb[b.a].push(b); nb[b.b].push(b); } });
    const mate = new Map(), todo = atoms.map((a, i) => i).filter((i) => need[i]);
    const solve = () => {
      const free = todo.filter((i) => !mate.has(i)); if (!free.length) return true;
      let best = -1, opts = null;
      for (const i of free) { const o = nb[i].filter((b) => !mate.has(b.a === i ? b.b : b.a)); if (!o.length) return false; if (!opts || o.length < opts.length) { best = i; opts = o; } }
      for (const b of opts) { const j = b.a === best ? b.b : b.a; mate.set(best, b); mate.set(j, b); if (solve()) return true; mate.delete(best); mate.delete(j); }
      return false;
    };
    const ok = solve();
    arB.forEach((b) => { b.o = 1; });
    if (ok) new Set(mate.values()).forEach((b) => { b.o = 2; });
  }

  // =====================================================================
  // Coordonnées 2D (cycles en polygones réguliers, chaînes en zigzag)
  // =====================================================================
  const rot = (v, t) => [v[0] * Math.cos(t) - v[1] * Math.sin(t), v[0] * Math.sin(t) + v[1] * Math.cos(t)];
  const ang = (v) => Math.atan2(v[1], v[0]);
  function findRings(n, adj, bonds) {
    const cyc = [];
    bonds.forEach((b) => {
      // plus court chemin de b.a à b.b sans la liaison directe
      const par = new Array(n).fill(-1); par[b.a] = b.a; const q = [b.a];
      while (q.length && par[b.b] < 0) { const x = q.shift(); for (const y of adj[x]) { if ((x === b.a && y.j === b.b) || (x === b.b && y.j === b.a)) continue; if (par[y.j] < 0) { par[y.j] = x; q.push(y.j); } } }
      if (par[b.b] < 0) return;
      const path = [b.b]; let x = b.b; while (x !== b.a) { x = par[x]; path.push(x); }
      cyc.push(path.reverse());
    });
    const ek = (a, b) => (a < b ? a + ',' + b : b + ',' + a), eidx = new Map(); bonds.forEach((b, k) => eidx.set(ek(b.a, b.b), k));
    const vec = (r) => { let v = 0n; r.forEach((a, k) => { v ^= 1n << BigInt(eidx.get(ek(a, r[(k + 1) % r.length]))); }); return v; };
    const seen = new Set(), basis = [], out = [];
    cyc.sort((p, q) => p.length - q.length).forEach((r) => {
      const key = r.slice().sort((a, b) => a - b).join(','); if (seen.has(key)) return; seen.add(key);
      let v = vec(r); for (const [piv, bv] of basis) if ((v >> piv) & 1n) v ^= bv;
      if (v === 0n) return;
      let piv = 0n; while (!((v >> piv) & 1n)) piv++;
      basis.forEach((e) => { if ((e[1] >> piv) & 1n) e[1] ^= v; }); basis.push([piv, v]); out.push(r);
    });
    return out;
  }
  function placeRingSystem(rs) {
    const P = new Map(), done = new Set();
    const poly = (r, center, start) => { const m = r.length, R = 1 / (2 * Math.sin(Math.PI / m)); r.forEach((a, k) => { if (!P.has(a)) P.set(a, [center[0] + R * Math.cos(start + 2 * Math.PI * k / m), center[1] + R * Math.sin(start + 2 * Math.PI * k / m)]); }); };
    const first = rs.slice().sort((a, b) => b.length - a.length)[0];
    poly(first, [0, 0], -Math.PI / 2); done.add(first);
    let guard = 0;
    while (done.size < rs.length && guard++ < 200) {
      let pick = null, sh = null;
      for (const r of rs) { if (done.has(r)) continue; const s = r.filter((a) => P.has(a)); if (s.length && (!pick || s.length === 2 || (sh.length !== 2 && s.length > sh.length))) { pick = r; sh = s; if (s.length === 2) break; } }
      if (!pick) { const r = rs.find((x) => !done.has(x)); poly(r, [0, (done.size + 1) * 3], -Math.PI / 2); done.add(r); continue; }
      const r = pick, m = r.length, cen = [...P.values()].reduce((s, p) => [s[0] + p[0] / P.size, s[1] + p[1] / P.size], [0, 0]);
      let u = -1, v = -1;
      for (let k = 0; k < m; k++) { if (P.has(r[k]) && P.has(r[(k + 1) % m])) { u = k; v = (k + 1) % m; break; } }
      if (u >= 0) {
        const pu = P.get(r[u]), pv = P.get(r[v]), mid = [(pu[0] + pv[0]) / 2, (pu[1] + pv[1]) / 2], e = [pv[0] - pu[0], pv[1] - pu[1]], el = Math.hypot(e[0], e[1]) || 1;
        const nrm = [-e[1] / el, e[0] / el], ap = 1 / (2 * Math.tan(Math.PI / m));
        const c1 = [mid[0] + nrm[0] * ap, mid[1] + nrm[1] * ap], c2 = [mid[0] - nrm[0] * ap, mid[1] - nrm[1] * ap];
        const c = Math.hypot(c1[0] - cen[0], c1[1] - cen[1]) >= Math.hypot(c2[0] - cen[0], c2[1] - cen[1]) ? c1 : c2;
        const tv = ang([pv[0] - c[0], pv[1] - c[1]]), tu = ang([pu[0] - c[0], pu[1] - c[1]]);
        let d = tv - tu; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
        const step = Math.sign(d || 1) * 2 * Math.PI / m, R = 1 / (2 * Math.sin(Math.PI / m));
        for (let k = 1; k < m - 1; k++) { const a = r[(v + k) % m]; if (!P.has(a)) P.set(a, [c[0] + R * Math.cos(tv + step * k), c[1] + R * Math.sin(tv + step * k)]); }
      } else {
        const a = sh[0], pa = P.get(a), dir = [pa[0] - cen[0], pa[1] - cen[1]], dl = Math.hypot(dir[0], dir[1]) || 1, R = 1 / (2 * Math.sin(Math.PI / m));
        const c = [pa[0] + dir[0] / dl * R, pa[1] + dir[1] / dl * R], k0 = r.indexOf(a), t0 = ang([pa[0] - c[0], pa[1] - c[1]]);
        r.forEach((x, k) => { if (!P.has(x)) { const t = t0 + 2 * Math.PI * ((k - k0 + m) % m) / m; P.set(x, [c[0] + R * Math.cos(t), c[1] + R * Math.sin(t)]); } });
      }
      done.add(r);
    }
    return P;
  }
  function layout2D(g) {
    const n = g.atoms.length; if (!n) fail('Aucun atome.');
    const adj = g.atoms.map(() => []); g.bonds.forEach((b, k) => { adj[b.a].push({ j: b.b, o: b.o, k }); adj[b.b].push({ j: b.a, o: b.o, k }); });
    const rings = findRings(n, adj, g.bonds);
    // systèmes de cycles (cycles partageant des atomes)
    const sysOf = new Array(n).fill(-1), systems = [];
    rings.forEach((r) => {
      const hit = [...new Set(r.map((a) => sysOf[a]).filter((x) => x >= 0))];
      let id; if (!hit.length) { id = systems.push({ rings: [], atoms: new Set() }) - 1; } else { id = hit[0]; hit.slice(1).forEach((h) => { systems[h].rings.forEach((x) => systems[id].rings.push(x)); systems[h].atoms.forEach((a) => { systems[id].atoms.add(a); sysOf[a] = id; }); systems[h] = { rings: [], atoms: new Set(), dead: true }; }); }
      systems[id].rings.push(r); r.forEach((a) => { systems[id].atoms.add(a); sysOf[a] = id; });
    });
    const local = systems.map((s) => (s.dead ? null : placeRingSystem(s.rings)));
    const pos = new Array(n).fill(null), side = new Array(n).fill(1), sysPlaced = new Set();
    const clash = (p, skip) => { let s = 0; for (let q = 0; q < n; q++) { if (!pos[q] || skip.includes(q)) continue; const d = Math.hypot(pos[q][0] - p[0], pos[q][1] - p[1]); if (d < 1.25) s += (1.25 - d) * (1.25 - d) * 10 + (d < 0.4 ? 50 : 0); } return s; };
    const ringCenterDir = (a) => { const nb = adj[a].filter((x) => sysOf[x.j] === sysOf[a] && sysOf[a] >= 0 && pos[x.j]); if (!nb.length) return null; const c = nb.reduce((s, x) => [s[0] + pos[x.j][0] / nb.length, s[1] + pos[x.j][1] / nb.length], [0, 0]); return ang([pos[a][0] - c[0], pos[a][1] - c[1]]); };
    const placeSystem = (sid, anchor, target, theta) => {
      const P = local[sid], pl = P.get(anchor), nb = adj[anchor].filter((x) => sysOf[x.j] === sid);
      const cl = nb.reduce((s, x) => { const p = P.get(x.j); return [s[0] + p[0] / nb.length, s[1] + p[1] / nb.length]; }, [0, 0]);
      const out = ang([pl[0] - cl[0], pl[1] - cl[1]]);
      let best = null;
      const want = theta + Math.PI; // la direction « sortante » du cycle pointe vers l'atome déjà placé
      for (const mir of [1, -1]) {
        const phi = mir === 1 ? want - out : want + out;
        const tr = (p) => { let v = [p[0] - pl[0], (p[1] - pl[1]) * mir]; v = rot(v, phi); return [target[0] + v[0], target[1] + v[1]]; };
        const pts = [...P.entries()].map(([a, p]) => [a, tr(p)]);
        const sc = pts.reduce((s, [a, p]) => s + clash(p, [a]), 0);
        if (!best || sc < best.sc) best = { sc, pts };
      }
      best.pts.forEach(([a, p]) => { pos[a] = p; }); sysPlaced.add(sid);
      return [...P.keys()];
    };
    const comps = []; { const seen = new Array(n).fill(false); for (let s = 0; s < n; s++) { if (seen[s]) continue; const c = []; const q = [s]; seen[s] = true; while (q.length) { const x = q.shift(); c.push(x); adj[x].forEach((y) => { if (!seen[y.j]) { seen[y.j] = true; q.push(y.j); } }); } comps.push(c); } }
    let offX = 0;
    comps.forEach((comp) => {
      // départ : le plus grand système de cycles, sinon une extrémité de la plus longue chaîne
      const sids = [...new Set(comp.map((a) => sysOf[a]).filter((x) => x >= 0))];
      const queue = [];
      if (sids.length) {
        const sid = sids.sort((a, b) => systems[b].atoms.size - systems[a].atoms.size)[0];
        local[sid].forEach((p, a) => { pos[a] = [p[0], p[1]]; queue.push(a); }); sysPlaced.add(sid);
      } else {
        const far = (s) => { const d = new Map([[s, 0]]), q = [s]; let last = s; while (q.length) { const x = q.shift(); last = x; adj[x].forEach((y) => { if (!d.has(y.j)) { d.set(y.j, d.get(x) + 1); q.push(y.j); } }); } return last; };
        const s = far(far(comp[0])); pos[s] = [0, 0]; queue.push(s);
      }
      while (queue.length) {
        const a = queue.shift(), placedN = adj[a].filter((x) => pos[x.j]), un = adj[a].filter((x) => !pos[x.j]);
        if (!un.length) continue;
        let angles = [];
        const lin = adj[a].some((x) => x.o === 3) || adj[a].filter((x) => x.o === 2).length >= 2;
        const rd = sysOf[a] >= 0 ? ringCenterDir(a) : null;
        if (rd != null && placedN.every((x) => sysOf[x.j] === sysOf[a])) {
          angles = un.length === 1 ? [rd] : un.map((_, k) => rd + (k - (un.length - 1) / 2) * (Math.PI / 3.2));
        } else if (!placedN.length) {
          angles = un.map((_, k) => -Math.PI / 6 + 2 * Math.PI * k / un.length);
        } else if (placedN.length === 1) {
          const tin = ang([pos[placedN[0].j][0] - pos[a][0], pos[placedN[0].j][1] - pos[a][1]]), s = side[a];
          if (lin && un.length === 1) angles = [tin + Math.PI];
          else if (un.length === 1) angles = [tin + s * 2 * Math.PI / 3];
          else if (un.length === 2) angles = [tin + s * 2 * Math.PI / 3, tin - s * 2 * Math.PI / 3];
          else angles = un.map((_, k) => tin + 2 * Math.PI * (k + 1) / (un.length + 1));
        } else {
          const ds = placedN.map((x) => ang([pos[x.j][0] - pos[a][0], pos[x.j][1] - pos[a][1]])).sort((p, q) => p - q);
          let g0 = 0, gw = -1; ds.forEach((v, k) => { const nx = k === ds.length - 1 ? ds[0] + 2 * Math.PI : ds[k + 1]; if (nx - v > gw) { gw = nx - v; g0 = v; } });
          angles = un.map((_, k) => g0 + gw * (k + 1) / (un.length + 1));
        }
        un.forEach((x, k) => {
          if (pos[x.j]) return;
          let t = angles[k];
          const tries = [t, t + Math.PI / 6, t - Math.PI / 6, t + Math.PI / 3, t - Math.PI / 3, t + Math.PI / 2, t - Math.PI / 2];
          if (placedN.length === 1 && un.length === 1 && !lin) { const tin = ang([pos[placedN[0].j][0] - pos[a][0], pos[placedN[0].j][1] - pos[a][1]]); tries.splice(1, 0, tin - side[a] * 2 * Math.PI / 3); }
          let best = null;
          for (const tt of tries) { const p = [pos[a][0] + Math.cos(tt), pos[a][1] + Math.sin(tt)]; const sc = clash(p, [a]); if (!best || sc < best.sc - 1e-9) best = { sc, tt, p }; if (sc === 0) break; }
          t = best.tt;
          if (sysOf[x.j] >= 0 && !sysPlaced.has(sysOf[x.j])) { placeSystem(sysOf[x.j], x.j, best.p, t).forEach((q) => queue.push(q)); }
          else {
            pos[x.j] = best.p;
            if (placedN.length === 1) { let dev = t - ang([pos[a][0] - pos[placedN[0].j][0], pos[a][1] - pos[placedN[0].j][1]]); while (dev > Math.PI) dev -= 2 * Math.PI; while (dev <= -Math.PI) dev += 2 * Math.PI; side[x.j] = dev < 0 ? -1 : 1; }
            else side[x.j] = Math.sin(t) < 0 ? -1 : 1;
            queue.push(x.j);
          }
        });
      }
      // décalage des fragments successifs
      const xs = comp.map((a) => pos[a][0]), minX = Math.min(...xs), maxX = Math.max(...xs);
      comp.forEach((a) => { pos[a] = [pos[a][0] - minX + offX, pos[a][1]]; }); offX += maxX - minX + 2;
    });
    // orientation : la plus grande dimension à l'horizontale
    const cx = pos.reduce((s, p) => s + p[0], 0) / n, cy = pos.reduce((s, p) => s + p[1], 0) / n;
    let sxx = 0, syy = 0, sxy = 0; pos.forEach((p) => { const dx = p[0] - cx, dy = p[1] - cy; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; });
    const w = Math.max(...pos.map((p) => p[0])) - Math.min(...pos.map((p) => p[0])), h = Math.max(...pos.map((p) => p[1])) - Math.min(...pos.map((p) => p[1]));
    let fin = pos.map((p) => [p[0] - cx, p[1] - cy]);
    if (h > w * 1.25 && comps.length === 1) { const t = -0.5 * Math.atan2(2 * sxy, sxx - syy); fin = fin.map((p) => rot(p, t)); }
    return { name: g.name || '', atoms: g.atoms.map((a, i) => ({ el: a.el, x: +(fin[i][0] * L).toFixed(2), y: +(fin[i][1] * L).toFixed(2) })), bonds: g.bonds.map((b) => ({ a: b.a, b: b.b, o: b.o })) };
  }

  // =====================================================================
  // Formules semi-développées : CH3-CH2-OH, CH3COOH, (CH3)3C-OH, CH2=CH-CH3, C6H5-OH…
  // =====================================================================
  const RING6 = (hw, attach) => ({ atoms: [0, 1, 2, 3, 4, 5].map((k) => ({ el: 'C', hw: attach.includes(k) ? 0 : hw })), bonds: [[0, 1, 2], [1, 2, 1], [2, 3, 2], [3, 4, 1], [4, 5, 2], [5, 0, 1]] });
  const GROUPS = [
    ['C6H5', () => ({ ...RING6(1, [0]), in: 0, out: null })],
    ['C6H4', () => ({ ...RING6(1, [0, 3]), in: 0, out: 3 })],
    ['CONH2', () => ({ atoms: [{ el: 'C', hw: 0 }, { el: 'O', hw: 0 }, { el: 'N', hw: 2 }], bonds: [[0, 1, 2], [0, 2, 1]], in: 0, out: null })],
    ['CONH', () => ({ atoms: [{ el: 'C', hw: 0 }, { el: 'O', hw: 0 }, { el: 'N', hw: 1 }], bonds: [[0, 1, 2], [0, 2, 1]], in: 0, out: 2 })],
    ['COOH', () => ({ atoms: [{ el: 'C', hw: 0 }, { el: 'O', hw: 0 }, { el: 'O', hw: 1 }], bonds: [[0, 1, 2], [0, 2, 1]], in: 0, out: null })],
    ['CO2H', () => ({ atoms: [{ el: 'C', hw: 0 }, { el: 'O', hw: 0 }, { el: 'O', hw: 1 }], bonds: [[0, 1, 2], [0, 2, 1]], in: 0, out: null })],
    ['COCl', () => ({ atoms: [{ el: 'C', hw: 0 }, { el: 'O', hw: 0 }, { el: 'Cl', hw: 0 }], bonds: [[0, 1, 2], [0, 2, 1]], in: 0, out: null })],
    ['COO', () => ({ atoms: [{ el: 'C', hw: 0 }, { el: 'O', hw: 0 }, { el: 'O', hw: 0 }], bonds: [[0, 1, 2], [0, 2, 1]], in: 0, out: 2 })],
    ['CO2', () => ({ atoms: [{ el: 'C', hw: 0 }, { el: 'O', hw: 0 }, { el: 'O', hw: 0 }], bonds: [[0, 1, 2], [0, 2, 1]], in: 0, out: 2 })],
    ['OOC', () => ({ atoms: [{ el: 'O', hw: 0 }, { el: 'C', hw: 0 }, { el: 'O', hw: 0 }], bonds: [[0, 1, 1], [1, 2, 2]], in: 0, out: 1 })],
    ['CHOH', () => ({ atoms: [{ el: 'C', hw: 1 }, { el: 'O', hw: 1 }], bonds: [[0, 1, 1]], in: 0, out: 0 })],
    ['CHO', () => ({ atoms: [{ el: 'C', hw: 1 }, { el: 'O', hw: 0 }], bonds: [[0, 1, 2]], in: 0, out: null })],
    ['C4H9', () => ({ atoms: [3, 2, 2, 2].map((h) => ({ el: 'C', hw: h })).reverse(), bonds: [[0, 1, 1], [1, 2, 1], [2, 3, 1]], in: 0, out: null })],
    ['C3H7', () => ({ atoms: [{ el: 'C', hw: 2 }, { el: 'C', hw: 2 }, { el: 'C', hw: 3 }], bonds: [[0, 1, 1], [1, 2, 1]], in: 0, out: null })],
    ['C2H5', () => ({ atoms: [{ el: 'C', hw: 2 }, { el: 'C', hw: 3 }], bonds: [[0, 1, 1]], in: 0, out: null })],
    ['CN', () => ({ atoms: [{ el: 'C', hw: 0 }, { el: 'N', hw: 0 }], bonds: [[0, 1, 3]], in: 0, out: null }), (rest) => !rest || /^[)\-]/.test(rest)],
    ['CO', () => ({ atoms: [{ el: 'C', hw: 0 }, { el: 'O', hw: 0 }], bonds: [[0, 1, 2]], in: 0, out: 0 }), (rest) => !/^H/.test(rest)],
    ['CH4', () => ({ atoms: [{ el: 'C', hw: 4 }], bonds: [], in: 0, out: 0 })],
    ['CH3', () => ({ atoms: [{ el: 'C', hw: 3 }], bonds: [], in: 0, out: 0 })],
    ['CH2', () => ({ atoms: [{ el: 'C', hw: 2 }], bonds: [], in: 0, out: 0 })],
    ['CH', () => ({ atoms: [{ el: 'C', hw: 1 }], bonds: [], in: 0, out: 0 })],
    ['C', () => ({ atoms: [{ el: 'C', hw: 0 }], bonds: [], in: 0, out: 0 })],
    ['OH', () => ({ atoms: [{ el: 'O', hw: 1 }], bonds: [], in: 0, out: null, branch: true })],
    ['SH', () => ({ atoms: [{ el: 'S', hw: 1 }], bonds: [], in: 0, out: null, branch: true })],
    ['NH2', () => ({ atoms: [{ el: 'N', hw: 2 }], bonds: [], in: 0, out: null, branch: true })],
    ['NH', () => ({ atoms: [{ el: 'N', hw: 1 }], bonds: [], in: 0, out: 0 })],
    ['N', () => ({ atoms: [{ el: 'N', hw: 0 }], bonds: [], in: 0, out: 0 })],
    ['O', () => ({ atoms: [{ el: 'O', hw: 0 }], bonds: [], in: 0, out: 0 })],
    ['S', () => ({ atoms: [{ el: 'S', hw: 0 }], bonds: [], in: 0, out: 0 })]
  ];
  const LEAD = [
    ['HOOC', () => ({ atoms: [{ el: 'O', hw: 1 }, { el: 'C', hw: 0 }, { el: 'O', hw: 0 }], bonds: [[0, 1, 1], [1, 2, 2]], in: null, out: 1 })],
    ['HO2C', () => ({ atoms: [{ el: 'O', hw: 1 }, { el: 'C', hw: 0 }, { el: 'O', hw: 0 }], bonds: [[0, 1, 1], [1, 2, 2]], in: null, out: 1 })],
    ['OHC', () => ({ atoms: [{ el: 'O', hw: 0 }, { el: 'C', hw: 1 }], bonds: [[0, 1, 2]], in: null, out: 1 })],
    ['H2N', () => ({ atoms: [{ el: 'N', hw: 2 }], bonds: [], in: null, out: 0 })],
    ['NC', () => ({ atoms: [{ el: 'N', hw: 0 }, { el: 'C', hw: 0 }], bonds: [[0, 1, 3]], in: null, out: 1 })],
    ['HO', () => ({ atoms: [{ el: 'O', hw: 1 }], bonds: [], in: null, out: 0 })],
    ['HS', () => ({ atoms: [{ el: 'S', hw: 1 }], bonds: [], in: null, out: 0 })]
  ];
  const HALO = /^(Cl|Br|F|I)(\d*)/;
  function parseCondensed(src) {
    let s = String(src).replace(/[₀-₉]/g, (d) => SUBD[d]).replace(/[–—−]/g, '-').replace(/≡/g, '#').replace(/\s+/g, '');
    if (!/^[A-Za-z0-9()=#\-]+$/.test(s)) fail('Caractères non reconnus dans la formule.');
    const atoms = [], bonds = [];
    const addGroup = (gr) => { const base = atoms.length; gr.atoms.forEach((a) => atoms.push({ el: a.el, hw: a.hw })); gr.bonds.forEach(([a, b, o]) => bonds.push({ a: base + a, b: base + b, o })); return { in: gr.in == null ? null : base + gr.in, out: gr.out == null ? null : base + gr.out, branch: gr.branch }; };
    const link = (a, b, o) => { if (a == null || b == null) return; bonds.push({ a, b, o: o || 1 }); };
    // analyse d'une séquence ; renvoie { first, cur }
    function seq(str, attachTo, attachOrder) {
      let i = 0, cur = null, first = null, pend = attachOrder || null, extraH = 0, prefix = [];
      const startAt = attachTo;
      const place = (gr, isLead) => {
        const g = addGroup(gr); if (extraH && atoms[g.out != null ? g.out : g.in]) { const k = g.in != null ? g.in : g.out; if (atoms[k].hw != null) atoms[k].hw += extraH; extraH = 0; }
        const target = cur != null ? cur : startAt;
        if (g.in != null && target != null) link(target, g.in, pend);
        else if (isLead && target != null && g.out != null) link(target, g.out, pend);
        pend = null;
        if (first == null) first = g.in != null ? g.in : g.out;
        if (g.branch) { if (cur == null && startAt == null) cur = g.in; return; }
        const nc = g.out != null ? g.out : (cur == null ? g.in : cur);
        if (prefix.length && atoms[nc]) { prefix.forEach(([sub, n]) => { for (let k = 0; k < n; k++) seq(sub, nc, 1); }); prefix = []; }
        cur = g.out != null ? g.out : (cur == null ? g.in : cur);
      };
      while (i < str.length) {
        const rest = str.slice(i), ch = str[i];
        if (ch === '-') { pend = 1; i++; continue; }
        if (ch === '=') { pend = 2; i++; continue; }
        if (ch === '#') { pend = 3; i++; continue; }
        if (ch === '(') {
          let d = 0, j = i; for (; j < str.length; j++) { if (str[j] === '(') d++; else if (str[j] === ')') { d--; if (!d) break; } }
          if (d) fail('Parenthèse non fermée.');
          const inner = str.slice(i + 1, j); let k = j + 1, num = ''; while (k < str.length && /\d/.test(str[k])) num += str[k++];
          const n = num ? +num : 1; i = k;
          const chain = /^(?:CH2|O|NH|S|CO|C6H4|CH=CH)+$/.test(inner);
          if (cur == null && startAt == null) { prefix.push([inner, n]); continue; }
          if (chain && n >= 1 && !/^O$|^NH$|^S$/.test(inner)) { for (let r = 0; r < n; r++) { const res = seq(inner, cur != null ? cur : startAt, pend || 1); pend = null; cur = res.cur; if (first == null) first = res.first; } continue; }
          for (let r = 0; r < n; r++) seq(inner, cur != null ? cur : startAt, 1);
          continue;
        }
        let m = rest.match(HALO);
        if (m && (cur != null || startAt != null)) { const n = m[2] ? +m[2] : 1; for (let r = 0; r < n; r++) { atoms.push({ el: m[1], hw: 0 }); link(cur != null ? cur : startAt, atoms.length - 1, 1); } i += m[0].length; if (first == null) first = atoms.length - 1; continue; }
        if (m && cur == null) { atoms.push({ el: m[1], hw: 0 }); cur = first = atoms.length - 1; i += m[0].length; continue; }
        let hit = null;
        if (cur == null && first == null) for (const [t, f] of LEAD) { if (rest.startsWith(t) && !(t === 'NC' && /^NC[a-z]/.test(rest))) { hit = [t, f, true]; break; } }
        if (!hit) for (const [t, f, cond] of GROUPS) { if (rest.startsWith(t) && !/^[a-z]/.test(rest.slice(t.length)) && (!cond || cond(rest.slice(t.length)))) { hit = [t, f, false]; break; } }
        if (!hit && /^H\d?/.test(rest) && cur == null) { const mm = rest.match(/^H(\d?)/); extraH += mm[1] ? +mm[1] : 1; i += mm[0].length; continue; }
        if (!hit) fail('Groupe non reconnu près de « ' + rest.slice(0, 6) + ' ».');
        place(hit[1](), hit[2]); i += hit[0].length;
      }
      if (prefix.length) fail('Parenthèse de départ sans atome de carbone à la suite.');
      return { first, cur };
    }
    seq(s, null, null);
    if (!atoms.length) fail('Formule vide.');
    // liaisons multiples déduites du nombre d'hydrogènes écrits (CH2CH2 → CH2=CH2)
    const VAL = { C: 4, N: 3, O: 2, S: 2 };
    const sum = (i) => bonds.reduce((s, b) => s + (b.a === i || b.b === i ? b.o : 0), 0);
    const deficit = (i) => (atoms[i].hw == null || !VAL[atoms[i].el]) ? 0 : VAL[atoms[i].el] - atoms[i].hw - sum(i);
    let added = 0;
    for (let pass = 0; pass < 2; pass++) bonds.forEach((b) => { const d = Math.min(deficit(b.a), deficit(b.b), 3 - b.o); if (d > 0) { b.o += d; added++; } });
    const bad = atoms.map((a, i) => i).filter((i) => deficit(i) !== 0 && atoms[i].hw != null && VAL[atoms[i].el]);
    return { atoms: atoms.map((a) => ({ el: a.el })), bonds, added, bad: bad.length };
  }

  // =====================================================================
  // Noms simples (nomenclature française)
  // =====================================================================
  const ROOTS = { meth: 1, eth: 2, prop: 3, but: 4, pent: 5, hex: 6, hept: 7, oct: 8, non: 9, dec: 10, undec: 11, dodec: 12 };
  const ROOT_RE = 'meth|eth|prop|but|pent|hex|hept|oct|non|undec|dodec|dec';
  const MULT = { di: 2, tri: 3, tetra: 4 };
  const SUBST = { methyl: ['C', 1], ethyl: ['C', 2], propyl: ['C', 3], butyl: ['C', 4], chloro: ['Cl'], bromo: ['Br'], fluoro: ['F'], iodo: ['I'], hydroxy: ['O'], amino: ['N'], phenyl: ['Ph'] };
  const locs = (s, n, def) => (s ? s.split(',').map(Number) : Array(n).fill(def));
  function fromName(raw) {
    let s = norm(raw).replace(/\s*-\s*/g, '-');
    let acid = false, ester = null;
    const em = s.match(new RegExp('^(.*?)(' + ROOT_RE + ')anoate d(?:e |\')(' + ROOT_RE + ')yle$'));
    if (em) ester = ROOTS[em[3]];
    if (/^acide /.test(s)) { acid = true; s = s.slice(6); if (!/oique$/.test(s)) return null; s = s.replace(/oique$/, 'oique'); }
    const body = ester ? em[1] + em[2] + 'an' + 'oate' : s;
    const re = new RegExp('^((?:(?:\\d+(?:,\\d+)*-)?(?:di|tri|tetra)?(?:methyl|ethyl|propyl|butyl|chloro|bromo|fluoro|iodo|hydroxy|amino|phenyl)-?)*)(cyclo)?(' + ROOT_RE + ')(a)?(an|-?(?:(\\d+(?:,\\d+)*)-)?(di|tri)?(en|yn))(e|al|oique|oate|e?-?(?:(\\d+(?:,\\d+)*)-)?(di|tri)?(ol|one|amine))$');
    const m = body.match(re); if (!m) return null;
    const n = ROOTS[m[3]], cyclo = !!m[2]; if (!n) return null;
    const atoms = [], bonds = [];
    for (let k = 0; k < n; k++) { atoms.push({ el: 'C' }); if (k) bonds.push({ a: k - 1, b: k, o: 1 }); }
    if (cyclo) { if (n < 3) return null; bonds.push({ a: n - 1, b: 0, o: 1 }); }
    const at = (p) => { if (p < 1 || p > n) fail('Position ' + p + ' impossible sur une chaîne de ' + n + ' carbones.'); return p - 1; };
    // insaturations
    if (m[5] !== 'an') {
      const kind = m[8] === 'en' ? 2 : 3, cnt = m[7] ? MULT[m[7]] : 1, ls = locs(m[6], cnt, 1);
      if (ls.length !== cnt) fail('Nombre de positions incohérent pour les liaisons multiples.');
      ls.forEach((p) => { const a = at(p); const b = cyclo && p === n ? 0 : at(p + 1); const bd = bonds.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a)); if (!bd) fail('Position de liaison multiple impossible.'); bd.o = kind; });
    }
    // fonction principale
    const suf = m[9];
    const addTo = (p, el, o) => { atoms.push({ el }); bonds.push({ a: at(p), b: atoms.length - 1, o: o || 1 }); return atoms.length - 1; };
    if (acid || suf === 'oique') { if (!acid) return null; addTo(1, 'O', 2); addTo(1, 'O'); }
    else if (suf === 'oate') { if (!ester) return null; addTo(1, 'O', 2); const o = addTo(1, 'O'); let prev = o; for (let k = 0; k < ester; k++) { atoms.push({ el: 'C' }); bonds.push({ a: prev, b: atoms.length - 1, o: 1 }); prev = atoms.length - 1; } }
    else if (suf === 'al') addTo(1, 'O', 2);
    else if (suf !== 'e') {
      const fn = m[12], cnt = m[11] ? MULT[m[11]] : 1, ls = locs(m[10], cnt, fn === 'one' ? 2 : 1);
      if (ls.length !== cnt) fail('Nombre de positions incohérent pour la fonction.');
      ls.forEach((p) => addTo(p, fn === 'ol' ? 'O' : fn === 'one' ? 'O' : 'N', fn === 'one' ? 2 : 1));
    }
    // substituants
    const subRe = /(?:(\d+(?:,\d+)*)-)?(di|tri|tetra)?(methyl|ethyl|propyl|butyl|chloro|bromo|fluoro|iodo|hydroxy|amino|phenyl)-?/g;
    let sm; while ((sm = subRe.exec(m[1] || ''))) {
      const [el, len] = SUBST[sm[3]], cnt = sm[2] ? MULT[sm[2]] : 1, ls = locs(sm[1], cnt, el === 'C' ? Math.min(2, n) : 1);
      if (ls.length !== cnt) fail('Nombre de positions incohérent pour « ' + sm[3] + ' ».');
      ls.forEach((p) => {
        if (el === 'C') { let prev = at(p); for (let k = 0; k < len; k++) { atoms.push({ el: 'C' }); bonds.push({ a: prev, b: atoms.length - 1, o: 1 }); prev = atoms.length - 1; } }
        else if (el === 'Ph') { const base = atoms.length; for (let k = 0; k < 6; k++) atoms.push({ el: 'C' }); [[0, 1, 2], [1, 2, 1], [2, 3, 2], [3, 4, 1], [4, 5, 2], [5, 0, 1]].forEach(([a, b, o]) => bonds.push({ a: base + a, b: base + b, o })); bonds.push({ a: at(p), b: base, o: 1 }); }
        else addTo(p, el);
      });
    }
    const g = { atoms, bonds }, adj = C.adjacency(g);
    if (atoms.some((a, i) => C.overValent(g, adj, i))) fail('Ce nom donne un atome de carbone qui dépasse quatre liaisons : vérifiez les positions.');
    return g;
  }

  // =====================================================================
  // Bibliothèque de composés standard
  // =====================================================================
  const CATS = [
    ['base', 'Petites molécules et minéraux'], ['alcanes', 'Alcanes et cycloalcanes'], ['alcenes', 'Alcènes et alcynes'], ['alcools', 'Alcools, phénols et éthers'],
    ['carbonyles', 'Aldéhydes et cétones'], ['acides', 'Acides et esters'], ['azotes', 'Composés azotés'], ['halo', 'Composés halogénés'], ['arom', 'Aromatiques et hétérocycles'], ['bio', 'Biomolécules et médicaments']
  ];
  // [id, nom, catégorie, SMILES ou lib:clé, synonymes, géométrie 3D de référence]
  const RAW = [
    ['eau', 'Eau', 'base', 'lib:eau', 'oxyde de dihydrogene|h2o', 'eau'], ['dihydrogene', 'Dihydrogène', 'base', '[H][H]', 'hydrogene|h2'], ['dioxygene', 'Dioxygène', 'base', 'O=O', 'oxygene|o2'],
    ['diazote', 'Diazote', 'base', 'N#N', 'azote|n2'], ['dichlore', 'Dichlore', 'base', 'ClCl', 'chlore|cl2'], ['ammoniac', 'Ammoniac', 'base', 'lib:ammoniac', 'nh3', 'ammoniac'],
    ['h2s', 'Sulfure d’hydrogène', 'base', 'lib:h2s', 'hydrogene sulfure', 'sulfure'], ['hcl', 'Chlorure d’hydrogène', 'base', 'lib:hcl', 'acide chlorhydrique'], ['hf', 'Fluorure d’hydrogène', 'base', 'F', 'acide fluorhydrique'],
    ['co2', 'Dioxyde de carbone', 'base', 'lib:co2', 'gaz carbonique', 'co2'], ['so2', 'Dioxyde de soufre', 'base', 'O=S=O', ''], ['so3', 'Trioxyde de soufre', 'base', 'O=S(=O)=O', ''],
    ['h2o2', 'Peroxyde d’hydrogène', 'base', 'OO', 'eau oxygenee'], ['hcn', 'Cyanure d’hydrogène', 'base', 'C#N', 'acide cyanhydrique'], ['h2so4', 'Acide sulfurique', 'base', 'lib:acide_sulfurique', ''],
    ['h3po4', 'Acide phosphorique', 'base', 'OP(=O)(O)O', ''], ['h2co3', 'Acide carbonique', 'base', 'OC(=O)O', ''], ['bf3', 'Trifluorure de bore', 'base', 'FB(F)F', '', 'bf3'],
    ['methane', 'Méthane', 'alcanes', 'lib:methane', 'ch4', 'methane'], ['ethane', 'Éthane', 'alcanes', 'lib:ethane', ''], ['propane', 'Propane', 'alcanes', 'lib:propane', ''],
    ['butane', 'Butane', 'alcanes', 'lib:butane', 'n-butane'], ['isobutane', '2-Méthylpropane', 'alcanes', 'CC(C)C', 'isobutane|methylpropane'], ['pentane', 'Pentane', 'alcanes', 'CCCCC', ''],
    ['isopentane', '2-Méthylbutane', 'alcanes', 'CCC(C)C', 'isopentane'], ['neopentane', '2,2-Diméthylpropane', 'alcanes', 'CC(C)(C)C', 'neopentane'], ['hexane', 'Hexane', 'alcanes', 'CCCCCC', ''],
    ['heptane', 'Heptane', 'alcanes', 'CCCCCCC', ''], ['octane', 'Octane', 'alcanes', 'CCCCCCCC', ''], ['isooctane', '2,2,4-Triméthylpentane', 'alcanes', 'CC(C)CC(C)(C)C', 'isooctane'],
    ['cyclopropane', 'Cyclopropane', 'alcanes', 'C1CC1', ''], ['cyclobutane', 'Cyclobutane', 'alcanes', 'C1CCC1', ''], ['cyclopentane', 'Cyclopentane', 'alcanes', 'C1CCCC1', ''], ['cyclohexane', 'Cyclohexane', 'alcanes', 'lib:cyclohexane', ''],
    ['ethylene', 'Éthène', 'alcenes', 'lib:ethylene', 'ethylene', 'ethylene'], ['propene', 'Propène', 'alcenes', 'C=CC', 'propylene'], ['but1ene', 'But-1-ène', 'alcenes', 'C=CCC', ''],
    ['but2ene', 'But-2-ène', 'alcenes', 'CC=CC', ''], ['isobutene', '2-Méthylpropène', 'alcenes', 'C=C(C)C', 'isobutene|isobutylene'], ['butadiene', 'Buta-1,3-diène', 'alcenes', 'C=CC=C', 'butadiene'],
    ['isoprene', 'Isoprène', 'alcenes', 'C=CC(=C)C', '2-methylbuta-1,3-diene'], ['cyclohexene', 'Cyclohexène', 'alcenes', 'C1=CCCCC1', ''], ['acetylene', 'Éthyne', 'alcenes', 'lib:acetylene', 'acetylene', 'acetylene'],
    ['propyne', 'Propyne', 'alcenes', 'C#CC', ''], ['but2yne', 'But-2-yne', 'alcenes', 'CC#CC', ''],
    ['methanol', 'Méthanol', 'alcools', 'lib:methanol', 'alcool methylique'], ['ethanol', 'Éthanol', 'alcools', 'lib:ethanol', 'alcool ethylique|alcool', 'ethanol'], ['propan1ol', 'Propan-1-ol', 'alcools', 'CCCO', 'propanol'],
    ['propan2ol', 'Propan-2-ol', 'alcools', 'CC(O)C', 'isopropanol|alcool isopropylique'], ['butan1ol', 'Butan-1-ol', 'alcools', 'CCCCO', 'butanol'], ['butan2ol', 'Butan-2-ol', 'alcools', 'CCC(C)O', ''],
    ['tbutanol', '2-Méthylpropan-2-ol', 'alcools', 'CC(C)(C)O', 'tert-butanol'], ['glycol', 'Éthane-1,2-diol', 'alcools', 'OCCO', 'ethylene glycol|glycol'], ['glycerol', 'Glycérol', 'alcools', 'OCC(O)CO', 'propane-1,2,3-triol|glycerine'],
    ['cyclohexanol', 'Cyclohexanol', 'alcools', 'OC1CCCCC1', ''], ['phenol', 'Phénol', 'alcools', 'lib:phenol', ''], ['dme', 'Méthoxyméthane', 'alcools', 'lib:methoxymethane', 'ether dimethylique|oxyde de dimethyle'],
    ['ether', 'Éthoxyéthane', 'alcools', 'CCOCC', 'ether diethylique|ether|oxyde de diethyle'], ['oxirane', 'Oxirane', 'alcools', 'C1CO1', 'oxyde d\'ethylene'],
    ['methanal', 'Méthanal', 'carbonyles', 'lib:methanal', 'formaldehyde|formol', 'methanal'], ['ethanal', 'Éthanal', 'carbonyles', 'lib:ethanal', 'acetaldehyde'], ['propanal', 'Propanal', 'carbonyles', 'CCC=O', ''],
    ['butanal', 'Butanal', 'carbonyles', 'CCCC=O', ''], ['benzaldehyde', 'Benzaldéhyde', 'carbonyles', 'O=Cc1ccccc1', ''], ['acetone', 'Propanone', 'carbonyles', 'lib:acetone', 'acetone'],
    ['butanone', 'Butanone', 'carbonyles', 'CCC(C)=O', 'methylethylcetone'], ['pentan3one', 'Pentan-3-one', 'carbonyles', 'CCC(=O)CC', ''], ['cyclohexanone', 'Cyclohexanone', 'carbonyles', 'O=C1CCCCC1', ''],
    ['acetophenone', 'Acétophénone', 'carbonyles', 'CC(=O)c1ccccc1', ''],
    ['formique', 'Acide méthanoïque', 'acides', 'OC=O', 'acide formique'], ['acetique', 'Acide éthanoïque', 'acides', 'lib:acide_acetique', 'acide acetique|vinaigre', 'acide_acetique'], ['propanoique', 'Acide propanoïque', 'acides', 'CCC(=O)O', 'acide propionique'],
    ['butanoique', 'Acide butanoïque', 'acides', 'CCCC(=O)O', 'acide butyrique'], ['benzoique', 'Acide benzoïque', 'acides', 'lib:acide_benzoique', ''], ['oxalique', 'Acide oxalique', 'acides', 'OC(=O)C(=O)O', 'acide ethanedioique'],
    ['lactique', 'Acide lactique', 'acides', 'CC(O)C(=O)O', 'acide 2-hydroxypropanoique'], ['citrique', 'Acide citrique', 'acides', 'OC(=O)CC(O)(CC(=O)O)C(=O)O', ''], ['formiate_me', 'Méthanoate de méthyle', 'acides', 'COC=O', 'formiate de methyle'],
    ['acetate_me', 'Éthanoate de méthyle', 'acides', 'COC(C)=O', 'acetate de methyle'], ['acetate_et', 'Éthanoate d’éthyle', 'acides', 'CCOC(C)=O', 'acetate d\'ethyle'], ['banane', 'Éthanoate de 3-méthylbutyle', 'acides', 'CC(C)CCOC(C)=O', 'acetate d\'isoamyle|arome de banane'],
    ['anhydride', 'Anhydride éthanoïque', 'acides', 'CC(=O)OC(C)=O', 'anhydride acetique'], ['chlorure_acyle', 'Chlorure d’éthanoyle', 'acides', 'CC(Cl)=O', 'chlorure d\'acetyle'],
    ['methylamine', 'Méthylamine', 'azotes', 'CN', 'methanamine'], ['ethylamine', 'Éthylamine', 'azotes', 'CCN', 'ethanamine'], ['dimethylamine', 'Diméthylamine', 'azotes', 'CNC', 'n-methylmethanamine'],
    ['trimethylamine', 'Triméthylamine', 'azotes', 'CN(C)C', ''], ['aniline', 'Aniline', 'azotes', 'Nc1ccccc1', 'phenylamine'], ['uree', 'Urée', 'azotes', 'NC(N)=O', 'carbamide'],
    ['acetamide', 'Éthanamide', 'azotes', 'CC(N)=O', 'acetamide'], ['acetonitrile', 'Éthanenitrile', 'azotes', 'CC#N', 'acetonitrile'], ['hydrazine', 'Hydrazine', 'azotes', 'NN', ''],
    ['glycine', 'Glycine', 'azotes', 'lib:glycine', 'acide aminoethanoique'], ['alanine', 'Alanine', 'azotes', 'CC(N)C(=O)O', 'acide 2-aminopropanoique'],
    ['chloromethane', 'Chlorométhane', 'halo', 'CCl', 'chlorure de methyle'], ['dcm', 'Dichlorométhane', 'halo', 'ClCCl', 'chlorure de methylene'], ['chloroforme', 'Trichlorométhane', 'halo', 'ClC(Cl)Cl', 'chloroforme'],
    ['ccl4', 'Tétrachlorométhane', 'halo', 'ClC(Cl)(Cl)Cl', 'tetrachlorure de carbone'], ['chloroethane', 'Chloroéthane', 'halo', 'CCCl', 'chlorure d\'ethyle'], ['dce', '1,2-Dichloroéthane', 'halo', 'ClCCCl', ''],
    ['bromoethane', 'Bromoéthane', 'halo', 'CCBr', ''], ['iodomethane', 'Iodométhane', 'halo', 'CI', ''], ['vinyle', 'Chloroéthène', 'halo', 'C=CCl', 'chlorure de vinyle'],
    ['freon12', 'Dichlorodifluorométhane', 'halo', 'FC(F)(Cl)Cl', 'freon 12|cfc-12'], ['chlorobenzene', 'Chlorobenzène', 'halo', 'Clc1ccccc1', ''],
    ['benzene', 'Benzène', 'arom', 'lib:benzene', '', 'benzene'], ['toluene', 'Toluène', 'arom', 'lib:toluene', 'methylbenzene'], ['pxylene', '1,4-Diméthylbenzène', 'arom', 'Cc1ccc(C)cc1', 'para-xylene|p-xylene|xylene'],
    ['ethylbenzene', 'Éthylbenzène', 'arom', 'CCc1ccccc1', ''], ['styrene', 'Styrène', 'arom', 'C=Cc1ccccc1', 'vinylbenzene|phenylethene'], ['naphtalene', 'Naphtalène', 'arom', 'c1ccc2ccccc2c1', 'naphthalene'],
    ['anthracene', 'Anthracène', 'arom', 'c1ccc2cc3ccccc3cc2c1', ''], ['biphenyle', 'Biphényle', 'arom', 'c1ccc(cc1)-c1ccccc1', ''], ['pyridine', 'Pyridine', 'arom', 'c1ccncc1', ''],
    ['pyrrole', 'Pyrrole', 'arom', 'c1cc[nH]c1', ''], ['furane', 'Furane', 'arom', 'c1ccoc1', 'furan'], ['thiophene', 'Thiophène', 'arom', 'c1ccsc1', ''], ['imidazole', 'Imidazole', 'arom', 'c1cnc[nH]1', ''],
    ['glucose', 'Glucose (forme cyclique)', 'bio', 'OCC1OC(O)C(O)C(O)C1O', 'glucopyranose|glucose'], ['glucose_o', 'Glucose (forme ouverte)', 'bio', 'OCC(O)C(O)C(O)C(O)C=O', ''], ['fructose', 'Fructose (forme ouverte)', 'bio', 'OCC(O)C(O)C(O)C(=O)CO', ''],
    ['aspirine', 'Aspirine', 'bio', 'lib:aspirine', 'acide acetylsalicylique'], ['paracetamol', 'Paracétamol', 'bio', 'lib:paracetamol', 'acetaminophene'], ['ibuprofene', 'Ibuprofène', 'bio', 'CC(C)Cc1ccc(cc1)C(C)C(=O)O', 'ibuprofen'],
    ['salicylique', 'Acide salicylique', 'bio', 'OC(=O)c1ccccc1O', 'acide 2-hydroxybenzoique'], ['cafeine', 'Caféine', 'bio', 'Cn1cnc2c1c(=O)n(C)c(=O)n2C', 'cafeine|caffeine|theine'], ['vanilline', 'Vanilline', 'bio', 'COc1cc(C=O)ccc1O', ''],
    ['menthol', 'Menthol', 'bio', 'CC(C)C1CCC(C)CC1O', ''], ['nicotine', 'Nicotine', 'bio', 'CN1CCCC1c1cccnc1', ''], ['adrenaline', 'Adrénaline', 'bio', 'CNCC(O)c1ccc(O)c(O)c1', 'epinephrine'],
    ['vitc', 'Acide ascorbique (vitamine C)', 'bio', 'OCC(O)C1OC(=O)C(O)=C1O', 'vitamine c|acide ascorbique']
  ];
  const LIB = RAW.map(([id, n, cat, src, syn, ref]) => ({ id, n, cat, src, syn: (syn || '').split('|').filter(Boolean), ref: ref || null }));
  const byId = Object.fromEntries(LIB.map((e) => [e.id, e]));
  const cache = {};
  function build(e) {
    if (cache[e.id]) return C.clone(cache[e.id]);
    let m;
    if (e.src.startsWith('lib:')) m = C.lib2D(e.src.slice(4));
    else m = layout2D(parseSMILES(e.src));
    m.name = e.n; cache[e.id] = m; return C.clone(m);
  }
  let formulas = null;
  const formulaOf = (m) => C.formulaText(C.counts(m));
  function libFormulas() { if (!formulas) { formulas = {}; LIB.forEach((e) => { try { const f = formulaOf(build(e)); (formulas[f] = formulas[f] || []).push(e); } catch (err) { console.warn(e.id, err); } }); } return formulas; }
  const NAMES = new Map(); LIB.forEach((e) => [e.n, ...e.syn].forEach((x) => NAMES.set(norm(x).replace(/\s*-\s*/g, '-'), e)));

  // =====================================================================
  // Point d'entrée : texte libre → molécule
  // =====================================================================
  function fromText(input) {
    const raw = String(input || '').trim(); if (!raw) return { ok: false, msg: 'Écrivez un nom, une formule ou un SMILES.' };
    const key = norm(raw).replace(/\s*-\s*/g, '-');
    // 1. nom d'un composé de la bibliothèque
    const e = NAMES.get(key) || NAMES.get(key.replace(/^l'|^le |^la /, ''));
    if (e) return { ok: true, mol: build(e), entry: e, how: 'Composé de la bibliothèque : ' + e.n + '.' };
    // 2. nom systématique simple
    if (/^[a-z ,'0-9-]+$/.test(key) && /[a-z]{3}/.test(key)) {
      try { const g = fromName(raw); if (g) { const m = layout2D(g); m.name = raw.trim(); const r = identify(m) || C.recognize(m); if (r) m.name = r.name; return { ok: true, mol: m, how: 'Construit d’après le nom (nomenclature).' + (r ? ' Molécule reconnue : ' + r.name + '.' : '') }; } }
      catch (err) { if (err.user) return { ok: false, msg: err.message }; throw err; }
    }
    const t = raw.replace(/[₀-₉]/g, (d) => SUBD[d]).replace(/\s+/g, '');
    const hasH = /H/.test(t.replace(/\[[^\]]*\]/g, ''));
    // 3. formule brute (chaque élément écrit une seule fois) : C2H6O → isomères connus de la bibliothèque
    const toks = t.match(/[A-Z][a-z]?\d*/g) || [], els = toks.map((x) => x.match(/[A-Z][a-z]?/)[0]);
    if (/^([A-Z][a-z]?\d*)+$/.test(t) && new Set(els).size === els.length && (hasH || /\d/.test(t))) {
      const f = C.formulaText(C.parseFormula(t)), list = libFormulas()[f] || [];
      if (list.length === 1) return { ok: true, mol: build(list[0]), entry: list[0], how: 'Formule brute ' + f + ' : ' + list[0].n + '.' };
      if (list.length > 1) return { ok: false, choices: list, msg: 'La formule brute ' + f + ' correspond à plusieurs composés (isomères). Choisissez :' };
      const help = 'Aucun composé de la bibliothèque n’a la formule brute ' + f + '. Écrivez plutôt la formule semi-développée (ex. CH3-CH2-OH), le nom (ex. propan-2-ol) ou le SMILES (ex. CC(O)C).';
      if (!hasH) return { ok: false, msg: help };
      try { const g = parseCondensed(t); const m = layout2D(g); if (g.bad) return { ok: false, msg: help }; return { ok: true, mol: m, how: 'Formule interprétée comme semi-développée.' }; }
      catch (err) { return { ok: false, msg: help }; }
    }
    // 4. SMILES (pas de H hors crochets)
    if (/[^\x00-\x7f]|[ ]|[ac-kmqt-z]|[A-Z]{2}[a-z]{2}/.test(raw.replace(/\[[^\]]*\]/g, '').replace(/Cl|Br/g, '')) && !/[=#()\[\]0-9]/.test(raw)) {
      return { ok: false, msg: 'Nom non reconnu : « ' + raw + ' ». Écrivez un nom en nomenclature (ex. butan-2-ol, acide propanoïque, 2-méthylpropane), une formule (CH3-CH2-OH, C2H6O) ou un SMILES (CCO), ou choisissez dans « Composés standard ».' };
    }
    if (!hasH) {
      try { const g = parseSMILES(t); const m = layout2D(g); const r = identify(m) || C.recognize(m); if (r) m.name = r.name; return { ok: true, mol: m, how: 'Construit d’après le SMILES.' + (r ? ' Molécule reconnue : ' + r.name + '.' : '') }; }
      catch (err) { if (err.user) return { ok: false, msg: err.message + ' Exemples de SMILES : CCO (éthanol), CC(=O)O (acide acétique), c1ccccc1 (benzène).' }; throw err; }
    }
    // 5. formule semi-développée
    try {
      const g = parseCondensed(t); const m = layout2D(g); const r = identify(m) || C.recognize(m); if (r) m.name = r.name;
      const notes = [];
      if (g.added) notes.push('liaison multiple ajoutée d’après le nombre d’hydrogènes');
      if (g.bad) notes.push('attention : le nombre d’hydrogènes écrit ne correspond pas à la valence d’un atome, vérifiez la formule');
      return { ok: true, mol: m, warn: !!g.bad, how: 'Construit d’après la formule semi-développée' + (notes.length ? ' (' + notes.join(' ; ') + ')' : '') + '.' + (r ? ' Molécule reconnue : ' + r.name + '.' : '') };
    } catch (err) { if (err.user) return { ok: false, msg: err.message + ' Exemples : CH3-CH2-OH, CH3-CO-CH3, CH2=CH-CH3, (CH3)3C-OH, C6H5-COOH.' }; throw err; }
  }
  // reconnaissance d'une molécule dessinée parmi tous les composés de la bibliothèque
  let sigs = null;
  function identify(m) {
    if (!m || !m.atoms || !m.atoms.length) return null;
    if (!sigs) { sigs = new Map(); LIB.forEach((e) => { try { const k = C.signature(build(e)); if (!sigs.has(k)) sigs.set(k, e); } catch (err) {} }); }
    const e = sigs.get(C.signature(m)); return e ? { id: e.id, name: e.n, entry: e } : null;
  }
  function search(q) {
    const raw = String(q || '').replace(/[₀-₉]/g, (d) => SUBD[d]).replace(/\s+/g, ''), k = norm(q); if (!k) return LIB.slice();
    if (/^([A-Z][a-z]?\d*)+$/.test(raw) && /\d/.test(raw)) { const f = C.formulaText(C.parseFormula(raw)); return libFormulas()[f] || []; }
    return LIB.filter((e) => norm(e.n).includes(k) || e.syn.some((s) => norm(s).includes(k)));
  }
  G.Compose = { fromText, identify, parseSMILES, parseCondensed, fromName, layout2D, LIB, CATS, byId, build, search, formulaOf, libFormulas };
})(typeof window !== 'undefined' ? window : globalThis);
