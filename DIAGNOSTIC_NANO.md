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
```
[À remplir]

```

---

### 2. Flag Status (chrome://flags)

Va sur `chrome://flags` et cherche **"Prompt API for Gemini Nano"**

- [ ] **Enabled** (🟢 Activé)
- [ ] **Disabled** (🔴 Désactivé)  
- [ ] **Default** (⚪ Par défaut)
- [ ] **Introductory phrase for Generative AI** (⚠️ Version expérimentale)

**Status exact visible?**
```
[À remplir]
```

---

### 3. Test window.ai (F12 Console)

Ouvre **F12** → onglet **Console**  
Tape: `window.ai` puis Enter

**Résultat exact (copie/colle)?**
```
[À remplir]
```

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

Doit être ≥129

---

### 5. Compte Google

- [ ] Connecté à Google (Gmail affiché coin supérieur droit Chrome)
- [ ] Pas connecté (avatar anonyme)
- [ ] Plusieurs comptes (lequel est actif?)

**Quel compte?**
```
[À remplir]
```

---

### 6. Redémarrage Chrome

Après avoir **complètement fermé et relancé Chrome**:

- [ ] Refait entièrement (arrêt processus + relance)
- [ ] Juste refresh de page (F5)
- [ ] Pas redémarré depuis activation flag

**Quand as-tu redémarré?**
```
[À remplir: maintenant / il y a X heures / pas encore]
```

---

### 7. Console Logs (F12)

Ouvre **F12** → **Console**  
Rafraîchis la page (F5)  
Cherche les logs `[AIinjected]` ET `[AIService]`

**Copie/colle ce que tu vois:**
```
[À remplir - tout ce que tu vois avec "AIinjected" ou "AIService"]
```

Exemples:
- ✅ `[AIinjected] window.ai available (initial): true`
- ❌ `[AIinjected] window.ai available (initial): false`
- ⚠️ `[AIService] ⚠️ Prompt API not available, using fallback`

---

### 8. Région / VPN

- [ ] France
- [ ] Europe (UK, Allemagne, etc)
- [ ] USA
- [ ] Canada
- [ ] Autre: ________
- [ ] Connecté via VPN

---

## 🎯 CHECKLIST AVANT SIGNATURE

- [ ] J'ai rempli toutes les sections
- [ ] J'ai copié/collé les vraies valeurs (pas d'inventions)
- [ ] J'ai redémarré Chrome COMPLÈTEMENT
- [ ] J'ai testé `window.ai` en F12

---

## ✉️ APRÈS AVOIR REMPLI

Envoie-moi ce fichier complété → Je peux diagnostiquer le problème exact! 🔧
