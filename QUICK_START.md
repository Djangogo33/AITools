# ⚡ QUICK START - 2 Minutes

## Étape 1️⃣: Charger l'extension
1. Ouvrez `chrome://extensions/` dans Chrome
2. Activez le **Mode développeur** (coin haut-droit)
3. Cliquez **Charger l'extension non empaquetée**
4. Sélectionnez le dossier `/Extensions/AITools`
5. ✅ Vous devriez voir **AITools Pro v4.0.0** avec icône violette

## Étape 2️⃣: Ouvrir le popup
1. Cliquez l'icône **violet** en haut à droite du navigateur
2. Vous verrez 4 onglets : ⚡🔍🛠️⚙️
3. ✅ Le popup doit faire 420px de large

## Étape 3️⃣: Tester les boutons rapides
### Tab ⚡ (Quick)
- **WhatsApp:** Ouvre un compose WhatsApp
- **ChatGPT:** Lance ChatGPT
- **Chance:** Google "I'm Feeling Lucky"
- **Maps:** Ouvre Google Maps avec query

**Toggles:**
- 🌙 Dark mode: Allume le mode sombre site actuel
- 🚫 Pas de pub: Active blocage annonces sponsorisées

> ✨ **TIP:** Testez sur n'importe quel site!

## Étape 4️⃣: Essayer Google Search (Tab 🔍)
1. Allez sur **google.com**
2. Tapez une recherche (ex: "cats")
3. ⬇️ Sous la barre de recherche vous verrez:
   - **Chance** - I'm Feeling Lucky
   - **Filtres** - Menu avancé
   - **Maps** - Google Maps
   - **ChatGPT** - Envoyer à ChatGPT

4. Cliquez **Filtres** → Choisissez un opérateur:
   - 📝 Exact phrase
   - 📌 Sur ce site (site:)
   - 📅 Après cette date (after:)
   - Et 5+ autres...

5. **6 Catégories** (badges ronds):
   - 📖 Wiki - Wikipédia
   - 📊 Tendances - Google Trends
   - 📰 News - Actualités
   - 🖼️ Images
   - 🎬 Vidéos
   - ✏️ Orthographe

> ✨ Cliquez une catégorie → Google cherche le terme + filtre appliqué!

## Étape 5️⃣: Outils de Productivité (Tab 🛠️)
- ⏱️ **Pomodoro** - 25 min focus timer
  * Cliquez START → Compte à rebours + notification
- 🗂️ **Gestionnaire onglets** - Groupe par domaine
- 📝 **Mes notes** - Voir notes surlignées
- 🗑️ **Effacer notes** - Reset tout

> ✨ Les notes se créent au clic-droit sur texte!

## Étape 6️⃣: Paramètres (Tab ⚙️)
- ✅ Temps de lecture
- ✅ Convertisseur devises
- 📥 **Export données** - Télécharge JSON sauvegarde
- 🔄 **Reset** - Réinitialise tout (⚠️ irréversible)

---

## 🎯 Troubleshooting (Si ça n'apparaît pas)

### Problème: L'icône n'apparaît pas
```
✅ Solution: Allez chrome://extensions/
→ Vérifiez que AITools Pro v4.0.0 est ACTIVÉ ✓
→ Cliquez le pin pour l'ajouter à la toolbar
```

### Problème: Le popup est vide
```
✅ Solution: F12 Console → Cherchez les erreurs
→ Si ERREUR: Allez chrome://extensions/ → Cliquez "Reload"
→ Si TOUJOURS vide: Réinstallez (voir étape 1-2)
```

### Problème: Les boutons ne cliquent pas
```
✅ Solution: F12 Console → Vérifiez pas d'erreurs
→ Cliquez plusieurs fois (animations peuvent ralentir)
→ Si ça marche pas: Reload l'extension
```

### Problème: Google buttons ne s'affichent pas
```
✅ Solution:
→ Assurez-vous d'être sur google.com (pas google.fr sans www)
→ Rechargez la page Google (Ctrl+R)
→ F12 Console → Pas d'erreurs?
→ Ouvrez INSPECTION, cherchez <form> en bas de page
```

### Problème: Dark mode casse les couleurs
```
✅ Solution:
→ Ceci est normal sur certains sites
→ Cliquez Toggle 🌙 pour l'éteindre sur ce site
→ Les sites avec CSS custom résistent mieux
```

---

## 📊 Mode Débugage (Pour nous aider)

Ouvrez la console (F12) et collez ça:

```javascript
// Voir TOUS les messages de l'extension
chrome.storage.local.get(null, (data) => {
  console.log('📦 STORAGE:', data);
});

// Tester un bouton
document.querySelector('#whatsappBtn').click();

// Vérifier service worker
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('👷 Workers:', regs);
});
```

---

## ✅ Checklist Rapide

- [ ] Extension chargée (v4.0.0)
- [ ] Popup s'ouvre avec 4 onglets
- [ ] ⚡ boutons WhatsApp/ChatGPT/Chance/Maps cliquables
- [ ] 🔍 Google Search buttons visible sur google.com
- [ ] 🌙 Dark mode toggle fonctionne (change couleurs)
- [ ] 🛠️ Pomodoro compte à rebours 25:00
- [ ] ⚙️ Toggles sauvegardent leurs états

**Si TOUT est ✅** → Vous êtes bon à utiliser! 🎉

---

## 💡 Tips & Tricks

### Raccourcis Chrome
- Voir tous les extensions: `Ctrl+Shift+E`
- Ouvrir DevTools: `F12`
- Reload page: `Ctrl+R` (clear cache: `Ctrl+Shift+R`)

### Meilleure utilisation
1. **Matin:** Pomodoro timer pour 45min focus
2. **Chercher:** Utilisez Google Filters pour opérateurs avancés
3. **Lecture:** Badge de temps apparaît auto si article long
4. **Nuit:** Toggle Dark mode off la nuit (économise batterie)

### Avant de nous signaler un bug
1. Reload extension (chrome://extensions/ → Reload)
2. Reload votre page
3. Ouvrez F12 Console
4. Essayez à nouveau
5. **Signalez l'erreur EXACTE du console**

---

**Besoin d'aide?** Consultez README.md pour le guide complet.

**Version:** 4.0.0
**Dernière mise à jour:** 27 Feb 2026
**État:** ✅ Prêt à l'emploi
