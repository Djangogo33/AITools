# 📋 DÉFINITION - "Fais Tout" Session Suivante

**Créé**: 9 avril 2026  
**Instruction**: Quand user dit "fais tout" → Exécuter TOUT ce qui suit  
**Poser des questions pour comprendre ce qui ne marche vraiment pas puis exécuter**

---

## 🎯 "FAIS TOUT" = EXÉCUTER CES ÉTAPES (dans cet ordre)

### PHASE 1: GEMINI NANO INVESTIGATION (Priority 🔴 BLOCKER)
**Durée**: 30-60 min  
**Exécution AUTOMATIQUE - POSER DES QUESTIONS**:

1. ✅ Lire [INVESTIGATION_GEMINI_NANO.md](INVESTIGATION_GEMINI_NANO.md)
2. ✅ Chercher Chrome version utilisateur
3. ✅ Vérifier flag `chrome://flags#prompt-api-for-gemini-nano`
4. ✅ Vérifier Gemini Nano dans `about:components`
5. ✅ Tester `window.ai` en F12 console
6. ✅ Documenter résultat exact

**Résultat attendu**: 
- ✅ NANO MARCHE → Avancer à PHASE 2
- ❌ NANO NE MARCHE PAS → Documenter raison, continuer quand même

---

### PHASE 2: IDENTIFIER & LISTER TOUS LES BUGS
**Durée**: 30 min  
**Exécution AUTOMATIQUE - POSER DES QUESTIONS**:

1. ✅ Tester extension sur 3-5 sites (Wikipedia, Reddit, Medium, News)
2. ✅ Ouvrir F12 console → Chercher errors/warnings
3. ✅ Tester TOUS les boutons (Résumer, Traduire, AI Detect, etc.)
4. ✅ Tester TOUS les onglets (Accès, Google, Outils, IA, Config)
5. ✅ Tester Settings Panel (sliders, selects, persistence)
6. ✅ Tester animations (ButtonManager, slide-in/out)
7. ✅ Documenter CHAQUE bug trouvé avec:
   - Titre clair
   - Reproduction steps
   - Symptôme visible
   - Criticité (Bloquant/Haut/Moyen/Bas)
   - Fichier concerné

**Résultat attendu**: Liste bugs compilée

---

### PHASE 3: RÉGLER DOUBLE SCROLLBAR
**Durée**: 1 heure  
**Exécution AUTOMATIQUE - POSER DES QUESTIONS**:

1. ✅ Localiser exactement où c'est (popup? panel? tab?)
2. ✅ Analyser CSS:
   - Vérifier overflow properties
   - Vérifier height + max-height
   - Vérifier padding/margin causing overflow
3. ✅ Fixer CSS (probablement):
   - Ajouter `overflow: hidden` au parent
   - `overflow-y: auto` seulement sur enfant scroll
4. ✅ Tester tous les onglets + panels
5. ✅ Vérifier scrolling smooth sans glitch

**Résultat attendu**: Double scrollbar éliminée

---

### PHASE 4: RÉGLER BUGS IDENTIFIÉS
**Durée**: Variable (30 min - 2 heures selon bugs)  
**Exécution AUTOMATIQUE - POSER DES QUESTIONS**:

1. ✅ Trier bugs par criticité:
   - 🔴 Bloquant d'abord
   - 🟠 Haut
   - 🟡 Moyen
   - 🟢 Bas (si temps)

2. ✅ Pour CHAQUE bug Bloquant/Haut:
   - Lire reproduction steps
   - Localiser code exact
   - Implémenter fix
   - Tester fix marche
   - Vérifier pas de side effects

3. ✅ Documenter pour chaque bug fixé:
   - Bug title
   - Root cause
   - Fix appliqué
   - Test confirmation

**Résultat attendu**: Bugs Bloquant/Haut fixés

---

### PHASE 5: TESTER PROMPT API / NANO (si activé)
**Durée**: 15 min  
**Exécution AUTOMATIQUE - POSER DES QUESTIONS**:

1. ✅ Vérifier status Nano (from PHASE 1)
2. ✅ Si NANO MARCHE:
   - [ ] Tester résumé Wikipedia
   - [ ] Tester traduction (FR→EN, EN→FR minimum)
   - [ ] Vérifier qualité vs fallback
   - [ ] Checker console logs OK
3. ✅ Si NANO NE MARCHE PAS:
   - [ ] Fallback résumé testé (heuristique)
   - [ ] Traductions afficher error message approprié

**Résultat attendu**: API status validé

---

### PHASE 6: TESTER SETTINGS PANEL
**Durée**: 10 min  
**Exécution AUTOMATIQUE - POSER DES QUESTIONS**:

1. ✅ Ouvrir popup → Config tab → Paramètres IA
2. ✅ Tester slider "Longueur résumé":
   - Changer 35 → 50 → 80 → 20
   - Vérifier value display change
   - Fermer/rouvrir popup → valeur persiste?
3. ✅ Tester slider "Sensibilité détecteur IA":
   - Changer 60 → 80 → 20
   - Vérifier persist
4. ✅ Tester select "Langue traduction":
   - Changer FR → EN → ES → etc
   - Vérifier persist
