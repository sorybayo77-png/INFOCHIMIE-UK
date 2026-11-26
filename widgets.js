/* widgets.js — Éditeur 2D (esprit ChemSketch) et visionneuse/constructeur 3D (esprit Avogadro) */
(function (G) {
  'use strict';
  const C = G.Chem, NS = 'http://www.w3.org/2000/svg';
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const RM = () => G.matchMedia && G.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cssVar = (el, n, d) => (getComputedStyle(el).getPropertyValue(n) || '').trim() || d;

  // =====================================================================
  // ÉDITEUR 2D
  // =====================================================================
  class Editor2D {
    constructor(host, opt = {}) {
      this.host = host; this.opt = opt; this.L = 48;
      this.atoms = []; this.bonds = []; this.name = '';
      this.tool = 'dessiner'; this.el = 'C'; this.order = 1; this.ring = 6; this.ringArom = true; this.display = 'semi';
      this.zoom = 1; this.cx = 0; this.cy = 0; this.hist = []; this.fut = []; this.hover = null; this.press = null; this.ghost = null;
      this.onChange = opt.onChange || (() => {}); this.onSettings = opt.onSettings || (() => {});
      const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'ed-svg'); svg.setAttribute('tabindex', '0');
      svg.setAttribute('role', 'application'); svg.setAttribute('aria-label', 'Zone de dessin 2D. Touches : C, H, N, O, S, P, F, L pour Cl, 1 2 3 pour l’ordre de liaison, Ctrl+Z pour annuler.');
      host.appendChild(svg); this.svg = svg;
      svg.addEventListener('pointerdown', (e) => this.down(e));
      svg.addEventListener('pointermove', (e) => this.move(e));
      svg.addEventListener('pointerup', (e) => this.up(e));
      svg.addEventListener('pointercancel', () => { this.press = null; this.ghost = null; this.render(); });
      svg.addEventListener('pointerleave', () => { if (!this.press) { this.hover = null; this.render(); } });
      svg.addEventListener('keydown', (e) => this.key(e));
      svg.addEventListener('wheel', (e) => { e.preventDefault(); this.setZoom(this.zoom * Math.exp(-e.deltaY * 0.0012)); }, { passive: false });
      this.ro = new ResizeObserver(() => this.render()); this.ro.observe(host);
      this.render();
    }
    destroy() { this.ro.disconnect(); }
    // --- état ---
    snapshot() { return JSON.stringify({ a: this.atoms, b: this.bonds }); }
    save() { this.hist.push(this.snapshot()); if (this.hist.length > 80) this.hist.shift(); this.fut = []; }
    restore(s) { const o = JSON.parse(s); this.atoms = o.a; this.bonds = o.b; }
    undo() { if (!this.hist.length) return; this.fut.push(this.snapshot()); this.restore(this.hist.pop()); this.changed(); }
    redo() { if (!this.fut.length) return; this.hist.push(this.snapshot()); this.restore(this.fut.pop()); this.changed(); }
    changed() { this.render(); this.onChange(this.getMol()); }
    clear() { if (!this.atoms.length) return; this.save(); this.atoms = []; this.bonds = []; this.changed(); }
    getMol() { return { name: this.name || 'molécule', atoms: this.atoms.map((a) => ({ ...a })), bonds: this.bonds.map((b) => ({ ...b })) }; }
    load(m, keepHist) { if (!keepHist) this.save(); this.name = m.name || ''; this.atoms = m.atoms.map((a) => ({ el: a.el, x: a.x, y: a.y, ...C.extra(a) })); this.bonds = m.bonds.map((b) => ({ a: b.a, b: b.b, o: b.o === 1.5 ? 1 : b.o })); this.fit(); this.changed(); }
    // --- géométrie ---
    size() { const r = this.svg.getBoundingClientRect(); return { w: r.width || 600, h: r.height || 400, r }; }
    world(e) { const { w, h, r } = this.size(); return { x: this.cx + (e.clientX - r.left - w / 2) / this.zoom, y: this.cy + (e.clientY - r.top - h / 2) / this.zoom }; }
    nb(i) { const o = []; this.bonds.forEach((b, k) => { if (b.a === i) o.push({ j: b.b, o: b.o, k }); else if (b.b === i) o.push({ j: b.a, o: b.o, k }); }); return o; }
    hitAtom(p) { const t = 14 / this.zoom; let best = -1, bd = t; this.atoms.forEach((a, i) => { const d = Math.hypot(a.x - p.x, a.y - p.y); if (d < bd) { bd = d; best = i; } }); return best; }
    hitBond(p) {
      const t = 8 / this.zoom; let best = -1, bd = t;
      this.bonds.forEach((b, k) => {
        const A = this.atoms[b.a], B = this.atoms[b.b], dx = B.x - A.x, dy = B.y - A.y, l2 = dx * dx + dy * dy || 1;
        const u = Math.max(0, Math.min(1, ((p.x - A.x) * dx + (p.y - A.y) * dy) / l2)); const d = Math.hypot(A.x + u * dx - p.x, A.y + u * dy - p.y);
        if (d < bd && u > 0.12 && u < 0.88) { bd = d; best = k; }
      });
      return best;
    }
    bondIndex(i, j) { return this.bonds.findIndex((b) => (b.a === i && b.b === j) || (b.a === j && b.b === i)); }
    addAtom(x, y, el) { this.atoms.push({ el: el || this.el, x, y }); return this.atoms.length - 1; }
    addBond(i, j, o) { if (i === j) return; const k = this.bondIndex(i, j); if (k >= 0) { this.bonds[k].o = o; return; } this.bonds.push({ a: i, b: j, o }); }
    delAtom(i) { this.bonds = this.bonds.filter((b) => b.a !== i && b.b !== i).map((b) => ({ ...b, a: b.a > i ? b.a - 1 : b.a, b: b.b > i ? b.b - 1 : b.b })); this.atoms.splice(i, 1); }
    atomNear(x, y, i0) { const t = this.L * 0.3; return this.atoms.findIndex((a, i) => i !== i0 && Math.hypot(a.x - x, a.y - y) < t); }
    growPos(i, order) {
      const a = this.atoms[i], n = this.nb(i), L = this.L, deg = (t) => t * Math.PI / 180;
      let ang;
      if (!n.length) ang = -30;
      else if (n.length === 1) {
        const b = this.atoms[n[0].j], base = Math.atan2(a.y - b.y, a.x - b.x) * 180 / Math.PI;
        if (n[0].o === 3 || (n[0].o === 2 && order === 2) || order === 3) ang = base;
        else {
          const cand = [base + 60, base - 60];
          const others = this.nb(n[0].j).filter((x) => x.j !== i).map((x) => this.atoms[x.j]);
          const score = (t) => { const px = a.x + L * Math.cos(deg(t)), py = a.y + L * Math.sin(deg(t)); let s = 0; this.atoms.forEach((q) => { s += Math.min(3 * L, Math.hypot(q.x - px, q.y - py)); }); others.forEach((q) => { s += 2 * Math.hypot(q.x - px, q.y - py); }); return s; };
          ang = score(cand[0]) >= score(cand[1]) ? cand[0] : cand[1];
        }
      } else {
        const as = n.map((x) => Math.atan2(this.atoms[x.j].y - a.y, this.atoms[x.j].x - a.x) * 180 / Math.PI).sort((p, q) => p - q);
        let gap = -1; as.forEach((t, k) => { const nx = k === as.length - 1 ? as[0] + 360 : as[k + 1]; if (nx - t > gap) { gap = nx - t; ang = t + (nx - t) / 2; } });
      }
      return { x: a.x + L * Math.cos(deg(ang)), y: a.y + L * Math.sin(deg(ang)) };
    }
    placeRing(p, onAtom) {
      const n = this.ring, L = this.L, R = L / (2 * Math.sin(Math.PI / n)); let ids = [], start, c;
      if (onAtom >= 0) {
        const a = this.atoms[onAtom], nb = this.nb(onAtom); let dx = 0, dy = -1;
        if (nb.length) { dx = 0; dy = 0; nb.forEach((x) => { const q = this.atoms[x.j]; const l = Math.hypot(a.x - q.x, a.y - q.y) || 1; dx += (a.x - q.x) / l; dy += (a.y - q.y) / l; }); const l = Math.hypot(dx, dy); if (l < 1e-3) { dx = 0; dy = -1; } else { dx /= l; dy /= l; } }
        c = { x: a.x + dx * R, y: a.y + dy * R }; start = Math.atan2(a.y - c.y, a.x - c.x);
      } else { c = p; start = -Math.PI / 2; }
      for (let k = 0; k < n; k++) {
        if (k === 0 && onAtom >= 0) { ids.push(onAtom); continue; }
        const t = start + k * 2 * Math.PI / n, x = c.x + R * Math.cos(t), y = c.y + R * Math.sin(t);
        const ex = this.atomNear(x, y); ids.push(ex >= 0 ? ex : this.addAtom(x, y, 'C'));
      }
      const hasDouble = onAtom >= 0 && this.nb(onAtom).some((x) => x.o >= 2);
      for (let k = 0; k < n; k++) {
        const i = ids[k], j = ids[(k + 1) % n]; if (this.bondIndex(i, j) >= 0) continue;
        const o = this.ringArom && n === 6 ? ((k % 2 === 0) !== hasDouble ? 2 : 1) : 1;
        this.bonds.push({ a: i, b: j, o });
      }
    }
    // --- interactions ---
    down(e) {
      if (e.button === 2) return; this.svg.focus({ preventScroll: true });
      const p = this.world(e), atom = this.hitAtom(p), bond = atom < 0 ? this.hitBond(p) : -1;
      this.press = { p, atom, bond, sx: e.clientX, sy: e.clientY, moved: false, cx: this.cx, cy: this.cy };
      if (this.tool === 'deplacer' && atom >= 0) this.save();
      this.svg.setPointerCapture(e.pointerId);
    }
    move(e) {
      const p = this.world(e);
      if (!this.press) { const a = this.hitAtom(p), b = a < 0 ? this.hitBond(p) : -1; const h = a >= 0 ? { atom: a } : b >= 0 ? { bond: b } : null; if (JSON.stringify(h) !== JSON.stringify(this.hover)) { this.hover = h; this.render(); } return; }
      const pr = this.press; if (Math.hypot(e.clientX - pr.sx, e.clientY - pr.sy) > 5) pr.moved = true;
      if (!pr.moved) return;
      if (this.tool === 'deplacer') {
        if (pr.atom >= 0) { this.atoms[pr.atom].x = p.x; this.atoms[pr.atom].y = p.y; }
        else { this.cx = pr.cx - (e.clientX - pr.sx) / this.zoom; this.cy = pr.cy - (e.clientY - pr.sy) / this.zoom; }
        this.render(); return;
      }
      if (this.tool === 'dessiner') {
        const s = pr.atom >= 0 ? this.atoms[pr.atom] : pr.p; const t = this.hitAtom(p);
        let end;
        if (t >= 0 && t !== pr.atom) end = { x: this.atoms[t].x, y: this.atoms[t].y, snap: t };
        else { let ang = Math.atan2(p.y - s.y, p.x - s.x); ang = Math.round(ang / (Math.PI / 6)) * (Math.PI / 6); end = { x: s.x + this.L * Math.cos(ang), y: s.y + this.L * Math.sin(ang), snap: -1 }; }
        this.ghost = { s: { x: s.x, y: s.y }, e: end }; this.render();
      }
    }
    up(e) {
      const pr = this.press; this.press = null; if (!pr) return;
      const g = this.ghost; this.ghost = null;
      if (this.tool === 'deplacer') { if (pr.moved && pr.atom >= 0) this.changed(); else this.render(); return; }
      if (this.tool === 'gomme') {
        if (pr.atom >= 0) { this.save(); this.delAtom(pr.atom); this.hover = null; this.changed(); }
        else if (pr.bond >= 0) { this.save(); this.bonds.splice(pr.bond, 1); this.hover = null; this.changed(); }
        return;
      }
      if (this.tool === 'cycle') { this.save(); this.placeRing(pr.p, pr.atom); this.changed(); return; }
      if (this.tool === 'charge') { if (pr.atom >= 0) { this.save(); this.bumpCharge(pr.atom, this.chgSign || 1); this.changed(); } return; }
      // outil dessiner
      if (pr.moved && g) {
        this.save();
        const i = pr.atom >= 0 ? pr.atom : this.addAtom(g.s.x, g.s.y);
        let j = g.e.snap; if (j < 0) { const ex = this.atomNear(g.e.x, g.e.y, i); j = ex >= 0 ? ex : this.addAtom(g.e.x, g.e.y); }
        const k = this.bondIndex(i, j); if (k >= 0) this.bonds[k].o = this.bonds[k].o % 3 + 1; else this.addBond(i, j, this.order);
        this.changed(); return;
      }
      if (pr.atom >= 0) {
        this.save(); const a = this.atoms[pr.atom];
        if (a.el !== this.el) { a.el = this.el; delete a.chg; delete a.hx; }
        else { const q = this.growPos(pr.atom, this.order); const ex = this.atomNear(q.x, q.y, pr.atom); const j = ex >= 0 ? ex : this.addAtom(q.x, q.y); this.addBond(pr.atom, j, this.order); }
        this.changed(); return;
      }
      if (pr.bond >= 0) { this.save(); const b = this.bonds[pr.bond]; b.o = b.o % 3 + 1; this.changed(); return; }
      this.save(); this.addAtom(pr.p.x, pr.p.y); this.changed();
    }
    key(e) {
      const k = e.key;
      if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? this.redo() : this.undo(); return; }
      if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === 'y') { e.preventDefault(); this.redo(); return; }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const map = { c: 'C', h: 'H', n: 'N', o: 'O', s: 'S', p: 'P', f: 'F', l: 'Cl', b: 'Br', i: 'I' };
      if (map[k.toLowerCase()]) { this.el = map[k.toLowerCase()]; this.tool = 'dessiner'; this.onSettings(); e.preventDefault(); return; }
      if (['1', '2', '3'].includes(k)) { this.order = +k; this.tool = 'dessiner'; this.onSettings(); e.preventDefault(); return; }
      if ((k === '+' || k === '-') && this.hover && this.hover.atom != null) { e.preventDefault(); this.save(); this.bumpCharge(this.hover.atom, k === '+' ? 1 : -1); this.changed(); return; }
      if ((k === 'Delete' || k === 'Backspace') && this.hover) {
        e.preventDefault(); this.save();
        if (this.hover.atom != null) this.delAtom(this.hover.atom); else if (this.hover.bond != null) this.bonds.splice(this.hover.bond, 1);
        this.hover = null; this.changed();
      }
    }
    setZoom(z) { this.zoom = Math.max(0.12, Math.min(3, z)); this.render(); }
    bumpCharge(i, d) { const a = this.atoms[i]; if (!a) return; const q = Math.max(-4, Math.min(4, (a.chg | 0) + d)); if (q) a.chg = q; else delete a.chg; }
    fit() {
      if (!this.atoms.length) { this.cx = 0; this.cy = 0; this.zoom = 1; this.render(); return; }
      const xs = this.atoms.map((a) => a.x), ys = this.atoms.map((a) => a.y);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const { w, h } = this.size(); this.cx = (x0 + x1) / 2; this.cy = (y0 + y1) / 2;
      this.zoom = Math.max(0.12, Math.min(1.5, Math.min(w / (x1 - x0 + 3 * this.L), h / (y1 - y0 + 3 * this.L))));
      this.render();
    }
    // --- rendu ---
    render() {
      const svg = this.svg, { w, h } = this.size(), z = this.zoom;
      svg.setAttribute('viewBox', `${this.cx - w / 2 / z} ${this.cy - h / 2 / z} ${w / z} ${h / z}`);
      const m = { atoms: this.atoms, bonds: this.bonds }, adj = C.adjacency(m), out = [], fs = 15;
      const labeled = (i) => { const a = this.atoms[i]; if (a.el !== 'C' || a.chg) return true; if (this.display !== 'topo') return true; return adj[i].length === 0; };
      // liaisons
      this.bonds.forEach((b, k) => {
        const A = this.atoms[b.a], B = this.atoms[b.b]; if (!A || !B) return;
        const dx = B.x - A.x, dy = B.y - A.y, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
        const hov = this.hover && this.hover.bond === k;
        const line = (x1, y1, x2, y2, cl) => out.push(`<line class="${cl || 'bd'}${hov ? ' hov' : ''}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`);
        if (hov) out.push(`<line class="bd-halo" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}"/>`);
        if (b.o === 1) line(A.x, A.y, B.x, B.y);
        else if (b.o === 2) {
          const ring = C.ringPath(adj, b.a, b.b, 7);
          if (ring && !labeled(b.a) && !labeled(b.b)) {
            const cx = ring.reduce((s, i) => s + this.atoms[i].x, 0) / ring.length, cy = ring.reduce((s, i) => s + this.atoms[i].y, 0) / ring.length;
            const sgn = ((cx - (A.x + B.x) / 2) * nx + (cy - (A.y + B.y) / 2) * ny) > 0 ? 1 : -1, o = 6.5 * sgn;
            line(A.x, A.y, B.x, B.y); line(A.x + dx * 0.14 + nx * o, A.y + dy * 0.14 + ny * o, B.x - dx * 0.14 + nx * o, B.y - dy * 0.14 + ny * o);
          } else { line(A.x + nx * 3.2, A.y + ny * 3.2, B.x + nx * 3.2, B.y + ny * 3.2); line(A.x - nx * 3.2, A.y - ny * 3.2, B.x - nx * 3.2, B.y - ny * 3.2); }
        } else { line(A.x, A.y, B.x, B.y); [5, -5].forEach((o) => line(A.x + nx * o, A.y + ny * o, B.x + nx * o, B.y + ny * o)); }
      });
      // hydrogènes explicites (formule développée)
      const hlab = [];
      if (this.display === 'dev') this.atoms.forEach((a, i) => {
        let hN = C.implicitH(m, adj, i); if (!hN) return;
        const as = adj[i].map((x) => Math.atan2(this.atoms[x.j].y - a.y, this.atoms[x.j].x - a.x));
        while (hN-- > 0) {
          let t;
          if (!as.length) t = 0;
          else { const s = as.slice().sort((p, q) => p - q); let gap = -1; s.forEach((v, k) => { const nx = k === s.length - 1 ? s[0] + 2 * Math.PI : s[k + 1]; if (nx - v > gap + 1e-9) { gap = nx - v; t = v + (nx - v) / 2; } }); }
          as.push(t); const x = a.x + Math.cos(t) * this.L * 0.78, y = a.y + Math.sin(t) * this.L * 0.78;
          out.push(`<line class="bd" x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`);
          hlab.push(`<rect class="lbg" x="${(x - 6).toFixed(1)}" y="${(y - 9).toFixed(1)}" width="12" height="18" rx="3"/><text class="lb" x="${x.toFixed(1)}" y="${(y + 5.2).toFixed(1)}" text-anchor="middle">H</text>`);
        }
      });
      out.push(hlab.join(''));
      // atomes
      this.atoms.forEach((a, i) => {
        const bad = C.overValent(m, adj, i), hov = this.hover && this.hover.atom === i;
        if (hov) out.push(`<circle class="at-halo" cx="${a.x}" cy="${a.y}" r="15"/>`);
        if (bad) out.push(`<circle class="at-bad" cx="${a.x}" cy="${a.y}" r="14"><title>Valence dépassée</title></circle>`);
        if (!labeled(i)) { if (hov || bad) out.push(`<circle class="at-dot" cx="${a.x}" cy="${a.y}" r="2.5"/>`); return; }
        const hN = this.display === 'dev' ? 0 : C.implicitH(m, adj, i);
        const ax = adj[i].reduce((s, x) => s + this.atoms[x.j].x - a.x, 0);
        const left = hN > 0 && ax > 1;
        const sw = 0.64 * fs * a.el.length, hw = hN ? 0.64 * fs + (hN > 1 ? 0.45 * fs : 0) : 0;
        const E = C.EL[a.el], css = ['O', 'N', 'S', 'Cl', 'Br', 'I', 'F', 'P', 'B', 'Si'].includes(a.el);
        const ec = E && E.l ? (css ? ' e-' + a.el : ' ex') : '';
        const st = ec ? ` class="${ec.trim()}"${css ? '' : ` style="--ec:${E.l};--ecd:${E.ld || E.l}"`}` : '';
        const sub = hN > 1 ? `<tspan class="sub${ec}" dy="4">${hN}</tspan>` : '';
        const y = a.y + fs * 0.35;
        if (left) {
          out.push(`<rect class="lbg" x="${(a.x - sw / 2 - hw - 2).toFixed(1)}" y="${(a.y - 10).toFixed(1)}" width="${(sw + hw + 4).toFixed(1)}" height="20" rx="4"/>`);
          out.push(`<text class="lb${bad ? ' bad' : ''}" x="${(a.x + sw / 2).toFixed(1)}" y="${y.toFixed(1)}" text-anchor="end"><tspan${st}>H</tspan>${sub}<tspan${st}${hN > 1 ? ' dy="-4"' : ''}>${a.el}</tspan></text>`);
        } else {
          out.push(`<rect class="lbg" x="${(a.x - sw / 2 - 2).toFixed(1)}" y="${(a.y - 10).toFixed(1)}" width="${(sw + hw + 4).toFixed(1)}" height="20" rx="4"/>`);
          out.push(`<text class="lb${bad ? ' bad' : ''}" x="${(a.x - sw / 2).toFixed(1)}" y="${y.toFixed(1)}" text-anchor="start"><tspan${st}>${a.el}</tspan>${hN ? `<tspan${st}>H</tspan>` + sub : ''}</text>`);
        }
        if (a.chg) { const t = C.chargeTxt(a.chg), cx = left ? a.x + sw / 2 + 1 : a.x - sw / 2 + sw + hw + 1; out.push(`<text class="lb chg" x="${cx.toFixed(1)}" y="${(a.y - 4).toFixed(1)}" text-anchor="start">${t}</text>`); }
      });
      if (this.ghost) {
        const g = this.ghost; out.push(`<line class="ghost" x1="${g.s.x}" y1="${g.s.y}" x2="${g.e.x}" y2="${g.e.y}"/><circle class="ghost-at" cx="${g.e.x}" cy="${g.e.y}" r="5"/>`);
      }
      if (!this.atoms.length) {
        out.push(`<text class="ed-empty" x="${this.cx}" y="${this.cy - 8}" text-anchor="middle">${w < 400 ? 'Touchez' : 'Cliquez'} pour placer un atome (${esc(this.el)})</text>`);
        out.push(`<text class="ed-empty small" x="${this.cx}" y="${this.cy + 16}" text-anchor="middle">${w < 560 ? 'puis cliquez dessus pour allonger la chaîne' : 'puis cliquez sur l’atome pour allonger la chaîne, ou glissez pour tracer une liaison'}</text>`);
      }
      svg.innerHTML = out.join('');
    }
  }

  // =====================================================================
  // VISIONNEUSE / CONSTRUCTEUR 3D
  // =====================================================================
  const shade = (hex, f) => {
    const n = parseInt(hex.slice(1), 16); let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    if (f >= 0) { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; } else { r *= 1 + f; g *= 1 + f; b *= 1 + f; }
    return `rgb(${r | 0},${g | 0},${b | 0})`;
  };
  const mat = { id: () => [1, 0, 0, 0, 1, 0, 0, 0, 1],
    mul: (a, b) => { const o = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) o.push(a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j]); return o; },
    rx: (t) => [1, 0, 0, 0, Math.cos(t), -Math.sin(t), 0, Math.sin(t), Math.cos(t)],
    ry: (t) => [Math.cos(t), 0, Math.sin(t), 0, 1, 0, -Math.sin(t), 0, Math.cos(t)],
    ap: (m, p) => [m[0] * p[0] + m[1] * p[1] + m[2] * p[2], m[3] * p[0] + m[4] * p[1] + m[5] * p[2], m[6] * p[0] + m[7] * p[1] + m[8] * p[2]],
    apT: (m, p) => [m[0] * p[0] + m[3] * p[1] + m[6] * p[2], m[1] * p[0] + m[4] * p[1] + m[7] * p[2], m[2] * p[0] + m[5] * p[1] + m[8] * p[2]] };

  class Viewer3D {
    constructor(host, opt = {}) {
      this.host = host; this.opt = opt;
      const cv = document.createElement('canvas'); cv.className = 'v3d-canvas'; cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', opt.label || 'Modèle moléculaire 3D : glissez pour tourner, molette ou pincement pour zoomer');
      host.appendChild(cv); this.cv = cv; this.ctx = cv.getContext('2d');
      this.mol = { atoms: [], bonds: [] }; this.c = [0, 0, 0]; this.R = mat.mul(mat.rx(-0.35), mat.ry(0.55)); this.zoom = 1; this.pan = [0, 0];
      this.style = opt.style || 'bs'; this.labels = !!opt.labels; this.mode = 'naviguer'; this.el = 'C'; this.autoH = true; this.autoOpt = true;
      this.sel = []; this.inspect = -1; this.energy = null; this.ptrs = new Map(); this.drag = null; this.spin = !!opt.spin && !RM();
      this.onInfo = opt.onInfo || (() => {}); this.onChange = opt.onChange || (() => {}); this.onMsg = opt.onMsg || (() => {});
      cv.addEventListener('pointerdown', (e) => this.down(e)); cv.addEventListener('pointermove', (e) => this.move(e));
      cv.addEventListener('pointerup', (e) => this.up(e)); cv.addEventListener('pointercancel', (e) => { this.ptrs.delete(e.pointerId); this.drag = null; });
      cv.addEventListener('contextmenu', (e) => e.preventDefault());
      cv.addEventListener('wheel', (e) => { if (this.opt.noWheel) return; e.preventDefault(); this.zoom = Math.max(0.3, Math.min(5, this.zoom * Math.exp(-e.deltaY * 0.0012))); this.render(); }, { passive: false });
      this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(host); this.resize();
      if (this.spin) this.loop();
    }
    destroy() { this.ro.disconnect(); this.spin = false; if (this.anim) cancelAnimationFrame(this.anim); }
    resize() { const r = this.host.getBoundingClientRect(); this.W = Math.max(50, r.width); this.H = Math.max(50, r.height); this.dpr = Math.min(2, G.devicePixelRatio || 1); this.cv.width = this.W * this.dpr; this.cv.height = this.H * this.dpr; this.cv.style.width = this.W + 'px'; this.cv.style.height = this.H + 'px'; this.render(); }
    setMolecule(m, keepView) {
      this.mol = C.clone(m); this.sel = []; this.inspect = -1; this.energy = null;
      if (!keepView) { this.c = C.centroid(this.mol); this.zoom = 1; this.pan = [0, 0]; }
      this.fitScale(); this.render(); this.emit();
    }
    getMol() { return C.clone(this.mol); }
    // image de la vue actuelle, sur fond uni (export PNG, documents PDF)
    snapshot(w = 1600, h = 1200, bg = '#ffffff') {
      const keep = [this.cv, this.ctx, this.W, this.H, this.dpr, this.sel, this.inspect, this.host];
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const probe = document.createElement('div');
      this.cv = cv; this.ctx = cv.getContext('2d'); this.W = w; this.H = h; this.dpr = 1; this.sel = []; this.inspect = -1; this.host = probe;
      try { this.render(); } finally { [this.cv, this.ctx, this.W, this.H, this.dpr, this.sel, this.inspect, this.host] = keep; }
      const out = document.createElement('canvas'); out.width = w; out.height = h; const o = out.getContext('2d');
      if (bg) { o.fillStyle = bg; o.fillRect(0, 0, w, h); } o.drawImage(cv, 0, 0); return out;
    }
    fitScale() { const c = this.c; let r = 1.2; this.mol.atoms.forEach((a) => { r = Math.max(r, C.dist(C.P3(a), c)); }); this.radius = r; }
    resetView() { this.R = mat.mul(mat.rx(-0.35), mat.ry(0.55)); this.zoom = 1; this.pan = [0, 0]; this.c = C.centroid(this.mol); this.fitScale(); this.render(); }
    loop() {
      let t0 = performance.now();
      const f = (t) => { if (!this.cv.isConnected) { this.destroy(); return; } if (!this.spin) return; const dt = Math.min(50, t - t0); t0 = t; if (!this.drag && !document.hidden) { this.R = mat.mul(mat.ry(dt * 0.0005), this.R); this.render(); } requestAnimationFrame(f); };
      requestAnimationFrame(f);
    }
    setSpin(on) { const was = this.spin; this.spin = on && !RM(); if (this.spin && !was) this.loop(); }
    // --- projection ---
    proj(p) {
      const q = mat.ap(this.R, [p[0] - this.c[0], p[1] - this.c[1], p[2] - this.c[2]]);
      const base = Math.min(this.W, this.H) * 0.46 / (Math.max(this.radius, 1.1) + (this.style === 'vdw' ? 1.7 : 0.6));
      const F = this.radius * 3 + 6, s = base * this.zoom * F / Math.max(F - q[2], 0.5);
      return { x: this.W / 2 + this.pan[0] + q[0] * s, y: this.H / 2 + this.pan[1] - q[1] * s, z: q[2], s };
    }
    unproj(x, y) {
      const base = Math.min(this.W, this.H) * 0.46 / (Math.max(this.radius, 1.1) + (this.style === 'vdw' ? 1.7 : 0.6)), s = base * this.zoom;
      const q = [(x - this.W / 2 - this.pan[0]) / s, -(y - this.H / 2 - this.pan[1]) / s, 0];
      const p = mat.apT(this.R, q); return [p[0] + this.c[0], p[1] + this.c[1], p[2] + this.c[2]];
    }
    atomR(a) { const w = (C.EL[a.el] || C.EL.C).w; return this.style === 'vdw' ? w : this.style === 'bs' ? w * 0.3 : this.style === 'stick' ? 0.17 : 0.07; }
    // --- rendu ---
    render() {
      const ctx = this.ctx, W = this.W, H = this.H; if (!ctx) return;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      const ink = cssVar(this.host, '--ink', '#14202c'), muted = cssVar(this.host, '--muted', '#5b6673'), acc = cssVar(this.host, '--accent', '#e8731c'), cbg = cssVar(this.host, '--panel', '#ffffff');
      const m = this.mol;
      if (!m.atoms.length) {
        this.P = [];
        ctx.fillStyle = muted; ctx.font = '500 15px ' + cssVar(this.host, '--font', 'sans-serif'); ctx.textAlign = 'center';
        ctx.fillText(this.mode === 'ajouter' ? 'Cliquez ici pour placer un premier atome' : 'Aucune molécule chargée', W / 2, H / 2); return;
      }
      const P = m.atoms.map((a) => this.proj([a.x, a.y, a.z || 0])); this.P = P;
      const items = [], st = this.style;
      const brad = st === 'stick' ? 0.17 : st === 'bs' ? 0.1 : 0;
      if (st !== 'vdw') m.bonds.forEach((b) => {
        const A = P[b.a], B = P[b.b]; if (!A || !B) return;
        const M = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2, z: (A.z + B.z) / 2, s: (A.s + B.s) / 2 };
        const ca = (C.EL[m.atoms[b.a].el] || C.EL.C).c, cb = (C.EL[m.atoms[b.b].el] || C.EL.C).c;
        items.push({ z: (A.z + M.z) / 2 - 0.05, f: () => this.tube(A, M, ca, b.o, brad, B) });
        items.push({ z: (B.z + M.z) / 2 - 0.05, f: () => this.tube(M, B, cb, b.o, brad, A) });
      });
      m.atoms.forEach((a, i) => { items.push({ z: P[i].z, f: () => this.sphere(P[i], this.atomR(a) * P[i].s, (C.EL[a.el] || C.EL.C).c, st) }); });
      items.sort((p, q) => p.z - q.z).forEach((it) => it.f());
      // étiquettes
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '600 12px ' + cssVar(this.host, '--font', 'sans-serif');
      if (this.labels) m.atoms.forEach((a, i) => { const p = P[i]; ctx.lineWidth = 3; ctx.strokeStyle = cbg; const t = a.el + (a.chg ? C.chargeTxt(a.chg) : ''); ctx.strokeText(t, p.x, p.y); ctx.fillStyle = ink; ctx.fillText(t, p.x, p.y); });
      // sélection et mesures
      const selAll = this.inspect >= 0 ? [this.inspect] : this.sel;
      selAll.forEach((i, n) => {
        const p = P[i]; if (!p) return; const r = Math.max(this.atomR(m.atoms[i]) * p.s, 6) + 4;
        ctx.strokeStyle = acc; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7); ctx.stroke();
        if (this.inspect < 0) { ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(p.x + r * 0.75, p.y - r * 0.75, 9, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText(String(n + 1), p.x + r * 0.75, p.y - r * 0.75 + 0.5); }
      });
      if (this.sel.length >= 2) {
        ctx.setLineDash([5, 4]); ctx.strokeStyle = acc; ctx.lineWidth = 1.6; ctx.beginPath();
        this.sel.forEach((i, n) => { const p = P[i]; n ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }); ctx.stroke(); ctx.setLineDash([]);
        const v = this.measure(); if (v) {
          const ps = this.sel.map((i) => P[i]); const lx = ps.reduce((s, p) => s + p.x, 0) / ps.length, ly = ps.reduce((s, p) => s + p.y, 0) / ps.length - 18;
          this.pill(v.text, lx, ly, acc);
        }
      }
    }
    pill(t, x, y, col) {
      const ctx = this.ctx; ctx.font = '700 13px ' + cssVar(this.host, '--font', 'sans-serif'); const w = ctx.measureText(t).width + 16;
      x = Math.max(w / 2 + 4, Math.min(this.W - w / 2 - 4, x)); y = Math.max(14, Math.min(this.H - 14, y));
      ctx.fillStyle = col; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x - w / 2, y - 12, w, 24, 12); else ctx.rect(x - w / 2, y - 12, w, 24); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, x, y + 0.5);
    }
    tube(A, B, col, o, rad, other) {
      const ctx = this.ctx; let w = rad ? 2 * rad * A.s : 1.6; if (this.style === 'wire') w = 2;
      const dx = B.x - A.x, dy = B.y - A.y, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
      const lines = this.style === 'stick' || o === 1 || o === 1.5 ? [0] : o === 2 ? [-1, 1] : [-1.6, 0, 1.6];
      const off = (this.style === 'wire' ? 0.1 : 0.13) * A.s, ww = lines.length > 1 ? w * (this.style === 'wire' ? 1 : 0.62) : w;
      ctx.lineCap = this.style === 'stick' ? 'round' : 'butt';
      lines.forEach((k) => {
        const x1 = A.x + nx * off * k, y1 = A.y + ny * off * k, x2 = B.x + nx * off * k, y2 = B.y + ny * off * k;
        ctx.strokeStyle = this.style === 'wire' ? shade(col === '#ffffff' ? '#c8ccd2' : col, -0.1) : shade(col === '#ffffff' ? '#e8ebef' : col, -0.28); ctx.lineWidth = ww;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        if (this.style !== 'wire' && ww > 3) { ctx.strokeStyle = shade(col, 0.35); ctx.lineWidth = ww * 0.38; ctx.beginPath(); ctx.moveTo(x1 - nx * ww * 0.12, y1 - ny * ww * 0.12); ctx.lineTo(x2 - nx * ww * 0.12, y2 - ny * ww * 0.12); ctx.stroke(); }
      });
      if (o === 1.5 && this.style !== 'stick') { ctx.setLineDash([3, 3]); ctx.strokeStyle = shade(col, -0.3); ctx.lineWidth = Math.max(1, w * 0.4); ctx.beginPath(); ctx.moveTo(A.x + nx * off * 1.8, A.y + ny * off * 1.8); ctx.lineTo(B.x + nx * off * 1.8, B.y + ny * off * 1.8); ctx.stroke(); ctx.setLineDash([]); }
    }
    sphere(p, r, col, st) {
      const ctx = this.ctx; if (st === 'wire') { r = 2.2; }
      r = Math.max(r, 1.5);
      const g = ctx.createRadialGradient(p.x - r * 0.35, p.y - r * 0.4, r * 0.08, p.x, p.y, r);
      g.addColorStop(0, shade(col, 0.75)); g.addColorStop(0.45, col === '#ffffff' ? '#f3f4f6' : col); g.addColorStop(1, shade(col === '#ffffff' ? '#c5cad1' : col, -0.45));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = 0.8; ctx.stroke();
    }
    // --- mesures et informations ---
    measure() {
      const s = this.sel, A = this.mol.atoms, p = (i) => C.P3(A[i]), lab = (i) => A[i].el + (this.sel.indexOf(i) + 1);
      if (s.length === 2) { const d = C.dist(p(s[0]), p(s[1])); return { kind: 'Distance', text: C.fr(d) + ' Å', full: `${lab(s[0])}–${lab(s[1])} : ${C.fr(d, 3)} Å` }; }
      if (s.length === 3) { const a = C.angleDeg(p(s[0]), p(s[1]), p(s[2])); return { kind: 'Angle', text: C.fr(a, 1) + '°', full: `${lab(s[0])}–${lab(s[1])}–${lab(s[2])} : ${C.fr(a, 2)}°` }; }
      if (s.length === 4) { const d = C.dihedral(p(s[0]), p(s[1]), p(s[2]), p(s[3])) * 180 / Math.PI; return { kind: 'Angle dièdre', text: C.fr(d, 1) + '°', full: `${s.map(lab).join('–')} : ${C.fr(d, 1)}°` }; }
      return null;
    }
    emit() {
      const m = this.mol, cnt = C.counts(m, false), adj = C.adjacency(m), rows = [];
      let html = '';
      if (this.inspect >= 0 && m.atoms[this.inspect]) {
        const i = this.inspect, a = m.atoms[i], v = C.vsepr(m, adj, i), nb = adj[i];
        html += `<h4>Atome ${esc(a.el)}${a.chg ? '<sup>' + C.chargeTxt(a.chg) + '</sup>' : ''} — ${esc((C.EL[a.el] || {}).n || '')}</h4><dl class="kv">`;
        html += `<dt>Voisins liés</dt><dd>${nb.length ? nb.map((x) => esc(m.atoms[x.j].el) + (x.o > 1 ? (x.o === 2 ? ' (double)' : x.o === 3 ? ' (triple)' : ' (arom.)') : '')).join(', ') : 'aucun'}</dd>`;
        if (a.el !== 'H') html += `<dt>Doublets non liants</dt><dd>${v.E}</dd><dt>Notation VSEPR</dt><dd>${v.code.replace(/(\d)/g, '<sub>$1</sub>')}</dd><dt>Géométrie</dt><dd>${esc(v.geo)}</dd>`;
        if (v.ideal && nb.length >= 2) html += `<dt>Angle idéal</dt><dd>≈ ${C.fr(v.ideal, 1)}°</dd>`;
        html += '</dl>';
        if (nb.length >= 2) { html += '<p class="mini-h">Angles mesurés</p><ul class="mlist">'; for (let p = 0; p < nb.length && p < 6; p++) for (let q = p + 1; q < nb.length && q < 6; q++) html += `<li>${esc(m.atoms[nb[p].j].el)}–${esc(a.el)}–${esc(m.atoms[nb[q].j].el)} <b>${C.fr(C.angleDeg(C.P3(m.atoms[nb[p].j]), C.P3(a), C.P3(m.atoms[nb[q].j])), 1)}°</b></li>`; html += '</ul>'; }
        if (nb.length) { html += '<p class="mini-h">Longueurs de liaison</p><ul class="mlist">'; nb.slice(0, 6).forEach((x) => { html += `<li>${esc(a.el)}–${esc(m.atoms[x.j].el)} <b>${C.fr(C.dist(C.P3(a), C.P3(m.atoms[x.j])), 3)} Å</b></li>`; }); html += '</ul>'; }
      } else if (this.sel.length) {
        const v = this.measure();
        html += `<h4>Mesure</h4>` + (v ? `<p class="measure-big">${esc(v.kind)} <b>${esc(v.full)}</b></p>` : `<p>Atome ${this.sel.length} sélectionné. Cliquez sur un deuxième atome (distance), un troisième (angle) ou un quatrième (angle dièdre).</p>`);
      }
      const f = C.formulaHTML(cnt);
      html += `<dl class="kv sum"><dt>Formule brute</dt><dd>${f}</dd><dt>Masse molaire</dt><dd>${C.fr(C.molarMass(cnt), 2)} g/mol</dd><dt>Atomes / liaisons</dt><dd>${m.atoms.length} / ${m.bonds.length}</dd>${this.energy != null ? `<dt>Énergie (champ simplifié)</dt><dd>${C.fr(this.energy, 3)} u.a.</dd>` : ''}</dl>`;
      this.onInfo(html);
    }
    // --- interactions ---
    hitAtom(x, y) { if (!this.P || this.P.length !== this.mol.atoms.length) return -1; let best = -1, bz = -Infinity; this.P.forEach((p, i) => { const r = Math.max(this.atomR(this.mol.atoms[i]) * p.s, 9) + 3; if (Math.hypot(p.x - x, p.y - y) <= r && p.z > bz) { bz = p.z; best = i; } }); return best; }
    hitBond(x, y) {
      if (!this.P || this.P.length !== this.mol.atoms.length) return -1; let best = -1, bd = 9;
      this.mol.bonds.forEach((b, k) => { const A = this.P[b.a], B = this.P[b.b], dx = B.x - A.x, dy = B.y - A.y, l2 = dx * dx + dy * dy || 1; const u = Math.max(0, Math.min(1, ((x - A.x) * dx + (y - A.y) * dy) / l2)); const d = Math.hypot(A.x + u * dx - x, A.y + u * dy - y); if (d < bd && u > 0.15 && u < 0.85) { bd = d; best = k; } });
      return best;
    }
    pos(e) { const r = this.cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    down(e) {
      this.cv.setPointerCapture(e.pointerId); const p = this.pos(e); this.ptrs.set(e.pointerId, p);
      if (this.ptrs.size === 1) this.drag = { x: p.x, y: p.y, sx: p.x, sy: p.y, moved: false, pan: e.button === 2 || e.shiftKey };
      else { this.drag = { pinch: true, moved: true }; const [a, b] = [...this.ptrs.values()]; this.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: this.zoom, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, pan: this.pan.slice() }; }
    }
    move(e) {
      if (!this.ptrs.has(e.pointerId)) return; const p = this.pos(e); this.ptrs.set(e.pointerId, p);
      const d = this.drag; if (!d) return;
      if (d.pinch && this.ptrs.size >= 2) { const [a, b] = [...this.ptrs.values()]; const dd = Math.hypot(a.x - b.x, a.y - b.y); this.zoom = Math.max(0.3, Math.min(5, this.pinch.z * dd / (this.pinch.d || 1))); this.pan = [this.pinch.pan[0] + (a.x + b.x) / 2 - this.pinch.mx, this.pinch.pan[1] + (a.y + b.y) / 2 - this.pinch.my]; this.render(); return; }
      if (Math.hypot(p.x - d.sx, p.y - d.sy) > 4) d.moved = true;
      if (!d.moved) return;
      const dx = p.x - d.x, dy = p.y - d.y; d.x = p.x; d.y = p.y;
      if (d.pan) this.pan = [this.pan[0] + dx, this.pan[1] + dy];
      else this.R = mat.mul(mat.rx(dy * 0.009), mat.mul(mat.ry(dx * 0.009), this.R));
      this.render();
    }
    up(e) {
      const d = this.drag; this.ptrs.delete(e.pointerId);
      if (this.ptrs.size === 0) { this.drag = null; if (d && !d.moved && !d.pinch) { const p = this.pos(e); this.click(p.x, p.y); } }
    }
    zoomBy(f) { this.zoom = Math.max(0.3, Math.min(5, this.zoom * f)); this.render(); }
    rotateBy(ax, t) { this.R = mat.mul(ax === 'x' ? mat.rx(t) : mat.ry(t), this.R); this.render(); }
    setMode(md) { this.mode = md; this.sel = []; this.inspect = -1; this.render(); this.emit(); }
    click(x, y) {
      const i = this.hitAtom(x, y), m = this.mol;
      if (this.mode === 'naviguer') { this.inspect = i; this.sel = []; this.render(); this.emit(); return; }
      if (this.mode === 'mesurer') {
        if (i < 0) { this.sel = []; }
        else if (this.sel.includes(i)) this.sel = this.sel.filter((x) => x !== i);
        else { if (this.sel.length >= 4) this.sel = []; this.sel.push(i); }
        this.inspect = -1; this.render(); this.emit(); return;
      }
      if (this.mode === 'ajouter') {
        if (i >= 0) this.addTo(i);
        else { const p = m.atoms.length ? this.unproj(x, y) : [0, 0, 0]; m.atoms.push({ el: this.el, x: p[0], y: p[1], z: p[2] }); if (m.atoms.length === 1) { this.c = [0, 0, 0]; this.radius = 1.5; } }
        this.afterEdit(); return;
      }
      if (this.mode === 'supprimer') {
        if (i < 0) return; const del = new Set([i]), wasH = m.atoms[i].el === 'H';
        if (!wasH) C.adjacency(m)[i].forEach((x) => { if (m.atoms[x.j].el === 'H') del.add(x.j); });
        C.removeAtoms(m, del); this.afterEdit(wasH); return;
      }
      if (this.mode === 'liaison') {
        const k = this.hitBond(x, y); if (k < 0) { this.onMsg('Cliquez sur une liaison pour changer son ordre (simple → double → triple).'); return; }
        const b = m.bonds[k], prev = b.o; b.o = b.o >= 3 ? 1 : Math.floor(b.o) + 1;
        const test = C.clone(m); C.adjustHydrogens(test); const adj = C.adjacency(test);
        if (test.atoms.some((a, j) => C.overValent(test, adj, j))) { b.o = prev; this.onMsg('Impossible : un atome dépasserait sa valence.'); return; }
        this.afterEdit();
      }
    }
    addTo(i) {
      const m = this.mol, a = m.atoms[i], adj = C.adjacency(m), el = this.el;
      if (a.el === 'H') {
        const par = adj[i][0]; a.el = el;
        if (par) { const pp = C.P3(m.atoms[par.j]), d = C.unit(C.sub(C.P3(a), pp)), q = C.add(pp, C.mul(d, C.bondLen(m.atoms[par.j].el, el, 1))); a.x = q[0]; a.y = q[1]; a.z = q[2]; }
        return;
      }
      const h = adj[i].find((x) => m.atoms[x.j].el === 'H');
      if (h) { const t = m.atoms[h.j]; t.el = el; const pp = C.P3(a), d = C.unit(C.sub(C.P3(t), pp)), q = C.add(pp, C.mul(d, C.bondLen(a.el, el, 1))); t.x = q[0]; t.y = q[1]; t.z = q[2]; return; }
      if (a.el === el && !adj[i].length) return;
      const test = C.clone(m); test.atoms.push({ el, x: 0, y: 0, z: 0 }); test.bonds.push({ a: i, b: test.atoms.length - 1, o: 1 });
      if (C.overValent(test, C.adjacency(test), i)) { this.onMsg('Cet atome a déjà toutes ses liaisons.'); return; }
      let s = [0, 0, 0]; adj[i].forEach((x) => { s = C.add(s, C.unit(C.sub(C.P3(m.atoms[x.j]), C.P3(a)))); });
      let d = C.norm(s) < 0.2 ? C.unit([0.6, 0.7, 0.3]) : C.unit(C.mul(s, -1));
      const q = C.add(C.P3(a), C.mul(d, C.bondLen(a.el, el, 1)));
      m.atoms.push({ el, x: q[0], y: q[1], z: q[2] }); m.bonds.push({ a: i, b: m.atoms.length - 1, o: 1 });
    }
    afterEdit(skipH) {
      if (this.autoH && !skipH) C.adjustHydrogens(this.mol, (Date.now() % 997) + 3);
      this.sel = []; this.inspect = -1; this.fitScale(); this.energy = null;
      this.render(); this.emit(); this.onChange(this.getMol());
      if (this.autoOpt && this.mol.atoms.length > 1) this.optimize(260);
    }
    optimize(steps = 700, cb) {
      if (this.anim) cancelAnimationFrame(this.anim);
      if (this.mol.atoms.length < 2) { cb && cb(); return; }
      const ff = new C.ForceField(this.mol);
      if (RM()) { const r = ff.optimize(steps); this.energy = r ? r.E : ff.energy(); this.render(); this.emit(); this.onChange(this.getMol()); cb && cb(); return; }
      let n = 0;
      const tick = () => {
        if (!this.cv.isConnected) return;
        const r = ff.iterate(4); n += 4; this.energy = r.E; this.render();
        if (!r.done && n < steps) this.anim = requestAnimationFrame(tick);
        else { this.anim = null; this.emit(); this.onChange(this.getMol()); cb && cb(); }
      };
      this.anim = requestAnimationFrame(tick);
    }
  }

  G.Editor2D = Editor2D; G.Viewer3D = Viewer3D;
})(window);
