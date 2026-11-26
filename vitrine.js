/* INFOCHIMIE UK : vitrine de l'accueil (diaporama animé, hommage, catalogue des enseignants du Département de Chimie)
   Les photos par défaut sont des fichiers du dossier img/ ; les photos remplacées par un administrateur sont réduites
   dans le navigateur puis enregistrées dans la base (paramètres de la plateforme). */
(function (G) {
  'use strict';
  const A = G.APP, esc = A.esc, I = A.icon;
  const clone = (o) => JSON.parse(JSON.stringify(o));

  const DEF = {
    slides: [
      { img: 'img/sory-bagayoko.jpg', name: 'Sory BAGAYOKO', role: 'Assistant — développement de la plateforme', pos: 'center 38%' },
      { img: 'img/alhouseny-cisse.jpg', name: 'M. Alhouseny CISSE', role: 'Chargé du NTIC de la Bibliothèque de l’Université de Kindia et du cours d’informatique', pos: 'center 30%' }
    ],
    hommage: {
      show: true, img: 'img/hommage-chef-departement.jpg', pos: 'center 30%',
      name: 'M. Thierno Diogo SOW', title: 'Chef du Département de Chimie',
      text: 'L’équipe d’INFOCHIMIE UK rend hommage à M. Thierno Diogo SOW, Chef du Département de Chimie de l’Université de Kindia, pour son engagement au service du département et de la formation des étudiants en chimie. Cette plateforme d’informatique appliquée à la chimie lui est respectueusement dédiée.'
    },
    catIntro: 'Les femmes et les hommes qui enseignent et encadrent les étudiants du Département de Chimie de l’Université de Kindia.',
    catalogue: [1, 2, 3, 4, 5, 6, 7].map((n) => ({ id: 'ens-' + n, img: 'img/enseignant-' + n + '.jpg', name: '', title: '', pos: 'center 22%' }))
  };
  A.VITRINE_DEF = DEF;
  A.vitrine = () => {
    const v = (A.DB && A.DB.vitrine) || {}, d = clone(DEF);
    return {
      slides: Array.isArray(v.slides) && v.slides.length ? v.slides : d.slides,
      hommage: Object.assign(d.hommage, v.hommage || {}),
      catIntro: typeof v.catIntro === 'string' ? v.catIntro : d.catIntro,
      catalogue: Array.isArray(v.catalogue) ? v.catalogue : d.catalogue
    };
  };
  const editable = () => { if (!A.DB.vitrine) A.DB.vitrine = clone(A.vitrine()); const v = A.DB.vitrine; const f = A.vitrine(); ['slides', 'hommage', 'catIntro', 'catalogue'].forEach((k) => { if (v[k] == null) v[k] = f[k]; }); return v; };

  // seules les images du dossier img/ et les images JPEG/PNG/WebP intégrées sont affichées
  const SAFE = /^(img\/[\w.-]+\.(jpe?g|png|webp)|data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+)$/;
  const src = (s) => (SAFE.test(String(s || '')) ? s : 'img/logo-universite-kindia.png');
  const posOf = (p) => (/^[a-z]+ \d{1,3}%$/.test(String(p || '')) ? p : 'center 25%');
  const POS = [['center 12%', 'Haut'], ['center 25%', 'Haut-centre'], ['center 40%', 'Centre'], ['center 60%', 'Bas-centre'], ['center 80%', 'Bas']];
  const DEPT = 'Département de Chimie';
  const label = (e, i) => e.name ? e.name : 'Enseignant du ' + DEPT + (i != null ? ' (photo ' + (i + 1) + ')' : '');

  // ---------- accueil : diaporama animé ----------
  const DUR = 6500;
  A.vitHero = () => {
    const s = A.vitrine().slides;
    return `<div class="show" id="hero-show" role="region" aria-roledescription="carrousel" aria-label="L’équipe d’INFOCHIMIE UK">
<div class="show-glow" aria-hidden="true"></div>
${s.map((x, i) => `<figure class="slide${i ? '' : ' on'}" data-i="${i}" aria-hidden="${i ? 'true' : 'false'}"><img src="${esc(src(x.img))}" alt="${esc(x.name)}" style="object-position:${esc(posOf(x.pos))}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async"><figcaption><b>${esc(x.name)}</b><span>${esc(x.role || '')}</span></figcaption></figure>`).join('')}
${s.length > 1 ? `<div class="show-ctl">${s.map((x, i) => `<button class="show-dot${i ? '' : ' on'}" data-i="${i}" aria-label="Photo ${i + 1} : ${esc(x.name)}"></button>`).join('')}<button class="show-pp" aria-label="Mettre le diaporama en pause" title="Pause">${I('pause', 16)}</button></div><div class="show-bar" aria-hidden="true"><span></span></div>` : ''}
</div>`;
  };
  A.vitMountHero = () => {
    const box = document.getElementById('hero-show'); if (!box) return;
    const slides = A.$$('.slide', box), dots = A.$$('.show-dot', box), bar = box.querySelector('.show-bar span'), pp = box.querySelector('.show-pp');
    if (slides.length < 2) return;
    let i = 0, t = 0, paused = false, hover = false, dead = false;
    const reduce = G.matchMedia && G.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const show = (n) => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => { s.classList.toggle('on', k === i); s.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
      dots.forEach((d, k) => d.classList.toggle('on', k === i));
      if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
      plan();
    };
    const plan = () => { clearTimeout(t); box.classList.toggle('paused', paused || hover); if (!paused && !hover && !dead) t = setTimeout(() => show(i + 1), DUR); };
    box.style.setProperty('--dur', DUR + 'ms');
    dots.forEach((d) => d.addEventListener('click', () => show(+d.dataset.i)));
    if (pp) pp.addEventListener('click', () => { paused = !paused; pp.innerHTML = I(paused ? 'play' : 'pause', 16); pp.setAttribute('aria-label', paused ? 'Relancer le diaporama' : 'Mettre le diaporama en pause'); pp.title = paused ? 'Lecture' : 'Pause'; plan(); });
    box.addEventListener('mouseenter', () => { hover = true; plan(); }); box.addEventListener('mouseleave', () => { hover = false; plan(); });
    box.addEventListener('focusin', () => { hover = true; plan(); }); box.addEventListener('focusout', () => { hover = false; plan(); });
    if (reduce) { paused = true; if (pp) { pp.innerHTML = I('play', 16); pp.setAttribute('aria-label', 'Relancer le diaporama'); } }
    plan();
    A.live.push({ destroy() { dead = true; clearTimeout(t); } });
  };

  // ---------- accueil : hommage ----------
  A.vitHommage = () => {
    const h = A.vitrine().hommage; if (!h.show) return '';
    return `<section class="band hommage" aria-labelledby="hm-t"><div class="band-in hm-in">
<figure class="hm-photo"><img src="${esc(src(h.img))}" alt="${esc(h.name)}" style="object-position:${esc(posOf(h.pos))}" loading="lazy" decoding="async"><figcaption>${esc(h.name)} · ${esc(h.title)}</figcaption></figure>
<div class="hm-txt"><span class="hm-kick">${I('award', 18)} Hommage</span><h2 id="hm-t">${esc(h.name)}</h2><p class="hm-role">${esc(h.title)}<br><span>Université de Kindia</span></p>
<blockquote>${esc(h.text).split(/\n+/).map((p) => `<p>${p}</p>`).join('')}</blockquote></div>
</div></section>`;
  };

  // ---------- catalogue des enseignants ----------
  const card = (e, i) => `<button class="tcard" data-act="vitZoom" data-i="${i}" aria-label="Agrandir : ${esc(label(e, i))}"><span class="tph"><img src="${esc(src(e.img))}" alt="" style="object-position:${esc(posOf(e.pos))}" loading="lazy" decoding="async"></span><span class="tcap">${e.name ? `<b>${esc(e.name)}</b>` : ''}<span>${esc(e.title || DEPT)}</span></span></button>`;
  A.vitCatalogueBand = () => {
    const v = A.vitrine(), list = v.catalogue; if (!list.length) return '';
    const max = 8;
    return `<section class="band alt" aria-labelledby="cat-t"><div class="band-in"><div class="row between" style="align-items:flex-end;margin-bottom:6px"><div><span class="hm-kick">${I('users', 18)} Catalogue</span><h2 id="cat-t" style="margin:6px 0 4px">Les enseignants du ${DEPT}</h2><p class="muted" style="max-width:70ch;margin:0">${esc(v.catIntro)}</p></div><a class="btn" href="#enseignants">${I('grid', 18)} Tout le catalogue</a></div>
<div class="tgrid">${list.slice(0, max).map(card).join('')}</div></div></section>`;
  };
  A.vitCampus = () => `<section class="band campus" aria-label="Campus de l’Université de Kindia"><div class="band-in"><div class="campus-grid">
<figure><img src="img/campus-batiment.jpg" alt="Bâtiment du campus de l’Université de Kindia" loading="lazy" decoding="async"></figure>
<figure><img src="img/campus-pole-vie.jpg" alt="Le « Pôle vie » du campus de l’Université de Kindia" loading="lazy" decoding="async"></figure>
<div class="campus-txt"><img src="img/logo-universite-kindia.png" alt="" width="72" height="72"><h2>Université de Kindia</h2><p>INFOCHIMIE UK est la plateforme d’informatique appliquée à la chimie du ${DEPT} : dessin des structures en 2D, modélisation en 3D, travaux pratiques et évaluations en ligne.</p></div>
</div></div></section>`;

  A.route(/^enseignants$/, () => {
    const v = A.vitrine();
    return {
      title: 'Enseignants du ' + DEPT, html: `<div class="${A.me() ? '' : 'band'}"><div class="band-in"><div class="pagehead"><span class="hm-kick">${I('users', 18)} Catalogue</span><h1 style="margin:6px 0">Les enseignants du ${DEPT}</h1><p class="muted" style="max-width:75ch">${esc(v.catIntro)}</p></div>
${v.catalogue.length ? `<div class="tgrid big">${v.catalogue.map(card).join('')}</div>` : '<div class="card empty">Le catalogue est vide pour le moment.</div>'}
${A.me() && A.me().role === 'admin' ? `<p style="margin-top:16px"><a class="btn" href="#vitrine">${I('pencil', 18)} Modifier le catalogue</a></p>` : ''}</div></div>`
    };
  }, { public: true });

  // agrandissement d'une photo du catalogue (flèches du clavier pour naviguer)
  A.act.vitZoom = (el) => {
    const list = A.vitrine().catalogue; let i = +el.dataset.i;
    const html = () => { const e = list[i]; return `<div class="zoom"><div class="row between" style="margin-bottom:10px"><span class="small muted">Photo ${i + 1} sur ${list.length}</span><button class="btn sm" data-act="closeModal">Fermer</button></div>
<figure style="margin:0"><img src="${esc(src(e.img))}" alt="${esc(label(e, i))}"><figcaption>${e.name ? `<b>${esc(e.name)}</b><br>` : ''}<span class="muted">${esc(e.title || DEPT)}</span></figcaption></figure>
${list.length > 1 ? `<div class="row between" style="margin-top:12px"><button class="btn" data-z="-1">${I('back', 18)} Précédente</button><button class="btn" data-z="1">Suivante ${I('arrow', 18)}</button></div>` : ''}</div>`; };
    const m = A.modal(html(), { wide: true });
    const box = m.querySelector('.modal');
    const go = (d) => { i = (i + d + list.length) % list.length; box.innerHTML = html(); const b = box.querySelector('[data-z="' + d + '"]'); if (b) b.focus(); };
    box.addEventListener('click', (e) => { const b = e.target.closest('[data-z]'); if (b) go(+b.dataset.z); });
    const key = (e) => { if (!document.getElementById('modal')) { document.removeEventListener('keydown', key); return; } if (e.key === 'ArrowRight') go(1); else if (e.key === 'ArrowLeft') go(-1); else if (e.key === 'Escape') A.closeModal(); };
    document.addEventListener('keydown', key);
  };

  // =========================================================== ADMINISTRATION DE LA VITRINE
  // réduction d'une photo dans le navigateur (JPEG) avant enregistrement
  const shrink = (file, max) => new Promise((ok, ko) => {
    if (!file || !/^image\/(jpeg|png|webp|gif|bmp)$/i.test(file.type)) return ko(new Error('Choisissez une image JPEG, PNG ou WebP.'));
    if (file.size > 15 * 1024 * 1024) return ko(new Error('Image trop lourde (15 Mo au maximum).'));
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      URL.revokeObjectURL(url);
      const k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)), w = Math.max(1, Math.round(im.naturalWidth * k)), h = Math.max(1, Math.round(im.naturalHeight * k));
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.drawImage(im, 0, 0, w, h);
      let q = 0.84, d = cv.toDataURL('image/jpeg', q); const cap = max > 700 ? 170000 : 110000; while (d.length > cap && q > 0.4) { q -= 0.08; d = cv.toDataURL('image/jpeg', q); }
      ok(d);
    };
    im.onerror = () => { URL.revokeObjectURL(url); ko(new Error('Image illisible.')); };
    im.src = url;
  });
  A.vitShrink = shrink;
  const LIMIT = 750000;
  const commit = (msg) => {
    const n = JSON.stringify(A.DB.vitrine).length;
    if (n > LIMIT) { A.toast('Trop de photos enregistrées dans la base : supprimez ou remplacez-en quelques-unes.'); return false; }
    A.log('Accueil modifié', msg); A.save(); A.toast('Enregistré'); return true;
  };

  const thumb = (e) => `<img class="vthumb" src="${esc(src(e.img))}" alt="" style="object-position:${esc(posOf(e.pos))}">`;
  const posSel = (id, cur) => `<select id="${id}" name="pos">${POS.map(([k, t]) => `<option value="${k}" ${posOf(cur) === k ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
  const photoField = (id) => `<div class="field"><label for="${id}">Photo</label><input id="${id}" name="photo" type="file" accept="image/jpeg,image/png,image/webp"><small>Laissez vide pour garder la photo actuelle. Elle est réduite automatiquement.</small></div>`;

  A.route(/^vitrine$/, () => {
    const v = A.vitrine(), h = v.hommage;
    const row = (kind, e, i, n, sub) => `<li class="vrow">${thumb(e)}<div class="vmeta"><b>${esc(e.name || label(e, i))}</b><span class="small muted">${esc(sub)}</span></div><div class="vbtn">
<button class="iconbtn" data-act="vitMove" data-k="${kind}" data-i="${i}" data-d="-1" aria-label="Monter" ${i ? '' : 'disabled'}>${I('up', 18)}</button><button class="iconbtn" data-act="vitMove" data-k="${kind}" data-i="${i}" data-d="1" aria-label="Descendre" ${i < n - 1 ? '' : 'disabled'}>${I('down', 18)}</button>
<button class="btn sm" data-act="vitEdit" data-k="${kind}" data-i="${i}">Modifier</button><button class="iconbtn" data-act="vitDel" data-k="${kind}" data-i="${i}" aria-label="Supprimer">${I('trash', 18)}</button></div></li>`;
    return {
      title: 'Accueil, hommage et catalogue', html: `<div class="pagehead"><h1>Accueil, hommage et catalogue</h1><p class="muted">Photos animées de la page d’accueil, hommage au Chef du ${DEPT} et catalogue des enseignants. Les modifications sont visibles immédiatement par tous les visiteurs.</p></div>
<div class="grid g2" style="align-items:start">
<div class="card"><div class="row between"><h3 style="margin:0">${I('image')} Diaporama d’accueil</h3><button class="btn sm" data-act="vitEdit" data-k="slides" data-i="-1">${I('plus', 16)} Ajouter</button></div><p class="small muted">Photos qui défilent avec une animation en haut de la page d’accueil, dans cet ordre.</p>
<ul class="vlist">${v.slides.map((e, i) => row('slides', e, i, v.slides.length, e.role || '')).join('')}</ul></div>
<form class="card" data-form="vitHommage"><h3 style="margin-top:0">${I('award')} Hommage</h3>
<div class="row" style="gap:14px;align-items:flex-start;flex-wrap:nowrap">${thumb(h)}<label class="check"><input type="checkbox" name="show" ${h.show ? 'checked' : ''}> Afficher l’hommage sur la page d’accueil</label></div>
<div class="field"><label for="hm-n">Nom</label><input id="hm-n" name="name" type="text" value="${esc(h.name)}" required></div>
<div class="field"><label for="hm-ti">Fonction</label><input id="hm-ti" name="title" type="text" value="${esc(h.title)}"></div>
<div class="field"><label for="hm-tx">Texte de l’hommage</label><textarea id="hm-tx" name="text" rows="6">${esc(h.text)}</textarea></div>
<div class="field"><label for="hm-p">Cadrage de la photo</label>${posSel('hm-p', h.pos)}</div>${photoField('hm-f')}
<button class="btn pri">Enregistrer l’hommage</button></form>
</div>
<div class="card" style="margin-top:16px"><div class="row between"><h3 style="margin:0">${I('users')} Catalogue des enseignants (${v.catalogue.length})</h3><div class="row"><a class="btn sm" href="#enseignants">${I('eye', 16)} Voir</a><button class="btn sm pri" data-act="vitEdit" data-k="catalogue" data-i="-1">${I('plus', 16)} Ajouter un enseignant</button></div></div>
<form data-form="vitIntro" class="row" style="margin:12px 0;align-items:flex-end"><div class="field" style="flex:1;min-width:240px;margin:0"><label for="ci">Texte de présentation</label><input id="ci" name="intro" type="text" value="${esc(v.catIntro)}"></div><button class="btn">Enregistrer</button></form>
<ul class="vlist cols">${v.catalogue.map((e, i) => row('catalogue', e, i, v.catalogue.length, e.title || 'Nom et fonction à compléter')).join('') || '<li class="empty">Aucune photo.</li>'}</ul></div>
<div class="card" style="margin-top:16px"><h3 style="margin-top:0">Rétablir</h3><p class="small muted">Revenir aux photos et aux textes d’origine (diaporama, hommage et catalogue).</p><button class="btn" data-act="vitReset">Rétablir la vitrine d’origine</button></div>`
    };
  }, { admin: true });

  A.act.vitEdit = (el) => {
    const k = el.dataset.k, i = +el.dataset.i, v = A.vitrine(), e = i >= 0 ? v[k][i] : { name: '', title: '', role: '', pos: k === 'slides' ? 'center 30%' : 'center 22%' };
    const sl = k === 'slides';
    A.modal(`<h3>${i < 0 ? 'Ajouter' : 'Modifier'} ${sl ? 'une photo du diaporama' : 'un enseignant'}</h3>
<form data-form="vitItem" data-k="${k}" data-i="${i}">${i >= 0 ? `<div style="margin-bottom:10px">${thumb(e)}</div>` : ''}
<div class="field"><label for="vi-n">${sl ? 'Nom affiché' : 'Nom et prénom'}</label><input id="vi-n" name="name" type="text" value="${esc(e.name || '')}" ${sl ? 'required' : 'placeholder="Exemple : Dr Mamadou DIALLO"'}></div>
<div class="field"><label for="vi-t">${sl ? 'Fonction affichée' : 'Fonction ou spécialité'}</label><input id="vi-t" name="title" type="text" value="${esc((sl ? e.role : e.title) || '')}" placeholder="${sl ? 'Exemple : Assistant' : 'Exemple : Maître de conférences, chimie organique'}"></div>
<div class="field"><label for="vi-p">Cadrage de la photo</label>${posSel('vi-p', e.pos)}</div>${photoField('vi-f')}
<div id="vi-err" aria-live="polite"></div><div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-act="closeModal">Annuler</button><button class="btn pri">${i < 0 ? 'Ajouter' : 'Enregistrer'}</button></div></form>`);
  };
  A.form.vitItem = async (f, d) => {
    const k = f.dataset.k, i = +f.dataset.i, err = (m) => { f.querySelector('#vi-err').innerHTML = `<div class="alert bad">${esc(m)}</div>`; };
    const file = d.get('photo'), sl = k === 'slides';
    const name = String(d.get('name') || '').trim(), title = String(d.get('title') || '').trim(), pos = posOf(String(d.get('pos')));
    if (sl && !name) return err('Indiquez le nom affiché.');
    if (i < 0 && !(file && file.size)) return err('Choisissez une photo.');
    let img = null;
    if (file && file.size) { try { img = await shrink(file, sl ? 820 : 520); } catch (e) { return err(e.message); } }
    const V = editable(), list = V[k];
    if (i < 0) { const o = sl ? { img, name, role: title, pos } : { id: A.uid('ens-'), img, name, title, pos }; list.push(o); }
    else { const o = list[i]; if (!o) return; o.name = name; if (sl) o.role = title; else o.title = title; o.pos = pos; if (img) o.img = img; }
    if (commit((sl ? 'diaporama : ' : 'catalogue : ') + (name || 'photo'))) { A.closeModal(); A.render(); }
  };
  A.act.vitMove = (el) => { const V = editable(), list = V[el.dataset.k], i = +el.dataset.i, j = i + +el.dataset.d; if (j < 0 || j >= list.length) return; [list[i], list[j]] = [list[j], list[i]]; commit('ordre modifié'); A.render(); };
  A.act.vitDel = (el) => {
    const k = el.dataset.k, i = +el.dataset.i, V = editable(), e = V[k][i]; if (!e) return;
    if (k === 'slides' && V.slides.length <= 1) { A.toast('Le diaporama doit garder au moins une photo.'); return; }
    A.confirm('Retirer « ' + esc(e.name || label(e, i)) + ' » ' + (k === 'slides' ? 'du diaporama' : 'du catalogue') + ' ?', () => { V[k].splice(i, 1); commit('photo retirée'); A.render(); }, 'Retirer');
  };
  A.form.vitHommage = async (f, d) => {
    const V = editable(), h = V.hommage, file = d.get('photo');
    const name = String(d.get('name') || '').trim(); if (!name) { A.toast('Indiquez le nom.'); return; }
    if (file && file.size) { try { h.img = await shrink(file, 820); } catch (e) { A.toast(e.message); return; } }
    Object.assign(h, { show: d.get('show') === 'on', name, title: String(d.get('title') || '').trim(), text: String(d.get('text') || '').trim(), pos: posOf(String(d.get('pos'))) });
    commit('hommage'); A.render();
  };
  A.form.vitIntro = (f, d) => { const V = editable(); V.catIntro = String(d.get('intro') || '').trim(); commit('présentation du catalogue'); A.render(); };
  A.act.vitReset = () => A.confirm('Rétablir les photos et les textes d’origine de l’accueil ? Les photos ajoutées seront retirées.', () => { delete A.DB.vitrine; A.DB.vitrine = clone(DEF); commit('vitrine rétablie'); A.render(); }, 'Rétablir', false);
})(window);
