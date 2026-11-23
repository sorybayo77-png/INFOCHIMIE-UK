/* cloud.js — synchronisation en temps réel avec Firebase (Realtime Database, ou Cloud Firestore)
   - Chaque enregistrement devient une entrée de la base ; les modifications sont envoyées dès A.save().
   - Chaque appareil n'écoute que ce dont il a besoin : un étudiant ses propres données, un enseignant ou
     un administrateur l'ensemble des étudiants. Les changements faits ailleurs arrivent en direct.
   - Hors ligne, Firebase garde les modifications en attente et les envoie au retour de la connexion.
   - Dans l'aperçu claude.ai (sans accès réseau) ou ouvert depuis le disque, la plateforme reste en mode local. */
(function (G) {
  'use strict';
  const A = G.APP, esc = A.esc;
  const CFG = G.CSA_FIREBASE || null;
  const SDK = G.CSA_FIREBASE_SDK || 'https://www.gstatic.com/firebasejs/13.2.0/';
  const SESSION_KEY = 'csa-session-v1';

  const REC = ['users', 'subs', 'notifs', 'logs', 'evals', 'lessons', 'questions', 'videos', 'docs']; // un document par enregistrement
  const MAP = ['progress', 'draws', 'mols'];                                                        // un document par utilisateur
  const BUCKET = ['attempts'];                                                                       // les tentatives d'un étudiant regroupées
  const ALL = REC.concat(MAP, BUCKET);
  const SKIP = new Set(ALL.concat(['session']));
  const FILES = 'fichiers';
  const INLINE_MAX = 20000, CHUNK = 300000, PAGE = 600000, DOC_MAX = 1000000;
  const DESC = new Set(['logs', 'notifs']);
  const PFX = { users: 'u-', subs: 's-', notifs: 'n-', logs: 'l-', evals: 'ev-', lessons: 'c-', questions: 'q-', videos: 'v-', docs: 'd-' };

  const S = A.cloud = { mode: 'local', loading: false, fatal: null, ready: false, pending: 0, err: '', scopeUid: undefined, auth: '' };
  let F = null, db = null, BK = null, cfgUnsub = null, scopeToken = 0, listeners = [], flushQueued = false, renderTimer = 0, lastErrToast = 0;
  const SH = {}; ALL.concat(['config']).forEach((c) => { SH[c] = new Map(); }); // dernier état connu côté serveur (chaînes JSON)
  const pages = {}, holders = new Map(), blobCache = new Map();

  // ---------- outils ----------
  const stable = (v) => Array.isArray(v) ? '[' + v.map(stable).join(',') + ']' : (v && typeof v === 'object') ? '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}' : JSON.stringify(v);
  const stableEq = (a, b) => { try { return stable(JSON.parse(a)) === stable(JSON.parse(b)); } catch (e) { return false; } };
  function stripRep(k, v) { if ((k === 'text' || k === 'data') && this && this.blob) return undefined; return v; }
  const enc = (c, r) => (c === 'subs' || c === 'docs') ? JSON.stringify(r, stripRep) : JSON.stringify(r);
  const badShape = (v, inArr) => {
    if (Array.isArray(v)) return inArr || v.some((x) => badShape(x, true));
    if (v && typeof v === 'object') { for (const k in v) { if (k === '' || /^__.*__$/.test(k) || badShape(v[k], false)) return true; } }
    return false;
  };
  const idn = (u) => String((u.role === 'etudiant' ? u.matricule : u.role === 'admin' ? u.code : u.email) || '').trim().toLowerCase();
  const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej({ code: 'timeout', message: 'délai dépassé' }), ms))]);
  const readSession = () => { try { return G.localStorage.getItem(SESSION_KEY) || null; } catch (e) { return null; } };
  const writeSession = () => { try { G.localStorage.setItem(SESSION_KEY, A.DB.session || ''); } catch (e) {} };
  const cfgOf = (D) => { const o = {}; Object.keys(D).forEach((k) => { if (!SKIP.has(k)) o[k] = D[k]; }); return o; };
  const blank = (src) => ({ v: 2, demo: !!src.demo, session: null, users: [], progress: {}, attempts: [], subs: [], notifs: [], logs: [], lessons: [], questions: [], videos: [], docs: [], mols: {}, draws: {}, evals: [],
    modState: JSON.parse(JSON.stringify(src.modState || {})), perms: JSON.parse(JSON.stringify(src.perms || {})), settings: JSON.parse(JSON.stringify(src.settings || {})), seededAt: src.seededAt || Date.now() });

  // ---------- conversion vers / depuis Firestore ----------
  function makeData(c, s, extra) {
    const o = JSON.parse(s), bad = badShape(o, false);
    if (c === 'config') return bad ? { _json: s } : o;
    if (MAP.includes(c)) return bad ? { _json: s } : { v: o };
    if (BUCKET.includes(c)) return bad ? { u: extra.u, p: extra.p, _json: s } : { u: extra.u, p: extra.p, v: o };
    const d = bad ? { _json: s } : o;
    if (bad && o.uid) d.uid = o.uid;
    if (c === 'users') { d._idn = idn(o); if (bad) d.role = o.role; }
    return d;
  }
  function fromFS(c, data) {
    if (data.j != null) return JSON.parse(data.j);
    if (data._json != null) return JSON.parse(data._json);
    if (MAP.includes(c) || BUCKET.includes(c)) return data.v;
    const o = Object.assign({}, data); delete o._idn; return o;
  }
  const sortKey = (c, r) => (c === 'users' ? r.created : (r.date || r.created)) || 0;
  function insertSorted(c, arr, r) {
    const k = sortKey(c, r); let i;
    if (DESC.has(c)) { i = arr.findIndex((x) => sortKey(c, x) < k); if (i < 0) i = arr.length; }
    else { i = arr.length; while (i > 0 && sortKey(c, arr[i - 1]) > k) i--; }
    arr.splice(i, 0, r);
  }
  const assignInPlace = (t, s) => { Object.keys(t).forEach((k) => delete t[k]); Object.assign(t, s); };

  // ---------- moteurs : Realtime Database (par défaut si databaseURL) ou Cloud Firestore ----------
  const FS_BK = {
    name: 'Cloud Firestore', mods: ['firebase-app.js', 'firebase-auth.js', 'firebase-firestore.js'], maxBatch: 400, cached: true,
    init(app) {
      try { db = F.initializeFirestore(app, { localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }), ignoreUndefinedProperties: true }); }
      catch (e) { db = F.getFirestore(app); }
      if (G.CSA_EMULATOR && G.CSA_EMULATOR.firestore && F.connectFirestoreEmulator) { const [h, p] = G.CSA_EMULATOR.firestore.split(':'); F.connectFirestoreEmulator(db, h, +p); }
    },
    encode: makeData,
    async getDoc(c, id, server) { const s = await (server ? F.getDocFromServer : F.getDoc)(F.doc(db, c, id)); return s.exists() ? s.data() : null; },
    async getCached(c, id) { const s = await F.getDocFromCache(F.doc(db, c, id)); return s.exists() ? s.data() : null; },
    claimInit() { const ref = F.doc(db, 'config', 'main'); return F.runTransaction(db, async (tx) => { const s = await tx.get(ref); if (s.exists()) return false; tx.set(ref, { v: 2, _init: Date.now() }); return true; }); },
    listen(sp, onCh, onReady, onErr) {
      let first = true;
      const cb = (list) => { onCh(list, !first); if (first) { first = false; onReady(); } };
      if (sp.doc) return F.onSnapshot(F.doc(db, sp.c, sp.doc), (s) => cb([{ id: s.id, data: s.exists() ? s.data() : null }]), onErr);
      const q = sp.field ? F.query(F.collection(db, sp.c), F.where(sp.field, '==', sp.value)) : F.collection(db, sp.c);
      return F.onSnapshot(q, (snap) => cb(snap.docChanges().map((ch) => ({ id: ch.doc.id, data: ch.type === 'removed' ? null : ch.doc.data() }))), onErr);
    },
    write(list) { const wb = F.writeBatch(db); list.forEach((o) => { const r = F.doc(db, o.c, o.id); if (o.t === 'set') wb.set(r, o.data); else wb.delete(r); }); return wb.commit(); },
    async query(c, field, value) { const qs = await F.getDocs(F.query(F.collection(db, c), F.where(field, '==', value))); return qs.docs.map((d) => ({ id: d.id, data: d.data() })); },
    async wipe(c) {
      const qs = await F.getDocs(F.collection(db, c)); let wb = F.writeBatch(db), n = 0;
      for (const d of qs.docs) { wb.delete(d.ref); if (++n >= 400) { await wb.commit(); wb = F.writeBatch(db); n = 0; } }
      if (n) await wb.commit();
    }
  };
  const RT_BK = {
    name: 'Realtime Database', mods: ['firebase-app.js', 'firebase-auth.js', 'firebase-database.js'], maxBatch: 300, cached: false,
    init(app) {
      db = F.getDatabase(app);
      if (G.CSA_EMULATOR && G.CSA_EMULATOR.database && F.connectDatabaseEmulator) { const [h, p] = G.CSA_EMULATOR.database.split(':'); F.connectDatabaseEmulator(db, h, +p); }
      F.onValue(F.ref(db, '.info/connected'), (s) => { S.connected = !!s.val(); updatePill(); });
    },
    // le contenu est rangé en texte JSON (champ j) ; quelques champs restent lisibles pour les recherches
    encode(c, s, extra) {
      const d = { j: s };
      if (BUCKET.includes(c)) { d.u = extra.u; d.p = extra.p; }
      else if (REC.includes(c)) { const o = JSON.parse(s); if (o && o.uid != null) d.uid = String(o.uid); if (c === 'users') { d._idn = idn(o); d.role = o.role || ''; } }
      return d;
    },
    async getDoc(c, id) { const s = await F.get(F.ref(db, c + '/' + id)); return s.exists() ? s.val() : null; },
    getCached: null,
    async claimInit() { const r = await F.runTransaction(F.ref(db, 'config/main'), (cur) => (cur === null ? { j: JSON.stringify({ v: 2, _init: Date.now() }) } : undefined)); return !!r.committed; },
    listen(sp, onCh, onReady, onErr) {
      if (sp.doc) { let first = true; return F.onValue(F.ref(db, sp.c + '/' + sp.doc), (s) => { onCh([{ id: sp.doc, data: s.exists() ? s.val() : null }], !first); if (first) { first = false; onReady(); } }, onErr); }
      const q = sp.field ? F.query(F.ref(db, sp.c), F.orderByChild(sp.field), F.equalTo(sp.value)) : F.ref(db, sp.c);
      let ready = false;
      const offs = [
        F.onChildAdded(q, (s) => onCh([{ id: s.key, data: s.val() }], ready), onErr),
        F.onChildChanged(q, (s) => onCh([{ id: s.key, data: s.val() }], ready), onErr),
        F.onChildRemoved(q, (s) => onCh([{ id: s.key, data: null }], ready), onErr),
        F.onValue(q, () => { ready = true; onReady(); }, onErr, { onlyOnce: true })
      ];
      return () => offs.forEach((f) => { try { f(); } catch (e) {} });
    },
    write(list) { const u = {}; list.forEach((o) => { u[o.c + '/' + o.id] = o.t === 'set' ? o.data : null; }); return F.update(F.ref(db), u); },
    async query(c, field, value) { const s = await F.get(F.query(F.ref(db, c), F.orderByChild(field), F.equalTo(value))); const out = []; s.forEach((ch) => { out.push({ id: ch.key, data: ch.val() }); }); return out; },
    async wipe(c) { await F.set(F.ref(db, c), null); }
  };

  // ---------- application des changements reçus ----------
  function applyRec(c, id, data, lid) {
    const arr = A.DB[c], hk = c + '/' + id;
    if (data == null) {
      const h = holders.get(hk); if (h) { h.delete(lid); if (h.size) return false; holders.delete(hk); }
      SH[c].delete(id); const i = arr.findIndex((r) => r.id === id); if (i < 0) return false; arr.splice(i, 1); return true;
    }
    (holders.get(hk) || holders.set(hk, new Set()).get(hk)).add(lid);
    const rec = fromFS(c, data); rec.id = id;
    const s = enc(c, rec), old = SH[c].get(id), cur = arr.find((r) => r.id === id);
    if (cur && old != null && (old === s || stableEq(old, s))) return false;
    if (cur) { if (stableEq(enc(c, cur), s)) { SH[c].set(id, enc(c, cur)); return false; } assignInPlace(cur, rec); SH[c].set(id, enc(c, cur)); }
    else { insertSorted(c, arr, rec); SH[c].set(id, s); }
    return true;
  }
  function applyMap(c, id, data) {
    const m = A.DB[c];
    if (data == null) { SH[c].delete(id); if (!(id in m)) return false; delete m[id]; return true; }
    const v = fromFS(c, data), s = JSON.stringify(v), old = SH[c].get(id);
    if ((id in m) && old != null && (old === s || stableEq(old, s))) return false;
    if ((id in m) && stableEq(JSON.stringify(m[id]), s)) { SH[c].set(id, JSON.stringify(m[id])); return false; }
    m[id] = v; SH[c].set(id, s); return true;
  }
  function applyPage(c, docId, data) {
    const cut = docId.indexOf('~'), uid = cut < 0 ? docId : docId.slice(0, cut), p = cut < 0 ? 0 : +docId.slice(cut + 1);
    const P = pages[c] || (pages[c] = {}), byU = P[uid] || (P[uid] = new Map());
    if (data == null) { SH[c].delete(docId); if (!byU.has(p)) return false; byU.delete(p); }
    else {
      const v = fromFS(c, data) || [], s = JSON.stringify(v), old = SH[c].get(docId);
      if (old != null && (old === s || stableEq(old, s))) { byU.set(p, v); return false; }
      byU.set(p, v); SH[c].set(docId, s);
    }
    const arr = A.DB[c], keep = arr.filter((r) => r.uid !== uid), mine = [...byU.keys()].sort((a, b) => a - b).flatMap((q) => byU.get(q));
    arr.length = 0; keep.concat(mine).forEach((r) => arr.push(r));
    return true;
  }
  function applyConfig(data) {
    const o = data.j != null ? JSON.parse(data.j) : data._json != null ? JSON.parse(data._json) : Object.assign({}, data);
    Object.keys(o).forEach((k) => { if (k[0] === '_') delete o[k]; });
    const s = JSON.stringify(o), old = SH.config.get('main');
    if (old != null && (old === s || stableEq(old, s))) return false;
    if (stableEq(JSON.stringify(cfgOf(A.DB)), s)) { SH.config.set('main', JSON.stringify(cfgOf(A.DB))); return false; }
    Object.keys(A.DB).forEach((k) => { if (!SKIP.has(k) && !(k in o)) delete A.DB[k]; });
    Object.keys(o).forEach((k) => { if (!SKIP.has(k)) A.DB[k] = o[k]; });
    SH.config.set('main', JSON.stringify(cfgOf(A.DB)));
    return true;
  }
  function apply(c, id, data, lid) {
    if (REC.includes(c)) return applyRec(c, id, data, lid);
    if (MAP.includes(c)) return applyMap(c, id, data);
    return applyPage(c, id, data);
  }

  // ---------- envoi des modifications locales ----------
  function blobsOf(c, str) {
    if (!str || (c !== 'subs' && c !== 'docs')) return [];
    try { const o = JSON.parse(str); return (c === 'docs' ? [o] : (o.files || [])).filter((x) => x && x.blob).map((x) => [x.blob, x.bn || 1]); } catch (e) { return []; }
  }
  function externalize(f, ops) {
    if (!f || f.blob) return;
    const field = f.text != null ? 'text' : f.data != null ? 'data' : null; if (!field) return;
    const s = String(f[field]); if (s.length <= INLINE_MAX) return;
    const id = A.uid('b-'), n = Math.ceil(s.length / CHUNK);
    for (let i = 0; i < n; i++) ops.push({ t: 'set', c: FILES, id: id + '_' + i, data: { d: s.slice(i * CHUNK, (i + 1) * CHUNK), i, n }, size: CHUNK * 1.4 });
    f.blob = id; f.bn = n; f.bf = field; blobCache.set(id, s);
  }
  function computeOps() {
    const ops = [], seenOps = new Set(), cascade = [];
    const add = (o) => { const k = o.c + '/' + o.id; if (seenOps.has(k)) return; seenOps.add(k); ops.push(o); };
    const dropBlobs = (list) => list.forEach(([b, n]) => { for (let i = 0; i < n; i++) add({ t: 'del', c: FILES, id: b + '_' + i }); });
    const set = (c, id, s, extra) => {
      const old = SH[c].get(id); if (old === s) return;
      if (s.length > 300000 && new Blob([s]).size > DOC_MAX * 0.95) { errToast('Élément trop volumineux pour la base en ligne (plus de 1 Mo) : il n’a pas été enregistré.'); return; }
      if (old) { const keepB = new Set(blobsOf(c, s).map((x) => x[0])); dropBlobs(blobsOf(c, old).filter((x) => !keepB.has(x[0]))); }
      add({ t: 'set', c, id, s, data: BK.encode(c, s, extra), size: s.length });
    };
    const del = (c, id) => { const old = SH[c].get(id); dropBlobs(blobsOf(c, old)); add({ t: 'del', c, id }); if (c === 'users') cascade.push(id); };
    set('config', 'main', JSON.stringify(cfgOf(A.DB)));
    REC.forEach((c) => {
      const seen = new Set();
      (A.DB[c] || []).forEach((r) => {
        if (!r || typeof r !== 'object') return;
        if (!r.id) r.id = A.uid(PFX[c] || 'x-');
        if (seen.has(r.id)) return; seen.add(r.id);
        if (c === 'subs') (r.files || []).forEach((f) => externalize(f, ops));
        if (c === 'docs') externalize(r, ops);
        set(c, r.id, enc(c, r));
      });
      [...SH[c].keys()].forEach((id) => { if (!seen.has(id)) del(c, id); });
    });
    MAP.forEach((c) => {
      const m = A.DB[c] || {}, seen = new Set();
      Object.keys(m).forEach((id) => { if (m[id] == null) return; seen.add(id); set(c, id, JSON.stringify(m[id])); });
      [...SH[c].keys()].forEach((id) => { if (!seen.has(id)) del(c, id); });
    });
    BUCKET.forEach((c) => {
      const groups = new Map(), seen = new Set();
      (A.DB[c] || []).forEach((r) => { if (!r.id) r.id = A.uid('a-'); const u = r.uid || '_'; (groups.get(u) || groups.set(u, []).get(u)).push(r); });
      groups.forEach((list, u) => {
        let page = [], len = 2, p = 0;
        const out = () => { const id = p ? u + '~' + p : u; seen.add(id); set(c, id, '[' + page.join(',') + ']', { u, p }); p++; page = []; len = 2; };
        list.forEach((r) => { const s = JSON.stringify(r); if (page.length && len + s.length > PAGE) out(); page.push(s); len += s.length + 1; });
        if (page.length) out();
      });
      [...SH[c].keys()].forEach((id) => { if (!seen.has(id)) del(c, id); });
    });
    // compte supprimé : ses documents personnels partent aussi, même s'ils n'étaient pas chargés ici
    cascade.forEach((uid) => {
      MAP.forEach((c) => add({ t: 'del', c, id: uid }));
      BUCKET.forEach((c) => { for (let p = 0; p < 6; p++) add({ t: 'del', c, id: p ? uid + '~' + p : uid }); });
    });
    return { ops, cascade };
  }
  function flushNow() {
    flushQueued = false;
    if (S.mode !== 'cloud' || !S.ready || !db) return;
    let r; try { r = computeOps(); } catch (e) { console.error(e); return; }
    if (!r.ops.length) return;
    r.ops.forEach((o) => { if (o.c === FILES) return; if (o.t === 'set') SH[o.c].set(o.id, o.s); else SH[o.c].delete(o.id); });
    commit(r.ops);
    r.cascade.forEach(cleanNotifs);
  }
  function commit(ops) {
    const batches = []; let b = [], bytes = 0;
    ops.forEach((o) => { const sz = o.size || 300; if (b.length >= BK.maxBatch || (b.length && bytes + sz > 7e6)) { batches.push(b); b = []; bytes = 0; } b.push(o); bytes += sz; });
    if (b.length) batches.push(b);
    S.pending++; updatePill();
    // toutes les écritures sont confiées à Firebase immédiatement (gardées hors ligne et appliquées dans l'ordre)
    Promise.allSettled(batches.map((list) => BK.write(list).then(() => { if (S.err) { S.err = ''; } }, (e) => onWriteError(e, list))))
      .then(() => { S.pending--; updatePill(); });
  }
  function onWriteError(e, list) {
    console.error('Firestore', e);
    list.forEach((o) => { if (o.t === 'set' && o.c !== FILES) SH[o.c].delete(o.id); }); // sera renvoyé à la prochaine modification
    S.err = 'Écriture refusée par Firebase (' + (e.code || e.message || 'erreur') + ').';
    errToast(isDenied(e) ? 'Enregistrement refusé par la base en ligne : vérifiez les règles de la base et la connexion anonyme.' : 'Erreur d’enregistrement en ligne : ' + (e.code || e.message));
  }
  async function cleanNotifs(uid) {
    try { const list = await BK.query('notifs', 'uid', uid); if (list.length) await BK.write(list.slice(0, 300).map((x) => ({ t: 'del', c: 'notifs', id: x.id }))); }
    catch (e) { console.warn(e); }
  }
  const isDenied = (e) => /permission[_ -]?denied/i.test(String(e && e.code) + ' ' + String(e && e.message));
  function errToast(msg) { const now = Date.now(); if (now - lastErrToast > 6000) { lastErrToast = now; A.toast(msg); } updatePill(); }

  // ---------- écoute en direct, selon le rôle ----------
  function planFor(u) {
    const all = (c) => ({ c });
    const mine = (c, f) => ({ c, field: f || 'uid', value: u.id });
    const one = (c) => ({ c, doc: u.id });
    const content = ['lessons', 'questions', 'videos', 'docs'].map(all);
    if (!u) return A.DB.demo ? [all('users')] : [];
    if (u.role === 'etudiant') return [one('users'), { c: 'users', field: 'role', value: 'admin' }, { c: 'users', field: 'role', value: 'enseignant' },
      one('progress'), one('draws'), one('mols'), mine('attempts', 'u'), mine('subs'), mine('notifs'), mine('evals')].concat(content);
    return [all('users'), all('progress'), all('draws'), one('mols'), all('attempts'), all('subs'), mine('notifs'), all('evals'), all('logs')].concat(content);
  }
  function stopListeners() { listeners.forEach((f) => { try { f(); } catch (e) {} }); listeners = []; holders.clear(); }
  function clearScoped() {
    REC.forEach((c) => { A.DB[c] = []; SH[c].clear(); });
    MAP.forEach((c) => { A.DB[c] = {}; SH[c].clear(); });
    BUCKET.forEach((c) => { A.DB[c] = []; SH[c].clear(); pages[c] = {}; });
  }
  async function setScope(u) {
    const token = ++scopeToken;
    S.scopeUid = u ? u.id : null; S.role = u ? u.role : 'invité';
    stopListeners(); clearScoped();
    S.loading = true; S.msg = u ? 'Chargement de vos données…' : 'Connexion à la base de données en ligne…'; A.render();
    const plan = planFor(u);
    await Promise.all(plan.map((p, i) => new Promise((res) => {
      let first = true; const lid = 'L' + token + '-' + i;
      const done = () => { if (first) { first = false; res(); } };
      const onErr = (e) => { listenerError(e); done(); };
      const unsub = BK.listen(p, (list, live) => { if (token !== scopeToken) return; onChanges(p, list, lid, live); }, done, onErr);
      listeners.push(unsub); setTimeout(done, 20000);
    })));
    if (token !== scopeToken) return;
    BUCKET.forEach((c) => (A.DB[c] || []).sort((a, b) => (a.date || 0) - (b.date || 0)));
    S.loading = false; A.render();
  }
  function onChanges(p, list, lid, live) {
    if (flushQueued) flushNow();
    let changed = false;
    list.forEach((x) => { changed = apply(p.c, x.id, x.data, lid) || changed; });
    if (p.doc && p.c === 'users' && p.doc === A.DB.session && list.some((x) => x.data == null)) { A.DB.session = null; writeSession(); setScope(null); return; }
    if (changed && live) requestRender();
  }
  function listenerError(e) {
    console.warn('Firestore (écoute)', e);
    S.err = 'Lecture refusée par Firebase (' + (e.code || e.message || 'erreur') + ').';
    errToast(isDenied(e) ? 'La base en ligne refuse la lecture : vérifiez les règles de la base et la connexion anonyme.' : 'Connexion à la base interrompue : ' + (e.code || e.message));
  }

  // ---------- rafraîchissement de l'écran sans perdre une saisie en cours ----------
  const BUSY = /^(atelier-2d|atelier-3d|quiz-|examen|dessin|reconnaissance|lecon-)/;
  const dirty = (el) => el.type === 'checkbox' || el.type === 'radio' ? el.checked !== el.defaultChecked : el.type === 'file' ? !!(el.files && el.files.length) : el.tagName === 'SELECT' ? [...el.options].some((o) => o.selected !== o.defaultSelected) : el.value !== el.defaultValue;
  function safeToRender() {
    if (document.getElementById('modal')) return false;
    if (BUSY.test(decodeURIComponent(location.hash.replace(/^#/, '')))) return false;
    const a = document.activeElement; if (a && a.closest && a.closest('#main') && a.matches('input,textarea,select,[contenteditable]')) return false;
    return !A.$$('#main input, #main textarea, #main select').some(dirty);
  }
  function refreshChrome() {
    const u = A.me(), app = document.getElementById('app'), tb = document.querySelector('.topbar');
    if (tb && !tb.querySelector('.notif-pop')) tb.outerHTML = A.topbar(u, app && app.className === 'public');
    const side = document.querySelector('nav.side'); if (side && u) side.outerHTML = A.sidebar(u, decodeURIComponent(location.hash.replace(/^#/, '')));
  }
  function requestRender() {
    if (S.loading) return; clearTimeout(renderTimer);
    renderTimer = setTimeout(() => {
      if (S.loading) return;
      if (safeToRender()) { A.render(); return; }
      try { refreshChrome(); } catch (e) {}
      if (!document.getElementById('cloud-refresh')) { const b = document.createElement('button'); b.id = 'cloud-refresh'; b.className = 'cloud-refresh'; b.dataset.act = 'cloudRefresh'; b.innerHTML = A.icon('spin', 18) + ' Nouvelles données · Actualiser'; document.body.appendChild(b); }
    }, 150);
  }
  A.act.cloudRefresh = () => A.render();

  // ---------- indicateur de connexion ----------
  function pillState() {
    if (S.mode !== 'cloud') return ['local', 'Mode local', 'Aperçu sans serveur : les données restent dans ce navigateur. La version hébergée sur Firebase est synchronisée en temps réel.'];
    if (S.err) return ['err', 'Erreur de synchronisation', S.err];
    if (!navigator.onLine || S.connected === false) return ['off', S.pending ? 'Hors ligne · envoi en attente' : 'Hors ligne', 'Pas de connexion : les modifications sont gardées sur cet appareil et partiront au retour du réseau.'];
    if (S.pending) return ['sync', 'Synchronisation…', 'Envoi des modifications à la base en ligne.'];
    return ['on', 'En ligne', 'Données synchronisées en temps réel avec la base Firebase (' + (BK ? BK.name : '') + ').'];
  }
  A.cloudPill = () => { const [k, t, tip] = pillState(); return `<span class="cloud-pill cp-${k}" id="cloud-pill" title="${esc(tip)}" role="status"><span class="cp-dot"></span><span class="cp-t">${esc(t)}</span></span>`; };
  function updatePill() { const el = document.getElementById('cloud-pill'); if (el) el.outerHTML = A.cloudPill(); }
  G.addEventListener('online', updatePill); G.addEventListener('offline', updatePill);

  // ---------- écrans de chargement et d'erreur ----------
  const FATAL = {
    denied: ['Accès refusé par la base Firebase', 'La base a refusé la connexion. Dans la console Firebase, vérifiez que la connexion <b>Anonyme</b> est activée (Authentication › Sign-in method) et que les règles du fichier <b>database.rules.json</b> sont publiées (Realtime Database › Règles).'],
    nodb: ['Base Firebase introuvable', 'La base de données n’existe pas ou son adresse est incorrecte. Vérifiez <b>databaseURL</b> dans js/firebase-config.js et la base dans la console Firebase, puis rechargez cette page.'],
    offline: ['Connexion internet nécessaire', 'La première ouverture de la plateforme sur cet appareil demande une connexion internet. Vérifiez la connexion puis réessayez. Ensuite, la plateforme reste utilisable en cas de coupure.'],
    error: ['La base en ligne ne répond pas', 'Une erreur empêche la connexion à Firebase. Réessayez dans un instant.']
  };
  function screen() {
    const app = document.getElementById('app'); if (!app) return; app.className = 'public';
    const f = S.fatal;
    app.innerHTML = `<div class="auth"><div class="card formcard cloud-screen" style="width:100%;max-width:520px;text-align:center">${A.logo(52)}` +
      (f ? `<h1 style="font-size:24px;margin-top:14px">${FATAL[f.kind][0]}</h1><p>${FATAL[f.kind][1]}</p>${f.detail ? `<p class="muted small">Détail technique : ${esc(f.detail)}</p>` : ''}<button class="btn pri" data-act="cloudRetry">Réessayer</button>`
        : `<p style="margin-top:14px"><span class="cloud-spin">${A.icon('spin', 22)}</span> ${esc(S.msg || 'Chargement…')}</p>`) +
      `</div></div>${A.credit(null)}`;
  }
  A.act.cloudRetry = () => location.reload();
  function fatal(kind, e) {
    console.error('Firebase', e);
    const code = (e && (e.code || e.message)) || '';
    if (kind === 'error' && /not[-_ ]?found|does not exist/i.test(String(code) + ' ' + ((e && e.message) || ''))) kind = 'nodb';
    if (kind === 'error' && isDenied(e)) kind = 'denied';
    S.fatal = { kind, detail: [code, S.auth && S.auth !== 'ok' ? 'connexion anonyme : ' + S.auth : ''].filter(Boolean).join(' · ') };
    S.loading = false; screen();
  }

  // ---------- démarrage ----------
  async function loadSDK(mods) {
    const list = await withTimeout(Promise.all(mods.map((m) => import(SDK + m))), 20000);
    return Object.assign({}, ...list);
  }
  async function initialUpload(localDB) {
    const first = await BK.claimInit();
    if (!first) { const d = await BK.getDoc('config', 'main', true); if (d) applyConfig(d); return; }
    A.DB = localDB; A.DB.session = null;
    flushNow();
    A.DB = Object.assign(blank(localDB), cfgOf(localDB));
  }
  A.boot = async () => {
    const hosted = /^https?:$/.test(location.protocol) && !G.claude && CFG && !CFG.disabled;
    if (!hosted) { S.mode = 'local'; A.render(); return; }
    let cspBlocked = false; const onCsp = (e) => { if (/gstatic|firebase/.test(String(e.blockedURI || '') + String(e.sourceFile || ''))) cspBlocked = true; };
    document.addEventListener('securitypolicyviolation', onCsp);
    BK = (CFG.backend === 'firestore' || (!CFG.databaseURL && CFG.backend !== 'rtdb')) ? FS_BK : RT_BK; S.backend = BK.name;
    S.mode = 'cloud'; S.loading = true; S.msg = 'Connexion à la base de données en ligne…'; screen();
    try { F = await loadSDK(BK.mods); }
    catch (e) {
      await new Promise((r) => setTimeout(r, 150));
      if (cspBlocked || G.claude) { S.mode = 'local'; S.loading = false; A.render(); return; }
      return fatal('offline', e);
    } finally { document.removeEventListener('securitypolicyviolation', onCsp); }
    // les fonctions d'enregistrement passent désormais par la base en ligne
    A.save = cloudSave; A.replaceDB = replaceDB; A.lookupUser = lookupUser; A.ensureFile = ensureFile; A.storageOK = true;
    try {
      const app = F.initializeApp(CFG);
      const auth = F.getAuth(app);
      if (G.CSA_EMULATOR && F.connectAuthEmulator) F.connectAuthEmulator(auth, 'http://' + G.CSA_EMULATOR.auth, { disableWarnings: true });
      try { await withTimeout(F.signInAnonymously(auth), 15000); S.auth = 'ok'; } catch (e) { S.auth = e.code || e.message || 'erreur'; console.warn('Connexion anonyme Firebase impossible', e); }
      BK.init(app);
      let cfg;
      try { cfg = await withTimeout(BK.getDoc('config', 'main', true), 15000); }
      catch (e) {
        if (isDenied(e)) return fatal('denied', e);
        if (e && /not[-_ ]?found|does not exist/i.test(String(e.code) + ' ' + e.message)) return fatal('nodb', e);
        if (!BK.getCached) return fatal('offline', e);
        try { cfg = await BK.getCached('config', 'main'); } catch (e2) { return fatal('offline', e); }
        if (cfg == null) return fatal('offline', e);
      }
      const localDB = A.DB;
      A.DB = blank(localDB);
      S.ready = true;
      if (cfg == null) { S.msg = 'Première mise en service : création de la base en ligne…'; screen(); await initialUpload(localDB); }
      else applyConfig(cfg);
      cfgUnsub = BK.listen({ c: 'config', doc: 'main' }, (list, live) => { if (!live) return; if (flushQueued) flushNow(); const d = list[0] && list[0].data; if (d && applyConfig(d)) requestRender(); }, () => {}, listenerError);
      const sid = readSession(); let u = null;
      if (sid) { try { const d = await withTimeout(BK.getDoc('users', sid, true), 15000); if (d) { u = fromFS('users', d); u.id = sid; if (u.active === false) u = null; } } catch (e) {} }
      A.DB.session = u ? u.id : null; writeSession();
      await setScope(u);
    } catch (e) { fatal(isDenied(e) ? 'denied' : 'error', e); }
  };

  // ---------- fonctions remplacées en mode en ligne ----------
  function cloudSave() {
    writeSession();
    if (!S.ready) return;
    const sid = A.DB.session || null;
    if (sid !== S.scopeUid) { flushNow(); const u = sid ? A.DB.users.find((x) => x.id === sid) : null; setScope(u || null); return; }
    if (!flushQueued) { flushQueued = true; Promise.resolve().then(() => { if (flushQueued) flushNow(); }); }
  }
  async function lookupUser(kind, idf) {
    const low = String(idf || '').trim().toLowerCase(); if (!low || !db) return;
    try {
      const list = await withTimeout(BK.query('users', '_idn', low), 15000);
      list.forEach((d) => applyRec('users', d.id, d.data, 'lookup'));
    } catch (e) { console.warn(e); A.toast('Vérification en ligne impossible : contrôlez la connexion internet.'); }
  }
  async function ensureFile(f) {
    if (!f || !f.blob || f.text != null || f.data != null) return f;
    if (blobCache.has(f.blob)) { f[f.bf || 'data'] = blobCache.get(f.blob); return f; }
    try {
      const parts = await Promise.all([...Array(f.bn || 1)].map((_, i) => BK.getDoc(FILES, f.blob + '_' + i)));
      const s = parts.map((p) => (p ? p.d : '')).join(''); blobCache.set(f.blob, s); f[f.bf || 'data'] = s;
    } catch (e) { A.toast('Fichier indisponible : contrôlez la connexion internet.'); }
    return f;
  }
  async function replaceDB(o, after) {
    S.loading = true; S.msg = 'Remplacement des données en ligne…'; screen();
    stopListeners();
    try {
      for (const c of ALL.concat([FILES])) await BK.wipe(c);
      Object.keys(SH).forEach((c) => SH[c].clear());
      A.DB = o; A.DB.session = o.session && (o.users || []).some((u) => u.id === o.session) ? o.session : null;
      flushNow();
      const u = A.DB.session ? A.DB.users.find((x) => x.id === A.DB.session) : null;
      await setScope(u || null);
    } catch (e) { return fatal('error', e); }
    if (after) after();
  }
  // le rendu attend la fin du chargement ; toute nouvelle page efface l'invitation à actualiser
  const baseRender = A.render;
  A.render = function () {
    if (S.mode === 'cloud' && (S.loading || S.fatal)) return screen();
    const b = document.getElementById('cloud-refresh'); if (b) b.remove();
    return baseRender.apply(this, arguments);
  };
})(window);
