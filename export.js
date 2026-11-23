/* export.js — images des composés (2D en SVG/PNG, 3D en PNG) et documents PDF des cours
   Le PDF est construit dans le navigateur (jsPDF + police Source Sans 3 embarquée), sans serveur. */
(function (G) {
  'use strict';
  const A = G.APP, C = G.Chem, esc = A.esc;
  const BRAND = 'INFOCHIMIE UK', CREDIT = 'Développée par M. Alhouseny CISSE et son assistant Sory BAGAYOKO';
  A.BRAND = BRAND;

  // =====================================================================
  // Structure 2D → SVG autonome (fond blanc, couleurs des éléments)
  // =====================================================================
  A.structSVG = (mol, o = {}) => {
    const display = o.display || 'semi', fs = 15, Lp = 48, ink = '#1d2630';
    const atoms = mol.atoms, bonds = mol.bonds, m = { atoms, bonds }, adj = C.adjacency(m), out = [], hl = [];
    const pts = [];
    const labeled = (i) => { const a = atoms[i]; if (a.el !== 'C') return true; if (display !== 'topo') return true; return adj[i].length === 0; };
    const col = (el) => (C.EL[el] && C.EL[el].l) || ink;
    const line = (x1, y1, x2, y2) => out.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`);
    bonds.forEach((b) => {
      const P = atoms[b.a], Q = atoms[b.b]; if (!P || !Q) return;
      const dx = Q.x - P.x, dy = Q.y - P.y, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
      if (b.o === 2) {
        const ring = C.ringPath(adj, b.a, b.b, 7);
        if (ring && !labeled(b.a) && !labeled(b.b)) {
          const cx = ring.reduce((s, i) => s + atoms[i].x, 0) / ring.length, cy = ring.reduce((s, i) => s + atoms[i].y, 0) / ring.length;
          const sg = ((cx - (P.x + Q.x) / 2) * nx + (cy - (P.y + Q.y) / 2) * ny) > 0 ? 1 : -1, d = 6.5 * sg;
          line(P.x, P.y, Q.x, Q.y); line(P.x + dx * 0.14 + nx * d, P.y + dy * 0.14 + ny * d, Q.x - dx * 0.14 + nx * d, Q.y - dy * 0.14 + ny * d);
        } else { line(P.x + nx * 3.2, P.y + ny * 3.2, Q.x + nx * 3.2, Q.y + ny * 3.2); line(P.x - nx * 3.2, P.y - ny * 3.2, Q.x - nx * 3.2, Q.y - ny * 3.2); }
      } else if (b.o === 3) { line(P.x, P.y, Q.x, Q.y); [5, -5].forEach((d) => line(P.x + nx * d, P.y + ny * d, Q.x + nx * d, Q.y + ny * d)); }
      else line(P.x, P.y, Q.x, Q.y);
    });
    atoms.forEach((a) => pts.push([a.x - 10, a.y - 11], [a.x + 10, a.y + 11]));
    if (display === 'dev') atoms.forEach((a, i) => {
      let hN = C.implicitH(m, adj, i); if (!hN) return;
      const as = adj[i].map((x) => Math.atan2(atoms[x.j].y - a.y, atoms[x.j].x - a.x));
      while (hN-- > 0) {
        let t = 0;
        if (as.length) { const s = as.slice().sort((p, q) => p - q); let gap = -1; s.forEach((v, k) => { const nx = k === s.length - 1 ? s[0] + 2 * Math.PI : s[k + 1]; if (nx - v > gap + 1e-9) { gap = nx - v; t = v + (nx - v) / 2; } }); }
        as.push(t); const x = a.x + Math.cos(t) * Lp * 0.78, y = a.y + Math.sin(t) * Lp * 0.78;
        line(a.x, a.y, x, y); pts.push([x - 8, y - 11], [x + 8, y + 11]);
        hl.push(`<rect x="${(x - 6).toFixed(1)}" y="${(y - 9).toFixed(1)}" width="12" height="18" fill="#fff"/><text x="${x.toFixed(1)}" y="${(y + 5.2).toFixed(1)}" text-anchor="middle" fill="${ink}">H</text>`);
      }
    });
    const labs = [];
    atoms.forEach((a, i) => {
      if (!labeled(i)) return;
      const hN = display === 'dev' ? 0 : C.implicitH(m, adj, i), ax = adj[i].reduce((s, x) => s + atoms[x.j].x - a.x, 0), left = hN > 0 && ax > 1;
      const sw = 0.64 * fs * a.el.length, hw = hN ? 0.64 * fs + (hN > 1 ? 0.45 * fs : 0) : 0, y = a.y + fs * 0.35, c = col(a.el);
      const sub = hN > 1 ? `<tspan dy="4" font-size="11">${hN}</tspan>` : '';
      const x0 = left ? a.x - sw / 2 - hw - 2 : a.x - sw / 2 - 2;
      labs.push(`<rect x="${x0.toFixed(1)}" y="${(a.y - 10).toFixed(1)}" width="${(sw + hw + 4).toFixed(1)}" height="20" rx="4" fill="#fff"/>`);
      pts.push([x0, a.y - 11], [x0 + sw + hw + 4, a.y + 13]);
      if (left) labs.push(`<text x="${(a.x + sw / 2).toFixed(1)}" y="${y.toFixed(1)}" text-anchor="end" fill="${c}">H${sub}<tspan${hN > 1 ? ' dy="-4"' : ''}>${a.el}</tspan></text>`);
      else labs.push(`<text x="${(a.x - sw / 2).toFixed(1)}" y="${y.toFixed(1)}" text-anchor="start" fill="${c}">${a.el}${hN ? 'H' + sub : ''}</text>`);
    });
    const pad = o.pad == null ? 16 : o.pad;
    let x0 = Math.min(...pts.map((p) => p[0])) - pad, y0 = Math.min(...pts.map((p) => p[1])) - pad, x1 = Math.max(...pts.map((p) => p[0])) + pad, y1 = Math.max(...pts.map((p) => p[1])) + pad;
    if (!atoms.length) { x0 = 0; y0 = 0; x1 = 100; y1 = 60; }
    let titleH = 0, title = '';
    if (o.title) { titleH = 26; const w = Math.max(x1 - x0, o.title.length * 7.6 + 20); const cx = (x0 + x1) / 2; x0 = Math.min(x0, cx - w / 2); x1 = Math.max(x1, cx + w / 2); title = `<text x="${((x0 + x1) / 2).toFixed(1)}" y="${(y1 + 14).toFixed(1)}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="600" fill="${ink}">${esc(o.title)}</text>`; }
    const W = x1 - x0, H = y1 - y0 + titleH;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(W)}" height="${Math.ceil(H)}" viewBox="${x0.toFixed(1)} ${y0.toFixed(1)} ${W.toFixed(1)} ${H.toFixed(1)}"><rect x="${x0.toFixed(1)}" y="${y0.toFixed(1)}" width="${W.toFixed(1)}" height="${H.toFixed(1)}" fill="#ffffff"/>` +
      `<g stroke="${ink}" stroke-width="1.8" stroke-linecap="round">${out.join('')}</g><g font-family="Arial, Helvetica, sans-serif" font-size="${fs}" font-weight="600">${hl.join('')}${labs.join('')}</g>${title}</svg>`;
    return { svg, w: Math.ceil(W), h: Math.ceil(H) };
  };
  A.svgToCanvas = (svg, w, h, scale = 2) => new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => { const cv = document.createElement('canvas'); cv.width = Math.round(w * scale); cv.height = Math.round(h * scale); const x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, cv.width, cv.height); x.drawImage(img, 0, 0, cv.width, cv.height); res(cv); };
    img.onerror = () => rej(new Error('Image impossible à produire.'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
  A.canvasBlob = (cv, type = 'image/png', q) => new Promise((res) => cv.toBlob((b) => res(b), type, q));
  A.molName = (m, fb) => A.slug((m && m.name) || fb || 'molecule');
  // téléchargements d'images
  A.dlMol2DImage = async (mol, opt = {}) => {
    if (!mol || !mol.atoms.length) return A.toast('Rien à exporter.');
    const name = opt.name || A.molName(mol), s = A.structSVG(mol, { display: opt.display, title: opt.title });
    if (opt.svg) return A.download(name + '_2D.svg', new Blob([s.svg], { type: 'image/svg+xml' }), s.svg);
    const cv = await A.svgToCanvas(s.svg, s.w, s.h, opt.scale || 3); A.download(name + '_2D.png', await A.canvasBlob(cv));
  };
  A.mol3DCanvas = (mol, o = {}) => {
    const host = document.createElement('div'); const v = new G.Viewer3D(host, { style: o.style || 'bs', labels: !!o.labels });
    v.setMolecule(mol); const cv = v.snapshot(o.w || 900, o.h || 700, o.bg || '#ffffff'); v.destroy(); host.remove(); return cv;
  };
  A.dlMol3DImage = async (viewerOrMol, opt = {}) => {
    const isV = viewerOrMol && viewerOrMol.snapshot, mol = isV ? viewerOrMol.mol : viewerOrMol;
    if (!mol || !mol.atoms.length) return A.toast('Rien à exporter.');
    const cv = isV ? viewerOrMol.snapshot(opt.w || 1600, opt.h || 1200, '#ffffff') : A.mol3DCanvas(mol, { w: opt.w || 1600, h: opt.h || 1200, style: opt.style });
    A.download((opt.name || A.molName(mol)) + '_3D.png', await A.canvasBlob(cv));
  };

  // =====================================================================
  // PDF
  // =====================================================================
  let pdfLoading = null;
  const loadScript = (src) => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Chargement impossible : ' + src)); document.head.appendChild(s); });
  A.loadPDF = () => pdfLoading || (pdfLoading = Promise.all([G.jspdf ? null : loadScript('js/vendor/jspdf.umd.min.js'), G.CSA_PDF_FONTS ? null : loadScript('js/vendor/pdf-fonts.js')]).catch((e) => { pdfLoading = null; throw e; }));

  const UI_COL = { '--panel': '#fff', '--panel2': '#f3f6fa', '--line': '#d9e0e8', '--ink': '#14202c', '--muted': '#5a6776', '--blue': '#0b5cab', '--orange': '#e8731c', '--canvas': '#fff', '--e-O': '#d61a1a', '--e-N': '#2747d6', '--green': '#1d8f4e', '--blue-s': '#e3eefa', '--line2': '#e8edf2' };
  A.svgForPrint = (svg) => svg.replace(/var\((--[a-zA-Z0-9-]+)\)/g, (_, v) => UI_COL[v] || '#333');
  async function resolvePlaceholders(root) {
    const set = (img, url, w, h) => { img.setAttribute('src', url); img.setAttribute('data-w', w); img.setAttribute('data-h', h); };
    for (const img of root.querySelectorAll('img[data-mol2d]')) {
      try {
        const o = JSON.parse(img.getAttribute('data-mol2d')); let m = null;
        if (o.lib) m = C.lib2D(o.lib); else if (o.id && G.Compose) m = G.Compose.build(G.Compose.byId[o.id]); else if (o.text && G.Compose) { const r = G.Compose.fromText(o.text); m = r.ok ? r.mol : null; }
        if (!m) { img.remove(); continue; }
        const s = A.structSVG(m, { display: o.display || 'semi', title: o.title }); const cv = await A.svgToCanvas(s.svg, s.w, s.h, 2.5);
        set(img, cv.toDataURL('image/png'), s.w * 1.3, s.h * 1.3);
      } catch (e) { console.warn(e); img.remove(); }
    }
    for (const img of root.querySelectorAll('img[data-mol3d]')) {
      try { const o = JSON.parse(img.getAttribute('data-mol3d')); const m = o.ref ? C.REF3D[o.ref]() : null; if (!m) { img.remove(); continue; } const cv = A.mol3DCanvas(m, { w: 720, h: 480 }); set(img, cv.toDataURL('image/jpeg', 0.9), 360, 240); }
      catch (e) { console.warn(e); img.remove(); }
    }
    for (const img of root.querySelectorAll('img[data-grid3d]')) {
      try {
        const refs = JSON.parse(img.getAttribute('data-grid3d')), per = Math.min(3, refs.length), rows = Math.ceil(refs.length / per), tw = 360, th = 300;
        const cv = document.createElement('canvas'); cv.width = tw * per; cv.height = th * rows; const x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, cv.width, cv.height);
        refs.forEach((r, k) => {
          const t = A.mol3DCanvas(C.REF3D[r](), { w: tw, h: th - 40 }); const cx = (k % per) * tw, cy = Math.floor(k / per) * th; x.drawImage(t, cx, cy);
          x.fillStyle = '#14202c'; x.font = '600 22px Arial, sans-serif'; x.textAlign = 'center'; x.fillText((C.REF3D_LIST.find((e) => e[0] === r) || [0, r])[1], cx + tw / 2, cy + th - 14);
        });
        set(img, cv.toDataURL('image/jpeg', 0.9), cv.width / 2, cv.height / 2);
      } catch (e) { console.warn(e); img.remove(); }
    }
    for (const img of root.querySelectorAll('img[data-svgfig]')) {
      try {
        const svg = A.svgForPrint(A.uiSVG(img.getAttribute('data-svgfig'))); const vb = (svg.match(/viewBox="([\d.\s-]+)"/) || [])[1]; const [, , w, h] = vb ? vb.split(/\s+/).map(Number) : [0, 0, 640, 360];
        const svg2 = svg.replace('<svg', `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"`).replace(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"\s+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/, 'xmlns="http://www.w3.org/2000/svg"');
        const cv = await A.svgToCanvas(svg2, w, h, 2); set(img, cv.toDataURL('image/png'), w, h);
      } catch (e) { console.warn(e); img.remove(); }
    }
  }

  const SUBM = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9', '₊': '+', '₋': '−', 'ₙ': 'n', 'ₘ': 'm', 'ₓ': 'x' };
  const SUPM = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁺': '+', '⁻': '−', 'ⁿ': 'n' };
  const FIX = { '⇌': '⇄', '⇄': '↔', ' ': ' ', ' ': ' ', '­': '', '﻿': '', '​': '' };

  A.makePDF = async (title, html, opt = {}) => {
    await A.loadPDF();
    const doc = new G.jspdf.jsPDF({ unit: 'pt', format: 'a4', compress: true });
    doc.addFileToVFS('SS-R.ttf', G.CSA_PDF_FONTS.R); doc.addFont('SS-R.ttf', 'SS', 'normal');
    doc.addFileToVFS('SS-B.ttf', G.CSA_PDF_FONTS.B); doc.addFont('SS-B.ttf', 'SS', 'bold');
    doc.setProperties({ title, subject: title, author: BRAND, creator: BRAND, keywords: 'chimie, ChemSketch, Avogadro' });
    const PW = 595.28, PH = 841.89, ML = 56, MR = 56, MT = 74, MB = 60, CW = PW - ML - MR;
    const root = new DOMParser().parseFromString('<div id="r">' + html + '</div>', 'text/html').getElementById('r');
    await resolvePlaceholders(root);
    let logo = null; try { const cv = await A.svgToCanvas(A.logo(36).replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"'), 36, 36, 4); logo = cv.toDataURL('image/png'); } catch (e) {}

    // ---- texte en ligne → segments stylés
    const hex = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
    const setF = (r) => { doc.setFont('SS', r.b ? 'bold' : 'normal'); doc.setFontSize(r.size * (r.v ? 0.7 : 1)); };
    const tw = (r, t) => { setF(r); return doc.getTextWidth(t); };
    function runsOf(node, st, out) {
      node.childNodes.forEach((n) => {
        if (n.nodeType === 3) {
          let t = n.nodeValue.replace(/[ \t\n\r\f]+/g, ' ').replace(/[  ­﻿​⇌⇄]/g, (c) => FIX[c]);
          let buf = '', mode = 0;
          const flush = () => { if (buf) out.push({ ...st, t: buf, v: mode || st.v }); buf = ''; };
          for (const ch of t) { const md = SUBM[ch] ? 1 : SUPM[ch] ? -1 : 0; if (md !== mode) { flush(); mode = md; } buf += md === 1 ? SUBM[ch] : md === -1 ? SUPM[ch] : ch; }
          flush(); return;
        }
        if (n.nodeType !== 1) return;
        const tg = n.tagName;
        if (tg === 'BR') { out.push({ br: true }); return; }
        if (tg === 'IMG' || tg === 'SVG' || tg === 'svg' || tg === 'SCRIPT' || tg === 'STYLE') return;
        const s2 = { ...st };
        if (tg === 'B' || tg === 'STRONG' || tg === 'TH') s2.b = true;
        if (tg === 'SUB') s2.v = 1; if (tg === 'SUP') s2.v = -1;
        if (tg === 'A') s2.c = '#0b5cab';
        if (tg === 'CODE') s2.c = '#08467f';
        runsOf(n, s2, out);
      });
      return out;
    }
    function wrap(runs, width) {
      const lines = []; let cur = [], w = 0;
      const push = () => { while (cur.length && /^ +$/.test(cur[cur.length - 1].t)) { w -= cur[cur.length - 1].w; cur.pop(); } lines.push({ segs: cur, w }); cur = []; w = 0; };
      const add = (r, t) => { const ww = tw(r, t), last = cur[cur.length - 1]; if (last && last.b === r.b && last.v === r.v && last.c === r.c && last.size === r.size) { last.t += t; last.w += ww; } else cur.push({ ...r, t, w: ww }); w += ww; };
      runs.forEach((r) => {
        if (r.br) { push(); return; }
        r.t.split(/( )/).forEach((tok) => {
          if (!tok) return;
          if (tok === ' ') { if (cur.length) add(r, ' '); return; }
          let ww = tw(r, tok);
          if (w + ww > width && cur.length) push();
          if (ww > width) { let part = ''; for (const ch of tok) { if (tw(r, part + ch) > width && part) { add(r, part); push(); part = ''; } part += ch; } tok = part; }
          add(r, tok);
        });
      });
      if (cur.length || !lines.length) push();
      return lines;
    }
    // ---- blocs → éléments de mise en page
    const items = [];
    const BASE = { size: 10.5, b: false, v: 0, c: '#14202c' };
    const para = (runs, x, width, o = {}) => {
      if (!runs.some((r) => r.br || (r.t && r.t.trim()))) return;
      const size = Math.max(...runs.filter((r) => r.size).map((r) => r.size)), lh = size * (o.lh || 1.42);
      if (o.before) items.push({ t: 'sp', h: o.before });
      const ls = wrap(runs, width);
      ls.forEach((ln, k) => items.push({ t: 'line', h: lh, x, ln, size, align: o.align, width, keep: k === 0 && o.keep ? o.keep : 0, bullet: k === 0 ? o.bullet : null }));
      if (o.rule) items.push({ t: 'rule', h: 6, x, w: width, col: o.rule });
      if (o.after) items.push({ t: 'sp', h: o.after });
    };
    const BLOCK = new Set(['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'UL', 'OL', 'LI', 'TABLE', 'FIGURE', 'IMG', 'HR', 'PRE', 'BLOCKQUOTE', 'SECTION', 'ARTICLE', 'FIGCAPTION', 'DL', 'DT', 'DD', 'HEADER', 'FOOTER', 'ASIDE']);
    const hasBlock = (n) => [...n.children].some((c) => BLOCK.has(c.tagName));
    function flow(node, x, width, st) {
      let inl = [];
      const flushInl = () => { if (inl.length) { const runs = []; inl.forEach((n) => { const tmp = document.createElement('span'); tmp.appendChild(n.cloneNode(true)); runsOf(tmp, st, runs); }); para(runs, x, width, { after: 5 }); inl = []; } };
      node.childNodes.forEach((n) => {
        if (n.nodeType === 3 || (n.nodeType === 1 && !BLOCK.has(n.tagName))) { inl.push(n); return; }
        if (n.nodeType !== 1) return;
        flushInl(); block(n, x, width, st);
      });
      flushInl();
    }
    function block(n, x, width, st) {
      const tg = n.tagName, cls = n.className || '';
      if (/\bpb\b/.test(cls)) { items.push({ t: 'page' }); return; }
      if (tg === 'H1') return para(runsOf(n, { ...st, size: 19, b: true, c: '#0b5cab' }, []), x, width, { before: items.length ? 10 : 0, after: 8, lh: 1.2, keep: 60 });
      if (tg === 'H2') return para(runsOf(n, { ...st, size: 14, b: true, c: '#14202c' }, []), x, width, { before: 12, after: 5, lh: 1.25, keep: 50, rule: '#cfe0f2' });
      if (tg === 'H3' || tg === 'H4') return para(runsOf(n, { ...st, size: 11.5, b: true, c: '#0b5cab' }, []), x, width, { before: 8, after: 3, lh: 1.3, keep: 36 });
      if (tg === 'HR') { items.push({ t: 'rule', h: 12, x, w: width, col: '#d9e0e8' }); return; }
      if (tg === 'IMG') return image(n, x, width);
      if (tg === 'FIGURE') { [...n.children].forEach((c) => { if (c.tagName === 'IMG') image(c, x, width); else if (c.tagName === 'FIGCAPTION') para(runsOf(c, { ...st, size: 9, c: '#5a6776' }, []), x, width, { align: 'center', after: 8 }); else block(c, x, width, st); }); return; }
      if (tg === 'UL' || tg === 'OL') {
        let k = 0; items.push({ t: 'sp', h: 1 });
        [...n.children].forEach((li) => { if (li.tagName !== 'LI') return; k++; const bl = tg === 'OL' ? k + '.' : '•';
          if (hasBlock(li)) { const start = items.length; flow(li, x + 16, width - 16, st); const f = items.slice(start).find((it) => it.t === 'line'); if (f) f.bullet = { t: bl, x }; }
          else para(runsOf(li, st, []), x + 16, width - 16, { after: 2.5, bullet: { t: bl, x: x + 3 } });
        });
        items.push({ t: 'sp', h: 4 }); return;
      }
      if (tg === 'TABLE') return table(n, x, width, st);
      if (tg === 'PRE') return para(runsOf(n, { ...st, size: 9, c: '#08467f' }, []), x, width, { after: 6 });
      if (/\b(note|sum|summary|example|objectives|recog)\b/.test(cls)) {
        const bg = /sum|summary/.test(cls) ? '#e2f4ea' : /example/.test(cls) ? '#fdeedf' : '#e3eefa';
        items.push({ t: 'box0', bg }); const pad = 10;
        if (hasBlock(n)) flow(n, x + pad, width - 2 * pad, st); else para(runsOf(n, st, []), x + pad, width - 2 * pad, {});
        items.push({ t: 'box1' }); items.push({ t: 'sp', h: 8 }); return;
      }
      if (tg === 'P' || tg === 'DT' || tg === 'DD' || tg === 'FIGCAPTION' || !hasBlock(n)) {
        const meta = /\bmeta\b/.test(cls);
        return para(runsOf(n, meta ? { ...st, size: 9.5, c: '#5a6776' } : (tg === 'DT' ? { ...st, b: true } : st), []), x + (tg === 'DD' ? 14 : 0), width - (tg === 'DD' ? 14 : 0), { after: meta ? 8 : 5.5 });
      }
      flow(n, x, width, st);
    }
    function image(img, x, width) {
      const src = img.getAttribute('src'); if (!src || !/^data:image\/(png|jpe?g)/.test(src)) return;
      const w0 = +img.getAttribute('data-w') || 300, h0 = +img.getAttribute('data-h') || 200;
      let w = w0 * 0.62, h = h0 * 0.62; const maxW = width, maxH = 330;
      if (w > maxW) { h *= maxW / w; w = maxW; } if (h > maxH) { w *= maxH / h; h = maxH; }
      items.push({ t: 'img', h: h + 8, w, ih: h, x: x + (width - w) / 2, src, fmt: /jpe?g/.test(src) ? 'JPEG' : 'PNG' });
    }
    function table(tb, x, width, st) {
      const rows = [...tb.rows]; if (!rows.length) return;
      const fs = 9.3, pad = 4, cst = { ...st, size: fs };
      const ncol = Math.max(...rows.map((r) => [...r.cells].reduce((s, c) => s + (c.colSpan || 1), 0)));
      const nat = new Array(ncol).fill(20), min = new Array(ncol).fill(20);
      const cells = rows.map((r) => { let ci = 0; return [...r.cells].map((c) => { const runs = runsOf(c, c.tagName === 'TH' ? { ...cst, b: true } : cst, []); const span = c.colSpan || 1;
        if (span === 1) { const full = runs.reduce((s, q) => s + (q.t ? tw(q, q.t) : 0), 0) + 2 * pad; const longest = Math.max(10, ...runs.flatMap((q) => (q.t || '').split(' ').map((w) => tw(q, w)))) + 2 * pad; nat[ci] = Math.max(nat[ci], Math.min(full, 260)); min[ci] = Math.max(min[ci], Math.min(longest, 140)); }
        const o = { runs, ci, span, th: c.tagName === 'TH' }; ci += span; return o; }); });
      let ws = nat.slice(); const tot = ws.reduce((s, v) => s + v, 0);
      if (tot > width) { const mt = min.reduce((s, v) => s + v, 0); ws = mt >= width ? min.map((v) => v * width / mt) : min.map((v, i) => v + (nat[i] - v) * (width - mt) / Math.max(1, tot - mt)); }
      else ws = ws.map((v) => v * width / tot);
      const xs = [x]; ws.forEach((v, i) => xs.push(xs[i] + v));
      let hdr = null;
      cells.forEach((cs, ri) => {
        const isH = cs.length && cs.every((c) => c.th);
        const lay = cs.map((c) => { const cw = xs[c.ci + c.span] - xs[c.ci]; const ls = wrap(c.runs.length ? c.runs : [{ ...cst, t: ' ' }], cw - 2 * pad); return { ...c, cw, ls }; });
        const h = Math.max(...lay.map((c) => c.ls.length * fs * 1.32)) + 2 * pad + 1;
        const it = { t: 'row', h, x, w: width, xs, lay, fs, pad, head: isH, hdr: isH ? null : hdr, first: ri === 0 };
        if (isH && ri === 0) hdr = it;
        items.push(it);
      });
      items.push({ t: 'sp', h: 10 });
    }
    flow(root, ML, CW, BASE);

    // ---- pagination et dessin
    let page = 1, y = MT;
    const drawHeader = () => {
      if (page === 1) {
        if (logo) doc.addImage(logo, 'PNG', ML, 26, 26, 26);
        doc.setFont('SS', 'bold'); doc.setFontSize(14); doc.setTextColor(11, 92, 171); doc.text(BRAND, ML + 34, 38);
        doc.setFont('SS', 'normal'); doc.setFontSize(8.5); doc.setTextColor(90, 103, 118); doc.text('Informatique appliquée à la chimie', ML + 34, 49);
        doc.text('Document généré le ' + new Date().toLocaleDateString('fr-FR'), PW - MR, 38, { align: 'right' });
        doc.setDrawColor(207, 224, 242); doc.setLineWidth(1); doc.line(ML, 60, PW - MR, 60);
      } else {
        doc.setFont('SS', 'bold'); doc.setFontSize(8.5); doc.setTextColor(11, 92, 171); doc.text(BRAND, ML, 36);
        doc.setFont('SS', 'normal'); doc.setTextColor(90, 103, 118); const t = title.length > 80 ? title.slice(0, 78) + '…' : title; doc.text(t, PW - MR, 36, { align: 'right' });
        doc.setDrawColor(225, 231, 238); doc.setLineWidth(0.6); doc.line(ML, 44, PW - MR, 44);
      }
    };
    const newPage = () => { doc.addPage(); page++; y = MT - 8; drawHeader(); };
    drawHeader();
    const drawLine = (it, y0) => {
      let x = it.x; if (it.align === 'center') x = it.x + (it.width - it.ln.w) / 2;
      const base = y0 + it.size * 1.02;
      if (it.bullet) { doc.setFont('SS', 'bold'); doc.setFontSize(it.size); doc.setTextColor(11, 92, 171); doc.text(it.bullet.t, it.bullet.x, base); }
      it.ln.segs.forEach((s) => { setF(s); doc.setTextColor(...hex(s.c || '#14202c')); doc.text(s.t, x, base + (s.v === 1 ? s.size * 0.24 : s.v === -1 ? -s.size * 0.36 : 0)); x += s.w; });
    };
    const drawRow = (it, y0) => {
      if (it.head) { doc.setFillColor(238, 243, 249); doc.rect(it.x, y0, it.w, it.h, 'F'); }
      doc.setDrawColor(217, 224, 232); doc.setLineWidth(0.6);
      it.lay.forEach((c) => {
        doc.rect(it.xs[c.ci], y0, c.cw, it.h);
        c.ls.forEach((ln, k) => drawLine({ x: it.xs[c.ci] + it.pad, ln, size: it.fs, width: c.cw }, y0 + it.pad + k * it.fs * 1.32 - 1));
      });
    };
    const fits = (h) => y + h <= PH - MB;
    let lastHdr = null;
    const place = (it) => {
      if (it.t === 'page') { if (y > MT + 10) newPage(); return; }
      if (it.t === 'sp') { if (y > MT) y += it.h; return; }
      if (!fits(it.h + (it.keep || 0)) && y > MT + 20) { newPage(); if (it.t === 'row' && it.hdr && !it.head) { drawRow(it.hdr, y); y += it.hdr.h; } }
      if (it.t === 'line') drawLine(it, y);
      else if (it.t === 'rule') { doc.setDrawColor(...hex(it.col)); doc.setLineWidth(1); doc.line(it.x, y + 1, it.x + it.w, y + 1); }
      else if (it.t === 'img') doc.addImage(it.src, it.fmt, it.x, y + 3, it.w, it.ih);
      else if (it.t === 'row') drawRow(it, y);
      y += it.h;
    };
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.t !== 'box0') { place(it); continue; }
      // bloc encadré : fond dessiné par page, sous le texte
      let j = i + 1; const inner = []; while (j < items.length && items[j].t !== 'box1') inner.push(items[j++]);
      i = j; const pad = 8; let k = 0;
      while (k < inner.length) {
        if (!fits(Math.min(inner[k].h, 40) + 2 * pad) && y > MT + 20) newPage();
        let h = 0, e = k; while (e < inner.length && y + pad + h + inner[e].h + pad <= PH - MB) { h += inner[e].h; e++; }
        if (e === k) { h = inner[k].h; e = k + 1; }
        doc.setFillColor(...hex(it.bg)); doc.roundedRect(ML, y, CW, h + 2 * pad, 5, 5, 'F');
        y += pad; for (let q = k; q < e; q++) { const s = inner[q]; if (s.t === 'line') drawLine(s, y); else if (s.t === 'img') doc.addImage(s.src, s.fmt, s.x, y + 3, s.w, s.ih); else if (s.t === 'row') drawRow(s, y); y += s.h; }
        y += pad; k = e; if (k < inner.length) newPage();
      }
    }
    // pied de page : crédit et numérotation
    const n = doc.getNumberOfPages();
    for (let p = 1; p <= n; p++) {
      doc.setPage(p); doc.setDrawColor(225, 231, 238); doc.setLineWidth(0.6); doc.line(ML, PH - 40, PW - MR, PH - 40);
      doc.setFont('SS', 'normal'); doc.setFontSize(8); doc.setTextColor(90, 103, 118);
      doc.text(BRAND + ' — ' + CREDIT, ML, PH - 27); doc.text('Page ' + p + ' / ' + n, PW - MR, PH - 27, { align: 'right' });
    }
    return doc.output('blob');
  };
  A.downloadPDF = async (filename, title, html) => {
    A.toast('Préparation du PDF…');
    try { const blob = await A.makePDF(title, html); await A.download(filename.replace(/\.pdf$/i, '') + '.pdf', blob); }
    catch (e) { console.error(e); A.toast('PDF impossible : ' + (e.message || e)); }
  };
})(window);
