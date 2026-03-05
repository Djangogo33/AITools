# 🚀 AITools Pro v4.0 - Suite Complète d'Outils Intelligents pour Chrome

**AITools Pro** est une extension Chrome tout-en-un conçue pour transformer votre navigation. Améliorez vos recherches Google, boostez votre productivité et profitez d'un confort visuel optimal avec un ensemble d'outils puissants et intuitifs.

## ✨ Fonctionnalités

### 🔍 Recherche Google Améliorée
- **4 boutons rapides** : "Je suis chanceux", Filtres avancés, Google Maps, ChatGPT
- **6 catégories de recherche** : Orthographe, Wikipédia, Tendances, Actualités, Images, Vidéos
- **Filtres évolués** : Accédez aux opérateurs de recherche Google sans effort
- **Blocage des annonces** : Supprimez les résultats sponsorisés de vos recherches

### ⚡ Accès Rapide
- **Ouvrez vos services préférés en 1 clic** : WhatsApp, ChatGPT, Discord ou Optitools
- **Bouton "Je suis chanceux"** pour des découvertes surprenantes
- **Popup compacte et efficace** : Tous vos outils au portée

### ⏰ Outils de Productivité
- **Temps de lecture estimé** : Badge automatique sur chaque article
- **Technique Pomodoro** : Minuteur 25 min pour une concentration optimale
- **Gestionnaire d'onglets Zen** : Organisez automatiquement par domaine
- **Surlignage & Notes** : Capturez et sauvegardez vos passages clés

### 🎨 Interface Élégante
- **Mode sombre universel** : Appliquez le mode sombre à tous les sites
- **Design minimaliste** : Interface optimisée pour une utilisation fluide
- **Esthétique moderne** : Dégradé violet-bleu, icônes épurées et intuitivess

### 🛠️ Outils Avancés
- **Convertisseur de devises** : Cliquez droit sur un montant pour convertir
- **Sauvegarde & Restauration** : Exportez vos notes en JSON ou restaurez vos données
- **Réinitialisation complète** : Repartez à zéro en un clic si nécessaire

## 🎯 Guide de Démarrage

### Nouvelle Page d'Accueil
- Ouvrez un nouvel onglet → Redirection automatique vers Google

### Popup Principal (4 Sections)
1. **⚡ Quick** : Accès direct aux services populaires
2. **🔍 Google** : Recherche avancée et filtres
3. **🛠️ Tools** : Outils de productivité (Notes, Pomodoro)
4. **⚙️ Settings** : Préférences et personnalisation

### Exemple : Recherche Contextuelle
```
Recherche "Paris" → Cliquez "🗺️ Maps"
✨ Résultat : Google Maps s'ouvre directement pour Paris
   (sans navigation supplémentaire)
```

## 🧪 Dépannage et Tests

**Avant de signaler un bug, essayez ceci :**

1. **Rechargez l'extension**
   - Accédez à `chrome://extensions/` → Cliquez le bouton actualiser
   - Ou désactivez/réactivez l'extension

2. **Videz le cache navigateur**
   - Appuyez sur Ctrl+Shift+Delete → Cochez "Images et fichiers en cache"
   - Redémarrez Chrome

3. **Consultez le protocole de test**
   - Voir `TESTING_GUIDE_V4.2.md` pour une checklist complète

4. **Activez les outils de développement**
   - Chrome : `chrome://extensions/` → AITools → "Erreurs"
   - Page : Appuyez sur F12 → Onglet "Console"
   - Recherchez les messages d'erreur en rouge

## 🔧 Structure du Projet

```
AITools/
├── manifest.json                # Configuration (v4.0, Manifest V3)
├── popup-new.html              # Interface principale (420px optimisée)
├── popup-new.js                # Logique du popup
├── styles-new.css              # Design moderne et minimaliste
├── content-v4.js               # Script injecté dans les pages
├── background-v4.js            # Service worker (Manifest V3)
├── aitools-logo-*.png          # Icônes multiples résolutions
├── newtab.html                 # Page d'accueil personnalisée
├── newtab.js                   # Redirection automatique
└── TESTING_GUIDE_V4.2.md       # Guide complet de test
```

## 🐛 Carte de Dépannage

### ❌ Le popup n'ouvre pas
✅ **Solutions :**
- Rechargez l'extension : `chrome://extensions` → Bouton actualiser
- Videz le cache : Ctrl+Shift+Delete → Sélectionnez "Images et fichiers en cache"
- Vérifiez que les fichiers existent : `popup-new.html`, `popup-new.js`

### ❌ Les boutons de recherche Google manquent
✅ **Solutions :**
- Visitez google.com et appuyez sur Ctrl+R (rechargement complet)
- Attendez quelques secondes pour l'injection du contenu
- Testez avec une recherche simple (ex : "test")

### ❌ Le mode sombre ne fonctionne pas
✅ **Solutions :**
- Cliquez sur 🌙 dans l'en-tête du popup
- Rechargez la page (Ctrl+R)
- Note : Certains sites CSS propriétaire peuvent bloquer l'effet

### ❌ Les notes ne se sauvegardent pas
✅ **Solutions :**
- Surlignez du texte → Un menu contextuel doit apparaître
- Cliquez sur "📝 Ajouter une note"
- Consultez vos notes via Popup → 🛠️ Tools → "Mes notes"

### ❌ Le minuteur Pomodoro ne démarre pas
✅ **Solutions :**
- Vérifiez que Chrome permet les notifications : Paramètres → Confidentialité → Notifications
- Autorisez AITools Pro pour les notifications
- Redémarrez Chrome

## 📊 Architecture technique

### Manifest v3 (MV3)
- ✅ CSP-compliant (pas de script inline)
- ✅ Service workers (pas de background pages)
- ✅ Content scripts sécurisés
- ✅ Stockage local persistant

### Storage
```javascript
chrome.storage.local.get(null, (data) => {
  // Notes, état dark mode, paramètres, etc
  // Persistent across sessions
});
```

### Messaging
```javascript
// Popup → Content script
chrome.tabs.sendMessage(tabId, {
  action: 'blockSponsored',
  enabled: true
});

// Communication : Content → Popup/Background
chrome.runtime.sendMessage({
  action: 'addNote',
  data: { text, url, title }
});
```

## � Feuille de Route Futur

- [ ] **Thèmes personnalisés** : Créez vos propres palettes de couleurs
- [ ] **Synchronisation cloud** : Vos données sur tous vos appareils
- [ ] **Support Firefox** : Extension compatible Firefox
- [ ] **Barre flottante** : Accès instant sans popup
- [ ] **Intégration Notion** : Synchronisez vos notes directement
- [ ] **Marketplace** : Ajoutez vos propres catégories de recherche
- [ ] **Plan Premium** : Synchronisation cloud et fonctionnalités avancées

## 💬 Feedback et Support

**Découvert un bug ? Voulez-vous une nouvelle fonctionnalité ?**

- **Signalez l'erreur** : Ouvrez la console (F12) et copiez les messages
- **Décrivez le contexte** : Sur quelle page ? Quel bouton avez-vous cliqué ?
- **Joignez une capture d'écran** : Montrez visuellement le problème

## 📄 Licence

**AITools Pro v4.0** - Utilisation personnelle et éducative

---

| Information | Détail |
|---|---|
| **Version** | 4.0.0 |
| **Date de sortie** | 1er mars 2026 |
| **Statut** | ✅ Production |
| **Tests** | ✅ Tous réussis |

**Merci d'utiliser AITools Pro ! 🚀**