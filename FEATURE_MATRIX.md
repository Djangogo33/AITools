# Matrice de finalisation AITools

La version historique concentrait une grande quantité de logique dans le popup et le script de contenu. La finalisation de la version 5 découpe cette surface en modules indépendants et maintenables.

| Domaine | Fonctions de parité à livrer | Module cible | État de départ |
|---|---|---|---|
| Compte | Google OAuth, profil, plans, droits et déconnexion | `shared/auth-client.js`, service worker | Partiellement livré |
| Données | Notes locales, synchronisation, export et réinitialisation | `shared/notes-service.js`, Supabase | Partiellement livré |
| Recherche | Catégories, opérateurs, raccourcis et personnalisation | `popup/search.js`, `shared/settings.js` | Partiellement livré |
| Productivité | Pomodoro persistant, doublons, lecture, focus et surlignage | service worker et content script | Partiellement livré |
| Page | Résumé, traduction, détection IA, anonymisation, palette et cookies | `content/content-script.js`, outils locaux | Partiellement livré |
| Médias | Contrôles YouTube et entrée PDF | content script et popup | À livrer |
| Nouvel onglet | Tableau de bord, recherche et raccourcis | `newtab/` | À livrer |
| Paramètres | Préférences détaillées, raccourcis et diagnostic IA | `options/` | À livrer |
| Paiement | Checkout contrôlé par serveur, abonnements et webhook | Supabase Edge Functions + Stripe | À documenter et livrer côté code |

## Définition de « terminée »

L’extension sera considérée comme terminée lorsque chaque commande proposée dans l’interface possède un comportement exploitable ou un état désactivé explicitement documenté, lorsque toutes les données personnelles et plans sont protégés par Row Level Security, lorsque les fonctions locales restent disponibles hors connexion, lorsque le nouvel onglet et les options fonctionnent, et lorsqu’un guide permet de reconstruire la configuration Supabase, Google, Stripe et Chrome Web Store sans hypothèse implicite.
