<<<<<<< HEAD
# 📋 PLAN SESSION SUIVANTE

**Date de création**: 9 avril 2026  
**À faire**: PROCHAINE SESSION (pas maintenant)  
**Durée estimée**: 2-3 heures

---

## 🎯 PRIORITÉS DÉFINIES PAR L'UTILISATEUR

### 1. � FAIRE MARCHER GEMINI NANO (PRIORITÉ ABSOLUE!)
**Statut**: 🔴 BLOQUANT - `window.ai available: false` (NE MARCHE PAS)  
**Description**: Résoudre pourquoi Gemini Nano n'est pas accessible  
**Criticité**: 🔴 AFFECTE QUALITÉ ENTIÈRE EXTENSION  
**Impacte**:
- Résumés: Fallback 70% (acceptable mais pas optimal)
- Traductions: IMPOSSIBLES sans Gemini
- AI Detection: IMPOSSIBLE sans Gemini

**Actions IMMÉDIATES**:
- [ ] **LIRE [INVESTIGATION_GEMINI_NANO.md](INVESTIGATION_GEMINI_NANO.md)** - Checklist 7 étapes
- [ ] **FAIRE la checklist investigation complète** (30-60 min)
- [ ] Chrome version ≥ 129?
- [ ] Flag `chrome://flags#prompt-api-for-gemini-nano` activé?
- [ ] `about:components` → Gemini Nano téléchargé?
- [ ] F12 console → `window.ai` accessible?
- [ ] **Documenter résultat final** avec logs

**Si finalement MARCHE** ✅:
- Extension passe 70% → 95% qualité
- Traductions deviennent possibles
- Résumés excellents (Gemini vs heuristique)

**Si ne marche TOUJOURS PAS** ❌:
- Document cause exacte (Chrome < 129? Region lock? Autre?)
- Accept fallback algorithm (toujours bon 70%)
- Fallback continue marcher parfaitement

**Resources**: 
- [INVESTIGATION_GEMINI_NANO.md](INVESTIGATION_GEMINI_NANO.md) - **LIRE EN PREMIER** 7-step checklist
- [QUICKSTART_PROMPT_API.md](QUICKSTART_PROMPT_API.md) - Quick reference
- [DIAGNOSTIC_PROMPT_API.md](DIAGNOSTIC_PROMPT_API.md) - Tech deep-dive
- Onglet "🔍 API" dans popup

---

### 2. 🐛 RÉGLER LES BUGS (APRÈS Nano investigation)
**Statut**: À identifier/confirmer  
**Description**: Bugs généraux de l'extension  
**Actions**:
- [ ] Identifier tous les bugs actuels
- [ ] Compiler liste avec reproduction steps
- [ ] Fixer (un par un ou batch)

### 3. 🔧 RÉGLER PROBLÈME DES DEUX BARRES DE SCROLL
**Statut**: ⚠️ À investiguer  
**Description**: Double scrollbar visible (probablement popup ou panel)  
**Symptômes possibles**:
- Scrollbar sur le body + scrollbar sur `.content` ou `.tab`
- Scrollbar sur `.content` + scrollbar sur un panel enfant
- Scrollbar dupliquée sur summary/translation panel

**Causes possibles**:
- Overflow: auto sur plusieurs éléments imbriqués
- Height 100% + max-height + padding causant overflow
- Fixed position elements avec overflow: scroll
- CSS conflict entre styles-new.css et popup-new.html

**À checker**: 
- [ ] Popup (main content area)
- [ ] Summary panel
- [ ] Translation panel
- [ ] Settings/Config tab
- [ ] Notes modal

**Fix type**: CSS `overflow: hidden` sur parent correct + `overflow-y: auto` sur enfant unique

### 4. ✅ LE RESTE QUI EST PRÉVU
**Statut**: Voir TODO_SESSION_SUIVANTE.md  
**Checklist rapide**:
- [ ] Tester Settings Panel (sliders/selects)
- [ ] Tester sur 5-10 sites réels (Reddit, Medium, News)
- [ ] Vérifier performance (memory leaks)
- [ ] Tests traduction (si Prompt API active)
- [ ] Validation qualité résumé fallback vs AI

---

## 📊 CONTEXTE SESSION PRÉCÉDENTE (21)

### Accomplissements
- ✅ Algorithme résumé refondu (4 types scoring)
- ✅ Retry auto Prompt API (toutes 2s)
- ✅ Diagnostic UI dans popup (onglet "🔍 API")
- ✅ Documentation complète (3 guides)
- ✅ Settings Panel (4 contrôles configurables)
- ✅ UX Polish (animations, responsive, ButtonManager)

