/* pubchem.js — recherche de n'importe quel composé dans PubChem (NCBI) : nom français ou anglais, formule brute,
   SMILES ou numéro CID ; récupération des coordonnées 2D et 3D (SDF). Les noms français sont traduits en anglais
   (dictionnaire + règles de nomenclature) avant l'interrogation, car PubChem indexe surtout des noms anglais. */
(function (G) {
  'use strict';
  const BASE = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/';
  const AUTO = 'https://pubchem.ncbi.nlm.nih.gov/rest/autocomplete/compound/';
  const strip = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘`]/g, "'").replace(/\s+/g, ' ').trim();
  const low = (s) => strip(s).toLowerCase();

  // ---------- dictionnaire français → anglais (noms usuels) ----------
  const DICT = {
    eau: 'water', 'eau oxygenee': 'hydrogen peroxide', 'peroxyde d\'hydrogene': 'hydrogen peroxide', ammoniac: 'ammonia', ozone: 'ozone',
    'gaz carbonique': 'carbon dioxide', 'dioxyde de carbone': 'carbon dioxide', 'monoxyde de carbone': 'carbon monoxide', 'dioxyde de soufre': 'sulfur dioxide', 'trioxyde de soufre': 'sulfur trioxide',
    'monoxyde d\'azote': 'nitric oxide', 'dioxyde d\'azote': 'nitrogen dioxide', 'protoxyde d\'azote': 'nitrous oxide', 'sulfure d\'hydrogene': 'hydrogen sulfide', 'chlorure d\'hydrogene': 'hydrogen chloride',
    dihydrogene: 'hydrogen', dioxygene: 'oxygen', diazote: 'nitrogen', dichlore: 'chlorine', dibrome: 'bromine', diiode: 'iodine', difluor: 'fluorine', helium: 'helium', argon: 'argon', neon: 'neon',
    'soude': 'sodium hydroxide', 'soude caustique': 'sodium hydroxide', 'potasse': 'potassium hydroxide', 'chaux vive': 'calcium oxide', 'chaux eteinte': 'calcium hydroxide', 'sel de cuisine': 'sodium chloride', 'sel': 'sodium chloride',
    'bicarbonate de soude': 'sodium bicarbonate', 'hydrogenocarbonate de sodium': 'sodium bicarbonate', 'eau de javel': 'sodium hypochlorite', 'acide chlorhydrique': 'hydrochloric acid', 'esprit de sel': 'hydrochloric acid',
    'vinaigre': 'acetic acid', 'alcool': 'ethanol', 'alcool ethylique': 'ethanol', 'alcool methylique': 'methanol', 'alcool isopropylique': 'isopropanol', 'ether': 'diethyl ether', 'ether diethylique': 'diethyl ether', 'ethoxyethane': 'diethyl ether',
    glycerol: 'glycerol', glycerine: 'glycerol', 'ethylene glycol': 'ethylene glycol', 'ethane-1,2-diol': 'ethylene glycol', formol: 'formaldehyde', methanal: 'formaldehyde', ethanal: 'acetaldehyde', propanone: 'acetone', acetone: 'acetone',
    'acide formique': 'formic acid', 'acide methanoique': 'formic acid', 'acide ethanoique': 'acetic acid', 'acide lactique': 'lactic acid', 'acide citrique': 'citric acid', 'acide oxalique': 'oxalic acid', 'acide tartrique': 'tartaric acid',
    'acide ascorbique': 'ascorbic acid', 'vitamine c': 'ascorbic acid', 'vitamine a': 'retinol', 'vitamine b1': 'thiamine', 'vitamine b2': 'riboflavin', 'vitamine b3': 'niacin', 'vitamine b6': 'pyridoxine', 'vitamine b9': 'folic acid', 'vitamine b12': 'cyanocobalamin', 'vitamine d': 'cholecalciferol', 'vitamine e': 'alpha-tocopherol', 'vitamine k': 'phylloquinone',
    'acide salicylique': 'salicylic acid', 'acide acetylsalicylique': 'aspirin', aspirine: 'aspirin', paracetamol: 'acetaminophen', ibuprofene: 'ibuprofen', 'cafeine': 'caffeine', theine: 'caffeine', theobromine: 'theobromine', nicotine: 'nicotine',
    morphine: 'morphine', codeine: 'codeine', quinine: 'quinine', 'chloroquine': 'chloroquine', artemisinine: 'artemisinin', amoxicilline: 'amoxicillin', penicilline: 'penicillin g', 'penicilline g': 'penicillin g', metronidazole: 'metronidazole', 'cotrimoxazole': 'sulfamethoxazole',
    adrenaline: 'epinephrine', noradrenaline: 'norepinephrine', dopamine: 'dopamine', serotonine: 'serotonin', melatonine: 'melatonin', histamine: 'histamine', insuline: 'insulin', testosterone: 'testosterone', oestradiol: 'estradiol', estradiol: 'estradiol', progesterone: 'progesterone', cortisol: 'cortisol', cholesterol: 'cholesterol',
    glucose: 'glucose', fructose: 'fructose', saccharose: 'sucrose', sucre: 'sucrose', lactose: 'lactose', maltose: 'maltose', galactose: 'galactose', ribose: 'ribose', 'desoxyribose': 'deoxyribose', amidon: 'amylose', cellulose: 'cellobiose',
    uree: 'urea', 'acide urique': 'uric acid', creatine: 'creatine', glycine: 'glycine', alanine: 'alanine', valine: 'valine', leucine: 'leucine', isoleucine: 'isoleucine', proline: 'proline', serine: 'serine', threonine: 'threonine', cysteine: 'cysteine', methionine: 'methionine',
    'acide aspartique': 'aspartic acid', 'acide glutamique': 'glutamic acid', asparagine: 'asparagine', glutamine: 'glutamine', lysine: 'lysine', arginine: 'arginine', histidine: 'histidine', phenylalanine: 'phenylalanine', tyrosine: 'tyrosine', tryptophane: 'tryptophan',
    adenine: 'adenine', guanine: 'guanine', cytosine: 'cytosine', thymine: 'thymine', uracile: 'uracil', 'atp': 'adenosine triphosphate', 'adenosine triphosphate': 'adenosine triphosphate',
    benzene: 'benzene', toluene: 'toluene', xylene: 'xylene', phenol: 'phenol', aniline: 'aniline', styrene: 'styrene', naphtalene: 'naphthalene', anthracene: 'anthracene', phenanthrene: 'phenanthrene', pyridine: 'pyridine', pyrrole: 'pyrrole', furane: 'furan', thiophene: 'thiophene', indole: 'indole', quinoleine: 'quinoline', purine: 'purine',
    chloroforme: 'chloroform', 'tetrachlorure de carbone': 'carbon tetrachloride', 'dichloromethane': 'dichloromethane', 'chlorure de vinyle': 'vinyl chloride', 'chlorure de methyle': 'chloromethane',
    ethylene: 'ethylene', ethene: 'ethylene', acetylene: 'acetylene', ethyne: 'acetylene', propene: 'propene', propylene: 'propene', butadiene: 'butadiene', isoprene: 'isoprene', 'essence de terebenthine': 'alpha-pinene',
    menthol: 'menthol', camphre: 'camphor', vanilline: 'vanillin', limonene: 'limonene', 'acide benzoique': 'benzoic acid', 'acide picrique': 'picric acid', tnt: 'trinitrotoluene', 'trinitrotoluene': 'trinitrotoluene', nitroglycerine: 'nitroglycerin',
    'chlorophylle': 'chlorophyll a', 'chlorophylle a': 'chlorophyll a', 'hemoglobine': 'heme', heme: 'heme', 'beta-carotene': 'beta-carotene', carotene: 'beta-carotene', lycopene: 'lycopene', capsaicine: 'capsaicin', curcumine: 'curcumin', resveratrol: 'resveratrol',
    'edta': 'edetic acid', 'acide ethylenediaminetetraacetique': 'edetic acid', 'phenolphtaleine': 'phenolphthalein', 'helianthine': 'methyl orange', 'orange de methyle': 'methyl orange', 'bleu de methylene': 'methylene blue', 'bleu de bromothymol': 'bromothymol blue',
    'sulfate de cuivre': 'copper(II) sulfate', 'permanganate de potassium': 'potassium permanganate', 'dichromate de potassium': 'potassium dichromate', 'nitrate d\'argent': 'silver nitrate', 'thiosulfate de sodium': 'sodium thiosulfate'
  };
  // éléments et cations (noms de sels : « sulfate de cuivre » → « copper sulfate »)
  const METAL = {
    sodium: 'sodium', potassium: 'potassium', lithium: 'lithium', calcium: 'calcium', magnesium: 'magnesium', baryum: 'barium', strontium: 'strontium', aluminium: 'aluminum', fer: 'iron', cuivre: 'copper', argent: 'silver', or: 'gold', zinc: 'zinc',
    plomb: 'lead', mercure: 'mercury', etain: 'tin', nickel: 'nickel', cobalt: 'cobalt', manganese: 'manganese', chrome: 'chromium', platine: 'platinum', palladium: 'palladium', cadmium: 'cadmium', titane: 'titanium', ammonium: 'ammonium',
    hydrogene: 'hydrogen', carbone: 'carbon', azote: 'nitrogen', soufre: 'sulfur', phosphore: 'phosphorus', silicium: 'silicon', bore: 'boron', chlore: 'chlorine', brome: 'bromine', iode: 'iodine', fluor: 'fluorine', oxygene: 'oxygen', xenon: 'xenon', uranium: 'uranium',
    methyle: 'methyl', ethyle: 'ethyl', propyle: 'propyl', butyle: 'butyl', phenyle: 'phenyl', benzyle: 'benzyl', vinyle: 'vinyl', isopropyle: 'isopropyl', acetyle: 'acetyl'
  };
  const ANION = { chlorure: 'chloride', bromure: 'bromide', iodure: 'iodide', fluorure: 'fluoride', sulfure: 'sulfide', hydrure: 'hydride', nitrure: 'nitride', carbure: 'carbide', cyanure: 'cyanide', oxyde: 'oxide', hydroxyde: 'hydroxide', peroxyde: 'peroxide',
    dioxyde: 'dioxide', trioxyde: 'trioxide', monoxyde: 'monoxide', tetroxyde: 'tetroxide', pentoxyde: 'pentoxide', dichlorure: 'dichloride', trichlorure: 'trichloride', tetrachlorure: 'tetrachloride', pentachlorure: 'pentachloride', hexafluorure: 'hexafluoride', trifluorure: 'trifluoride' };
  // suffixes de nomenclature
  const word = (w) => {
    if (METAL[w]) return METAL[w]; if (ANION[w]) return ANION[w];
    return w.replace(/phtal/g, 'phthal').replace(/yle$/, 'yl').replace(/ene$/, 'ene').replace(/ique$/, 'ic').replace(/oique$/, 'oic').replace(/eux$/, 'ous').replace(/ite$/, 'ite').replace(/ine$/, 'ine')
      .replace(/^tryptophane$/, 'tryptophan').replace(/ure$/, 'ide');
  };
  function translate(q) {
    const s = low(q).replace(/\s*-\s*/g, '-'), out = [];
    const push = (x) => { x = String(x || '').trim(); if (x && !out.includes(x)) out.push(x); };
    if (DICT[s]) push(DICT[s]);
    let m;
    // acide X-ique / X-oïque / X-eux
    if ((m = s.match(/^acide (.+)$/))) {
      const r = m[1].replace(/oique$/, 'oic').replace(/ique$/, 'ic').replace(/eux$/, 'ous').replace(/phtal/g, 'phthal');
      push(r + ' acid');
    }
    // sels et esters : « chlorure de sodium », « sulfate de fer(ii) », « acétate d'éthyle »
    if ((m = s.match(/^([a-z0-9,-]+(?:ate|ite|ure|yde|ide))\s+(?:de |d')\s*([a-z-]+)\s*(\([ivx]+\))?$/))) {
      const an = ANION[m[1]] || m[1].replace(/ure$/, 'ide'), cat = METAL[m[2]] || word(m[2]);
      push(cat + (m[3] ? m[3].toUpperCase() : '') + ' ' + an);
      if (m[3]) push(cat + ' ' + an);
    }
    // nomenclature systématique : accents retirés, terminaisons anglaises
    const sys = s.replace(/\(([ivx]+)\)/g, (x, r) => '(' + r.toUpperCase() + ')').split(' ').map((w) => (/^[a-z]+$/.test(w) ? word(w) : w)).join(' ');
    push(sys);
    push(strip(q));
    return out;
  }

  // ---------- requêtes ----------
  const timeout = (p, ms) => Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error('délai dépassé')), ms))]);
  async function get(url, type = 'json', body) {
    let r;
    try { r = await timeout(fetch(url, body ? { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } } : {}), 20000); }
    catch (e) { const err = new Error('PubChem est injoignable : vérifiez la connexion Internet (les composés intégrés restent disponibles hors ligne).'); err.net = true; throw err; }
    if (r.status === 404) return null;
    if (r.status === 400) return null;
    if (r.status === 503 || r.status === 429) throw new Error('PubChem est momentanément surchargé : réessayez dans quelques secondes.');
    if (!r.ok) throw new Error('Réponse inattendue de PubChem (' + r.status + ').');
    return type === 'json' ? r.json() : r.text();
  }
  const cidsOf = (j) => (j && j.IdentifierList && j.IdentifierList.CID ? j.IdentifierList.CID.filter((c) => c > 0) : []);
  const isFormula = (q) => /^([A-Z][a-z]?\d*)+$/.test(q) && /\d/.test(q) && !/[a-z]{2}/.test(q.replace(/[A-Z][a-z]/g, ''));
  const isSmiles = (q) => /[=#()\[\]@+\\/]|^[BCNOPSFIcnops][BCNOPSFIcnops0-9lr]*$/.test(q) && !/\s/.test(q) && !/[àâäéèêëîïôöùûüç]/i.test(q);

  // recherche : renvoie { cids, how, term }
  async function search(q) {
    q = String(q || '').trim().replace(/[₀-₉]/g, (d) => '0123456789'['₀₁₂₃₄₅₆₇₈₉'.indexOf(d)]); if (!q) return { cids: [] };
    let mm;
    if ((mm = q.match(/^(?:cid\s*:?\s*)?(\d{1,10})$/i))) return { cids: [+mm[1]], how: 'numéro CID', term: mm[1] };
    if ((mm = q.match(/^(\d{2,7}-\d{2}-\d)$/))) { const j = await get(BASE + 'name/cids/JSON', 'json', 'name=' + encodeURIComponent(mm[1])); return { cids: cidsOf(j), how: 'numéro CAS', term: mm[1] }; }
    if (isFormula(q)) { const j = await get(BASE + 'fastformula/' + encodeURIComponent(q) + '/cids/JSON?MaxRecords=24'); const c = cidsOf(j); if (c.length) return { cids: c, how: 'formule brute', term: q }; }
    if (isSmiles(q) && !/^[a-z]+$/i.test(q)) { const j = await get(BASE + 'smiles/cids/JSON', 'json', 'smiles=' + encodeURIComponent(q)); const c = cidsOf(j); if (c.length) return { cids: c, how: 'SMILES', term: q }; }
    const tried = [];
    for (const t of translate(q).slice(0, 4)) {
      tried.push(t);
      const j = await get(BASE + 'name/cids/JSON', 'json', 'name=' + encodeURIComponent(t));
      const c = cidsOf(j); if (c.length) return { cids: c.slice(0, 12), how: 'nom', term: t };
    }
    return { cids: [], tried };
  }
  async function props(cids) {
    if (!cids.length) return [];
    const j = await get(BASE + 'cid/property/Title,IUPACName,MolecularFormula,MolecularWeight,Charge/JSON', 'json', 'cid=' + cids.slice(0, 24).join(','));
    return j && j.PropertyTable ? j.PropertyTable.Properties : [];
  }
  const sdf = (cid, kind) => get(BASE + 'cid/' + (+cid) + '/SDF?record_type=' + (kind === '3d' ? '3d' : '2d'), 'text');
  async function suggest(q) {
    const t = translate(q)[0] || q; if (t.length < 3) return [];
    try { const j = await timeout(fetch(AUTO + encodeURIComponent(t) + '/json?limit=8').then((r) => (r.ok ? r.json() : null)), 6000); return (j && j.dictionary_terms && j.dictionary_terms.compound) || []; } catch (e) { return []; }
  }
  const image = (cid) => BASE + 'cid/' + (+cid) + '/PNG?image_size=200x200';
  const page = (cid) => 'https://pubchem.ncbi.nlm.nih.gov/compound/' + (+cid);
  G.PubChem = { search, props, sdf, suggest, translate, image, page, isFormula, isSmiles };
})(typeof window !== 'undefined' ? window : globalThis);
