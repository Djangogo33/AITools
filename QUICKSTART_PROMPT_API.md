<<<<<<< HEAD
# ⚡ QUICK START - Activation Prompt API

**Durée**: 5 minutes max  
**Résultat**: Résumés & traductions IA de qualité professionnelle

---

## 🎯 3 ÉTAPES SEULEMENT

### ✅ Étape 1: Vérifier Version (30 secondes)
1. Ouvre **`chrome://version`** dans ta barre d'adresse
2. Tu vas voir "Google Chrome" suivi d'un numéro (ex: "129.0.1234")
3. **Vérifie**: Le numéro doit être **≥ 129**

**Si < 129**: Tu dois upgrader Chrome/Ecosia
**Si ≥ 129**: Continue à Étape 2 ✅

---

### ✅ Étape 2: Activer le Flag (1 minute)
1. Ouvre **`chrome://flags#prompt-api-for-gemini-nano`** dans ta barre d'adresse
2. Tu vas voir une section "Prompt API for Gemini Nano"
3. **Clique sur le dropdown** à droite
4. **Sélectionne**: "Enabled" (changé de "Default")
5. **Click**: Le bouton bleu "Relaunch" en bas à droite

**Conseil**: Le navigateur va fermer et redémarrer automatiquement

---

### ✅ Étape 3: Tester (2-3 minutes)
1. Va sur **[Wikipedia (France)](https://fr.wikipedia.org/wiki/France)**
2. Cherche le bouton **"✂️ Résumer"** (apparaît en haut à droite)
3. **Clique dessus**
4. **Attends 2-5 secondes** (Gemini Nano traite)
5. **Regarde le résumé**: Doit être structuré et fluide

---

## ✅ C'EST ACTIVÉ!

### Vérifier statut dans l'extension

1. **Ouvre le popup** AITools
2. **Va à l'onglet**: 🔍 API
3. **Clique**: "Vérifier maintenant"
4. **Regarde statut**:
   - ✅ `Prompt API: ✅ Disponible`
   - ✅ `Gemini Nano: ✅ Accessible`

---

## 🚨 Si ça ne marche pas

### Symptôme: "Prompt API: ❌ Indisponible"

**Causes possibles**:
1. **Flag pas bien activé** → Recheck Steps 2
2. **Navigateur pas redémarré** → Ferme TOUS les onglets Chrome, relance
3. **Gemini Nano à télécharger** → Premiere use prend 2-5 minutes
4. **Chrome version < 129** → Upgrade Chrome/Windows

**Solution rapide**:
```
1. Ferme TOUS les onglets Chrome
2. Relance Chrome
3. Attends 3 minutes
4. Reviens à l'onglet 🔍 API
5. Clique "Vérifier maintenant"
```

---

## 🎁 BONUS: Console Log Detail

Ouvre **F12 → Console** et cherche ces logs:

### ✅ Si API Disponible
```javascript
[AIinjected] window.ai available (initial): true
[AIService] ✅ Prompt API is available!
[AIService] 📝 Summarizing text...
[AIinjected] Creating AI session for summarization...
```

### ❌ Si API Pas Dispo
```javascript
[AIinjected] window.ai available (initial): false
[AIinjected] ⚠️ Prompt API still unavailable after 10 retries
[AIService] ⚠️ Prompt API unavailable
[Summarizer] Using heuristic fallback
```

---

## 📌 Important

- **Sans Prompt API**: L'extension utilise un heuristique intelligent = très bon (70%)
- **Avec Prompt API**: Résumés Gemini Nano = excellent (95%+)
- **Données**: Traitement 100% LOCAL, pas d'upload serveur

---

## 🎯 NEXT STEPS

Après activation:

1. **Tester sur plusieurs sites**:
   - Wikipedia ✅ Parfait pour tests
   - Reddit (longs threads)
   - Medium (articles longs)
   - News (actualités)

2. **Tester traduction** (si Prompt API active):
   - Cherche texte anglais
   - Clique bouton 🌐 Traduire
   - Top-right → panel dual-colonnes

3. **Vérifier Settings** dans ⚙️ Config:
   - Réglage longueur résumé (15-80%)
   - Langue cible traduction (8 langues)
   - Sensibilité détecteur IA

---

**C'est tout! 🚀 Extension est maintenant à 100% prête.**
=======
# ⚡ QUICK START - Activation Prompt API

**Durée**: 5 minutes max  
**Résultat**: Résumés & traductions IA de qualité professionnelle

---

## 🎯 3 ÉTAPES SEULEMENT

### ✅ Étape 1: Vérifier Version (30 secondes)
1. Ouvre **`chrome://version`** dans ta barre d'adresse
2. Tu vas voir "Google Chrome" suivi d'un numéro (ex: "129.0.1234")
3. **Vérifie**: Le numéro doit être **≥ 129**

**Si < 129**: Tu dois upgrader Chrome/Ecosia
**Si ≥ 129**: Continue à Étape 2 ✅

---

### ✅ Étape 2: Activer le Flag (1 minute)
1. Ouvre **`chrome://flags#prompt-api-for-gemini-nano`** dans ta barre d'adresse
2. Tu vas voir une section "Prompt API for Gemini Nano"
3. **Clique sur le dropdown** à droite
4. **Sélectionne**: "Enabled" (changé de "Default")
5. **Click**: Le bouton bleu "Relaunch" en bas à droite

**Conseil**: Le navigateur va fermer et redémarrer automatiquement

---

### ✅ Étape 3: Tester (2-3 minutes)
1. Va sur **[Wikipedia (France)](https://fr.wikipedia.org/wiki/France)**
2. Cherche le bouton **"✂️ Résumer"** (apparaît en haut à droite)
3. **Clique dessus**
4. **Attends 2-5 secondes** (Gemini Nano traite)
5. **Regarde le résumé**: Doit être structuré et fluide

---

## ✅ C'EST ACTIVÉ!

### Vérifier statut dans l'extension

1. **Ouvre le popup** AITools
2. **Va à l'onglet**: 🔍 API
3. **Clique**: "Vérifier maintenant"
4. **Regarde statut**:
   - ✅ `Prompt API: ✅ Disponible`
   - ✅ `Gemini Nano: ✅ Accessible`

---

## 🚨 Si ça ne marche pas

### Symptôme: "Prompt API: ❌ Indisponible"

**Causes possibles**:
1. **Flag pas bien activé** → Recheck Steps 2
2. **Navigateur pas redémarré** → Ferme TOUS les onglets Chrome, relance
3. **Gemini Nano à télécharger** → Premiere use prend 2-5 minutes
4. **Chrome version < 129** → Upgrade Chrome/Windows

**Solution rapide**:
```
1. Ferme TOUS les onglets Chrome
2. Relance Chrome
3. Attends 3 minutes
4. Reviens à l'onglet 🔍 API
5. Clique "Vérifier maintenant"
```

---

## 🎁 BONUS: Console Log Detail

Ouvre **F12 → Console** et cherche ces logs:

### ✅ Si API Disponible
```javascript
[AIinjected] window.ai available (initial): true
[AIService] ✅ Prompt API is available!
[AIService] 📝 Summarizing text...
[AIinjected] Creating AI session for summarization...
```

### ❌ Si API Pas Dispo
```javascript
[AIinjected] window.ai available (initial): false
[AIinjected] ⚠️ Prompt API still unavailable after 10 retries
[AIService] ⚠️ Prompt API unavailable
[Summarizer] Using heuristic fallback
```

---

## 📌 Important

- **Sans Prompt API**: L'extension utilise un heuristique intelligent = très bon (70%)
- **Avec Prompt API**: Résumés Gemini Nano = excellent (95%+)
- **Données**: Traitement 100% LOCAL, pas d'upload serveur

---

## 🎯 NEXT STEPS

Après activation:

1. **Tester sur plusieurs sites**:
   - Wikipedia ✅ Parfait pour tests
   - Reddit (longs threads)
   - Medium (articles longs)
   - News (actualités)

2. **Tester traduction** (si Prompt API active):
   - Cherche texte anglais
   - Clique bouton 🌐 Traduire
   - Top-right → panel dual-colonnes

3. **Vérifier Settings** dans ⚙️ Config:
   - Réglage longueur résumé (15-80%)
   - Langue cible traduction (8 langues)
   - Sensibilité détecteur IA

---

**C'est tout! 🚀 Extension est maintenant à 100% prête.**
>>>>>>> 43c9b5a24b2db0b13d4265adbff4912777bd3529
