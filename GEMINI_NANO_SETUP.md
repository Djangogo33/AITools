# 🔧 GEMINI NANO SETUP - Activation Requise

**Problème**: `window.ai` est `undefined` = Prompt API non activée  
**Solution**: 5 étapes simples

---

## ✅ ÉTAPE 1: Vérifier Chrome 129+

1. Va sur `chrome://version`
2. Cherche **"Google Chrome Version:"** (doit être ≥129)
3. Si < 129 → Mets à jour Chrome (Settings → About Chrome)

**Ton version actuelle**: 146 ✅ (OK!)

---

## ✅ ÉTAPE 2: Activer le Flag

1. Va sur `chrome://flags`
2. Cherche: **"Prompt API for Gemini Nano"**
3. Change de `Default` → **`Enabled`**
4. **Redémarre Chrome complet** (ferme tous les onglets, redémarre navigateur)

---

## ✅ ÉTAPE 3: Vérifier Gemini Nano Model

1. Va sur `chrome://components`
2. Cherche: **"Gemini Nano model"** (ou "Generative AI model")
3. Si status = **"Last checked: today"** AND **"Version: [number]"** → ✅ Téléchargé
4. Si status = **"Install"** ou **"Updating"** → Attends téléchargement (5-10 min)

---

## ✅ ÉTAPE 4: Tester dans F12 Console

Après redémarrage Chrome:

1. Ouvre **F12** (DevTools)
2. Va à l'onglet **Console**
3. Tape: `window.ai` puis appuie **Enter**
4. Doit afficher un **objet** (pas `undefined`)

**Si undefined → Reviens à Étape 2 (flag mal activé)**

---

## ✅ ÉTAPE 5: Tester Extension

Après que `window.ai` marche:

1. Rafraîchis la page (F5)
2. Clique "Résumer" sur Wikipedia
3. Doit utiliser **Gemini Nano** (pas fallback)
4. Console doit afficher: `[AIinjected] ✅ Prompt API became available on retry #X`

---

## 🇫🇷 Régions supportées

Gemini Nano marche sur:
- 🟢 Amérique du Nord (USA, Canada)
- 🟢 Europe (France, UK, etc)
- 🟢 Australie
- 🟢 Nouvelle-Zélande
- 🟡 Autres régions (accès limité)

Si tu es dans région non supportée → VPN en USA/UK (+15 étapes supplémentaires)

---

## ❌ Problèmes courants

**"Generative AI model not available"**
→ Chrome < 129 OU flag désactivé

**`window.ai === undefined` toujours après flag**
→ Chrome version cache, redémarre complètement

**Model en téléchargement (20%)**
→ Attends 5-10 minutes, ne ferme pas Chrome

**"Can't create text session"**
→ Modèle trop gros pour ta RAM (Chrome croît à 2GB+)

---

## ✅ Check-list

Fais ça dans l'ordre:

- [ ] Chrome version 146 (tu l'as ✅)
- [ ] Flag activé → `chrome://flags` Prompt API
- [ ] Chrome redémarré **complètement**
- [ ] `window.ai` retourne objet en F12
- [ ] Gemini Nano status = "Version X" dans components
- [ ] Extension testée sur Wikipedia
- [ ] Console affiche "disponible on retry"

---

## 🎯 Quand ça marche

Tu verras:
```
[AIinjected] window.ai available (initial): true
[AIinjected] ✅ Prompt API became available on retry #0
[AIService] ✅ Prompt API is available!
[Summarizer] 📡 Attempting Prompt API (Gemini Nano)... ✅
```

---

**Fais ces étapes maintenant et reviens me dire ce que tu vois en F12** 🚀
