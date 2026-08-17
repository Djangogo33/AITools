# AITools 5.2

AITools est une extension Chrome **Manifest V3** recréée depuis zéro comme espace de travail moderne, local-first et extensible. Elle réunit recherche avancée, organisation d’onglets, notes synchronisables, outils de lecture, IA locale Chrome, compte utilisateur et page Nouvel onglet.

## Fonctionnalités livrées

| Espace | Fonctions |
|---|---|
| Accueil | Accès rapides personnalisables, résumé de l’onglet et création de note |
| Recherche | Catégories Google, opérateurs avancés, historique local et raccourcis configurables |
| Outils | Anonymisation, temps de lecture, mode concentration, surlignage, impression PDF, doublons, groupes par domaine et Pomodoro persistant |
| IA | Résumé, traduction locale si Chrome le permet, analyse stylistique avec avertissement, palettes et contrôles YouTube |
| Notes | Stockage local, import des notes existantes, synchronisation Supabase résiliente, file de suppressions hors ligne et protection contre les doublons historiques |
| Liste de lecture | Ajout de la page active, suivi lu/à lire, ouverture et suppression locale ; reprise des pages à lire directement depuis le Nouvel onglet |
| Données locales | Export et restauration JSON des préférences, notes, listes et minuteur, sans jeton de session ; validation de format et confirmation avant remplacement |
| Compte | Google OAuth PKCE, session renouvelée, profil et droits d’abonnement |
| Facturation | Checkout Stripe, portail client et synchronisation de plan par webhook Edge sécurisé |
| Nouvel onglet | Recherche, raccourcis, dernières notes, état de compte et Pomodoro |
| Options | Apparence, confidentialité de navigation, synchronisation, export/réinitialisation locale et diagnostic IA |
| Raccourcis clavier | `Alt` + `Shift` + `P` pour le Pomodoro ; `Alt` + `Shift` + `R` pour ajouter la page active à la liste de lecture ; durée configurable de 5 à 120 minutes |
| Accessibilité | Indicateurs de focus visibles sur les contrôles interactifs du popup, du Nouvel onglet et des préférences |

## Installation locale

Ouvrez `chrome://extensions`, activez **Mode développeur**, choisissez **Charger l’extension non empaquetée**, puis sélectionnez le dossier racine du dépôt. Après toute modification de `manifest.json`, utilisez **Recharger** sur la carte de l’extension.

## Configuration complète de production

Le parcours local ne nécessite aucun compte. Les services distants — connexion Google, synchronisation des notes, abonnements Stripe et publication — nécessitent une configuration d’administrateur. Suivez précisément [`CONFIGURATION_PRODUCTION.md`](./CONFIGURATION_PRODUCTION.md) avant de considérer ces fonctions actives.

Les documents complémentaires sont :

- [`AUTH_ARCHITECTURE.md`](./AUTH_ARCHITECTURE.md), qui décrit le flux OAuth PKCE et les limites de sécurité ;
- [`supabase/schema.sql`](./supabase/schema.sql), la migration de profils, abonnements, politiques RLS et notes ;
- [`supabase/functions/`](./supabase/functions), les fonctions Edge Stripe à déployer ;
- [`FEATURE_MATRIX.md`](./FEATURE_MATRIX.md), l’inventaire de parité fonctionnelle ;
- [`EXTERNAL_CONFIGURATION_SOURCES.md`](./EXTERNAL_CONFIGURATION_SOURCES.md), les références officielles de conception.

## Vérifications effectuées

Les contrôles automatisés couvrent la syntaxe des modules JavaScript, le manifeste JSON, les chemins déclarés, la simulation OAuth PKCE, la synchronisation de notes et les repli IA. Aucune clé Stripe secrète ni clé Supabase `service_role` n’est présente dans les modules client. La validation de typage des fonctions Edge reste à effectuer par la CLI Supabase/Deno lors du déploiement réel, car Deno n’est pas installé dans cet environnement.

> L’analyse de probabilité IA est une estimation stylistique et ne peut pas prouver l’origine humaine ou artificielle d’un texte.
