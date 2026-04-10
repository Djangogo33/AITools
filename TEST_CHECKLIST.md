# ✅ CHECKLIST À TESTER - Session 22

**Date**: 10 avril 2026  
**Objectif**: Tester extension et identifier bugs  
**Durée estimée**: 2-3 heures

---

## 🎯 TESTER SUR CES SITES

1. **Wikipedia** (long article): `https://fr.wikipedia.org/wiki/France`
2. **Reddit** (long thread): `https://www.reddit.com/r/AskReddit/`
3. **Medium** (article): `https://medium.com/@username/article`
4. **News** (news site): `https://www.bbc.com/news/` ou CNN
5. **Ton site custom**: Autre site important pour toi

---

## 📋 CHECKLIST COMPLÈTE

### 1️⃣ DOUBLE SCROLLBAR
- [ ] Ouvrir popup → pas 2 scrollbars visibles?
- [ ] Summary panel → scrollable, 1 scrollbar seulement?
- [ ] Translation panel → 1 scrollbar?
- [ ] Settings tab → 1 scrollbar?

### 2️⃣ BOUTONS
- [ ] Bouton "Résumer" visible sur page?
- [ ] Bouton repositionné automatiquement sur mobile?
- [ ] Pas d'overlap avec contenu page?
- [ ] Bouton "Traduire" visible?

### 3️⃣ SETTINGS (Config tab)
- [ ] Slider "Longueur résumé" bouge? 
- [ ] Slider valeur persiste (close/reopen popup)?
- [ ] Slider "Sensibilité IA" bouge?
- [ ] Select "Langue traduction" change?
- [ ] Select "Langue résumé" change?
- [ ] Les valeurs persistent?

### 4️⃣ ANIMATIONS
- [ ] Slide-in smooth? (pas saccadé)
- [ ] Hover effects rapides?
- [ ] Slide-out smooth?
- [ ] Pas de lag?

### 5️⃣ POPUP TABS (6 onglets)
- [ ] ⚡ Accès → chargé?
- [ ] 🔍 Google → chargé?
- [ ] 🛠️ Outils → chargé?
- [ ] 🧠 IA → chargé?
- [ ] ⚙️ Config → chargé?
- [ ] 🔍 API → chargé (diagnostic)?
- [ ] Switching tabs smooth, pas d'overlap?

### 6️⃣ RÉSUMÉS
- [ ] Wikipedia: résumé généré? (Nano ou fallback)
- [ ] Reddit: résumé généré?
- [ ] Medium: résumé généré?
- [ ] News: résumé généré?
- [ ] Bouton "Copier" fonctionne?
- [ ] Bouton X (close) fonctionne?

### 7️⃣ TRADUCTIONS (si Nano disponible)
- [ ] Text original visible à gauche?
- [ ] Texte traduit visible à droite?
- [ ] Traduction correcte?
- [ ] Mobile: single column? (responsive)
- [ ] Desktop: dual column?

### 8️⃣ CONSOLE (F12)
- [ ] Pas d'erreurs rouges?
- [ ] Logs `[AIinjected]` présents?
- [ ] Logs `[AIService]` présents?
- [ ] Logs `[Summarizer]` présents?

### 9️⃣ PERFORMANCE
- [ ] Page pas figée pendant résumé?
- [ ] Page pas figée pendant traduction?
- [ ] Switching tabs rapide?
- [ ] Fermer panels instant?
- [ ] 30+ min navigation stable?

### 🔟 CRASHES
- [ ] Pas de crash extension?
- [ ] Pas de crash page?
- [ ] Pas de freeze page?

---

## 📊 RÉSULTATS À DOCUMENTER

Pour chaque BUG trouvé, note:
1. **Titre**: Ex: "Double scrollbar on Summary panel"
2. **Où**: Wikipedia / Reddit / Medium / News / Custom
3. **Comment reproduire**: Ex: "Click Résumer on article"
4. **Symptôme**: Ex: "2 scrollbars visible instead of 1"
5. **Criticité**: 🔴 Bloquant / 🟠 Haut / 🟡 Moyen / 🟢 Bas

**Exemple**:
```
🔴 BLOQUANT - Double Scrollbar on Summary
- Où: Wikipedia
- Reproduced: Click "Résumer" on article
- Symptôme: 2 scrollbars à droite du Summary panel
- File: styles-new.css
```

---

## ✉️ ENVOIE MOI LES RÉSULTATS

Format simple:
```
BUGS TROUVÉS:
1. [Criticité] - Titre - Où - Reproduced comment?

2. [Criticité] - Titre - Où - Reproduced comment?

SETTINGS TESTÉS: OK / KO?
ANIMATIONS: OK / KO?
NANO STATUS: Marche? Oui/Non
```

---

## 🚀 APRÈS CETTE CHECKLIST

- Envoie-moi les bugs trouvés
- Je fixe les bugs
- On teste à nouveau
- Extension ready to ship! 🎉
