# 🎓 TutoFacile — Plateforme de tutoriels gratuits

**Site :** https://djangogo33.github.io/optitools  
**Admin :** https://djangogo33.github.io/optitools/admin.html  
**Repo :** https://github.com/Djangogo33/optitools  
**Créateur :** [Djangogo33](https://djangogo33.github.io/about-me)

---

## 🌐 Écosystème

| Projet | Lien |
|--------|------|
| 💬 Discord | https://discord.com/invite/7F8jX2Se |
| 📱 WhatsApp | https://whatsapp.com/channel/0029VbCJCg06GcG7aLZPGu1f |
| 🧩 AITools Pro | https://github.com/Djangogo33/AITools |
| 👤 About Me | https://djangogo33.github.io/about-me |

---

## 📁 Structure des fichiers

```
optitools/
├── index.html          ← Page d'accueil (+ bandeau promo écosystème)
├── login.html          ← Connexion utilisateur
├── register.html       ← Inscription
├── dashboard.html      ← Espace utilisateur (créer/éditer/supprimer ses tutos, visibilité privé/public)
├── admin.html          ← Panel admin (auth SHA-256)
├── tuto.html           ← Visionneuse d'un tutoriel
├── category.html       ← Parcourir par catégorie
├── contribute.html     ← Formulaire de contribution public
├── legal.html          ← Mentions légales
├── css/
│   ├── variables.css   ← Design tokens (couleurs, fonts, espacements, dark mode html.dark)
│   ├── base.css        ← Reset + composants réutilisables
│   ├── nav.css         ← Barre de navigation
│   └── pages.css       ← Styles spécifiques par page (+ .tip-box pour tutos enrichis)
├── js/
│   ├── auth.js         ← Auth SHA-256 (utilisateurs + admin)
│   ├── data.js         ← Gestion tutoriels (localStorage + JSON, champ published)
│   └── nav.js          ← Navigation, dark mode no-flash, langue, toasts
├── data/
│   └── tutorials.json  ← 20 tutoriels enrichis avec étapes détaillées et tip-box
├── assets/
│   └── favicon.svg
└── .github/workflows/
    └── deploy.yml      ← Déploiement automatique GitHub Pages
```

---

## 🔐 Authentification

### Utilisateurs publics
- Mot de passe hashé **SHA-256** via Web Crypto API
- Session signée stockée en **localStorage** (7 jours)
- `tf_users` · `tf_session`

### Admin
- Identifiant : `admin`
- Mot de passe par défaut : `TutoAdmin2026!`
- Hash SHA-256 dans `js/auth.js` → `ADMIN_PASS_HASH`
- Session en **sessionStorage**

**Changer le mot de passe admin :**
1. https://emn178.github.io/online-tools/sha256.html → générer le hash
2. Remplacer `ADMIN_PASS_HASH` dans `js/auth.js`

---

## 📝 Visibilité des tutoriels

Les tutoriels créés via le dashboard peuvent être :
- 🔒 **Privé** — visible uniquement par le créateur (défaut)
- 🌍 **Public** — visible par tous les visiteurs

Le champ `published: true/false` dans `data.js` contrôle cela.

---

## 🐛 Bugs corrigés

- ✅ **Dark mode flash** — `html.dark` appliqué avant le rendu via snippet `<head>` + IIFE dans `nav.js`
- ✅ **Boutons de langue** — `data-lang-bound` pour éviter le double-binding des listeners
- ✅ **Tutoriels** — contenu enrichi avec étapes détaillées, `.tip-box`, listes de matériel

---

## 🚀 Déploiement GitHub Pages

Push sur `main` → GitHub Actions se déclenche → site live automatiquement.
