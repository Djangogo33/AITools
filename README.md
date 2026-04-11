<<<<<<< HEAD
# 🚀 AITools Pro v4.0 - Suite Complète d'Outils Intelligents pour Chrome

**AITools Pro** est une extension Chrome tout-en-un conçue pour transformer votre navigation. Boostez vos recherches Google, améliorez votre productivité et profitez d'une interface repensée, intuitive et personnalisable.

---

## ✨ Nouveautés v4.0

| Fonctionnalité | Description |
|---|---|
| 🎨 **Interface redessinée** | Navigation par onglets avec icônes + labels, switches CSS, cartes visuelles |
| 🔒 **Anonymiseur de données** | Remplace automatiquement les données personnelles avant envoi à une IA |
| 🎵 **Bouton YouTube Music** | Apparaît automatiquement sur les recherches musicales |
| 🍪 **Anti-cookies amélioré** | Détection par mots-clés, moins de faux positifs, toggle rapide |
| 📍 **Boutons Google corrigés** | S'affichent uniquement après une recherche (pas sur la page d'accueil) |
| ✅ **Toaster de feedback** | Confirmation visuelle à chaque action |
| 🎯 **Focus Mode corrigé** | Fonctionne dès le premier chargement, désactivable proprement |
| 📝 **Menu notes corrigé** | Disparaît instantanément quand la sélection est relâchée |

---

## � Activation Prompt API (Résumés & Traductions Intelligents)

AITools Pro v4.0 supporte la **Prompt API (Gemini Nano)** pour résumés et traductions de qualité A.I. 

### ✅ Comment Activer

1. **Vérifier version Chrome**: Ouvre `chrome://version` → besoin **129+**
2. **Activer le flag**: 
   - Ouvre `chrome://flags#prompt-api-for-gemini-nano`
   - Change "Default" → **"Enabled"**
3. **Reboot complet**: Ferme tous les onglets Chrome, redémarre
4. **Tester**: Va sur Wikipedia, clique "Résumer" → attend 2-5 sec

### 📊 Résultats Esperés

| Scenario | Status | Détails |
|----------|--------|---------|
| **Avec Prompt API ✅** | ⭐⭐⭐⭐⭐ | Résumés excellent, traductions fluides, 2-5 sec |
| **Sans Prompt API** | ⭐⭐⭐⭐ | Résumés très bon (fallback heuristic), traductions NON dispo |

### 🔍 Vérifier dans popup

- Ouvre popup → Onglet **"🔍 API"**
- Clique "Vérifier maintenant"
- Statut s'affiche: ✅ Disponible ou ❌ Indisponible

### 📚 Documentation
Voir [DIAGNOSTIC_PROMPT_API.md](DIAGNOSTIC_PROMPT_API.md) pour guide complet

---

## �🔍 Fonctionnalités principales

### Onglet ⚡ Accès
- Liens rapides : WhatsApp, Discord, Site Internet, ChatGPT
- Réglages rapides avec switches : Mode sombre, Sans pub, Bloqueur cookies

### Onglet 🔍 Google
- Champ de recherche intégré avec bouton de lancement
- 6 catégories : Ortho, Wiki, Tendances, Actualités, Images, Vidéos
- Boutons de recherche contextuels (Chance, Filtres, Maps, ChatGPT, 🎵 YT Music si recherche musicale)
- **20+ opérateurs de recherche avancés** : généraux + image (taille, orientation, couleur, type)
- Personnalisation complète de chaque bouton (label, couleur, action)

### Onglet 🛠️ Outils
- **Pomodoro** (25 min) avec minuteur en temps réel
- **Mes notes** : textes surlignés sauvegardés
- **Résumer la page** : résumé intelligent du contenu
- **🔒 Anonymiser données** : remplace noms, emails, téléphones, dates, IP, IBAN, NSS, codes postaux, URLs
- **PDF Tools**, export de données, nettoyage d'onglets

### Onglet 🧠 IA
- Détecteur de contenu généré par IA (sensibilité réglable)
- Résumeur automatique (longueur et langue configurables)
- Traducteur automatique (8 langues, avec détection de la langue source)
- Générateur de palettes de couleurs
- YouTube Enhancer

### Onglet ⚙️ Config
- **Positionnement** : 4 modes (Adaptative, Compacte, Minimale, Personnalisée)
- **Boutons visibles** : toggle individuel pour chaque élément injecté sur les pages
- **Anti-cookies** : activation/désactivation
- **Système** : page nouvelle fenêtre, mode performance, réinitialisation

---

## 🔒 Anonymiseur de données

L'anonymiseur remplace automatiquement :

| Donnée | Exemple | Remplacement |
|---|---|---|
| Nom propre | Paul Dupont | `[NOM]` |
| Email | contact@exemple.fr | `[EMAIL]` |
| Téléphone | 06 12 34 56 78 | `[TÉLÉPHONE]` |
| Date | 12/03/2024 | `[DATE]` |
| Adresse IP | 192.168.1.1 | `[IP]` |
| NSS | 1 80 12 75 123 456 78 | `[NSS]` |
| IBAN | FR76 3000... | `[IBAN]` |
| Code postal | 75008 | `[CODE POSTAL]` |
| URL | https://exemple.com | `[URL]` |