### État code
- ✅ content-v4.js: 66.5+ KB, ALL features
- ✅ ai-injected.js: Retry detection active
- ✅ ai-service.js: Auto-detection + improved error handling
- ✅ popup-new.html: Onglet API diagnostic ajouté
- ✅ popup-new.js: Event handlers pour diagnostic

---

## 🔍 INVESTIGATION REQUISE AVANT SESSION

### Problème Barres de Scroll

**Avant de commencer**, l'utilisateur devra tester:

1. **Ouvre le popup AITools**
2. **Cherche une double scrollbar**:
   - Droite interne (dans la tab) + droite externe (dans le popup)?
   - Sur le summary panel (coin droit)?
   - Sur le translation panel?
   - Sur les settings?

3. **Note l'endroit exact**:
   - Chemin: Popup → Onglet X → Sous-section Y
   - Comportement: scrollbar visible mais contentne pas long?
   - Est-ce qu'elle scroll vraiment ou c'est du grésillement CSS?

4. **Screenshot vidéo utile**:
   - Montrer les deux scrollbars visibles côte à côte
   - Confirmer laquelle est active/scrollable

### Documentation de Bug

**Template pour chaque bug trouvé**:
```
### Bug: [Titre descriptif]
- **Fichier**: [popup-new.html / content-v4.js / ...]
- **Reproduction**: [Étapes pour reproduire]
- **Symptôme**: [Quoi de visible/incorrect]
- **Attendu**: [Quel comportement normal]
- **Criticité**: [Bloquant / Haut / Moyen / Bas]
```

---

## 🛠️ CHECKLIST SESSION SUIVANTE (À COPIER EN HAUT)

- [ ] **Bug Investigation** (1h)
  - [ ] Lister tous les bugs actuels
  - [ ] Compiler avec reproduction steps
  - [ ] Classer par priorité/fichier

- [ ] **Prompt API Activation** (30 min)
  - [ ] User activatesflag (hors session, juste suivre QUICKSTART)
  - [ ] Vérifier status via onglet "🔍 API"
  - [ ] Tester résumé Wikipedia
  - [ ] Tester traductions (FR↔EN minimum)

- [ ] **Deux Barres de Scroll** (1h)
  - [ ] Localiser exactement où c'est
  - [ ] Analyser CSS (overflow, height, max-height)
  - [ ] Fixer le CSS parent/enfant
  - [ ] Tester sur tous les onglets

- [ ] **Tests Multi-Sites** (30 min)
  - [ ] Wikipedia (résumé + traduction)
  - [ ] Reddit (long thread)
  - [ ] Medium (article long)
  - [ ] News site (actualités)
  - [ ] Vérifier pas de crashes

- [ ] **Validation Finale** (30 min)
  - [ ] Settings Panel fonctionne
  - [ ] Animations smooth
  - [ ] Console pas d'erreurs
  - [ ] Memory stable (30 min session)

---

## 📚 RESOURCES DISPONIBLES

- [QUICKSTART_PROMPT_API.md](QUICKSTART_PROMPT_API.md) - Pour user
- [DIAGNOSTIC_PROMPT_API.md](DIAGNOSTIC_PROMPT_API.md) - Tech reference
- [TODO_SESSION_SUIVANTE.md](TODO_SESSION_SUIVANTE.md) - Todo details
- Console logs: `[AIinjected]`, `[AIService]`, `[Summarizer]`
- Diagnostic popup: Onglet "🔍 API" dans popup

---

## 💾 FICHIERS À MODIFIER SESSION SUIVANTE

**Probables**:
- ❓ popup-new.html (CSS overflow issues)
- ❓ styles-new.css (conflicting overflow rules)
- ✅ content-v4.js (Prompt API déjà amélioré)
- ✅ ai-injected.js (Retry déjà en place)
- ✅ ai-service.js (Auto-detection déjà prête)

**À identifier**: Autres bugs

---

## 🎯 OBJECTIF FINAL SESSION SUIVANTE

Après session suivante:
- ✅ Prompt API ACTIVÉE et TESTÉE
- ✅ Tous bugs FIXÉS
- ✅ Double scrollbar ÉLIMINÉE
- ✅ Extension PRÊTE POUR PRODUCTION
- ✅ Tests sur 5+ sites VALIDÉS

**Résultat**: Extension v4.0 DÉPLOYABLE et STABLE

---

## 📞 ESCALADE

Si Prompt API toujours indisponible:
- Confirm Chrome version 129+
- Check region lock (Gemini Nano pas everywhere)
- Fallback parfaitement fonctionnel attendant

Si barres de scroll impossible à fixer:
- Peut être side effect d'une lib ou CSS framework
- Possible redesign minimal du layout popup

---

**À la prochaine session: Commencer par lire ce fichier + PLAN_SESSION_SUIVANTE.md d'abord!**
=======
# 📋 PLAN SESSION SUIVANTE

