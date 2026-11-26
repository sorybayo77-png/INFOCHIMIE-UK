/* manage.js — espaces enseignant et administrateur, puis démarrage */
(function (G) {
  'use strict';
  const A = G.APP, C = G.Chem, K = G.CONTENT, esc = A.esc, I = A.icon, head = A.head, bar = A.bar;
  const studentStats = (s) => {
    const subs = A.subsOf(s.id), g = subs.filter((x) => x.status === 'corrige'), avg = A.avgModules(s.id), ex = A.best(s.id, 'exam');
    const acts = A.DB.attempts.filter((a) => a.uid === s.id).map((a) => a.date).concat(subs.map((x) => x.date), Object.values(A.DB.progress[s.id] || {}));
    return { prog: A.totalProgress(s.id), avg, ex, tp: g.length ? g.reduce((a, x) => a + x.grade, 0) / g.length : null, nsub: subs.length, last: acts.length ? Math.max(...acts) : null };
  };
  const classModuleAvg = () => K.modules.filter((m) => m.quiz.length).map((m) => { const v = A.students().map((s) => A.best(s.id, 'module', m.id)).filter(Boolean).map((a) => a.score / a.max); return { m, n: v.length, avg: v.length ? v.reduce((s, x) => s + x, 0) / v.length : null }; });
  const n20 = (x) => (x == null ? '—' : C.fr(x * 20, 1) + '/20');

  // =========================================================== TABLEAUX DE BORD
  A.views.dashTeacher = () => {
    const u = A.me(), st = A.students(), pend = A.DB.subs.filter((s) => s.status === 'rendu').sort((a, b) => a.date - b.date);
    const avgs = st.map((s) => A.avgModules(s.id)).filter((x) => x != null), gavg = avgs.length ? avgs.reduce((a, x) => a + x, 0) / avgs.length : null;
    const comp = st.length ? Math.round(st.reduce((a, s) => a + A.totalProgress(s.id), 0) / st.length) : 0;
    return {
      title: 'Tableau de bord enseignant', html: head('Bonjour ' + esc(u.name), esc(u.dept || 'Espace enseignant')) + `
<div class="grid g4"><div class="card kpi"><span>Étudiants inscrits</span><b>${st.length}</b><span>${st.filter((s) => s.active !== false).length} actifs</span></div>
<div class="card kpi"><span>Travaux à corriger</span><b style="color:${pend.length ? 'var(--orange)' : 'inherit'}">${pend.length}</b><a class="small" href="#corrections">Ouvrir les corrections</a></div>
<div class="card kpi"><span>Moyenne de la promotion aux tests</span><b>${n20(gavg)}</b></div>
<div class="card kpi"><span>Avancement moyen du parcours</span><b>${comp}%</b></div></div>
<div class="grid g2" style="margin-top:16px">
<div class="card"><h3>Travaux en attente</h3>${pend.length ? `<div class="list">${pend.slice(0, 6).map((s) => `<div class="li"><span class="avatar">${esc(A.initials(A.user(s.uid).name))}</span><span class="grow"><span class="t">${esc(A.user(s.uid).name)} — TP ${s.tp}</span><br><span class="s">Déposé le ${A.fmtDate(s.date, true)} · ${s.files.length} fichier(s)</span></span><button class="btn sm pri" data-act="grade" data-id="${s.id}">Corriger</button></div>`).join('')}</div>` : '<p class="empty">Tous les travaux sont corrigés.</p>'}</div>
<div class="card"><h3>Moyenne de la promotion par module</h3><div class="hbars">${classModuleAvg().map((x) => `<div class="hbar"><span>M${x.m.id} · ${esc(x.m.short)}</span>${bar(x.avg == null ? 0 : Math.round(x.avg * 100), 'blue')}<b>${x.avg == null ? '—' : C.fr(x.avg * 20, 1)}</b></div>`).join('')}</div><p class="small muted" style="margin-top:10px">Note moyenne sur 20 de la meilleure tentative de chaque étudiant.</p></div>
<div class="card"><h3>Raccourcis</h3><div class="list"><a class="li" href="#gestion-cours">${I('plus')}<span class="grow t">Ajouter un chapitre, un PDF ou une vidéo</span></a><a class="li" href="#questionnaires">${I('pencil')}<span class="grow t">Créer une question</span></a><a class="li" href="#suivi">${I('chart')}<span class="grow t">Suivre les résultats individuels</span></a></div></div>
<div class="card"><h3>Activité récente</h3>${A.DB.logs.filter((l) => l.uid && A.user(l.uid).role === 'etudiant').slice(0, 7).map((l) => `<div class="small" style="padding:6px 0;border-bottom:1px solid var(--line2)"><b>${esc(A.user(l.uid).name)}</b> — ${esc(l.act)}${l.det ? ' : ' + esc(l.det) : ''}<br><span class="muted">${A.fmtDate(l.date, true)}</span></div>`).join('') || '<p class="empty">Aucune activité.</p>'}</div>
</div>`
    };
  };
  A.views.dashAdmin = () => {
    const U = A.DB.users, now = Date.now(), D = 86400000;
    const days = [...Array(14)].map((_, i) => { const d0 = new Date(now - (13 - i) * D); d0.setHours(0, 0, 0, 0); const t0 = d0.getTime(); return { t0, n: A.DB.logs.filter((l) => l.date >= t0 && l.date < t0 + D).length }; });
    const mx = Math.max(1, ...days.map((d) => d.n));
    return {
      title: 'Administration', html: head('Administration de la plateforme', 'Vue d’ensemble des comptes, des contenus et de l’activité.') + `
<div class="grid g4"><div class="card kpi"><span>Utilisateurs</span><b>${U.length}</b><span>${U.filter((u) => u.role === 'etudiant').length} étudiants · ${U.filter((u) => u.role === 'enseignant').length} enseignants · ${U.filter((u) => u.role === 'admin').length} admin.</span></div>
<div class="card kpi"><span>Évolution des étudiants</span><b>${A.students().filter((s) => A.lastEval(s.id)).length}/${A.students().length}</b><span>étudiants évalués</span><a class="small" href="#controle">Ouvrir le contrôle des étudiants</a></div>
<div class="card kpi"><span>Contenus</span><b>${K.modules.reduce((s, m) => s + A.lessonsOf(m.id, true).length, 0)}</b><span>leçons · ${K.modules.filter((m) => A.DB.modState[m.id] !== false).length}/${K.modules.length} modules publiés</span></div>
<div class="card kpi"><span>Évaluations passées</span><b>${A.DB.attempts.length}</b><span>${A.DB.subs.length} dépôts de TP · ${A.DB.subs.filter((s) => s.status === 'rendu').length} à corriger</span></div></div>
<div class="grid g2" style="margin-top:16px">
<div class="card"><h3>Activité des 14 derniers jours</h3><div style="display:grid;grid-template-columns:repeat(14,minmax(0,1fr));gap:6px;align-items:end;height:150px">${days.map((d) => `<div title="${new Date(d.t0).toLocaleDateString('fr-FR')} : ${d.n} opération(s)" style="background:var(--blue);border-radius:4px 4px 0 0;height:${Math.max(3, d.n / mx * 140)}px;opacity:${d.n ? 1 : .25}"></div>`).join('')}</div><div class="row between small muted" style="margin-top:6px"><span>${new Date(days[0].t0).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span><span>aujourd’hui</span></div></div>
<div class="card"><h3>Résultats par module</h3><div class="hbars">${classModuleAvg().map((x) => `<div class="hbar"><span>M${x.m.id} · ${esc(x.m.short)}</span>${bar(x.avg == null ? 0 : Math.round(x.avg * 100), 'blue')}<b>${x.avg == null ? '—' : C.fr(x.avg * 20, 1)}</b></div>`).join('')}</div></div>
<div class="card"><h3>Dernières opérations</h3>${A.DB.logs.slice(0, 8).map((l) => `<div class="small" style="padding:6px 0;border-bottom:1px solid var(--line2)"><b>${esc(l.uid ? A.user(l.uid).name : 'Système')}</b> — ${esc(l.act)}${l.det ? ' : ' + esc(l.det) : ''}<br><span class="muted">${A.fmtDate(l.date, true)}</span></div>`).join('')}<a class="small" href="#journal">Journal complet</a></div>
<div class="card"><h3>Sécurité et sauvegarde</h3><ul class="small"><li>Mots de passe stockés sous forme d’empreinte salée (jamais en clair).</li><li>Rôles et permissions modifiables dans <a href="#autorisations">Autorisations</a>.</li><li>Fichiers déposés contrôlés : extension autorisée et taille limitée.</li><li>Opérations importantes journalisées.</li></ul><a class="btn sm" href="#parametres">${I('down', 16)} Sauvegarder la base</a></div>
</div>`
    };
  };

  // =========================================================== GESTION DES COURS
  A.route(/^gestion-cours$/, () => {
    const L = A.DB.lessons, ed = A.editLesson ? L.find((l) => l.id === A.editLesson) : null, modOpts = (sel) => K.modules.map((m) => `<option value="${m.id}" ${+sel === m.id ? 'selected' : ''}>Module ${m.id} — ${esc(m.short)}</option>`).join('');
    return {
      title: 'Gestion des cours', html: head('Gestion des cours', 'Publiez les modules, ajoutez des chapitres, des documents PDF et des vidéos.') + `
<div class="card"><h3>Modules</h3><div class="scroll"><table class="tbl stack"><thead><tr><th>Module</th><th class="num">Leçons</th><th class="num">Ajoutées</th><th class="num">Questions</th><th>Publication</th></tr></thead><tbody>${K.modules.map((m) => `<tr><td><a href="#module-${m.id}">M${m.id} · ${esc(m.title)}</a></td><td class="num">${m.lessons.length}</td><td class="num">${L.filter((l) => l.mod === m.id).length}</td><td class="num">${A.quizOf(m.id).length}</td><td><label class="check"><input type="checkbox" data-chg="pubMod" data-id="${m.id}" ${A.DB.modState[m.id] !== false ? 'checked' : ''}> ${A.DB.modState[m.id] !== false ? 'Publié' : 'Masqué aux étudiants'}</label></td></tr>`).join('')}</tbody></table></div></div>
<div class="grid g2" style="margin-top:16px;align-items:start">
<form class="card" data-form="lesson" id="lesson-form"><h3>${ed ? 'Modifier le chapitre' : 'Ajouter un chapitre'}</h3>
<div class="field"><label for="ls-m">Module</label><select id="ls-m" name="mod">${modOpts(ed ? ed.mod : 1)}</select></div>
<div class="field"><label for="ls-t">Titre</label><input id="ls-t" name="title" type="text" required value="${esc(ed ? ed.title : '')}"></div>
<div class="field"><label for="ls-o">Objectifs pédagogiques <small>(un par ligne)</small></label><textarea id="ls-o" name="obj" style="min-height:70px">${esc(ed ? (ed.obj || []).join('\n') : '')}</textarea></div>
<div class="field"><label for="ls-i">Introduction</label><textarea id="ls-i" name="intro" style="min-height:60px">${esc(ed ? ed.intro : '')}</textarea></div>
<div class="field"><label for="ls-b">Explications détaillées <small>(paragraphes séparés par une ligne vide)</small></label><textarea id="ls-b" name="body" style="min-height:160px" required>${esc(ed ? ed.body : '')}</textarea></div>
<div class="field"><label for="ls-s">Résumé <small>(un point par ligne)</small></label><textarea id="ls-s" name="sum" style="min-height:60px">${esc(ed ? (ed.sum || []).join('\n') : '')}</textarea></div>
<div class="grid g2"><div class="field"><label for="ls-d">Durée (min)</label><input id="ls-d" name="dur" type="number" min="5" max="180" value="${ed ? ed.dur : 15}"></div><div class="field"><label for="ls-v">Lien vidéo <small>(facultatif)</small></label><input id="ls-v" name="video" type="url" placeholder="https://" value="${esc(ed ? ed.videoUrl || '' : '')}"></div></div>
<label class="check"><input type="checkbox" name="pub" ${!ed || ed.published ? 'checked' : ''}> Publier immédiatement</label>
<div class="row" style="margin-top:10px"><button class="btn pri">${ed ? 'Enregistrer' : 'Ajouter le chapitre'}</button>${ed ? '<button type="button" class="btn" data-act="cancelEdit">Annuler</button>' : ''}</div></form>
<div class="grid">
<div class="card"><h3>Chapitres ajoutés</h3>${L.length ? `<div class="list">${L.map((l) => `<div class="li"><span class="grow"><span class="t">${esc(l.title)}</span><br><span class="s">Module ${l.mod} · ${l.published ? 'publié' : 'brouillon'} · ${esc(A.user(l.author).name)}</span></span><a class="btn sm ghost" href="#lecon-${l.id}">Voir</a><button class="btn sm" data-act="editLesson" data-id="${l.id}">Modifier</button><button class="iconbtn" data-act="delLesson" data-id="${l.id}" aria-label="Supprimer">${I('trash', 18)}</button></div>`).join('')}</div>` : '<p class="muted small">Aucun chapitre ajouté. Les leçons de base des 7 modules sont déjà en ligne.</p>'}</div>
<form class="card" data-form="doc"><h3>Importer un document PDF</h3><div class="field"><label for="dc-t">Titre</label><input id="dc-t" name="title" type="text" required></div><div class="field"><label for="dc-m">Module</label><select id="dc-m" name="mod"><option value="">Général</option>${modOpts()}</select></div><div class="field"><label for="dc-f">Fichier (PDF ou image, 1 Mo max en démonstration)</label><input id="dc-f" type="file" name="file" accept=".pdf,.png,.jpg,.jpeg,.docx,.pptx" required></div><div id="dc-err"></div><button class="btn pri">${I('up', 18)} Importer</button></form>
<form class="card" data-form="video"><h3>Ajouter une vidéo</h3><div class="field"><label for="vd-t">Titre</label><input id="vd-t" name="title" type="text" required></div><div class="field"><label for="vd-u">Lien (YouTube, serveur de l’université…)</label><input id="vd-u" name="url" type="url" placeholder="https://" required></div><div class="field"><label for="vd-m">Module</label><select id="vd-m" name="mod">${modOpts()}</select></div><button class="btn pri">${I('plus', 18)} Ajouter</button>
${A.DB.videos.length ? `<div class="list" style="margin-top:14px">${A.DB.videos.map((v) => `<div class="li"><span class="grow"><span class="t">${esc(v.title)}</span><br><span class="s">Module ${v.mod}</span></span><button type="button" class="iconbtn" data-act="delVideo" data-id="${v.id}" aria-label="Supprimer">${I('trash', 18)}</button></div>`).join('')}</div>` : ''}</form>
${A.DB.docs.length ? `<div class="card"><h3>Documents importés</h3><div class="list">${A.DB.docs.map((d) => `<div class="li"><span class="grow"><span class="t">${esc(d.title)}</span><br><span class="s">${esc(d.name)} · ${Math.ceil(d.size / 1024)} Ko</span></span><button class="iconbtn" data-act="delDoc" data-id="${d.id}" aria-label="Supprimer">${I('trash', 18)}</button></div>`).join('')}</div></div>` : ''}
</div></div>`,
      mount() { if (ed) document.getElementById('lesson-form').scrollIntoView({ block: 'start' }); }
    };
  }, { perm: 'cours.gerer' });
  A.chg.pubMod = (el) => { A.DB.modState[el.dataset.id] = el.checked; A.log(el.checked ? 'Module publié' : 'Module masqué', 'Module ' + el.dataset.id); if (el.checked) A.students().forEach((s) => A.notify(s.id, 'Le module ' + el.dataset.id + ' « ' + A.mod(el.dataset.id).title + ' » est disponible.', 'module-' + el.dataset.id)); A.save(); A.render(); };
  A.form.lesson = (f, d) => {
    const lines = (k) => String(d.get(k) || '').split('\n').map((x) => x.trim()).filter(Boolean), u = A.me();
    const data = { mod: +d.get('mod'), title: String(d.get('title')).trim(), obj: lines('obj'), intro: String(d.get('intro') || '').trim(), body: String(d.get('body')).trim(), sum: lines('sum'), dur: +d.get('dur') || 15, videoUrl: /^https?:\/\//.test(String(d.get('video'))) ? String(d.get('video')).trim() : '', published: !!d.get('pub') };
    if (!data.title || !data.body) return A.toast('Titre et contenu obligatoires.');
    if (A.editLesson) { Object.assign(A.DB.lessons.find((l) => l.id === A.editLesson), data); A.log('Chapitre modifié', data.title); A.editLesson = null; }
    else { const l = { id: A.uid('c-'), author: u.id, created: Date.now(), ...data }; A.DB.lessons.push(l); A.log('Chapitre ajouté', data.title); if (l.published) A.students().forEach((s) => A.notify(s.id, 'Nouveau chapitre : « ' + l.title + ' » (module ' + l.mod + ').', 'lecon-' + l.id)); }
    A.save(); A.toast('Chapitre enregistré'); A.render();
  };
  A.act.editLesson = (el) => { A.editLesson = el.dataset.id; A.render(); };
  A.act.cancelEdit = () => { A.editLesson = null; A.render(); };
  A.act.delLesson = (el) => A.confirm('Supprimer ce chapitre ? La progression associée sera perdue.', () => { A.DB.lessons = A.DB.lessons.filter((l) => l.id !== el.dataset.id); A.log('Chapitre supprimé'); A.save(); A.render(); }, 'Supprimer');
  A.form.doc = async (f, d) => {
    const file = f.querySelector('#dc-f').files[0], err = (m) => { f.querySelector('#dc-err').innerHTML = `<div class="alert bad">${m}</div>`; };
    if (!file) return err('Choisissez un fichier.'); if (!/\.(pdf|png|jpe?g|docx|pptx)$/i.test(file.name)) return err('Format non accepté.'); if (file.size > 1024 * 1024) return err('Fichier trop volumineux pour la démonstration (1 Mo max).');
    const data = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(file); });
    A.DB.docs.push({ id: A.uid('d-'), title: String(d.get('title')).trim() || file.name, mod: d.get('mod') ? +d.get('mod') : null, name: file.name, size: file.size, data, author: A.me().id, date: Date.now() });
    A.log('Document importé', file.name); A.save(); if (!A.storageOK) { A.DB.docs.pop(); return err('Stockage du navigateur plein.'); } A.toast('Document ajouté à la bibliothèque'); A.render();
  };
  A.form.video = (f, d) => { const url = String(d.get('url')).trim(); if (!/^https?:\/\//.test(url)) return A.toast('Lien invalide.'); const v = { id: A.uid('v-'), title: String(d.get('title')).trim(), url, mod: +d.get('mod'), author: A.me().id, date: Date.now() }; A.DB.videos.push(v); A.log('Vidéo ajoutée', v.title); A.save(); A.toast('Vidéo ajoutée'); A.render(); };
  A.act.delVideo = (el) => { A.DB.videos = A.DB.videos.filter((v) => v.id !== el.dataset.id); A.save(); A.render(); };
  A.act.delDoc = (el) => A.confirm('Supprimer ce document ?', () => { A.DB.docs = A.DB.docs.filter((v) => v.id !== el.dataset.id); A.save(); A.render(); }, 'Supprimer');

  // =========================================================== QUESTIONNAIRES
  A.route(/^questionnaires$/, () => {
    const Q = A.DB.questions;
    return {
      title: 'Questionnaires', html: head('Exercices et questionnaires', 'Complétez les tests de module avec vos propres questions. Elles entrent aussi dans le tirage de l’examen final.') + `
<div class="grid g2" style="align-items:start">
<form class="card" data-form="question"><h3>Nouvelle question</h3>
<div class="field"><label for="qq-m">Module</label><select id="qq-m" name="mod">${K.modules.filter((m) => m.id <= 6).map((m) => `<option value="${m.id}">Module ${m.id} — ${esc(m.short)}</option>`).join('')}</select></div>
<div class="field"><label for="qq-t">Type</label><select id="qq-t" name="t" data-chg="qType"><option value="qcm">Choix multiple (4 propositions)</option><option value="court">Réponse courte</option></select></div>
<div class="field"><label for="qq-q">Énoncé</label><textarea id="qq-q" name="q" required style="min-height:80px"></textarea></div>
<div id="qq-qcm">${[0, 1, 2, 3].map((i) => `<div class="field"><label for="qq-o${i}">Proposition ${i + 1}</label><div class="row" style="flex-wrap:nowrap"><input id="qq-o${i}" name="o${i}" type="text"><label class="check" style="flex:none"><input type="radio" name="a" value="${i}" ${i === 0 ? 'checked' : ''}> correcte</label></div></div>`).join('')}</div>
<div id="qq-court" hidden><div class="field"><label for="qq-acc">Réponses acceptées <small>(séparées par des points-virgules ; majuscules, accents et espaces ignorés)</small></label><input id="qq-acc" name="acc" type="text" placeholder="CH4 ; ch4"></div></div>
<div class="field"><label for="qq-e">Explication affichée dans la correction</label><textarea id="qq-e" name="e" style="min-height:60px"></textarea></div>
<div id="qq-err"></div><button class="btn pri">${I('plus', 18)} Ajouter la question</button></form>
<div class="grid"><div class="card"><h3>Questions par module</h3><table class="tbl"><thead><tr><th>Module</th><th class="num">De base</th><th class="num">Ajoutées</th><th></th></tr></thead><tbody>${K.modules.filter((m) => m.id <= 6).map((m) => `<tr><td>M${m.id} · ${esc(m.short)}</td><td class="num">${m.quiz.length}</td><td class="num">${Q.filter((q) => q.mod === m.id).length}</td><td class="num"><a class="btn sm ghost" href="#quiz-${m.id}">Aperçu</a></td></tr>`).join('')}</tbody></table></div>
<div class="card"><h3>Vos questions</h3>${Q.length ? `<div class="list">${Q.map((q) => `<div class="li"><span class="grow"><span class="t">${esc(q.q)}</span><br><span class="s">Module ${q.mod} · ${q.t === 'court' ? 'réponse courte : ' + esc(q.acc.join(' ; ')) : 'QCM · bonne réponse : ' + esc(q.o[q.a])}</span></span><button class="iconbtn" data-act="delQ" data-id="${q.id}" aria-label="Supprimer">${I('trash', 18)}</button></div>`).join('')}</div>` : '<p class="muted small">Aucune question ajoutée.</p>'}</div>
<div class="card"><h3>Exercices automatiques</h3><p class="small">${K.draw.length} exercices de dessin et ${K.reco.length} modèles de reconnaissance 3D sont corrigés automatiquement par la plateforme.</p><a class="btn sm" href="#suivi">Voir les réussites par étudiant</a></div></div></div>`
    };
  }, { perm: 'questions.gerer' });
  A.chg.qType = (el) => { const c = el.value === 'court'; document.getElementById('qq-qcm').hidden = c; document.getElementById('qq-court').hidden = !c; };
  A.form.question = (f, d) => {
    const t = String(d.get('t')), q = String(d.get('q')).trim(), err = (m) => { f.querySelector('#qq-err').innerHTML = `<div class="alert bad">${m}</div>`; };
    if (q.length < 8) return err('Énoncé trop court.');
    const item = { id: A.uid('q-'), mod: +d.get('mod'), q, e: String(d.get('e') || '').trim(), author: A.me().id };
    if (t === 'court') { item.t = 'court'; item.acc = String(d.get('acc') || '').split(';').map((x) => x.trim()).filter(Boolean); if (!item.acc.length) return err('Indiquez au moins une réponse acceptée.'); }
    else { item.o = [0, 1, 2, 3].map((i) => String(d.get('o' + i) || '').trim()); if (item.o.some((x) => !x)) return err('Remplissez les 4 propositions.'); item.a = +d.get('a'); }
    A.DB.questions.push(item); A.log('Question ajoutée', 'Module ' + item.mod); A.save(); A.toast('Question ajoutée au test du module ' + item.mod); A.render();
  };
  A.act.delQ = (el) => A.confirm('Supprimer cette question ?', () => { A.DB.questions = A.DB.questions.filter((q) => q.id !== el.dataset.id); A.save(); A.render(); }, 'Supprimer');

  // =========================================================== CORRECTIONS
  A.route(/^corrections$/, () => {
    const f = A.corrFilter || 'rendu', list = A.DB.subs.filter((s) => f === 'tous' || s.status === f).sort((a, b) => (f === 'rendu' ? a.date - b.date : b.date - a.date));
    return {
      title: 'Corrections', html: head('Corrections des travaux pratiques', 'Ouvrez un dépôt pour visualiser les fichiers (aperçu 3D des fichiers .mol et .xyz), puis attribuez une note sur 20.') + `
<div class="row" style="margin-bottom:12px"><div class="seg" role="group" aria-label="Filtre">${[['rendu', 'À corriger'], ['corrige', 'Corrigés'], ['tous', 'Tous']].map(([k, t]) => `<button data-act="corrFilter" data-f="${k}" class="${f === k ? 'on' : ''}">${t} (${k === 'tous' ? A.DB.subs.length : A.DB.subs.filter((s) => s.status === k).length})</button>`).join('')}</div></div>
<div class="card">${list.length ? `<table class="tbl stack"><thead><tr><th>Étudiant</th><th>TP</th><th>Déposé le</th><th>Fichiers</th><th>Statut</th><th></th></tr></thead><tbody>${list.map((s) => `<tr><td><b>${esc(A.user(s.uid).name)}</b><br><span class="muted small">${esc(A.user(s.uid).matricule || '')} · ${esc(A.user(s.uid).filiere || '')}</span></td><td>TP ${s.tp} — ${esc(A.tp(s.tp).title)}</td><td>${A.fmtDate(s.date, true)}</td><td>${s.files.map((x) => esc(x.name)).join('<br>')}</td><td>${s.status === 'corrige' ? `<span class="badge green">${C.fr(s.grade, 1)}/20</span>` : '<span class="badge orange">À corriger</span>'}</td><td class="num"><button class="btn sm ${s.status === 'corrige' ? '' : 'pri'}" data-act="grade" data-id="${s.id}">${s.status === 'corrige' ? 'Revoir' : 'Corriger'}</button></td></tr>`).join('')}</tbody></table>` : '<p class="empty">Aucun dépôt dans cette catégorie.</p>'}</div>`
    };
  }, { perm: 'travaux.corriger' });
  A.act.corrFilter = (el) => { A.corrFilter = el.dataset.f; A.render(); };
  A.act.grade = async (el) => {
    const s0 = A.DB.subs.find((x) => x.id === el.dataset.id); if (!s0) return; await A.ensureFiles(s0.files);
    const s = A.DB.subs.find((x) => x.id === el.dataset.id); if (!s) return; const t = A.tp(s.tp), st = A.user(s.uid);
    const molFile = s.files.find((f) => f.text && /^(mol|sdf|xyz)$/.test(f.type)), img = s.files.find((f) => f.data && /^data:image/.test(f.data));
    A.modal(`<div class="row between"><h3 style="margin:0">${esc(st.name)} — TP ${s.tp}</h3><button class="btn sm" data-act="closeModal">Fermer</button></div><p class="muted small">${esc(t.title)} · déposé le ${A.fmtDate(s.date, true)}</p>
${s.comment ? `<div class="note"><b>Commentaire de l’étudiant :</b> ${esc(s.comment)}</div>` : ''}
<div class="grid g2" style="margin-top:14px;align-items:start"><div>
${molFile ? `<div class="fig" style="margin:0"><div class="v3d-host short" id="gr-v"></div><div class="figinfo" id="gr-i"></div></div>` : img ? `<img src="${img.data}" alt="Image déposée" style="max-width:100%;border-radius:10px;border:1px solid var(--line)">` : '<div class="empty card">Aperçu non disponible pour ce format.</div>'}
<p class="mini-h">Fichiers</p><div class="list">${s.files.map((f, i) => `<div class="li"><span class="grow small"><b>${esc(f.name)}</b> · ${Math.ceil(f.size / 1024)} Ko</span><button class="btn sm" data-act="dlSubFile" data-id="${s.id}" data-i="${i}">${I('down', 16)}</button></div>`).join('')}</div></div>
<form data-form="gradeSub" data-id="${s.id}"><div class="field"><label for="gr-n">Note sur 20</label><input id="gr-n" name="grade" type="text" inputmode="decimal" placeholder="ex. 15,5" required value="${s.grade != null ? String(s.grade).replace('.', ',') : ''}"></div>
<p class="small muted">Barème indicatif : ${t.bareme.map(esc).join(' ; ')}</p>
<div class="field"><label for="gr-f">Appréciation</label><textarea id="gr-f" name="feedback" required>${esc(s.feedback || '')}</textarea></div><button class="btn pri" style="width:100%">Enregistrer et notifier l’étudiant</button></form></div>`, {
      wide: true, mount() {
        if (!molFile) return; const info = document.getElementById('gr-i');
        try { const m = A.to3DViewable(molFile.name, molFile.text); const v = new G.Viewer3D(document.getElementById('gr-v'), { onInfo: (h) => { info.innerHTML = h; } }); v.setMolecule(m); A.live.push(v); info.innerHTML = '<b>' + C.formulaHTML(C.counts(m, false)) + '</b>' + (C.recognize(C.to2D(m)) ? ' · <span class="badge green">' + esc(C.recognize(C.to2D(m)).name) + '</span>' : '') + ' · cliquez sur un atome pour l’inspecter'; }
        catch (e) { info.textContent = 'Fichier illisible : ' + e.message; }
      }
    });
  };
  A.act.dlSubFile = async (el) => {
    const s = A.DB.subs.find((x) => x.id === el.dataset.id), f = s && s.files[+el.dataset.i]; if (!f) return; await A.ensureFile(f);
    if (f.text) { const isMol = /^(mol|sdf|xyz|cml|pdb|mol2|cjson)$/.test(f.type); if (isMol) A.download(f.name.replace(/\.[^.]+$/, '') + '.zip', A.zip([{ name: f.name, data: f.text }]), f.text); else A.download(f.name.replace(/\.[^.]+$/, '') + '.txt', f.text); return; }
    try { const [h, b64] = f.data.split(','); const bin = atob(b64), arr = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i); const ok = /\.(png|jpe?g|pdf)$/i.test(f.name); A.download(ok ? f.name : f.name + '.zip', ok ? new Blob([arr]) : A.zip([{ name: f.name, data: arr }])); } catch (e) { A.toast('Fichier illisible.'); }
  };
  A.form.gradeSub = (f, d) => {
    const s = A.DB.subs.find((x) => x.id === f.dataset.id), g = Math.max(0, Math.min(20, parseFloat(String(d.get('grade')).replace(',', '.'))));
    if (isNaN(g)) return A.toast('Note invalide.');
    s.grade = g; s.feedback = String(d.get('feedback')).trim(); s.status = 'corrige'; s.gradedBy = A.me().id; s.gradedAt = Date.now();
    A.notify(s.uid, 'Votre TP ' + s.tp + ' a été corrigé : ' + C.fr(g, 1) + '/20.', 'tp-' + s.tp); A.log('Correction', A.user(s.uid).name + ' — TP ' + s.tp + ' : ' + C.fr(g, 1) + '/20'); A.save(); A.closeModal(); A.toast('Note enregistrée, étudiant notifié'); A.render();
  };

  // =========================================================== SUIVI DES ÉTUDIANTS
  A.route(/^suivi$/, () => {
    const st = A.students();
    return {
      title: 'Suivi des étudiants', html: head('Suivi des étudiants', 'Résultats individuels et collectifs.', `<button class="btn" data-act="dlClassCSV">${I('down', 18)} Exporter (CSV)</button>`) + `
<div class="card"><h3>Résultats individuels</h3><div class="scroll"><table class="tbl stack"><thead><tr><th>Matricule</th><th>Étudiant</th><th>Filière</th><th class="num">Progression</th><th class="num">Tests</th><th class="num">Examen</th><th class="num">TP</th><th class="num">Dessins</th><th>Dernière activité</th><th></th></tr></thead><tbody>
${st.map((s) => { const x = studentStats(s); return `<tr><td><code>${esc(s.matricule || '—')}</code></td><td><b>${esc(s.name)}</b>${s.active === false ? ' <span class="badge red">désactivé</span>' : ''}</td><td>${esc(s.filiere || '')}</td><td class="num">${x.prog}%</td><td class="num">${n20(x.avg)}</td><td class="num">${x.ex ? A.fmtNote(x.ex.score, x.ex.max) : '—'}</td><td class="num">${x.tp == null ? '—' : C.fr(x.tp, 1) + '/20'}</td><td class="num">${Object.keys(A.DB.draws[s.id] || {}).length}/${K.draw.length}</td><td>${x.last ? A.fmtDate(x.last) : '—'}</td><td class="num"><button class="btn sm" data-act="studentDetail" data-id="${s.id}">Détail</button></td></tr>`; }).join('')}
</tbody></table></div></div>
<div class="grid g2" style="margin-top:16px"><div class="card"><h3>Moyenne de la promotion par module</h3><div class="hbars">${classModuleAvg().map((x) => `<div class="hbar"><span>M${x.m.id} · ${esc(x.m.short)}</span>${bar(x.avg == null ? 0 : Math.round(x.avg * 100), 'blue')}<b>${x.avg == null ? '—' : C.fr(x.avg * 20, 1)}</b></div>`).join('')}</div></div>
<div class="card"><h3>Avancement par module</h3><div class="hbars">${K.modules.map((m) => { const v = st.length ? Math.round(st.reduce((a, s) => a + A.modProgress(s.id, m.id).p, 0) / st.length) : 0; return `<div class="hbar"><span>M${m.id} · ${esc(m.short)}</span>${bar(v)}<b>${v}%</b></div>`; }).join('')}</div></div></div>`
    };
  }, { perm: 'resultats.voir' });
  A.act.studentDetail = (el) => {
    const s = A.user(el.dataset.id), x = studentStats(s), at = A.DB.attempts.filter((a) => a.uid === s.id).sort((a, b) => b.date - a.date);
    A.modal(`<div class="row between"><h3 style="margin:0">${esc(s.name)}</h3><button class="btn sm" data-act="closeModal">Fermer</button></div><p class="muted small">Matricule ${esc(s.matricule || '—')} · ${esc(s.filiere || '')}${s.email ? ' · ' + esc(s.email) : ''}</p>
<div class="grid g4" style="margin:12px 0"><div class="kpi"><span>Progression</span><b>${x.prog}%</b></div><div class="kpi"><span>Tests</span><b>${n20(x.avg)}</b></div><div class="kpi"><span>Examen</span><b>${x.ex ? A.fmtNote(x.ex.score, x.ex.max) : '—'}</b></div><div class="kpi"><span>TP</span><b>${x.tp == null ? '—' : C.fr(x.tp, 1)}</b></div></div>
<h4>Évaluations</h4>${at.length ? `<table class="tbl"><tbody>${at.map((a) => `<tr><td>${esc(A.attemptLabel(a))}</td><td>${A.fmtDate(a.date)}</td><td class="num"><b>${A.fmtNote(a.score, a.max)}</b></td></tr>`).join('')}</tbody></table>` : '<p class="muted">Aucune.</p>'}
<h4>Travaux pratiques</h4>${A.subsOf(s.id).length ? `<table class="tbl"><tbody>${A.subsOf(s.id).map((d) => `<tr><td>TP ${d.tp}</td><td>${A.fmtDate(d.date)}</td><td class="num">${d.status === 'corrige' ? C.fr(d.grade, 1) + '/20' : '<span class="badge orange">à corriger</span>'}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">Aucun dépôt.</p>'}
<div class="row" style="justify-content:flex-end"><button class="btn" data-act="dlStudentReleve" data-id="${s.id}">${I('down', 18)} Relevé de l’étudiant</button></div>`, { wide: true });
  };
  A.act.dlStudentReleve = (el) => { const s = A.user(el.dataset.id); A.downloadPDF('Releve_' + A.slug(s.name), 'Relevé — ' + s.name, A.releve(s)); };
  A.act.dlClassCSV = () => {
    const rows = [['Matricule', 'Nom', 'Filière', 'E-mail', 'Progression %'].concat(K.modules.filter((m) => m.quiz.length).map((m) => 'Test M' + m.id + ' /20'), ['Examen /20', 'Moyenne TP /20', 'Dessins réussis'])];
    A.students().forEach((s) => { const x = studentStats(s); rows.push([s.matricule || '', s.name, s.filiere || '', s.email || '', x.prog].concat(K.modules.filter((m) => m.quiz.length).map((m) => { const b = A.best(s.id, 'module', m.id); return b ? C.fr(A.note20(b.score, b.max), 2) : ''; }), [x.ex ? C.fr(A.note20(x.ex.score, x.ex.max), 2) : '', x.tp == null ? '' : C.fr(x.tp, 2), Object.keys(A.DB.draws[s.id] || {}).length])); });
    A.download('Resultats_promotion.csv', A.csv(rows));
  };

  // =========================================================== UTILISATEURS
  // codes générés automatiquement à chaque création d'administrateur : BAGLAM-002, BAGLAM-003…
  // numéro jamais réutilisé, même après la suppression d'un compte (compteur conservé dans la configuration)
  const nextAdmCode = () => { let n = Math.max(1, A.DB.admSeq | 0); A.DB.users.forEach((a) => { const m = String(a.code || '').toUpperCase().match(/^BAGLAM-(\d+)$/); if (m) n = Math.max(n, +m[1]); }); return 'BAGLAM-' + String(n + 1).padStart(3, '0'); };
  A.nextAdmCode = nextAdmCode;
  const activeAdmins = () => A.admins().filter((a) => a.active !== false);
  const amPrincipal = () => A.isPrincipal(A.me());
  // un administrateur secondaire ne gère que les étudiants et les enseignants ; le compte principal ne se modifie que par lui-même
  const canManage = (u) => { const me = A.me(); if (!me || !u) return false; if (A.isPrincipal(u)) return me.id === u.id; if (u.role === 'admin') return amPrincipal(); return true; };
  const roleLabel = (u) => (A.isPrincipal(u) ? '<span class="badge orange">Administrateur principal</span>' : A.roleName[u.role]);
  A.route(/^utilisateurs$/, () => {
    const q = (A.userQ || '').toLowerCase(), r = A.userR || '', me = A.me(), pr = amPrincipal();
    const U = A.DB.users.filter((u) => (!r || u.role === r) && (!q || [u.name, u.email, u.matricule, u.code, u.filiere, u.dept].join(' ').toLowerCase().includes(q)))
      .sort((a, b) => (A.isPrincipal(b) - A.isPrincipal(a)) || ((a.role === 'admin') === (b.role === 'admin') ? 0 : a.role === 'admin' ? -1 : 1));
    const acts = (u) => {
      if (!canManage(u)) return `<span class="small muted">${A.isPrincipal(u) ? 'Compte principal' : 'Réservé à l’administrateur principal'}</span>`;
      return `<button class="btn sm" data-act="editUser" data-id="${u.id}">Modifier</button> ${u.id === me.id ? '' : `<button class="btn sm" data-act="resetPw" data-id="${u.id}">Mot de passe</button> `}${u.id === me.id || A.isPrincipal(u) ? '' : `<button class="iconbtn" data-act="delUser" data-id="${u.id}" aria-label="Supprimer ${esc(u.name)}">${I('trash', 18)}</button>`}`;
    };
    const lock = (u) => u.id === me.id || A.isPrincipal(u) || !canManage(u);
    return {
      title: 'Utilisateurs', html: head('Gestion des utilisateurs', A.DB.users.length + ' comptes. Étudiants : matricule · enseignants : e-mail · administrateurs : code identifiant attribué automatiquement.' + (pr ? '' : ' Seul l’administrateur principal crée et gère les comptes administrateurs.')) + `
<div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,340px);align-items:start" id="us-grid"><div class="card">
<div class="row" style="margin-bottom:10px"><input type="search" id="us-q" placeholder="Rechercher un nom, un matricule, un code…" value="${esc(A.userQ || '')}" style="flex:1;min-width:200px" aria-label="Rechercher"><select id="us-r" aria-label="Filtrer par rôle" style="width:auto"><option value="">Tous les rôles</option>${Object.entries(A.roleName).map(([k, v]) => `<option value="${k}" ${r === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
<div class="scroll"><table class="tbl stack"><thead><tr><th>Nom</th><th>Code d’accès</th><th>Rôle</th><th>État</th><th>Dernière connexion</th><th></th></tr></thead><tbody>
${U.map((u) => `<tr><td><b>${esc(u.name)}</b><br><span class="small muted">${esc(u.role === 'admin' ? A.adminTitle(u) : (u.filiere || u.dept || ''))}</span></td><td><code>${esc(A.ident(u))}</code><br><span class="small muted">${A.identLabel[u.role]}</span></td><td>${roleLabel(u)}</td><td><label class="check"><input type="checkbox" data-chg="setActive" data-id="${u.id}" ${u.active !== false ? 'checked' : ''} ${lock(u) ? 'disabled' : ''}> ${u.active !== false ? 'Actif' : 'Désactivé'}</label></td><td>${u.last ? A.fmtDate(u.last, true) : '—'}</td><td class="num" style="white-space:nowrap">${acts(u)}</td></tr>`).join('') || '<tr><td colspan="6" class="empty">Aucun résultat.</td></tr>'}
</tbody></table></div></div>
<form class="card" data-form="addUser"><h3>Ajouter un utilisateur</h3>
<div class="field"><label for="au-r">Rôle</label><select id="au-r" name="role" data-chg="auRole"><option value="etudiant">Étudiant</option><option value="enseignant">Enseignant</option>${pr ? '<option value="admin">Administrateur</option>' : ''}</select></div>
<div class="field"><label for="au-n">Nom et prénom</label><input id="au-n" name="name" type="text" required></div>
<div class="field au-f" data-for="etudiant"><label for="au-m">Matricule (code d’accès)</label><input id="au-m" name="matricule" type="text" inputmode="numeric" placeholder="Exemple : 20200104962"></div>
<div class="field au-f" data-for="etudiant"><label for="au-fi">Filière</label><select id="au-fi" name="filiere">${A.FILIERES.map((f) => `<option>${esc(f)}</option>`).join('')}</select></div>
<div class="field au-f" data-for="enseignant" hidden><label for="au-e">E-mail (code d’accès)</label><input id="au-e" name="email" type="email"></div>
${pr ? `<div class="field au-f" data-for="admin" hidden><label>Code identifiant</label><div class="note" style="font-weight:600">${nextAdmCode()} <span class="small muted" style="font-weight:400">— attribué automatiquement</span></div></div>
<div class="field au-f" data-for="admin" hidden><label for="au-t">Fonction</label><input id="au-t" name="titre" type="text" placeholder="Administrateur"></div>` : ''}
<div class="field au-f" data-for="enseignant admin" hidden><label for="au-d">Département ou service</label><input id="au-d" name="dept" type="text"></div>
<div id="au-err" aria-live="polite"></div><button class="btn pri">${I('plus', 18)} Créer le compte</button><p class="small muted" style="margin-top:8px">Un mot de passe provisoire conforme aux règles de sécurité est généré et affiché une seule fois. L’utilisateur devra le changer.</p></form></div>
<style>@media(max-width:1000px){#us-grid{grid-template-columns:minmax(0,1fr)!important}}</style>`,
      mount() { const qi = document.getElementById('us-q'); let t; qi.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { A.userQ = qi.value; A.render(); const n = document.getElementById('us-q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 250); }); document.getElementById('us-r').onchange = (e) => { A.userR = e.target.value; A.render(); }; }
    };
  }, { perm: 'users.gerer' });
  A.chg.auRole = (el) => { A.$$('.au-f', el.form).forEach((f) => { f.hidden = !f.dataset.for.split(' ').includes(el.value); }); };
  // contrôle des identifiants selon le rôle (unicité, format) ; le code administrateur n'est jamais saisi
  const checkIdent = (role, d, selfId) => {
    if (role === 'etudiant') { const m = String(d.get('matricule') || '').trim(); if (!A.MATRICULE_RE.test(m)) return 'Matricule invalide : 6 à 20 chiffres ou lettres, sans espace.'; const o = A.findUser('etudiant', m); if (o && o.id !== selfId) return 'Ce matricule est déjà utilisé par ' + esc(o.name) + '.'; return ''; }
    if (role === 'enseignant') { const e = String(d.get('email') || '').trim().toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return 'E-mail invalide.'; const o = A.findUser('enseignant', e); if (o && o.id !== selfId) return 'Cet e-mail est déjà utilisé.'; return ''; }
    if (role === 'admin' && !amPrincipal()) return 'Seul l’administrateur principal peut créer ou gérer un compte administrateur.';
    return '';
  };
  const applyIdent = (u, role, d) => {
    if (role === 'etudiant') { u.matricule = String(d.get('matricule')).trim(); u.filiere = String(d.get('filiere') || u.filiere || ''); }
    if (role === 'enseignant') { u.email = String(d.get('email')).trim().toLowerCase(); u.dept = String(d.get('dept') || '').trim(); }
    if (role === 'admin') { if (!u.code || !/^BAGLAM-\d+$|^ADM-\d+$/i.test(u.code) || (A.findUser('admin', u.code) && A.findUser('admin', u.code).id !== u.id)) { u.code = nextAdmCode(); A.DB.admSeq = +u.code.slice(7); } if (d.has('titre') && !A.isPrincipal(u)) u.titre = String(d.get('titre') || '').trim() || 'Administrateur'; if (d.has('dept')) u.dept = String(d.get('dept') || '').trim(); }
  };
  A.form.addUser = async (f, d) => {
    const name = String(d.get('name')).trim(), role = String(d.get('role')), err = (m) => { f.querySelector('#au-err').innerHTML = `<div class="alert bad">${m}</div>`; };
    if (name.length < 3) return err('Nom trop court.');
    if (role === 'etudiant' && A.MATRICULE_RE.test(String(d.get('matricule') || '').trim())) await A.lookupUser('etudiant', String(d.get('matricule')).trim());
    if (role === 'enseignant') await A.lookupUser('enseignant', String(d.get('email') || '').trim());
    const ie = checkIdent(role, d); if (ie) return err(ie);
    const id = A.uid('u-'), p = A.tmpPw(), u = { id, name, role, pw: A.hashPw(id, p), pwDefault: true, active: true, created: Date.now(), createdBy: A.me().id };
    applyIdent(u, role, d); A.DB.users.push(u); A.notify(u.id, 'Bienvenue sur la plateforme. Changez votre mot de passe provisoire dans votre profil.', 'profil');
    A.log('Compte créé', name + ' (' + A.roleName[role] + ', ' + A.ident(u) + ')'); A.save(); A.render();
    A.modal(`<h3>Compte créé</h3><p>${esc(name)} — ${esc(A.roleName[role])}</p><dl class="kv"><dt>${A.identLabel[role]} (code d’accès)</dt><dd>${esc(A.ident(u))}</dd><dt>Mot de passe provisoire</dt><dd>${esc(p)}</dd><dt>Page de connexion</dt><dd>${role === 'admin' ? 'Espace administrateur' : 'Connexion'}</dd></dl><p class="small muted">Ce mot de passe ne sera plus affiché. L’utilisateur devra le changer dans son profil.</p><div class="row" style="justify-content:flex-end"><button class="btn" data-act="copyCreds" data-t="${esc(A.identLabel[role] + ' : ' + A.ident(u) + ' — Mot de passe provisoire : ' + p)}">${I('copy', 18)} Copier</button><button class="btn pri" data-act="closeModal">J’ai noté ces informations</button></div>`);
  };
  A.act.copyCreds = (el) => A.copy(el.dataset.t, 'Identifiants');
  A.act.editUser = (el) => {
    const u = A.user(el.dataset.id), me = A.me(), pr = amPrincipal(); if (!canManage(u)) { A.toast('Réservé à l’administrateur principal.'); return; }
    const roleLocked = u.id === me.id || A.isPrincipal(u);
    A.modal(`<div class="row between"><h3 style="margin:0">Modifier le compte</h3><button class="btn sm" data-act="closeModal">Fermer</button></div>
<form data-form="editUser" data-id="${u.id}" style="margin-top:12px">
<div class="field"><label for="eu-n">Nom et prénom</label><input id="eu-n" name="name" type="text" value="${esc(u.name)}" required></div>
<div class="field"><label for="eu-r">Rôle</label><select id="eu-r" name="role" data-chg="auRole" ${roleLocked ? 'disabled' : ''}>${Object.entries(A.roleName).filter(([k]) => k !== 'admin' || pr || u.role === 'admin').map(([k, v]) => `<option value="${k}" ${u.role === k ? 'selected' : ''}>${v}</option>`).join('')}</select>${roleLocked ? '<small>Ce rôle ne peut pas être modifié ici.</small>' : ''}</div>
<div class="field au-f" data-for="etudiant" ${u.role === 'etudiant' ? '' : 'hidden'}><label for="eu-m">Matricule (code d’accès)</label><input id="eu-m" name="matricule" type="text" value="${esc(u.matricule || '')}"></div>
<div class="field au-f" data-for="etudiant" ${u.role === 'etudiant' ? '' : 'hidden'}><label for="eu-f">Filière</label><select id="eu-f" name="filiere">${A.FILIERES.map((f) => `<option ${f === u.filiere ? 'selected' : ''}>${esc(f)}</option>`).join('')}</select></div>
<div class="field au-f" data-for="enseignant" ${u.role === 'enseignant' ? '' : 'hidden'}><label for="eu-e">E-mail (code d’accès)</label><input id="eu-e" name="email" type="email" value="${esc(u.email || '')}"></div>
<div class="field au-f" data-for="admin" ${u.role === 'admin' ? '' : 'hidden'}><label>Code identifiant</label><div class="note" style="font-weight:600">${esc(u.code || nextAdmCode())} <span class="small muted" style="font-weight:400">— attribué automatiquement, non modifiable</span></div></div>
${A.isPrincipal(u) ? '' : `<div class="field au-f" data-for="admin" ${u.role === 'admin' ? '' : 'hidden'}><label for="eu-t">Fonction</label><input id="eu-t" name="titre" type="text" value="${esc(A.adminTitle(u))}"></div>`}
<div class="field au-f" data-for="enseignant admin" ${u.role !== 'etudiant' ? '' : 'hidden'}><label for="eu-d">Département ou service</label><input id="eu-d" name="dept" type="text" value="${esc(u.dept || '')}"></div>
<div id="eu-err" aria-live="polite"></div><div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-act="closeModal">Annuler</button><button class="btn pri">Enregistrer</button></div></form>`);
  };
  A.form.editUser = (f, d) => {
    const u = A.user(f.dataset.id), me = A.me(), err = (m) => { f.querySelector('#eu-err').innerHTML = `<div class="alert bad">${m}</div>`; };
    if (!canManage(u)) return err('Réservé à l’administrateur principal.');
    const role = u.id === me.id || A.isPrincipal(u) ? u.role : String(d.get('role'));
    if ((role === 'admin') !== (u.role === 'admin') && !amPrincipal()) return err('Seul l’administrateur principal peut attribuer ou retirer le rôle administrateur.');
    const name = String(d.get('name')).trim(); if (name.length < 3) return err('Nom trop court.');
    const ie = checkIdent(role, d, u.id); if (ie && !(role === 'admin' && amPrincipal())) return err(ie);
    const old = A.roleName[u.role]; u.name = name; u.role = role; applyIdent(u, role, d);
    A.log('Compte modifié', name + (old !== A.roleName[role] ? ' : ' + old + ' → ' + A.roleName[role] : '') + ' (' + A.ident(u) + ')'); A.save(); A.closeModal(); A.toast('Compte mis à jour'); A.render();
  };
  A.chg.setActive = (el) => {
    const u = A.user(el.dataset.id);
    if (!canManage(u) || A.isPrincipal(u)) { el.checked = u.active !== false; A.toast(A.isPrincipal(u) ? 'Le compte principal reste toujours actif.' : 'Réservé à l’administrateur principal.'); return; }
    if (!el.checked && u.role === 'admin' && activeAdmins().filter((a) => a.id !== u.id).length === 0) { el.checked = true; A.toast('Il faut garder au moins un administrateur actif.'); return; }
    u.active = el.checked; A.log(el.checked ? 'Compte réactivé' : 'Compte désactivé', u.name + ' (' + A.ident(u) + ')'); A.save(); A.render();
  };
  A.act.resetPw = (el) => { const u = A.user(el.dataset.id); if (!canManage(u) || u.id === A.me().id) { A.toast('Réservé à l’administrateur principal.'); return; } A.confirm('Générer un nouveau mot de passe provisoire pour ' + esc(u.name) + ' ?', () => { const p = A.tmpPw(); u.pw = A.hashPw(u.id, p); u.pwDefault = true; A.log('Mot de passe réinitialisé', u.name); A.save(); A.modal(`<h3>Mot de passe provisoire</h3><p>Communiquez ces informations à ${esc(u.name)} : le mot de passe ne sera plus affiché.</p><dl class="kv"><dt>${A.identLabel[u.role]}</dt><dd>${esc(A.ident(u))}</dd><dt>Mot de passe provisoire</dt><dd>${esc(p)}</dd></dl><div class="row" style="justify-content:flex-end"><button class="btn" data-act="copyCreds" data-t="${esc(A.identLabel[u.role] + ' : ' + A.ident(u) + ' — Mot de passe provisoire : ' + p)}">${I('copy', 18)} Copier</button><button class="btn pri" data-act="closeModal">J’ai noté le mot de passe</button></div>`); }, 'Générer', false); };
  A.act.delUser = (el) => {
    const u = A.user(el.dataset.id);
    if (A.isPrincipal(u)) { A.toast('Le compte principal ne peut pas être supprimé.'); return; }
    if (!canManage(u)) { A.toast('Réservé à l’administrateur principal.'); return; }
    A.confirm('Supprimer définitivement le compte de ' + esc(u.name) + ' (' + esc(A.ident(u)) + ') et toutes ses données (progression, résultats, dépôts, évaluations) ? Cette action est irréversible.', () => { const id = u.id; A.DB.users = A.DB.users.filter((x) => x.id !== id); A.DB.attempts = A.DB.attempts.filter((a) => a.uid !== id); A.DB.subs = A.DB.subs.filter((s) => s.uid !== id); A.DB.notifs = A.DB.notifs.filter((n) => n.uid !== id); A.DB.evals = A.DB.evals.filter((e) => e.uid !== id); delete A.DB.progress[id]; delete A.DB.mols[id]; delete A.DB.draws[id]; A.log('Compte supprimé', u.name + ' (' + A.ident(u) + ')'); A.save(); A.render(); }, 'Supprimer définitivement');
  };

  // =========================================================== CONTRÔLE DE L’ÉVOLUTION (réservé aux administrateurs)
  const daysSince = (t) => (t ? Math.floor((Date.now() - t) / 86400000) : null);
  A.route(/^controle$/, () => {
    const all = A.students(), q = (A.ctlQ || '').toLowerCase(), fil = A.ctlF || '', st = A.ctlS || '', sort = A.ctlSort || 'nom';
    let L = all.map((s) => ({ s, x: studentStats(s), ev: A.lastEval(s.id) }));
    L = L.filter(({ s, x, ev }) => (!q || [s.name, s.matricule, s.email].join(' ').toLowerCase().includes(q)) && (!fil || s.filiere === fil) &&
      (!st || (st === 'actifs' && s.active !== false) || (st === 'inactifs' && s.active === false) || (st === 'nonevalues' && !ev) || (st === 'sansactivite' && (x.last == null || daysSince(x.last) > 14))));
    const key = { nom: (o) => o.s.name.toLowerCase(), matricule: (o) => String(o.s.matricule || ''), progression: (o) => -o.x.prog, note: (o) => (o.ev ? -o.ev.global : 99), activite: (o) => -(o.x.last || 0) }[sort];
    L.sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
    const evaluated = all.filter((s) => A.lastEval(s.id)), notes = evaluated.map((s) => A.lastEval(s.id).global), avgN = notes.length ? notes.reduce((a, x) => a + x, 0) / notes.length : null;
    const idle = all.filter((s) => { const x = studentStats(s); return x.last == null || daysSince(x.last) > 14; }).length;
    const fils = [...new Set(all.map((s) => s.filiere).filter(Boolean))].sort();
    return {
      title: 'Contrôle des étudiants', html: `<div class="admin-ribbon">${I('shield', 18)} Fenêtre réservée aux administrateurs · ${esc(A.me().name)} (${esc(A.me().code || '')})</div>` + head('Contrôle de l’évolution des étudiants', 'Tous les étudiants inscrits, sans exception, y compris les comptes désactivés. Ouvrez une fiche pour contrôler l’évolution et attribuer une note.', `<button class="btn" data-act="dlControlCSV">${I('down', 18)} Exporter (CSV)</button>`) + `
<div class="grid g4"><div class="card kpi"><span>Étudiants inscrits</span><b>${all.length}</b><span>${all.filter((s) => s.active !== false).length} actifs · ${all.filter((s) => s.active === false).length} désactivés</span></div>
<div class="card kpi"><span>Étudiants évalués</span><b>${evaluated.length}/${all.length}</b><span>${all.length - evaluated.length} en attente d’évaluation</span></div>
<div class="card kpi"><span>Moyenne des notes d’évolution</span><b>${avgN == null ? '—' : C.fr(avgN, 1) + '/20'}</b></div>
<div class="card kpi"><span>Sans activité depuis 14 jours</span><b style="color:${idle ? 'var(--orange)' : 'inherit'}">${idle}</b><button class="btn sm ghost" data-act="ctlState" data-s="sansactivite" style="justify-self:start;padding-left:0">Afficher</button></div></div>
<div class="card" style="margin-top:16px"><div class="row" style="margin-bottom:12px">
<input type="search" id="ct-q" placeholder="Rechercher un nom ou un matricule" value="${esc(A.ctlQ || '')}" style="flex:1;min-width:200px" aria-label="Rechercher un étudiant">
<select id="ct-f" aria-label="Filière" style="width:auto"><option value="">Toutes les filières</option>${fils.map((f) => `<option ${f === fil ? 'selected' : ''}>${esc(f)}</option>`).join('')}</select>
<select id="ct-s" aria-label="État" style="width:auto">${[['', 'Tous les étudiants'], ['actifs', 'Actifs'], ['inactifs', 'Désactivés'], ['nonevalues', 'Non évalués'], ['sansactivite', 'Sans activité (14 j)']].map(([k, t]) => `<option value="${k}" ${k === st ? 'selected' : ''}>${t}</option>`).join('')}</select>
<select id="ct-o" aria-label="Trier par" style="width:auto">${[['nom', 'Trier par nom'], ['matricule', 'par matricule'], ['progression', 'par progression'], ['note', 'par note d’évolution'], ['activite', 'par activité récente']].map(([k, t]) => `<option value="${k}" ${k === sort ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
<div class="scroll"><table class="tbl stack"><thead><tr><th>Matricule</th><th>Étudiant</th><th>Progression</th><th class="num">Tests</th><th class="num">Examen</th><th class="num">TP</th><th>Dernière activité</th><th class="num">Note d’évolution</th><th></th></tr></thead><tbody>
${L.map(({ s, x, ev }) => `<tr><td><code>${esc(s.matricule || '—')}</code></td><td><b>${esc(s.name)}</b>${s.active === false ? ' <span class="badge red">désactivé</span>' : ''}<br><span class="small muted">${esc(s.filiere || '')}</span></td><td style="min-width:130px"><div class="row" style="gap:8px;flex-wrap:nowrap">${bar(x.prog)}<b class="small">${x.prog}%</b></div></td><td class="num">${n20(x.avg)}</td><td class="num">${x.ex ? A.fmtNote(x.ex.score, x.ex.max) : '—'}</td><td class="num">${x.tp == null ? '—' : C.fr(x.tp, 1) + '/20'}</td><td>${x.last ? A.fmtDate(x.last) : '<span class="badge orange">aucune</span>'}</td><td class="num">${ev ? `<b>${C.fr(ev.global, 1)}/20</b><br><span class="small muted">${A.fmtDate(ev.date)}</span>` : '<span class="badge">à évaluer</span>'}</td><td class="num"><a class="btn sm pri" href="#controle-${s.id}">Contrôler et noter</a></td></tr>`).join('') || '<tr><td colspan="9" class="empty">Aucun étudiant ne correspond à ces critères.</td></tr>'}
</tbody></table></div><p class="small muted" style="margin:8px 0 0">${L.length} étudiant(s) affiché(s) sur ${all.length}.</p></div>`,
      mount() {
        const qi = document.getElementById('ct-q'); let t;
        qi.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { A.ctlQ = qi.value; A.render(); const n = document.getElementById('ct-q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 250); });
        document.getElementById('ct-f').onchange = (e) => { A.ctlF = e.target.value; A.render(); };
        document.getElementById('ct-s').onchange = (e) => { A.ctlS = e.target.value; A.render(); };
        document.getElementById('ct-o').onchange = (e) => { A.ctlSort = e.target.value; A.render(); };
      }
    };
  }, { admin: true });
  A.act.ctlState = (el) => { A.ctlS = el.dataset.s; A.render(); };
  A.route(/^controle-(.+)$/, (m) => {
    const s = A.DB.users.find((u) => u.id === m[1] && u.role === 'etudiant');
    if (!s) return { title: 'Contrôle', html: '<div class="card empty"><h2>Étudiant introuvable</h2><a class="btn" href="#controle">Retour à la liste</a></div>' };
    const x = studentStats(s), evs = A.DB.evals.filter((e) => e.uid === s.id).sort((a, b) => b.date - a.date), last = evs[0];
    const subs = A.subsOf(s.id), acts = A.DB.attempts.filter((a) => a.uid === s.id).map((a) => ({ d: a.date, t: A.attemptLabel(a) + ' : ' + A.fmtNote(a.score, a.max) }))
      .concat(subs.map((d) => ({ d: d.date, t: 'Dépôt du TP ' + d.tp + (d.status === 'corrige' ? ' (noté ' + C.fr(d.grade, 1) + '/20)' : '') })),
        Object.entries(A.DB.progress[s.id] || {}).map(([lid, d]) => { const l = A.findLesson(lid); return { d, t: 'Leçon terminée : ' + (l ? l.title : lid) }; }))
      .sort((a, b) => b.d - a.d).slice(0, 12);
    const all = A.students().sort((a, b) => a.name.localeCompare(b.name)), i = all.findIndex((u) => u.id === s.id), prev = all[i - 1], next = all[i + 1];
    const modRows = K.modules.map((mo) => {
      const p = A.modProgress(s.id, mo.id), b = A.best(s.id, 'module', mo.id), tps = subs.filter((d) => A.tp(d.tp).mod === mo.id && d.status === 'corrige');
      const val = last && last.mods && last.mods[mo.id] != null ? last.mods[mo.id] : '';
      return `<tr><td><b>M${mo.id}</b> · ${esc(mo.short)}</td><td style="min-width:140px"><div class="row" style="gap:8px;flex-wrap:nowrap">${bar(p.p)}<span class="small">${p.d}/${p.n}</span></div></td><td class="num">${b ? A.fmtNote(b.score, b.max) : '—'}</td><td class="num">${A.attemptsOf(s.id, 'module', mo.id).length}</td><td class="num">${tps.length ? tps.map((d) => C.fr(d.grade, 1)).join(' · ') : '—'}</td><td class="num"><input type="text" inputmode="decimal" name="m${mo.id}" value="${val === '' ? '' : String(val).replace('.', ',')}" placeholder="—" aria-label="Note d’évolution du module ${mo.id}" style="width:96px;min-height:38px;text-align:right"></td></tr>`;
    }).join('');
    return {
      title: 'Contrôle — ' + s.name, html: `<div class="admin-ribbon">${I('shield', 18)} Fenêtre réservée aux administrateurs</div><div class="crumbs"><a href="#controle">Contrôle des étudiants</a> › ${esc(s.name)}</div>` +
        head(esc(s.name), 'Matricule <b>' + esc(s.matricule || '—') + '</b> · ' + esc(s.filiere || '') + ' · inscrit le ' + A.fmtDate(s.created) + (s.active === false ? ' · <span class="badge red">compte désactivé</span>' : ''), `${prev ? `<a class="btn" href="#controle-${prev.id}">${I('back', 18)} Précédent</a>` : ''}${next ? `<a class="btn" href="#controle-${next.id}">Suivant ${I('arrow', 18)}</a>` : ''}`) + `
<div class="grid g4"><div class="card kpi"><span>Progression du parcours</span><b>${x.prog}%</b>${bar(x.prog)}</div><div class="card kpi"><span>Moyenne des tests</span><b>${n20(x.avg)}</b></div><div class="card kpi"><span>Examen final</span><b>${x.ex ? A.fmtNote(x.ex.score, x.ex.max) : '—'}</b></div><div class="card kpi"><span>Moyenne des TP</span><b>${x.tp == null ? '—' : C.fr(x.tp, 1) + '/20'}</b><span>${x.nsub} dépôt(s) · ${Object.keys(A.DB.draws[s.id] || {}).length}/${K.draw.length} dessins réussis</span></div></div>
<form class="card" data-form="evalStudent" data-id="${s.id}" style="margin-top:16px"><div class="row between"><h3 style="margin:0">Évolution par module et notation</h3><span class="muted small">Dernière activité : ${x.last ? A.fmtDate(x.last, true) : 'aucune'}</span></div>
<p class="small muted">Notez l’évolution de l’étudiant module par module (facultatif) et attribuez une note globale d’évolution. Chaque évaluation est conservée dans l’historique et l’étudiant est notifié.</p>
<div class="scroll"><table class="tbl stack"><thead><tr><th>Module</th><th>Leçons</th><th class="num">Meilleur test</th><th class="num">Tentatives</th><th class="num">TP notés</th><th class="num">Note /20</th></tr></thead><tbody>${modRows}</tbody></table></div>
<div class="grid" style="grid-template-columns:minmax(0,200px) minmax(0,1fr);gap:16px;align-items:start" id="ev-grid"><div class="field"><label for="ev-g">Note globale d’évolution /20</label><input id="ev-g" name="global" type="text" inputmode="decimal" required placeholder="ex. 14,5" value="${last ? String(last.global).replace('.', ',') : ''}" style="font-size:22px;font-weight:600"></div>
<div class="field"><label for="ev-c">Appréciation</label><textarea id="ev-c" name="comment" required placeholder="Points forts, points à améliorer, conseils…">${esc(last ? last.comment : '')}</textarea></div></div>
<div id="ev-err" aria-live="polite"></div><div class="row"><button class="btn pri">${I('check', 18)} Enregistrer l’évaluation et notifier l’étudiant</button><button type="button" class="btn" data-act="dlStudentReleve" data-id="${s.id}">${I('down', 18)} Relevé complet</button></div></form>
<div class="grid g2" style="margin-top:16px;align-items:start">
<div class="card"><h3>Historique des évaluations</h3>${evs.length ? `<table class="tbl stack"><thead><tr><th>Date</th><th>Administrateur</th><th class="num">Note</th><th>Appréciation</th><th></th></tr></thead><tbody>${evs.map((e) => `<tr><td>${A.fmtDate(e.date, true)}</td><td>${esc(A.user(e.by).name)}</td><td class="num"><b>${C.fr(e.global, 1)}/20</b></td><td>${esc(e.comment)}${Object.entries(e.mods || {}).filter(([, v]) => v != null && v !== '').length ? `<br><span class="small muted">${Object.entries(e.mods).filter(([, v]) => v != null && v !== '').map(([k, v]) => 'M' + k + ' ' + C.fr(v, 1)).join(' · ')}</span>` : ''}</td><td class="num"><button class="iconbtn" data-act="delEval" data-id="${e.id}" aria-label="Supprimer cette évaluation">${I('trash', 18)}</button></td></tr>`).join('')}</tbody></table>` : '<p class="empty">Aucune évaluation pour l’instant.</p>'}</div>
<div class="card"><h3>Activité récente</h3>${acts.length ? `<ul class="mlist">${acts.map((a) => `<li><span>${esc(a.t)}</span><span class="muted small" style="white-space:nowrap">${A.fmtDate(a.d)}</span></li>`).join('')}</ul>` : '<p class="empty">Aucune activité enregistrée.</p>'}</div></div>
<style>@media(max-width:700px){#ev-grid{grid-template-columns:minmax(0,1fr)!important}}</style>`
    };
  }, { admin: true });
  A.form.evalStudent = (f, d) => {
    const me = A.me(); if (!me || me.role !== 'admin') return;
    const s = A.user(f.dataset.id), err = (m) => { f.querySelector('#ev-err').innerHTML = `<div class="alert bad">${m}</div>`; };
    const num = (v) => { if (v == null || String(v).trim() === '') return null; const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? NaN : n; };
    const g = num(d.get('global')), comment = String(d.get('comment') || '').trim();
    if (g == null || isNaN(g) || g < 0 || g > 20) return err('La note globale doit être comprise entre 0 et 20.');
    if (comment.length < 5) return err('Rédigez une appréciation.');
    const mods = {}; for (const mo of K.modules) { const v = num(d.get('m' + mo.id)); if (v == null) continue; if (isNaN(v) || v < 0 || v > 20) return err('Note du module ' + mo.id + ' invalide (0 à 20).'); mods[mo.id] = v; }
    const x = studentStats(s);
    A.DB.evals.push({ id: A.uid('ev-'), uid: s.id, by: me.id, date: Date.now(), global: g, comment, mods, snap: { prog: x.prog, avg: x.avg } });
    A.notify(s.id, 'L’administration a évalué votre évolution : ' + C.fr(g, 1) + '/20.', 'resultats');
    A.log('Évaluation de l’évolution', s.name + ' (' + (s.matricule || '') + ') : ' + C.fr(g, 1) + '/20'); A.save(); A.toast('Évaluation enregistrée, étudiant notifié'); A.render();
  };
  A.act.delEval = (el) => A.confirm('Supprimer cette évaluation de l’historique ?', () => { const e = A.DB.evals.find((x) => x.id === el.dataset.id); A.DB.evals = A.DB.evals.filter((x) => x.id !== el.dataset.id); if (e) A.log('Évaluation supprimée', A.user(e.uid).name); A.save(); A.render(); }, 'Supprimer');
  A.act.dlControlCSV = () => {
    const rows = [['Matricule', 'Nom', 'Filière', 'État', 'Progression %', 'Moyenne tests /20', 'Examen /20', 'Moyenne TP /20', 'Dernière activité', 'Note d’évolution /20', 'Date de l’évaluation', 'Évaluée par', 'Appréciation'].concat(K.modules.map((m) => 'Évolution M' + m.id + ' /20'))];
    A.students().forEach((s) => { const x = studentStats(s), ev = A.lastEval(s.id); rows.push([s.matricule || '', s.name, s.filiere || '', s.active === false ? 'désactivé' : 'actif', x.prog, x.avg == null ? '' : C.fr(x.avg * 20, 2), x.ex ? C.fr(A.note20(x.ex.score, x.ex.max), 2) : '', x.tp == null ? '' : C.fr(x.tp, 2), x.last ? new Date(x.last).toLocaleDateString('fr-FR') : '', ev ? C.fr(ev.global, 2) : '', ev ? new Date(ev.date).toLocaleDateString('fr-FR') : '', ev ? A.user(ev.by).name : '', ev ? ev.comment : ''].concat(K.modules.map((m) => (ev && ev.mods && ev.mods[m.id] != null ? C.fr(ev.mods[m.id], 2) : '')))); });
    A.log('Export du contrôle des étudiants'); A.save(); A.download('Controle_evolution_etudiants_' + new Date().toISOString().slice(0, 10) + '.csv', A.csv(rows));
  };

  // =========================================================== AUTORISATIONS
  A.route(/^autorisations$/, () => ({
    title: 'Autorisations', html: head('Rôles et autorisations', 'Cochez les permissions accordées à chaque rôle. Les menus et les actions s’adaptent immédiatement.') + `
<div class="card scroll"><table class="tbl perm"><thead><tr><th>Permission</th>${Object.values(A.roleName).map((r) => `<th>${r}</th>`).join('')}</tr></thead><tbody>
${A.PERMS.map(([k, label]) => `<tr><td>${esc(label)}<br><code class="small">${k}</code></td>${Object.keys(A.roleName).map((r) => `<td><input type="checkbox" style="width:20px;height:20px;accent-color:var(--blue)" aria-label="${esc(label)} — ${A.roleName[r]}" data-chg="perm" data-r="${r}" data-k="${k}" ${A.DB.perms[r][k] ? 'checked' : ''} ${r === 'admin' && (k === 'plateforme.admin' || k === 'users.gerer') ? 'disabled' : ''}></td>`).join('')}</tr>`).join('')}
<tr><td>Contrôler l’évolution de tous les étudiants et l’évaluer<br><span class="small muted">Fenêtre réservée aux administrateurs, non modifiable</span></td><td>—</td><td>—</td><td>${I('check', 20)}</td></tr>
</tbody></table><button class="btn" data-act="resetPerms">Rétablir les autorisations par défaut</button></div>`
  }), { principal: true });
  A.chg.perm = (el) => { if (!A.isPrincipal(A.me())) return; A.DB.perms[el.dataset.r][el.dataset.k] = el.checked; A.log('Autorisation modifiée', A.roleName[el.dataset.r] + ' · ' + el.dataset.k + ' = ' + (el.checked ? 'oui' : 'non')); A.save(); A.toast('Autorisation enregistrée'); };
  A.act.resetPerms = () => A.isPrincipal(A.me()) && A.confirm('Rétablir les autorisations par défaut ?', () => { A.DB.perms = { etudiant: { 'cours.lire': true, 'tp.deposer': true, 'eval.passer': true }, enseignant: { 'cours.lire': true, 'cours.gerer': true, 'questions.gerer': true, 'travaux.corriger': true, 'resultats.voir': true, 'stats.voir': true }, admin: Object.fromEntries(A.PERMS.map(([k]) => [k, true])) }; A.log('Autorisations rétablies'); A.save(); A.render(); }, 'Rétablir', false);

  // =========================================================== JOURNAL
  A.route(/^journal$/, () => {
    const f = (A.logQ || '').toLowerCase(), L = A.DB.logs.filter((l) => !f || ((l.uid ? A.user(l.uid).name : '') + ' ' + l.act + ' ' + l.det).toLowerCase().includes(f)).slice(0, 200);
    const by = {}; A.DB.logs.forEach((l) => { by[l.act] = (by[l.act] || 0) + 1; }); const top = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 8), mx = top.length ? top[0][1] : 1;
    return {
      title: 'Journal', html: head('Journal et statistiques', 'Opérations importantes enregistrées par la plateforme (' + A.DB.logs.length + ' au total).') + `
<div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,320px);align-items:start" id="lg-grid"><div class="card"><input type="search" id="lg-q" placeholder="Filtrer par utilisateur ou opération" value="${esc(A.logQ || '')}" aria-label="Filtrer le journal" style="margin-bottom:10px">
<div class="scroll"><table class="tbl stack"><thead><tr><th>Date</th><th>Utilisateur</th><th>Opération</th><th>Détail</th></tr></thead><tbody>${L.map((l) => `<tr><td style="white-space:nowrap">${A.fmtDate(l.date, true)}</td><td>${esc(l.uid ? A.user(l.uid).name : 'Système')}</td><td>${esc(l.act)}</td><td>${esc(l.det)}</td></tr>`).join('') || '<tr><td colspan="4" class="empty">Aucune entrée.</td></tr>'}</tbody></table></div></div>
<div class="card"><h3>Opérations les plus fréquentes</h3><div class="hbars">${top.map(([k, n]) => `<div class="hbar" style="grid-template-columns:minmax(0,1fr) 90px 34px"><span>${esc(k)}</span>${bar(Math.round(n / mx * 100), 'blue')}<b>${n}</b></div>`).join('')}</div></div></div>
<style>@media(max-width:1000px){#lg-grid{grid-template-columns:minmax(0,1fr)!important}}</style>`,
      mount() { const qi = document.getElementById('lg-q'); let t; qi.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { A.logQ = qi.value; A.render(); const n = document.getElementById('lg-q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 250); }); }
    };
  }, { perm: 'stats.voir' });

  // =========================================================== PARAMÈTRES (évaluations, sauvegarde)
  A.route(/^parametres$/, () => {
    const S = A.DB.settings, size = (() => { try { return Math.round(JSON.stringify(A.DB).length / 1024); } catch (e) { return 0; } })();
    return {
      title: 'Paramètres', html: head('Évaluations et sauvegarde') + `<div class="grid g2" style="align-items:start">
<form class="card" data-form="settings"><h3>Examen final</h3><label class="check"><input type="checkbox" name="open" ${S.examOpen ? 'checked' : ''}> Examen ouvert aux étudiants</label>
<div class="grid g2" style="margin-top:10px"><div class="field"><label for="se-n">Nombre de questions</label><input id="se-n" name="n" type="number" min="5" max="40" value="${S.examN}"></div><div class="field"><label for="se-d">Durée (minutes)</label><input id="se-d" name="d" type="number" min="5" max="180" value="${S.examMin}"></div></div>
<div class="field"><label for="se-a">Tentatives autorisées par étudiant</label><input id="se-a" name="a" type="number" min="1" max="10" value="${S.examMax}"></div><button class="btn pri">Enregistrer</button></form>
<div class="card"><h3>Sauvegarde de la base</h3><p class="small">Données actuelles : ${A.DB.users.length} comptes, ${A.DB.attempts.length} évaluations, ${A.DB.subs.length} dépôts (${size} Ko).</p>
<div class="row"><button class="btn pri" data-act="backup">${I('down', 18)} Exporter (.json)</button>${A.isPrincipal(A.me()) ? `<label class="btn" style="cursor:pointer">${I('up', 18)} Restaurer<input type="file" id="restore" accept=".json" class="sr"></label>` : ''}</div>
<hr><h3>Mise en service</h3>${A.DB.demo ? `<p class="small">La plateforme contient encore des <b>données de démonstration</b> (un enseignant et quatre étudiants fictifs, leurs résultats et dépôts). Avant d’accueillir vos étudiants, supprimez-les : les comptes administrateurs, les cours, les questions et les documents ajoutés sont conservés.</p>${A.isPrincipal(A.me()) ? `<button class="btn warn" data-act="goLive">${I('check', 18)} Mettre en service (supprimer les données de démonstration)</button>` : '<p class="small muted">La mise en service est réservée à l’administrateur principal.</p>'}` : `<p class="small"><span class="badge green">En service</span> Les données de démonstration ont été supprimées${A.DB.liveAt ? ' le ' + A.fmtDate(A.DB.liveAt) : ''}.</p>`}
${A.isPrincipal(A.me()) ? '<hr><h3>Réinitialisation complète</h3><p class="small muted">Efface toutes les données et remet la plateforme dans son état de démonstration d’origine (le compte principal est conservé avec son mot de passe initial).</p><button class="btn danger" data-act="resetDemo">Réinitialiser la plateforme</button>' : ''}</div></div>`,
      mount() {
        const rs = document.getElementById('restore'); if (rs) rs.onchange = async (e) => { const f = e.target.files[0]; if (!f) return; try { const o = JSON.parse(await f.text()); if (o.v !== 2 || !Array.isArray(o.users)) throw new Error('Fichier de sauvegarde non reconnu.'); A.confirm('Remplacer toutes les données actuelles par cette sauvegarde ?', () => { const sess = A.DB.session; o.session = o.users.some((u) => u.id === sess) ? sess : null; A.replaceDB(o, () => { A.log('Base restaurée', f.name); A.save(); A.render(); }); }, 'Restaurer'); } catch (err) { A.toast(err.message); } e.target.value = ''; };
      }
    };
  }, { perm: 'plateforme.admin' });
  A.form.settings = (f, d) => { const S = A.DB.settings; S.examOpen = !!d.get('open'); S.examN = Math.max(5, Math.min(40, +d.get('n') || 15)); S.examMin = Math.max(5, Math.min(180, +d.get('d') || 20)); S.examMax = Math.max(1, Math.min(10, +d.get('a') || 3)); A.log('Paramètres de l’examen modifiés', S.examN + ' questions, ' + S.examMin + ' min'); A.save(); A.toast('Paramètres enregistrés'); A.render(); };
  A.act.backup = () => { A.log('Sauvegarde exportée'); A.save(); A.download('sauvegarde_plateforme_' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(A.DB, null, 1)); };
  A.act.goLive = () => A.isPrincipal(A.me()) && A.confirm('Supprimer définitivement l’enseignant et les étudiants de démonstration, ainsi que tous les résultats, dépôts, notifications et évaluations ? Les comptes administrateurs, les cours, les questions, les vidéos et les documents ajoutés sont conservés. Pensez à exporter une sauvegarde avant.', () => {
    const keep = new Set(A.DB.users.filter((u) => !u.demo).map((u) => u.id));
    A.DB.users = A.DB.users.filter((u) => keep.has(u.id)); A.DB.attempts = A.DB.attempts.filter((a) => keep.has(a.uid)); A.DB.subs = A.DB.subs.filter((x) => keep.has(x.uid));
    A.DB.notifs = A.DB.notifs.filter((n) => keep.has(n.uid)); A.DB.evals = A.DB.evals.filter((e) => keep.has(e.uid)); A.DB.logs = A.DB.logs.filter((l) => !l.uid || keep.has(l.uid));
    Object.keys(A.DB.progress).forEach((k) => { if (!keep.has(k)) delete A.DB.progress[k]; }); Object.keys(A.DB.mols).forEach((k) => { if (!keep.has(k)) delete A.DB.mols[k]; }); Object.keys(A.DB.draws).forEach((k) => { if (!keep.has(k)) delete A.DB.draws[k]; });
    A.DB.demo = false; A.DB.liveAt = Date.now(); A.log('Mise en service', 'données de démonstration supprimées'); A.save(); A.toast('Plateforme mise en service'); A.render();
  }, 'Mettre en service');
  A.act.resetDemo = () => A.isPrincipal(A.me()) && A.confirm('Effacer toutes les données et revenir à l’état de démonstration ?', () => { A.reset(); A.go('connexion'); }, 'Réinitialiser');

  // démarrage (connexion à la base en ligne si la plateforme est hébergée)
  if (A.boot) A.boot(); else A.render();
})(window);
