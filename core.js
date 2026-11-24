/* core.js — socle de l'application : stockage, comptes, rôles, routeur, coque, utilitaires */
(function (G) {
  'use strict';
  const C = G.Chem, K = G.CONTENT;
  const A = G.APP = { views: {}, act: {}, form: {}, chg: {}, live: [], timers: [] };

  // ---------- utilitaires ----------
  const esc = A.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  A.$ = (s, r = document) => r.querySelector(s); A.$$ = (s, r = document) => [...r.querySelectorAll(s)];
  A.uid = (p = '') => p + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
  A.fmtDate = (t, time) => { if (!t) return '—'; const d = new Date(t); return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) + (time ? ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''); };
  A.note20 = (s, m) => (m ? (s / m) * 20 : 0);
  A.fmtNote = (s, m) => (m ? C.fr(A.note20(s, m), 1) + '/20' : '—');
  A.pct = (s, m) => (m ? Math.round((s / m) * 100) : 0);
  A.initials = (n) => { const w = String(n || '?').split(/\s+/).filter((x) => x && !/^(dr|pr|m\.|mme|de|la|le|du|des|d’)$/i.test(x)); return ((w[0] || '?')[0] + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase(); };
  A.normAns = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[₀-₉]/g, (d) => String(d.charCodeAt(0) - 8320)).replace(/[\s°]/g, '').replace(/,/g, '.');
  A.shuffle = (arr, seed) => { const r = C.mulberry32(seed || Date.now()); const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  A.roleName = { etudiant: 'Étudiant', enseignant: 'Enseignant', admin: 'Administrateur' };

  // SHA-256 (démo : mot de passe salé par l'e-mail ; un vrai serveur utiliserait bcrypt ou Argon2)
  function sha256(str) {
    const s = unescape(encodeURIComponent(str)); const rr = (v, a) => (v >>> a) | (v << (32 - a));
    const K2 = [], H = []; let p = 2;
    for (let n = 0; n < 64; p++) { let prime = true; for (let f = 2; f * f <= p; f++) if (p % f === 0) { prime = false; break; } if (prime) { if (n < 8) H[n] = (Math.pow(p, 1 / 2) * 4294967296) | 0; K2[n++] = (Math.pow(p, 1 / 3) * 4294967296) | 0; } }
    const words = []; const bl = s.length * 8; let m = s + '\x80'; while (m.length % 64 - 56) m += '\x00';
    for (let i = 0; i < m.length; i++) words[i >> 2] |= m.charCodeAt(i) << ((3 - i) % 4) * 8;
    words[words.length] = (bl / 4294967296) | 0; words[words.length] = bl;
    for (let j = 0; j < words.length;) {
      const w = words.slice(j, j += 16), old = H.slice(0, 8);
      for (let i = 0; i < 64; i++) {
        const w15 = w[i - 15], w2 = w[i - 2], a = H[0], e = H[4];
        const t1 = H[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & H[5]) ^ (~e & H[6])) + K2[i] + (w[i] = i < 16 ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
        const t2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & H[1]) ^ (a & H[2]) ^ (H[1] & H[2]));
        H.unshift((t1 + t2) | 0); H[4] = (H[4] + t1) | 0; H.length = 8;
      }
      for (let i = 0; i < 8; i++) H[i] = (H[i] + old[i]) | 0;
    }
    return H.map((h) => (h >>> 0).toString(16).padStart(8, '0')).join('');
  }
  // empreinte salée par l'identifiant interne du compte ; le mot de passe est normalisé (é composé ou décomposé)
  A.hashPw = (key, pw) => sha256(String(key) + '::' + String(pw).normalize('NFC'));
  A.DEMO_PW = 'Guinée224@';
  A.PW_HINT = 'Au moins 8 caractères, avec une majuscule, une minuscule, un chiffre et un caractère spécial (exemple : Guinée224@).';
  A.pwPolicy = (p) => {
    p = String(p || '');
    if (p.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
    if (!/\p{Lu}/u.test(p)) return 'Le mot de passe doit contenir au moins une lettre majuscule.';
    if (!/\p{Ll}/u.test(p)) return 'Le mot de passe doit contenir au moins une lettre minuscule.';
    if (!/\d/.test(p)) return 'Le mot de passe doit contenir au moins un chiffre.';
    if (!/[^\p{L}\d\s]/u.test(p)) return 'Le mot de passe doit contenir au moins un caractère spécial (@, #, !, $…).';
    return '';
  };
  A.tmpPw = () => { const l = 'abcdefghjkmnpqrstuvwxyz', r = (n, set) => [...Array(n)].map(() => set[Math.floor(Math.random() * set.length)]).join(''); return 'Chim@' + r(4, l) + r(1, l.toUpperCase()) + r(3, '23456789'); };
  A.MATRICULE_RE = /^[A-Za-z0-9-]{6,20}$/;

  // ---------- stockage ----------
  const KEY = 'csa-plateforme-v1';
  A.storageOK = true;
  function load() { try { const s = G.localStorage.getItem(KEY); return s ? JSON.parse(s) : null; } catch (e) { A.storageOK = false; return null; } }
  A.save = () => { try { G.localStorage.setItem(KEY, JSON.stringify(A.DB)); A.storageOK = true; } catch (e) { A.storageOK = false; if (e && /quota/i.test(e.name + e.message)) A.toast('Espace de stockage du navigateur plein : supprimez des fichiers déposés.'); } };
  A.PERMS = [
    ['cours.lire', 'Consulter les cours et la bibliothèque'], ['tp.deposer', 'Déposer des travaux pratiques'], ['eval.passer', 'Passer les tests et examens'],
    ['cours.gerer', 'Créer et publier des cours, vidéos, documents'], ['questions.gerer', 'Créer des questionnaires'], ['travaux.corriger', 'Corriger et noter les travaux'],
    ['resultats.voir', 'Suivre les résultats de tous les étudiants'], ['users.gerer', 'Gérer les utilisateurs'], ['stats.voir', 'Consulter statistiques et journal'], ['plateforme.admin', 'Administration générale']
  ];
  const defPerms = () => ({
    etudiant: { 'cours.lire': true, 'tp.deposer': true, 'eval.passer': true },
    enseignant: { 'cours.lire': true, 'cours.gerer': true, 'questions.gerer': true, 'travaux.corriger': true, 'resultats.voir': true, 'stats.voir': true },
    admin: Object.fromEntries(A.PERMS.map(([k]) => [k, true]))
  });

  // base de départ : uniquement les deux comptes administrateurs (aucun compte de démonstration)
  function seed() {
    const now = Date.now();
    const U = (id, name, role, extra) => ({ id, name, role, pw: A.hashPw(id, A.DEMO_PW), active: true, created: now, ...extra });
    const users = [
      U('u-adm1', 'M. Alhouseny CISSE', 'admin', { code: 'ADM-001', titre: 'Administrateur principal', dept: 'Administration de la plateforme', pwDefault: true }),
      U('u-adm2', 'Sory BAGAYOKO', 'admin', { code: 'ADM-002', titre: 'Administrateur, assistant', dept: 'Administration de la plateforme', pwDefault: true })
    ];
    return {
      v: 2, demo: false, evals: [], users, session: null, progress: {}, attempts: [], subs: [], notifs: [], logs: [{ id: A.uid('l-'), date: now, uid: null, act: 'Création de la plateforme', det: 'comptes administrateurs' }],
      lessons: [], questions: [], videos: [], docs: [], mols: {}, draws: {},
      modState: Object.fromEntries(K.modules.map((m) => [m.id, true])), perms: defPerms(),
      settings: { examMin: 20, examN: 15, examMax: 3, examOpen: true }, seededAt: now, liveAt: now
    };
  }
  // suppression des comptes de démonstration (anciennes bases) et de tout ce qui leur est rattaché
  A.purgeDemo = () => {
    const D = A.DB, demo = new Set(D.users.filter((u) => u.demo).map((u) => u.id));
    if (demo.size) {
      const keep = (uid) => !demo.has(uid);
      D.users = D.users.filter((u) => !demo.has(u.id)); D.attempts = D.attempts.filter((a) => keep(a.uid)); D.subs = D.subs.filter((x) => keep(x.uid));
      D.notifs = D.notifs.filter((n) => keep(n.uid)); D.evals = D.evals.filter((e) => keep(e.uid)); D.logs = D.logs.filter((l) => !l.uid || keep(l.uid));
      ['progress', 'mols', 'draws'].forEach((k) => Object.keys(D[k] || {}).forEach((id) => { if (demo.has(id)) delete D[k][id]; }));
    }
    D.demo = false; D.liveAt = D.liveAt || Date.now();
    return demo.size;
  };
  // remplacement complet de la base (réinitialisation, restauration) ; en ligne, cloud.js remplace ces fonctions
  A.replaceDB = (o, after) => { A.DB = o; A.save(); if (after) after(); };
  A.reset = () => A.replaceDB(seed());
  A.lookupUser = async () => {};
  A.ensureFile = async (f) => f;
  A.ensureFiles = (list) => Promise.all((list || []).map((f) => A.ensureFile(f)));
  A.DB = load(); if (!A.DB || A.DB.v !== 2) { A.DB = seed(); A.save(); }
  if (!A.DB.evals) A.DB.evals = [];

  // ---------- session, rôles, journal ----------
  A.me = () => A.DB.users.find((u) => u.id === A.DB.session && u.active !== false) || null;
  A.user = (id) => A.DB.users.find((u) => u.id === id) || { name: 'Compte supprimé', id };
  A.can = (p) => { const u = A.me(); return !!(u && A.DB.perms[u.role] && A.DB.perms[u.role][p]); };
  A.log = (act, det) => { const u = A.me(); A.DB.logs.unshift({ date: Date.now(), uid: u ? u.id : null, act, det: det || '' }); if (A.DB.logs.length > 400) A.DB.logs.length = 400; };
  A.notify = (uid, text, link) => { A.DB.notifs.unshift({ id: A.uid('n-'), uid, text, link, date: Date.now(), read: false }); };
  A.ident = (u) => (u.role === 'etudiant' ? u.matricule : u.role === 'admin' ? u.code : u.email) || '—';
  A.identLabel = { etudiant: 'Matricule', enseignant: 'E-mail', admin: 'Code identifiant' };
  A.findUser = (kind, idf) => {
    const low = String(idf || '').trim().toLowerCase(); if (!low) return null;
    const f = kind === 'etudiant' ? 'matricule' : kind === 'admin' ? 'code' : 'email';
    return A.DB.users.find((u) => u.role === kind && String(u[f] || '').toLowerCase() === low) || null;
  };
  A.findAny = (idf) => A.findUser('etudiant', idf) || A.findUser('enseignant', idf) || A.findUser('admin', idf);
  A.checkPw = (u, pw) => u.pw === A.hashPw(u.id, pw);
  A.admins = () => A.DB.users.filter((u) => u.role === 'admin');
  A.lastEval = (uid) => A.DB.evals.filter((e) => e.uid === uid).sort((a, b) => b.date - a.date)[0] || null;
  A.login = (u) => { A.DB.session = u.id; u.last = Date.now(); A.log('Connexion', A.roleName[u.role]); A.save(); };
  A.logout = () => { A.log('Déconnexion'); A.DB.session = null; A.save(); A.go('accueil'); };

  // ---------- contenus ----------
  A.mod = (id) => K.modules.find((m) => m.id === +id);
  A.modVisible = (id) => A.DB.modState[id] !== false || A.can('cours.gerer');
  A.lessonsOf = (modId, all) => {
    const m = A.mod(modId); const base = m ? m.lessons : [];
    const extra = A.DB.lessons.filter((l) => l.mod === +modId && (all || l.published)).map((l) => ({ ...l, custom: true }));
    return base.concat(extra);
  };
  A.findLesson = (id) => { for (const m of K.modules) { const l = A.lessonsOf(m.id, true).find((x) => x.id === id); if (l) return l; } return null; };
  A.quizOf = (modId) => (A.mod(modId) ? A.mod(modId).quiz : []).concat(A.DB.questions.filter((q) => q.mod === +modId));
  A.done = (uid, lid) => !!(A.DB.progress[uid] && A.DB.progress[uid][lid]);
  A.modProgress = (uid, modId) => { const ls = A.lessonsOf(modId); const d = ls.filter((l) => A.done(uid, l.id)).length; return { d, n: ls.length, p: ls.length ? Math.round((d / ls.length) * 100) : 0 }; };
  A.totalProgress = (uid) => { let d = 0, n = 0; K.modules.forEach((m) => { if (A.DB.modState[m.id] === false) return; const p = A.modProgress(uid, m.id); d += p.d; n += p.n; }); return n ? Math.round((d / n) * 100) : 0; };
  A.attemptsOf = (uid, kind, ref) => A.DB.attempts.filter((a) => a.uid === uid && (!kind || a.kind === kind) && (ref == null || String(a.ref) === String(ref)));
  A.best = (uid, kind, ref) => { const l = A.attemptsOf(uid, kind, ref); if (!l.length) return null; return l.reduce((b, a) => (a.score / a.max > b.score / b.max ? a : b)); };
  A.avgModules = (uid) => { const vals = K.modules.filter((m) => m.quiz.length).map((m) => A.best(uid, 'module', m.id)).filter(Boolean).map((a) => a.score / a.max); return vals.length ? vals.reduce((s, x) => s + x, 0) / vals.length : null; };
  A.students = () => A.DB.users.filter((u) => u.role === 'etudiant');
  A.subsOf = (uid) => A.DB.subs.filter((s) => s.uid === uid);
  A.tp = (id) => K.tps.find((t) => t.id === +id);

  // ---------- icônes ----------
  const IC = {
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>', book: '<path d="M4 4h10a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z"/><path d="M8 9h6"/>',
    hex: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><circle cx="12" cy="12" r="2"/>', cube: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
    flask: '<path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3"/><path d="M7 15h10"/>', pencil: '<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/>',
    clip: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9z"/><path d="M9 13l2 2 4-4"/>', chart: '<path d="M4 20V4M4 20h16"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="7" width="3" height="10"/><rect x="17" y="13" width="3" height="4"/>',
    lib: '<path d="M4 4h4v16H4zM10 4h4v16h-4z"/><path d="M16 5l4 1-3 14-4-1z"/>', video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>', log: '<path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    check: '<path d="M5 12l5 5L20 7"/>', bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>', logout: '<path d="M15 4h4v16h-4"/><path d="M10 8l-4 4 4 4M6 12h10"/>',
    down: '<path d="M12 4v11M7 10l5 5 5-5"/><path d="M5 20h14"/>', up: '<path d="M12 20V9M7 14l5-5 5 5"/><path d="M5 4h14"/>', play: '<path d="M8 5l11 7-11 7z"/>', plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V4h12"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>', redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>',
    fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', zin: '<circle cx="11" cy="11" r="7"/><path d="M8 11h6M11 8v6M20 20l-4-4"/>', zout: '<circle cx="11" cy="11" r="7"/><path d="M8 11h6M20 20l-4-4"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', back: '<path d="M19 12H5M11 6l-6 6 6 6"/>', spin: '<path d="M20 12a8 8 0 1 1-3-6.2"/><path d="M20 4v5h-5"/>'
  };
  A.icon = (n, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n] || ''}</svg>`;
  A.logo = (s = 36) => `<svg width="${s}" height="${s}" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="10" fill="#0b5cab"/><path d="M20 8l10.4 6v12L20 32 9.6 26V14z" fill="none" stroke="#fff" stroke-width="2.2"/><path d="M13 16.5v7M27 16.5v7" stroke="#fff" stroke-width="1.4" opacity=".55"/><circle cx="20" cy="8" r="3.4" fill="#f39a4b"/><circle cx="30.4" cy="26" r="3.4" fill="#fff"/><circle cx="9.6" cy="26" r="3.4" fill="#7fd6a4"/></svg>`;

  // ---------- fenêtres, messages ----------
  A.toast = (msg) => { const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 3200); };
  A.modal = (html, opt = {}) => {
    A.closeModal(); const bg = document.createElement('div'); bg.className = 'modal-bg'; bg.id = 'modal';
    bg.innerHTML = `<div class="modal${opt.wide ? ' wide' : ''}" role="dialog" aria-modal="true">${html}</div>`;
    bg.addEventListener('click', (e) => { if (e.target === bg) A.closeModal(); });
    document.body.appendChild(bg); const f = bg.querySelector('input,select,textarea,button'); if (f) f.focus({ preventScroll: true });
    if (opt.mount) opt.mount(bg); return bg;
  };
  A.closeModal = () => { const m = document.getElementById('modal'); if (m) { A.$$('.v3d-host, .ed-host', m).forEach((h) => { if (h._w) { h._w.destroy(); A.live = A.live.filter((w) => w !== h._w); } }); m.remove(); } };
  A.go = (h) => { if (decodeURIComponent(location.hash.replace(/^#/, '')) === h) A.render(); else location.hash = '#' + h; };
  A.confirm = (text, yes, label = 'Confirmer', danger = true) => {
    A.modal(`<h3>Confirmation</h3><p>${text}</p><div class="row" style="justify-content:flex-end"><button class="btn" data-act="closeModal">Annuler</button><button class="btn ${danger ? 'warn' : 'pri'}" id="cf-yes">${esc(label)}</button></div>`);
    document.getElementById('cf-yes').onclick = () => { A.closeModal(); yes(); };
  };
  A.act.closeModal = () => A.closeModal();
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') A.closeModal(); });

  // ---------- téléchargements (capacité downloads de l'artefact, sinon repli) ----------
  A.DL = null;
  (async () => { try { if (G.claude && G.claude.use) A.DL = await G.claude.use('downloads'); } catch (e) { A.DL = null; } })();
  A.download = async (filename, data, textFallback) => {
    if (A.DL) {
      try { await A.DL.save({ filename, data }); A.toast('Fichier prêt : ' + filename); } catch (e) {
        if (e && e.code === 'declined') return;
        if (textFallback) A.showText(filename, textFallback); else A.toast('Téléchargement impossible ici (' + ((e && e.code) || 'erreur') + ').');
      }
      return;
    }
    if (G.self !== G.top) { if (textFallback || typeof data === 'string') A.showText(filename, textFallback || data); else A.toast('Le téléchargement n’est pas disponible dans cette vue.'); return; }
    try { const b = data instanceof Blob ? data : new Blob([data]); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
    catch (e) { if (typeof data === 'string') A.showText(filename, data); }
  };
  A.copy = async (text, what) => { try { await navigator.clipboard.writeText(text); A.toast((what || 'Texte') + ' copié'); } catch (e) { A.showText(what || 'Texte', text); } };
  A.showText = (title, text) => {
    A.modal(`<h3>${esc(title)}</h3><p class="muted small">Copiez ce contenu dans un fichier texte portant ce nom.</p><pre id="st-pre">${esc(String(text).slice(0, 200000))}</pre><div class="row" style="justify-content:flex-end"><button class="btn" data-act="closeModal">Fermer</button><button class="btn pri" id="st-copy">${A.icon('copy', 18)} Copier</button></div>`);
    document.getElementById('st-copy').onclick = () => A.copy(text, title);
  };
  // archive ZIP (méthode « stockée », sans compression) : les fichiers .mol/.xyz voyagent dans un .zip
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  A.zip = (files) => {
    const enc = new TextEncoder(), parts = [], cen = []; let off = 0;
    const d = new Date(), dt = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)), dd = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate());
    files.forEach((f) => {
      const name = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data);
      const h = new DataView(new ArrayBuffer(30)); h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, dt, true); h.setUint16(12, dd, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), name, data);
      const c = new DataView(new ArrayBuffer(46)); c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true); c.setUint16(12, dt, true); c.setUint16(14, dd, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, off, true);
      cen.push(new Uint8Array(c.buffer), name); off += 30 + name.length + data.length;
    });
    const csize = cen.reduce((s, x) => s + x.length, 0);
    const e = new DataView(new ArrayBuffer(22)); e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csize, true); e.setUint32(16, off, true);
    return new Blob(parts.concat(cen, [new Uint8Array(e.buffer)]), { type: 'application/zip' });
  };
  A.slug = (s) => String(s || 'molecule').replace(/[₀-₉]/g, (d) => String(d.charCodeAt(0) - 8320)).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40) || 'molecule';
  // document HTML autonome (consultable hors connexion, imprimable)
  A.htmlDoc = (title, body) => `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>body{font:16px/1.6 'Segoe UI',system-ui,sans-serif;color:#14202c;max-width:820px;margin:32px auto;padding:0 20px}h1{font-size:28px;color:#0b5cab;margin-bottom:4px}h2{font-size:22px;margin-top:32px;border-bottom:2px solid #e3eefa;padding-bottom:4px}h3{font-size:18px;margin-top:22px}table{border-collapse:collapse;width:100%;margin:10px 0}th,td{border:1px solid #d9e0e8;padding:6px 9px;text-align:left;vertical-align:top}th{background:#f3f6fa}.note{background:#e3eefa;padding:10px 14px;border-radius:8px}.sum{background:#e2f4ea;padding:10px 16px;border-radius:8px}.meta{color:#5a6776}footer{margin-top:40px;color:#5a6776;font-size:13px;border-top:1px solid #d9e0e8;padding-top:10px}@media print{body{margin:0}}</style></head><body>${body}<footer>Plateforme INFOCHIMIE UK — cours « ChemSketch et Avogadro : dessiner les structures 2D et 3D » — document généré le ${new Date().toLocaleDateString('fr-FR')}.</footer></body></html>`;

  // ---------- routeur et coque ----------
  A.routes = [];
  A.route = (re, fn, opt) => A.routes.push([re, fn, opt || {}]);
  A.cleanup = () => { A.live.forEach((w) => { try { w.destroy && w.destroy(); } catch (e) {} }); A.live = []; A.timers.forEach((t) => clearInterval(t)); A.timers = []; };
  A.current = '';
  A.render = () => {
    A.cleanup(); A.closeModal();
    const h = decodeURIComponent(location.hash.replace(/^#/, '')); const u = A.me();
    let hit = null; for (const [re, fn, opt] of A.routes) { const m = h.match(re); if (m) { hit = { m, fn, opt }; break; } }
    if (!hit) { location.replace('#' + (u ? 'tableau' : 'accueil')); return; }
    if (!hit.opt.public && !u) { A.after = h; location.replace('#connexion'); return; }
    if (u && hit.opt.guest) { location.replace('#tableau'); return; }
    let v;
    if (hit.opt.admin && (!u || u.role !== 'admin')) v = { title: 'Accès réservé', html: `<div class="card empty"><h2>Fenêtre réservée aux administrateurs</h2><p>Cette page n’est accessible qu’aux administrateurs de la plateforme.</p><a class="btn pri" href="#tableau">Retour au tableau de bord</a></div>` };
    else if (hit.opt.perm && !A.can(hit.opt.perm)) v = { title: 'Accès refusé', html: `<div class="card empty"><h2>Accès refusé</h2><p>Votre rôle ne permet pas d’ouvrir cette page.</p><a class="btn pri" href="#tableau">Retour au tableau de bord</a></div>` };
    else v = hit.fn(hit.m) || { html: '' };
    const pub = hit.opt.public && (!u || hit.opt.bare);
    document.title = (v.title ? v.title + ' · ' : '') + 'INFOCHIMIE UK';
    const app = document.getElementById('app');
    app.className = pub ? 'public' : '';
    const strip = (A.storageOK ? '' : '<div class="demo-strip">Le stockage de ce navigateur est indisponible : vos données seront perdues à la fermeture de la page.</div>') +
      (u && u.pwDefault && !pub ? '<div class="demo-strip">Vous utilisez un mot de passe provisoire ou fourni par défaut. <a href="#profil">Changez-le maintenant</a>.</div>' : '');
    app.innerHTML = A.topbar(u, pub) + strip +
      (pub ? `<main id="main">${v.html}</main>${A.credit(u)}` : `<div class="shell">${A.sidebar(u, h)}<main id="main" tabindex="-1">${v.html}${A.credit(u)}</main></div>`);
    if (A.current !== h) { G.scrollTo(0, 0); A.current = h; }
    if (v.mount) { try { v.mount(); } catch (e) { console.error(e); A.toast('Erreur d’affichage : ' + e.message); } }
    A.mountWidgets(app);
  };
  A.topbar = (u, pub) => {
    const unread = u ? A.DB.notifs.filter((n) => n.uid === u.id && !n.read).length : 0;
    return `<header class="topbar"><a class="brand" href="#${u ? 'tableau' : 'accueil'}">${A.logo()}<span class="bt">INFOCHIMIE UK<small>Informatique appliquée à la chimie</small></span></a><span class="sp"></span>${A.cloudPill ? A.cloudPill() : ''}` +
      (u ? `<button class="iconbtn" data-act="notifs" aria-label="Notifications (${unread} non lues)">${A.icon('bell', 22)}${unread ? `<span class="dot">${unread}</span>` : ''}</button>
      <div class="userchip"><span class="avatar">${esc(A.initials(u.name))}</span><span class="who">${esc(u.name)}<small>${A.roleName[u.role]}</small></span></div>
      ${pub ? '<a class="btn sm pri" href="#tableau">Mon espace</a>' : ''}<button class="iconbtn" data-act="logout" aria-label="Se déconnecter" title="Se déconnecter">${A.icon('logout', 22)}</button>`
        : `<nav class="top-links"><a href="#accueil" class="hide-s">Accueil</a><a href="#connexion">Connexion</a><a class="btn sm pri" href="#inscription">Créer un compte</a></nav>`) + `</header>`;
  };
  A.credit = (u) => `<footer class="credit"><span>Développée par <b>M. Alhouseny CISSE</b> et son assistant <b>Sory BAGAYOKO</b></span>${u ? '' : '<a href="#connexion-admin">Espace administrateur</a>'}</footer>`;
  A.navFor = (u) => {
    const n = [];
    if (u.role === 'etudiant') n.push(['Apprendre'], ['tableau', 'Tableau de bord', 'home'], ['cours', 'Cours et modules', 'book'], ['videos', 'Vidéos et démonstrations', 'video'], ['bibliotheque', 'Bibliothèque', 'lib'],
      ['Pratiquer'], ['atelier-2d', 'Atelier 2D', 'hex'], ['atelier-3d', 'Atelier 3D', 'cube'], ['tp', 'Travaux pratiques', 'flask'], ['exercices', 'Exercices', 'pencil'],
      ['Évaluer'], ['evaluations', 'Évaluations', 'clip'], ['resultats', 'Résultats et progression', 'chart'], ['Compte'], ['profil', 'Profil', 'user']);
    if (u.role === 'enseignant') n.push(['Enseigner'], ['tableau', 'Tableau de bord', 'home'], ['gestion-cours', 'Gestion des cours', 'book'], ['questionnaires', 'Exercices et questionnaires', 'pencil'], ['corrections', 'Corrections', 'check'], ['suivi', 'Suivi des étudiants', 'chart'],
      ['Ressources'], ['cours', 'Voir les cours', 'eye'], ['bibliotheque', 'Bibliothèque', 'lib'], ['videos', 'Vidéos', 'video'], ['atelier-2d', 'Atelier 2D', 'hex'], ['atelier-3d', 'Atelier 3D', 'cube'], ['tp', 'Fiches de TP', 'flask'], ['Compte'], ['profil', 'Profil', 'user']);
    if (u.role === 'admin') n.push(['Administrer'], ['tableau', 'Tableau de bord', 'home'], ['controle', 'Contrôle des étudiants', 'eye'], ['utilisateurs', 'Utilisateurs', 'users'], ['gestion-cours', 'Cours et modules', 'book'], ['parametres', 'Évaluations et sauvegarde', 'gear'], ['autorisations', 'Autorisations', 'shield'], ['journal', 'Journal et statistiques', 'log'],
      ['Contenus'], ['cours', 'Voir les cours', 'book'], ['bibliotheque', 'Bibliothèque', 'lib'], ['atelier-3d', 'Atelier 3D', 'cube'], ['Compte'], ['profil', 'Profil', 'user']);
    return n;
  };
  A.sidebar = (u, h) => {
    const top = h.split('-')[0]; const pend = A.can('travaux.corriger') ? A.DB.subs.filter((s) => s.status === 'rendu').length : 0;
    const isOn = (r) => h === r || (r === 'cours' && /^(module|lecon|quiz)-/.test(h)) || (r === 'tp' && /^tp-/.test(h)) || (r === 'exercices' && /^(dessin|reconnaissance)/.test(h)) || (r === 'evaluations' && h === 'examen') || (r === 'controle' && /^controle-/.test(h));
    return `<nav class="side" aria-label="Navigation principale">` + A.navFor(u).map((x) => x.length === 1 ? `<div class="grp">${x[0]}</div>` :
      `<a href="#${x[0]}" class="${isOn(x[0]) ? 'on' : ''}">${A.icon(x[2])}<span>${x[1]}</span>${x[0] === 'corrections' && pend ? `<span class="badge orange">${pend}</span>` : ''}</a>`).join('') + `</nav>`;
  };
  A.act.logout = () => A.logout();
  A.act.notifs = (el) => {
    const u = A.me(); const ex = document.querySelector('.notif-pop'); if (ex) { ex.remove(); return; }
    const list = A.DB.notifs.filter((n) => n.uid === u.id).slice(0, 12);
    const pop = document.createElement('div'); pop.className = 'notif-pop';
    pop.innerHTML = `<div class="row between"><h4 style="margin:0">Notifications</h4>${list.some((n) => !n.read) ? '<button class="btn sm ghost" data-act="readAll">Tout marquer comme lu</button>' : ''}</div>` +
      (list.length ? list.map((n) => `<a class="notif ${n.read ? '' : 'unread'}" href="#${esc(n.link || 'tableau')}" data-act="openNotif" data-id="${n.id}" style="display:block;text-decoration:none;color:inherit">${esc(n.text)}<small>${A.fmtDate(n.date, true)}</small></a>`).join('') : '<p class="empty">Aucune notification.</p>');
    document.querySelector('.topbar').appendChild(pop);
  };
  A.act.readAll = () => { const u = A.me(); A.DB.notifs.forEach((n) => { if (n.uid === u.id) n.read = true; }); A.save(); A.render(); };
  A.act.openNotif = (el) => { const n = A.DB.notifs.find((x) => x.id === el.dataset.id); if (n) { n.read = true; A.save(); } A.go((n && n.link) || 'tableau'); };
  document.addEventListener('click', (e) => {
    const pop = document.querySelector('.notif-pop'); if (pop && !e.target.closest('.notif-pop') && !e.target.closest('[data-act="notifs"]')) pop.remove();
    const el = e.target.closest('[data-act]'); if (!el) return; const fn = A.act[el.dataset.act]; if (!fn) return;
    e.preventDefault();
    fn(el, e);
  });
  document.addEventListener('submit', (e) => { const f = e.target.closest('form[data-form]'); if (!f) return; e.preventDefault(); const fn = A.form[f.dataset.form]; if (fn) fn(f, new FormData(f)); });
  document.addEventListener('change', (e) => { const el = e.target.closest('[data-chg]'); if (!el) return; const fn = A.chg[el.dataset.chg]; if (fn) fn(el, e); });

  // ---------- widgets intégrés aux pages (figures de cours) ----------
  A.mountWidgets = (root) => {
    A.$$('[data-v3d]', root).forEach((host) => {
      if (host._w) return; const o = JSON.parse(host.dataset.v3d || '{}');
      const info = host.parentElement.querySelector('.figinfo');
      const v = new G.Viewer3D(host, { spin: o.spin, style: o.style, labels: o.labels, noWheel: o.noWheel, onInfo: (h) => { if (info) info.innerHTML = h || ''; } });
      let m = null; if (o.mol && C.REF3D[o.mol]) m = C.REF3D[o.mol](); else if (o.lib) m = C.build3D(C.lib2D(o.lib));
      if (m) v.setMolecule(m);
      if (o.mode) v.setMode(o.mode);
      if (o.el) v.el = o.el;
      if (info && !o.mode) info.innerHTML = '<span class="muted">Cliquez sur un atome pour afficher sa géométrie.</span>';
      if (info && o.mode === 'mesurer') info.innerHTML = '<span class="muted">Cliquez sur 2, 3 ou 4 atomes.</span>';
      const bar = host.parentElement.querySelector('.figbar');
      if (bar) bar.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.m) { v.setMode(b.dataset.m); A.$$('button[data-m]', bar).forEach((x) => x.classList.toggle('on', x === b)); }
        if (b.dataset.e) { v.el = b.dataset.e; A.$$('button[data-e]', bar).forEach((x) => x.classList.toggle('on', x === b)); if (v.mode !== 'ajouter') { v.setMode('ajouter'); A.$$('button[data-m]', bar).forEach((x) => x.classList.toggle('on', x.dataset.m === 'ajouter')); } }
        if (b.dataset.r) { v.setMolecule(C.REF3D[o.mol] ? C.REF3D[o.mol]() : v.getMol()); }
        if (b.dataset.opt) v.optimize(600);
        if (b.dataset.png) A.dlMol3DImage(v);
      });
      host._w = v; A.live.push(v);
    });
    A.$$('[data-ed2d]', root).forEach((host) => {
      if (host._w) return; const o = JSON.parse(host.dataset.ed2d || '{}');
      const info = host.parentElement.querySelector('.figinfo');
      const ed = new G.Editor2D(host, { onChange: (m) => { if (info) info.innerHTML = A.molSummary(m); } });
      if (o.display) ed.display = o.display;
      if (o.lib) ed.load(C.lib2D(o.lib), true); host._w = ed; A.live.push(ed);
      if (info) info.innerHTML = A.molSummary(ed.getMol());
      const bar = host.parentElement.querySelector('.figbar');
      if (bar) bar.addEventListener('click', (e) => { const p = e.target.closest('button[data-png]'); if (p) { A.dlMol2DImage(ed.getMol(), { display: ed.display }); return; } const b = e.target.closest('button[data-d]'); if (!b) return; if (b.dataset.d === 'undo') ed.undo(); else if (b.dataset.d === 'reset') ed.load(C.lib2D(o.lib)); else { ed.display = b.dataset.d; ed.render(); A.$$('button[data-d]', bar).forEach((x) => x.classList.toggle('on', x === b)); } });
    });
  };
  A.molSummary = (m) => {
    if (!m.atoms.length) return '<span class="muted">Zone vide.</span>';
    const c = C.counts(m), r = C.recognize(m);
    return `<b>${C.formulaHTML(c)}</b> · ${C.fr(C.molarMass(c), 2)} g/mol${r ? ` · <span class="badge green">${esc(r.name)}</span>` : ''}`;
  };
  // re-dessin des canevas au changement de thème
  const rerender = () => A.live.forEach((w) => w.render && w.render());
  try { G.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', rerender); } catch (e) {}
  new MutationObserver(rerender).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  G.addEventListener('hashchange', () => A.render());
})(window);
