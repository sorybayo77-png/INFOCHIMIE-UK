/* views.js — pages publiques et espace étudiant */
(function (G) {
  'use strict';
  const A = G.APP, C = G.Chem, K = G.CONTENT, esc = A.esc, I = A.icon;
  const ELS = ['C', 'H', 'N', 'O', 'S', 'P', 'F', 'Cl', 'Br', 'I'];
  const nLessons = () => K.modules.reduce((s, m) => s + m.lessons.length, 0);
  const nQuestions = () => K.modules.reduce((s, m) => s + m.quiz.length, 0) + A.DB.questions.length;
  const head = (title, sub, right) => `<div class="pagehead"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div>${right ? `<div class="row">${right}</div>` : ''}</div>`;
  A.head = head;
  const bar = (p, cls) => `<div class="bar ${cls || ''}" role="progressbar" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100"><i style="width:${Math.max(0, Math.min(100, p))}%"></i></div>`;
  A.bar = bar;
  const ring = (p, col) => `<div class="ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="none" stroke="var(--line2)" stroke-width="12"/><circle cx="60" cy="60" r="50" fill="none" stroke="${col || 'var(--green)'}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${(p / 100 * 314.16).toFixed(1)} 314.16" transform="rotate(-90 60 60)"/></svg><b>${p}%</b></div>`;
  A.ring = ring;
  const fileOK = /\.(sk2|mol|sdf|xyz|cjson|cml|pdb|mol2|png|jpe?g|pdf|txt)$/i;

  // ---------- schémas d'interface (dessins pédagogiques) ----------
  const badge = (x, y, n) => `<circle cx="${x}" cy="${y}" r="11" fill="var(--orange)"/><text x="${x}" y="${y + 4.5}" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">${n}</text>`;
  A.uiSVG = (id) => {
    const T = (x, y, t, o = '') => `<text x="${x}" y="${y}" font-size="12.5" fill="var(--ink)" ${o}>${t}</text>`;
    if (id === 'chemsketch') {
      const atoms = ['H', 'C', 'N', 'O', 'P', 'S', 'F', 'Cl', 'Br', 'I', '…'];
      return `<svg class="ui-svg" viewBox="0 0 760 430" role="img" aria-label="Schéma de l’écran de ChemSketch">
<rect x="10" y="10" width="740" height="410" rx="10" fill="var(--panel)" stroke="var(--line)"/>
${T(26, 34, 'File    Edit    Pages    Tools    Templates    Documents    Options    Help')}
<rect x="22" y="44" width="78" height="22" rx="4" fill="var(--blue)"/>${T(36, 59, 'Structure', 'fill="#fff" font-weight="600"')}<rect x="104" y="44" width="56" height="22" rx="4" fill="var(--panel2)" stroke="var(--line)"/>${T(118, 59, 'Draw')}
${[...Array(16)].map((_, k) => `<rect x="${176 + k * 30}" y="44" width="24" height="22" rx="4" fill="var(--panel2)" stroke="var(--line)"/>`).join('')}
<rect x="20" y="78" width="34" height="300" rx="5" fill="var(--panel2)" stroke="var(--line)"/>
${atoms.map((a, k) => `<text x="37" y="${100 + k * 26}" text-anchor="middle" font-size="13" font-weight="700" fill="${a === 'O' ? 'var(--e-O)' : a === 'N' ? 'var(--e-N)' : 'var(--ink)'}">${a}</text>`).join('')}
<rect x="706" y="78" width="34" height="300" rx="5" fill="var(--panel2)" stroke="var(--line)"/>
${[3, 4, 5, 6, 6, 7].map((n, k) => { const cx = 723, cy = 102 + k * 44, r = 12; return `<polygon points="${[...Array(n)].map((_, j) => (cx + r * Math.cos(-Math.PI / 2 + j * 2 * Math.PI / n)).toFixed(1) + ',' + (cy + r * Math.sin(-Math.PI / 2 + j * 2 * Math.PI / n)).toFixed(1)).join(' ')}" fill="none" stroke="var(--ink)" stroke-width="1.4"/>`; }).join('')}
<rect x="64" y="78" width="632" height="300" fill="var(--canvas)" stroke="var(--line)"/>
<path d="M300 250 L345 225 L390 250" fill="none" stroke="var(--ink)" stroke-width="2"/>${T(262, 256, 'H₃C', 'font-size="17" font-weight="600"')}${T(396, 256, 'OH', 'font-size="17" font-weight="600" fill="var(--e-O)"')}
<rect x="20" y="388" width="720" height="24" rx="4" fill="var(--panel2)"/>${T(30, 405, 'Barre d’état : formule, masse, coordonnées…', 'fill="var(--muted)"')}
${badge(560, 34, 1)}${badge(170, 55, 2)}${badge(37, 393 - 12, 3)}${badge(723, 381 - 12, 4)}${badge(660, 98, 5)}${badge(720, 400, 6)}
</svg><ol class="small" style="margin:10px 16px 4px;columns:2 220px"><li>Barre de menus</li><li>Onglets Structure / Draw et barre d’outils générale</li><li>Barre des atomes</li><li>Barre des radicaux et des cycles</li><li>Zone de dessin</li><li>Barre d’état</li></ol>`;
    }
    const balls = [[0, 0, 20, '#8f8f8f'], [-46, -30, 13, '#e8ebef'], [48, -26, 13, '#e8ebef'], [4, 48, 13, '#e8ebef'], [-10, -8, 13, '#e8ebef']];
    return `<svg class="ui-svg" viewBox="0 0 760 430" role="img" aria-label="Schéma de l’écran d’Avogadro">
<rect x="10" y="10" width="740" height="410" rx="10" fill="var(--panel)" stroke="var(--line)"/>
${T(26, 34, 'File    Edit    View    Build    Select    Extensions    Help')}
${['Navigation', 'Dessin', 'Modèle', 'Sélection', 'Manipulation', 'Mesure'].map((t, k) => `<rect x="${24 + k * 92}" y="44" width="86" height="24" rx="5" fill="${k === 1 ? 'var(--blue)' : 'var(--panel2)'}" stroke="var(--line)"/>${T(67 + k * 92, 60, t, `text-anchor="middle" ${k === 1 ? 'fill="#fff" font-weight="600"' : ''}`)}`).join('')}
<rect x="20" y="80" width="210" height="140" rx="6" fill="var(--panel2)" stroke="var(--line)"/>${T(32, 100, 'Réglages de l’outil', 'font-weight="700"')}${T(32, 126, 'Élément : Carbone (6)')}${T(32, 150, 'Ordre de liaison : simple')}<rect x="32" y="162" width="13" height="13" rx="2" fill="var(--blue)"/>${T(52, 173, 'Ajuster les hydrogènes')}
<rect x="20" y="230" width="210" height="150" rx="6" fill="var(--panel2)" stroke="var(--line)"/>${T(32, 250, 'Types d’affichage', 'font-weight="700"')}
${['Boules et bâtons', 'Bâtons (licorice)', 'Sphères de van der Waals', 'Fil de fer', 'Étiquettes'].map((t, k) => `<rect x="32" y="${262 + k * 22}" width="13" height="13" rx="2" fill="${k === 0 ? 'var(--blue)' : 'none'}" stroke="var(--muted)"/>${T(52, 273 + k * 22, t)}`).join('')}
<rect x="240" y="80" width="498" height="300" rx="6" fill="#16202b"/>
<g transform="translate(490 230)">${balls.slice(1).map((b) => `<line x1="0" y1="0" x2="${b[0]}" y2="${b[1]}" stroke="#9aa3ad" stroke-width="7"/>`).join('')}${balls.map((b) => `<circle cx="${b[0]}" cy="${b[1]}" r="${b[2]}" fill="${b[3]}"/>`).join('')}</g>
<text x="250" y="370" font-size="12" fill="#c9d3dd">Vue 3D : clic gauche = rotation · clic droit = déplacement · molette = zoom</text>
<rect x="20" y="388" width="720" height="24" rx="4" fill="var(--panel2)"/>${T(30, 405, 'Barre d’état et résultats de mesure', 'fill="var(--muted)"')}
${badge(470, 33, 1)}${badge(570, 56, 2)}${badge(222, 88, 3)}${badge(222, 238, 4)}${badge(728, 92, 5)}${badge(720, 400, 6)}
</svg><ol class="small" style="margin:10px 16px 4px;columns:2 220px"><li>Barre de menus</li><li>Barre d’outils (Navigation, Dessin, Mesure…)</li><li>Réglages de l’outil actif</li><li>Types d’affichage</li><li>Vue 3D</li><li>Barre d’état</li></ol>`;
  };

  // ---------- figures des leçons ----------
  A.figHTML = (f) => {
    if (!f) return '';
    const cap = f.caption ? `<figcaption>${esc(f.caption)}</figcaption>` : '';
    if (f.type === 'ed2d') {
      const d = f.display || 'semi';
      return `<figure class="fig"><div class="figbar"><div class="seg" role="group" aria-label="Affichage">${[['semi', 'Semi-développée'], ['dev', 'Développée'], ['topo', 'Topologique']].map(([k, t]) => `<button data-d="${k}" class="${k === d ? 'on' : ''}">${t}</button>`).join('')}</div><button class="btn sm ghost" data-d="undo">${I('undo', 16)} Annuler</button><button class="btn sm ghost" data-d="reset">Réinitialiser</button><button class="btn sm ghost" data-png="1">${I('down', 16)} Image</button></div>
      <div class="ed-host short" data-ed2d="${esc(JSON.stringify({ lib: f.lib, display: d }))}"></div><div class="figinfo"></div>${cap}</figure>`;
    }
    if (f.type === 'v3d') {
      const o = { mol: f.mol, noWheel: true };
      let tb = '';
      if (f.build) { o.mode = 'ajouter'; o.el = 'O'; tb = `<div class="figbar"><div class="seg">${[['naviguer', 'Inspecter'], ['ajouter', 'Ajouter']].map(([k, t]) => `<button data-m="${k}" class="${k === 'ajouter' ? 'on' : ''}">${t}</button>`).join('')}</div><div class="seg els">${['C', 'N', 'O', 'Cl'].map((e) => `<button data-e="${e}" class="e-${e}${e === 'O' ? ' on' : ''}">${e}</button>`).join('')}</div><button class="btn sm ghost" data-r="1">Réinitialiser</button></div>`; }
      if (f.measure) { o.mode = 'mesurer'; tb = `<div class="figbar"><div class="seg">${[['naviguer', 'Inspecter'], ['mesurer', 'Mesurer']].map(([k, t]) => `<button data-m="${k}" class="${k === 'mesurer' ? 'on' : ''}">${t}</button>`).join('')}</div></div>`; }
      tb = tb ? tb.replace(/<\/div>$/, `<button class="btn sm ghost" data-png="1">${I('down', 16)} Image</button></div>`) : `<div class="figbar"><button class="btn sm ghost" data-png="1">${I('down', 16)} Image</button></div>`;
      return `<figure class="fig">${tb}<div class="v3d-host short" data-v3d="${esc(JSON.stringify(o))}"></div><div class="figinfo"></div>${cap}</figure>`;
    }
    if (f.type === 'v3d-row' || f.type === 'v3d-grid') {
      return `<figure class="fig"><div class="figgrid">${f.mols.map((m) => `<div style="position:relative"><div class="v3d-host mini" data-v3d="${esc(JSON.stringify({ mol: m, noWheel: true }))}"></div><span class="v3d-title">${esc((C.REF3D_LIST.find((r) => r[0] === m) || [])[1] || m)}</span><div class="figinfo"></div></div>`).join('')}</div>${cap}</figure>`;
    }
    if (f.type === 'ui') return `<figure class="fig">${A.uiSVG(f.id)}${cap}</figure>`;
    return '';
  };

  // =========================================================== PAGES PUBLIQUES
  A.route(/^accueil$/, () => {
    const u = A.me();
    const mods = K.modules.map((m) => `<a class="card mod" href="#${u ? 'module-' + m.id : 'connexion'}"><span class="code">Module ${m.id}</span><h3>${esc(m.title)}</h3><p>${esc(m.desc)}</p><div class="foot"><span>${m.lessons.length} leçon${m.lessons.length > 1 ? 's' : ''}${m.quiz.length ? ' · test de ' + m.quiz.length + ' questions' : ' · 8 TP'}</span></div></a>`).join('');
    const adm = A.admins().filter((a) => a.active !== false && !/^administrateur/i.test(a.name));
    return {
      title: 'Accueil', html: `
<section class="hero hero-home"><div class="hero-deco" aria-hidden="true"><span></span><span></span><span></span></div><div class="hero-in">
<div class="hero-txt">
<span class="badge hero-badge"><img src="${A.asset('img/logo-universite-kindia.png')}" alt="" width="22" height="22"> Université de Kindia · Département de Chimie</span>
<h1 style="margin-top:14px">INFOCHIMIE UK</h1>
<p class="lead"><b>Cours : ChemSketch et Avogadro, dessiner les structures 2D et 3D.</b> Apprenez à dessiner les molécules, à les construire en trois dimensions et à comprendre leur géométrie : cours illustrés, ateliers interactifs, recherche de n’importe quel composé, travaux pratiques avec dépôt et évaluations corrigées.</p>
<div class="row">${u ? '<a class="btn pri" href="#tableau">Accéder à mon espace</a>' : '<a class="btn pri" href="#inscription">Créer un compte étudiant</a><a class="btn" href="#connexion">Se connecter</a>'}</div>
<div class="hero-stats"><div><b>${K.modules.length}</b><span>modules</span></div><div><b>${nLessons()}</b><span>leçons</span></div><div><b>${K.tps.length}</b><span>travaux pratiques</span></div><div><b>${nQuestions()}</b><span>questions d’évaluation</span></div></div>
<p class="hero-credit">Développée par <b>M. Alhouseny CISSE</b> et son assistant <b>Sory BAGAYOKO</b></p>
</div>
${A.vitHero()}
</div></section>
${A.vitHommage()}
<section class="band"><div class="band-in"><h2>Un parcours en sept modules</h2><p class="muted" style="max-width:70ch">Des notions de base à la modélisation 3D, chaque module associe une leçon, des démonstrations interactives et un test corrigé.</p><div class="path">${mods}</div></div></section>
${A.vitCatalogueBand()}
<section class="band"><div class="band-in demo3d">
<div><span class="hm-kick">${I('cube', 18)} Essayez maintenant</span><h2 style="margin:6px 0 10px">Une molécule en 3D, comme dans Avogadro</h2><p class="muted">Faites tourner le modèle, changez de molécule et observez la géométrie : angles, longueurs de liaison, doublets. Dans les ateliers, recherchez n’importe quel composé par son nom, sa formule ou son SMILES, puis dessinez-le ou visualisez-le en 3D.</p>
<div class="grid g2" style="margin-top:14px">
<div class="feat"><span class="ic">${I('hex', 22)}</span><div><h3 style="margin-top:0">Atelier 2D</h3><p>Atomes de tout le tableau périodique, charges, liaisons et cycles comme dans ChemSketch. Formule brute, masse molaire, SMILES et reconnaissance calculés en direct.</p></div></div>
<div class="feat"><span class="ic">${I('cube', 22)}</span><div><h3 style="margin-top:0">Atelier 3D</h3><p>Construisez, faites tourner et mesurez : distances, angles, notation VSEPR, optimisation de la géométrie animée.</p></div></div>
</div></div>
<div class="hero-model"><div class="v3d-host" id="hero-v"></div>
<div class="seg" id="hero-seg">${[['aspirine', 'Aspirine'], ['ethanol', 'Éthanol'], ['methane', 'Méthane'], ['eau', 'Eau']].map(([k, t], i) => `<button data-k="${k}" class="${i ? '' : 'on'}">${t}</button>`).join('')}</div>
<div class="cap"><span id="hero-name"></span><span>Glissez pour faire tourner le modèle</span></div></div>
</div></section>
<section class="band alt"><div class="band-in"><h2>Trois espaces, un même parcours</h2><div class="grid g3 spaces">
<div class="card"><h3>${I('user')} Espace étudiant</h3><ul><li>Connexion avec le matricule et un mot de passe personnel</li><li>Cours, vidéos, ateliers 2D et 3D, exercices corrigés</li><li>Dépôt des TP, notes, corrections et progression</li></ul></div>
<div class="card"><h3>${I('book')} Espace enseignant</h3><ul><li>Chapitres, documents PDF et vidéos</li><li>Questionnaires et exercices</li><li>Correction des travaux, suivi individuel et collectif</li></ul></div>
<div class="card"><h3>${I('shield')} Espace administrateur</h3><ul><li>Connexion par code identifiant personnel</li><li>Contrôle de l’évolution de chaque étudiant et notes d’évolution</li><li>Comptes administrateurs créés par l’administrateur principal</li></ul></div>
</div></div></section>
<section class="band"><div class="band-in grid g2">
<div class="feat"><span class="ic">${I('search', 22)}</span><div><h3 style="margin-top:0">Recherche de composés</h3><p>Plus de 130 composés intégrés utilisables sans Internet, et la recherche en ligne dans PubChem (plus de 100 millions de composés) par nom français ou anglais, formule, SMILES ou numéro CID.</p></div></div>
<div class="feat"><span class="ic">${I('flask', 22)}</span><div><h3 style="margin-top:0">Travaux pratiques</h3><p>Huit fiches guidées, de la molécule d’eau au mini-projet, avec dépôt des fichiers .sk2, .mol, .xyz ou images et correction notée.</p></div></div>
<div class="feat"><span class="ic">${I('clip', 22)}</span><div><h3 style="margin-top:0">Évaluations</h3><p>Tests de module et examen final corrigés automatiquement, avec explications, historique des tentatives et notes d’évolution attribuées par l’administration.</p></div></div>
<div class="feat"><span class="ic">${I('down', 22)}</span><div><h3 style="margin-top:0">PDF et images</h3><p>Chaque leçon, module, fiche de TP et guide se télécharge en PDF. Les composés s’exportent en image (PNG, SVG) et en .mol ou .xyz pour les vrais logiciels.</p></div></div>
</div></section>
${A.vitCampus()}
${adm.length ? `<section class="band alt"><div class="band-in"><h2>Administration de la plateforme</h2><p class="muted" style="max-width:70ch">Les administrateurs gèrent les comptes, contrôlent l’évolution de chaque étudiant et attribuent les notes d’évolution.</p>
<div class="grid g3">${adm.map((a) => `<div class="card row" style="flex-wrap:nowrap;gap:14px"><span class="avatar" style="width:52px;height:52px;font-size:18px">${esc(A.initials(a.name))}</span><div><h3 style="margin:0;font-size:18px">${esc(a.name)}</h3><span class="muted small">${esc(A.adminTitle(a))}</span></div></div>`).join('')}</div></div></section>` : ''}
<footer class="footer"><div class="band-in" style="max-width:1240px;margin:0 auto">INFOCHIMIE UK — Université de Kindia, Département de Chimie. ChemSketch est un logiciel d’ACD/Labs ; Avogadro est un projet libre ; les données en ligne des composés proviennent de PubChem (NCBI). Cette plateforme n’est affiliée à aucun de ces éditeurs.</div></footer>`,
      mount() {
        A.vitMountHero();
        const host = document.getElementById('hero-v'); const name = document.getElementById('hero-name');
        const v = new G.Viewer3D(host, { spin: true, noWheel: true, label: 'Modèle moléculaire en rotation' }); A.live.push(v);
        const load = (k) => { const m = C.REF3D[k] ? C.REF3D[k]() : C.build3D(C.lib2D(k)); v.setMolecule(m); name.innerHTML = esc(C.LIB2D[k] ? C.LIB2D[k].n : k) + ' — ' + C.formulaHTML(C.counts(m, false)); };
        load('aspirine');
        document.getElementById('hero-seg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; A.$$('#hero-seg button').forEach((x) => x.classList.toggle('on', x === b)); load(b.dataset.k); });
      }
    };
  }, { public: true, bare: true });
  A.route(/^$/, () => { setTimeout(() => location.replace('#' + (A.me() ? 'tableau' : 'accueil')), 0); return { html: '' }; }, { public: true });

  // ---------- connexion étudiant / enseignant ----------
  const demoBtn = (u, sub) => `<button class="btn" data-act="demoLogin" data-id="${u.id}">${I(u.role === 'admin' ? 'shield' : u.role === 'enseignant' ? 'book' : 'user')} <span>${esc(u.name)}<small>${esc(sub)}</small></span></button>`;
  A.route(/^connexion$/, () => {
    const tab = A.loginTab === 'enseignant' ? 'enseignant' : 'etudiant', etu = tab === 'etudiant';
    const dStu = A.DB.users.find((u) => u.id === 'u-etu' && u.demo), dEns = A.DB.users.find((u) => u.id === 'u-ens' && u.demo);
    return {
      title: 'Connexion', html: `<div class="auth"><div class="card formcard" style="width:100%">
<h1 style="font-size:28px">Connexion</h1><p class="muted">Accédez à vos cours, travaux pratiques et résultats.</p>
<div class="seg" role="tablist" aria-label="Type de compte" style="margin-bottom:16px;width:100%">${[['etudiant', 'Étudiant'], ['enseignant', 'Enseignant']].map(([k, t]) => `<button role="tab" aria-selected="${k === tab}" data-act="loginTab" data-t="${k}" class="${k === tab ? 'on' : ''}" style="flex:1">${t}</button>`).join('')}</div>
<form data-form="login" data-kind="${tab}" novalidate>
<div class="field"><label for="lg-i">${etu ? 'Matricule' : 'Adresse e-mail'}</label><input id="lg-i" name="idf" type="${etu ? 'text' : 'email'}" ${etu ? 'inputmode="numeric" placeholder="Exemple : 20200104962"' : 'placeholder="prenom.nom@universite.edu"'} autocomplete="username" required></div>
<div class="field"><label for="lg-p">Mot de passe</label><input id="lg-p" name="pw" type="password" autocomplete="current-password" required></div>
<div id="lg-err" aria-live="polite"></div><button class="btn pri" style="width:100%">Se connecter</button></form>
<p class="small" style="margin-top:12px"><a href="#mot-de-passe">Mot de passe oublié ?</a>${etu ? ' · <a href="#inscription">Créer un compte étudiant</a>' : ''}</p>
${(etu ? dStu : dEns) ? `<hr><h4>Compte de démonstration</h4><div class="demo-acc">${etu ? demoBtn(dStu, 'Matricule ' + dStu.matricule) : demoBtn(dEns, dEns.email)}</div><p class="muted small" style="margin-top:8px">Mot de passe des comptes de démonstration : <b>${esc(A.DEMO_PW)}</b></p>` : ''}
<hr><p class="small" style="margin:0">Vous êtes administrateur ? <a href="#connexion-admin">Accéder à l’espace administrateur</a></p></div></div>`
    };
  }, { public: true, guest: true });
  A.act.loginTab = (el) => { A.loginTab = el.dataset.t; A.render(); };

  // ---------- fenêtre de connexion réservée aux administrateurs ----------
  A.route(/^connexion-admin$/, () => {
    return {
      title: 'Espace administrateur', html: `<div class="auth admin-auth"><div class="card formcard admin-card" style="width:100%">
<div class="admin-badge">${I('shield', 26)}</div><h1 style="font-size:28px">Espace administrateur</h1>
<p class="muted">Accès réservé aux administrateurs de la plateforme. Connectez-vous avec votre <b>code identifiant personnel</b>.</p>
<form data-form="login" data-kind="admin" novalidate>
<div class="field"><label for="la-i">Code identifiant</label><input id="la-i" name="idf" type="text" autocomplete="username" placeholder="Exemple : BAGLAM-002" style="text-transform:uppercase" required></div>
<div class="field"><label for="la-p">Mot de passe</label><input id="la-p" name="pw" type="password" autocomplete="current-password" required></div>
<div id="lg-err" aria-live="polite"></div><button class="btn pri" style="width:100%">${I('shield', 18)} Entrer dans l’espace administrateur</button></form>
<p class="small muted" style="margin-top:12px">Après 5 tentatives incorrectes, l’accès est bloqué pendant une minute.</p>
<p class="small muted">Les codes identifiants (BAGLAM-…) sont attribués par l’administrateur principal.</p>
<p class="small" style="margin-top:12px"><a href="#connexion">Retour à la connexion étudiants et enseignants</a></p></div></div>`
    };
  }, { public: true, guest: true });

  const afterLogin = (u) => { const t = A.after; A.after = null; A.go(t && !/^(connexion|connexion-admin|inscription|mot-de-passe|accueil)$/.test(t) ? t : (u.role === 'admin' ? 'controle' : 'tableau')); };
  A.act.demoLogin = (el) => { const u = A.DB.users.find((x) => x.id === el.dataset.id && x.demo && x.role !== 'admin'); if (!u) { A.toast('Compte introuvable.'); return; } if (u.active === false) { A.toast('Ce compte est désactivé.'); return; } A.login(u); afterLogin(u); };
  const fails = {};
  A.form.login = async (f, d) => {
    const kind = f.dataset.kind, idf = String(d.get('idf') || '').trim(), pw = String(d.get('pw') || ''), err = (m) => { f.querySelector('#lg-err').innerHTML = `<div class="alert bad">${m}</div>`; };
    const key = kind + ':' + idf.toLowerCase(), fl = fails[key] || { n: 0, until: 0 };
    if (fl.until > Date.now()) return err('Trop de tentatives. Réessayez dans ' + Math.ceil((fl.until - Date.now()) / 1000) + ' secondes.');
    if (!idf || !pw) return err('Renseignez votre ' + (kind === 'etudiant' ? 'matricule' : kind === 'admin' ? 'code identifiant' : 'adresse e-mail') + ' et votre mot de passe.');
    await A.lookupUser(kind, idf);
    let u = A.findUser(kind, idf);
    // compte principal absent ou masqué par un ancien compte du même code : il est rétabli avant la vérification
    if (kind === 'admin' && idf.toUpperCase() === A.PRINCIPAL_CODE && (!u || u.id !== 'u-principal')) { await A.ensurePrincipalCloud(); u = A.findUser(kind, idf); }
    if (!u || !A.checkPw(u, pw)) {
      fl.n++; if (fl.n >= 5) { fl.until = Date.now() + 60000; fl.n = 0; } fails[key] = fl;
      if (kind === 'admin') A.DB.logs.unshift({ date: Date.now(), uid: u ? u.id : null, act: 'Échec de connexion administrateur', det: idf.toUpperCase() });
      A.save();
      return err((kind === 'etudiant' ? 'Matricule' : kind === 'admin' ? 'Code identifiant' : 'E-mail') + ' ou mot de passe incorrect.');
    }
    if (u.active === false) return err('Ce compte a été désactivé par l’administration.');
    delete fails[key]; A.login(u); afterLogin(u);
  };

  // ---------- inscription des étudiants ----------
  const FILIERES = ['Licence 1 Sciences et technologies', 'Licence 2 Chimie', 'Licence 3 Chimie', 'Licence 3 Chimie analytique', 'Licence 3 Chimie organique', 'Master Chimie', 'Autre formation'];
  A.FILIERES = FILIERES;
  A.route(/^inscription$/, () => ({
    title: 'Inscription', html: `<div class="auth"><div class="card formcard" style="width:100%;max-width:520px">
<h1 style="font-size:28px">Créer un compte étudiant</h1><p class="muted">Votre matricule sera votre code d’accès. Les comptes enseignants et administrateurs sont créés par l’administration.</p>
<form data-form="register" novalidate>
<div class="field"><label for="rg-n">Nom et prénom</label><input id="rg-n" name="name" type="text" autocomplete="name" required></div>
<div class="field"><label for="rg-m">Matricule</label><input id="rg-m" name="matricule" type="text" inputmode="numeric" placeholder="Exemple : 20200104962" required><small>Il servira de code d’accès à la plateforme.</small></div>
<div class="field"><label for="rg-f">Filière</label><select id="rg-f" name="filiere">${FILIERES.map((f) => `<option>${esc(f)}</option>`).join('')}</select></div>
<div class="field"><label for="rg-e">Adresse e-mail <small>(facultatif)</small></label><input id="rg-e" name="email" type="email" autocomplete="email"></div>
<div class="field"><label for="rg-p">Mot de passe</label><input id="rg-p" name="pw" type="password" autocomplete="new-password" required><small>${esc(A.PW_HINT)}</small></div>
<div class="field"><label for="rg-c">Confirmer le mot de passe</label><input id="rg-c" name="pw2" type="password" autocomplete="new-password" required></div>
<label class="check"><input type="checkbox" name="ok" required> J’accepte que ma progression et mes résultats soient suivis par mes enseignants et par l’administration.</label>
<div id="rg-err" aria-live="polite"></div><button class="btn pri" style="width:100%;margin-top:10px">Créer mon compte</button></form>
<p class="small" style="margin-top:12px">Déjà inscrit ? <a href="#connexion">Se connecter</a></p></div></div>`
  }), { public: true, guest: true });
  A.form.register = async (f, d) => {
    const name = String(d.get('name')).trim(), mat = String(d.get('matricule')).trim(), email = String(d.get('email') || '').trim().toLowerCase(), pw = String(d.get('pw')), pw2 = String(d.get('pw2'));
    const err = (m) => { f.querySelector('#rg-err').innerHTML = `<div class="alert bad">${m}</div>`; };
    if (name.length < 3) return err('Indiquez votre nom et votre prénom.');
    if (!A.MATRICULE_RE.test(mat)) return err('Matricule invalide : 6 à 20 chiffres ou lettres, sans espace (exemple : 20200104962).');
    if (A.MATRICULE_RE.test(mat)) await A.lookupUser('etudiant', mat);
    if (A.findUser('etudiant', mat)) return err('Un compte existe déjà avec ce matricule. Contactez l’administration en cas de problème.');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err('Adresse e-mail invalide.');
    const pe = A.pwPolicy(pw); if (pe) return err(pe);
    if (pw !== pw2) return err('Les deux mots de passe ne correspondent pas.');
    if (!d.get('ok')) return err('Veuillez cocher la case d’acceptation.');
    const id = A.uid('u-');
    const u = { id, name, role: 'etudiant', matricule: mat, email, filiere: String(d.get('filiere')), pw: A.hashPw(id, pw), active: true, created: Date.now() };
    A.DB.users.push(u); A.notify(u.id, 'Bienvenue ' + name.split(' ')[0] + ' ! Commencez par le module 1.', 'module-1');
    A.DB.session = u.id; A.log('Inscription', name + ' (' + mat + ')'); A.save(); A.go('tableau');
  };

  // ---------- mot de passe oublié ----------
  A.route(/^mot-de-passe$/, () => {
    const st = A.resetState || {};
    const body = !A.DB.demo
      ? `<p>Pour des raisons de sécurité, la plateforme n’envoie pas de code par e-mail. Adressez-vous à l’administration : un administrateur génère pour vous un <b>mot de passe provisoire</b> depuis la gestion des utilisateurs, que vous changerez ensuite dans votre profil.</p>`
      : !st.uid ? `<p class="muted">Saisissez votre identifiant : matricule, adresse e-mail ou code administrateur.</p><form data-form="reset1" novalidate><div class="field"><label for="rs-e">Identifiant</label><input id="rs-e" name="idf" type="text" required></div><div id="rs-err"></div><button class="btn pri" style="width:100%">Recevoir un code</button></form>`
        : `<div class="alert info">Mode démonstration : le code de vérification est <b>${st.code}</b>. En service réel, la réinitialisation passe par l’administration.</div>
<form data-form="reset2" novalidate><div class="field"><label for="rs-c">Code reçu</label><input id="rs-c" name="code" type="text" inputmode="numeric" required></div>
<div class="field"><label for="rs-p">Nouveau mot de passe</label><input id="rs-p" name="pw" type="password" required><small>${esc(A.PW_HINT)}</small></div><div id="rs-err"></div><button class="btn pri" style="width:100%">Enregistrer</button></form>`;
    return { title: 'Mot de passe oublié', html: `<div class="auth"><div class="card formcard" style="width:100%"><h1 style="font-size:28px">Mot de passe oublié</h1>${body}<p class="small" style="margin-top:12px"><a href="#connexion">Retour à la connexion</a></p></div></div>` };
  }, { public: true, guest: true });
  A.form.reset1 = async (f, d) => {
    await A.lookupUser(null, d.get('idf'));
    const u = A.findAny(d.get('idf'));
    if (!u) { f.querySelector('#rs-err').innerHTML = '<div class="alert bad">Aucun compte avec cet identifiant.</div>'; return; }
    A.resetState = { uid: u.id, code: String(100000 + Math.floor(Math.random() * 900000)) }; A.render();
  };
  A.form.reset2 = (f, d) => {
    const st = A.resetState, pw = String(d.get('pw')), e = (m) => { f.querySelector('#rs-err').innerHTML = `<div class="alert bad">${m}</div>`; };
    if (String(d.get('code')).trim() !== st.code) return e('Code incorrect.');
    const pe = A.pwPolicy(pw); if (pe) return e(pe);
    const u = A.user(st.uid); u.pw = A.hashPw(u.id, pw); u.pwDefault = false; A.resetState = null;
    A.DB.logs.unshift({ date: Date.now(), uid: u.id, act: 'Réinitialisation du mot de passe', det: '' }); A.save(); A.toast('Mot de passe modifié. Vous pouvez vous connecter.'); A.go(u.role === 'admin' ? 'connexion-admin' : 'connexion');
  };

  // =========================================================== TABLEAU DE BORD
  A.route(/^tableau$/, () => { const u = A.me(); if (u.role === 'enseignant') return A.views.dashTeacher(); if (u.role === 'admin') return A.views.dashAdmin(); return dashStudent(u); });
  function nextLesson(uid) { for (const m of K.modules) { if (A.DB.modState[m.id] === false) continue; for (const l of A.lessonsOf(m.id)) if (!A.done(uid, l.id)) return l; } return null; }
  function dashStudent(u) {
    const tot = A.totalProgress(u.id), nx = nextLesson(u.id), avg = A.avgModules(u.id), subs = A.subsOf(u.id);
    const corr = subs.filter((s) => s.status === 'corrige'), tpsDone = new Set(subs.map((s) => s.tp)).size;
    const last = A.DB.attempts.filter((a) => a.uid === u.id).sort((a, b) => b.date - a.date).slice(0, 5);
    const notifs = A.DB.notifs.filter((n) => n.uid === u.id).slice(0, 4);
    return {
      title: 'Tableau de bord', html: head('Bonjour ' + esc(u.name.split(' ')[0]), esc(u.filiere || 'Étudiant') + ' · matricule ' + esc(u.matricule || '—')) + `
<div class="grid g3">
<div class="card row" style="gap:18px;flex-wrap:nowrap">${ring(tot)}<div><h3 style="margin:0 0 6px">Progression</h3><p class="muted small" style="margin:0 0 10px">Leçons terminées sur l’ensemble du parcours.</p>${nx ? `<a class="btn sm pri" href="#lecon-${nx.id}">${I('play', 16)} Continuer</a>` : '<span class="badge green">Parcours terminé</span>'}</div></div>
<div class="card kpi"><span>Moyenne aux tests de module</span><b>${avg == null ? '—' : C.fr(avg * 20, 1) + '/20'}</b><span>${K.modules.filter((m) => A.best(u.id, 'module', m.id)).length} test(s) passé(s) sur ${K.modules.filter((m) => m.quiz.length).length}</span><a class="small" href="#evaluations">Voir les évaluations</a></div>
${A.lastEval(u.id) ? `<div class="card kpi"><span>Note d’évolution (administration)</span><b>${C.fr(A.lastEval(u.id).global, 1)}/20</b><span>le ${A.fmtDate(A.lastEval(u.id).date)}</span><a class="small" href="#resultats">Voir l’appréciation</a></div>` : ''}
<div class="card kpi"><span>Travaux pratiques</span><b>${tpsDone}/${K.tps.length}</b><span>${corr.length} corrigé(s) · ${subs.filter((s) => s.status === 'rendu').length} en attente</span><a class="small" href="#tp">Voir les TP</a></div>
</div>
${nx ? `<div class="card" style="margin-top:16px"><div class="row between"><div><span class="badge blue">Prochaine leçon · Module ${nx.mod}</span><h3 style="margin:8px 0 2px">${esc(nx.title)}</h3><span class="muted small">${nx.dur || 15} min</span></div><a class="btn pri" href="#lecon-${nx.id}">Ouvrir la leçon ${I('arrow', 16)}</a></div></div>` : ''}
<div class="grid g2" style="margin-top:16px">
<div class="card"><h3>Mes modules</h3><div class="hbars">${K.modules.filter((m) => A.DB.modState[m.id] !== false).map((m) => { const p = A.modProgress(u.id, m.id); return `<a class="hbar" href="#module-${m.id}" style="text-decoration:none;color:inherit"><span>M${m.id} · ${esc(m.short)}</span>${bar(p.p)}<b>${p.p}%</b></a>`; }).join('')}</div></div>
<div class="card"><h3>Derniers résultats</h3>${last.length ? `<table class="tbl stack"><thead><tr><th>Évaluation</th><th>Date</th><th class="num">Note</th></tr></thead><tbody>${last.map((a) => `<tr><td>${esc(A.attemptLabel(a))}</td><td>${A.fmtDate(a.date)}</td><td class="num"><b>${A.fmtNote(a.score, a.max)}</b></td></tr>`).join('')}</tbody></table><a class="small" href="#resultats">Tous mes résultats</a>` : '<p class="empty">Aucun test passé pour l’instant.</p>'}</div>
<div class="card"><h3>Notifications</h3>${notifs.length ? notifs.map((n) => `<a class="notif ${n.read ? '' : 'unread'}" href="#${esc(n.link || 'tableau')}" data-act="openNotif" data-id="${n.id}" style="display:block;text-decoration:none;color:inherit">${esc(n.text)}<small>${A.fmtDate(n.date, true)}</small></a>`).join('') : '<p class="empty">Rien de nouveau.</p>'}</div>
<div class="card"><h3>S’entraîner</h3><div class="list"><a class="li" href="#atelier-2d"><span class="num-pill">${I('hex', 18)}</span><span class="grow"><span class="t">Atelier 2D</span><br><span class="s">Dessiner comme dans ChemSketch</span></span></a><a class="li" href="#atelier-3d"><span class="num-pill">${I('cube', 18)}</span><span class="grow"><span class="t">Atelier 3D</span><br><span class="s">Construire et mesurer comme dans Avogadro</span></span></a><a class="li" href="#exercices"><span class="num-pill">${I('pencil', 18)}</span><span class="grow"><span class="t">Exercices corrigés automatiquement</span><br><span class="s">${Object.keys(A.DB.draws[u.id] || {}).length}/${K.draw.length} dessins réussis</span></span></a></div></div>
</div>`
    };
  }
  A.attemptLabel = (a) => a.kind === 'module' ? 'Test du module ' + a.ref + (A.mod(a.ref) ? ' — ' + A.mod(a.ref).short : '') : a.kind === 'exam' ? 'Examen final' : a.kind === 'reco' ? 'Reconnaissance de molécules 3D' : 'Exercice';

  // =========================================================== COURS
  A.route(/^cours$/, () => {
    const u = A.me(), stu = u.role === 'etudiant';
    const cards = K.modules.filter((m) => A.modVisible(m.id)).map((m) => {
      const ls = A.lessonsOf(m.id), p = A.modProgress(u.id, m.id), dur = ls.reduce((s, l) => s + (l.dur || 15), 0);
      return `<a class="card mod" href="#module-${m.id}"><span class="code">Module ${m.id}${A.DB.modState[m.id] === false ? ' · <span class="badge orange">non publié</span>' : ''}</span><h3>${esc(m.title)}</h3><p>${esc(m.desc)}</p>
<div class="foot"><span>${ls.length} leçon(s) · ${dur} min${m.quiz.length ? ' · test de ' + A.quizOf(m.id).length + ' questions' : ''}</span>${stu ? bar(p.p) + `<span>${p.d}/${p.n} leçon(s) terminée(s)</span>` : ''}</div></a>`;
    }).join('');
    return { title: 'Cours', html: head('Cours et modules', 'Sept modules progressifs : commencez par le module 1 et suivez l’ordre proposé.', `<button class="btn" data-act="dlCourse">${I('down', 18)} Tout le cours en PDF</button>`) + `<div class="path">${cards}</div>` };
  });

  A.route(/^module-(\d+)$/, (m) => {
    const mod = A.mod(m[1]); const u = A.me(); if (!mod || !A.modVisible(mod.id)) return { title: 'Module', html: '<div class="card empty"><h2>Module indisponible</h2><p>Ce module n’est pas encore publié.</p><a class="btn" href="#cours">Retour aux cours</a></div>' };
    const ls = A.lessonsOf(mod.id, A.can('cours.gerer')), p = A.modProgress(u.id, mod.id), q = A.quizOf(mod.id), best = A.best(u.id, 'module', mod.id);
    const tps = K.tps.filter((t) => t.mod === mod.id), vids = A.DB.videos.filter((v) => v.mod === mod.id), docs = A.DB.docs.filter((d) => d.mod === mod.id);
    return {
      title: 'Module ' + mod.id, html: `<div class="crumbs"><a href="#cours">Cours</a> › Module ${mod.id}</div>` + head(esc(mod.title), esc(mod.desc), `<button class="btn" data-act="dlModule" data-id="${mod.id}">${I('down', 18)} Module en PDF</button>`) + `
<div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,340px);align-items:start" id="mod-grid">
<div class="card"><div class="row between"><h3 style="margin:0">Leçons</h3><span class="muted small">${p.d}/${p.n} terminée(s)</span></div>${bar(p.p)}<div class="list" style="margin-top:14px">
${ls.map((l, i) => `<a class="li" href="#lecon-${l.id}"><span class="num-pill ${A.done(u.id, l.id) ? 'done' : ''}">${A.done(u.id, l.id) ? I('check', 16) : i + 1}</span><span class="grow"><span class="t">${esc(l.title)}</span><br><span class="s">${l.dur || 15} min${l.custom ? ' · ajouté par l’enseignant' : ''}${l.custom && !l.published ? ' · <span class="badge orange">brouillon</span>' : ''}</span></span>${I('arrow', 18)}</a>`).join('')}</div></div>
<div class="grid">
${q.length ? `<div class="card"><h3>Test du module</h3><p class="muted small">${q.length} questions · corrigé immédiatement · tentatives illimitées, la meilleure note est retenue.</p>${best ? `<p>Meilleure note : <b>${A.fmtNote(best.score, best.max)}</b></p>` : ''}<a class="btn pri" href="#quiz-${mod.id}">${best ? 'Repasser le test' : 'Passer le test'}</a></div>` : ''}
${tps.length ? `<div class="card"><h3>Travaux pratiques</h3><div class="list">${tps.map((t) => `<a class="li" href="#tp-${t.id}"><span class="num-pill">${t.id}</span><span class="grow"><span class="t">${esc(t.title)}</span></span></a>`).join('')}</div></div>` : ''}
${vids.length ? `<div class="card"><h3>Vidéos</h3><div class="list">${vids.map((v) => `<a class="li" href="${esc(v.url)}" target="_blank" rel="noopener">${I('play', 18)}<span class="grow t">${esc(v.title)}</span></a>`).join('')}</div></div>` : ''}
${docs.length ? `<div class="card"><h3>Documents</h3><div class="list">${docs.map((d) => `<button class="li btn" style="justify-content:flex-start" data-act="dlDoc" data-id="${d.id}">${I('down', 18)}<span class="grow t" style="text-align:left">${esc(d.title)}</span></button>`).join('')}</div></div>` : ''}
</div></div><style>@media(max-width:900px){#mod-grid{grid-template-columns:minmax(0,1fr)!important}}</style>`
    };
  });

  const paras = (t) => esc(t).split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
  A.lessonBody = (l) => l.custom ? paras(l.body || '') : l.body;
  A.route(/^lecon-(.+)$/, (m) => {
    const l = A.findLesson(m[1]); const u = A.me();
    if (!l || !A.modVisible(l.mod) || (l.custom && !l.published && !A.can('cours.gerer'))) return { title: 'Leçon', html: '<div class="card empty"><h2>Leçon introuvable</h2><a class="btn" href="#cours">Retour aux cours</a></div>' };
    const mod = A.mod(l.mod), ls = A.lessonsOf(l.mod, A.can('cours.gerer')), i = ls.findIndex((x) => x.id === l.id), prev = ls[i - 1], next = ls[i + 1], done = A.done(u.id, l.id);
    return {
      title: l.title, html: `<div class="lesson-wrap"><article class="lesson">
<div class="crumbs"><a href="#cours">Cours</a> › <a href="#module-${mod.id}">Module ${mod.id}</a> › Leçon ${i + 1}</div>
<h1>${esc(l.title)}</h1><div class="row small muted" style="margin-bottom:6px"><span>${I('clock', 16)} ${l.dur || 15} min</span><span>·</span><span>${esc(mod.short)}</span>${done ? '<span class="badge green">Terminée</span>' : ''}</div>
${l.obj && l.obj.length ? `<div class="objectives"><b>Objectifs pédagogiques</b><ul>${l.obj.map((o) => `<li>${esc(o)}</li>`).join('')}</ul></div>` : ''}
${l.intro ? `<p class="lead">${esc(l.intro)}</p>` : ''}
${A.lessonBody(l)}
${A.figHTML(l.fig)}
${l.videoUrl ? `<p><a class="btn" href="${esc(l.videoUrl)}" target="_blank" rel="noopener">${I('play', 18)} Regarder la vidéo explicative</a></p>` : ''}
${l.ex ? `<div class="example"><b>Exemple pratique.</b> ${l.ex}</div>` : ''}
${l.sum && l.sum.length ? `<div class="summary"><h3>Résumé</h3><ul>${l.sum.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>` : ''}
<div class="row between" style="margin-top:24px;border-top:1px solid var(--line);padding-top:18px">
${prev ? `<a class="btn" href="#lecon-${prev.id}">${I('back', 18)} Précédente</a>` : `<a class="btn" href="#module-${mod.id}">${I('back', 18)} Module</a>`}
<div class="row"><button class="btn ghost" data-act="dlLesson" data-id="${l.id}">${I('down', 18)} PDF</button>
${done ? '' : `<button class="btn ok" data-act="markDone" data-id="${l.id}">${I('check', 18)} Marquer comme terminée</button>`}
${next ? `<button class="btn pri" data-act="nextLesson" data-id="${l.id}" data-next="${next.id}">Suivante ${I('arrow', 18)}</button>` : (A.quizOf(mod.id).length ? `<button class="btn pri" data-act="nextLesson" data-id="${l.id}" data-next="quiz-${mod.id}">Passer le test ${I('arrow', 18)}</button>` : '')}</div></div>
</article><aside class="toc" aria-label="Leçons du module"><div class="muted small" style="margin:0 10px 6px;font-weight:600">Module ${mod.id} · ${esc(mod.short)}</div>
${ls.map((x, k) => `<a href="#lecon-${x.id}" class="${x.id === l.id ? 'on' : ''}"><span class="ck">${A.done(u.id, x.id) ? I('check', 16) : ''}</span><span>${k + 1}. ${esc(x.title)}</span></a>`).join('')}
${A.quizOf(mod.id).length ? `<a href="#quiz-${mod.id}"><span class="ck">${A.best(u.id, 'module', mod.id) ? I('check', 16) : ''}</span><span>Test du module</span></a>` : ''}</aside></div>`
    };
  });
  const mark = (lid) => { const u = A.me(); A.DB.progress[u.id] = A.DB.progress[u.id] || {}; if (!A.DB.progress[u.id][lid]) { A.DB.progress[u.id][lid] = Date.now(); A.save(); } };
  A.act.markDone = (el) => { mark(el.dataset.id); A.toast('Leçon marquée comme terminée'); A.render(); };
  A.act.nextLesson = (el) => { mark(el.dataset.id); const n = el.dataset.next; A.go(n.startsWith('quiz-') ? n : 'lecon-' + n); };
  // ---------- documents PDF des cours (illustrations des composés en image) ----------
  const J = (o) => esc(JSON.stringify(o));
  const figPDF = (f) => {
    if (!f) return ''; const cap = f.caption ? `<figcaption>${esc(f.caption)}</figcaption>` : '';
    if (f.type === 'ed2d') return `<figure><img data-mol2d="${J({ lib: f.lib, display: f.display || 'semi' })}">${cap}</figure>`;
    if (f.type === 'v3d') return `<figure><img data-mol3d="${J({ ref: f.mol })}">${cap}</figure>`;
    if (f.type === 'v3d-row' || f.type === 'v3d-grid') return `<figure><img data-grid3d="${J(f.mols)}">${cap}</figure>`;
    if (f.type === 'ui') return `<figure><img data-svgfig="${esc(f.id)}">${cap}</figure>`;
    return '';
  };
  const lessonPDF = (l, mod, inMod) => (inMod ? `<h2>${esc(l.title)}</h2>` : `<p class="meta">Module ${mod.id} — ${esc(mod.title)} · ${l.dur || 15} min</p><h1>${esc(l.title)}</h1>`) +
    (l.obj && l.obj.length ? `<div class="note"><b>Objectifs pédagogiques</b><ul>${l.obj.map((o) => `<li>${esc(o)}</li>`).join('')}</ul></div>` : '') + (l.intro ? `<p><b>${esc(l.intro)}</b></p>` : '') +
    A.lessonBody(l) + figPDF(l.fig) + (l.videoUrl ? `<p>Vidéo explicative : <a>${esc(l.videoUrl)}</a></p>` : '') + (l.ex ? `<div class="example"><b>Exemple pratique.</b> ${l.ex}</div>` : '') +
    (l.sum && l.sum.length ? `<div class="sum"><b>Résumé</b><ul>${l.sum.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>` : '');
  const modulePDF = (mod) => `<h1>Module ${mod.id} — ${esc(mod.title)}</h1><p class="meta">${esc(mod.desc)}</p>` + A.lessonsOf(mod.id).map((l) => lessonPDF(l, mod, true)).join('');
  A.act.dlLesson = (el) => { const l = A.findLesson(el.dataset.id); const mod = A.mod(l.mod); A.downloadPDF(A.slug('Lecon_' + l.id + '_' + l.title), l.title, lessonPDF(l, mod)); };
  A.act.dlCourse = () => {
    const mods = K.modules.filter((m) => A.modVisible(m.id));
    const body = `<h1>ChemSketch et Avogadro : dessiner les structures 2D et 3D</h1><p class="meta">Cours complet · ${mods.length} modules · ${mods.reduce((s, m) => s + A.lessonsOf(m.id).length, 0)} leçons</p><h2>Sommaire</h2><ol>${mods.map((m) => `<li><b>Module ${m.id} — ${esc(m.title)}</b> : ${A.lessonsOf(m.id).map((l) => esc(l.title)).join(' · ')}</li>`).join('')}</ol>` +
      mods.map((m) => '<div class="pb"></div>' + modulePDF(m)).join('');
    A.downloadPDF('Cours_complet_INFOCHIMIE_UK', 'Cours complet — ChemSketch et Avogadro', body);
  };
  const lessonDocHTML = (l, mod) => `<p class="meta">Module ${mod.id} — ${esc(mod.title)} · ${l.dur || 15} min</p><h1>${esc(l.title)}</h1>${l.obj && l.obj.length ? `<div class="note"><b>Objectifs</b><ul>${l.obj.map((o) => `<li>${esc(o)}</li>`).join('')}</ul></div>` : ''}${l.intro ? `<p><b>${esc(l.intro)}</b></p>` : ''}${A.lessonBody(l)}${l.fig && l.fig.type === 'ui' ? A.uiSVG(l.fig.id).replace(/var\(--[a-z0-9-]+\)/g, (v) => ({ 'var(--panel)': '#fff', 'var(--panel2)': '#f3f6fa', 'var(--line)': '#d9e0e8', 'var(--ink)': '#14202c', 'var(--muted)': '#5a6776', 'var(--blue)': '#0b5cab', 'var(--orange)': '#e8731c', 'var(--canvas)': '#fff', 'var(--e-O)': '#d61a1a', 'var(--e-N)': '#2747d6' }[v] || '#333')) : ''}${l.ex ? `<p><b>Exemple pratique.</b> ${l.ex}</p>` : ''}${l.sum && l.sum.length ? `<div class="sum"><b>Résumé</b><ul>${l.sum.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>` : ''}`;
  A.act.dlModule = (el) => { const mod = A.mod(el.dataset.id); A.downloadPDF(A.slug('Module_' + mod.id + '_' + mod.short), 'Module ' + mod.id + ' — ' + mod.title, modulePDF(mod)); };

  // =========================================================== TESTS (QCM)
  A.qHTML = (q, i, name, res) => {
    const r = res && res[i];
    const verdict = r ? `<div class="verdict ${r.ok ? 'ok' : 'ko'}">${r.ok ? 'Bonne réponse' : 'Réponse incorrecte'}</div>` : '';
    const body = q.t === 'court'
      ? `<input type="text" name="${name}${i}" aria-label="Votre réponse" ${r ? `value="${esc(r.given)}" disabled` : ''} autocomplete="off">${r && !r.ok ? `<div class="expl">Réponse attendue : <b>${esc(q.acc[0].toUpperCase())}</b></div>` : ''}`
      : q.o.map((o, k) => `<label class="opt ${r ? (k === q.a ? 'good' : (k === r.given ? 'badc' : '')) : ''}"><input type="radio" name="${name}${i}" value="${k}" ${r ? 'disabled' : ''} ${r && r.given === k ? 'checked' : ''}><span>${esc(o)}</span></label>`).join('');
    return `<div class="q"><div class="qt"><span class="qn">${i + 1}.</span>${esc(q.q)}</div>${body}${r ? verdict + (q.e ? `<div class="expl">${esc(q.e)}</div>` : '') : ''}</div>`;
  };
  A.grade = (qs, f, name) => qs.map((q, i) => {
    const v = f.querySelector(q.t === 'court' ? `[name="${name}${i}"]` : `[name="${name}${i}"]:checked`);
    if (q.t === 'court') { const g = v ? v.value : ''; return { given: g, ok: !!g && q.acc.map(A.normAns).includes(A.normAns(g)) }; }
    const g = v ? +v.value : -1; return { given: g, ok: g === q.a };
  });
  A.route(/^quiz-(\d+)$/, (m) => {
    const mod = A.mod(m[1]), u = A.me(); if (!mod) return { html: '' };
    const qs = A.quizOf(mod.id); const res = A.quizResult && A.quizResult.mod === mod.id ? A.DB.attempts.find((a) => a.id === A.quizResult.id) : null;
    if (!qs.length) return { title: 'Test', html: '<div class="card empty">Ce module n’a pas de test.</div>' };
    const best = A.best(u.id, 'module', mod.id);
    if (res) {
      A.quizResult = null;
      return { title: 'Résultat du test', html: `<div class="crumbs"><a href="#module-${mod.id}">Module ${mod.id}</a> › Test</div>` + head('Résultat — ' + esc(mod.short)) + `<div class="card row" style="gap:24px"><div class="score-big">${A.fmtNote(res.score, res.max)}</div><div><p style="margin:0"><b>${res.score} bonne(s) réponse(s) sur ${res.max}.</b></p><p class="muted" style="margin:0">Meilleure note retenue : ${A.fmtNote(best.score, best.max)}</p></div><span class="sp" style="flex:1"></span><a class="btn" href="#quiz-${mod.id}">Recommencer</a>${mod.id < 7 ? `<a class="btn pri" href="#module-${mod.id + 1}">Module suivant ${I('arrow', 16)}</a>` : ''}</div>
<div class="card" style="margin-top:16px"><h3>Correction détaillée</h3>${res.qs.map((q, i) => A.qHTML(q, i, 'r', res.answers)).join('')}</div>` };
    }
    if (!A.can('eval.passer')) return { title: 'Test', html: head('Test du module ' + mod.id) + '<div class="card">Aperçu enseignant : ' + qs.length + ' questions.' + qs.map((q, i) => A.qHTML(q, i, 'p', qs.map((x) => ({ given: x.t === 'court' ? x.acc[0] : x.a, ok: true })))).join('') + '</div>' };
    return {
      title: 'Test du module ' + mod.id, html: `<div class="crumbs"><a href="#module-${mod.id}">Module ${mod.id}</a> › Test</div>` + head('Test — ' + esc(mod.title), `${qs.length} questions. Répondez à toutes les questions puis validez : la correction s’affiche immédiatement.${best ? ' Meilleure note actuelle : ' + A.fmtNote(best.score, best.max) + '.' : ''}`) +
        `<form class="card" data-form="quiz" data-mod="${mod.id}">${qs.map((q, i) => A.qHTML(q, i, 'q')).join('')}<div id="qz-err"></div><button class="btn pri">Valider mes réponses</button></form>`
    };
  });
  A.form.quiz = (f) => {
    const mod = +f.dataset.mod, qs = A.quizOf(mod), u = A.me(), ans = A.grade(qs, f, 'q');
    const empty = ans.filter((a) => a.given === -1 || a.given === '').length;
    if (empty && !f.dataset.force) { f.querySelector('#qz-err').innerHTML = `<div class="alert info">${empty} question(s) sans réponse. Cliquez de nouveau sur « Valider » pour terminer quand même.</div>`; f.dataset.force = '1'; return; }
    const at = { id: A.uid('a-'), uid: u.id, kind: 'module', ref: mod, score: ans.filter((a) => a.ok).length, max: qs.length, date: Date.now(), qs: qs.map((q) => ({ ...q })), answers: ans };
    A.DB.attempts.push(at); A.log('Test de module', 'Module ' + mod + ' : ' + at.score + '/' + at.max); A.save(); A.quizResult = { mod, id: at.id }; A.render();
  };

  // =========================================================== EXAMEN FINAL
  A.route(/^examen$/, () => {
    const u = A.me(), S = A.DB.settings, mine = A.attemptsOf(u.id, 'exam'), left = S.examMax - mine.length, best = A.best(u.id, 'exam');
    if (A.examResult) {
      const r = A.DB.attempts.find((a) => a.id === A.examResult); A.examResult = null;
      return { title: 'Examen final', html: head('Examen final — résultat') + `<div class="card row" style="gap:24px"><div class="score-big">${A.fmtNote(r.score, r.max)}</div><div><b>${r.score}/${r.max} bonnes réponses</b><br><span class="muted">${r.timeout ? 'Temps écoulé : copie remise automatiquement.' : 'Copie remise.'}</span></div></div><div class="card" style="margin-top:16px"><h3>Correction</h3>${r.qs.map((q, i) => A.qHTML(q, i, 'r', r.answers)).join('')}</div>` };
    }
    const st = A.examState;
    if (st && st.uid === u.id) {
      return {
        title: 'Examen en cours', html: `<div class="pagehead"><div><h1>Examen final</h1><p>${st.qs.length} questions. La copie est remise automatiquement à la fin du temps.</p></div><div class="timer" id="ex-timer" aria-live="polite">--:--</div></div>
<form class="card" data-form="exam">${st.qs.map((q, i) => A.qHTML(q, i, 'x')).join('')}<button class="btn pri">Remettre ma copie</button></form>`,
        mount() {
          const t = document.getElementById('ex-timer');
          const tick = () => { const s = Math.max(0, Math.round((st.deadline - Date.now()) / 1000)); t.textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); t.classList.toggle('low', s < 60); if (s <= 0) { const f = document.querySelector('form[data-form="exam"]'); if (f) submitExam(f, true); } };
          tick(); A.timers.push(setInterval(tick, 1000));
        }
      };
    }
    return {
      title: 'Examen final', html: `<div class="crumbs"><a href="#evaluations">Évaluations</a> › Examen final</div>` + head('Examen final', 'Questions tirées au hasard dans les modules 1 à 6, chronométrées.') + `<div class="card" style="max-width:720px">
<dl class="kv" style="max-width:420px"><dt>Nombre de questions</dt><dd>${S.examN}</dd><dt>Durée</dt><dd>${S.examMin} min</dd><dt>Tentatives utilisées</dt><dd>${mine.length}/${S.examMax}</dd><dt>Meilleure note</dt><dd>${best ? A.fmtNote(best.score, best.max) : '—'}</dd></dl>
<ul class="small muted"><li>Le chronomètre démarre dès que vous commencez.</li><li>Vous pouvez changer de page : le temps continue de s’écouler.</li><li>À la fin du temps, la copie est remise automatiquement.</li></ul>
${!S.examOpen ? '<div class="alert info">L’examen est actuellement fermé par l’administration.</div>' : left <= 0 ? '<div class="alert info">Vous avez utilisé toutes vos tentatives.</div>' : A.can('eval.passer') ? '<button class="btn pri" data-act="startExam">Commencer l’examen</button>' : ''}</div>`
    };
  });
  A.act.startExam = () => {
    const u = A.me(), S = A.DB.settings;
    const pool = K.modules.filter((m) => m.id <= 6).flatMap((m) => A.quizOf(m.id));
    A.examState = { uid: u.id, qs: A.shuffle(pool, Date.now()).slice(0, Math.min(S.examN, pool.length)).map((q) => ({ ...q })), deadline: Date.now() + S.examMin * 60000, start: Date.now() };
    A.log('Examen final commencé'); A.save(); A.render();
  };
  function submitExam(f, timeout) {
    const st = A.examState; if (!st) return; const ans = A.grade(st.qs, f, 'x');
    const at = { id: A.uid('a-'), uid: st.uid, kind: 'exam', ref: 'final', score: ans.filter((a) => a.ok).length, max: st.qs.length, date: Date.now(), qs: st.qs, answers: ans, timeout: !!timeout, dur: Math.round((Date.now() - st.start) / 1000) };
    A.DB.attempts.push(at); A.examState = null; A.examResult = at.id; A.log('Examen final terminé', at.score + '/' + at.max); A.save(); A.render();
  }
  A.form.exam = (f) => A.confirm('Remettre votre copie maintenant ?', () => submitExam(f), 'Remettre', false);

  A.route(/^evaluations$/, () => {
    const u = A.me(), S = A.DB.settings, mine = A.attemptsOf(u.id, 'exam'), best = A.best(u.id, 'exam');
    return {
      title: 'Évaluations', html: head('Évaluations', 'Tests de module (meilleure note retenue) et examen final chronométré.') + `
<div class="card" style="margin-bottom:16px"><div class="row between"><div><span class="badge ${S.examOpen ? 'green' : 'orange'}">${S.examOpen ? 'Ouvert' : 'Fermé'}</span><h3 style="margin:8px 0 4px">Examen final</h3><span class="muted small">${S.examN} questions · ${S.examMin} min · ${mine.length}/${S.examMax} tentative(s) utilisée(s)${best ? ' · meilleure note ' + A.fmtNote(best.score, best.max) : ''}</span></div><a class="btn pri" href="#examen">${A.examState ? 'Reprendre l’examen' : 'Accéder à l’examen'}</a></div></div>
<div class="card"><h3>Tests de module</h3><table class="tbl stack"><thead><tr><th>Module</th><th class="num">Questions</th><th class="num">Tentatives</th><th class="num">Meilleure note</th><th></th></tr></thead><tbody>
${K.modules.filter((m) => A.quizOf(m.id).length && A.modVisible(m.id)).map((m) => { const b = A.best(u.id, 'module', m.id); return `<tr><td>M${m.id} · ${esc(m.title)}</td><td class="num">${A.quizOf(m.id).length}</td><td class="num">${A.attemptsOf(u.id, 'module', m.id).length}</td><td class="num"><b>${b ? A.fmtNote(b.score, b.max) : '—'}</b></td><td class="num"><a class="btn sm" href="#quiz-${m.id}">${b ? 'Repasser' : 'Passer'}</a></td></tr>`; }).join('')}
</tbody></table></div>`
    };
  });

  // =========================================================== EXERCICES
  A.route(/^exercices$/, () => {
    const u = A.me(), dn = A.DB.draws[u.id] || {}, rb = A.best(u.id, 'reco');
    const lv = { Facile: 'green', Moyen: 'blue', Difficile: 'orange' };
    return {
      title: 'Exercices', html: head('Exercices', 'Entraînement corrigé automatiquement : représentation chimique en 2D et reconnaissance des molécules en 3D.') + `
<h2>Représenter une molécule en 2D</h2><p class="muted">Dessinez la molécule demandée ; la plateforme vérifie la formule brute et la structure exacte (un isomère est détecté).</p>
<div class="grid g3">${K.draw.map((d) => `<a class="card mod" href="#dessin-${d.id}"><span class="row between"><span class="badge ${lv[d.level]}">${d.level}</span>${dn[d.id] ? `<span class="badge green">${I('check', 14)} Réussi</span>` : ''}</span><h3>${esc(d.title)}</h3><p>${esc(C.LIB2D[d.target].n)}</p></a>`).join('')}</div>
<h2 style="margin-top:30px">Reconnaître une molécule en 3D</h2>
<div class="card row between"><div><h3 style="margin:0 0 4px">${K.reco.length} modèles 3D à identifier</h3><span class="muted">Faites tourner chaque modèle, observez sa géométrie et choisissez son nom.${rb ? ' Meilleur score : ' + rb.score + '/' + rb.max + '.' : ''}</span></div><a class="btn pri" href="#reconnaissance">Commencer</a></div>
<h2 style="margin-top:30px">Questions à choix multiples et à réponse courte</h2><p class="muted">Elles se trouvent dans les <a href="#evaluations">tests de module</a>.</p>`
    };
  });

  // barre d'outils de l'éditeur 2D (partagée atelier / exercices)
  const tb2 = () => `<div class="toolbar" id="tb2" role="toolbar" aria-label="Outils de dessin 2D">
<div class="seg" role="group" aria-label="Outil">${[['dessiner', 'Dessiner'], ['cycle', 'Cycle'], ['deplacer', 'Déplacer'], ['gomme', 'Gomme']].map(([k, t]) => `<button data-tool="${k}" class="${k === 'dessiner' ? 'on' : ''}">${t}</button>`).join('')}</div>
<div class="seg els" role="group" aria-label="Élément">${ELS.map((e) => `<button data-el="${e}" class="e-${e}${e === 'C' ? ' on' : ''}" title="${esc(C.EL[e].n)}">${e}</button>`).join('')}<button data-el="" class="el-extra" hidden></button><button data-ed="ptable" title="Tableau périodique : tous les éléments" aria-label="Ouvrir le tableau périodique">${I('grid', 16)}</button></div>
<div class="seg" role="group" aria-label="Charge"><button data-tool="charge" data-sign="1" title="Charge positive : cliquez sur un atome (touche +)" aria-label="Ajouter une charge positive">⊕</button><button data-tool="charge" data-sign="-1" title="Charge négative : cliquez sur un atome (touche −)" aria-label="Ajouter une charge négative">⊖</button></div>
<div class="seg" role="group" aria-label="Ordre de liaison">${[1, 2, 3].map((o) => `<button data-order="${o}" class="${o === 1 ? 'on' : ''}" title="Liaison ${['simple', 'double', 'triple'][o - 1]}" aria-label="Liaison ${['simple', 'double', 'triple'][o - 1]}"><svg width="22" height="14" viewBox="0 0 22 14" aria-hidden="true">${o === 1 ? '<line x1="2" y1="7" x2="20" y2="7" stroke="currentColor" stroke-width="2"/>' : o === 2 ? '<line x1="2" y1="4" x2="20" y2="4" stroke="currentColor" stroke-width="2"/><line x1="2" y1="10" x2="20" y2="10" stroke="currentColor" stroke-width="2"/>' : '<line x1="2" y1="2" x2="20" y2="2" stroke="currentColor" stroke-width="2"/><line x1="2" y1="7" x2="20" y2="7" stroke="currentColor" stroke-width="2"/><line x1="2" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="2"/>'}</svg></button>`).join('')}</div>
<select id="ring2" aria-label="Type de cycle"><option value="6a">Benzène</option><option value="6">Cyclohexane</option><option value="5">Cyclopentane</option><option value="4">Cyclobutane</option><option value="3">Cyclopropane</option></select>
<div class="seg" role="group" aria-label="Affichage">${[['semi', 'Semi-dév.'], ['dev', 'Développée'], ['topo', 'Topologique']].map(([k, t]) => `<button data-disp="${k}" class="${k === 'semi' ? 'on' : ''}">${t}</button>`).join('')}</div>
<span class="tb-sep"></span>
<button class="iconbtn" data-ed="undo" title="Annuler (Ctrl+Z)" aria-label="Annuler">${I('undo')}</button><button class="iconbtn" data-ed="redo" title="Rétablir" aria-label="Rétablir">${I('redo')}</button><button class="iconbtn" data-ed="fit" title="Ajuster la vue" aria-label="Ajuster la vue">${I('fit')}</button><button class="iconbtn" data-ed="zin" aria-label="Zoom avant">${I('zin')}</button><button class="iconbtn" data-ed="zout" aria-label="Zoom arrière">${I('zout')}</button><button class="iconbtn" data-ed="clear" title="Tout effacer" aria-label="Tout effacer">${I('trash')}</button></div>`;
  const bindTb2 = (ed, tb) => {
    const sync = () => { A.$$('[data-tool]', tb).forEach((b) => b.classList.toggle('on', b.dataset.tool === ed.tool && (b.dataset.sign == null || +b.dataset.sign === (ed.chgSign || 1)))); A.$$('[data-el]', tb).forEach((b) => b.classList.toggle('on', b.dataset.el === ed.el)); A.$$('[data-order]', tb).forEach((b) => b.classList.toggle('on', +b.dataset.order === ed.order)); A.$$('[data-disp]', tb).forEach((b) => b.classList.toggle('on', b.dataset.disp === ed.display)); };
    ed.onSettings = sync;
    tb.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.tool) { ed.tool = b.dataset.tool; if (b.dataset.sign) ed.chgSign = +b.dataset.sign; }
      if (b.dataset.el) { ed.el = b.dataset.el; if (ed.tool !== 'dessiner') ed.tool = 'dessiner'; }
      if (b.dataset.ed === 'ptable') { A.periodicPicker(ed.el, (sym) => { ed.el = sym; ed.tool = 'dessiner'; A.showExtraEl(tb, sym, 'el'); sync(); ed.svg.focus({ preventScroll: true }); }); return; }
      if (b.dataset.order) { ed.order = +b.dataset.order; if (ed.tool !== 'dessiner') ed.tool = 'dessiner'; }
      if (b.dataset.disp) { ed.display = b.dataset.disp; ed.render(); }
      const a = b.dataset.ed; if (a === 'undo') ed.undo(); if (a === 'redo') ed.redo(); if (a === 'fit') ed.fit(); if (a === 'zin') ed.setZoom(ed.zoom * 1.2); if (a === 'zout') ed.setZoom(ed.zoom / 1.2); if (a === 'clear') ed.clear();
      sync(); ed.render();
    });
    tb.querySelector('#ring2').addEventListener('change', (e) => { const v = e.target.value; ed.ring = parseInt(v, 10); ed.ringArom = v === '6a'; ed.tool = 'cycle'; sync(); });
  };
  const valenceWarn = (m) => { const adj = C.adjacency(m); const bad = m.atoms.map((a, i) => i).filter((i) => C.overValent(m, adj, i)); return bad.length ? `<div class="warnv">${bad.length} atome(s) dépassent leur valence (${[...new Set(bad.map((i) => m.atoms[i].el))].join(', ')}), signalé(s) en rouge.</div>` : ''; };

  A.route(/^dessin-(d\d+)$/, (m) => {
    const ex = K.draw.find((d) => d.id === m[1]); if (!ex) return { html: '' };
    const idx = K.draw.indexOf(ex), nx = K.draw[idx + 1], u = A.me(), done = (A.DB.draws[u.id] || {})[ex.id];
    return {
      title: 'Exercice : ' + ex.title, html: `<div class="crumbs"><a href="#exercices">Exercices</a> › Dessin ${idx + 1}/${K.draw.length}</div>` + head('Dessinez : ' + esc(ex.title), esc(C.LIB2D[ex.target].n) + ' · niveau ' + ex.level.toLowerCase() + (done ? ' · <span class="badge green">déjà réussi</span>' : '')) + tb2() +
        `<div class="workspace"><div class="ed-host" id="ed"></div><aside class="side-panel"><h4>Consigne</h4><p>Dessinez la molécule « ${esc(C.LIB2D[ex.target].n)} ». Les hydrogènes sont ajoutés automatiquement.</p>
<details><summary class="small" style="cursor:pointer;font-weight:600">Afficher un indice</summary><p class="small" style="margin-top:6px">${esc(ex.hint)}</p></details>
<div id="dr-live" class="small" style="margin:12px 0"></div><button class="btn pri" id="dr-check" style="width:100%">${I('check', 18)} Vérifier mon dessin</button><div id="dr-res" aria-live="polite"></div>
<div class="row" style="margin-top:12px">${nx ? `<a class="btn sm" href="#dessin-${nx.id}">Exercice suivant ${I('arrow', 16)}</a>` : `<a class="btn sm" href="#exercices">Retour aux exercices</a>`}</div></aside></div>`,
      mount() {
        const ed = new G.Editor2D(document.getElementById('ed'), { onChange: (mm) => { live.innerHTML = mm.atoms.length ? 'Votre formule : <b>' + C.formulaHTML(C.counts(mm)) + '</b>' : ''; document.getElementById('dr-res').innerHTML = ''; } });
        const live = document.getElementById('dr-live'); A.live.push(ed); bindTb2(ed, document.getElementById('tb2'));
        document.getElementById('dr-check').onclick = () => {
          const mm = ed.getMol(), tgt = C.lib2D(ex.target), res = document.getElementById('dr-res');
          if (!mm.atoms.length) { res.innerHTML = '<div class="alert info">Dessinez d’abord la molécule.</div>'; return; }
          const adj = C.adjacency(mm); if (mm.atoms.some((a, i) => C.overValent(mm, adj, i))) { res.innerHTML = '<div class="alert bad">Un atome dépasse sa valence (en rouge). Corrigez avant de vérifier.</div>'; return; }
          const fc = C.sameCounts(C.counts(mm), C.counts(tgt)), sg = C.signature(mm) === C.signature(tgt);
          if (fc && sg) {
            const u2 = A.me(); A.DB.draws[u2.id] = A.DB.draws[u2.id] || {}; const first = !A.DB.draws[u2.id][ex.id]; A.DB.draws[u2.id][ex.id] = A.DB.draws[u2.id][ex.id] || Date.now(); if (first) A.log('Exercice de dessin réussi', ex.title); A.save();
            res.innerHTML = `<div class="alert ok">Bravo, c’est bien ${esc(C.LIB2D[ex.target].n.toLowerCase())} (${C.formulaHTML(C.counts(tgt))}).</div><button class="btn sm" id="dr-3d">${I('cube', 16)} Voir en 3D</button>`;
            document.getElementById('dr-3d').onclick = () => { A.pending3D = { mol: C.build3D(mm), note: 'Votre dessin, converti en 3D.' }; A.go('atelier-3d'); };
          } else if (fc) res.innerHTML = `<div class="alert bad">La formule brute est juste (${C.formulaHTML(C.counts(mm))}) mais l’enchaînement des atomes est différent : vous avez dessiné un isomère${C.recognize(mm) ? ' (' + esc(C.recognize(mm).name) + ')' : ''}.</div>`;
          else res.innerHTML = `<div class="alert bad">Ce n’est pas encore la bonne molécule. Votre formule : ${C.formulaHTML(C.counts(mm))}. Vérifiez les liaisons multiples et les hétéroatomes.</div>`;
        };
      }
    };
  });

  A.route(/^reconnaissance$/, () => {
    const st = A.recoState || (A.recoState = { i: 0, score: 0, ans: [], order: A.shuffle(K.reco.map((r, i) => i), Date.now()) });
    if (st.i >= K.reco.length) {
      const u = A.me();
      if (!st.saved && A.can('eval.passer')) { A.DB.attempts.push({ id: A.uid('a-'), uid: u.id, kind: 'reco', ref: 'reco', score: st.score, max: K.reco.length, date: Date.now(), qs: [], answers: [] }); A.log('Reconnaissance 3D', st.score + '/' + K.reco.length); A.save(); st.saved = true; }
      return { title: 'Reconnaissance 3D', html: head('Reconnaissance des molécules en 3D') + `<div class="card row" style="gap:24px"><div class="score-big">${st.score}/${K.reco.length}</div><div><b>Exercice terminé.</b><br><span class="muted">Note équivalente : ${A.fmtNote(st.score, K.reco.length)}</span></div><span style="flex:1"></span><button class="btn pri" data-act="recoRestart">Recommencer</button><a class="btn" href="#exercices">Exercices</a></div>` };
    }
    const r = K.reco[st.order[st.i]], answered = st.ans[st.i];
    return {
      title: 'Reconnaissance 3D', html: `<div class="crumbs"><a href="#exercices">Exercices</a> › Reconnaissance</div>` + head('Quelle est cette molécule ?', `Modèle ${st.i + 1} sur ${K.reco.length} · score actuel ${st.score}`) + `
<div class="workspace" style="border-radius:12px"><div class="v3d-host" id="rv"><span class="v3d-hint">Glissez pour tourner · cliquez sur un atome pour l’inspecter</span></div><aside class="side-panel">
<div id="rv-opts">${r.o.map((o, k) => `<label class="opt ${answered != null ? (k === r.a ? 'good' : k === answered ? 'badc' : '') : ''}"><input type="radio" name="rv" value="${k}" ${answered != null ? 'disabled' : ''} ${answered === k ? 'checked' : ''}><span>${esc(o)}</span></label>`).join('')}</div>
${answered == null ? '<button class="btn pri" data-act="recoCheck" style="width:100%;margin-top:8px">Valider</button>' : `<div class="alert ${answered === r.a ? 'ok' : 'bad'}">${answered === r.a ? 'Exact !' : 'C’était : ' + esc(r.o[r.a]) + '.'} Géométrie : ${esc(r.geo)}.</div><button class="btn pri" data-act="recoNext" style="width:100%">${st.i + 1 < K.reco.length ? 'Modèle suivant' : 'Voir mon score'}</button>`}
<div id="rv-info" class="small" style="margin-top:14px"></div></aside></div>`,
      mount() { const v = new G.Viewer3D(document.getElementById('rv'), { spin: answered == null, onInfo: (h) => { document.getElementById('rv-info').innerHTML = answered != null ? h : h.replace(/<dl class="kv sum">[\s\S]*<\/dl>/, ''); } }); A.live.push(v); v.setMolecule(C.REF3D[r.mol]()); }
    };
  });
  A.act.recoCheck = () => { const st = A.recoState, c = document.querySelector('input[name=rv]:checked'); if (!c) { A.toast('Choisissez une réponse.'); return; } st.ans[st.i] = +c.value; if (+c.value === K.reco[st.order[st.i]].a) st.score++; A.render(); };
  A.act.recoNext = () => { A.recoState.i++; A.render(); };
  A.act.recoRestart = () => { A.recoState = null; A.render(); };

  // =========================================================== TRAVAUX PRATIQUES
  const tpStatus = (uid, tp) => { const s = A.DB.subs.filter((x) => x.uid === uid && x.tp === tp).sort((a, b) => b.date - a.date)[0]; if (!s) return '<span class="badge">À rendre</span>'; return s.status === 'corrige' ? `<span class="badge green">Corrigé · ${C.fr(s.grade, 1)}/20</span>` : '<span class="badge blue">Rendu, en attente</span>'; };
  A.route(/^tp$/, () => {
    const u = A.me(), stu = u.role === 'etudiant';
    return {
      title: 'Travaux pratiques', html: head('Travaux pratiques', 'Huit TP guidés. Lisez la fiche, réalisez le travail dans ChemSketch ou Avogadro, puis déposez vos fichiers.') + `<div class="grid g2">${K.tps.map((t) => `<a class="card mod" href="#tp-${t.id}"><span class="row between"><span class="code">TP ${t.id} · ${esc(t.soft)}</span>${stu ? tpStatus(u.id, t.id) : `<span class="badge">${A.DB.subs.filter((s) => s.tp === t.id).length} dépôt(s)</span>`}</span><h3>${esc(t.title)}</h3><p>${esc(t.obj[0])}</p><div class="foot"><span>${I('clock', 14)} ${t.dur} min · livrable : ${esc(t.livrable)}</span></div></a>`).join('')}</div>`
    };
  });
  A.route(/^tp-(\d+)$/, (m) => {
    const t = A.tp(m[1]), u = A.me(); if (!t) return { html: '' };
    const mine = A.DB.subs.filter((s) => s.uid === u.id && s.tp === t.id).sort((a, b) => b.date - a.date), mols = (A.DB.mols[u.id] || []);
    const canDep = A.can('tp.deposer') && u.role === 'etudiant';
    return {
      title: 'TP ' + t.id, html: `<div class="crumbs"><a href="#tp">Travaux pratiques</a> › TP ${t.id}</div>` + head('TP ' + t.id + ' — ' + esc(t.title), `${esc(t.soft)} · ${t.dur} min · module ${t.mod}`, `<button class="btn" data-act="dlTP" data-id="${t.id}">${I('down', 18)} Fiche PDF</button><a class="btn" href="#atelier-${t.ref ? '3d' : '2d'}">${I(t.ref ? 'cube' : 'hex', 18)} S’entraîner dans l’atelier</a>`) + `
<div class="grid" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);align-items:start" id="tp-grid">
<div class="card"><h3>Objectifs</h3><ul>${t.obj.map((o) => `<li>${esc(o)}</li>`).join('')}</ul><h3>Étapes</h3><ol>${t.steps.map((s) => `<li style="margin-bottom:6px">${esc(s)}</li>`).join('')}</ol><h3>Livrable</h3><p>${esc(t.livrable)}</p><h3>Barème indicatif</h3><ul>${t.bareme.map((b) => `<li>${esc(b)}</li>`).join('')}</ul></div>
<div class="grid">
${canDep ? `<form class="card" data-form="submitTP" data-tp="${t.id}"><h3>Déposer mon travail</h3>
<div class="field"><label for="tp-f">Fichiers (3 au maximum, 700 Ko chacun)</label><input id="tp-f" type="file" name="files" multiple accept=".sk2,.mol,.sdf,.xyz,.cjson,.cml,.pdb,.mol2,.png,.jpg,.jpeg,.pdf,.txt"><small>Formats : .sk2, .mol, .sdf, .xyz, .cjson, .cml, .pdb, .png, .jpg, .pdf</small></div>
${mols.length ? `<div class="field"><label for="tp-m">ou joindre une molécule de mes ateliers</label><select id="tp-m" name="mol"><option value="">— aucune —</option>${mols.map((x) => `<option value="${x.id}">${esc(x.name)} (${x.kind.toUpperCase()})</option>`).join('')}</select></div>` : ''}
<div class="field"><label for="tp-c">Commentaire pour l’enseignant</label><textarea id="tp-c" name="comment" maxlength="1500"></textarea></div><div id="tp-err"></div><button class="btn pri">${I('up', 18)} Déposer</button></form>` : ''}
<div class="card"><h3>${canDep ? 'Mes dépôts' : 'Dépôts reçus'}</h3>${(canDep ? mine : A.DB.subs.filter((s) => s.tp === t.id)).map((s) => `<div class="li" style="display:block;margin-bottom:8px"><div class="row between"><b>${canDep ? A.fmtDate(s.date, true) : esc(A.user(s.uid).name)}</b>${s.status === 'corrige' ? `<span class="badge green">${C.fr(s.grade, 1)}/20</span>` : '<span class="badge blue">En attente de correction</span>'}</div><div class="small muted">${s.files.map((f) => esc(f.name)).join(', ')}</div>${s.feedback ? `<p class="small" style="margin:6px 0 0"><b>Retour :</b> ${esc(s.feedback)}</p>` : ''}</div>`).join('') || '<p class="empty">Aucun dépôt.</p>'}
${!canDep && A.can('travaux.corriger') ? '<a class="btn sm" href="#corrections">Aller aux corrections</a>' : ''}</div>
</div></div><style>@media(max-width:900px){#tp-grid{grid-template-columns:minmax(0,1fr)!important}}</style>`
    };
  });
  A.tpDoc = (t) => `<h1>TP ${t.id} — ${esc(t.title)}</h1><p class="meta">Logiciel : ${esc(t.soft)} · Durée : ${t.dur} min · Module ${t.mod}</p><h2>Objectifs</h2><ul>${t.obj.map((o) => `<li>${esc(o)}</li>`).join('')}</ul><h2>Étapes</h2><ol>${t.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol><h2>Livrable</h2><p>${esc(t.livrable)}</p><h2>Barème indicatif</h2><ul>${t.bareme.map((b) => `<li>${esc(b)}</li>`).join('')}</ul><p class="note">Nommez vos fichiers NOM_Prenom_TP${t.id} et déposez-les dans l’espace du TP sur la plateforme.</p>`;
  A.act.dlTP = (el) => { const t = A.tp(el.dataset.id); A.downloadPDF('Fiche_TP' + t.id + '_' + A.slug(t.title), 'TP ' + t.id + ' — ' + t.title, A.tpDoc(t)); };
  const readFile = (f) => new Promise((res, rej) => {
    const ext = (f.name.split('.').pop() || '').toLowerCase(), text = /^(mol|sdf|xyz|cml|pdb|mol2|cjson|txt)$/.test(ext);
    const r = new FileReader(); r.onload = () => res({ name: f.name, size: f.size, type: ext, [text ? 'text' : 'data']: r.result }); r.onerror = () => rej(new Error('Lecture impossible : ' + f.name));
    text ? r.readAsText(f) : r.readAsDataURL(f);
  });
  A.readFile = readFile;
  A.form.submitTP = async (f, d) => {
    const u = A.me(), tp = +f.dataset.tp, err = (m) => { f.querySelector('#tp-err').innerHTML = `<div class="alert bad">${m}</div>`; };
    const files = [...f.querySelector('#tp-f').files]; const molId = d.get('mol');
    if (!files.length && !molId) return err('Ajoutez au moins un fichier ou une molécule.');
    if (files.length > 3) return err('3 fichiers au maximum.');
    for (const x of files) { if (!fileOK.test(x.name)) return err('Format non accepté : ' + esc(x.name)); if (x.size > 700 * 1024) return err('Fichier trop volumineux pour la démonstration (700 Ko max) : ' + esc(x.name)); }
    let out = []; try { out = await Promise.all(files.map(readFile)); } catch (e) { return err(esc(e.message)); }
    if (molId) { const mm = (A.DB.mols[u.id] || []).find((x) => x.id === molId); if (mm) { const txt = mm.kind === '3d' ? C.toMolfile(mm.mol, { name: mm.name, d3: true }) : C.toMolfile(A.mol2DtoA(mm.mol), { name: mm.name }); out.push({ name: A.slug(mm.name) + '.mol', size: txt.length, type: 'mol', text: txt }); } }
    const s = { id: A.uid('s-'), uid: u.id, tp, date: Date.now(), comment: String(d.get('comment') || '').trim(), files: out, status: 'rendu' };
    A.DB.subs.push(s);
    A.DB.users.filter((x) => x.role === 'enseignant').forEach((t) => A.notify(t.id, 'Nouveau dépôt : ' + u.name + ' — TP ' + tp + '.', 'corrections'));
    A.log('Dépôt de travail', 'TP ' + tp); A.save(); A.toast('Travail déposé. Votre enseignant a été notifié.'); A.render();
  };
  A.mol2DtoA = (m, L = 48) => ({ name: m.name, atoms: m.atoms.map((a) => ({ el: a.el, x: a.x / L * 1.45, y: -a.y / L * 1.45, z: 0, ...C.extra(a) })), bonds: m.bonds });
  A.molAto2D = (m, L = 48) => ({ name: m.name, atoms: m.atoms.map((a) => ({ el: a.el, x: a.x * L / 1.45, y: -a.y * L / 1.45, ...C.extra(a) })), bonds: m.bonds });
  // lecture d'un fichier moléculaire → { mol, flat }
  A.parseMolText = (name, text) => {
    const ext = (name.split('.').pop() || '').toLowerCase();
    const mol = ext === 'xyz' ? C.parseXYZ(text) : C.parseMolfile(text);
    if (!mol.name || mol.name === 'molécule importée' || mol.name === 'molécule XYZ') mol.name = name.replace(/\.[^.]+$/, '');
    const flat = mol.atoms.every((a) => Math.abs(a.z || 0) < 1e-4);
    return { mol, flat };
  };
  A.to3DViewable = (name, text) => { const { mol, flat } = A.parseMolText(name, text); return flat ? C.build3D(C.to2D(mol)) : mol; };

  // =========================================================== CRÉATION RAPIDE DE COMPOSÉS
  const QUICK = ['eau', 'methane', 'ethanol', 'acetique', 'acetone', 'benzene', 'glucose', 'cafeine', 'aspirine', 'uree'];
  const composerHTML = (into) => `<div class="composer card"><form data-form="compose" data-into="${into}" class="cmp-row" autocomplete="off" novalidate>
<label for="cmp-q" class="cmp-l">${I('search', 18)} Rechercher ou écrire un composé</label>
<input id="cmp-q" name="q" type="text" spellcheck="false" list="cmp-dl" placeholder="N’importe quel composé : aspirine, sulfate de cuivre, C6H12O6, CCO, caffeine, 2244…">
<datalist id="cmp-dl"></datalist>
<button class="btn pri">Créer</button><button type="button" class="btn" data-act="pcSearch" data-into="${into}" title="Rechercher dans PubChem (plus de 100 millions de composés)">${I('search', 18)} En ligne</button><button type="button" class="btn" data-act="openLib" data-into="${into}">${I('lib', 18)} Composés standard</button></form>
<div class="cmp-quick" role="group" aria-label="Composés courants"><span class="muted small">Rapide :</span>${QUICK.map((id) => `<button type="button" class="chip" data-act="pickMol" data-id="${id}" data-into="${into}">${esc(G.Compose.byId[id].n.replace(/ \(.*\)$/, ''))}</button>`).join('')}</div>
<details class="cmp-help"><summary>Que puis-je écrire ?</summary><ul>
<li><b>N’importe quel nom</b>, en français ou en anglais : sulfate de cuivre, chlorure de sodium, acide citrique, caféine, cholestérol, chlorophylle, testostérone… Si le composé n’est pas dans la bibliothèque intégrée, il est recherché automatiquement dans <b>PubChem</b> (base mondiale de plus de 100 millions de composés, connexion Internet nécessaire).</li>
<li><b>Un nom en nomenclature</b> : éthanol, propan-2-ol, but-2-ène, acide propanoïque, 2-méthylpropane, éthanoate d’éthyle…</li>
<li><b>Une formule semi-développée</b> : CH3-CH2-OH, CH3-CO-CH3, CH2=CH-CH3, (CH3)3C-OH. « = » double liaison, « ≡ » ou « # » triple liaison.</li>
<li><b>Une formule brute</b> : C2H6O, C6H12O6… les isomères connus sont proposés (bibliothèque puis PubChem).</li>
<li><b>Un SMILES</b>, ions compris : CCO, c1ccccc1, [Na+].[Cl-], CC(=O)[O-] ; <b>un numéro CID</b> PubChem (2244) ou <b>CAS</b> (50-78-2).</li>
<li>Dans l’éditeur : le bouton ${I('grid', 14)} ouvre le <b>tableau périodique complet</b> ; ⊕ et ⊖ ajoutent une charge à un atome.</li></ul></details>
<div id="cmp-msg" aria-live="polite"></div><div id="cmp-res"></div></div>`;
  const cmpSay = (html, cls) => { const el = document.getElementById('cmp-msg'); if (el) el.innerHTML = html ? `<div class="alert ${cls || 'info'}" style="margin:10px 0 0">${html}</div>` : ''; };
  // charge une molécule 2D (coordonnées de l'éditeur) dans l'atelier voulu ; sans atelier ouvert : atelier 2D
  A.loadComposed = (mol, into, entry) => {
    if (into === '3d' && A.cur3D) {
      const ref = entry && entry.ref && C.REF3D[entry.ref];
      const m3 = ref ? C.REF3D[entry.ref]() : C.build3D(mol); m3.name = mol.name || m3.name;
      A.cur3D.setMolecule(m3); const nm = document.getElementById('v3-name'); if (nm) nm.value = mol.name || '';
      return ref ? 'géométrie de référence' : 'hydrogènes ajoutés et géométrie optimisée (champ de force simplifié)';
    }
    if (into === '2d' && A.cur2D) { A.cur2D.load(mol); const nm = document.getElementById('ed-name'); if (nm) nm.value = mol.name || ''; return ''; }
    A.pending2D = mol; A.go('atelier-2d'); return '';
  };
  A.form.compose = (f, d) => {
    const into = f.dataset.into, q = String(d.get('q') || '').trim(); A.pcRes('');
    if (!q) { cmpSay('Écrivez un nom, une formule, un SMILES ou un numéro CID.', 'bad'); return; }
    let r; try { r = G.Compose.fromText(q); } catch (e) { console.error(e); r = { ok: false, msg: 'Ce composé n’a pas pu être construit.' }; }
    const online = `<button type="button" class="btn sm" data-act="pcSearch" data-into="${into}" data-q="${esc(q)}">${I('search', 16)} Chercher aussi dans PubChem</button>`;
    if (r.choices) { cmpSay(esc(r.msg) + `<div class="row" style="gap:6px;margin-top:8px">${r.choices.map((e) => `<button type="button" class="chip" data-act="pickMol" data-id="${e.id}" data-into="${into}">${esc(e.n)}</button>`).join('')}${online}</div>`, 'info'); return; }
    if (!r.ok) { A.pcSearch(q, into, esc(r.msg)); return; }
    const note = A.loadComposed(r.mol, into, r.entry);
    cmpSay(`<b>${esc(r.mol.name || q)}</b> — ${C.formulaHTML(C.counts(r.mol))}. ${esc(r.how)}${note ? ' En 3D : ' + esc(note) + '.' : ''}<div style="margin-top:6px">${online}</div>`, r.warn ? 'bad' : 'ok');
  };
  // ---------- recherche dans PubChem ----------
  A.pcRes = (h) => { const el = document.getElementById('cmp-res'); if (el) el.innerHTML = h; };
  const pcFormula = (f) => esc(String(f || '')).replace(/(\d+)/g, '<sub>$1</sub>').replace(/([+-])$/, '<sup>$1</sup>');
  const pcCard = (p, into) => `<button type="button" class="pc-card" data-act="pcPick" data-cid="${p.CID}" data-into="${into}" data-t="${esc(p.Title || p.IUPACName || 'CID ' + p.CID)}"><img src="${G.PubChem.image(p.CID)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.visibility='hidden'"><b>${esc(p.Title || p.IUPACName || 'CID ' + p.CID)}</b><span class="small muted">${pcFormula(p.MolecularFormula)} · ${C.fr(+p.MolecularWeight || 0, 2)} g/mol</span><span class="small muted">CID ${p.CID}</span></button>`;
  A.pcSearch = async (q, into, why) => {
    if (!G.PubChem) return;
    const tok = (A.pcTok = (A.pcTok || 0) + 1);
    cmpSay(`${why ? why + '<br>' : ''}<span class="spin-i">${I('spin', 16)}</span> Recherche de « ${esc(q)} » dans PubChem…`, 'info'); A.pcRes('');
    try {
      const r = await G.PubChem.search(q); if (tok !== A.pcTok) return;
      if (!r.cids.length) { cmpSay(`Aucun composé trouvé pour « ${esc(q)} », ni dans la bibliothèque, ni dans PubChem${r.tried && r.tried.length ? ' (essais : ' + r.tried.map(esc).join(', ') + ')' : ''}. Essayez le nom anglais, la formule brute (C9H8O4), le SMILES ou le numéro CID.`, 'bad'); return; }
      const P = await G.PubChem.props(r.cids); if (tok !== A.pcTok) return;
      if (!P.length) { cmpSay('PubChem n’a pas renvoyé de fiche pour cette recherche.', 'bad'); return; }
      if (P.length === 1 || (r.how !== 'formule brute' && r.how !== 'numéro CAS')) {
        await A.pcLoad(P[0].CID, into, P[0], q);
        if (P.length > 1) A.pcRes(`<p class="small muted" style="margin:10px 0 6px">Autres résultats PubChem pour « ${esc(r.term)} » :</p><div class="pc-grid">${P.slice(1, 9).map((p) => pcCard(p, into)).join('')}</div>`);
        return;
      }
      cmpSay(`${P.length} composé${P.length > 1 ? 's' : ''} trouvé${P.length > 1 ? 's' : ''} dans PubChem (${esc(r.how)} : ${esc(r.term)}). Cliquez sur un composé pour l’ouvrir.`, 'info');
      A.pcRes(`<div class="pc-grid">${P.map((p) => pcCard(p, into)).join('')}</div>`);
    } catch (e) { if (tok === A.pcTok) cmpSay(esc(e.message || 'Recherche impossible.'), 'bad'); }
  };
  A.act.pcSearch = (el) => { const q = el.dataset.q || (document.getElementById('cmp-q') || {}).value || ''; if (!q.trim()) { cmpSay('Écrivez d’abord le nom, la formule, le SMILES ou le numéro CID du composé.', 'bad'); return; } A.pcSearch(q.trim(), el.dataset.into); };
  A.act.pcPick = async (el) => { const t = el.dataset.t; cmpSay(`<span class="spin-i">${I('spin', 16)}</span> Chargement de ${esc(t)}…`, 'info'); try { await A.pcLoad(+el.dataset.cid, el.dataset.into, { Title: t, CID: +el.dataset.cid }); } catch (e) { cmpSay(esc(e.message), 'bad'); } };
  // ouverture d'un composé PubChem : coordonnées 2D dans l'éditeur, conformère 3D dans la visionneuse
  A.pcLoad = async (cid, into, p, q) => {
    const title = (p && (p.Title || p.IUPACName)) || 'CID ' + cid;
    const link = `<a href="${G.PubChem.page(cid)}" target="_blank" rel="noopener">fiche PubChem</a>`;
    const head = `<b>${esc(title)}</b>${q && C && G.PubChem && q.toLowerCase() !== String(title).toLowerCase() ? ' <span class="muted">(« ' + esc(q) + ' »)</span>' : ''} — CID ${cid}${p && p.MolecularFormula ? ' · ' + pcFormula(p.MolecularFormula) : ''}${p && p.MolecularWeight ? ' · ' + C.fr(+p.MolecularWeight, 2) + ' g/mol' : ''}. `;
    if (into === '3d' && A.cur3D) {
      let t3 = null; try { t3 = await G.PubChem.sdf(cid, '3d'); } catch (e) { if (e.net) throw e; }
      let m3, note;
      if (t3) { m3 = C.parseMolfile(t3); note = 'Conformère 3D calculé par PubChem.'; }
      else {
        const t2 = await G.PubChem.sdf(cid, '2d'); if (!t2) throw new Error('Structure introuvable dans PubChem.');
        const m2 = C.to2D(C.parseMolfile(t2)), n = m2.atoms.length;
        cmpSay(head + `<span class="spin-i">${I('spin', 16)}</span> Construction de la géométrie 3D…`, 'info'); await new Promise((r) => setTimeout(r, 30));
        m3 = C.build3D(m2, { steps: n > 70 ? 60 : n > 35 ? 220 : 700 }); note = 'PubChem ne fournit pas de conformère 3D pour ce composé : hydrogènes ajoutés et géométrie optimisée par le champ de force simplifié de la plateforme.';
      }
      m3.name = title; A.cur3D.setMolecule(m3); const nm = document.getElementById('v3-name'); if (nm) nm.value = title;
      cmpSay(head + note + ' ' + link + '.', 'ok'); return;
    }
    const t = await G.PubChem.sdf(cid, '2d'); if (!t) throw new Error('Structure introuvable dans PubChem.');
    const m = C.to2D(C.parseMolfile(t)); m.name = title;
    const big = m.atoms.length > 12 || m.bonds.length >= m.atoms.length;
    if (into === '2d' && A.cur2D) { if (big && A.cur2D.display === 'semi') { A.cur2D.display = 'topo'; A.cur2D.onSettings(); } A.cur2D.load(m); const nm = document.getElementById('ed-name'); if (nm) nm.value = title; }
    else { A.pending2D = m; A.go('atelier-2d'); }
    cmpSay(head + 'Structure 2D importée de PubChem : modifiez-la librement, puis « Voir en 3D ». ' + link + '.', 'ok');
  };
  // suggestions de noms pendant la saisie (bibliothèque + PubChem)
  A.bindComposer = () => {
    const qi = document.getElementById('cmp-q'), dl = document.getElementById('cmp-dl'); if (!qi || !dl) return;
    let t = 0, last = '';
    qi.addEventListener('input', () => {
      clearTimeout(t); const v = qi.value.trim(); if (v.length < 3 || v === last) return;
      t = setTimeout(async () => {
        last = v; const loc = G.Compose.search(v).slice(0, 6).map((e) => e.n);
        const on = /^[a-zà-ÿ' -]+$/i.test(v) && G.PubChem ? await G.PubChem.suggest(v) : [];
        if (qi.value.trim() !== v) return;
        dl.innerHTML = [...new Set(loc.concat(on))].slice(0, 12).map((x) => `<option value="${esc(x)}"></option>`).join('');
      }, 320);
    });
  };
  // ---------- tableau périodique (choix de n'importe quel élément) ----------
  A.showExtraEl = (tb, sym, key) => {
    const x = tb.querySelector('.el-extra'); if (!x) return;
    if (ELS.includes(sym)) { x.hidden = true; return; }
    x.dataset[key] = sym; x.textContent = sym; x.title = C.EL[sym].n; x.hidden = false;
    x.style.color = ''; x.classList.add('on');
  };
  A.periodicPicker = (cur, pick) => {
    const syms = C.SYMBOLS;
    const cell = (z, col, row) => { const s = syms[z - 1], e = C.EL[s]; return `<button class="pt-el${s === cur ? ' on' : ''}${e.met ? ' met' : ''}" data-pt="${s}" title="${esc(e.n)} — Z = ${z} — ${C.fr(e.m, 3)} g/mol" style="grid-column:${col};grid-row:${row};--pc:${e.c}"><small>${z}</small><b>${s}</b><span>${esc(e.n)}</span></button>`; };
    const fb = (z) => (z >= 57 && z <= 71) || (z >= 89 && z <= 103);
    let grid = '';
    syms.forEach((s, k) => { const z = k + 1, e = C.EL[s]; if (fb(z)) grid += cell(z, z - (z < 89 ? 57 : 89) + 3, z < 89 ? 9 : 10); else if (e.g) grid += cell(z, e.g, e.p); });
    grid += '<span class="pt-gap" style="grid-column:3;grid-row:6">57–71</span><span class="pt-gap" style="grid-column:3;grid-row:7">89–103</span><span class="pt-sp" style="grid-row:8"></span>';
    A.modal(`<div class="row between"><h3 style="margin:0">${I('grid')} Tableau périodique</h3><button class="btn sm" data-act="closeModal">Fermer</button></div>
<p class="small muted" style="margin:4px 0 10px">Cliquez sur un élément pour le dessiner. Les métaux (fond grisé) ne reçoivent pas d’hydrogènes implicites ; utilisez ⊕ et ⊖ pour les charges des ions.</p>
<input type="search" id="pt-q" placeholder="Rechercher : fer, Fe, 26…" aria-label="Rechercher un élément" style="max-width:280px;margin-bottom:10px">
<div class="ptable" id="pt-grid">${grid}</div>`, {
      wide: true, mount(bg) {
        const g = bg.querySelector('#pt-grid');
        g.addEventListener('click', (e) => { const b = e.target.closest('[data-pt]'); if (!b) return; A.closeModal(); pick(b.dataset.pt); });
        bg.querySelector('#pt-q').addEventListener('input', (e) => { const v = e.target.value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); A.$$('[data-pt]', g).forEach((b) => { const s = b.dataset.pt, n = C.EL[s].n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''), z = String(syms.indexOf(s) + 1); b.classList.toggle('dim', !!v && !(s.toLowerCase() === v || n.startsWith(v) || z === v)); }); });
      }
    });
  };
  A.act.pickMol = (el) => {
    const e = G.Compose.byId[el.dataset.id]; if (!e) return; const into = el.dataset.into; A.closeModal();
    const m = G.Compose.build(e), note = A.loadComposed(m, into, e);
    if (into) cmpSay(`<b>${esc(e.n)}</b> — ${C.formulaHTML(C.counts(m))}. Composé de la bibliothèque${note ? ' ; en 3D : ' + esc(note) : ''}.`, 'ok');
  };
  // ---------- fenêtre « Composés standard » (aperçus, images, ouverture) ----------
  const thumb = (e) => { try { const m = G.Compose.build(e), ring = m.bonds.length >= m.atoms.length, s = A.structSVG(m, { display: ring || m.atoms.length > 9 ? 'topo' : 'semi', pad: 8 }); return s.svg.replace(/ width="\d+" height="\d+"/, ' preserveAspectRatio="xMidYMid meet" aria-hidden="true"'); } catch (err) { return ''; } };
  A.act.openLib = (el) => {
    const into = el.dataset.into || '', st = { cat: A.libCat || 'base', q: '' };
    A.modal(`<div class="row between"><h3 style="margin:0">Composés standard</h3><button class="btn sm" data-act="closeModal">Fermer</button></div>
<p class="muted small" style="margin:4px 0 10px">${G.Compose.LIB.length} composés. ${into ? 'Cliquez sur un composé pour l’ouvrir dans l’atelier ' + into.toUpperCase() + '.' : 'Cliquez sur un composé pour l’ouvrir dans l’atelier 2D.'} Les boutons PNG, SVG et 3D téléchargent son image.</p>
<input type="search" id="lib-q" placeholder="Rechercher un nom ou une formule brute (ex. C3H6O)" aria-label="Rechercher un composé">
<div class="lib-cats" role="tablist" aria-label="Familles">${G.Compose.CATS.map(([k, t]) => `<button role="tab" data-cat="${k}">${esc(t)}</button>`).join('')}</div><div class="lib-grid" id="lib-grid"></div>`, {
      wide: true, mount(bg) {
        const grid = bg.querySelector('#lib-grid'), qi = bg.querySelector('#lib-q');
        const draw = () => {
          A.$$('[data-cat]', bg).forEach((b) => { b.classList.toggle('on', !st.q && b.dataset.cat === st.cat); b.setAttribute('aria-selected', String(!st.q && b.dataset.cat === st.cat)); });
          const list = st.q ? G.Compose.search(st.q) : G.Compose.LIB.filter((e) => e.cat === st.cat);
          grid.innerHTML = list.length ? list.map((e) => { let f = ''; try { f = C.formulaHTML(C.counts(G.Compose.build(e))); } catch (err) {} return `<div class="lib-card"><button class="lib-pick" data-act="pickMol" data-id="${e.id}" data-into="${into}" title="Ouvrir ${esc(e.n)}"><span class="lib-thumb">${thumb(e)}</span><b>${esc(e.n)}</b><span class="small muted">${f}</span></button><div class="lib-acts"><button class="btn sm ghost" data-act="libImg" data-id="${e.id}" data-k="png" aria-label="Image PNG de ${esc(e.n)}">PNG</button><button class="btn sm ghost" data-act="libImg" data-id="${e.id}" data-k="svg" aria-label="Image SVG de ${esc(e.n)}">SVG</button><button class="btn sm ghost" data-act="libImg" data-id="${e.id}" data-k="3d" aria-label="Image 3D de ${esc(e.n)}">3D</button></div></div>`; }).join('') : '<p class="muted">Aucun composé ne correspond. Essayez « Écrire un composé » dans un atelier.</p>';
        };
        bg.querySelector('.lib-cats').addEventListener('click', (ev) => { const b = ev.target.closest('[data-cat]'); if (!b) return; st.cat = A.libCat = b.dataset.cat; st.q = ''; qi.value = ''; draw(); });
        let tmr = 0; qi.addEventListener('input', () => { clearTimeout(tmr); tmr = setTimeout(() => { st.q = qi.value.trim(); draw(); }, 160); });
        draw();
      }
    });
  };
  A.act.libImg = (el) => {
    const e = G.Compose.byId[el.dataset.id]; if (!e) return; const m = G.Compose.build(e), name = A.slug(e.n), k = el.dataset.k;
    if (k === '3d') { const ref = e.ref && C.REF3D[e.ref]; A.toast('Préparation de l’image 3D…'); setTimeout(() => A.dlMol3DImage(ref ? C.REF3D[e.ref]() : C.build3D(m), { name }), 30); return; }
    A.dlMol2DImage(m, { name, title: e.n, display: m.bonds.length >= m.atoms.length || m.atoms.length > 9 ? 'topo' : 'semi', svg: k === 'svg' });
  };

  // =========================================================== ATELIER 2D
  const myMolsHTML = (kind) => { const u = A.me(), l = A.DB.mols[u.id] || []; return l.length ? `<ul class="mlist">${l.map((x) => `<li><span>${esc(x.name)} <span class="badge">${x.kind.toUpperCase()}</span></span><span class="row" style="gap:4px;flex-wrap:nowrap"><button class="btn sm ghost" data-act="loadMy" data-id="${x.id}" data-into="${kind}">Ouvrir</button><button class="iconbtn" style="width:34px;height:34px" data-act="delMy" data-id="${x.id}" aria-label="Supprimer">${I('trash', 16)}</button></span></li>`).join('')}</ul>` : '<p class="muted small">Aucune molécule enregistrée.</p>'; };
  A.act.delMy = (el) => { const u = A.me(); A.DB.mols[u.id] = (A.DB.mols[u.id] || []).filter((x) => x.id !== el.dataset.id); A.save(); A.$$('.mymols').forEach((n) => { n.innerHTML = myMolsHTML(n.dataset.kind); }); };
  A.act.loadMy = (el) => {
    const u = A.me(), x = (A.DB.mols[u.id] || []).find((y) => y.id === el.dataset.id); if (!x) return;
    if (el.dataset.into === '2d') { if (x.kind === '2d') A.cur2D && A.cur2D.load(x.mol); else A.cur2D && A.cur2D.load(C.to2D(x.mol)); }
    else { if (x.kind === '3d') A.cur3D && A.cur3D.setMolecule(x.mol); else A.cur3D && A.cur3D.setMolecule(C.build3D(x.mol)); }
  };
  const saveMy = (name, kind, mol) => { const u = A.me(); A.DB.mols[u.id] = A.DB.mols[u.id] || []; A.DB.mols[u.id].unshift({ id: A.uid('m-'), name: name || mol.name || 'Ma molécule', kind, mol, date: Date.now() }); A.DB.mols[u.id] = A.DB.mols[u.id].slice(0, 30); A.save(); A.$$('.mymols').forEach((n) => { n.innerHTML = myMolsHTML(n.dataset.kind); }); A.toast('Molécule enregistrée dans « Mes molécules »'); };
  A.route(/^atelier-2d$/, () => ({
    title: 'Atelier 2D', html: head('Atelier 2D', 'Dessinez comme dans ChemSketch, ou écrivez directement le composé. Clic : atome · glisser depuis un atome : liaison · clic sur une liaison : ordre suivant · clic sur un atome avec un autre élément : remplacement. Raccourcis : C, N, O… et 1, 2, 3.') + composerHTML('2d') + tb2() +
      `<div class="workspace"><div class="ed-host" id="ed"></div><aside class="side-panel"><div id="ed-info"></div>
<div class="grid" style="gap:8px;margin-top:10px"><button class="btn pri" id="ed-3d">${I('cube', 18)} Voir en 3D</button>
<div class="row" style="gap:8px"><button class="btn sm" id="ed-exp">${I('down', 16)} Exporter (.mol, .sdf)</button><button class="btn sm" id="ed-cmol">${I('copy', 16)} Copier le MOL</button></div>
<div class="row" style="gap:8px"><button class="btn sm" id="ed-png">${I('down', 16)} Image PNG</button><button class="btn sm" id="ed-svg">${I('down', 16)} Image SVG</button></div>
<label class="btn sm" style="cursor:pointer">${I('up', 16)} Importer .mol, .sdf ou .xyz<input type="file" id="ed-imp" accept=".mol,.sdf,.xyz" class="sr"></label>
<select id="ed-lib" aria-label="Charger un exemple"><option value="">Charger un exemple…</option>${Object.entries(C.LIB2D).map(([k, d]) => `<option value="${k}">${esc(d.n)}</option>`).join('')}</select></div>
<p class="mini-h">Enregistrer</p><div class="row" style="gap:6px;flex-wrap:nowrap"><input type="text" id="ed-name" placeholder="Nom de la molécule" aria-label="Nom de la molécule"><button class="btn sm" id="ed-save">OK</button></div>
<p class="mini-h">Mes molécules</p><div class="mymols" data-kind="2d">${myMolsHTML('2d')}</div></aside></div>`,
    mount() {
      const info = document.getElementById('ed-info');
      const upd = (m) => {
        if (!m.atoms.length) { info.innerHTML = '<h4>Molécule</h4><p class="muted small">La zone est vide. Choisissez un élément et cliquez dans la zone quadrillée.</p>'; return; }
        const c = C.counts(m), r = C.recognize(m) || G.Compose.identify(m), hv = m.atoms.length, h = (c.H || 0) - m.atoms.filter((a) => a.el === 'H').length; let smi = ''; try { smi = C.toSMILES(m); } catch (e) { smi = '—'; }
        info.innerHTML = (r ? `<div class="recog">Molécule reconnue : ${esc(r.name)}</div>` : '') + valenceWarn(m) + `<h4>Propriétés calculées</h4><dl class="kv"><dt>Formule brute</dt><dd>${C.formulaHTML(c)}${C.totalCharge(m) ? '<sup>' + C.chargeTxt(C.totalCharge(m)) + '</sup>' : ''}</dd><dt>Masse molaire</dt><dd>${C.fr(C.molarMass(c), 2)} g/mol</dd><dt>Atomes dessinés</dt><dd>${hv}</dd><dt>H ajoutés</dt><dd>${h}</dd><dt>Liaisons</dt><dd>${m.bonds.length}</dd></dl><p class="mini-h">SMILES</p><div class="row" style="gap:6px;flex-wrap:nowrap"><code style="flex:1;padding:6px 8px">${esc(smi)}</code><button class="iconbtn" style="width:36px;height:36px" id="ed-csmi" aria-label="Copier le SMILES">${I('copy', 16)}</button></div>`;
        const b = document.getElementById('ed-csmi'); if (b) b.onclick = () => A.copy(smi, 'SMILES');
      };
      const ed = new G.Editor2D(document.getElementById('ed'), { onChange: upd }); A.live.push(ed); A.cur2D = ed; bindTb2(ed, document.getElementById('tb2')); A.bindComposer();
      if (A.pending2D) { ed.load(A.pending2D, true); A.pending2D = null; } upd(ed.getMol());
      const molA = () => A.mol2DtoA(ed.getMol());
      document.getElementById('ed-3d').onclick = () => { const m = ed.getMol(); if (!m.atoms.length) { A.toast('Dessinez d’abord une molécule.'); return; } const adj = C.adjacency(m); if (m.atoms.some((a, i) => C.overValent(m, adj, i))) { A.toast('Corrigez d’abord les valences signalées en rouge.'); return; } A.pending3D = { mol: C.build3D(m), note: 'Molécule importée de l’atelier 2D : hydrogènes ajoutés et géométrie optimisée (champ de force simplifié).' }; A.go('atelier-3d'); };
      document.getElementById('ed-exp').onclick = () => { const m = ed.getMol(); if (!m.atoms.length) return A.toast('Rien à exporter.'); const nm = A.slug(document.getElementById('ed-name').value || (C.recognize(m) || {}).name || 'molecule'); const mol = C.toMolfile(molA(), { name: nm }); A.download(nm + '_2D.zip', A.zip([{ name: nm + '.mol', data: mol }, { name: nm + '.sdf', data: mol + '$$$$\n' }]), mol); };
      const edName = () => A.slug(document.getElementById('ed-name').value || (C.recognize(ed.getMol()) || G.Compose.identify(ed.getMol()) || {}).name || C.formulaText(C.counts(ed.getMol())));
      document.getElementById('ed-png').onclick = () => A.dlMol2DImage(ed.getMol(), { display: ed.display, name: edName() });
      document.getElementById('ed-svg').onclick = () => A.dlMol2DImage(ed.getMol(), { display: ed.display, name: edName(), svg: true });
      document.getElementById('ed-cmol').onclick = () => { const m = ed.getMol(); if (!m.atoms.length) return A.toast('Rien à copier.'); A.copy(C.toMolfile(molA(), { name: (C.recognize(m) || {}).name || 'molecule' }), 'Fichier MOL'); };
      document.getElementById('ed-imp').onchange = async (e) => { const f = e.target.files[0]; if (!f) return; try { const t = await f.text(); const { mol, flat } = A.parseMolText(f.name, t); ed.load(C.to2D(mol)); A.toast('Fichier importé : ' + f.name); } catch (err) { A.toast(err.message); } e.target.value = ''; };
      document.getElementById('ed-lib').onchange = (e) => { if (e.target.value) { ed.load(C.lib2D(e.target.value)); e.target.value = ''; } };
      document.getElementById('ed-save').onclick = () => { const m = ed.getMol(); if (!m.atoms.length) return A.toast('Rien à enregistrer.'); saveMy(document.getElementById('ed-name').value.trim() || (C.recognize(m) || {}).name || C.formulaText(C.counts(m)), '2d', m); };
    }
  }));

  // =========================================================== ATELIER 3D
  A.route(/^atelier-3d$/, () => ({
    title: 'Atelier 3D', html: head('Atelier 3D', 'Construisez, faites tourner et mesurez comme dans Avogadro, ou écrivez directement le composé. Glisser : tourner · Maj+glisser ou clic droit : déplacer · molette ou pincement : zoom.') + composerHTML('3d') + `
<div class="toolbar" id="tb3" role="toolbar" aria-label="Outils 3D"><div class="seg" role="group" aria-label="Mode">${[['naviguer', 'Inspecter'], ['mesurer', 'Mesurer'], ['ajouter', 'Ajouter'], ['supprimer', 'Supprimer'], ['liaison', 'Liaison']].map(([k, t]) => `<button data-mode="${k}" class="${k === 'naviguer' ? 'on' : ''}">${t}</button>`).join('')}</div>
<div class="seg els" id="els3" role="group" aria-label="Élément à ajouter">${ELS.map((e) => `<button data-el3="${e}" class="e-${e}${e === 'C' ? ' on' : ''}" title="${esc(C.EL[e].n)}">${e}</button>`).join('')}<button data-el3="" class="el-extra" hidden></button><button data-pt3="1" title="Tableau périodique : tous les éléments" aria-label="Ouvrir le tableau périodique">${I('grid', 16)}</button></div>
<select id="st3" aria-label="Type d’affichage"><option value="bs">Boules et bâtons</option><option value="stick">Bâtons</option><option value="vdw">Sphères de van der Waals</option><option value="wire">Fil de fer</option></select>
<span class="tb-sep"></span><button class="btn sm ok" id="opt3">${I('spin', 16)} Optimiser</button>
<button class="iconbtn" data-v="fit" title="Recentrer" aria-label="Recentrer">${I('fit')}</button><button class="iconbtn" data-v="zin" aria-label="Zoom avant">${I('zin')}</button><button class="iconbtn" data-v="zout" aria-label="Zoom arrière">${I('zout')}</button><button class="iconbtn" data-v="clear" title="Vider" aria-label="Vider la scène">${I('trash')}</button></div>
<div class="workspace"><div class="v3d-host" id="v3"></div><aside class="side-panel"><div id="v3-msg" aria-live="polite"></div><div id="v3-info"></div>
<p class="mini-h">Options</p><label class="check"><input type="checkbox" id="o-h" checked> Ajuster les hydrogènes</label><label class="check"><input type="checkbox" id="o-opt" checked> Optimisation automatique</label><label class="check"><input type="checkbox" id="o-lab"> Étiquettes des atomes</label><label class="check"><input type="checkbox" id="o-spin"> Rotation automatique</label>
<p class="mini-h">Charger</p><select id="v3-lib" aria-label="Charger une molécule"><option value="">Charger une molécule…</option><optgroup label="Géométries de référence">${C.REF3D_LIST.map(([k, n, g]) => `<option value="r:${k}">${esc(n)} — ${esc(g)}</option>`).join('')}</optgroup><optgroup label="Construites depuis la 2D">${Object.entries(C.LIB2D).map(([k, d]) => `<option value="l:${k}">${esc(d.n)}</option>`).join('')}</optgroup></select>
<label class="btn sm" style="cursor:pointer;margin-top:8px;width:100%">${I('up', 16)} Importer .mol, .sdf ou .xyz<input type="file" id="v3-imp" accept=".mol,.sdf,.xyz" class="sr"></label>
<p class="mini-h">Exporter et enregistrer</p><div class="row" style="gap:8px"><button class="btn sm" id="v3-png">${I('down', 16)} Image PNG</button><button class="btn sm" id="v3-exp">${I('down', 16)} .mol + .xyz</button><button class="btn sm" id="v3-cxyz">${I('copy', 16)} Copier XYZ</button><button class="btn sm" id="v3-2d">${I('hex', 16)} Vers 2D</button></div>
<div class="row" style="gap:6px;flex-wrap:nowrap;margin-top:8px"><input type="text" id="v3-name" placeholder="Nom de la molécule" aria-label="Nom de la molécule"><button class="btn sm" id="v3-save">OK</button></div>
<p class="mini-h">Mes molécules</p><div class="mymols" data-kind="3d">${myMolsHTML('3d')}</div></aside></div>`,
    mount() {
      const msg = document.getElementById('v3-msg'), info = document.getElementById('v3-info');
      const say = (t, cls) => { msg.innerHTML = t ? `<div class="alert ${cls || 'info'}" style="margin-top:0">${esc(t)}</div>` : ''; };
      const v = new G.Viewer3D(document.getElementById('v3'), { onInfo: (h) => { info.innerHTML = h; }, onMsg: (t) => say(t, 'bad') }); A.live.push(v); A.cur3D = v; A.bindComposer();
      const tb = document.getElementById('tb3'), els = document.getElementById('els3');
      const hints = { naviguer: 'Cliquez sur un atome pour afficher sa géométrie VSEPR, ses angles et ses longueurs de liaison.', mesurer: 'Cliquez sur 2 atomes (distance), 3 (angle) ou 4 (angle dièdre).', ajouter: 'Choisissez un élément puis cliquez sur un atome : le nouvel atome remplace un hydrogène. Dans une scène vide, cliquez pour placer le premier atome.', supprimer: 'Cliquez sur un atome pour le supprimer avec ses hydrogènes.', liaison: 'Cliquez sur une liaison pour passer de simple à double puis triple.' };
      const setMode = (md) => { v.setMode(md); A.$$('[data-mode]', tb).forEach((b) => b.classList.toggle('on', b.dataset.mode === md)); els.style.display = md === 'ajouter' ? '' : 'none'; say(hints[md]); };
      tb.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.mode) setMode(b.dataset.mode);
        if (b.dataset.el3) { v.el = b.dataset.el3; A.$$('[data-el3]', tb).forEach((x) => x.classList.toggle('on', x === b)); }
        if (b.dataset.pt3) { A.periodicPicker(v.el, (sym) => { v.el = sym; A.showExtraEl(tb, sym, 'el3'); A.$$('[data-el3]', tb).forEach((x) => x.classList.toggle('on', x.dataset.el3 === sym)); }); return; }
        const a = b.dataset.v; if (a === 'fit') v.resetView(); if (a === 'zin') v.zoomBy(1.2); if (a === 'zout') v.zoomBy(1 / 1.2); if (a === 'clear') { v.setMolecule({ atoms: [], bonds: [] }); setMode('ajouter'); }
      });
      document.getElementById('st3').onchange = (e) => { v.style = e.target.value; v.fitScale(); v.render(); };
      document.getElementById('opt3').onclick = () => { if (v.mol.atoms.length < 2) return; say('Optimisation en cours…'); v.optimize(900, () => say('Géométrie optimisée (champ de force pédagogique simplifié).', 'ok')); };
      document.getElementById('o-h').onchange = (e) => { v.autoH = e.target.checked; };
      document.getElementById('o-opt').onchange = (e) => { v.autoOpt = e.target.checked; };
      document.getElementById('o-lab').onchange = (e) => { v.labels = e.target.checked; v.render(); };
      document.getElementById('o-spin').onchange = (e) => { v.setSpin(e.target.checked); };
      document.getElementById('v3-lib').onchange = (e) => { const x = e.target.value; if (!x) return; const [t, k] = x.split(':'); v.setMolecule(t === 'r' ? C.REF3D[k]() : C.build3D(C.lib2D(k))); say(t === 'r' ? 'Géométrie de référence (valeurs expérimentales arrondies).' : 'Molécule construite depuis la 2D et optimisée (champ de force simplifié).'); e.target.value = ''; };
      document.getElementById('v3-imp').onchange = async (e) => { const f = e.target.files[0]; if (!f) return; try { const t = await f.text(); const { mol, flat } = A.parseMolText(f.name, t); v.setMolecule(flat ? C.build3D(C.to2D(mol)) : mol); say(flat ? 'Fichier 2D importé : hydrogènes ajoutés et géométrie optimisée.' : 'Fichier 3D importé : ' + f.name, 'ok'); } catch (err) { say(err.message, 'bad'); } e.target.value = ''; };
      const nm = () => A.slug(document.getElementById('v3-name').value || v.mol.name || C.formulaText(C.counts(v.mol, false)));
      document.getElementById('v3-exp').onclick = () => { if (!v.mol.atoms.length) return A.toast('Rien à exporter.'); const n = nm(), mol = C.toMolfile(v.mol, { name: n, d3: true }); A.download(n + '_3D.zip', A.zip([{ name: n + '.mol', data: mol }, { name: n + '.xyz', data: C.toXYZ(v.mol, n) }, { name: n + '.sdf', data: mol + '$$$$\n' }]), mol); };
      document.getElementById('v3-png').onclick = () => A.dlMol3DImage(v, { name: nm() });
      document.getElementById('v3-cxyz').onclick = () => { if (!v.mol.atoms.length) return A.toast('Rien à copier.'); A.copy(C.toXYZ(v.mol, nm()), 'Fichier XYZ'); };
      document.getElementById('v3-2d').onclick = () => { if (!v.mol.atoms.length) return A.toast('Rien à transférer.'); A.pending2D = C.to2D(v.mol); A.go('atelier-2d'); };
      document.getElementById('v3-save').onclick = () => { if (!v.mol.atoms.length) return A.toast('Rien à enregistrer.'); saveMy(document.getElementById('v3-name').value.trim() || v.mol.name || C.formulaText(C.counts(v.mol, false)), '3d', v.getMol()); };
      if (A.pending3D) { v.setMolecule(A.pending3D.mol); say(A.pending3D.note, 'ok'); A.pending3D = null; }
      else { v.setMolecule(C.REF3D.ethanol()); say(hints.naviguer); }
      els.style.display = 'none';
    }
  }));

  // =========================================================== RÉSULTATS
  A.route(/^resultats$/, () => {
    const u = A.me(); if (u.role !== 'etudiant') { setTimeout(() => location.replace('#suivi'), 0); return { html: '' }; }
    const at = A.DB.attempts.filter((a) => a.uid === u.id).sort((a, b) => b.date - a.date), subs = A.subsOf(u.id).sort((a, b) => b.date - a.date);
    const avg = A.avgModules(u.id), ex = A.best(u.id, 'exam'), g = subs.filter((s) => s.status === 'corrige'), tpAvg = g.length ? g.reduce((s, x) => s + x.grade, 0) / g.length : null;
    return {
      title: 'Résultats', html: head('Résultats et progression', 'Notes, corrections détaillées et relevé téléchargeable.', `<button class="btn" data-act="dlReleve">${I('down', 18)} Relevé (PDF)</button><button class="btn" data-act="dlReleveCSV">${I('down', 18)} CSV</button>`) + `
<div class="grid g4"><div class="card kpi"><span>Progression du parcours</span><b>${A.totalProgress(u.id)}%</b></div><div class="card kpi"><span>Moyenne des tests</span><b>${avg == null ? '—' : C.fr(avg * 20, 1) + '/20'}</b></div><div class="card kpi"><span>Examen final</span><b>${ex ? A.fmtNote(ex.score, ex.max) : '—'}</b></div><div class="card kpi"><span>Moyenne des TP</span><b>${tpAvg == null ? '—' : C.fr(tpAvg, 1) + '/20'}</b></div></div>
<div class="card" style="margin-top:16px"><h3>Tests et examens</h3>${at.length ? `<table class="tbl stack"><thead><tr><th>Évaluation</th><th>Date</th><th class="num">Score</th><th class="num">Note</th><th></th></tr></thead><tbody>${at.map((a) => `<tr><td>${esc(A.attemptLabel(a))}</td><td>${A.fmtDate(a.date, true)}</td><td class="num">${a.score}/${a.max}</td><td class="num"><b>${A.fmtNote(a.score, a.max)}</b></td><td class="num">${a.qs && a.qs.length ? `<button class="btn sm" data-act="showCorr" data-id="${a.id}">Correction</button>` : ''}</td></tr>`).join('')}</tbody></table>` : '<p class="empty">Aucune évaluation passée.</p>'}</div>
<div class="card" style="margin-top:16px"><h3>Travaux pratiques</h3>${subs.length ? `<table class="tbl stack"><thead><tr><th>TP</th><th>Déposé le</th><th>Statut</th><th class="num">Note</th><th>Retour de l’enseignant</th></tr></thead><tbody>${subs.map((s) => `<tr><td>TP ${s.tp} — ${esc(A.tp(s.tp).title)}</td><td>${A.fmtDate(s.date)}</td><td>${s.status === 'corrige' ? '<span class="badge green">Corrigé</span>' : '<span class="badge blue">En attente</span>'}</td><td class="num"><b>${s.status === 'corrige' ? C.fr(s.grade, 1) + '/20' : '—'}</b></td><td>${esc(s.feedback || '')}</td></tr>`).join('')}</tbody></table>` : '<p class="empty">Aucun TP déposé.</p>'}</div>
<div class="card" style="margin-top:16px"><h3>Évaluation de mon évolution par l’administration</h3>${A.evalBlock(u.id)}</div>
<div class="card" style="margin-top:16px"><h3>Progression par module</h3><div class="hbars">${K.modules.map((m) => { const p = A.modProgress(u.id, m.id); return `<div class="hbar"><span>M${m.id} · ${esc(m.short)}</span>${bar(p.p)}<b>${p.p}%</b></div>`; }).join('')}</div><p class="small muted" style="margin-top:12px">Exercices de dessin réussis : ${Object.keys(A.DB.draws[u.id] || {}).length}/${K.draw.length}</p></div>`
    };
  });
  A.evalBlock = (uid) => {
    const ev = A.DB.evals.filter((e) => e.uid === uid).sort((a, b) => b.date - a.date);
    if (!ev.length) return '<p class="muted">L’administration n’a pas encore évalué votre évolution.</p>';
    const e = ev[0], mods = Object.entries(e.mods || {}).filter(([, v]) => v != null && v !== '');
    return `<div class="row" style="gap:22px;align-items:flex-start"><div><div class="score-big">${C.fr(e.global, 1)}/20</div><span class="muted small">le ${A.fmtDate(e.date)} · ${esc(A.user(e.by).name)}</span></div><div style="flex:1;min-width:220px"><p style="margin-top:4px">${esc(e.comment)}</p>${mods.length ? `<div class="chips">${mods.map(([k, v]) => `<span class="badge blue">M${k} · ${C.fr(v, 1)}/20</span>`).join('')}</div>` : ''}</div></div>${ev.length > 1 ? `<p class="mini-h" style="margin-top:14px">Évaluations précédentes</p><ul class="mlist">${ev.slice(1).map((x) => `<li><span>${A.fmtDate(x.date)} — ${esc(A.user(x.by).name)}</span><b>${C.fr(x.global, 1)}/20</b></li>`).join('')}</ul>` : ''}`;
  };
  A.act.showCorr = (el) => { const a = A.DB.attempts.find((x) => x.id === el.dataset.id); if (!a) return; A.modal(`<div class="row between"><h3 style="margin:0">${esc(A.attemptLabel(a))} — ${A.fmtNote(a.score, a.max)}</h3><button class="btn sm" data-act="closeModal">Fermer</button></div>${a.qs.map((q, i) => A.qHTML(q, i, 'c', a.answers)).join('')}`); };
  A.releve = (u) => {
    const at = A.DB.attempts.filter((a) => a.uid === u.id).sort((a, b) => a.date - b.date), subs = A.subsOf(u.id);
    return `<h1>Relevé de progression</h1><p class="meta">${esc(u.name)} · matricule ${esc(u.matricule || '—')} · ${esc(u.filiere || '')} · édité le ${A.fmtDate(Date.now(), true)}</p>
<h2>Progression par module</h2><table><tr><th>Module</th><th>Leçons terminées</th><th>Meilleure note au test</th></tr>${K.modules.map((m) => { const p = A.modProgress(u.id, m.id), b = A.best(u.id, 'module', m.id); return `<tr><td>M${m.id} — ${esc(m.title)}</td><td>${p.d}/${p.n} (${p.p} %)</td><td>${b ? A.fmtNote(b.score, b.max) : '—'}</td></tr>`; }).join('')}</table>
<h2>Évaluations</h2><table><tr><th>Date</th><th>Évaluation</th><th>Score</th><th>Note</th></tr>${at.map((a) => `<tr><td>${A.fmtDate(a.date, true)}</td><td>${esc(A.attemptLabel(a))}</td><td>${a.score}/${a.max}</td><td>${A.fmtNote(a.score, a.max)}</td></tr>`).join('') || '<tr><td colspan="4">Aucune</td></tr>'}</table>
<h2>Travaux pratiques</h2><table><tr><th>TP</th><th>Dépôt</th><th>Note</th><th>Retour</th></tr>${subs.map((s) => `<tr><td>TP ${s.tp} — ${esc(A.tp(s.tp).title)}</td><td>${A.fmtDate(s.date)}</td><td>${s.status === 'corrige' ? C.fr(s.grade, 1) + '/20' : 'en attente'}</td><td>${esc(s.feedback || '')}</td></tr>`).join('') || '<tr><td colspan="4">Aucun</td></tr>'}</table>
<h2>Évaluations de l’évolution (administration)</h2><table><tr><th>Date</th><th>Administrateur</th><th>Note globale</th><th>Notes par module</th><th>Appréciation</th></tr>${A.DB.evals.filter((e) => e.uid === u.id).sort((a, b) => a.date - b.date).map((e) => `<tr><td>${A.fmtDate(e.date)}</td><td>${esc(A.user(e.by).name)}</td><td>${C.fr(e.global, 1)}/20</td><td>${Object.entries(e.mods || {}).filter(([, v]) => v != null && v !== '').map(([k, v]) => 'M' + k + ' : ' + C.fr(v, 1)).join(' · ') || '—'}</td><td>${esc(e.comment)}</td></tr>`).join('') || '<tr><td colspan="5">Aucune</td></tr>'}</table>`;
  };
  A.act.dlReleve = () => { const u = A.me(); A.downloadPDF('Releve_' + A.slug(u.name), 'Relevé — ' + u.name, A.releve(u)); };
  A.csv = (rows) => '﻿' + rows.map((r) => r.map((c) => { const s = String(c == null ? '' : c); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(';')).join('\r\n');
  A.act.dlReleveCSV = () => { const u = A.me(); const rows = [['Date', 'Évaluation', 'Score', 'Maximum', 'Note sur 20']].concat(A.DB.attempts.filter((a) => a.uid === u.id).map((a) => [new Date(a.date).toLocaleString('fr-FR'), A.attemptLabel(a), a.score, a.max, C.fr(A.note20(a.score, a.max), 2)])).concat(A.subsOf(u.id).map((s) => [new Date(s.date).toLocaleString('fr-FR'), 'TP ' + s.tp, s.status === 'corrige' ? s.grade : '', 20, s.status === 'corrige' ? C.fr(s.grade, 2) : ''])); A.download('Releve_' + A.slug(u.name) + '.csv', A.csv(rows)); };

  // =========================================================== BIBLIOTHÈQUE
  const correctedDoc = (withImg) => {
    const sol = K.draw.map((d, i) => { const m = C.lib2D(d.target); return `<h3>Exercice ${i + 1} — ${esc(d.title)}</h3>${withImg ? `<figure><img data-mol2d="${esc(JSON.stringify({ lib: d.target, display: 'semi' }))}"><figcaption>${esc(C.LIB2D[d.target].n)}</figcaption></figure>` : ''}<p>Formule brute : <b>${C.formulaHTML(C.counts(m))}</b> · masse molaire ${C.fr(C.molarMass(C.counts(m)), 2)} g/mol · SMILES <code>${esc(C.toSMILES(m))}</code></p><p>Méthode : ${esc(d.hint)}</p>`; }).join('');
    const vs = [['CO₂', 'C', '2 voisins, 0 doublet non liant', 'AX₂', 'linéaire, 180°'], ['BF₃', 'B', '3 voisins, 0 doublet', 'AX₃', 'trigonale plane, 120°'], ['CH₄', 'C', '4 voisins, 0 doublet', 'AX₄', 'tétraédrique, 109,5°'], ['NH₃', 'N', '3 voisins, 1 doublet', 'AX₃E', 'pyramidale, ≈ 107°'], ['H₂O', 'O', '2 voisins, 2 doublets', 'AX₂E₂', 'coudée, ≈ 104,5°'], ['SF₆', 'S', '6 voisins, 0 doublet', 'AX₆', 'octaédrique, 90°'], ['Méthanal H₂C=O', 'C', '3 voisins (la double liaison compte pour un), 0 doublet', 'AX₃', 'trigonale plane, ≈ 120°']];
    return `<h1>Exercices corrigés</h1><p class="meta">Représentation 2D et géométrie 3D</p><h2>Partie A — Dessiner des molécules</h2>${sol}<h2>Partie B — Prévoir la géométrie (VSEPR)</h2><table><tr><th>Molécule</th><th>Atome central</th><th>Décompte</th><th>Type</th><th>Géométrie</th></tr>${vs.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</table>
<h2>Partie C — Calculs</h2><p><b>1.</b> Masse molaire de l’éthanol C₂H₆O : 2 × 12,011 + 6 × 1,008 + 15,999 = <b>46,07 g/mol</b>.</p><p><b>2.</b> Masse molaire de l’aspirine C₉H₈O₄ : 9 × 12,011 + 8 × 1,008 + 4 × 15,999 = <b>180,16 g/mol</b>.</p><p><b>3.</b> Combien d’hydrogènes porte le carbone du groupe –COOH ? Il est lié à un C (simple), un O (double) et un O (simple) : 1 + 2 + 1 = 4 → <b>0 hydrogène</b>.</p>`;
  };
  A.route(/^bibliotheque$/, () => {
    const docs = A.DB.docs, row = (t, s, act, id, extra) => `<div class="li"><span class="grow"><span class="t">${t}</span><br><span class="s">${s}</span></span>${extra || ''}<button class="btn sm" data-act="${act}" data-id="${id}">${I('down', 16)} Télécharger</button></div>`;
    return {
      title: 'Bibliothèque', html: head('Bibliothèque pédagogique', 'Supports téléchargeables : cours et fiches en PDF, images des composés, fichiers moléculaires pour ChemSketch et Avogadro.', A.can('cours.gerer') ? '<a class="btn pri" href="#gestion-cours">' + I('plus', 18) + ' Ajouter un document</a>' : '') + `
<div class="grid g2">
<div class="card"><h3>Cours complets</h3><div class="list">${K.modules.map((m) => row('Module ' + m.id + ' — ' + esc(m.short), A.lessonsOf(m.id).length + ' leçon(s) · PDF', 'dlModule', m.id)).join('')}${row('<b>Cours complet</b> — les sept modules', nLessons() + ' leçons, illustrations des composés · PDF', 'dlCourse', 'all')}</div></div>
<div class="card"><h3>Fiches de travaux pratiques</h3><div class="list">${K.tps.map((t) => row('TP ' + t.id + ' — ' + esc(t.title), esc(t.soft) + ' · PDF', 'dlTP', t.id)).join('')}</div></div>
<div class="card"><h3>Guides d’utilisation</h3><div class="list">${K.guides.map((g) => row(esc(g.title), 'PDF', 'dlGuide', g.id)).join('')}</div></div>
<div class="card"><h3>Exercices corrigés</h3><div class="list">${row('Exercices corrigés — représentation et géométrie', 'Solutions des exercices de dessin (avec les structures), VSEPR, calculs · PDF', 'dlCorrige', 'x')}</div>
<h3 style="margin-top:20px">Documents des enseignants</h3><div class="list">${docs.length ? docs.map((d) => row(esc(d.title), (d.mod ? 'Module ' + d.mod + ' · ' : '') + esc(d.name) + ' · ' + Math.ceil(d.size / 1024) + ' Ko', 'dlDoc', d.id)).join('') : '<p class="muted small">Aucun document importé pour l’instant.</p>'}</div></div>
</div>
<div class="card" style="margin-top:16px"><div class="row between"><div><h3 style="margin:0">Composés standard en image</h3><p class="muted small" style="margin:4px 0 0">${G.Compose.LIB.length} composés classés par famille : structure 2D en PNG ou SVG, modèle 3D en PNG, ouverture dans les ateliers.</p></div><button class="btn pri" data-act="openLib" data-into="">${I('lib', 18)} Parcourir les composés</button></div></div>
<div class="card" style="margin-top:16px"><div class="row between"><div><h3 style="margin:0">Fichiers d’exemples moléculaires</h3><p class="muted small" style="margin:4px 0 0">Archives .zip contenant .mol, .xyz et .sdf : ouvrez le .mol dans ChemSketch ou Avogadro, le .xyz dans Avogadro.</p></div><button class="btn pri" data-act="dlPack">${I('down', 18)} Pack complet (.zip)</button></div>
<div class="scroll" style="margin-top:12px"><table class="tbl stack"><thead><tr><th>Molécule</th><th>Géométrie</th><th>Formule</th><th></th></tr></thead><tbody>${C.REF3D_LIST.map(([k, n, g]) => { const m = C.REF3D[k](); return `<tr><td>${esc(n)}</td><td>${esc(g)}</td><td>${C.formulaHTML(C.counts(m, false))}</td><td class="num"><button class="btn sm ghost" data-act="open3D" data-id="${k}">${I('cube', 16)} 3D</button> <button class="btn sm" data-act="dlMol" data-id="${k}">${I('down', 16)} .zip</button> <button class="btn sm" data-act="refImg" data-id="${k}" data-d="2">${I('down', 16)} Image 2D</button> <button class="btn sm" data-act="refImg" data-id="${k}" data-d="3">${I('down', 16)} Image 3D</button></td></tr>`; }).join('')}</tbody></table></div></div>`
    };
  });
  A.act.dlGuide = (el) => { const g = K.guides.find((x) => x.id === el.dataset.id); A.downloadPDF(A.slug(g.title), g.title, `<h1>${esc(g.title)}</h1>` + g.body()); };
  A.act.dlCorrige = () => A.downloadPDF('Exercices_corriges', 'Exercices corrigés', correctedDoc(true));
  A.act.refImg = (el) => { const k = el.dataset.id, m = C.REF3D[k](); if (el.dataset.d === '3') A.dlMol3DImage(m, { name: A.slug(m.name) }); else { const m2 = C.to2D(m); m2.name = m.name; A.dlMol2DImage(m2, { name: A.slug(m.name), title: m.name }); } };
  A.act.dlMol = (el) => { const k = el.dataset.id, m = C.REF3D[k](), n = A.slug(m.name), mol = C.toMolfile(m, { name: n, d3: true }); A.download(n + '.zip', A.zip([{ name: n + '.mol', data: mol }, { name: n + '.xyz', data: C.toXYZ(m, n) }, { name: n + '.sdf', data: mol + '$$$$\n' }]), mol); };
  A.act.dlPack = () => {
    const files = [];
    C.REF3D_LIST.forEach(([k]) => { const m = C.REF3D[k](), n = A.slug(m.name); const mol = C.toMolfile(m, { name: n, d3: true }); files.push({ name: '3D/' + n + '.mol', data: mol }, { name: '3D/' + n + '.xyz', data: C.toXYZ(m, n) }); });
    Object.keys(C.LIB2D).forEach((k) => { const m = A.mol2DtoA(C.lib2D(k)), n = A.slug(C.LIB2D[k].n); files.push({ name: '2D/' + n + '.mol', data: C.toMolfile(m, { name: n }) }); });
    files.push({ name: 'LISEZMOI.txt', data: 'Fichiers moleculaires de la plateforme INFOCHIMIE UK.\r\n3D/ : geometries de reference (MOL 3D et XYZ) a ouvrir dans Avogadro.\r\n2D/ : structures planes (MOL 2D) a ouvrir dans ChemSketch ou Avogadro (optimiser ensuite la geometrie).\r\n' });
    A.download('Molecules_INFOCHIMIE_UK.zip', A.zip(files));
  };
  A.act.open3D = (el) => { A.pending3D = { mol: C.REF3D[el.dataset.id](), note: 'Géométrie de référence chargée depuis la bibliothèque.' }; A.go('atelier-3d'); };
  A.act.dlDoc = async (el) => { const d = A.DB.docs.find((x) => x.id === el.dataset.id); if (!d) return; await A.ensureFile(d); try { const [h, b64] = d.data.split(','); const bin = atob(b64), arr = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i); A.download(d.name, new Blob([arr], { type: (h.match(/data:([^;]+)/) || [])[1] || 'application/octet-stream' })); } catch (e) { A.toast('Document illisible.'); } };

  // =========================================================== VIDÉOS ET DÉMONSTRATIONS
  A.route(/^videos$/, () => {
    const vids = A.DB.videos;
    return {
      title: 'Vidéos', html: head('Vidéos et démonstrations', 'Démonstrations animées intégrées à la plateforme et vidéos ajoutées par les enseignants.') + `
<h2>Démonstrations animées</h2><div class="grid g3">
<div class="card" style="padding:0;overflow:hidden"><div class="v3d-host mini" id="dm1"></div><div style="padding:14px"><h3 style="margin:0 0 6px;font-size:17px">De la 2D à la 3D : le méthane</h3><p class="small muted">Un CH₄ dessiné à plat prend sa forme tétraédrique pendant l’optimisation.</p><button class="btn sm pri" id="dm1-go">${I('play', 16)} Lancer</button></div></div>
<div class="card" style="padding:0;overflow:hidden"><div class="v3d-host mini" id="dm2"></div><div style="padding:14px"><h3 style="margin:0 0 6px;font-size:17px">Mesurer l’angle de l’eau</h3><p class="small muted">Les trois atomes sélectionnés donnent l’angle H–O–H de 104,5°.</p><button class="btn sm pri" id="dm2-go">${I('spin', 16)} Faire tourner</button></div></div>
<div class="card" style="padding:0;overflow:hidden"><div class="v3d-host mini" id="dm3"></div><div style="padding:14px"><h3 style="margin:0 0 6px;font-size:17px">Le benzène s’aplatit</h3><p class="small muted">Un cycle déformé retrouve sa géométrie plane et ses angles de 120°.</p><button class="btn sm pri" id="dm3-go">${I('play', 16)} Lancer</button></div></div></div>
<h2 style="margin-top:30px">Vidéos des enseignants</h2>${vids.length ? `<div class="list">${vids.map((v) => `<a class="li" href="${esc(v.url)}" target="_blank" rel="noopener"><span class="num-pill">${I('play', 16)}</span><span class="grow"><span class="t">${esc(v.title)}</span><br><span class="s">${v.mod ? 'Module ' + v.mod + ' · ' : ''}s’ouvre dans un nouvel onglet</span></span></a>`).join('')}</div>` : `<div class="card empty">Aucune vidéo n’a encore été ajoutée.${A.can('cours.gerer') ? ' <a href="#gestion-cours">Ajouter une vidéo</a>' : ' Vos enseignants peuvent ajouter des liens vers leurs vidéos explicatives.'}</div>`}`,
      mount() {
        const flatCH4 = () => ({ name: 'Méthane (départ à plat)', atoms: [{ el: 'C', x: 0, y: 0, z: 0 }, { el: 'H', x: 1.09, y: 0, z: 0.02 }, { el: 'H', x: -1.09, y: 0, z: -0.03 }, { el: 'H', x: 0, y: 1.09, z: 0.04 }, { el: 'H', x: 0, y: -1.09, z: -0.02 }], bonds: [1, 2, 3, 4].map((b) => ({ a: 0, b, o: 1 })) });
        const v1 = new G.Viewer3D(document.getElementById('dm1'), { noWheel: true }); v1.setMolecule(flatCH4()); A.live.push(v1);
        document.getElementById('dm1-go').onclick = () => { v1.setMolecule(flatCH4(), true); setTimeout(() => v1.optimize(500), 300); };
        const v2 = new G.Viewer3D(document.getElementById('dm2'), { noWheel: true }); v2.setMolecule(C.REF3D.eau()); v2.setMode('mesurer'); v2.sel = [1, 0, 2]; v2.render(); A.live.push(v2);
        document.getElementById('dm2-go').onclick = () => v2.setSpin(!v2.spin);
        const bz = () => { const m = C.REF3D.benzene(); const r = C.mulberry32(5); m.atoms.forEach((a) => { a.x += (r() - 0.5) * 0.6; a.y += (r() - 0.5) * 0.6; a.z += (r() - 0.5) * 1.2; }); return m; };
        const v3 = new G.Viewer3D(document.getElementById('dm3'), { noWheel: true }); v3.setMolecule(bz()); A.live.push(v3);
        document.getElementById('dm3-go').onclick = () => { v3.setMolecule(bz(), true); setTimeout(() => v3.optimize(700), 300); };
      }
    };
  });

  // =========================================================== PROFIL
  A.route(/^profil$/, () => {
    const u = A.me();
    return {
      title: 'Profil', html: head('Profil utilisateur', esc(A.roleName[u.role]) + ' · inscrit le ' + A.fmtDate(u.created)) + `<div class="grid g2">
<form class="card" data-form="profile"><h3>Informations</h3>
<div class="field"><label for="pf-id">${A.identLabel[u.role]} <small>(code d’accès)</small></label><input id="pf-id" type="text" value="${esc(A.ident(u))}" disabled><small>Seul un administrateur peut modifier ce code d’accès.</small></div>
<div class="field"><label for="pf-n">Nom et prénom</label><input id="pf-n" name="name" type="text" value="${esc(u.name)}" required></div>
${u.role === 'enseignant' ? '' : `<div class="field"><label for="pf-e">Adresse e-mail <small>(facultatif)</small></label><input id="pf-e" name="email" type="email" value="${esc(u.email || '')}"></div>`}
${u.role === 'etudiant' ? `<div class="field"><label for="pf-f">Filière</label><select id="pf-f" name="filiere">${FILIERES.map((f) => `<option ${f === u.filiere ? 'selected' : ''}>${esc(f)}</option>`).join('')}</select></div>` : `<div class="field"><label for="pf-d">Département ou service</label><input id="pf-d" name="dept" type="text" value="${esc(u.dept || '')}"></div>`}
<button class="btn pri">Enregistrer</button></form>
<form class="card" data-form="password"><h3>Mot de passe</h3>${u.pwDefault ? '<div class="alert info" style="margin-top:0">Vous utilisez un mot de passe provisoire ou fourni par défaut : choisissez-en un personnel.</div>' : ''}<div class="field"><label for="pw-o">Mot de passe actuel</label><input id="pw-o" name="old" type="password" autocomplete="current-password" required></div><div class="field"><label for="pw-n">Nouveau mot de passe</label><input id="pw-n" name="pw" type="password" autocomplete="new-password" required><small>${esc(A.PW_HINT)}</small></div><div class="field"><label for="pw-c">Confirmation</label><input id="pw-c" name="pw2" type="password" autocomplete="new-password" required></div><div id="pw-err" aria-live="polite"></div><button class="btn pri">Changer le mot de passe</button></form>
</div>
<div class="card" style="margin-top:16px"><h3>Où sont enregistrées les données ?</h3><p class="small muted" style="margin:0">Les comptes, la progression et les dépôts sont enregistrés dans le navigateur de l’ordinateur qui héberge la plateforme. Utilisez toujours le même ordinateur et le même navigateur ; l’administration peut exporter une sauvegarde complète depuis « Évaluations et sauvegarde ».</p></div>`
    };
  });
  A.form.profile = (f, d) => {
    const u = A.me(); const n = String(d.get('name')).trim(); if (n.length < 3) return A.toast('Nom trop court.');
    if (d.has('email')) { const e = String(d.get('email') || '').trim().toLowerCase(); if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return A.toast('Adresse e-mail invalide.'); u.email = e; }
    u.name = n; if (u.role === 'etudiant') u.filiere = String(d.get('filiere')); else u.dept = String(d.get('dept') || '').trim();
    A.log('Profil modifié'); A.save(); A.toast('Profil enregistré'); A.render();
  };
  A.form.password = (f, d) => {
    const u = A.me(), e = (m) => { f.querySelector('#pw-err').innerHTML = `<div class="alert bad">${m}</div>`; };
    if (!A.checkPw(u, String(d.get('old')))) return e('Mot de passe actuel incorrect.');
    const p = String(d.get('pw')), pe = A.pwPolicy(p); if (pe) return e(pe);
    if (p !== String(d.get('pw2'))) return e('La confirmation ne correspond pas.');
    if (A.checkPw(u, p)) return e('Choisissez un mot de passe différent de l’actuel.');
    u.pw = A.hashPw(u.id, p); u.pwDefault = false; A.log('Mot de passe modifié'); A.save(); A.toast('Mot de passe modifié'); A.render();
  };
})(window);