Un résumé du nombre d'éléments anonymisés par catégorie est affiché. Le résultat est copiable en un clic.

---

## 🍪 Bloqueur de cookies amélioré

Le bloqueur ne s'active désormais que si le popup contient des mots-clés reconnus (`cookie`, `consent`, `gdpr`, `accepter`, etc.) **et** fait plus de 50px de hauteur. Après avoir agi, il se met en pause 5 secondes pour éviter les boucles.

Toggle rapide disponible dans l'onglet **Accès** et dans **Config**.

---

## 🏗️ Structure du projet

```
AITools/
├── manifest.json          # Configuration MV3
├── popup-new.html         # Interface (420px, 640px max-height)
├── popup-new.js           # Logique popup
├── styles-new.css         # Design avec switches CSS
├── content-v4.js          # Script injecté dans les pages
├── background-v4.js       # Service worker
├── layout-manager.js      # Gestionnaire de positions
├── newtab.html/js         # Page nouvel onglet
└── icons/                 # Logos
```

---

## 🐛 Dépannage

### Les boutons Google n'apparaissent pas
Ils ne s'affichent qu'**après avoir effectué une recherche** (URL avec `?q=...`). C'est voulu.

### Les boutons Google ne fonctionnent pas au premier lancement
Réinstaller l'extension ou aller dans `chrome://extensions` → Actualiser.

### Le focus mode n'apparaît pas
Rechargez la page. Si le problème persiste, allez dans **Config → Boutons visibles** et activez "Bouton Focus Mode".

### Anti-cookies trop agressif
Désactivez-le temporairement depuis l'onglet **Accès** (toggle "Bloqueur cookies").

---

## 🔐 Confidentialité

- ✅ Tout fonctionne **en local** — aucun serveur externe (sauf les APIs de traduction)
- ✅ Pas de tracking, pas de données vendues
- ✅ Les données anonymisées ne quittent jamais l'extension

---

## 📞 Support

Discord : https://discord.gg/J2ssa2Wkjr

---

| Information | Détail |
|---|---|
| **Version** | 4.0.0 |
| **Date** | Mars 2026 |
| **Manifest** | V3 |
| **Statut** | ✅ Production |
=======
# 🚀 AITools Pro v4.0 - Suite Complète d'Outils Intelligents pour Chrome

**AITools Pro** est une extension Chrome tout-en-un conçue pour transformer votre navigation. Boostez vos recherches Google, améliorez votre productivité et profitez d'une interface repensée, intuitive et personnalisable.

---

## ✨ Nouveautés v4.0

| Fonctionnalité | Description |
|---|---|
| 🎨 **Interface redessinée** | Navigation par onglets avec icônes + labels, switches CSS, cartes visuelles |
| 🔒 **Anonymiseur de données** | Remplace automatiquement les données personnelles avant envoi à une IA |
| 🎵 **Bouton YouTube Music** | Apparaît automatiquement sur les recherches musicales |
| 🍪 **Anti-cookies amélioré** | Détection par mots-clés, moins de faux positifs, toggle rapide |
| 📍 **Boutons Google corrigés** | S'affichent uniquement après une recherche (pas sur la page d'accueil) |
| ✅ **Toaster de feedback** | Confirmation visuelle à chaque action |
| 🎯 **Focus Mode corrigé** | Fonctionne dès le premier chargement, désactivable proprement |
| 📝 **Menu notes corrigé** | Disparaît instantanément quand la sélection est relâchée |

---

## � Activation Prompt API (Résumés & Traductions Intelligents)

AITools Pro v4.0 supporte la **Prompt API (Gemini Nano)** pour résumés et traductions de qualité A.I. 

### ✅ Comment Activer

1. **Vérifier version Chrome**: Ouvre `chrome://version` → besoin **129+**
2. **Activer le flag**: 
   - Ouvre `chrome://flags#prompt-api-for-gemini-nano`
   - Change "Default" → **"Enabled"**
3. **Reboot complet**: Ferme tous les onglets Chrome, redémarre
4. **Tester**: Va sur Wikipedia, clique "Résumer" → attend 2-5 sec

### 📊 Résultats Esperés

| Scenario | Status | Détails |
|----------|--------|---------|
| **Avec Prompt API ✅** | ⭐⭐⭐⭐⭐ | Résumés excellent, traductions fluides, 2-5 sec |
| **Sans Prompt API** | ⭐⭐⭐⭐ | Résumés très bon (fallback heuristic), traductions NON dispo |

### 🔍 Vérifier dans popup

- Ouvre popup → Onglet **"🔍 API"**
- Clique "Vérifier maintenant"
- Statut s'affiche: ✅ Disponible ou ❌ Indisponible

