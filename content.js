/* content.js — contenu pédagogique : 7 modules, leçons, QCM, travaux pratiques, exercices */
(function (G) {
  'use strict';
  const M = [];

  // ---------------------------------------------------------------- MODULE 1
  M.push({
    id: 1, code: 'M1', title: 'Introduction à l’informatique appliquée à la chimie', short: 'Introduction',
    desc: 'Pourquoi et comment l’ordinateur aide à représenter, visualiser et étudier les molécules.',
    lessons: [
      {
        title: 'Qu’est-ce que l’informatique appliquée à la chimie ?', dur: 15,
        obj: ['Définir l’informatique appliquée à la chimie', 'Citer ses principaux usages en formation et en recherche'],
        intro: 'Un chimiste manipule des objets invisibles : les molécules. L’ordinateur permet de les dessiner, de les voir dans l’espace, de calculer leurs propriétés et de partager ces informations sans ambiguïté.',
        body: `<h3>Définition</h3>
<p>L’<b>informatique appliquée à la chimie</b> regroupe les méthodes et les logiciels qui servent à représenter, stocker, rechercher, visualiser et calculer des informations chimiques. On parle aussi de <b>chimie assistée par ordinateur</b>, et pour sa partie « données » de <b>chémo-informatique</b>.</p>
<h3>Pourquoi est-elle devenue indispensable ?</h3>
<ul>
<li><b>Communiquer</b> : une structure dessinée proprement dans un logiciel est lisible par tous et peut être insérée dans un rapport ou un mémoire.</li>
<li><b>Visualiser</b> : la forme 3D d’une molécule explique sa polarité, sa réactivité et son activité biologique.</li>
<li><b>Calculer</b> : formule brute, masse molaire, longueurs et angles de liaison, énergie d’une conformation.</li>
<li><b>Échanger</b> : les fichiers standard (MOL, SDF, XYZ…) permettent de passer d’un logiciel à l’autre et d’interroger des bases de données comme PubChem.</li>
</ul>
<h3>Les trois grandes familles d’outils</h3>
<table class="tbl"><thead><tr><th>Famille</th><th>Rôle</th><th>Exemples</th></tr></thead><tbody>
<tr><td>Éditeurs de structures 2D</td><td>Dessiner des formules, préparer des documents</td><td>ChemSketch, ChemDraw, MarvinSketch</td></tr>
<tr><td>Visualiseurs et constructeurs 3D</td><td>Construire, faire tourner, mesurer, optimiser</td><td>Avogadro, Jmol, PyMOL</td></tr>
<tr><td>Chimie computationnelle</td><td>Calculs quantiques et dynamiques</td><td>ORCA, Gaussian, GROMACS</td></tr>
</tbody></table>`,
        sum: ['L’informatique appliquée à la chimie sert à représenter, visualiser, calculer et échanger des informations moléculaires.', 'ChemSketch appartient aux éditeurs 2D, Avogadro aux constructeurs et visualiseurs 3D.']
      },
      {
        title: 'Représenter une molécule : de la formule brute à la 3D', dur: 20,
        obj: ['Distinguer formule brute, développée, semi-développée et topologique', 'Expliquer la différence entre représentation 2D et 3D'],
        intro: 'Une même molécule peut s’écrire de plusieurs façons. Chaque écriture donne plus ou moins d’informations : composition, enchaînement des atomes, forme dans l’espace.',
        body: `<h3>Les écritures planes (2D)</h3>
<ul>
<li><b>Formule brute</b> : nature et nombre des atomes, par exemple C<sub>2</sub>H<sub>6</sub>O. Elle ne dit rien de l’enchaînement.</li>
<li><b>Formule développée</b> : tous les atomes et toutes les liaisons sont dessinés.</li>
<li><b>Formule semi-développée</b> : les liaisons avec l’hydrogène ne sont plus dessinées (CH<sub>3</sub>–CH<sub>2</sub>–OH).</li>
<li><b>Formule topologique</b> : la chaîne carbonée devient une ligne brisée ; chaque sommet est un carbone, les H portés par les carbones sont sous-entendus.</li>
</ul>
<p>Attention : la formule brute C<sub>2</sub>H<sub>6</sub>O correspond à deux molécules différentes, l’éthanol et le méthoxyméthane. Ce sont des <b>isomères</b>. Seule la formule développée (ou topologique) les distingue.</p>
<h3>Les représentations spatiales (3D)</h3>
<ul>
<li><b>Représentation de Cram</b> : sur le papier, un trait plein est dans le plan, un triangle plein vient vers l’observateur, un triangle hachuré part en arrière.</li>
<li><b>Modèle boules et bâtons</b> : les atomes sont des sphères, les liaisons des bâtonnets. On voit les angles de liaison.</li>
<li><b>Modèle compact (van der Waals)</b> : les sphères ont la taille réelle des atomes. On voit l’encombrement de la molécule.</li>
</ul>
<table class="tbl"><thead><tr><th></th><th>Représentation 2D</th><th>Représentation 3D</th></tr></thead><tbody>
<tr><td>Ce qu’elle montre</td><td>Quels atomes sont liés, et comment</td><td>La forme réelle : angles, distances, volume</td></tr>
<tr><td>Usage typique</td><td>Rapports, exercices, réactions</td><td>Géométrie, stéréochimie, interactions</td></tr>
<tr><td>Logiciel du module</td><td>ChemSketch</td><td>Avogadro</td></tr>
</tbody></table>`,
        fig: { type: 'ed2d', lib: 'ethanol', caption: 'L’éthanol dans l’éditeur 2D : changez le mode d’affichage (semi-développée, développée, topologique).' },
        sum: ['La formule brute ne suffit pas : des isomères ont la même.', 'La 2D décrit l’enchaînement des atomes, la 3D leur position dans l’espace.']
      },
      {
        title: 'Présentation de ChemSketch et d’Avogadro', dur: 15,
        obj: ['Situer ChemSketch et Avogadro', 'Connaître leurs conditions d’utilisation'],
        intro: 'Les deux logiciels étudiés dans ce cours sont gratuits pour l’enseignement et se complètent : on dessine dans l’un, on construit et on mesure dans l’autre.',
        body: `<h3>ACD/ChemSketch (Freeware)</h3>
<p>Édité par la société ACD/Labs, ChemSketch est un logiciel de dessin de structures chimiques : molécules organiques et organométalliques, réactions, schémas de laboratoire. La version <b>Freeware</b> est gratuite pour un usage académique ou personnel (son usage est interdit dans une organisation commerciale). Elle fonctionne sous <b>Windows</b>. Elle calcule notamment la formule brute et la masse molaire, et peut proposer un nom pour une structure.</p>
<h3>Avogadro</h3>
<p>Avogadro est un éditeur et visualiseur moléculaire <b>libre et open source</b>, disponible sous Windows, macOS et Linux. Il permet de construire des molécules atome par atome, de les faire tourner, de mesurer distances et angles, et d’<b>optimiser la géométrie</b> à l’aide d’un champ de force. La génération actuelle est Avogadro 2.</p>
<h3>Une intégration par fichiers, pas automatique</h3>
<p>Les deux logiciels sont <b>indépendants</b> : il n’existe pas de lien direct entre eux. On passe de l’un à l’autre en enregistrant un fichier dans un format commun, le plus souvent le format <b>MOL</b> (MDL Molfile). Le module 6 détaille cette démarche.</p>`,
        sum: ['ChemSketch : dessin 2D, Windows, gratuit pour l’enseignement.', 'Avogadro : construction et visualisation 3D, libre, multiplateforme.', 'Le passage de l’un à l’autre se fait par fichiers (MOL).']
      }
    ],
    quiz: [
      { q: 'Quelle écriture permet de distinguer l’éthanol du méthoxyméthane ?', o: ['La formule brute', 'La formule semi-développée', 'La masse molaire', 'Le nombre d’atomes'], a: 1, e: 'Les deux ont la même formule brute C₂H₆O et donc la même masse molaire ; seul l’enchaînement des atomes les distingue.' },
      { q: 'Dans une formule topologique, que représente un sommet de la ligne brisée ?', o: ['Un atome d’hydrogène', 'Un atome de carbone', 'Un doublet non liant', 'Une liaison double'], a: 1, e: 'Chaque sommet ou extrémité non annoté est un atome de carbone ; ses hydrogènes sont sous-entendus.' },
      { q: 'Quel logiciel est principalement un éditeur de structures 2D ?', o: ['Avogadro', 'PyMOL', 'ChemSketch', 'GROMACS'], a: 2, e: 'ChemSketch est un logiciel de dessin 2D ; Avogadro et PyMOL travaillent en 3D.' },
      { q: 'Dans la représentation de Cram, un triangle plein indique une liaison…', o: ['dans le plan de la feuille', 'dirigée vers l’observateur', 'dirigée vers l’arrière', 'double'], a: 1, e: 'Triangle plein : vers l’avant ; triangle hachuré : vers l’arrière.' },
      { q: 'Comment passe-t-on d’une structure ChemSketch à Avogadro ?', o: ['Par un bouton d’intégration automatique', 'En enregistrant un fichier commun (par exemple MOL)', 'C’est impossible', 'En copiant une image'], a: 1, e: 'Les logiciels sont indépendants : on exporte un fichier MOL depuis ChemSketch puis on l’ouvre dans Avogadro.' },
      { t: 'court', q: 'Donnez la formule brute de l’éthanol (exemple d’écriture : C2H4O).', acc: ['c2h6o', 'c2h5oh'], e: 'L’éthanol CH₃–CH₂–OH a pour formule brute C₂H₆O.' }
    ]
  });

  // ---------------------------------------------------------------- MODULE 2
  M.push({
    id: 2, code: 'M2', title: 'Prise en main de ChemSketch', short: 'ChemSketch',
    desc: 'Installer ChemSketch, découvrir ses barres d’outils, dessiner, modifier, enregistrer et exporter.',
    lessons: [
      {
        title: 'Installer et configurer ChemSketch', dur: 15,
        obj: ['Télécharger la version Freeware', 'Réussir l’installation et le premier lancement'],
        intro: 'ChemSketch Freeware se télécharge sur le site d’ACD/Labs après inscription. L’installation prend quelques minutes.',
        body: `<h3>Étapes</h3>
<ol>
<li>Rendez-vous sur le site d’ACD/Labs, rubrique <b>ChemSketch Freeware</b>.</li>
<li>Remplissez le formulaire (nom, e-mail, établissement). Le lien de téléchargement est envoyé par e-mail.</li>
<li>Lancez l’installateur et acceptez la licence (usage non commercial).</li>
<li>Installez le logiciel dans son propre dossier, comme le recommande l’éditeur.</li>
<li>Au premier lancement, une fenêtre propose d’associer des extensions de fichiers (.sk2, .mol…) à ChemSketch : cochez au moins .sk2.</li>
</ol>
<h3>Configuration utile</h3>
<ul>
<li>Vérifiez que vous êtes en mode <b>Structure</b> (onglet en haut à gauche) : c’est le mode de dessin des molécules. Le mode <b>Draw</b> sert aux schémas et à la mise en page.</li>
<li>Dans les options, réglez l’affichage des hydrogènes et la taille des étiquettes selon vos besoins.</li>
</ul>
<p class="note">ChemSketch Freeware fonctionne sous Windows. Sur Mac ou Linux, on passe par une machine virtuelle ou un ordinateur de la salle informatique.</p>`,
        sum: ['Téléchargement gratuit après inscription sur le site d’ACD/Labs.', 'Le mode Structure sert à dessiner les molécules.']
      },
      {
        title: 'L’interface et les barres d’outils', dur: 20,
        obj: ['Repérer les zones de l’écran', 'Connaître le rôle de chaque barre d’outils'],
        intro: 'L’écran de ChemSketch s’organise autour d’une grande zone de dessin entourée de barres d’outils.',
        body: `<h3>Les zones à connaître</h3>
<ul>
<li><b>Barre de menus</b> (File, Edit, Tools, Templates…) : toutes les commandes.</li>
<li><b>Onglets Structure / Draw</b> : choix du mode de travail.</li>
<li><b>Barre d’outils générale</b> : nouveau, ouvrir, enregistrer, annuler, outils de sélection et de dessin (dessin normal, dessin continu).</li>
<li><b>Barre des atomes</b> (à gauche, verticale) : H, C, N, O, P, S, F, Cl, Br, I et un accès au tableau périodique.</li>
<li><b>Barre des radicaux et modèles</b> (à droite) : cycles prêts à l’emploi (cyclopropane à benzène) et groupes courants.</li>
<li><b>Zone de dessin</b> : la page de travail.</li>
<li><b>Barre d’état</b> (en bas) : informations sur l’objet sélectionné.</li>
</ul>
<h3>Commandes que vous utiliserez souvent</h3>
<table class="tbl"><thead><tr><th>Besoin</th><th>Commande</th></tr></thead><tbody>
<tr><td>Redresser un dessin</td><td>Tools &gt; Clean Structure</td></tr>
<tr><td>Obtenir formule et masse</td><td>Tools &gt; Calculate</td></tr>
<tr><td>Proposer un nom</td><td>Tools &gt; Generate &gt; Name for Structure</td></tr>
<tr><td>Modèles supplémentaires</td><td>Templates &gt; Template Window</td></tr>
<tr><td>Vue 3D rapide</td><td>Bouton 3D Optimization, puis Copy to 3D</td></tr>
</tbody></table>`,
        fig: { type: 'ui', id: 'chemsketch', caption: 'Schéma simplifié de l’organisation de l’écran (dessin pédagogique, pas une capture d’écran).' },
        sum: ['Atomes à gauche, cycles et modèles à droite, dessin au centre.', 'Le menu Tools contient le nettoyage, les calculs et la génération du nom.']
      },
      {
        title: 'Dessiner des atomes et des liaisons', dur: 25,
        obj: ['Placer des atomes', 'Créer et modifier des liaisons simples, doubles et triples', 'Changer la nature d’un atome'],
        intro: 'Le dessin repose sur quelques gestes simples. Une fois maîtrisés, une molécule courante se dessine en moins d’une minute.',
        body: `<h3>Les gestes de base dans ChemSketch</h3>
<ol>
<li>Choisissez un élément dans la barre des atomes (C par défaut).</li>
<li><b>Cliquez</b> dans la zone de dessin : l’atome apparaît, complété automatiquement par ses hydrogènes (un clic avec C donne CH<sub>4</sub>).</li>
<li><b>Cliquez-glissez</b> depuis un atome : une liaison simple et un nouvel atome sont créés.</li>
<li><b>Cliquez sur une liaison</b> existante : elle devient double, puis triple au clic suivant.</li>
<li>Pour remplacer un atome, choisissez le nouvel élément puis <b>cliquez sur l’atome</b> à modifier.</li>
<li>En cas d’erreur : Edit &gt; Undo (Ctrl+Z).</li>
</ol>
<h3>Entraînez-vous dans l’éditeur de la plateforme</h3>
<p>L’éditeur 2D intégré reproduit ces gestes : cliquer dans le vide place un atome, glisser depuis un atome trace une liaison, cliquer sur une liaison change son ordre, cliquer sur un atome avec un autre élément le remplace. Il calcule la formule brute, signale en rouge un atome qui dépasse sa valence et reconnaît les molécules courantes.</p>`,
        fig: { type: 'ed2d', lib: 'acide_acetique', caption: 'Essayez : cliquez sur la liaison C=O pour la transformer, puis Annuler.' },
        ex: 'Dessinez le propane (C<sub>3</sub>H<sub>8</sub>) : trois clics sur la chaîne suffisent. Vérifiez la formule affichée.',
        sum: ['Clic = atome, glisser = liaison, clic sur liaison = ordre suivant.', 'Les hydrogènes sont ajoutés automatiquement selon la valence.']
      },
      {
        title: 'Modifier, enregistrer et exporter', dur: 20,
        obj: ['Sélectionner, déplacer, nettoyer une structure', 'Enregistrer au format SK2 et exporter en MOL ou en image'],
        intro: 'Un dessin n’est utile que s’il est bien présenté et réutilisable. ChemSketch propose plusieurs formats de sortie.',
        body: `<h3>Mettre en forme</h3>
<ul>
<li>Outil <b>Select/Move</b> : sélectionner et déplacer des atomes ou toute la molécule.</li>
<li><b>Clean Structure</b> : uniformise longueurs et angles du dessin.</li>
<li>Rotation et redimensionnement avec l’outil de sélection adapté.</li>
</ul>
<h3>Enregistrer et exporter</h3>
<table class="tbl"><thead><tr><th>Format</th><th>Extension</th><th>À quoi il sert</th></tr></thead><tbody>
<tr><td>Document ChemSketch</td><td>.sk2</td><td>Format natif : garde toute la mise en page. Lisible surtout par ChemSketch.</td></tr>
<tr><td>MDL Molfile</td><td>.mol</td><td>Format d’échange : à utiliser pour ouvrir la structure dans Avogadro.</td></tr>
<tr><td>Image</td><td>.png, .jpg…</td><td>Insertion dans un rapport ou un diaporama.</td></tr>
</tbody></table>
<p>Pour un TP, déposez en général le fichier <b>.sk2</b> (votre travail) et une <b>image</b> ou un <b>.mol</b> (pour la correction).</p>
<p class="note">Le menu et le nom exact de la commande d’export (Enregistrer sous, Exporter) peuvent varier selon la version : cherchez le type « MDL Molfile ».</p>`,
        sum: ['.sk2 pour garder son travail, .mol pour l’échange, image pour les rapports.']
      }
    ],
    quiz: [
      { q: 'Dans ChemSketch, que se passe-t-il quand on clique sur une liaison simple existante ?', o: ['Elle est supprimée', 'Elle devient double', 'Elle devient une liaison hydrogène', 'Rien'], a: 1, e: 'Un clic sur une liaison augmente son ordre : simple → double → triple.' },
      { q: 'Où se trouve la barre des atomes (H, C, N, O…) ?', o: ['En haut', 'À gauche, verticalement', 'Dans le menu File', 'En bas'], a: 1, e: 'La barre des atomes est la barre verticale à gauche de la zone de dessin.' },
      { q: 'Quel format permet d’ouvrir une structure ChemSketch dans Avogadro ?', o: ['.sk2', '.mol', '.docx', '.pdf'], a: 1, e: 'Le format MDL Molfile (.mol) est un format d’échange lu par Avogadro ; le .sk2 est propre à ChemSketch.' },
      { q: 'Quelle commande uniformise les longueurs et angles d’un dessin ?', o: ['Clean Structure', 'Generate Name', 'Template Window', 'Undo'], a: 0, e: 'Tools > Clean Structure redresse le dessin.' },
      { q: 'Un seul clic avec l’élément C sélectionné dans une zone vide affiche…', o: ['C', 'CH₂', 'CH₄', 'C₂H₆'], a: 2, e: 'ChemSketch complète la valence avec des hydrogènes : un carbone seul devient CH₄.' },
      { q: 'La version Freeware de ChemSketch est…', o: ['payante', 'gratuite pour un usage académique ou personnel', 'libre et open source', 'disponible uniquement sur Linux'], a: 1, e: 'Elle est gratuite pour l’enseignement et l’usage personnel, sous Windows.' },
      { t: 'court', q: 'Quelle est l’extension du format natif de ChemSketch ? (sans le point)', acc: ['sk2', '.sk2'], e: 'Le format natif est .sk2.' }
    ]
  });

  // ---------------------------------------------------------------- MODULE 3
  M.push({
    id: 3, code: 'M3', title: 'Dessin des structures chimiques en 2D', short: 'Structures 2D',
    desc: 'Atomes, valence, liaisons multiples, cycles, groupes fonctionnels et molécules complexes.',
    lessons: [
      {
        title: 'Symboles des atomes et règle de valence', dur: 20,
        obj: ['Connaître la valence des éléments courants', 'Retrouver les hydrogènes sous-entendus'],
        intro: 'Dessiner juste, c’est d’abord respecter le nombre de liaisons que chaque atome peut former : sa valence.',
        body: `<h3>Valences usuelles</h3>
<table class="tbl"><thead><tr><th>Élément</th><th>Symbole</th><th>Valence</th><th>Exemple</th></tr></thead><tbody>
<tr><td>Hydrogène</td><td>H</td><td>1</td><td>H–H</td></tr>
<tr><td>Carbone</td><td>C</td><td>4</td><td>CH<sub>4</sub></td></tr>
<tr><td>Azote</td><td>N</td><td>3</td><td>NH<sub>3</sub></td></tr>
<tr><td>Oxygène</td><td>O</td><td>2</td><td>H<sub>2</sub>O</td></tr>
<tr><td>Halogènes</td><td>F, Cl, Br, I</td><td>1</td><td>HCl</td></tr>
<tr><td>Soufre</td><td>S</td><td>2 (4 ou 6)</td><td>H<sub>2</sub>S, H<sub>2</sub>SO<sub>4</sub></td></tr>
<tr><td>Phosphore</td><td>P</td><td>3 (ou 5)</td><td>PCl<sub>3</sub>, H<sub>3</sub>PO<sub>4</sub></td></tr>
</tbody></table>
<h3>Hydrogènes sous-entendus</h3>
<p>Le nombre d’hydrogènes portés par un atome = valence − somme des ordres de ses liaisons. Un carbone engagé dans une liaison double et une liaison simple porte donc 4 − 3 = 1 hydrogène.</p>
<h3>Formule brute et masse molaire</h3>
<p>Par convention (système de Hill), on écrit C, puis H, puis les autres éléments par ordre alphabétique. M(C<sub>2</sub>H<sub>6</sub>O) = 2 × 12,011 + 6 × 1,008 + 15,999 = 46,07 g/mol.</p>`,
        sum: ['C = 4, N = 3, O = 2, H et halogènes = 1.', 'H sous-entendus = valence − somme des ordres de liaison.']
      },
      {
        title: 'Liaisons simples, doubles et triples', dur: 20,
        obj: ['Représenter les trois types de liaisons', 'Relier ordre de liaison, longueur et géométrie'],
        intro: 'Deux atomes peuvent partager un, deux ou trois doublets d’électrons : c’est l’ordre de la liaison.',
        body: `<table class="tbl"><thead><tr><th>Liaison</th><th>Dessin</th><th>Longueur C–C typique</th><th>Exemple</th></tr></thead><tbody>
<tr><td>Simple</td><td>un trait</td><td>≈ 1,54 Å</td><td>éthane C<sub>2</sub>H<sub>6</sub></td></tr>
<tr><td>Double</td><td>deux traits</td><td>≈ 1,34 Å</td><td>éthylène C<sub>2</sub>H<sub>4</sub></td></tr>
<tr><td>Triple</td><td>trois traits</td><td>≈ 1,20 Å</td><td>acétylène C<sub>2</sub>H<sub>2</sub></td></tr>
</tbody></table>
<p>Plus l’ordre de liaison est élevé, plus la liaison est <b>courte</b> et <b>solide</b>. L’ordre influence aussi la forme : autour d’une liaison triple, les atomes sont alignés (180°) ; autour d’une double, ils sont dans un même plan (≈ 120°).</p>
<p>Dans l’éditeur, sélectionnez l’ordre de liaison (1, 2 ou 3) avant de glisser, ou cliquez sur une liaison existante pour passer à l’ordre suivant.</p>`,
        fig: { type: 'v3d-row', mols: ['ethylene', 'acetylene'], caption: 'Éthylène (plan, 120°) et acétylène (linéaire, 180°). Faites-les tourner.' },
        sum: ['Simple > double > triple en longueur.', 'Triple → alignement ; double → plan.']
      },
      {
        title: 'Cycles et composés aromatiques', dur: 20,
        obj: ['Dessiner un cycle avec les modèles', 'Représenter le benzène'],
        intro: 'De nombreuses molécules contiennent des cycles. Les logiciels proposent des modèles prêts à l’emploi pour les dessiner vite et proprement.',
        body: `<h3>Les cycles saturés</h3>
<p>Cyclopropane, cyclobutane, cyclopentane, cyclohexane : uniquement des liaisons simples. Le cyclohexane C<sub>6</sub>H<sub>12</sub> n’est pas plan en 3D : il adopte une forme « chaise ».</p>
<h3>Le benzène</h3>
<p>Le benzène C<sub>6</sub>H<sub>6</sub> se dessine avec trois doubles liaisons alternées (formule de <b>Kekulé</b>) ou avec un cercle dans l’hexagone. En réalité, les six liaisons C–C sont identiques (≈ 1,39 Å) : les électrons sont délocalisés. On parle de composé <b>aromatique</b>.</p>
<h3>Dans les logiciels</h3>
<ul>
<li>ChemSketch : barre des radicaux à droite (benzène, cyclohexane…). Cliquez dans le vide pour poser le cycle, sur un atome pour l’y accrocher.</li>
<li>Éditeur de la plateforme : outil <b>Cycle</b>, même principe.</li>
</ul>`,
        fig: { type: 'ed2d', lib: 'toluene', caption: 'Le toluène : un cycle benzénique portant un groupe méthyle.' },
        sum: ['Le benzène a 6 liaisons C–C identiques (aromaticité).', 'Utilisez les modèles de cycles plutôt que de dessiner atome par atome.']
      },
      {
        title: 'Les groupes fonctionnels', dur: 25,
        obj: ['Reconnaître et dessiner les principaux groupes fonctionnels'],
        intro: 'Un groupe fonctionnel est un ensemble d’atomes qui donne à une molécule ses propriétés chimiques. Savoir les dessiner permet de représenter toutes les familles organiques.',
        body: `<table class="tbl"><thead><tr><th>Famille</th><th>Groupe</th><th>Exemple</th></tr></thead><tbody>
<tr><td>Alcool</td><td>–OH sur un carbone saturé</td><td>éthanol CH<sub>3</sub>CH<sub>2</sub>OH</td></tr>
<tr><td>Aldéhyde</td><td>–CHO (C=O en bout de chaîne)</td><td>éthanal CH<sub>3</sub>CHO</td></tr>
<tr><td>Cétone</td><td>C=O entre deux carbones</td><td>acétone CH<sub>3</sub>COCH<sub>3</sub></td></tr>
<tr><td>Acide carboxylique</td><td>–COOH</td><td>acide acétique CH<sub>3</sub>COOH</td></tr>
<tr><td>Ester</td><td>–COO–</td><td>acétate d’éthyle</td></tr>
<tr><td>Amine</td><td>–NH<sub>2</sub>, –NH–, –N&lt;</td><td>méthylamine CH<sub>3</sub>NH<sub>2</sub></td></tr>
<tr><td>Amide</td><td>–CO–N&lt;</td><td>paracétamol</td></tr>
<tr><td>Éther</td><td>C–O–C</td><td>méthoxyméthane</td></tr>
<tr><td>Dérivé halogéné</td><td>C–X (X = F, Cl, Br, I)</td><td>chlorométhane</td></tr>
</tbody></table>
<p>Méthode de dessin d’un acide carboxylique : dessinez la chaîne, ajoutez un O avec une <b>liaison double</b> sur le dernier carbone, puis un O avec une liaison simple : le H du –OH est ajouté automatiquement.</p>`,
        fig: { type: 'ed2d', lib: 'glycine', caption: 'La glycine porte deux groupes : amine et acide carboxylique.' },
        sum: ['Le groupe fonctionnel détermine la famille et la réactivité.', 'C=O + OH sur le même carbone = acide carboxylique.']
      },
      {
        title: 'Dessiner une molécule complexe : méthode', dur: 20,
        obj: ['Appliquer une démarche en étapes', 'Contrôler son dessin'],
        intro: 'Face à une molécule de plus de 15 atomes, mieux vaut suivre une méthode que dessiner au hasard.',
        body: `<ol>
<li><b>Repérer le squelette</b> : cycle(s) et chaîne principale.</li>
<li><b>Poser les cycles</b> avec les modèles.</li>
<li><b>Ajouter les chaînes</b> et les ramifications.</li>
<li><b>Placer les hétéroatomes</b> (O, N, S…) en cliquant sur les atomes avec le bon élément.</li>
<li><b>Ajuster les liaisons multiples</b> (C=O, C=C…).</li>
<li><b>Contrôler</b> : formule brute calculée, aucune valence dépassée (atome signalé en rouge), puis nettoyer le dessin.</li>
</ol>
<p>Exemple : l’<b>aspirine</b> (acide acétylsalicylique, C<sub>9</sub>H<sub>8</sub>O<sub>4</sub>) = un benzène portant, sur deux carbones voisins, un groupe acide carboxylique et un groupe ester.</p>`,
        fig: { type: 'ed2d', lib: 'aspirine', display: 'topo', caption: 'L’aspirine en formule topologique.' },
        sum: ['Squelette → substituants → hétéroatomes → liaisons multiples → contrôle.']
      }
    ],
    quiz: [
      { q: 'Combien d’hydrogènes porte un carbone engagé dans une liaison double et une liaison simple ?', o: ['0', '1', '2', '3'], a: 1, e: '4 − (2 + 1) = 1.' },
      { q: 'Quelle est la valence de l’azote dans l’ammoniac ?', o: ['1', '2', '3', '4'], a: 2, e: 'L’azote forme 3 liaisons : NH₃.' },
      { q: 'Classez les liaisons C–C de la plus longue à la plus courte.', o: ['triple > double > simple', 'simple > double > triple', 'double > simple > triple', 'elles ont toutes la même longueur'], a: 1, e: 'Plus l’ordre est élevé, plus la liaison est courte : 1,54 > 1,34 > 1,20 Å.' },
      { q: 'Quel groupe caractérise un acide carboxylique ?', o: ['–OH seul', '–CHO', '–COOH', '–NH₂'], a: 2, e: 'Acide carboxylique : C=O et OH sur le même carbone.' },
      { q: 'Dans le benzène réel, les six liaisons carbone-carbone sont…', o: ['alternativement simples et doubles', 'toutes identiques', 'toutes doubles', 'toutes triples'], a: 1, e: 'Les électrons sont délocalisés : 6 liaisons identiques d’environ 1,39 Å.' },
      { q: 'L’acétone appartient à la famille des…', o: ['alcools', 'aldéhydes', 'cétones', 'esters'], a: 2, e: 'Le C=O est entouré de deux carbones : c’est une cétone.' },
      { t: 'court', q: 'Formule brute du benzène ?', acc: ['c6h6'], e: 'C₆H₆.' },
      { t: 'court', q: 'Formule brute de l’aspirine ?', acc: ['c9h8o4'], e: 'C₉H₈O₄, masse molaire ≈ 180,16 g/mol.' }
    ]
  });

  // ---------------------------------------------------------------- MODULE 4
  M.push({
    id: 4, code: 'M4', title: 'Prise en main d’Avogadro', short: 'Avogadro',
    desc: 'Installer Avogadro, naviguer en 3D, construire, manipuler, optimiser et exporter.',
    lessons: [
      {
        title: 'Installer Avogadro', dur: 10,
        obj: ['Télécharger la bonne version', 'Installer sur son système'],
        intro: 'Avogadro est gratuit et open source ; il s’installe sur Windows, macOS et Linux.',
        body: `<ol>
<li>Rendez-vous sur le site officiel d’Avogadro (avogadro.cc), page <b>Install</b>.</li>
<li>Choisissez la <b>version officielle actuelle</b> (génération Avogadro 2) pour votre système : Windows, macOS ou Linux.</li>
<li>Lancez l’installateur (Windows), ouvrez l’image disque (macOS) ou utilisez le paquet adapté (Linux).</li>
<li>Au premier lancement, une fenêtre vide s’affiche : la vue 3D occupe le centre.</li>
</ol>
<p class="note">Des tutoriels anciens montrent Avogadro 1.2 : les menus diffèrent un peu. Dans ce cours, quand un menu varie, l’outil est désigné par son nom plutôt que par son emplacement exact.</p>`,
        sum: ['Version officielle sur avogadro.cc, gratuite, tous systèmes.']
      },
      {
        title: 'Découvrir l’interface et naviguer en 3D', dur: 20,
        obj: ['Identifier la barre d’outils, les réglages et les types d’affichage', 'Tourner, déplacer et zoomer'],
        intro: 'Avogadro est organisé autour de la vue 3D, d’une barre d’outils et de panneaux de réglages.',
        body: `<h3>Les zones</h3>
<ul>
<li><b>Barre d’outils</b> : Navigation, Dessin, Modèle (template), Sélection, Manipulation, Mesure, Alignement…</li>
<li><b>Réglages de l’outil</b> : changent selon l’outil actif (élément, ordre de liaison, case « Ajuster les hydrogènes » pour l’outil Dessin).</li>
<li><b>Types d’affichage</b> : boules et bâtons, bâtons (licorice), sphères de van der Waals, fil de fer, étiquettes…</li>
<li><b>Vue 3D</b> au centre.</li>
</ul>
<h3>Naviguer avec la souris</h3>
<table class="tbl"><thead><tr><th>Geste</th><th>Effet</th></tr></thead><tbody>
<tr><td>Clic gauche + glisser</td><td>Rotation</td></tr>
<tr><td>Clic droit + glisser</td><td>Déplacement (translation)</td></tr>
<tr><td>Molette</td><td>Zoom</td></tr>
</tbody></table>
<p>La visionneuse de la plateforme utilise les mêmes gestes (Maj + glisser pour déplacer sur un pavé tactile, pincement pour zoomer sur téléphone).</p>`,
        fig: { type: 'ui', id: 'avogadro', caption: 'Schéma simplifié de l’écran d’Avogadro (dessin pédagogique, pas une capture d’écran).' },
        sum: ['Gauche = tourner, droit = déplacer, molette = zoomer.', 'Le type d’affichage change l’apparence, pas la molécule.']
      },
      {
        title: 'Construire une molécule : atomes, liaisons, hydrogènes', dur: 25,
        obj: ['Utiliser l’outil Dessin', 'Comprendre l’ajustement automatique des hydrogènes'],
        intro: 'L’outil Dessin d’Avogadro construit directement en 3D, atome par atome.',
        body: `<h3>Avec l’outil Dessin</h3>
<ol>
<li>Choisissez l’élément dans les réglages de l’outil (carbone par défaut) et laissez cochée l’option <b>Ajuster les hydrogènes</b>.</li>
<li><b>Cliquez dans le vide</b> : un atome apparaît avec ses hydrogènes (un C donne CH<sub>4</sub>).</li>
<li><b>Cliquez-glissez depuis un atome</b> : vous créez une liaison et un nouvel atome.</li>
<li><b>Cliquez sur une liaison</b> pour augmenter son ordre (simple → double → triple).</li>
<li><b>Clic droit sur un atome</b> pour le supprimer.</li>
</ol>
<h3>Autres méthodes</h3>
<ul>
<li>Insérer un fragment ou une molécule depuis le menu de construction (Build).</li>
<li>Ouvrir un fichier (.mol, .xyz, .sdf, .pdb, .cml, .cjson).</li>
</ul>
<h3>Dans la plateforme</h3>
<p>L’atelier 3D propose un mode <b>Ajouter</b> : cliquez sur un atome pour lui accrocher l’élément choisi (il remplace un hydrogène), sur une liaison en mode <b>Liaison</b> pour changer son ordre. Les hydrogènes et la géométrie s’ajustent automatiquement.</p>`,
        fig: { type: 'v3d', mol: 'ammoniac', build: true, caption: 'Mode construction : choisissez O puis cliquez sur un H de l’ammoniac.' },
        sum: ['Un clic = un atome avec ses H ; glisser = une liaison ; clic sur liaison = ordre suivant.']
      },
      {
        title: 'Manipuler, optimiser et exporter', dur: 20,
        obj: ['Déplacer des atomes', 'Optimiser la géométrie', 'Enregistrer et exporter'],
        intro: 'Une molécule construite à la main a des angles approximatifs. L’optimisation géométrique la rend réaliste.',
        body: `<h3>Manipuler</h3>
<p>L’outil <b>Manipulation</b> déplace des atomes ou des groupes ; l’outil centré sur une liaison fait tourner une partie de la molécule autour d’une liaison.</p>
<h3>Optimiser la géométrie</h3>
<p>La commande <b>Optimiser la géométrie</b> (Optimize Geometry, raccourci Ctrl+Alt+O, dans le menu Extensions ou Calculer selon la version) déplace les atomes pour minimiser l’énergie calculée par un <b>champ de force</b> (MMFF94, UFF…). L’outil d’<b>auto-optimisation</b> le fait en continu pendant que vous dessinez.</p>
<h3>Enregistrer et exporter</h3>
<table class="tbl"><thead><tr><th>Format</th><th>Usage</th></tr></thead><tbody>
<tr><td>.cjson</td><td>Format natif d’Avogadro 2</td></tr>
<tr><td>.xyz</td><td>Coordonnées 3D simples, très répandu</td></tr>
<tr><td>.mol / .sdf</td><td>Coordonnées + liaisons, lu par la plupart des logiciels</td></tr>
<tr><td>.pdb</td><td>Biomolécules, protéines</td></tr>
<tr><td>Image (.png)</td><td>Rapports : Fichier &gt; Exporter &gt; Graphiques</td></tr>
</tbody></table>`,
        sum: ['Optimiser = minimiser l’énergie d’un champ de force.', 'XYZ ou MOL pour échanger, PNG pour illustrer.']
      }
    ],
    quiz: [
      { q: 'Dans Avogadro, quel geste fait tourner la molécule ?', o: ['Molette', 'Clic gauche + glisser', 'Clic droit + glisser', 'Double-clic'], a: 1, e: 'Clic gauche + glisser : rotation ; clic droit : translation ; molette : zoom.' },
      { q: 'À quoi sert l’option « Ajuster les hydrogènes » de l’outil Dessin ?', o: ['À colorer les H', 'À compléter automatiquement la valence avec des H', 'À supprimer tous les H', 'À calculer la masse'], a: 1, e: 'Avogadro ajoute ou retire des H pour respecter la valence de chaque atome.' },
      { q: 'Que fait l’optimisation de géométrie ?', o: ['Elle colore les atomes', 'Elle minimise l’énergie en déplaçant les atomes', 'Elle ajoute des liaisons doubles', 'Elle traduit la molécule en 2D'], a: 1, e: 'Elle cherche une géométrie de basse énergie selon un champ de force.' },
      { q: 'Quel format est le format natif d’Avogadro 2 ?', o: ['.sk2', '.cjson', '.docx', '.cdx'], a: 1, e: 'Avogadro 2 enregistre nativement en .cjson (Chemical JSON).' },
      { q: 'Avogadro est…', o: ['payant', 'libre et open source', 'réservé à Windows', 'un éditeur 2D uniquement'], a: 1, e: 'Libre, gratuit et multiplateforme.' },
      { q: 'Quel type d’affichage montre la taille réelle des atomes ?', o: ['Fil de fer', 'Boules et bâtons', 'Sphères de van der Waals', 'Bâtons'], a: 2, e: 'Les sphères de van der Waals donnent une vue compacte, à l’échelle de l’encombrement des atomes.' },
      { t: 'court', q: 'Quel format texte simple contient seulement les éléments et leurs coordonnées x, y, z ? (extension sans le point)', acc: ['xyz', '.xyz'], e: 'Le format XYZ.' }
    ]
  });

  // ---------------------------------------------------------------- MODULE 5
  M.push({
    id: 5, code: 'M5', title: 'Modélisation moléculaire en 3D', short: 'Géométrie 3D',
    desc: 'Théorie VSEPR, géométries linéaire à tétraédrique, angles, distances et optimisation.',
    lessons: [
      {
        title: 'Pourquoi la forme des molécules compte', dur: 10,
        obj: ['Relier forme et propriétés'],
        intro: 'Deux molécules de formules voisines peuvent avoir des propriétés très différentes à cause de leur forme.',
        body: `<p>Le dioxyde de carbone CO<sub>2</sub> est linéaire : les deux liaisons polaires C=O s’annulent, la molécule est <b>apolaire</b>. L’eau H<sub>2</sub>O est coudée : ses deux liaisons O–H ne s’annulent pas, elle est <b>polaire</b>. C’est l’une des raisons pour lesquelles l’eau est liquide à température ambiante et dissout le sel.</p>
<p>En biologie, un médicament agit souvent parce que sa forme s’ajuste à celle d’une protéine, comme une clé dans une serrure. Connaître la géométrie 3D est donc essentiel.</p>`,
        fig: { type: 'v3d-row', mols: ['co2', 'eau'], caption: 'CO₂ linéaire et H₂O coudée.' },
        sum: ['La géométrie détermine la polarité et les interactions.']
      },
      {
        title: 'La théorie VSEPR', dur: 25,
        obj: ['Écrire la notation AXₙEₘ', 'Prévoir la géométrie d’une molécule simple'],
        intro: 'La théorie VSEPR (répulsion des paires électroniques de la couche de valence, Gillespie) prévoit la forme d’une molécule à partir d’un principe simple : les doublets d’électrons autour d’un atome central se repoussent et s’écartent le plus possible.',
        body: `<h3>Notation AX<sub>n</sub>E<sub>m</sub></h3>
<ul>
<li><b>A</b> : l’atome central.</li>
<li><b>X<sub>n</sub></b> : n atomes liés à A (une liaison double ou triple compte pour un seul X).</li>
<li><b>E<sub>m</sub></b> : m doublets non liants portés par A.</li>
</ul>
<p>Le nombre n + m fixe la disposition des doublets ; les doublets non liants occupent de la place mais ne « se voient » pas dans la forme de la molécule.</p>
<table class="tbl"><thead><tr><th>n + m</th><th>Type</th><th>Géométrie</th><th>Angle</th><th>Exemple</th></tr></thead><tbody>
<tr><td>2</td><td>AX<sub>2</sub></td><td>linéaire</td><td>180°</td><td>CO<sub>2</sub></td></tr>
<tr><td>3</td><td>AX<sub>3</sub></td><td>trigonale plane</td><td>120°</td><td>BF<sub>3</sub></td></tr>
<tr><td>4</td><td>AX<sub>4</sub></td><td>tétraédrique</td><td>109,5°</td><td>CH<sub>4</sub></td></tr>
<tr><td>4</td><td>AX<sub>3</sub>E</td><td>pyramidale</td><td>≈ 107°</td><td>NH<sub>3</sub></td></tr>
<tr><td>4</td><td>AX<sub>2</sub>E<sub>2</sub></td><td>coudée</td><td>≈ 104,5°</td><td>H<sub>2</sub>O</td></tr>
<tr><td>6</td><td>AX<sub>6</sub></td><td>octaédrique</td><td>90°</td><td>SF<sub>6</sub></td></tr>
</tbody></table>
<h3>Méthode</h3>
<ol><li>Dessinez la structure de Lewis.</li><li>Comptez X (voisins) et E (doublets non liants) de l’atome central.</li><li>Lisez la géométrie dans le tableau.</li></ol>
<p>Dans l’atelier 3D, cliquez sur un atome central : la plateforme affiche sa notation VSEPR, sa géométrie et ses angles mesurés.</p>`,
        sum: ['Les doublets se repoussent au maximum.', 'Les doublets non liants comptent pour la disposition mais pas pour le nom de la forme.']
      },
      {
        title: 'Les cinq géométries de base', dur: 25,
        obj: ['Visualiser les géométries linéaire, trigonale plane, tétraédrique, pyramidale et coudée'],
        intro: 'Faites tourner chaque modèle et observez les angles. Cliquez sur l’atome central pour afficher sa notation VSEPR.',
        body: `<ul>
<li><b>Linéaire</b> (CO<sub>2</sub>) : les trois atomes sont alignés, angle O=C=O de 180°.</li>
<li><b>Trigonale plane</b> (BF<sub>3</sub>) : trois atomes autour du bore, dans un plan, à 120°.</li>
<li><b>Tétraédrique</b> (CH<sub>4</sub>) : quatre H aux sommets d’un tétraèdre, angles de 109,5°.</li>
<li><b>Pyramidale</b> (NH<sub>3</sub>) : comme un tétraèdre dont un sommet est occupé par le doublet non liant ; angle H–N–H ≈ 107°.</li>
<li><b>Coudée</b> (H<sub>2</sub>O) : deux doublets non liants ; angle H–O–H ≈ 104,5°.</li>
</ul>
<p>Remarquez la diminution 109,5° → 107° → 104,5° : un doublet non liant repousse plus fortement les liaisons qu’une liaison ne le fait.</p>`,
        fig: { type: 'v3d-grid', mols: ['co2', 'bf3', 'methane', 'ammoniac', 'eau'], caption: 'Cliquez sur l’atome central de chaque modèle pour lire sa géométrie.' },
        sum: ['180° → 120° → 109,5° → 107° → 104,5° selon le nombre de doublets.']
      },
      {
        title: 'Distances interatomiques et angles de liaison', dur: 20,
        obj: ['Mesurer une distance, un angle, un angle dièdre', 'Connaître quelques valeurs de référence'],
        intro: 'Mesurer, c’est vérifier qu’un modèle est réaliste. Les logiciels donnent les distances en ångströms (1 Å = 10⁻¹⁰ m = 0,1 nm).',
        body: `<h3>Valeurs de référence</h3>
<table class="tbl"><thead><tr><th>Liaison</th><th>Longueur typique</th></tr></thead><tbody>
<tr><td>C–H</td><td>1,09 Å</td></tr><tr><td>O–H</td><td>0,96 Å</td></tr><tr><td>N–H</td><td>1,01 Å</td></tr>
<tr><td>C–C</td><td>1,54 Å</td></tr><tr><td>C=C</td><td>1,34 Å</td></tr><tr><td>C≡C</td><td>1,20 Å</td></tr>
<tr><td>C–O</td><td>1,43 Å</td></tr><tr><td>C=O</td><td>1,21 Å</td></tr>
</tbody></table>
<h3>Mesurer</h3>
<p>Avec l’outil <b>Mesure</b> d’Avogadro (et le mode Mesurer de l’atelier 3D) : cliquez sur 2 atomes pour une distance, 3 pour un angle, 4 pour un angle dièdre (rotation autour d’une liaison).</p>`,
        fig: { type: 'v3d', mol: 'ethanol', measure: true, caption: 'Mode Mesurer : cliquez sur C, C puis O pour obtenir l’angle C–C–O.' },
        sum: ['2 atomes = distance, 3 = angle, 4 = dièdre.', 'Les distances s’expriment en Å.']
      },
      {
        title: 'L’optimisation géométrique', dur: 20,
        obj: ['Expliquer le principe d’un champ de force', 'Interpréter le résultat d’une optimisation'],
        intro: 'Optimiser une géométrie, c’est chercher la position des atomes qui minimise l’énergie de la molécule.',
        body: `<h3>Le principe</h3>
<p>Un <b>champ de force</b> calcule une énergie à partir de termes simples : étirement des liaisons (comme des ressorts), déformation des angles, torsions autour des liaisons, répulsions entre atomes non liés. L’algorithme déplace les atomes pas à pas pour faire baisser cette énergie, jusqu’à ce qu’elle ne diminue plus.</p>
<h3>Ce qu’il faut savoir</h3>
<ul>
<li>Le résultat est un <b>minimum local</b> : selon le point de départ, on peut obtenir des conformations différentes (par exemple pour le butane).</li>
<li>Les champs de force professionnels (MMFF94, UFF) sont paramétrés sur des données expérimentales. Celui de la plateforme est <b>volontairement simplifié</b> pour l’enseignement : il retrouve les angles VSEPR mais ne remplace pas Avogadro pour un travail de recherche.</li>
<li>Toujours vérifier le résultat : formule correcte, angles plausibles, pas d’atomes superposés.</li>
</ul>
<p>Essayez : dans l’atelier 2D, dessinez une molécule à plat puis cliquez sur « Voir en 3D » ; la plateforme ajoute les hydrogènes puis optimise sous vos yeux.</p>`,
        sum: ['Optimiser = minimiser une énergie par petits déplacements.', 'Le résultat dépend du point de départ (minimum local).']
      }
    ],
    quiz: [
      { q: 'Quelle est la géométrie de CO₂ ?', o: ['Coudée', 'Linéaire', 'Trigonale plane', 'Tétraédrique'], a: 1, e: 'AX₂ : linéaire, 180°.' },
      { q: 'Quel est l’angle H–C–H dans le méthane ?', o: ['90°', '104,5°', '109,5°', '120°'], a: 2, e: 'Tétraèdre régulier : 109,5°.' },
      { q: 'La notation VSEPR de l’eau est…', o: ['AX₂', 'AX₂E', 'AX₂E₂', 'AX₄'], a: 2, e: 'L’oxygène a 2 voisins et 2 doublets non liants.' },
      { q: 'Pourquoi l’angle de NH₃ (≈107°) est-il plus petit que celui de CH₄ ?', o: ['L’azote est plus lourd', 'Le doublet non liant repousse davantage les liaisons', 'Les liaisons N–H sont doubles', 'C’est une erreur de mesure'], a: 1, e: 'Un doublet non liant occupe plus de place et comprime les angles.' },
      { q: 'BF₃ a une géométrie…', o: ['pyramidale', 'trigonale plane', 'tétraédrique', 'coudée'], a: 1, e: 'AX₃ sans doublet non liant sur le bore : trigonale plane, 120°.' },
      { q: 'Combien d’atomes faut-il sélectionner pour mesurer un angle de liaison ?', o: ['2', '3', '4', '5'], a: 1, e: '3 atomes ; 4 pour un angle dièdre.' },
      { q: 'Une optimisation géométrique fournit…', o: ['toujours la conformation la plus stable', 'un minimum local de l’énergie', 'la formule brute', 'un spectre RMN'], a: 1, e: 'Le résultat dépend du point de départ : c’est un minimum local.' },
      { t: 'court', q: 'Quelle est, en degrés, la valeur arrondie de l’angle H–O–H de l’eau ?', acc: ['104,5', '104.5', '104,5°', '104.5°', '105', '104'], e: '≈ 104,5°.' }
    ]
  });

  // ---------------------------------------------------------------- MODULE 6
  M.push({
    id: 6, code: 'M6', title: 'Comparaison entre ChemSketch et Avogadro', short: 'Comparaison',
    desc: 'Différences, complémentarité, passage du 2D au 3D et formats de fichiers.',
    lessons: [
      {
        title: 'Deux logiciels, deux rôles', dur: 15,
        obj: ['Comparer les deux logiciels', 'Choisir l’outil adapté à une tâche'],
        intro: 'ChemSketch et Avogadro ne sont pas concurrents : ils répondent à des besoins différents.',
        body: `<table class="tbl"><thead><tr><th>Critère</th><th>ChemSketch (Freeware)</th><th>Avogadro</th></tr></thead><tbody>
<tr><td>Rôle principal</td><td>Dessin 2D, documents</td><td>Construction et visualisation 3D</td></tr>
<tr><td>Licence</td><td>Gratuit pour usage académique ou personnel</td><td>Libre et open source</td></tr>
<tr><td>Systèmes</td><td>Windows</td><td>Windows, macOS, Linux</td></tr>
<tr><td>Points forts</td><td>Rapidité de dessin, modèles, nom et propriétés calculés, mise en page</td><td>Rotation, mesures, optimisation par champ de force, nombreux formats</td></tr>
<tr><td>Limites</td><td>3D limitée, format .sk2 peu lu ailleurs</td><td>Peu adapté à la mise en page de rapports</td></tr>
<tr><td>Format natif</td><td>.sk2</td><td>.cjson</td></tr>
</tbody></table>
<h3>Quel outil pour quelle tâche ?</h3>
<ul><li>Illustrer un compte rendu avec des formules : <b>ChemSketch</b>.</li><li>Étudier une géométrie, mesurer un angle : <b>Avogadro</b>.</li><li>Les deux : dessiner vite en 2D puis étudier en 3D.</li></ul>`,
        sum: ['ChemSketch pour dessiner et documenter, Avogadro pour construire et mesurer en 3D.']
      },
      {
        title: 'Passer de la 2D à la 3D', dur: 20,
        obj: ['Réaliser le flux de travail ChemSketch → Avogadro'],
        intro: 'Le passage d’un logiciel à l’autre se fait par fichiers. Voici la démarche testée avec le format MOL.',
        body: `<ol>
<li>Dans ChemSketch, dessinez la molécule et vérifiez la formule.</li>
<li>Enregistrez votre travail en <b>.sk2</b>.</li>
<li>Enregistrez une copie au format <b>MDL Molfile (.mol)</b>.</li>
<li>Dans Avogadro : Fichier &gt; Ouvrir, choisissez le fichier .mol. La molécule apparaît <b>à plat</b> (coordonnées z nulles) et parfois sans hydrogènes.</li>
<li>Ajoutez les hydrogènes si nécessaire (commande d’ajout des hydrogènes du menu de construction).</li>
<li>Lancez <b>Optimiser la géométrie</b> : la molécule prend sa forme 3D.</li>
<li>Mesurez, puis enregistrez en .cjson et exportez une image.</li>
</ol>
<p class="note">ChemSketch possède aussi sa propre optimisation 3D et une visionneuse 3D, utiles pour un aperçu rapide.</p>
<p>Dans la plateforme, le bouton <b>Voir en 3D</b> de l’atelier 2D réalise ces étapes automatiquement (ajout des H et optimisation simplifiée), et les boutons d’export produisent des fichiers .mol et .xyz ouvrables dans Avogadro.</p>`,
        sum: ['ChemSketch → .mol → Avogadro → ajouter H → optimiser → mesurer.']
      },
      {
        title: 'Formats de fichiers et interopérabilité', dur: 20,
        obj: ['Connaître les formats d’échange et leurs limites'],
        intro: 'Choisir le bon format évite de perdre des informations en chemin.',
        body: `<table class="tbl"><thead><tr><th>Format</th><th>Contenu</th><th>ChemSketch</th><th>Avogadro</th></tr></thead><tbody>
<tr><td>.sk2</td><td>Dessin complet ChemSketch</td><td>lecture/écriture</td><td>non</td></tr>
<tr><td>.mol (V2000)</td><td>Atomes, coordonnées, liaisons</td><td>lecture/écriture</td><td>lecture/écriture</td></tr>
<tr><td>.sdf</td><td>Une ou plusieurs molécules MOL</td><td>oui</td><td>oui</td></tr>
<tr><td>.xyz</td><td>Éléments + coordonnées x, y, z, sans liaisons</td><td>—</td><td>lecture/écriture</td></tr>
<tr><td>.cjson</td><td>Format natif Avogadro 2</td><td>—</td><td>lecture/écriture</td></tr>
<tr><td>SMILES</td><td>Une ligne de texte (ex. CCO pour l’éthanol)</td><td>génération</td><td>insertion</td></tr>
</tbody></table>
<p><b>Règles pratiques :</b> le format MOL est le meilleur pont entre les deux logiciels ; le XYZ ne contient pas les liaisons (le logiciel les devine d’après les distances) ; un fichier .sk2 ne s’ouvre pas dans Avogadro.</p>
<p>Avant un TP, testez toujours l’aller-retour avec vos propres versions de logiciels : les possibilités exactes d’import et d’export dépendent des versions installées.</p>`,
        sum: ['MOL = pont entre les deux logiciels.', 'XYZ = coordonnées seules, liaisons devinées.']
      }
    ],
    quiz: [
      { q: 'Quel est le meilleur format d’échange entre ChemSketch et Avogadro ?', o: ['.sk2', '.mol', '.cjson', '.png'], a: 1, e: 'Le MOL est lu et écrit par les deux logiciels.' },
      { q: 'Une molécule .mol issue de ChemSketch s’ouvre dans Avogadro…', o: ['déjà optimisée en 3D', 'à plat : il faut l’optimiser', 'en image', 'sans aucun atome'], a: 1, e: 'Les coordonnées z sont nulles ; une optimisation donne la forme 3D.' },
      { q: 'Que ne contient pas un fichier XYZ ?', o: ['Les éléments', 'Les coordonnées', 'Les liaisons', 'Le nombre d’atomes'], a: 2, e: 'Le XYZ ne donne que les éléments et leurs coordonnées.' },
      { q: 'Quel logiciel est multiplateforme (Windows, macOS, Linux) ?', o: ['ChemSketch Freeware', 'Avogadro', 'Les deux', 'Aucun'], a: 1, e: 'ChemSketch Freeware est sous Windows ; Avogadro est multiplateforme.' },
      { q: 'Pour illustrer un compte rendu avec des formules propres, on choisit plutôt…', o: ['Avogadro', 'ChemSketch', 'Un fichier XYZ', 'Un tableur'], a: 1, e: 'ChemSketch est conçu pour le dessin et la mise en page.' },
      { t: 'court', q: 'Écrivez le SMILES de l’éthanol.', acc: ['cco', 'occ', 'c(o)c', 'oc c'], e: 'CCO (ou OCC).' }
    ]
  });

  // ---------------------------------------------------------------- MODULE 7
  M.push({
    id: 7, code: 'M7', title: 'Travaux pratiques et projets', short: 'TP et projets',
    desc: 'Huit travaux pratiques guidés, du dessin de l’eau au mini-projet de modélisation.',
    lessons: [
      {
        title: 'Organisation des travaux pratiques', dur: 10,
        obj: ['Connaître les attendus et le dépôt des travaux'],
        intro: 'Chaque TP suit la même structure : objectifs, matériel, étapes, livrable, critères d’évaluation.',
        body: `<h3>Déroulement</h3>
<ol><li>Lisez la fiche du TP (téléchargeable dans la bibliothèque).</li><li>Réalisez le travail dans ChemSketch ou Avogadro (ou entraînez-vous d’abord dans les ateliers de la plateforme).</li><li>Déposez vos fichiers dans l’espace de dépôt du TP, avec un court commentaire.</li><li>L’enseignant corrige et attribue une note sur 20 ; vous recevez une notification.</li></ol>
<h3>Bonnes pratiques de dépôt</h3>
<ul><li>Nommez vos fichiers : <code>NOM_Prenom_TP1.sk2</code>.</li><li>Joignez une image ou un .mol pour faciliter la correction.</li><li>Formats acceptés : .sk2, .mol, .sdf, .xyz, .cjson, .cml, .pdb, .png, .jpg, .pdf.</li></ul>`,
        sum: ['Une fiche, un travail, un dépôt, une note.']
      }
    ],
    quiz: []
  });

  // ---------------------------------------------------------------- TRAVAUX PRATIQUES
  const TPS = [
    { id: 1, mod: 2, title: 'Dessiner une molécule d’eau avec ChemSketch', soft: 'ChemSketch', dur: 30, lib: 'eau',
      obj: ['Placer un atome et laisser le logiciel compléter les hydrogènes', 'Enregistrer en .sk2 et exporter une image'],
      steps: ['Ouvrez ChemSketch en mode Structure.', 'Sélectionnez O dans la barre des atomes et cliquez dans la zone de dessin : H₂O apparaît.', 'Affichez la formule et la masse molaire (Tools > Calculate) : vous devez lire H₂O et ≈ 18,02 g/mol.', 'Dessinez aussi la formule développée H–O–H (avec des atomes H explicites).', 'Enregistrez en NOM_Prenom_TP1.sk2 et exportez une image PNG.'],
      livrable: 'Fichier .sk2 et image .png', bareme: ['Structure correcte (8 pts)', 'Formule et masse indiquées (6 pts)', 'Fichiers bien nommés et lisibles (6 pts)'] },
    { id: 2, mod: 3, title: 'Représenter une molécule de benzène en 2D', soft: 'ChemSketch', dur: 40, lib: 'benzene',
      obj: ['Utiliser un modèle de cycle', 'Représenter le benzène de deux façons'],
      steps: ['Dans la barre des radicaux, choisissez le benzène et cliquez dans la zone de dessin.', 'Vérifiez la formule C₆H₆.', 'À côté, dessinez le cyclohexane et comparez les formules (C₆H₁₂).', 'Ajoutez un titre et une légende expliquant la différence.', 'Enregistrez (.sk2) et exportez une image.'],
      livrable: 'Fichier .sk2 et image', bareme: ['Benzène correct (8 pts)', 'Comparaison avec le cyclohexane (6 pts)', 'Présentation (6 pts)'] },
    { id: 3, mod: 3, title: 'Dessiner une molécule d’éthanol', soft: 'ChemSketch', dur: 30, lib: 'ethanol',
      obj: ['Construire une chaîne et placer un hétéroatome', 'Distinguer deux isomères'],
      steps: ['Dessinez une chaîne de deux carbones.', 'Ajoutez un troisième atome puis remplacez-le par O.', 'Vérifiez la formule C₂H₆O et la masse ≈ 46,07 g/mol.', 'Dessinez l’isomère méthoxyméthane (CH₃–O–CH₃) et comparez.', 'Générez le nom des deux structures (Tools > Generate > Name for Structure).', 'Enregistrez et exportez en .mol.'],
      livrable: 'Fichiers .sk2 et .mol', bareme: ['Éthanol correct (8 pts)', 'Isomère correct et comparé (6 pts)', 'Export .mol (6 pts)'] },
    { id: 4, mod: 4, title: 'Construire une molécule de méthane avec Avogadro', soft: 'Avogadro', dur: 30, ref: 'methane',
      obj: ['Utiliser l’outil Dessin', 'Mesurer un angle H–C–H'],
      steps: ['Ouvrez Avogadro, choisissez l’outil Dessin, élément carbone, « Ajuster les hydrogènes » coché.', 'Cliquez une fois dans la vue : CH₄ apparaît.', 'Optimisez la géométrie (Ctrl+Alt+O).', 'Avec l’outil Mesure, mesurez une longueur C–H et un angle H–C–H.', 'Enregistrez en .cjson et exportez en .xyz et en image PNG.'],
      livrable: 'Fichiers .cjson ou .xyz, image avec les mesures', bareme: ['Molécule correcte (6 pts)', 'Mesures correctes ≈ 1,09 Å et 109,5° (8 pts)', 'Fichiers (6 pts)'] },
    { id: 5, mod: 5, title: 'Représenter une molécule d’ammoniac en 3D', soft: 'Avogadro', dur: 40, ref: 'ammoniac',
      obj: ['Construire NH₃', 'Relier la géométrie mesurée à la théorie VSEPR'],
      steps: ['Construisez NH₃ (outil Dessin, élément azote).', 'Optimisez la géométrie.', 'Mesurez les trois angles H–N–H et une longueur N–H.', 'Comparez avec le méthane : expliquez l’écart à 109,5° par le doublet non liant.', 'Exportez une image et rédigez trois lignes d’interprétation.'],
      livrable: 'Image + interprétation (PDF ou texte) + fichier 3D', bareme: ['Géométrie correcte (6 pts)', 'Mesures (6 pts)', 'Interprétation VSEPR (8 pts)'] },
    { id: 6, mod: 3, title: 'Construire une molécule organique complexe', soft: 'ChemSketch', dur: 60, lib: 'aspirine',
      obj: ['Appliquer la méthode squelette → substituants → contrôle'],
      steps: ['Choisissez l’aspirine (ou le paracétamol, selon la consigne de l’enseignant).', 'Posez le cycle benzénique avec le modèle.', 'Ajoutez les substituants et les hétéroatomes.', 'Contrôlez la formule : C₉H₈O₄ pour l’aspirine (C₈H₉NO₂ pour le paracétamol).', 'Nettoyez le dessin (Clean Structure), générez le nom, exportez .sk2 + .mol + image.'],
      livrable: 'Fichiers .sk2, .mol et image', bareme: ['Structure exacte (10 pts)', 'Formule et nom (5 pts)', 'Qualité du dessin (5 pts)'] },
    { id: 7, mod: 6, title: 'Modélisation 3D d’une molécule dessinée en 2D', soft: 'Les deux', dur: 60, lib: 'acide_acetique',
      obj: ['Réaliser le passage ChemSketch → Avogadro par un fichier MOL'],
      steps: ['Dessinez l’acide acétique dans ChemSketch.', 'Exportez-le au format MOL.', 'Ouvrez le fichier dans Avogadro, ajoutez les hydrogènes si besoin.', 'Optimisez la géométrie.', 'Mesurez l’angle O=C–O et la longueur C=O.', 'Déposez le .mol de départ, le fichier 3D final et une image.'],
      livrable: '.mol (2D), .cjson ou .xyz (3D), image', bareme: ['Dessin 2D (5 pts)', 'Transfert et optimisation (8 pts)', 'Mesures et commentaire (7 pts)'] },
    { id: 8, mod: 7, title: 'Mini-projet de modélisation moléculaire', soft: 'Les deux', dur: 120,
      obj: ['Mener seul un travail complet de représentation 2D et 3D', 'Présenter ses résultats'],
      steps: ['Choisissez une molécule d’intérêt (médicament, molécule du quotidien, polluant…) validée par l’enseignant.', 'Dessinez-la en 2D, vérifiez formule et masse.', 'Construisez-la en 3D, optimisez, mesurez au moins deux angles et deux distances.', 'Identifiez ses groupes fonctionnels et la géométrie d’au moins deux atomes (VSEPR).', 'Rédigez une fiche de 2 pages maximum avec figures 2D et 3D.', 'Déposez la fiche (PDF) et les fichiers moléculaires.'],
      livrable: 'Fiche PDF + fichiers .sk2/.mol/.cjson', bareme: ['Exactitude des structures (6 pts)', 'Mesures et analyse VSEPR (6 pts)', 'Qualité de la fiche (5 pts)', 'Fichiers (3 pts)'] }
  ];

  // ---------------------------------------------------------------- EXERCICES DE DESSIN (corrigés automatiquement)
  const DRAW = [
    { id: 'd1', target: 'eau', title: 'L’eau', level: 'Facile', hint: 'Un seul atome lourd suffit : les H sont ajoutés automatiquement.' },
    { id: 'd2', target: 'methane', title: 'Le méthane', level: 'Facile', hint: 'Un carbone seul.' },
    { id: 'd3', target: 'ethanol', title: 'L’éthanol', level: 'Facile', hint: 'Chaîne de trois atomes lourds : C, C, puis O en bout de chaîne.' },
    { id: 'd4', target: 'ethylene', title: 'L’éthylène', level: 'Facile', hint: 'Deux carbones reliés par une liaison double.' },
    { id: 'd5', target: 'acetylene', title: 'L’acétylène', level: 'Facile', hint: 'Liaison triple : choisissez l’ordre 3 ou cliquez deux fois sur la liaison.' },
    { id: 'd6', target: 'co2', title: 'Le dioxyde de carbone', level: 'Moyen', hint: 'O=C=O : deux liaisons doubles.' },
    { id: 'd7', target: 'acide_acetique', title: 'L’acide acétique', level: 'Moyen', hint: 'CH₃ – C(=O) – OH.' },
    { id: 'd8', target: 'acetone', title: 'L’acétone', level: 'Moyen', hint: 'Le C=O est au milieu de la chaîne de trois carbones.' },
    { id: 'd9', target: 'benzene', title: 'Le benzène', level: 'Moyen', hint: 'Outil Cycle, benzène.' },
    { id: 'd10', target: 'phenol', title: 'Le phénol', level: 'Moyen', hint: 'Un benzène portant un groupe –OH.' },
    { id: 'd11', target: 'glycine', title: 'La glycine', level: 'Difficile', hint: 'H₂N – CH₂ – COOH.' },
    { id: 'd12', target: 'aspirine', title: 'L’aspirine', level: 'Difficile', hint: 'Benzène avec, sur deux carbones voisins, –COOH et –O–C(=O)–CH₃.' }
  ];

  // ---------------------------------------------------------------- RECONNAISSANCE (modèle 3D → nom)
  const RECO = [
    { mol: 'eau', o: ['Eau', 'Ammoniac', 'Méthane', 'Dioxyde de carbone'], a: 0, geo: 'coudée' },
    { mol: 'ammoniac', o: ['Méthane', 'Ammoniac', 'Trifluorure de bore', 'Eau'], a: 1, geo: 'pyramidale' },
    { mol: 'bf3', o: ['Ammoniac', 'Méthanal', 'Trifluorure de bore', 'Éthylène'], a: 2, geo: 'trigonale plane' },
    { mol: 'acetylene', o: ['Éthylène', 'Dioxyde de carbone', 'Éthane', 'Acétylène'], a: 3, geo: 'linéaire' },
    { mol: 'benzene', o: ['Cyclohexane', 'Benzène', 'Toluène', 'Phénol'], a: 1, geo: 'plane (aromatique)' },
    { mol: 'ethanol', o: ['Méthanol', 'Acide acétique', 'Éthanol', 'Acétone'], a: 2, geo: 'tétraédrique autour des carbones' },
    { mol: 'sf6', o: ['Hexafluorure de soufre', 'Méthane', 'Trifluorure de bore', 'Sulfure d’hydrogène'], a: 0, geo: 'octaédrique' },
    { mol: 'acide_acetique', o: ['Éthanol', 'Acide acétique', 'Méthanal', 'Acétone'], a: 1, geo: 'trigonale plane autour du C du groupe COOH' }
  ];

  // ---------------------------------------------------------------- GUIDES (bibliothèque)
  const GUIDES = [
    { id: 'g-cs', title: 'Guide d’installation et de démarrage — ChemSketch', mod: 2, body: () => M[1].lessons[0].body + M[1].lessons[2].body },
    { id: 'g-av', title: 'Guide d’installation et de démarrage — Avogadro', mod: 4, body: () => M[3].lessons[0].body + M[3].lessons[1].body + M[3].lessons[2].body },
    { id: 'g-vsepr', title: 'Aide-mémoire VSEPR et valeurs de référence', mod: 5, body: () => M[4].lessons[1].body + M[4].lessons[3].body },
    { id: 'g-formats', title: 'Aide-mémoire des formats de fichiers', mod: 6, body: () => M[5].lessons[2].body + M[5].lessons[1].body }
  ];

  M.forEach((m) => m.lessons.forEach((l, i) => { l.id = m.id + '-' + (i + 1); l.mod = m.id; }));
  G.CONTENT = { modules: M, tps: TPS, draw: DRAW, reco: RECO, guides: GUIDES };
})(window);
