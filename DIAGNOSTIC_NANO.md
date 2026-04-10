# 🔍 DIAGNOSTIC GEMINI NANO - À Remplir

**Date**: 10 avril 2026  
**Objectif**: Identifier EXACTEMENT pourquoi `window.ai` est undefined

---

## 📋 REMPLIS CES CHAMPS

### 1. Statut du Modèle (chrome://components)

Va sur `chrome://components` et cherche **"Generative AI model"**

- [ ] **"Version: X.X.X"** (✅ Téléchargé)
- [ ] **"Updating..."** (⏳ En téléchargement, % = ______)
- [ ] **"Install"** (❌ Non téléchargé)
- [ ] **"Unknown"** ou **"Last checked: Never"** (❌ Jamais vérifié)

**Que vois-tu exactement?** (copie/colle la ligne complète)
Il n'y est carrément pas du tout (sûr de ce que je dis)

### 2. Flag Status (chrome://flags)

Va sur `chrome://flags` et cherche **"Prompt API for Gemini Nano"**

- [ ] **Enabled** (🟢 Activé)
- [ ] **Disabled** (🔴 Désactivé)  
- [ ] **Default** (⚪ Par défaut)
- [ ] **Introductory phrase for Generative AI** (⚠️ Version expérimentale)

**Status exact visible?**
enabled
---

### 3. Test window.ai (F12 Console)

Ouvre **F12** → onglet **Console**  
Tape: `window.ai` puis Enter

**Résultat exact (copie/colle)?**
[AIService] ✅ Initialized with injected script communication
ai-service.js:258 [AIService] Singleton instance created
content-v4.js:18 [Content] ✅ Page script injected successfully
content-v4.js:280 [AITools] ✅ Initialization complete {extensionEnabled: true, darkModeEnabled: false}
content-v4.js:491 [AITools] ✅ Shadow DOM interface created (single instance)
ai-injected.js:5 [AIinjected] ✅ Injected script loaded
ai-injected.js:9 [AIinjected] window.ai available (initial): false
ai-injected.js:167 [AIinjected] Message listener ready
startup.js:1319 This page is using the deprecated ResourceLoader module "mediawiki.ui.button".
[1.41] Please use Codex. See migration guidelines: https://www.mediawiki.org/wiki/Codex/Migrating_from_MediaWiki_UI
execute @ startup.js:1319
doPropagation @ startup.js:753
requestIdleCallback
setAndPropagate @ startup.js:826
impl @ startup.js:2015
eval @ load.php?lang=pt&modules=mediawiki.util&skin=vector-2022&version=ts813:1
indirectEval @ startup.js:1167
asyncEvalTask @ startup.js:1646
(anonymous) @ startup.js:1625
requestIdleCallback
asyncEval @ startup.js:1624
asyncEvalTask @ startup.js:1642
(anonymous) @ startup.js:1625
requestIdleCallback
asyncEval @ startup.js:1624
asyncEvalTask @ startup.js:1642
(anonymous) @ startup.js:1625
requestIdleCallback
asyncEval @ startup.js:1624
work @ startup.js:1800
enqueue @ startup.js:1224
load @ startup.js:2061
(anonymous) @ startup.js:2600
(anonymous) @ startup.js:2641
ai-service.js:102 [AIService] ⚠️ Prompt API not available, using fallback
ai-injected.js:22 [AIinjected] ⚠️ Prompt API still unavailable after 10 retries, using fallback
França:1 Uncaught (in promise) Error: A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received
window.ai
undefined

Exemples:
- ✅ `AISession {...}` = Marche!
- ✅ `{canCreateTextSession: ƒ}` = Marche!
- ❌ `undefined` = Pas activé
- ❌ `Uncaught ReferenceError` = Erreur grave

---

### 4. Chrome Version

F12 → Console → Tape: `navigator.userAgent`

**Cherche "Chrome/XXX", note le numéro:**
```
[À remplir: Chrome version = _____]
```
Pas trouvé mais normalement >129
Doit être ≥129

---

### 5. Compte Google

- [ ] Connecté à Google (Gmail affiché coin supérieur droit Chrome)
- [ ] Pas connecté (avatar anonyme)
- [X] Plusieurs comptes (lequel est actif?)

**Quel compte?**
paul.ardant@gmail.com
---

### 6. Redémarrage Chrome

Après avoir **complètement fermé et relancé Chrome**:

- [ ] Refait entièrement (arrêt processus + relance)
- [X] Juste refresh de page (F5)
- [ ] Pas redémarré depuis activation flag

**Quand as-tu redémarré?**
Il y a 15 min

### 7. Console Logs (F12)

Ouvre **F12** → **Console**  
Rafraîchis la page (F5)  
Cherche les logs `[AIinjected]` ET `[AIService]`

**Copie/colle ce que tu vois:**
[AIService] ✅ Initialized with injected script communication
ai-service.js:258 [AIService] Singleton instance created
content-v4.js:18 [Content] ✅ Page script injected successfully
content-v4.js:280 [AITools] ✅ Initialization complete {extensionEnabled: true, darkModeEnabled: false}
content-v4.js:491 [AITools] ✅ Shadow DOM interface created (single instance)
ai-injected.js:5 [AIinjected] ✅ Injected script loaded
ai-injected.js:9 [AIinjected] window.ai available (initial): false
ai-injected.js:167 [AIinjected] Message listener ready
startup.js:1319 This page is using the deprecated ResourceLoader module "mediawiki.ui.button".
[1.41] Please use Codex. See migration guidelines: https://www.mediawiki.org/wiki/Codex/Migrating_from_MediaWiki_UI
execute @ startup.js:1319
doPropagation @ startup.js:753
requestIdleCallback
setAndPropagate @ startup.js:826
impl @ startup.js:2015
eval @ load.php?lang=pt&modules=mediawiki.experiments&skin=vector-2022&version=1bdlr:1
indirectEval @ startup.js:1167
asyncEvalTask @ startup.js:1646
(anonymous) @ startup.js:1625
requestIdleCallback
asyncEval @ startup.js:1624
asyncEvalTask @ startup.js:1642
(anonymous) @ startup.js:1625
requestIdleCallback
asyncEval @ startup.js:1624
asyncEvalTask @ startup.js:1642
(anonymous) @ startup.js:1625
requestIdleCallback
asyncEval @ startup.js:1624
asyncEvalTask @ startup.js:1642
(anonymous) @ startup.js:1625
requestIdleCallback
asyncEval @ startup.js:1624
work @ startup.js:1800
enqueue @ startup.js:1224
load @ startup.js:2061
(anonymous) @ startup.js:2600
(anonymous) @ startup.js:2641
ai-service.js:102 [AIService] ⚠️ Prompt API not available, using fallback
Exemples:
- ✅ `[AIinjected] window.ai available (initial): true`
- ❌ `[AIinjected] window.ai available (initial): false`
- ⚠️ `[AIService] ⚠️ Prompt API not available, using fallback`

---

### 8. Région / VPN

- [X] France
- [ ] Europe (UK, Allemagne, etc)
- [ ] USA
- [ ] Canada
- [ ] Autre: ________
- [ ] Connecté via VPN

---

## 🎯 CHECKLIST AVANT SIGNATURE

- [X] J'ai rempli toutes les sections
- [X] J'ai copié/collé les vraies valeurs (pas d'inventions)
- [X] J'ai redémarré Chrome COMPLÈTEMENT
- [X] J'ai testé `window.ai` en F12

---

## ✉️ APRÈS AVOIR REMPLI

Envoie-moi ce fichier complété → Je peux diagnostiquer le problème exact! 🔧