### 📚 Documentation
Voir [DIAGNOSTIC_PROMPT_API.md](DIAGNOSTIC_PROMPT_API.md) pour guide complet

---

## �🔍 Fonctionnalités principales

### Onglet ⚡ Accès
- Liens rapides : WhatsApp, Discord, Site Internet, ChatGPT
- Réglages rapides avec switches : Mode sombre, Sans pub, Bloqueur cookies

### Onglet 🔍 Google
- Champ de recherche intégré avec bouton de lancement
- 6 catégories : Ortho, Wiki, Tendances, Actualités, Images, Vidéos
- Boutons de recherche contextuels (Chance, Filtres, Maps, ChatGPT, 🎵 YT Music si recherche musicale)
- **20+ opérateurs de recherche avancés** : généraux + image (taille, orientation, couleur, type)
- Personnalisation complète de chaque bouton (label, couleur, action)

### Onglet 🛠️ Outils
- **Pomodoro** (25 min) avec minuteur en temps réel
- **Mes notes** : textes surlignés sauvegardés
- **Résumer la page** : résumé intelligent du contenu
- **🔒 Anonymiser données** : remplace noms, emails, téléphones, dates, IP, IBAN, NSS, codes postaux, URLs
- **PDF Tools**, export de données, nettoyage d'onglets

### Onglet 🧠 IA
- Détecteur de contenu généré par IA (sensibilité réglable)
- Résumeur automatique (longueur et langue configurables)
- Traducteur automatique (8 langues, avec détection de la langue source)
- Générateur de palettes de couleurs
- YouTube Enhancer

### Onglet ⚙️ Config
- **Positionnement** : 4 modes (Adaptative, Compacte, Minimale, Personnalisée)
- **Boutons visibles** : toggle individuel pour chaque élément injecté sur les pages
- **Anti-cookies** : activation/désactivation
- **Système** : page nouvelle fenêtre, mode performance, réinitialisation

---

## 🔒 Anonymiseur de données

L'anonymiseur remplace automatiquement :

| Donnée | Exemple | Remplacement |
|---|---|---|
| Nom propre | Paul Dupont | `[NOM]` |
| Email | contact@exemple.fr | `[EMAIL]` |
| Téléphone | 06 12 34 56 78 | `[TÉLÉPHONE]` |
| Date | 12/03/2024 | `[DATE]` |
| Adresse IP | 192.168.1.1 | `[IP]` |
| NSS | 1 80 12 75 123 456 78 | `[NSS]` |
| IBAN | FR76 3000... | `[IBAN]` |
| Code postal | 75008 | `[CODE POSTAL]` |
| URL | https://exemple.com | `[URL]` |

Un résumé du nombre d'éléments anonymisés par catégorie est affiché. Le résultat est copiable en un clic.

---

## 🍪 Bloqueur de cookies amélioré

Le bloqueur ne s'active désormais que si le popup contient des mots-clés reconnus (`cookie`, `consent`, `gdpr`, `accepter`, etc.) **et** fait plus de 50px de hauteur. Après avoir agi, il se met en pause 5 secondes pour éviter les boucles.

Toggle rapide disponible dans l'onglet **Accès** et dans **Config**.

---

## 🏗️ Structure du projet

```
AITools/
├── manifest.json          # Configuration MV3
├── popup-new.html         # Interface (420px, 640px max-height)
├── popup-new.js           # Logique popup
├── styles-new.css         # Design avec switches CSS
├── content-v4.js          # Script injecté dans les pages
├── background-v4.js       # Service worker
├── layout-manager.js      # Gestionnaire de positions
├── newtab.html/js         # Page nouvel onglet
└── icons/                 # Logos
```

---

## 🐛 Dépannage

### Les boutons Google n'apparaissent pas
Ils ne s'affichent qu'**après avoir effectué une recherche** (URL avec `?q=...`). C'est voulu.

### Les boutons Google ne fonctionnent pas au premier lancement
Réinstaller l'extension ou aller dans `chrome://extensions` → Actualiser.

### Le focus mode n'apparaît pas
Rechargez la page. Si le problème persiste, allez dans **Config → Boutons visibles** et activez "Bouton Focus Mode".

### Anti-cookies trop agressif
Désactivez-le temporairement depuis l'onglet **Accès** (toggle "Bloqueur cookies").

---

## 🔐 Confidentialité

- ✅ Tout fonctionne **en local** — aucun serveur externe (sauf les APIs de traduction)
- ✅ Pas de tracking, pas de données vendues
- ✅ Les données anonymisées ne quittent jamais l'extension

---

## 📞 Support

Discord : https://discord.gg/J2ssa2Wkjr

---

| Information | Détail |
|---|---|
| **Version** | 4.0.0 |
| **Date** | Mars 2026 |
| **Manifest** | V3 |
| **Statut** | ✅ Production |
>>>>>>> 43c9b5a24b2db0b13d4265adbff4912777bd3529