**Date de création**: 9 avril 2026  
**À faire**: PROCHAINE SESSION (pas maintenant)  
**Durée estimée**: 2-3 heures

---

## 🎯 PRIORITÉS DÉFINIES PAR L'UTILISATEUR

### 1. � FAIRE MARCHER GEMINI NANO (PRIORITÉ ABSOLUE!)
**Statut**: 🔴 BLOQUANT - `window.ai available: false` (NE MARCHE PAS)  
**Description**: Résoudre pourquoi Gemini Nano n'est pas accessible  
**Criticité**: 🔴 AFFECTE QUALITÉ ENTIÈRE EXTENSION  
**Impacte**:
- Résumés: Fallback 70% (acceptable mais pas optimal)
- Traductions: IMPOSSIBLES sans Gemini
- AI Detection: IMPOSSIBLE sans Gemini

**Actions IMMÉDIATES**:
- [ ] **LIRE [INVESTIGATION_GEMINI_NANO.md](INVESTIGATION_GEMINI_NANO.md)** - Checklist 7 étapes
- [ ] **FAIRE la checklist investigation complète** (30-60 min)
- [ ] Chrome version ≥ 129?
- [ ] Flag `chrome://flags#prompt-api-for-gemini-nano` activé?
- [ ] `about:components` → Gemini Nano téléchargé?
- [ ] F12 console → `window.ai` accessible?
- [ ] **Documenter résultat final** avec logs

**Si finalement MARCHE** ✅:
- Extension passe 70% → 95% qualité
- Traductions deviennent possibles
- Résumés excellents (Gemini vs heuristique)

**Si ne marche TOUJOURS PAS** ❌:
- Document cause exacte (Chrome < 129? Region lock? Autre?)
- Accept fallback algorithm (toujours bon 70%)
- Fallback continue marcher parfaitement

**Resources**: 
- [INVESTIGATION_GEMINI_NANO.md](INVESTIGATION_GEMINI_NANO.md) - **LIRE EN PREMIER** 7-step checklist
- [QUICKSTART_PROMPT_API.md](QUICKSTART_PROMPT_API.md) - Quick reference
- [DIAGNOSTIC_PROMPT_API.md](DIAGNOSTIC_PROMPT_API.md) - Tech deep-dive
- Onglet "🔍 API" dans popup

---

### 2. 🐛 RÉGLER LES BUGS (APRÈS Nano investigation)
**Statut**: À identifier/confirmer  
**Description**: Bugs généraux de l'extension  
**Actions**:
- [ ] Identifier tous les bugs actuels
- [ ] Compiler liste avec reproduction steps
- [ ] Fixer (un par un ou batch)

### 3. 🔧 RÉGLER PROBLÈME DES DEUX BARRES DE SCROLL
**Statut**: ⚠️ À investiguer  
**Description**: Double scrollbar visible (probablement popup ou panel)  
**Symptômes possibles**:
- Scrollbar sur le body + scrollbar sur `.content` ou `.tab`
- Scrollbar sur `.content` + scrollbar sur un panel enfant
- Scrollbar dupliquée sur summary/translation panel

**Causes possibles**:
- Overflow: auto sur plusieurs éléments imbriqués
- Height 100% + max-height + padding causant overflow
- Fixed position elements avec overflow: scroll
- CSS conflict entre styles-new.css et popup-new.html

**À checker**: 
- [ ] Popup (main content area)
- [ ] Summary panel
- [ ] Translation panel
- [ ] Settings/Config tab
- [ ] Notes modal

**Fix type**: CSS `overflow: hidden` sur parent correct + `overflow-y: auto` sur enfant unique

### 4. ✅ LE RESTE QUI EST PRÉVU
**Statut**: Voir TODO_SESSION_SUIVANTE.md  
**Checklist rapide**:
- [ ] Tester Settings Panel (sliders/selects)
- [ ] Tester sur 5-10 sites réels (Reddit, Medium, News)
- [ ] Vérifier performance (memory leaks)
- [ ] Tests traduction (si Prompt API active)
- [ ] Validation qualité résumé fallback vs AI

---

## 📊 CONTEXTE SESSION PRÉCÉDENTE (21)

### Accomplissements
- ✅ Algorithme résumé refondu (4 types scoring)
- ✅ Retry auto Prompt API (toutes 2s)
- ✅ Diagnostic UI dans popup (onglet "🔍 API")
- ✅ Documentation complète (3 guides)
- ✅ Settings Panel (4 contrôles configurables)
- ✅ UX Polish (animations, responsive, ButtonManager)

### État code
- ✅ content-v4.js: 66.5+ KB, ALL features
- ✅ ai-injected.js: Retry detection active
- ✅ ai-service.js: Auto-detection + improved error handling
- ✅ popup-new.html: Onglet API diagnostic ajouté
- ✅ popup-new.js: Event handlers pour diagnostic

