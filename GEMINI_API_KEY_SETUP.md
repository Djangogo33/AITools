# 🔑 GEMINI API SETUP - Alternative à Nano

**Problème identifié**: Gemini Nano n'est pas disponible en France (Google ne l'a pas activé)

**Solution**: Utiliser **Gemini 2.0 Flash API** directement avec une clé gratuite

---

## ✅ ÉTAPE 1: Créer une API Key (5 minutes)

1. Va sur: https://ai.google.dev/
2. Clique **"Get API Key"** (en haut à droite)
3. Clique **"Create API Key in a new project"**
4. Google génère une clé gratuite automatiquement
5. **Copie la clé** (format: `AIza...`)

**Limite gratuite**: 15 requêtes/minute (suffisant!)

---

## ✅ ÉTAPE 2: Ajouter la clé à l'extension

La clé doit être dans **manifest.json** ou **popup-new.js**

Je vais l'ajouter pour toi si tu me donnes la clé.

**Envoie:**
```
AIza... (ta clé API)
```

---

## ✅ ÉTAPE 3: Comment ça marchera

**Avant** (Gemini Nano - pas dispo en France):
```
Wikipedia → Clique Résumer → window.ai undefined → Fallback heuristique
```

**Après** (Gemini API):
```
Wikipedia → Clique Résumer → Appel API Google → Résumé AI de qualité
```

---

## ⚠️ SÉCURITÉ

Ta clé API sera **dans le code source** (visible à tous).

**Solutions:**
1. **Accepter** (la clé gratuite se regénère gratuitement, limite 15 req/min)
2. **Backend serveur** (Je crée un serveur Node.js qui cache la clé)
3. **Attendre VPN** (test avec USA, puis attendre France)

---

## 🎯 DÉCISION

**Quelle option?**

- [ ] Option 1: Envoie-moi la clé API → Je l'intègre maintenant
- [ ] Option 2: Je configure un backend serveur (un peu plus complexe)
- [ ] Option 3: Teste d'abord avec VPN USA pour confirmer

**Réponds avec le numéro + la clé si Option 1** 🚀
