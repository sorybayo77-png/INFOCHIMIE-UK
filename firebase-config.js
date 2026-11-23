/* Configuration du projet Firebase « infochimie-uk » (plateforme INFOCHIMIE UK).
   Ces clés web identifient le projet ; elles sont publiques par conception. La protection des données
   repose sur les règles de la base (fichier database.rules.json) et sur l'authentification.
   backend: 'rtdb' → les données vont dans la Realtime Database indiquée par databaseURL
   (backend: 'firestore' utiliserait Cloud Firestore à la place).
   Pour revenir au mode local (sans base en ligne), ajoutez : disabled: true */
window.CSA_FIREBASE = {
  apiKey: 'AIzaSyAXo7iYfR4_yBWXEt14vKeVjZ4yZx3H3dI',
  authDomain: 'infochimie-uk.firebaseapp.com',
  databaseURL: 'https://infochimie-uk-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'infochimie-uk',
  storageBucket: 'infochimie-uk.firebasestorage.app',
  messagingSenderId: '851551139434',
  appId: '1:851551139434:web:20668096906bc3481d3c13',
  backend: 'rtdb'
};
