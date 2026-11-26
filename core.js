/* core.js — socle de l'application : stockage, comptes, rôles, routeur, coque, utilitaires */
(function (G) {
  'use strict';
  const C = G.Chem, K = G.CONTENT;
  const A = G.APP = { views: {}, act: {}, form: {}, chg: {}, live: [], timers: [] };
  // fichiers rangés en dossiers (css/, js/, img/ — Firebase Hosting) ou tous « à plat » à la racine (GitHub Pages) :
  // la disposition est déduite de l'adresse de ce script, les chemins des images et des scripts s'y adaptent.
  const here = (G.document && G.document.currentScript && G.document.currentScript.src) || '';
  A.FLAT = !!here && !/\/js\/core\.js(\?|#|$)/.test(here);
  A.asset = (p) => (A.FLAT ? String(p).replace(/^(img|css|js\/vendor|js)\//, '') : p);

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
  // ancienne empreinte (SHA-256 salé par l'identifiant du compte) : encore acceptée, remplacée à la connexion suivante
  const legacyHash = (key, pw) => sha256(String(key) + '::' + String(pw).normalize('NFC'));

  // ---------- PBKDF2-HMAC-SHA256 (synchrone) : les mots de passe ne sont jamais stockés en clair ----------
  const SHA = (() => {
    const K = new Uint32Array(64), H0 = new Uint32Array(8), W = new Uint32Array(64);
    const frac = (x) => ((x - Math.floor(x)) * 4294967296) >>> 0;
    for (let n = 0, p = 2; n < 64; p++) { let pr = true; for (let f = 2; f * f <= p; f++) if (p % f === 0) { pr = false; break; } if (pr) { if (n < 8) H0[n] = frac(Math.sqrt(p)); K[n++] = frac(Math.cbrt(p)); } }
    function compress(st, blk, off) {
      for (let i = 0; i < 16; i++) { const j = off + 4 * i; W[i] = (blk[j] << 24) | (blk[j + 1] << 16) | (blk[j + 2] << 8) | blk[j + 3]; }
      for (let i = 16; i < 64; i++) { const a = W[i - 15], b = W[i - 2]; W[i] = (W[i - 16] + (((a >>> 7) | (a << 25)) ^ ((a >>> 18) | (a << 14)) ^ (a >>> 3)) + W[i - 7] + (((b >>> 17) | (b << 15)) ^ ((b >>> 19) | (b << 13)) ^ (b >>> 10))) | 0; }
      let a = st[0], b = st[1], c = st[2], d = st[3], e = st[4], f = st[5], g = st[6], h = st[7];
      for (let i = 0; i < 64; i++) {
        const t1 = (h + (((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))) + ((e & f) ^ (~e & g)) + K[i] + W[i]) | 0;
        const t2 = ((((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      st[0] += a; st[1] += b; st[2] += c; st[3] += d; st[4] += e; st[5] += f; st[6] += g; st[7] += h;
    }
    // suite d'un hachage déjà avancé de « pre » octets (st0), sur le message msg
    function cont(st0, pre, msg) {
      const st = st0.slice(), n = Math.ceil((msg.length + 9) / 64) * 64, buf = new Uint8Array(n);
      buf.set(msg); buf[msg.length] = 0x80; const bits = (pre + msg.length) * 8;
      buf[n - 4] = (bits >>> 24) & 255; buf[n - 3] = (bits >>> 16) & 255; buf[n - 2] = (bits >>> 8) & 255; buf[n - 1] = bits & 255; buf[n - 5] = Math.floor(bits / 4294967296) & 255;
      for (let o = 0; o < n; o += 64) compress(st, buf, o);
      const out = new Uint8Array(32); for (let i = 0; i < 8; i++) { out[4 * i] = st[i] >>> 24; out[4 * i + 1] = (st[i] >>> 16) & 255; out[4 * i + 2] = (st[i] >>> 8) & 255; out[4 * i + 3] = st[i] & 255; }
      return out;
    }
    return { H0, compress, cont, hash: (m) => cont(H0, 0, m) };
  })();
  function pbkdf2(pw, salt, iter) {
    const k = new Uint8Array(64); k.set(pw.length > 64 ? SHA.hash(pw) : pw);
    const ip = new Uint8Array(64), op = new Uint8Array(64); for (let i = 0; i < 64; i++) { ip[i] = k[i] ^ 0x36; op[i] = k[i] ^ 0x5c; }
    const ist = SHA.H0.slice(), ost = SHA.H0.slice(); SHA.compress(ist, ip, 0); SHA.compress(ost, op, 0);
    const s1 = new Uint8Array(salt.length + 4); s1.set(salt); s1[salt.length + 3] = 1;
    let u = SHA.cont(ost, 64, SHA.cont(ist, 64, s1)); const t = u.slice();
    // itérations suivantes : un seul bloc par compression (message de 32 octets)
    const blk = new Uint8Array(64); blk[32] = 0x80; blk[62] = 0x03; blk[63] = 0x00; // longueur = (64 + 32) × 8 = 768 bits
    const st = new Uint32Array(8);
    for (let n = 1; n < iter; n++) {
      blk.set(u); st.set(ist); SHA.compress(st, blk, 0);
      for (let i = 0; i < 8; i++) { blk[4 * i] = st[i] >>> 24; blk[4 * i + 1] = (st[i] >>> 16) & 255; blk[4 * i + 2] = (st[i] >>> 8) & 255; blk[4 * i + 3] = st[i] & 255; }
      st.set(ost); SHA.compress(st, blk, 0);
      for (let i = 0; i < 8; i++) { u[4 * i] = st[i] >>> 24; u[4 * i + 1] = (st[i] >>> 16) & 255; u[4 * i + 2] = (st[i] >>> 8) & 255; u[4 * i + 3] = st[i] & 255; }
      for (let i = 0; i < 32; i++) t[i] ^= u[i];
    }
    return t;
  }
  const utf8 = (s) => new TextEncoder().encode(String(s).normalize('NFC'));
  const hex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  const unhex = (h) => new Uint8Array((String(h).match(/../g) || []).map((x) => parseInt(x, 16)));
  const randBytes = (n) => { const b = new Uint8Array(n); try { G.crypto.getRandomValues(b); } catch (e) { for (let i = 0; i < n; i++) b[i] = Math.floor(Math.random() * 256); } return b; };
  const PW_ITER = 100000;
  A.pbkdf2Hex = (pw, saltHex, iter) => hex(pbkdf2(utf8(pw), unhex(saltHex), iter));
  // nouvelle empreinte : « pbkdf2$itérations$sel$empreinte » (le premier argument est conservé pour compatibilité)
  A.hashPw = (key, pw) => { const salt = randBytes(16); return 'pbkdf2$' + PW_ITER + '$' + hex(salt) + '$' + hex(pbkdf2(utf8(pw), salt, PW_ITER)); };
  const sameHex = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };
  A.verifyHash = (stored, pw, legacyKey) => {
    const s = String(stored || '');
    if (s.startsWith('pbkdf2$')) { const [, it, sh, hh] = s.split('$'); return sameHex(A.pbkdf2Hex(pw, sh, +it || PW_ITER), hh || ''); }
    return !!s && legacyKey != null && s === legacyHash(legacyKey, pw);
  };

  // ---------- administrateur principal (unique) ----------
  // Seule l'empreinte PBKDF2 du mot de passe figure ici, jamais le mot de passe lui-même.
  A.VERSION = '5.4 du 26 novembre 2026';
  A.PRINCIPAL_CODE = 'BAGLAM-001';
  const PRINCIPAL_HASH = 'pbkdf2$200000$8906d87c0de8182947ceb45294b00c04$2cd38a54aff17e64a795c85da5a3e10c3f1c96b72b02b8ceaec3f58c0a9e502b';
  A.principalRecord = () => ({ id: 'u-principal', name: 'Administrateur principal', role: 'admin', code: A.PRINCIPAL_CODE, principal: true, titre: 'Administrateur principal', dept: 'Administration de la plateforme', pw: PRINCIPAL_HASH, active: true, created: Date.now() });
  A.isPrincipal = (u) => !!(u && u.role === 'admin' && u.principal && String(u.code || '').toUpperCase() === A.PRINCIPAL_CODE);
  // prochain code administrateur libre (BAGLAM-002, BAGLAM-003…), jamais réutilisé grâce au compteur admSeq
  A.nextAdminCode = (D = A.DB) => { let n = Math.max(1, D.admSeq | 0); (D.users || []).forEach((a) => { const m = String(a.code || '').toUpperCase().match(/^BAGLAM-(\d+)$/); if (m) n = Math.max(n, +m[1]); }); return 'BAGLAM-' + String(n + 1).padStart(3, '0'); };
  // un autre compte qui portait le code principal (créé ou renommé dans une version précédente) reçoit un nouveau code
  const recode = (D, u, code) => {
    const old = u.code; u.oldCode = old; u.code = code; D.admSeq = Math.max(D.admSeq | 0, +code.slice(7) || 0); delete u.principal;
    (D.logs = D.logs || []).unshift({ date: Date.now(), uid: null, act: 'Code identifiant réattribué', det: u.name + ' : ' + old + ' → ' + code + ' (code réservé à l’administrateur principal)' });
    (D.notifs = D.notifs || []).unshift({ id: A.uid('n-'), uid: u.id, text: 'Le code ' + old + ' est désormais réservé à l’administrateur principal. Votre nouveau code identifiant est ' + code + ' (mot de passe inchangé).', link: 'profil', date: Date.now(), read: false });
  };
  // le compte principal est la fiche « u-principal » : toujours présente, active, avec le code BAGLAM-001 ; renvoie true si la base a été modifiée
  A.ensurePrincipal = (D) => {
    let changed = false; D.users = D.users || [];
    let p = D.users.find((u) => u.id === 'u-principal');
    if (!p) { p = A.principalRecord(); D.users.unshift(p); changed = true; }
    if (p.role !== 'admin') { p.role = 'admin'; changed = true; }
    if (String(p.code || '').toUpperCase() !== A.PRINCIPAL_CODE) { p.code = A.PRINCIPAL_CODE; changed = true; }
    if (!p.principal) { p.principal = true; changed = true; }
    if (p.active === false) { p.active = true; changed = true; }
    if (!p.pw) { p.pw = PRINCIPAL_HASH; changed = true; }
    D.users.forEach((u) => {
      if (u === p) return;
      if (String(u.code || '').toUpperCase() === A.PRINCIPAL_CODE) { recode(D, u, A.nextAdminCode(D)); changed = true; }
      if (u.principal) { delete u.principal; changed = true; }
    });
    if (A.lockLegacyAdmins(D)) changed = true;
    return changed;
  };
  // anciens comptes administrateurs de démonstration encore protégés par le mot de passe public : désactivés
  A.lockLegacyAdmins = (D) => { let changed = false; (D.users || []).forEach((u) => { if (u.id !== 'u-principal' && u.role === 'admin' && u.active !== false && u.pwDefault && /^ADM-00[12]$/i.test(String(u.code || '')) && A.verifyHash && A.verifyHash(u.pw, A.DEMO_PW, u.id)) { u.active = false; u.demoLocked = true; changed = true; } }); return changed; };
  A.adminTitle = (u) => (A.isPrincipal(u) ? 'Administrateur principal' : (!u.titre || /principal/i.test(u.titre) ? 'Administrateur' : u.titre));
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

  function seed() {
    const now = Date.now(), D = 86400000;
    const demoHash = A.hashPw('demo', A.DEMO_PW);
    const U = (id, name, role, extra) => ({ id, name, role, pw: demoHash, active: true, created: now - 40 * D, ...extra });
    const users = [
      A.principalRecord(),
      U('u-ens', 'Dr Ibrahima Sylla', 'enseignant', { email: 'enseignant@demo.edu', dept: 'Département de chimie', demo: true }),
      U('u-etu', 'Mariama Bah', 'etudiant', { matricule: '20200104962', filiere: 'Licence 2 Chimie', demo: true }),
      U('u-e2', 'Mamadou Camara', 'etudiant', { matricule: '20200105118', filiere: 'Licence 2 Chimie', demo: true }),
      U('u-e3', 'Fatoumata Barry', 'etudiant', { matricule: '20210107354', filiere: 'Licence 1 Sciences et technologies', demo: true }),
      U('u-e4', 'Ousmane Keita', 'etudiant', { matricule: '20190102271', filiere: 'Licence 3 Chimie analytique', demo: true })
    ];
    const lessonsOf = (mods) => K.modules.filter((m) => mods.includes(m.id)).flatMap((m) => m.lessons.map((l) => l.id));
    const P = (ids, d0) => Object.fromEntries(ids.map((id, k) => [id, now - (d0 - k * 0.6) * D]));
    const progress = {
      'u-etu': P(lessonsOf([1, 2]).concat(['3-1', '3-2']), 9),
      'u-e2': P(lessonsOf([1, 2, 3, 4]).concat(['5-1', '5-2']), 20),
      'u-e3': P(['1-1', '1-2'], 4),
      'u-e4': P(lessonsOf([1, 2, 3, 4, 5, 6]), 30)
    };
    const att = [];
    const gen = (uid, mod, ok, days) => {
      const qs = K.modules[mod - 1].quiz; const snap = qs.map((q) => ({ ...q }));
      const answers = qs.map((q, i) => { const good = i < ok; return { given: q.t === 'court' ? (good ? q.acc[0] : '?') : (good ? q.a : (q.a + 1) % q.o.length), ok: good }; });
      att.push({ id: A.uid('a-'), uid, kind: 'module', ref: mod, score: ok, max: qs.length, date: now - days * D, qs: snap, answers });
    };
    gen('u-etu', 1, 5, 8); gen('u-etu', 2, 5, 3);
    gen('u-e2', 1, 6, 18); gen('u-e2', 2, 6, 15); gen('u-e2', 3, 6, 10); gen('u-e2', 4, 5, 6);
    gen('u-e3', 1, 3, 2);
    gen('u-e4', 1, 6, 28); gen('u-e4', 2, 7, 25); gen('u-e4', 3, 7, 20); gen('u-e4', 4, 6, 15); gen('u-e4', 5, 6, 9); gen('u-e4', 6, 5, 5);
    att.push({ id: A.uid('a-'), uid: 'u-e4', kind: 'exam', ref: 'final', score: 12, max: 15, date: now - 2 * D, qs: [], answers: [] });
    const waterMol = C.toMolfile({ name: 'eau', atoms: [{ el: 'O', x: 0, y: 0, z: 0 }, { el: 'H', x: 0.757, y: -0.586, z: 0 }, { el: 'H', x: -0.757, y: -0.586, z: 0 }], bonds: [{ a: 0, b: 1, o: 1 }, { a: 0, b: 2, o: 1 }] }, { name: 'Eau' });
    const ch4 = C.toXYZ(C.REF3D.methane(), 'Methane - Avogadro');
    const subs = [
      { id: 's-1', uid: 'u-e2', tp: 1, date: now - 12 * D, comment: 'Structure de l’eau et formule développée.', files: [{ name: 'CAMARA_Mamadou_TP1.mol', size: waterMol.length, type: 'mol', text: waterMol }], status: 'corrige', grade: 16, feedback: 'Très bien. Pensez à indiquer la masse molaire sur l’image exportée.', gradedBy: 'u-ens', gradedAt: now - 10 * D },
      { id: 's-2', uid: 'u-e3', tp: 1, date: now - 2 * D, comment: 'Premier essai.', files: [{ name: 'BARRY_Fatoumata_TP1.mol', size: waterMol.length, type: 'mol', text: waterMol }], status: 'corrige', grade: 12, feedback: 'Structure correcte, mais il manque la formule développée H–O–H demandée.', gradedBy: 'u-ens', gradedAt: now - D },
      { id: 's-3', uid: 'u-etu', tp: 1, date: now - 1 * D, comment: 'Molécule d’eau dessinée dans ChemSketch, exportée en MOL.', files: [{ name: 'BAH_Mariama_TP1.mol', size: waterMol.length, type: 'mol', text: waterMol }], status: 'rendu' },
      { id: 's-4', uid: 'u-e4', tp: 4, date: now - 3 * D, comment: 'Méthane construit et optimisé ; angle H–C–H mesuré à 109,5°.', files: [{ name: 'KEITA_Ousmane_TP4.xyz', size: ch4.length, type: 'xyz', text: ch4 }], status: 'rendu' }
    ];
    const N = (uid, text, link, days, read) => ({ id: A.uid('n-'), uid, text, link, date: now - days * D, read: !!read });
    const notifs = [
      N('u-etu', 'Bienvenue sur la plateforme ! Commencez par le module 1.', 'module-1', 9, true),
      N('u-etu', 'Le module 3 « Dessin des structures chimiques en 2D » est disponible.', 'module-3', 2),
      N('u-e2', 'Votre TP 1 a été corrigé : 16/20.', 'tp-1', 10),
      N('u-ens', 'Nouveau dépôt : Mariama Bah — TP 1.', 'corrections', 1),
      N('u-ens', 'Nouveau dépôt : Ousmane Keita — TP 4.', 'corrections', 3)
    ];
    const logs = [
      { date: now - 3 * D, uid: 'u-e4', act: 'Dépôt de travail', det: 'TP 4' },
      { date: now - 2 * D, uid: 'u-e4', act: 'Examen final terminé', det: '12/15' },
      { date: now - D - 3600e3, uid: 'u-ens', act: 'Correction', det: 'Fatoumata Barry — TP 1 : 12/20' },
      { date: now - D, uid: 'u-etu', act: 'Dépôt de travail', det: 'TP 1' },
      { date: now - 5 * D, uid: 'u-principal', act: 'Évaluation de l’évolution', det: 'Mamadou Camara (20200105118) : 15/20' }
    ];
    const evals = [{ id: 'ev-1', uid: 'u-e2', by: 'u-principal', date: now - 5 * D, global: 15, comment: 'Bonne régularité sur les modules 1 à 4. Poursuivre avec le module 5 avant l’examen final.', mods: { 1: 16, 2: 16, 3: 14, 4: 15 }, snap: { prog: 58, avg: 0.85 } }];
    return {
      v: 2, demo: true, evals, users, session: null, progress, attempts: att, subs, notifs, logs, lessons: [], questions: [], videos: [], docs: [], mols: {}, draws: { 'u-etu': { d1: now - 6 * D, d3: now - 5 * D }, 'u-e4': { d1: now - 20 * D, d2: now - 20 * D, d3: now - 19 * D, d9: now - 12 * D } },
      modState: Object.fromEntries(K.modules.map((m) => [m.id, true])), perms: defPerms(),
      settings: { examMin: 20, examN: 15, examMax: 3, examOpen: true }, seededAt: now
    };
  }
  // remplacement complet de la base (réinitialisation, restauration) ; en ligne, cloud.js remplace ces fonctions
  A.replaceDB = (o, after) => { A.DB = o; A.ensurePrincipal(A.DB); A.save(); if (after) after(); };
  A.reset = () => A.replaceDB(seed());
  A.lookupUser = async () => {};
  A.ensureFile = async (f) => f;
  A.ensureFiles = (list) => Promise.all((list || []).map((f) => A.ensureFile(f)));
  A.DB = load(); if (!A.DB || A.DB.v !== 2) { A.DB = seed(); A.save(); }
  if (A.ensurePrincipal(A.DB)) A.save();
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
    if (kind === 'admin' && low === A.PRINCIPAL_CODE.toLowerCase()) { const p = A.DB.users.find((u) => u.id === 'u-principal'); if (p) return p; }
    return A.DB.users.find((u) => u.role === kind && String(u[f] || '').toLowerCase() === low) || null;
  };
  A.findAny = (idf) => A.findUser('etudiant', idf) || A.findUser('enseignant', idf) || A.findUser('admin', idf);
  // vérifie le mot de passe ; une ancienne empreinte reconnue est remplacée par une empreinte PBKDF2
  A.checkPw = (u, pw) => { if (!u) return false; const ok = A.verifyHash(u.pw, pw, u.id); if (ok && !String(u.pw).startsWith('pbkdf2$')) u.pw = A.hashPw(u.id, pw); return ok; };
  // en ligne : vérifie que le compte principal existe dans la base partagée, sinon le crée (une seule fois)
  A.principalPwOk = (pw) => A.verifyHash(PRINCIPAL_HASH, pw);
  A.principalHash = () => PRINCIPAL_HASH;
  A.ensurePrincipalCloud = async () => {
    const found = await A.lookupUser('admin', A.PRINCIPAL_CODE);
    if (found === false) return; // base injoignable : ne rien créer à l'aveugle
    // en ligne, un visiteur ne voit pas tous les comptes : le nouveau code d'un compte en conflit est vérifié dans la base
    const others = A.DB.users.filter((u) => u.id !== 'u-principal' && String(u.code || '').toUpperCase() === A.PRINCIPAL_CODE);
    for (const u of others) {
      let n = Math.max(1, A.DB.admSeq | 0, ...A.DB.users.map((x) => +(String(x.code || '').toUpperCase().match(/^BAGLAM-(\d+)$/) || [0, 0])[1])), code = '';
      for (let k = 0; k < 60; k++) { n++; code = 'BAGLAM-' + String(n).padStart(3, '0'); if ((await A.lookupUser('admin', code)) === false) return; if (!A.DB.users.some((x) => String(x.code || '').toUpperCase() === code)) break; }
      recode(A.DB, u, code);
    }
    if (A.ensurePrincipal(A.DB) || others.length) A.save();
  };
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
    pause: '<rect x="6.5" y="5" width="3.5" height="14" rx="1"/><rect x="14" y="5" width="3.5" height="14" rx="1"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 17-5-5-9 8"/>', search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', award: '<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 7 5-3 5 3-1.5-7"/>', grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
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
    else if (hit.opt.principal && !A.isPrincipal(u)) v = { title: 'Accès réservé', html: `<div class="card empty"><h2>Réservé à l’administrateur principal</h2><p>Seul l’administrateur principal peut ouvrir cette page.</p><a class="btn pri" href="#tableau">Retour au tableau de bord</a></div>` };
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
    return `<header class="topbar"><a class="brand" href="#${u ? 'tableau' : 'accueil'}"><img class="uk-logo" src="${A.asset('img/logo-universite-kindia.png')}" width="44" height="44" alt="Université de Kindia"><span class="bt">INFOCHIMIE UK<small>Université de Kindia · Informatique appliquée à la chimie</small></span></a><span class="sp"></span>${A.cloudPill ? A.cloudPill() : ''}` +
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
    if (u.role === 'admin') n.push(['Administrer'], ['tableau', 'Tableau de bord', 'home'], ['controle', 'Contrôle des étudiants', 'eye'], ['utilisateurs', 'Utilisateurs', 'users'], ['gestion-cours', 'Cours et modules', 'book'], ['parametres', 'Évaluations et sauvegarde', 'gear'], ...(A.isPrincipal(u) ? [['autorisations', 'Autorisations', 'shield']] : []), ['journal', 'Journal et statistiques', 'log'], ['vitrine', 'Accueil, hommage et catalogue', 'image'],
      ['Contenus'], ['cours', 'Voir les cours', 'book'], ['bibliotheque', 'Bibliothèque', 'lib'], ['atelier-2d', 'Atelier 2D', 'hex'], ['atelier-3d', 'Atelier 3D', 'cube'], ['Compte'], ['profil', 'Profil', 'user']);
    n.push(['Département'], ['enseignants', 'Enseignants de chimie', 'users']);
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