5. ✅ Tester select "Langue résumé":
   - Changer FR → EN → Auto
   - Vérifier persist

**Résultat attendu**: Settings Panel fully functional

---

### PHASE 7: TESTER SITES RÉELS
**Durée**: 20-30 min  
**Exécution AUTOMATIQUE - POSER DES QUESTIONS**:

1. ✅ Test Wikipedia:
   - Clicker "Résumer"
   - Vérifier résumé généré (AI ou fallback)
   - Clicker "Traduire"
   - Vérifier traduction (si Nano marche) ou error (si pas)

2. ✅ Test Reddit:
   - Long thread
   - Clicker "Résumer"
   - Vérifier multi-paragraph handling

3. ✅ Test Medium:
   - Long article
   - Clicker "Résumer"
   - Vérifier quality

4. ✅ Test News site:
   - Actual news article
   - Clicker "Résumer"
   - Vérifier date/stats preserved

5. ✅ Checker aucun crash/error
6. ✅ Checker animations smooth
7. ✅ Checker buttons visible correctement

**Résultat attendu**: Extension stable sur sites réels

---

### PHASE 8: TESTER PERFORMANCE
**Durée**: 15 min  
**Exécution AUTOMATIQUE - POSER DES QUESTIONS**:

1. ✅ Session longue (30+ min navigation):
   - Ouvrir 3-4 sites
   - Faire 5-10 résumés
   - Checker memory pas leaking
   - Checker performance stable

2. ✅ DevTools Memory:
   - F12 → Memory
   - Snapshot initial
   - Faire résumés x5
   - Snapshot final
   - Vérifier pas explosive growth

3. ✅ Animations:
   - Vérifier slide-in/out smooth
   - Vérifier no lag/stuttering
   - Vérifier hover effects fast

**Résultat attendu**: Performance stable, no memory leaks

---

### PHASE 9: VALIDATION FINALE & DOCUMENTATION
**Durée**: 10 min  
**Exécution AUTOMATIQUE - NE PAS DEMANDER**:

1. ✅ Créer résumé de session:
   - Bugs fixés (list)
   - Tests passés (list)
   - Nano status (marche/marche pas)
   - Performance OK/NOK
   - Issues restantes (if any)

2. ✅ Mettre à jour TODO_SESSION_SUIVANTE.md:
   - Marquer items complétés
   - Lister nouveaux issues si trouvés

3. ✅ Créer fichier: SESSION_[DATE]_RESULTS.md
   - Résumé court des accomplissements
   - Screenshots bugs fixés (optionnel)

**Résultat attendu**: Tout documenté et clair

---

## 📊 CHECKLIST "FAIS TOUT"

```
PHASE 1 - NANO Investigation
  ☐ Lire INVESTIGATION_GEMINI_NANO.md
  ☐ Checklist 7 étapes
  ☐ Documenter résultat

PHASE 2 - Identifier Bugs
  ☐ Tester 5 sites
  ☐ Ouvrir F12 console
  ☐ Lister tous bugs trouvés

PHASE 3 - Double Scrollbar
  ☐ Localiser problème
  ☐ Analyser CSS
  ☐ Fixer
  ☐ Tester tous onglets

PHASE 4 - Régler Bugs
  ☐ Trier par criticité
  ☐ Fixer Bloquant/Haut
  ☐ Tester chaque fix

PHASE 5 - Tester Nano/API
  ☐ Vérifier status
  ☐ Tester résumés
  ☐ Tester traductions

PHASE 6 - Settings Panel
  ☐ Tester sliders
  ☐ Tester selects
  ☐ Vérifier persist

PHASE 7 - Sites Réels
  ☐ Wikipedia
  ☐ Reddit
  ☐ Medium
  ☐ News
  ☐ Check no crashes

PHASE 8 - Performance
  ☐ Session longue
  ☐ Memory check
  ☐ Animations smooth

PHASE 9 - Documentation
  ☐ Résumé session
  ☐ Update TODO
  ☐ Create RESULTS file
```

---

## ⏱️ TIMING ESTIMÉ

| Phase | Durée | Cumulatif |
|-------|-------|-----------|
| 1 - Nano | 30-60 min | 30-60 min |
| 2 - Bugs list | 30 min | 60-90 min |
| 3 - Scrollbar | 1 heure | 120-150 min |
| 4 - Bug fixes | 1-2 heures | 180-330 min |
| 5 - API test | 15 min | 195-345 min |
| 6 - Settings | 10 min | 205-355 min |
| 7 - Sites réels | 20-30 min | 225-385 min |
| 8 - Performance | 15 min | 240-400 min |
| 9 - Docs | 10 min | 250-410 min |

**TOTAL**: 4-7 heures (réaliste pour "fais tout")

---

## 🚨 EXÉCUTION

**Quand user dit "fais tout"**:
1. Agent lire ce fichier
2. Agent exécuter PHASE 1-9 dans l'ordre
3. Agent POSER DES QUESTIONS pour ne pas se tromper
4. Agent NE PAS ATTENDRE permission
5. Agent JUST DO IT


---

**Draft par**: Agent (session 21)  
**Approuvé par**: User expectation capture  
**Effectif**: Prochaine session when user says "fais tout"
