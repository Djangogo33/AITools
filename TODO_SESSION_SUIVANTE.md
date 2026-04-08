# AITools Pro v4.0 - TODO Prochaine Session

**Date**: 8 avril 2026  
**État**: Extension fonctionnelle avec fallback intelligent  
**Prochaine priorité**: TESTER réellement + polish final

---

## 🔴 BLOQUANTS

### 1. TESTER VRAIE PROMPT API
- ✅ Architecture ready (page script injecté)
- ❌ Indisponible actuellement: `window.ai available: false`
- **Test requis**: Chrome 129+ avec flag "Prompt API for Gemini Nano" activé

### 2. TESTER SUR PLUSIEURS PAGES
- [ ] Wikipedia ✅ (déjà testé)
- [ ] Reddit, Medium, News sites
- [ ] Vérifier résumé + traduction
- [ ] Chercher dégradation UX/perf

---

## 🟡 IMPORTANT

### 3. PEAUFINER UX
- [ ] Boutons résumé/traduction: positions, visibilité
- [ ] Summary panel: copier, fermer, animations
- [ ] Translation panel: colonnes responsive
- [ ] Focus Mode, Cookie blocker: test réel

### 4. PERFORMANCE
- [ ] Memory leaks? (cleanup code ✅)
- [ ] Sessions longues (30+ min)
- [ ] DevTools Memory profiler

### 5. LANGUE
- [ ] Détection texte mélangé, court, caractères spéciaux

---

## 🟢 OPTIONNEL

- [ ] Settings panel (utilisateur change options)
- [ ] Améliorer fallback résumé
- [ ] Icon badge count

---

## 📊 ÉTAT TECHNIQUE

| Composant | Statut |
|-----------|--------|
| Page script injection | ✅ |
| IPC messaging | ✅ |
| Résumé fallback | ✅ |
| Traduction (Prompt API) | ⚠️ Indisponible |
| Memory cleanup | ✅ |
| XSS prevention | ✅ |

---

## 🚀 AVANT DÉPLOIEMENT

1. ✅ Bugs fixés
2. ✅ Architecture robuste
3. ❌ Tester Prompt API réelle
4. ❌ Tester 5-10 sites différents
5. ❌ Vérifier perf machine réelle

**Tempo estimée**: 2-3h

---

## 💡 NOTES

- Prompt API absence = normal, fallback heuristique OK
- Page script = bonne approche pour window.ai access
- Prêt à déployer après tests
