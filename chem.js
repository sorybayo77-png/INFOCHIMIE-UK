/* chem.js — noyau chimie de l'application
   Données des éléments, graphe moléculaire, formules, formats MOL/SDF/XYZ/SMILES,
   VSEPR, champ de force pédagogique simplifié, molécules de référence 2D et 3D. */
(function (G) {
  'use strict';

  // ---------- Éléments ----------
  // m : masse molaire (g/mol) · v : valences usuelles · ve : électrons de valence
  // r : rayons covalents (simple, double, triple) en Å (Pyykkö) · w : rayon de van der Waals (Å)
  // c : couleur CPK (3D) · l : couleur d'étiquette 2D
  // tableau périodique complet (118 éléments) — g : groupe · p : période · noH : jamais d'hydrogène implicite (métaux, gaz nobles)
  // met : métal · l / ld : couleur d'étiquette 2D (fond clair / fond sombre). Les 12 éléments d'origine gardent leurs valeurs.
  const EL = {
    H: {n: "Hydrogène", m: 1.008, ve: 1, r: [0.32, 0.32, 0.32], w: 1.1, c: "#ffffff", g: 1, p: 1, v: [1], l: ""},
    He: {n: "Hélium", m: 4.0026, ve: 2, r: [0.46, 0.46, 0.46], w: 1.4, c: "#d9ffff", g: 18, p: 1, v: [0, 2, 4, 6, 8], noH: 1, l: "#617272", ld: "#d9ffff"},
    Li: {n: "Lithium", m: 6.94, ve: 1, r: [1.33, 1.24, 1.24], w: 1.82, c: "#cc80ff", g: 1, p: 2, v: [8], noH: 1, met: 1, l: "#8d59b1", ld: "#cc80ff"},
    Be: {n: "Béryllium", m: 9.0122, ve: 2, r: [1.02, 0.9, 0.85], w: 1.53, c: "#c2ff00", g: 2, p: 2, v: [8], noH: 1, met: 1, l: "#5d7b00", ld: "#c2ff00"},
    B: {n: "Bore", m: 10.81, ve: 3, r: [0.85, 0.78, 0.73], w: 1.92, c: "#ffb5b5", g: 13, p: 2, v: [3], l: "#b5525a"},
    C: {n: "Carbone", m: 12.011, ve: 4, r: [0.75, 0.67, 0.6], w: 1.7, c: "#8f8f8f", g: 14, p: 2, v: [4], l: ""},
    N: {n: "Azote", m: 14.007, ve: 5, r: [0.71, 0.6, 0.54], w: 1.55, c: "#3050f8", g: 15, p: 2, v: [3], l: "#2747d6"},
    O: {n: "Oxygène", m: 15.999, ve: 6, r: [0.63, 0.57, 0.53], w: 1.52, c: "#ff0d0d", g: 16, p: 2, v: [2], l: "#d61a1a"},
    F: {n: "Fluor", m: 18.998, ve: 7, r: [0.64, 0.59, 0.53], w: 1.47, c: "#90e050", g: 17, p: 2, v: [1], l: "#3b8a1d"},
    Ne: {n: "Néon", m: 20.1797, ve: 8, r: [0.67, 0.96, 0.96], w: 1.54, c: "#b3e3f5", g: 18, p: 2, v: [0, 2, 4, 6, 8], noH: 1, l: "#5d767f", ld: "#b3e3f5"},
    Na: {n: "Sodium", m: 22.9898, ve: 1, r: [1.55, 1.6, 1.6], w: 2.27, c: "#ab5cf2", g: 1, p: 3, v: [8], noH: 1, met: 1, l: "#934fd1", ld: "#ab5cf2"},
    Mg: {n: "Magnésium", m: 24.305, ve: 2, r: [1.39, 1.32, 1.27], w: 1.73, c: "#8aff00", g: 2, p: 3, v: [8], noH: 1, met: 1, l: "#478400", ld: "#8aff00"},
    Al: {n: "Aluminium", m: 26.9815, ve: 3, r: [1.26, 1.13, 1.11], w: 1.84, c: "#bfa6a6", g: 13, p: 3, v: [8], noH: 1, met: 1, l: "#7b6b6b", ld: "#bfa6a6"},
    Si: {n: "Silicium", m: 28.085, ve: 4, r: [1.16, 1.07, 1.02], w: 2.1, c: "#f0c8a0", g: 14, p: 3, v: [4], l: "#9a6a36"},
    P: {n: "Phosphore", m: 30.974, ve: 5, r: [1.11, 1.02, 0.94], w: 1.8, c: "#ff8000", g: 15, p: 3, v: [3, 5], l: "#c96400"},
    S: {n: "Soufre", m: 32.06, ve: 6, r: [1.03, 0.94, 0.95], w: 1.8, c: "#ffff30", g: 16, p: 3, v: [2, 4, 6], l: "#a08200"},
    Cl: {n: "Chlore", m: 35.45, ve: 7, r: [0.99, 0.95, 0.93], w: 1.75, c: "#1ff01f", g: 17, p: 3, v: [1, 3, 5, 7], l: "#178f17"},
    Ar: {n: "Argon", m: 39.948, ve: 8, r: [0.96, 1.07, 0.96], w: 1.88, c: "#80d1e3", g: 18, p: 3, v: [0, 2, 4, 6, 8], noH: 1, l: "#4d7d88", ld: "#80d1e3"},
    K: {n: "Potassium", m: 39.0983, ve: 1, r: [1.96, 1.93, 1.93], w: 2.75, c: "#8f40d4", g: 1, p: 4, v: [8], noH: 1, met: 1, l: "#8f40d4", ld: "#a566dc"},
    Ca: {n: "Calcium", m: 40.078, ve: 2, r: [1.71, 1.47, 1.33], w: 2.31, c: "#3dff00", g: 2, p: 4, v: [8], noH: 1, met: 1, l: "#1f8400", ld: "#3dff00"},
    Sc: {n: "Scandium", m: 44.9559, ve: 3, r: [1.48, 1.16, 1.14], w: 2.15, c: "#e6e6e6", g: 3, p: 4, v: [8], noH: 1, met: 1, l: "#6f6f6f", ld: "#e6e6e6"},
    Ti: {n: "Titane", m: 47.867, ve: 4, r: [1.36, 1.17, 1.08], w: 2.11, c: "#bfc2c7", g: 4, p: 4, v: [8], noH: 1, met: 1, l: "#727477", ld: "#bfc2c7"},
    V: {n: "Vanadium", m: 50.9415, ve: 5, r: [1.34, 1.12, 1.06], w: 2.07, c: "#a6a6ab", g: 5, p: 4, v: [8], noH: 1, met: 1, l: "#737376", ld: "#a6a6ab"},
    Cr: {n: "Chrome", m: 51.9961, ve: 6, r: [1.22, 1.11, 1.03], w: 2.06, c: "#8a99c7", g: 6, p: 4, v: [8], noH: 1, met: 1, l: "#677294", ld: "#8a99c7"},
    Mn: {n: "Manganèse", m: 54.938, ve: 7, r: [1.19, 1.05, 1.03], w: 2.05, c: "#9c7ac7", g: 7, p: 4, v: [8], noH: 1, met: 1, l: "#8669ac", ld: "#9c7ac7"},
    Fe: {n: "Fer", m: 55.845, ve: 8, r: [1.16, 1.09, 1.02], w: 2.04, c: "#e06633", g: 8, p: 4, v: [8], noH: 1, met: 1, l: "#b45229", ld: "#e06633"},
    Co: {n: "Cobalt", m: 58.9332, ve: 9, r: [1.11, 1.03, 0.96], w: 2.0, c: "#f090a0", g: 9, p: 4, v: [8], noH: 1, met: 1, l: "#9b5d67", ld: "#f090a0"},
    Ni: {n: "Nickel", m: 58.6934, ve: 10, r: [1.1, 1.01, 1.01], w: 1.97, c: "#50d050", g: 10, p: 4, v: [8], noH: 1, met: 1, l: "#338633", ld: "#50d050"},
    Cu: {n: "Cuivre", m: 63.546, ve: 11, r: [1.12, 1.15, 1.2], w: 1.96, c: "#c88033", g: 11, p: 4, v: [8], noH: 1, met: 1, l: "#a06629", ld: "#c88033"},
    Zn: {n: "Zinc", m: 65.38, ve: 12, r: [1.18, 1.2, 1.2], w: 2.01, c: "#7d80b0", g: 12, p: 4, v: [8], noH: 1, met: 1, l: "#6c6e98", ld: "#7d80b0"},
    Ga: {n: "Gallium", m: 69.723, ve: 3, r: [1.24, 1.17, 1.21], w: 1.87, c: "#c28f8f", g: 13, p: 4, v: [8], noH: 1, met: 1, l: "#916a6a", ld: "#c28f8f"},
    Ge: {n: "Germanium", m: 72.63, ve: 4, r: [1.21, 1.11, 1.14], w: 2.11, c: "#668f8f", g: 14, p: 4, v: [4], l: "#587b7b", ld: "#668f8f"},
    As: {n: "Arsenic", m: 74.9216, ve: 5, r: [1.21, 1.14, 1.06], w: 1.85, c: "#bd80e3", g: 15, p: 4, v: [3, 5], l: "#8d5fa9", ld: "#bd80e3"},
    Se: {n: "Sélénium", m: 78.971, ve: 6, r: [1.16, 1.07, 1.07], w: 1.9, c: "#ffa100", g: 16, p: 4, v: [2, 4, 6], l: "#a46800", ld: "#ffa100"},
    Br: {n: "Brome", m: 79.904, ve: 7, r: [1.14, 1.09, 1.1], w: 1.85, c: "#a62929", g: 17, p: 4, v: [1, 3, 5, 7], l: "#8b2323"},
    Kr: {n: "Krypton", m: 83.798, ve: 8, r: [1.17, 1.21, 1.08], w: 2.02, c: "#5cb8d1", g: 18, p: 4, v: [0, 2, 4, 6, 8], noH: 1, l: "#3b7787", ld: "#5cb8d1"},
    Rb: {n: "Rubidium", m: 85.4678, ve: 1, r: [2.1, 2.02, 2.02], w: 3.03, c: "#702eb0", g: 1, p: 5, v: [8], noH: 1, met: 1, l: "#702eb0", ld: "#9d70c9"},
    Sr: {n: "Strontium", m: 87.62, ve: 2, r: [1.85, 1.57, 1.39], w: 2.49, c: "#00ff00", g: 2, p: 5, v: [8], noH: 1, met: 1, l: "#008400", ld: "#00ff00"},
    Y: {n: "Yttrium", m: 88.9058, ve: 3, r: [1.63, 1.3, 1.24], w: 2.32, c: "#94ffff", g: 3, p: 5, v: [8], noH: 1, met: 1, l: "#477b7b", ld: "#94ffff"},
    Zr: {n: "Zirconium", m: 91.224, ve: 4, r: [1.54, 1.27, 1.21], w: 2.23, c: "#94e0e0", g: 4, p: 5, v: [8], noH: 1, met: 1, l: "#527d7d", ld: "#94e0e0"},
    Nb: {n: "Niobium", m: 92.9064, ve: 5, r: [1.47, 1.25, 1.16], w: 2.18, c: "#73c2c9", g: 5, p: 5, v: [8], noH: 1, met: 1, l: "#4a7d82", ld: "#73c2c9"},
    Mo: {n: "Molybdène", m: 95.95, ve: 6, r: [1.38, 1.21, 1.13], w: 2.17, c: "#54b5b5", g: 6, p: 5, v: [8], noH: 1, met: 1, l: "#3a7d7d", ld: "#54b5b5"},
    Tc: {n: "Technétium", m: 97.9072, ve: 7, r: [1.28, 1.2, 1.1], w: 2.16, c: "#3b9e9e", g: 7, p: 5, v: [8], noH: 1, met: 1, l: "#2f7f7f", ld: "#3b9e9e"},
    Ru: {n: "Ruthénium", m: 101.07, ve: 8, r: [1.25, 1.14, 1.03], w: 2.13, c: "#248f8f", g: 8, p: 5, v: [8], noH: 1, met: 1, l: "#1f7b7b", ld: "#248f8f"},
    Rh: {n: "Rhodium", m: 102.9055, ve: 9, r: [1.25, 1.1, 1.06], w: 2.1, c: "#0a7d8c", g: 9, p: 5, v: [8], noH: 1, met: 1, l: "#0a7d8c", ld: "#31919e"},
    Pd: {n: "Palladium", m: 106.42, ve: 10, r: [1.2, 1.17, 1.12], w: 2.1, c: "#006985", g: 10, p: 5, v: [8], noH: 1, met: 1, l: "#006985", ld: "#3d8da2"},
    Ag: {n: "Argent", m: 107.8682, ve: 11, r: [1.28, 1.39, 1.37], w: 2.11, c: "#c0c0c0", g: 11, p: 5, v: [8], noH: 1, met: 1, l: "#737373", ld: "#c0c0c0"},
    Cd: {n: "Cadmium", m: 112.414, ve: 12, r: [1.36, 1.44, 1.44], w: 2.18, c: "#ffd98f", g: 12, p: 5, v: [8], noH: 1, met: 1, l: "#84704a", ld: "#ffd98f"},
    In: {n: "Indium", m: 114.818, ve: 3, r: [1.42, 1.36, 1.46], w: 1.93, c: "#a67573", g: 13, p: 5, v: [8], noH: 1, met: 1, l: "#8f6563", ld: "#a67573"},
    Sn: {n: "Étain", m: 118.71, ve: 4, r: [1.4, 1.3, 1.32], w: 2.17, c: "#668080", g: 14, p: 5, v: [8], noH: 1, met: 1, l: "#5e7777", ld: "#728a8a"},
    Sb: {n: "Antimoine", m: 121.76, ve: 5, r: [1.4, 1.33, 1.27], w: 2.06, c: "#9e63b5", g: 15, p: 5, v: [3, 5], l: "#925ca8", ld: "#a56fba"},
    Te: {n: "Tellure", m: 127.6, ve: 6, r: [1.36, 1.28, 1.21], w: 2.06, c: "#d47a00", g: 16, p: 5, v: [2, 4, 6], l: "#aa6200", ld: "#d47a00"},
    I: {n: "Iode", m: 126.904, ve: 7, r: [1.33, 1.29, 1.25], w: 1.98, c: "#940094", g: 17, p: 5, v: [1, 3, 5, 7], l: "#7a007a"},
    Xe: {n: "Xénon", m: 131.293, ve: 8, r: [1.31, 1.35, 1.22], w: 2.16, c: "#429eb0", g: 18, p: 5, v: [0, 2, 4, 6, 8], noH: 1, l: "#357f8d", ld: "#429eb0"},
    Cs: {n: "Césium", m: 132.9055, ve: 1, r: [2.32, 2.09, 2.09], w: 3.43, c: "#57178f", g: 1, p: 6, v: [8], noH: 1, met: 1, l: "#57178f", ld: "#9a73bb"},
    Ba: {n: "Baryum", m: 137.327, ve: 2, r: [1.96, 1.61, 1.49], w: 2.68, c: "#00c900", g: 2, p: 6, v: [8], noH: 1, met: 1, l: "#008200", ld: "#00c900"},
    La: {n: "Lanthane", m: 138.9055, ve: 3, r: [1.8, 1.39, 1.39], w: 2.43, c: "#70d4ff", g: 3, p: 6, v: [8], noH: 1, met: 1, l: "#3e768e", ld: "#70d4ff"},
    Ce: {n: "Cérium", m: 140.116, ve: 3, r: [1.63, 1.37, 1.31], w: 2.42, c: "#ffffc7", g: 0, p: 6, v: [8], noH: 1, met: 1, l: "#727259", ld: "#ffffc7"},
    Pr: {n: "Praséodyme", m: 140.9077, ve: 3, r: [1.76, 1.38, 1.28], w: 2.4, c: "#d9ffc7", g: 0, p: 6, v: [8], noH: 1, met: 1, l: "#697b60", ld: "#d9ffc7"},
    Nd: {n: "Néodyme", m: 144.242, ve: 3, r: [1.74, 1.37, 1.37], w: 2.39, c: "#c7ffc7", g: 0, p: 6, v: [8], noH: 1, met: 1, l: "#607b60", ld: "#c7ffc7"},
    Pm: {n: "Prométhium", m: 144.9128, ve: 3, r: [1.73, 1.35, 1.35], w: 2.38, c: "#a3ffc7", g: 0, p: 6, v: [8], noH: 1, met: 1, l: "#4e7b60", ld: "#a3ffc7"},
    Sm: {n: "Samarium", m: 150.36, ve: 3, r: [1.72, 1.34, 1.34], w: 2.36, c: "#8fffc7", g: 0, p: 6, v: [8], noH: 1, met: 1, l: "#457b60", ld: "#8fffc7"},
    Eu: {n: "Europium", m: 151.964, ve: 3, r: [1.68, 1.34, 1.34], w: 2.35, c: "#61ffc7", g: 0, p: 6, v: [8], noH: 1, met: 1, l: "#328467", ld: "#61ffc7"},
    Gd: {n: "Gadolinium", m: 157.25, ve: 3, r: [1.69, 1.35, 1.32], w: 2.34, c: "#45ffc7", g: 0, p: 6, v: [8], noH: 1, met: 1, l: "#238467", ld: "#45ffc7"},
    Tb: {n: "Terbium", m: 158.9254, ve: 3, r: [1.68, 1.35, 1.35], w: 2.33, c: "#30ffc7", g: 0, p: 6, v: [8], noH: 1, met: 1, l: "#188467", ld: "#30ffc7"},
    Dy: {n: "Dysprosium", m: 162.5, ve: 3, r: [1.67, 1.33, 1.33], w: 2.31, c: "#1fffc7", g: 0, p: 6, v: [8], noH: 1, met: 1, l: "#108467", ld: "#1fffc7"},
    Ho: {n: "Holmium", m: 164.9303, ve: 3, r: [1.66, 1.33, 1.33], w: 2.3, c: "#00ff9c", g: 0, p: 6, v: [8], noH: 1, met: 1, l: "#008451", ld: "#00ff9c"},
    Er: {n: "Erbium", m: 167.259, ve: 3, r: [1.65, 1.33, 1.33], w: 2.29, c: "#00e675", g: 0, p: 6, v: [8], noH: 1, met: 1, l: "#008041", ld: "#00e675"},
    Tm: {n: "Thulium", m: 168.9342, ve: 3, r: [1.64, 1.31, 1.31], w: 2.27, c: "#00d452", g: 0, p: 6, v: [8], noH: 1, met: 1, l: "#008935", ld: "#00d452"},
    Yb: {n: "Ytterbium", m: 173.045, ve: 3, r: [1.7, 1.29, 1.29], w: 2.26, c: "#00bf38", g: 0, p: 6, v: [8], noH: 1, met: 1, l: "#008426", ld: "#00bf38"},
    Lu: {n: "Lutécium", m: 174.9668, ve: 3, r: [1.62, 1.31, 1.31], w: 2.24, c: "#00ab24", g: 0, p: 6, v: [8], noH: 1, met: 1, l: "#00891c", ld: "#00ab24"},
    Hf: {n: "Hafnium", m: 178.49, ve: 4, r: [1.52, 1.28, 1.22], w: 2.23, c: "#4dc2ff", g: 4, p: 6, v: [8], noH: 1, met: 1, l: "#317da4", ld: "#4dc2ff"},
    Ta: {n: "Tantale", m: 180.9479, ve: 5, r: [1.46, 1.26, 1.19], w: 2.22, c: "#4da6ff", g: 5, p: 6, v: [8], noH: 1, met: 1, l: "#3573b1", ld: "#4da6ff"},
    W: {n: "Tungstène", m: 183.84, ve: 6, r: [1.37, 1.2, 1.15], w: 2.18, c: "#2194d6", g: 6, p: 6, v: [8], noH: 1, met: 1, l: "#1a77ac", ld: "#2194d6"},
    Re: {n: "Rhénium", m: 186.207, ve: 7, r: [1.31, 1.19, 1.1], w: 2.16, c: "#267dab", g: 7, p: 6, v: [8], noH: 1, met: 1, l: "#267dab", ld: "#408cb5"},
    Os: {n: "Osmium", m: 190.23, ve: 8, r: [1.29, 1.16, 1.09], w: 2.16, c: "#266696", g: 8, p: 6, v: [8], noH: 1, met: 1, l: "#266696", ld: "#5a8aaf"},
    Ir: {n: "Iridium", m: 192.217, ve: 9, r: [1.22, 1.15, 1.07], w: 2.13, c: "#175487", g: 9, p: 6, v: [8], noH: 1, met: 1, l: "#175487", ld: "#618aad"},
    Pt: {n: "Platine", m: 195.084, ve: 10, r: [1.23, 1.12, 1.1], w: 2.13, c: "#d0d0e0", g: 10, p: 6, v: [8], noH: 1, met: 1, l: "#74747d", ld: "#d0d0e0"},
    Au: {n: "Or", m: 196.9666, ve: 11, r: [1.24, 1.21, 1.23], w: 2.14, c: "#ffd123", g: 11, p: 6, v: [8], noH: 1, met: 1, l: "#8e7413", ld: "#ffd123"},
    Hg: {n: "Mercure", m: 200.592, ve: 12, r: [1.33, 1.42, 1.42], w: 2.23, c: "#b8b8d0", g: 12, p: 6, v: [8], noH: 1, met: 1, l: "#6e6e7d", ld: "#b8b8d0"},
    Tl: {n: "Thallium", m: 204.38, ve: 3, r: [1.44, 1.42, 1.5], w: 1.96, c: "#a6544d", g: 13, p: 6, v: [8], noH: 1, met: 1, l: "#a6544d", ld: "#b46f69"},
    Pb: {n: "Plomb", m: 207.2, ve: 4, r: [1.44, 1.35, 1.37], w: 2.02, c: "#575961", g: 14, p: 6, v: [8], noH: 1, met: 1, l: "#575961", ld: "#86878d"},
    Bi: {n: "Bismuth", m: 208.9804, ve: 5, r: [1.51, 1.41, 1.35], w: 2.07, c: "#9e4fb5", g: 15, p: 6, v: [8], noH: 1, met: 1, l: "#9e4fb5", ld: "#ad6bc0"},
    Po: {n: "Polonium", m: 209.0, ve: 6, r: [1.45, 1.35, 1.29], w: 1.97, c: "#ab5c00", g: 16, p: 6, v: [8], noH: 1, met: 1, l: "#ab5c00", ld: "#b87628"},
    At: {n: "Astate", m: 210.0, ve: 7, r: [1.47, 1.38, 1.38], w: 2.02, c: "#754f45", g: 17, p: 6, v: [1], l: "#754f45", ld: "#9b8079"},
    Rn: {n: "Radon", m: 222.0, ve: 8, r: [1.42, 1.45, 1.33], w: 2.2, c: "#428296", g: 18, p: 6, v: [0, 2, 4, 6, 8], noH: 1, l: "#3d788b", ld: "#518c9e"},
    Fr: {n: "Francium", m: 223.0, ve: 1, r: [2.23, 2.18, 2.18], w: 3.48, c: "#420066", g: 1, p: 7, v: [8], noH: 1, met: 1, l: "#420066", ld: "#9c7aaf"},
    Ra: {n: "Radium", m: 226.0, ve: 2, r: [2.01, 1.73, 1.59], w: 2.83, c: "#007d00", g: 2, p: 7, v: [8], noH: 1, met: 1, l: "#007d00", ld: "#339733"},
    Ac: {n: "Actinium", m: 227.0, ve: 3, r: [1.86, 1.53, 1.4], w: 2.47, c: "#70abfa", g: 3, p: 7, v: [8], noH: 1, met: 1, l: "#4d76ad", ld: "#70abfa"},
    Th: {n: "Thorium", m: 232.0377, ve: 3, r: [1.75, 1.43, 1.36], w: 2.45, c: "#00baff", g: 0, p: 7, v: [8], noH: 1, met: 1, l: "#0078a4", ld: "#00baff"},
    Pa: {n: "Protactinium", m: 231.0359, ve: 3, r: [1.69, 1.38, 1.29], w: 2.43, c: "#00a1ff", g: 0, p: 7, v: [8], noH: 1, met: 1, l: "#0078be", ld: "#00a1ff"},
    U: {n: "Uranium", m: 238.0289, ve: 3, r: [1.7, 1.34, 1.18], w: 2.41, c: "#008fff", g: 0, p: 7, v: [8], noH: 1, met: 1, l: "#0073cd", ld: "#008fff"},
    Np: {n: "Neptunium", m: 237.0, ve: 3, r: [1.71, 1.36, 1.16], w: 2.39, c: "#0080ff", g: 0, p: 7, v: [8], noH: 1, met: 1, l: "#006edc", ld: "#0080ff"},
    Pu: {n: "Plutonium", m: 244.0, ve: 3, r: [1.72, 1.35, 1.35], w: 2.43, c: "#006bff", g: 0, p: 7, v: [8], noH: 1, met: 1, l: "#006bff", ld: "#2882ff"},
    Am: {n: "Américium", m: 243.0, ve: 3, r: [1.66, 1.35, 1.35], w: 2.44, c: "#545cf2", g: 0, p: 7, v: [8], noH: 1, met: 1, l: "#545cf2", ld: "#6f76f4"},
    Cm: {n: "Curium", m: 247.0, ve: 3, r: [1.66, 1.36, 1.36], w: 2.45, c: "#785ce3", g: 0, p: 7, v: [8], noH: 1, met: 1, l: "#785ce3", ld: "#886fe6"},
    Bk: {n: "Berkélium", m: 247.0, ve: 3, r: [1.68, 1.39, 1.39], w: 2.44, c: "#8a4fe3", g: 0, p: 7, v: [8], noH: 1, met: 1, l: "#8a4fe3", ld: "#9c6be7"},
    Cf: {n: "Californium", m: 251.0, ve: 3, r: [1.68, 1.4, 1.4], w: 2.45, c: "#a136d4", g: 0, p: 7, v: [8], noH: 1, met: 1, l: "#a136d4", ld: "#b35edc"},
    Es: {n: "Einsteinium", m: 252.0, ve: 3, r: [1.65, 1.4, 1.4], w: 2.45, c: "#b31fd4", g: 0, p: 7, v: [8], noH: 1, met: 1, l: "#b31fd4", ld: "#c554de"},
    Fm: {n: "Fermium", m: 257.0, ve: 3, r: [1.67, 1.67, 1.67], w: 2.45, c: "#b31fba", g: 0, p: 7, v: [8], noH: 1, met: 1, l: "#b31fba", ld: "#c554ca"},
    Md: {n: "Mendélévium", m: 258.0, ve: 3, r: [1.73, 1.39, 1.39], w: 2.46, c: "#b30da6", g: 0, p: 7, v: [8], noH: 1, met: 1, l: "#b30da6", ld: "#cb5ac2"},
    No: {n: "Nobélium", m: 259.0, ve: 3, r: [1.76, 1.76, 1.76], w: 2.46, c: "#bd0d87", g: 0, p: 7, v: [8], noH: 1, met: 1, l: "#bd0d87", ld: "#d25aad"},
    Lr: {n: "Lawrencium", m: 262.0, ve: 3, r: [1.61, 1.41, 1.41], w: 2.46, c: "#c70066", g: 0, p: 7, v: [8], noH: 1, met: 1, l: "#c70066", ld: "#d85196"},
    Rf: {n: "Rutherfordium", m: 267.0, ve: 4, r: [1.57, 1.4, 1.31], w: 2.0, c: "#cc0059", g: 4, p: 7, v: [8], noH: 1, met: 1, l: "#cc0059", ld: "#dc518e"},
    Db: {n: "Dubnium", m: 268.0, ve: 5, r: [1.49, 1.36, 1.26], w: 2.0, c: "#d1004f", g: 5, p: 7, v: [8], noH: 1, met: 1, l: "#d1004f", ld: "#df5187"},
    Sg: {n: "Seaborgium", m: 271.0, ve: 6, r: [1.43, 1.28, 1.21], w: 2.0, c: "#d90045", g: 6, p: 7, v: [8], noH: 1, met: 1, l: "#d90045", ld: "#e34779"},
    Bh: {n: "Bohrium", m: 274.0, ve: 7, r: [1.41, 1.28, 1.19], w: 2.0, c: "#e00038", g: 7, p: 7, v: [8], noH: 1, met: 1, l: "#e00038", ld: "#e8476f"},
    Hs: {n: "Hassium", m: 269.0, ve: 8, r: [1.34, 1.25, 1.18], w: 2.0, c: "#e6002e", g: 8, p: 7, v: [8], noH: 1, met: 1, l: "#e6002e", ld: "#ec3d60"},
    Mt: {n: "Meitnérium", m: 276.0, ve: 9, r: [1.29, 1.25, 1.13], w: 2.0, c: "#eb0026", g: 9, p: 7, v: [8], noH: 1, met: 1, l: "#eb0026", ld: "#ef3d5a"},
    Ds: {n: "Darmstadtium", m: 281.0, ve: 10, r: [1.28, 1.16, 1.18], w: 2.0, c: "#ff1493", g: 10, p: 7, v: [8], noH: 1, met: 1, l: "#dc117f", ld: "#ff1493"},
    Rg: {n: "Roentgenium", m: 281.0, ve: 11, r: [1.21, 1.16, 1.18], w: 2.0, c: "#ff1493", g: 11, p: 7, v: [8], noH: 1, met: 1, l: "#dc117f", ld: "#ff1493"},
    Cn: {n: "Copernicium", m: 285.0, ve: 12, r: [1.22, 1.37, 1.3], w: 2.0, c: "#ff1493", g: 12, p: 7, v: [8], noH: 1, met: 1, l: "#dc117f", ld: "#ff1493"},
    Nh: {n: "Nihonium", m: 286.0, ve: 3, r: [1.36, 1.36, 1.36], w: 2.0, c: "#ff1493", g: 13, p: 7, v: [8], noH: 1, met: 1, l: "#dc117f", ld: "#ff1493"},
    Fl: {n: "Flérovium", m: 289.0, ve: 4, r: [1.43, 1.43, 1.43], w: 2.0, c: "#ff1493", g: 14, p: 7, v: [8], noH: 1, met: 1, l: "#dc117f", ld: "#ff1493"},
    Mc: {n: "Moscovium", m: 288.0, ve: 5, r: [1.62, 1.62, 1.62], w: 2.0, c: "#ff1493", g: 15, p: 7, v: [8], noH: 1, met: 1, l: "#dc117f", ld: "#ff1493"},
    Lv: {n: "Livermorium", m: 293.0, ve: 6, r: [1.75, 1.75, 1.75], w: 2.0, c: "#ff1493", g: 16, p: 7, v: [8], noH: 1, met: 1, l: "#dc117f", ld: "#ff1493"},
    Ts: {n: "Tennesse", m: 294.0, ve: 7, r: [1.65, 1.65, 1.65], w: 2.0, c: "#ff1493", g: 17, p: 7, v: [8], noH: 1, met: 1, l: "#dc117f", ld: "#ff1493"},
    Og: {n: "Oganesson", m: 294.0, ve: 8, r: [1.57, 1.57, 1.57], w: 2.0, c: "#ff1493", g: 18, p: 7, v: [0, 2, 4, 6, 8], noH: 1, l: "#dc117f", ld: "#ff1493"}
  };
  const ORGANIC = new Set(['B', 'C', 'N', 'O', 'P', 'S', 'F', 'Cl', 'Br', 'I']);
  const el = (s) => EL[s] || EL.C;
  const normEl = (s) => { s = String(s || '').trim(); if (!s) return 'C'; if (s === 'D' || s === 'T') return 'H'; const t = s[0].toUpperCase() + s.slice(1).toLowerCase(); return EL[t] ? t : (EL[s[0].toUpperCase()] ? s[0].toUpperCase() : t); };
  const SYMBOLS = Object.keys(EL);
  // charge formelle (chg) et nombre d'hydrogènes fixé à l'import (hx = [nombre, somme des liaisons, élément, charge])
  const extra = (a) => { const o = {}; if (a && a.chg) o.chg = a.chg | 0; if (a && Array.isArray(a.hx)) o.hx = a.hx.slice(); return o; };
  const chargeTxt = (q) => { q = q | 0; return !q ? '' : (Math.abs(q) > 1 ? Math.abs(q) : '') + (q > 0 ? '+' : '−'); };
  // valences permises compte tenu de la charge (règle isoélectronique : N⁺ comme C, O⁻ comme F, B⁻ comme C…)
  function valList(a) {
    const e = EL[a.el]; if (!e) return [4];
    const q = a.chg | 0; if (!q || e.noH) return e.v;
    if (a.el === 'H') return [0];
    const ev = e.ve - q, base = ev <= 4 ? ev : 8 - ev;
    if (base < 0) return [0];
    const out = [base], mx = Math.max(...e.v);
    if (e.v.length > 1) for (let v = base + 2; v <= mx; v += 2) out.push(v);
    return out;
  }

  // ---------- Utilitaires ----------
  const key = (a, b) => (a < b ? a + '-' + b : b + '-' + a);
  const fr = (x, d = 2) => Number(x).toFixed(d).replace('.', ',');
  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hashStr(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
  const clone = (m) => ({ name: m.name, atoms: m.atoms.map((a) => ({ ...a })), bonds: m.bonds.map((b) => ({ ...b })) });

  // vecteurs
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a) => Math.hypot(a[0], a[1], a[2]);
  const unit = (a) => { const n = norm(a) || 1; return [a[0] / n, a[1] / n, a[2] / n]; };
  const P3 = (a) => [a.x, a.y, a.z || 0];
  function dist(p, q) { return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); }
  function cosAngle(a, b, c) { const u = sub(a, b), v = sub(c, b); const nu = norm(u), nv = norm(v); if (!nu || !nv) return 1; return Math.max(-1, Math.min(1, dot(u, v) / (nu * nv))); }
  function angleDeg(a, b, c) { return Math.acos(cosAngle(a, b, c)) * 180 / Math.PI; }
  function dihedral(p0, p1, p2, p3) {
    const b0 = sub(p0, p1), b1 = unit(sub(p2, p1)), b2 = sub(p3, p2);
    const v = sub(b0, mul(b1, dot(b0, b1))), w = sub(b2, mul(b1, dot(b2, b1)));
    const x = dot(v, w), y = dot(cross(b1, v), w);
    return Math.atan2(y, x);
  }

  // ---------- Graphe moléculaire ----------
  // Molécule : { name, atoms:[{el,x,y,z}], bonds:[{a,b,o}] } — o = 1, 2, 3 ou 1.5 (aromatique)
  function adjacency(m) {
    const adj = m.atoms.map(() => []);
    m.bonds.forEach((b, k) => { if (adj[b.a] && adj[b.b]) { adj[b.a].push({ j: b.b, o: b.o, k }); adj[b.b].push({ j: b.a, o: b.o, k }); } });
    return adj;
  }
  const bondSum = (adj, i) => adj[i].reduce((s, x) => s + x.o, 0);
  function implicitH(m, adj, i) {
    const a = m.atoms[i]; if (!EL[a.el] || a.el === 'H' || a.explicitOnly) return 0;
    const s = Math.round(bondSum(adj, i));
    if (Array.isArray(a.hx) && a.hx[1] === s && a.hx[2] === a.el && (a.hx[3] | 0) === (a.chg | 0)) return a.hx[0];
    if (EL[a.el].noH) return 0;
    for (const v of valList(a)) if (v >= s) return v - s;
    return 0;
  }
  // hydrogènes « standard » (sans charge ni nombre imposé) — sert à décider des crochets en SMILES
  function stdH(m, adj, i) { const a = m.atoms[i], e = EL[a.el]; if (!e || a.el === 'H' || e.noH) return 0; const s = Math.round(bondSum(adj, i)); for (const v of e.v) if (v >= s) return v - s; return 0; }
  function overValent(m, adj, i) { const a = m.atoms[i], e = EL[a.el]; if (!e) return false; if (Array.isArray(a.hx) && a.hx[1] === Math.round(bondSum(adj, i))) return false; return bondSum(adj, i) > Math.max(...valList(a)) + 1e-6; }
  const totalCharge = (m) => m.atoms.reduce((s, a) => s + (a.chg | 0), 0);
  function hCount(m, adj, i) { return implicitH(m, adj, i) + adj[i].filter((x) => m.atoms[x.j].el === 'H').length; }

  function counts(m, implicit = true) {
    const adj = adjacency(m), c = {};
    m.atoms.forEach((a, i) => { c[a.el] = (c[a.el] || 0) + 1; if (implicit) { const h = implicitH(m, adj, i); if (h) c.H = (c.H || 0) + h; } });
    return c;
  }
  function hill(c) {
    const ks = Object.keys(c).filter((k) => c[k] > 0); let order;
    if (c.C) { order = ['C']; if (c.H) order.push('H'); order = order.concat(ks.filter((k) => k !== 'C' && k !== 'H').sort()); }
    else order = ks.sort();
    return order.map((k) => ({ el: k, n: c[k] }));
  }
  const formulaText = (c) => hill(c).map((x) => x.el + (x.n > 1 ? x.n : '')).join('');
  const formulaHTML = (c) => hill(c).map((x) => x.el + (x.n > 1 ? '<sub>' + x.n + '</sub>' : '')).join('') || '—';
  const molarMass = (c) => Object.entries(c).reduce((s, [k, n]) => s + (EL[k] ? EL[k].m : 0) * n, 0);
  function parseFormula(s) { const c = {}; String(s).replace(/([A-Z][a-z]?)(\d*)/g, (_, e, n) => { c[e] = (c[e] || 0) + (n ? +n : 1); }); return c; }
  function sameCounts(a, b) { const ka = Object.keys(a).filter((k) => a[k]), kb = Object.keys(b).filter((k) => b[k]); return ka.length === kb.length && ka.every((k) => a[k] === b[k]); }

  // chemin le plus court entre a et b sans emprunter la liaison directe (détection de cycle)
  function ringPath(adj, a, b, maxLen = 8) {
    const prev = new Map([[a, -1]]); let frontier = [a];
    for (let d = 0; d < maxLen && frontier.length; d++) {
      const nx = [];
      for (const u of frontier) for (const x of adj[u]) {
        if (u === a && x.j === b) continue;
        if (prev.has(x.j)) continue;
        prev.set(x.j, u);
        if (x.j === b) { const p = [b]; let v = u; while (v !== -1) { p.push(v); v = prev.get(v); } return p.reverse(); }
        nx.push(x.j);
      }
      frontier = nx;
    }
    return null;
  }
  // perception des cycles aromatiques à 6 (alternance 1/2) → ordre 1.5
  function aromatize(m) {
    const c = clone(m), adj = adjacency(c);
    c.bonds.forEach((b) => {
      if (b.o !== 2) return;
      const p = ringPath(adj, b.a, b.b, 6); if (!p || p.length !== 6) return;
      const ids = []; let alt = true;
      for (let i = 0; i < 6; i++) {
        const u = p[i], v = p[(i + 1) % 6]; const x = adj[u].find((y) => y.j === v); if (!x) { alt = false; break; }
        ids.push(x.k);
      }
      if (!alt) return;
      const ords = ids.map((k) => c.bonds[k].o);
      const ok = ords.every((o, i) => o === 1.5 || ords[(i + 1) % 6] === 1.5 || (o === 2) !== (ords[(i + 1) % 6] === 2)) && p.every((i) => ['C', 'N'].includes(c.atoms[i].el));
      if (ok) ids.forEach((k) => { c.bonds[k].o = 1.5; });
    });
    return c;
  }
  // empreinte de structure (invariant de graphe, type Morgan) — sert à reconnaître une molécule dessinée
  function signature(m) {
    const a = aromatize(m), adj = adjacency(a);
    const heavy = a.atoms.map((x, i) => i).filter((i) => a.atoms[i].el !== 'H');
    if (!heavy.length) return 'H' + a.atoms.length;
    let inv = {};
    heavy.forEach((i) => { inv[i] = a.atoms[i].el + ':' + hCount(a, adj, i) + ':' + (a.atoms[i].chg | 0); });
    for (let it = 0; it < 4; it++) {
      const nx = {};
      heavy.forEach((i) => { nx[i] = hashStr(inv[i] + '|' + adj[i].filter((x) => a.atoms[x.j].el !== 'H').map((x) => x.o + '~' + inv[x.j]).sort().join(';')); });
      inv = nx;
    }
    return heavy.map((i) => inv[i]).sort().join('.');
  }

  // ---------- Formats de fichiers ----------
  const padL = (s, n) => String(s).padStart(n), padR = (s, n) => String(s).padEnd(n);
  function toMolfile(m, opt = {}) {
    const d = new Date(), p2 = (x) => String(x).padStart(2, '0');
    const stamp = p2(d.getMonth() + 1) + p2(d.getDate()) + String(d.getFullYear()).slice(2) + p2(d.getHours()) + p2(d.getMinutes());
    const L = [String(opt.name || m.name || 'molecule').replace(/[^\x20-\x7E]/g, (c) => c.normalize('NFD').replace(/[̀-ͯ]/g, '')).slice(0, 78),
      '  CSAAPP  ' + stamp + (opt.d3 ? '3D' : '2D'),
      'Exporte depuis la plateforme INFOCHIMIE UK'];
    L.push(padL(m.atoms.length, 3) + padL(m.bonds.length, 3) + '  0  0  0  0  0  0  0  0999 V2000');
    m.atoms.forEach((a) => L.push(padL(a.x.toFixed(4), 10) + padL(a.y.toFixed(4), 10) + padL((a.z || 0).toFixed(4), 10) + ' ' + padR(a.el, 3) + ' 0  0  0  0  0  0  0  0  0  0  0  0'));
    m.bonds.forEach((b) => L.push(padL(b.a + 1, 3) + padL(b.b + 1, 3) + padL(b.o === 1.5 ? 4 : b.o, 3) + '  0  0  0  0'));
    const ch = m.atoms.map((a, i) => [i + 1, a.chg | 0]).filter((x) => x[1]);
    for (let k = 0; k < ch.length; k += 8) { const part = ch.slice(k, k + 8); L.push('M  CHG' + padL(part.length, 3) + part.map(([i, q]) => padL(i, 4) + padL(q, 4)).join('')); }
    L.push('M  END');
    return L.join('\n') + '\n';
  }
  function parseMolfile(text) {
    text = String(text).split('$$$$')[0];
    if (/V3000/.test(text)) throw new Error('Le format MOL V3000 n’est pas pris en charge : enregistrez en MOL V2000.');
    const L = text.replace(/\r/g, '').split('\n');
    let ci = L.findIndex((l) => /V2000/.test(l)); if (ci < 0) ci = 3;
    const cl = L[ci] || '';
    let na = parseInt(cl.slice(0, 3), 10), nb = parseInt(cl.slice(3, 6), 10);
    if (isNaN(na)) { const p = cl.trim().split(/\s+/); na = +p[0]; nb = +p[1]; }
    if (!(na > 0)) throw new Error('Fichier MOL illisible : nombre d’atomes introuvable.');
    const atoms = [], bonds = [];
    for (let k = 0; k < na; k++) {
      const l = L[ci + 1 + k] || ''; let x = parseFloat(l.slice(0, 10)), y = parseFloat(l.slice(10, 20)), z = parseFloat(l.slice(20, 30)), e = l.slice(31, 34).trim();
      let cc = parseInt(l.slice(36, 39), 10);
      if (isNaN(x) || !e) { const p = l.trim().split(/\s+/); x = +p[0]; y = +p[1]; z = +p[2]; e = p[3]; cc = +p[5] || 0; }
      const at = { el: normEl(e), x, y, z: z || 0 }; const q = { 1: 3, 2: 2, 3: 1, 5: -1, 6: -2, 7: -3 }[cc]; if (q) at.chg = q;
      atoms.push(at);
    }
    for (let k = 0; k < nb; k++) {
      const l = L[ci + 1 + na + k] || ''; let a = parseInt(l.slice(0, 3), 10), b = parseInt(l.slice(3, 6), 10), o = parseInt(l.slice(6, 9), 10);
      if (isNaN(a) || isNaN(b)) { const p = l.trim().split(/\s+/); a = +p[0]; b = +p[1]; o = +p[2]; }
      if (a > 0 && b > 0 && a <= na && b <= na) bonds.push({ a: a - 1, b: b - 1, o: o === 4 ? 1.5 : Math.max(1, Math.min(3, o || 1)) });
    }
    // bloc des propriétés : « M  CHG » remplace les charges du bloc des atomes
    const props = L.slice(ci + 1 + na + nb);
    if (props.some((l) => /^M {2}CHG/.test(l))) atoms.forEach((x) => { delete x.chg; });
    props.forEach((l) => {
      if (/^M {2}END/.test(l)) return;
      const mm = l.match(/^M {2}CHG\s*(\d+)(.*)$/); if (!mm) return;
      const v = mm[2].trim().split(/\s+/).map(Number);
      for (let k = 0; k + 1 < v.length; k += 2) { const at = atoms[v[k] - 1]; if (at && v[k + 1]) at.chg = v[k + 1]; }
    });
    return { name: (L[0] || '').trim() || 'molécule importée', atoms, bonds };
  }
  function toXYZ(m, comment) {
    return m.atoms.length + '\n' + String(comment || m.name || 'molecule').replace(/\n/g, ' ') + '\n' +
      m.atoms.map((a) => padR(a.el, 2) + ' ' + padL(a.x.toFixed(6), 12) + ' ' + padL(a.y.toFixed(6), 12) + ' ' + padL((a.z || 0).toFixed(6), 12)).join('\n') + '\n';
  }
  function parseXYZ(text) {
    const L = String(text).replace(/\r/g, '').split('\n'); const n = parseInt(L[0], 10);
    if (!(n > 0)) throw new Error('Fichier XYZ illisible : la première ligne doit contenir le nombre d’atomes.');
    const atoms = [];
    for (let k = 0; k < n; k++) { const p = (L[2 + k] || '').trim().split(/\s+/); if (p.length < 4) throw new Error('Ligne d’atome incomplète (ligne ' + (3 + k) + ').'); atoms.push({ el: normEl(p[0]), x: +p[1], y: +p[2], z: +p[3] }); }
    const m = { name: (L[1] || '').trim() || 'molécule XYZ', atoms, bonds: [] };
    perceiveBonds(m); return m;
  }
  // liaisons déduites des distances, puis ordres multiples attribués aux atomes en déficit de valence
  function perceiveBonds(m) {
    const A = m.atoms, cand = [];
    for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) {
      const d = dist(P3(A[i]), P3(A[j])), r0 = el(A[i].el).r[0] + el(A[j].el).r[0];
      if (d > 0.4 && d < r0 * 1.2) cand.push({ a: i, b: j, o: 1, f: d / r0 });
    }
    m.bonds = cand.map(({ a, b, o }) => ({ a, b, o }));
    const adj = adjacency(m);
    const deficit = A.map((a, i) => (a.el === 'H' ? 0 : Math.min(...el(a.el).v.filter((v) => v >= adj[i].length).concat([99])) - adj[i].length));
    const order = cand.map((c, k) => ({ k, f: c.f })).sort((p, q) => p.f - q.f);
    for (let pass = 0; pass < 2; pass++) order.forEach(({ k }) => { const b = m.bonds[k]; if (deficit[b.a] > 0 && deficit[b.b] > 0 && b.o < 3) { b.o++; deficit[b.a]--; deficit[b.b]--; } });
    return m;
  }
  function toSMILES(m) {
    const N = m.atoms.length, adj = adjacency(m), isH = (i) => m.atoms[i].el === 'H';
    const seen = new Array(N).fill(false), kids = [...Array(N)].map(() => []), used = new Set(), ring = [];
    function dfs(u) { seen[u] = true; for (const x of adj[u]) { if (isH(x.j) || used.has(x.k)) continue; used.add(x.k); if (!seen[x.j]) { kids[u].push({ j: x.j, o: x.o }); dfs(x.j); } else ring.push({ from: u, to: x.j, o: x.o }); } }
    const roots = []; for (let i = 0; i < N; i++) if (!isH(i) && !seen[i]) { roots.push(i); dfs(i); }
    if (!roots.length) return N ? '[H][H]' : '';
    const sym = (o) => (o === 2 ? '=' : o === 3 ? '#' : o === 1.5 ? ':' : '');
    const free = []; let next = 1; const digitOf = new Map();
    const take = () => (free.length ? free.sort((a, b) => a - b).shift() : next++);
    function atomTxt(i) {
      const a = m.atoms[i], h = hCount(m, adj, i), q = a.chg | 0;
      if (!q && ORGANIC.has(a.el) && implicitH(m, adj, i) === stdH(m, adj, i) && !overValent(m, adj, i)) return a.el;
      return '[' + a.el + (h ? 'H' + (h > 1 ? h : '') : '') + (q ? (q > 0 ? '+' : '-') + (Math.abs(q) > 1 ? Math.abs(q) : '') : '') + ']';
    }
    const dtxt = (d) => (d > 9 ? '%' + d : String(d));
    function write(u) {
      let s = atomTxt(u);
      ring.forEach((r, idx) => {
        if (r.to === u) { const d = take(); digitOf.set(idx, d); s += dtxt(d); }
      });
      ring.forEach((r, idx) => {
        if (r.from === u && digitOf.has(idx)) { const d = digitOf.get(idx); s += sym(r.o) + dtxt(d); free.push(d); digitOf.delete(idx); }
      });
      const ks = kids[u];
      ks.forEach((c, n) => { const t = sym(c.o) + write(c.j); s += n < ks.length - 1 ? '(' + t + ')' : t; });
      return s;
    }
    return roots.map(write).join('.');
  }

  // ---------- VSEPR ----------
  const VSEPR = {
    2: ['linéaire', 'linéaire'],
    3: ['trigonale plane', 'coudée'],
    4: ['tétraédrique', 'pyramidale (base triangulaire)', 'coudée'],
    5: ['bipyramide trigonale', 'à bascule', 'en T', 'linéaire'],
    6: ['octaédrique', 'pyramide à base carrée', 'plan carré']
  };
  const IDEAL = { 2: [180], 3: [120, 118], 4: [109.47, 107, 104.5] };
  function vsepr(m, adj, i) {
    const a = m.atoms[i], e = el(a.el), X = adj[i].length, bos = bondSum(adj, i);
    const E = a.el === 'H' || e.met ? 0 : Math.max(0, Math.floor((e.ve - (a.chg | 0) - Math.round(bos)) / 2 + 1e-9));
    const SN = X + E;
    const code = 'AX' + (X > 1 ? X : X === 1 ? '' : '0') + (E ? 'E' + (E > 1 ? E : '') : '');
    let geo = '—';
    if (X >= 2 && VSEPR[SN]) geo = VSEPR[SN][E] || '—';
    else if (X === 1) geo = 'atome terminal';
    const ideal = IDEAL[SN] ? (IDEAL[SN][E] != null ? IDEAL[SN][E] : null) : null;
    return { X, E, SN, code, geo, ideal };
  }

  // ---------- Construction 3D, hydrogènes ----------
  function bondLen(a, b, o) {
    if (o === 1.5) return (bondLen(a, b, 1) + bondLen(a, b, 2)) / 2;
    const i = o >= 3 ? 2 : o >= 2 ? 1 : 0; return el(a).r[i] + el(b).r[i];
  }
  function removeAtoms(m, set) {
    const map = new Map(); const atoms = [];
    m.atoms.forEach((a, i) => { if (!set.has(i)) { map.set(i, atoms.length); atoms.push(a); } });
    m.bonds = m.bonds.filter((b) => !set.has(b.a) && !set.has(b.b)).map((b) => ({ ...b, a: map.get(b.a), b: map.get(b.b) }));
    m.atoms = atoms; return map;
  }
  function freeDir(m, adj, i, rng) {
    const p = P3(m.atoms[i]); let s = [0, 0, 0];
    adj[i].forEach((x) => { s = add(s, unit(sub(P3(m.atoms[x.j]), p))); });
    const r = [rng() - 0.5, rng() - 0.5, rng() - 0.5];
    let d = mul(s, -1); if (norm(d) < 0.3) d = add(d, mul(r, 2)); else d = add(unit(d), mul(r, 0.9));
    return unit(d);
  }
  // ajuste le nombre d'hydrogènes explicites de chaque atome lourd à sa valence
  function adjustHydrogens(m, seed = 11) {
    const rng = mulberry32(seed);
    let adj = adjacency(m); const drop = new Set();
    m.atoms.forEach((a, i) => {
      if (a.el === 'H') return;
      const hs = adj[i].filter((x) => m.atoms[x.j].el === 'H' && adj[x.j].length === 1).map((x) => x.j);
      const heavyBos = adj[i].filter((x) => m.atoms[x.j].el !== 'H').reduce((s, x) => s + x.o, 0) + adj[i].filter((x) => m.atoms[x.j].el === 'H' && adj[x.j].length > 1).length;
      let need = 0;
      if (Array.isArray(a.hx) && a.hx[2] === a.el && a.hx[1] === Math.round(heavyBos)) need = a.hx[0];
      else if (!el(a.el).noH) { for (const v of valList(a)) if (v >= Math.round(heavyBos)) { need = v - Math.round(heavyBos); break; } }
      for (let k = need; k < hs.length; k++) drop.add(hs[k]);
    });
    if (drop.size) removeAtoms(m, drop);
    adj = adjacency(m);
    const n0 = m.atoms.length;
    for (let i = 0; i < n0; i++) {
      if (m.atoms[i].el === 'H') continue;
      let h = implicitH(m, adj, i);
      if (Array.isArray(m.atoms[i].hx)) { delete m.atoms[i].hx; m.atoms[i].explicitOnly = true; }
      while (h-- > 0) {
        const d = freeDir(m, adj, i, rng), p = add(P3(m.atoms[i]), mul(d, bondLen(m.atoms[i].el, 'H', 1)));
        m.atoms.push({ el: 'H', x: p[0], y: p[1], z: p[2] });
        m.bonds.push({ a: i, b: m.atoms.length - 1, o: 1 });
        adj = adjacency(m);
      }
    }
    return m;
  }
  function centroid(m) { const n = m.atoms.length || 1; const s = m.atoms.reduce((s, a) => add(s, P3(a)), [0, 0, 0]); return mul(s, 1 / n); }
  function centerMol(m) { const c = centroid(m); m.atoms.forEach((a) => { a.x -= c[0]; a.y -= c[1]; a.z = (a.z || 0) - c[2]; }); return m; }

  // ---------- Champ de force pédagogique ----------
  // Termes : élongation des liaisons, angles (idéaux VSEPR), torsions (plans des liaisons doubles, décalage sp3),
  // répulsion entre atomes non liés. Gradient numérique, descente à pas adaptatif.
  class ForceField {
    constructor(m) { this.m = m; this.setup(); }
    setup() {
      const m = this.m, n = m.atoms.length, adj = adjacency(m), T = [];
      const info = m.atoms.map((a, i) => vsepr(m, adj, i));
      const s12 = new Set(), s13 = new Set();
      m.bonds.forEach((b) => { s12.add(key(b.a, b.b)); T.push({ t: 'b', i: [b.a, b.b], r0: bondLen(m.atoms[b.a].el, m.atoms[b.b].el, b.o), k: 400 }); });
      for (let j = 0; j < n; j++) {
        const nb = adj[j]; const inf = info[j];
        for (let p = 0; p < nb.length; p++) for (let q = p + 1; q < nb.length; q++) {
          const i = nb[p].j, k = nb[q].j; s13.add(key(i, k));
          if (inf.SN === 2) T.push({ t: 'l', i: [i, j, k], k: 220 });
          else if (inf.ideal != null) T.push({ t: 'a', i: [i, j, k], c0: Math.cos(inf.ideal * Math.PI / 180), k: 140 });
          else T.push({ t: 'r', i: [i, k], k: 25 });
        }
      }
      m.bonds.forEach((b) => {
        const j = b.a, k = b.b, sj = info[j].SN, sk = info[k].SN;
        if (b.o >= 3 || sj <= 2 || sk <= 2) return;
        let type = 0;
        if (b.o === 2 || b.o === 1.5 || (sj === 3 && sk === 3)) type = 2; else if (sj === 4 && sk === 4) type = 3; else return;
        adj[j].forEach((x) => { if (x.j === k) return; adj[k].forEach((y) => { if (y.j === j || y.j === x.j) return; T.push({ t: type === 2 ? 't2' : 't3', i: [x.j, j, k, y.j], k: type === 2 ? 6 : 0.6 }); }); });
      });
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const kk = key(i, j); if (s12.has(kk) || s13.has(kk)) continue;
        T.push({ t: 'n', i: [i, j], d0: 0.75 * (el(m.atoms[i].el).w + el(m.atoms[j].el).w), k: 40 });
      }
      this.T = T; this.by = [...Array(n)].map(() => []);
      T.forEach((t) => { new Set(t.i).forEach((a) => this.by[a].push(t)); });
      this.P = m.atoms.map((a) => [a.x, a.y, a.z || 0]);
      this.step = 0.02;
    }
    termE(t, P) {
      const I = t.i;
      switch (t.t) {
        case 'b': { const d = dist(P[I[0]], P[I[1]]); return t.k * (d - t.r0) * (d - t.r0); }
        case 'a': { const c = cosAngle(P[I[0]], P[I[1]], P[I[2]]); return t.k * (c - t.c0) * (c - t.c0); }
        case 'l': return t.k * (1 + cosAngle(P[I[0]], P[I[1]], P[I[2]]));
        case 'r': return t.k / Math.max(dist(P[I[0]], P[I[1]]), 0.2);
        case 't2': return t.k * (1 - Math.cos(2 * dihedral(P[I[0]], P[I[1]], P[I[2]], P[I[3]])));
        case 't3': return t.k * (1 + Math.cos(3 * dihedral(P[I[0]], P[I[1]], P[I[2]], P[I[3]])));
        case 'n': { const d = dist(P[I[0]], P[I[1]]); return d < t.d0 ? t.k * (t.d0 - d) * (t.d0 - d) : 0; }
      }
      return 0;
    }
    energy(P = this.P) { let e = 0; for (const t of this.T) e += this.termE(t, P); return e; }
    grad(P) {
      const h = 1e-4, G = [];
      for (let a = 0; a < P.length; a++) {
        const g = [0, 0, 0], terms = this.by[a];
        for (let c = 0; c < 3; c++) {
          const v = P[a][c]; let e1 = 0, e2 = 0;
          P[a][c] = v + h; for (const t of terms) e1 += this.termE(t, P);
          P[a][c] = v - h; for (const t of terms) e2 += this.termE(t, P);
          P[a][c] = v; g[c] = (e1 - e2) / (2 * h);
        }
        G.push(g);
      }
      return G;
    }
    iterate(k = 1) {
      const P = this.P; let E0 = this.energy(P), done = false;
      for (let s = 0; s < k; s++) {
        const G = this.grad(P); let gmax = 0; G.forEach((g) => { gmax = Math.max(gmax, norm(g)); });
        if (gmax < 2e-3) { done = true; break; }
        const Q = P.map((p) => p.slice());
        for (let a = 0; a < P.length; a++) {
          let d = mul(G[a], -this.step); const nd = norm(d); if (nd > 0.15) d = mul(d, 0.15 / nd);
          P[a][0] += d[0]; P[a][1] += d[1]; P[a][2] += d[2];
        }
        const E1 = this.energy(P);
        if (E1 <= E0) { E0 = E1; this.step = Math.min(this.step * 1.2, 0.06); }
        else { for (let a = 0; a < P.length; a++) { P[a][0] = Q[a][0]; P[a][1] = Q[a][1]; P[a][2] = Q[a][2]; } this.step *= 0.5; if (this.step < 1e-7) { done = true; break; } }
      }
      this.writeBack(); return { E: E0, done };
    }
    writeBack() { this.m.atoms.forEach((a, i) => { a.x = this.P[i][0]; a.y = this.P[i][1]; a.z = this.P[i][2]; }); }
    optimize(max = 800) { let r; for (let i = 0; i < max; i += 10) { r = this.iterate(10); if (r.done) break; } return r; }
  }

  // 2D (pixels de l'éditeur) → 3D : mise à l'échelle, léger relief aléatoire, hydrogènes, optimisation
  function build3D(m2, opt = {}) {
    const Lpx = opt.L || 48, rng = mulberry32(opt.seed || 7);
    const m = { name: m2.name || 'molécule', atoms: m2.atoms.map((a) => ({ el: a.el, x: a.x / Lpx * 1.45, y: -a.y / Lpx * 1.45, z: (rng() - 0.5) * 0.7, ...extra(a) })), bonds: m2.bonds.map((b) => ({ ...b })) };
    adjustHydrogens(m, opt.seed || 7); centerMol(m);
    if (opt.optimize !== false) { const ff = new ForceField(m); ff.optimize(opt.steps || 900); centerMol(m); }
    return m;
  }
  // 3D → 2D (projection simple, pour importer un fichier dans l'éditeur 2D) : atomes lourds seulement
  function to2D(m3, Lpx = 48) {
    const keep = m3.atoms.map((a, i) => i).filter((i) => m3.atoms[i].el !== 'H' || m3.atoms.filter((x) => x.el !== 'H').length === 0);
    const map = new Map(keep.map((i, k) => [i, k]));
    const atoms = keep.map((i) => ({ el: m3.atoms[i].el, x: m3.atoms[i].x, y: -m3.atoms[i].y, ...extra(m3.atoms[i]) }));
    // hydrogènes explicites retirés : leur nombre est conservé lorsqu'il diffère de la valence usuelle
    if (m3.atoms.some((a) => a.el === 'H') && keep.length < m3.atoms.length) {
      const a2 = adjacency(m3), m2 = { atoms, bonds: [] }; m2.bonds = m3.bonds.filter((b) => map.has(b.a) && map.has(b.b)).map((b) => ({ a: map.get(b.a), b: map.get(b.b), o: b.o }));
      const j2 = adjacency(m2);
      keep.forEach((i, k) => {
        if (m3.atoms[i].el === 'H') return; const nH = a2[i].filter((x) => m3.atoms[x.j].el === 'H').length;
        delete atoms[k].hx; if (implicitH(m2, j2, k) !== nH) atoms[k].hx = [nH, Math.round(bondSum(j2, k)), atoms[k].el, atoms[k].chg | 0];
      });
    }
    const bonds = m3.bonds.filter((b) => map.has(b.a) && map.has(b.b)).map((b) => ({ a: map.get(b.a), b: map.get(b.b), o: b.o }));
    // échelle : longueur de liaison moyenne → Lpx
    const ls = bonds.map((b) => Math.hypot(atoms[b.a].x - atoms[b.b].x, atoms[b.a].y - atoms[b.b].y)).filter((x) => x > 0.2);
    const avg = ls.length ? ls.reduce((s, x) => s + x, 0) / ls.length : 1.5;
    atoms.forEach((a) => { a.x = a.x / avg * Lpx; a.y = a.y / avg * Lpx; });
    return { name: m3.name, atoms, bonds };
  }

  // ---------- Molécules de référence 3D (géométries expérimentales arrondies) ----------
  const D2R = Math.PI / 180;
  function zmat(rows) {
    const P = [];
    rows.forEach((r, n) => {
      const [, a, d, b, ang, c, dih] = r;
      if (n === 0) P.push([0, 0, 0]);
      else if (n === 1) P.push([d, 0, 0]);
      else {
        const A = P[a], B = P[b]; let C = c != null ? P[c] : add(B, [0, 1, 0.3]);
        const bc = unit(sub(A, B)); let nn = cross(sub(B, C), bc); if (norm(nn) < 1e-6) nn = cross([0, 0, 1], bc); nn = unit(nn);
        const mm = cross(nn, bc), th = ang * D2R, ph = (dih || 0) * D2R;
        const d2 = [-d * Math.cos(th), d * Math.sin(th) * Math.cos(ph), d * Math.sin(th) * Math.sin(ph)];
        P.push(add(A, add(mul(bc, d2[0]), add(mul(mm, d2[1]), mul(nn, d2[2])))));
      }
    });
    return rows.map((r, i) => ({ el: r[0], x: P[i][0], y: P[i][1], z: P[i][2] }));
  }
  function mk(name, atoms, bonds) { const m = { name, atoms, bonds: bonds.map(([a, b, o]) => ({ a, b, o: o || 1 })) }; return centerMol(m); }
  const A3 = (e, x, y, z) => ({ el: e, x, y, z });
  function bent(c, l, r, ang) { const h = ang * D2R / 2; return [A3(c, 0, 0, 0), A3(l, r * Math.sin(h), -r * Math.cos(h), 0), A3(l, -r * Math.sin(h), -r * Math.cos(h), 0)]; }
  function pyramid(c, l, r, ang) {
    const ct = Math.sqrt((Math.cos(ang * D2R) + 0.5) / 1.5), st = Math.sqrt(1 - ct * ct);
    return [A3(c, 0, 0, 0)].concat([0, 1, 2].map((k) => A3(l, r * st * Math.cos(k * 2 * Math.PI / 3 + Math.PI / 2), -r * ct, r * st * Math.sin(k * 2 * Math.PI / 3 + Math.PI / 2))));
  }
  function tetra(c, l, r) { const s = r / Math.sqrt(3); return [A3(c, 0, 0, 0), A3(l, s, s, s), A3(l, s, -s, -s), A3(l, -s, s, -s), A3(l, -s, -s, s)]; }
  function trig(c, l, r) { return [A3(c, 0, 0, 0)].concat([0, 1, 2].map((k) => A3(l, r * Math.cos(k * 2 * Math.PI / 3 + Math.PI / 2), r * Math.sin(k * 2 * Math.PI / 3 + Math.PI / 2), 0))); }
  function star(n) { return [...Array(n)].map((_, k) => [0, k + 1, 1]); }

  const REF3D = {
    eau: () => mk('Eau (H₂O)', bent('O', 'H', 0.958, 104.5), star(2)),
    sulfure: () => mk('Sulfure d’hydrogène (H₂S)', bent('S', 'H', 1.336, 92.1), star(2)),
    methane: () => mk('Méthane (CH₄)', tetra('C', 'H', 1.087), star(4)),
    ammoniac: () => mk('Ammoniac (NH₃)', pyramid('N', 'H', 1.012, 106.7), star(3)),
    co2: () => mk('Dioxyde de carbone (CO₂)', [A3('C', 0, 0, 0), A3('O', 1.16, 0, 0), A3('O', -1.16, 0, 0)], [[0, 1, 2], [0, 2, 2]]),
    bf3: () => mk('Trifluorure de bore (BF₃)', trig('B', 'F', 1.307), star(3)),
    methanal: () => mk('Méthanal (H₂CO)', [A3('C', 0, 0, 0), A3('O', 0, 1.205, 0), A3('H', 0.9448, -0.5846, 0), A3('H', -0.9448, -0.5846, 0)], [[0, 1, 2], [0, 2], [0, 3]]),
    ethylene: () => mk('Éthylène (C₂H₄)', [A3('C', 0.6695, 0, 0), A3('C', -0.6695, 0, 0), A3('H', 1.2343, 0.9288, 0), A3('H', 1.2343, -0.9288, 0), A3('H', -1.2343, 0.9288, 0), A3('H', -1.2343, -0.9288, 0)], [[0, 1, 2], [0, 2], [0, 3], [1, 4], [1, 5]]),
    acetylene: () => mk('Acétylène (C₂H₂)', [A3('C', 0.6015, 0, 0), A3('C', -0.6015, 0, 0), A3('H', 1.6645, 0, 0), A3('H', -1.6645, 0, 0)], [[0, 1, 3], [0, 2], [1, 3]]),
    sf6: () => mk('Hexafluorure de soufre (SF₆)', [A3('S', 0, 0, 0), A3('F', 1.561, 0, 0), A3('F', -1.561, 0, 0), A3('F', 0, 1.561, 0), A3('F', 0, -1.561, 0), A3('F', 0, 0, 1.561), A3('F', 0, 0, -1.561)], star(6)),
    ethanol: () => mk('Éthanol (C₂H₆O)', zmat([
      ['C'], ['C', 0, 1.512], ['O', 1, 1.431, 0, 107.8], ['H', 2, 0.971, 1, 108.5, 0, 180],
      ['H', 1, 1.093, 0, 110.0, 2, 120], ['H', 1, 1.093, 0, 110.0, 2, -120],
      ['H', 0, 1.093, 1, 110.5, 2, 180], ['H', 0, 1.093, 1, 110.5, 2, 60], ['H', 0, 1.093, 1, 110.5, 2, -60]
    ]), [[0, 1], [1, 2], [2, 3], [1, 4], [1, 5], [0, 6], [0, 7], [0, 8]]),
    acide_acetique: () => mk('Acide acétique (C₂H₄O₂)', zmat([
      ['C'], ['C', 0, 1.50], ['O', 1, 1.21, 0, 126.0], ['O', 1, 1.36, 0, 111.0, 2, 180], ['H', 3, 0.97, 1, 106.0, 2, 0],
      ['H', 0, 1.09, 1, 110.0, 2, 0], ['H', 0, 1.09, 1, 110.0, 2, 120], ['H', 0, 1.09, 1, 110.0, 2, -120]
    ]), [[0, 1], [1, 2, 2], [1, 3], [3, 4], [0, 5], [0, 6], [0, 7]]),
    benzene: () => {
      const at = [], b = [];
      for (let k = 0; k < 6; k++) { const t = k * Math.PI / 3; at.push(A3('C', 1.397 * Math.cos(t), 1.397 * Math.sin(t), 0)); }
      for (let k = 0; k < 6; k++) { const t = k * Math.PI / 3; at.push(A3('H', 2.481 * Math.cos(t), 2.481 * Math.sin(t), 0)); }
      for (let k = 0; k < 6; k++) { b.push([k, (k + 1) % 6, k % 2 === 0 ? 2 : 1]); b.push([k, k + 6]); }
      return mk('Benzène (C₆H₆)', at, b);
    }
  };
  const REF3D_LIST = [
    ['eau', 'Eau', 'coudée'], ['ammoniac', 'Ammoniac', 'pyramidale'], ['methane', 'Méthane', 'tétraédrique'], ['co2', 'Dioxyde de carbone', 'linéaire'],
    ['bf3', 'Trifluorure de bore', 'trigonale plane'], ['methanal', 'Méthanal', 'trigonale plane'], ['ethylene', 'Éthylène', 'plane'], ['acetylene', 'Acétylène', 'linéaire'],
    ['sulfure', 'Sulfure d’hydrogène', 'coudée'], ['sf6', 'Hexafluorure de soufre', 'octaédrique'], ['ethanol', 'Éthanol', 'organique'], ['acide_acetique', 'Acide acétique', 'organique'], ['benzene', 'Benzène', 'aromatique']
  ];

  // ---------- Molécules de référence 2D (atomes lourds, unité = longueur de liaison) ----------
  const HEX = [[0, -1], [0.866, -0.5], [0.866, 0.5], [0, 1], [-0.866, 0.5], [-0.866, -0.5]];
  const ringC = (n0 = 0) => HEX.map(([x, y]) => ['C', x, y]);
  const kek = (o = 0) => [[o, o + 1, 2], [o + 1, o + 2], [o + 2, o + 3, 2], [o + 3, o + 4], [o + 4, o + 5, 2], [o + 5, o]];
  const LIB2D = {
    eau: { n: 'Eau', a: [['O', 0, 0]], b: [] },
    methane: { n: 'Méthane', a: [['C', 0, 0]], b: [] },
    ammoniac: { n: 'Ammoniac', a: [['N', 0, 0]], b: [] },
    hcl: { n: 'Chlorure d’hydrogène', a: [['Cl', 0, 0]], b: [] },
    h2s: { n: 'Sulfure d’hydrogène', a: [['S', 0, 0]], b: [] },
    co2: { n: 'Dioxyde de carbone', a: [['O', -1, 0], ['C', 0, 0], ['O', 1, 0]], b: [[0, 1, 2], [1, 2, 2]] },
    methanol: { n: 'Méthanol', a: [['C', 0, 0], ['O', 1, 0]], b: [[0, 1]] },
    ethanol: { n: 'Éthanol', a: [['C', 0, 0.25], ['C', 0.866, -0.25], ['O', 1.732, 0.25]], b: [[0, 1], [1, 2]] },
    ethane: { n: 'Éthane', a: [['C', 0, 0], ['C', 1, 0]], b: [[0, 1]] },
    propane: { n: 'Propane', a: [['C', 0, 0.25], ['C', 0.866, -0.25], ['C', 1.732, 0.25]], b: [[0, 1], [1, 2]] },
    butane: { n: 'Butane', a: [['C', 0, 0.25], ['C', 0.866, -0.25], ['C', 1.732, 0.25], ['C', 2.598, -0.25]], b: [[0, 1], [1, 2], [2, 3]] },
    ethylene: { n: 'Éthylène (éthène)', a: [['C', 0, 0], ['C', 1, 0]], b: [[0, 1, 2]] },
    acetylene: { n: 'Acétylène (éthyne)', a: [['C', 0, 0], ['C', 1, 0]], b: [[0, 1, 3]] },
    methanal: { n: 'Méthanal', a: [['C', 0, 0], ['O', 0, -1]], b: [[0, 1, 2]] },
    ethanal: { n: 'Éthanal', a: [['C', 0, 0.5], ['C', 0.866, 0], ['O', 0.866, -1]], b: [[0, 1], [1, 2, 2]] },
    acetone: { n: 'Acétone (propanone)', a: [['C', 0, 0.5], ['C', 0.866, 0], ['O', 0.866, -1], ['C', 1.732, 0.5]], b: [[0, 1], [1, 2, 2], [1, 3]] },
    acide_acetique: { n: 'Acide acétique (éthanoïque)', a: [['C', 0, 0.5], ['C', 0.866, 0], ['O', 0.866, -1], ['O', 1.732, 0.5]], b: [[0, 1], [1, 2, 2], [1, 3]] },
    methoxymethane: { n: 'Méthoxyméthane (éther diméthylique)', a: [['C', 0, 0.25], ['O', 0.866, -0.25], ['C', 1.732, 0.25]], b: [[0, 1], [1, 2]] },
    glycine: { n: 'Glycine', a: [['N', 0, 0.5], ['C', 0.866, 0], ['C', 1.732, 0.5], ['O', 1.732, 1.5], ['O', 2.598, 0]], b: [[0, 1], [1, 2], [2, 3, 2], [2, 4]] },
    benzene: { n: 'Benzène', a: ringC(), b: kek() },
    cyclohexane: { n: 'Cyclohexane', a: ringC(), b: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]] },
    toluene: { n: 'Toluène', a: ringC().concat([['C', 0, -2]]), b: kek().concat([[0, 6]]) },
    phenol: { n: 'Phénol', a: ringC().concat([['O', 0, -2]]), b: kek().concat([[0, 6]]) },
    acide_benzoique: { n: 'Acide benzoïque', a: ringC().concat([['C', 0, -2], ['O', -0.866, -2.5], ['O', 0.866, -2.5]]), b: kek().concat([[0, 6], [6, 7, 2], [6, 8]]) },
    aspirine: { n: 'Aspirine (acide acétylsalicylique)', a: ringC().concat([['C', 1.732, -1], ['O', 1.732, -2], ['O', 2.598, -0.5], ['O', 1.732, 1], ['C', 1.732, 2], ['O', 2.598, 2.5], ['C', 0.866, 2.5]]), b: kek().concat([[1, 6], [6, 7, 2], [6, 8], [2, 9], [9, 10], [10, 11, 2], [10, 12]]) },
    paracetamol: { n: 'Paracétamol', a: ringC().concat([['O', 0, -2], ['N', 0, 2], ['C', 0.866, 2.5], ['O', 1.732, 2], ['C', 0.866, 3.5]]), b: kek().concat([[0, 6], [3, 7], [7, 8], [8, 9, 2], [8, 10]]) },
    acide_sulfurique: { n: 'Acide sulfurique', a: [['S', 0, 0], ['O', 0, -1], ['O', 0, 1], ['O', -1, 0], ['O', 1, 0]], b: [[0, 1, 2], [0, 2, 2], [0, 3], [0, 4]] }
  };
  function lib2D(id, Lpx = 48) {
    const d = LIB2D[id]; if (!d) return null;
    return { name: d.n, atoms: d.a.map(([e, x, y]) => ({ el: e, x: x * Lpx, y: y * Lpx })), bonds: d.b.map(([a, b, o]) => ({ a, b, o: o || 1 })) };
  }
  const SIG = {};
  function recognize(m) {
    if (!m || !m.atoms.length) return null;
    const s = signature(m);
    for (const id of Object.keys(LIB2D)) { if (!SIG[id]) SIG[id] = signature(lib2D(id)); if (SIG[id] === s) return { id, name: LIB2D[id].n }; }
    return null;
  }

  G.Chem = {
    EL, ORGANIC, SYMBOLS, normEl, extra, chargeTxt, valList, stdH, totalCharge, fr, key, mulberry32, clone, sub, add, mul, dot, cross, norm, unit, dist, cosAngle, angleDeg, dihedral, P3,
    adjacency, bondSum, implicitH, overValent, hCount, counts, hill, formulaText, formulaHTML, molarMass, parseFormula, sameCounts,
    ringPath, aromatize, signature, recognize,
    toMolfile, parseMolfile, toXYZ, parseXYZ, perceiveBonds, toSMILES,
    vsepr, bondLen, removeAtoms, adjustHydrogens, centroid, centerMol, ForceField, build3D, to2D,
    REF3D, REF3D_LIST, LIB2D, lib2D
  };
})(typeof window !== 'undefined' ? window : globalThis);