---

## 🔍 INVESTIGATION REQUISE AVANT SESSION

### Problème Barres de Scroll

**Avant de commencer**, l'utilisateur devra tester:

1. **Ouvre le popup AITools**
2. **Cherche une double scrollbar**:
   - Droite interne (dans la tab) + droite externe (dans le popup)?
   - Sur le summary panel (coin droit)?
   - Sur le translation panel?
   - Sur les settings?

3. **Note l'endroit exact**:
   - Chemin: Popup → Onglet X → Sous-section Y
   - Comportement: scrollbar visible mais contentne pas long?
   - Est-ce qu'elle scroll vraiment ou c'est du grésillement CSS?

4. **Screenshot vidéo utile**:
   - Montrer les deux scrollbars visibles côte à côte
   - Confirmer laquelle est active/scrollable

### Documentation de Bug

**Template pour chaque bug trouvé**:
```
### Bug: [Titre descriptif]
- **Fichier**: [popup-new.html / content-v4.js / ...]
- **Reproduction**: [Étapes pour reproduire]
- **Symptôme**: [Quoi de visible/incorrect]
- **Attendu**: [Quel comportement normal]
- **Criticité**: [Bloquant / Haut / Moyen / Bas]
```

---

## 🛠️ CHECKLIST SESSION SUIVANTE (À COPIER EN HAUT)

- [ ] **Bug Investigation** (1h)
  - [ ] Lister tous les bugs actuels
  - [ ] Compiler avec reproduction steps
  - [ ] Classer par priorité/fichier

- [ ] **Prompt API Activation** (30 min)
  - [ ] User activatesflag (hors session, juste suivre QUICKSTART)
  - [ ] Vérifier status via onglet "🔍 API"
  - [ ] Tester résumé Wikipedia
  - [ ] Tester traductions (FR↔EN minimum)

- [ ] **Deux Barres de Scroll** (1h)
  - [ ] Localiser exactement où c'est
  - [ ] Analyser CSS (overflow, height, max-height)
  - [ ] Fixer le CSS parent/enfant
  - [ ] Tester sur tous les onglets

- [ ] **Tests Multi-Sites** (30 min)
  - [ ] Wikipedia (résumé + traduction)
  - [ ] Reddit (long thread)
  - [ ] Medium (article long)
  - [ ] News site (actualités)
  - [ ] Vérifier pas de crashes

- [ ] **Validation Finale** (30 min)
  - [ ] Settings Panel fonctionne
  - [ ] Animations smooth
  - [ ] Console pas d'erreurs
  - [ ] Memory stable (30 min session)

---

## 📚 RESOURCES DISPONIBLES

- [QUICKSTART_PROMPT_API.md](QUICKSTART_PROMPT_API.md) - Pour user
- [DIAGNOSTIC_PROMPT_API.md](DIAGNOSTIC_PROMPT_API.md) - Tech reference
- [TODO_SESSION_SUIVANTE.md](TODO_SESSION_SUIVANTE.md) - Todo details
- Console logs: `[AIinjected]`, `[AIService]`, `[Summarizer]`
- Diagnostic popup: Onglet "🔍 API" dans popup

---

## 💾 FICHIERS À MODIFIER SESSION SUIVANTE

**Probables**:
- ❓ popup-new.html (CSS overflow issues)
- ❓ styles-new.css (conflicting overflow rules)
- ✅ content-v4.js (Prompt API déjà amélioré)
- ✅ ai-injected.js (Retry déjà en place)
- ✅ ai-service.js (Auto-detection déjà prête)

**À identifier**: Autres bugs

---

## 🎯 OBJECTIF FINAL SESSION SUIVANTE

Après session suivante:
- ✅ Prompt API ACTIVÉE et TESTÉE
- ✅ Tous bugs FIXÉS
- ✅ Double scrollbar ÉLIMINÉE
- ✅ Extension PRÊTE POUR PRODUCTION
- ✅ Tests sur 5+ sites VALIDÉS

**Résultat**: Extension v4.0 DÉPLOYABLE et STABLE

---

## 📞 ESCALADE

Si Prompt API toujours indisponible:
- Confirm Chrome version 129+
- Check region lock (Gemini Nano pas everywhere)
- Fallback parfaitement fonctionnel attendant

Si barres de scroll impossible à fixer:
- Peut être side effect d'une lib ou CSS framework
- Possible redesign minimal du layout popup

---

**À la prochaine session: Commencer par lire ce fichier + PLAN_SESSION_SUIVANTE.md d'abord!**
>>>>>>> 43c9b5a24b2db0b13d4265adbff4912777bd3529
