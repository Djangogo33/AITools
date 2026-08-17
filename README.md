# AITools 7.0

AITools 7 est une extension Chrome **Manifest V3** recréée comme espace de travail moderne, local-first et extensible. Elle réunit capture web, planification, organisation des onglets, recherche locale, IA intégrée à Chrome, données privées et services distants optionnels.

## Fonctionnalités livrées

| Espace | Fonctions |
|---|---|
| Accueil et Aujourd’hui | Accès rapides personnalisables, résumé de l’onglet, ajout de note, capture enrichie et tableau Aujourd’hui réunissant échéances, captures et concentration. |
| Recherche | Recherche Google par catégories, opérateurs avancés, historique local, raccourcis configurables et recherche transversale dans les données AITools. |
| Capture, boîte À traiter et tags | Une capture conserve son titre, son URL et ses tags, puis peut être transformée plus tard en note, tâche ou page à lire, ou être écartée. |
| Espaces de travail | Enregistrement de la fenêtre courante sous un nom, avec ses onglets web, puis restauration explicite ultérieure. |
| Tâches | Priorités, tâche active, échéances, rappels, tags, vues temporelles et récurrence quotidienne, hebdomadaire ou mensuelle avec génération de l’occurrence suivante. |
| Concentration | Pomodoro persistant, rappels de tâches, historique privé des sessions, statistiques locales sur sept jours et tâche active visible pendant une session. |
| Ne pas déranger | Application automatique du mode concentration sur une liste de domaines contrôlée depuis Préférences. |
| Onglets | Nettoyage des doublons, regroupement par domaine et règles locales d’organisation appliquées explicitement à la fenêtre courante. |
| Lecture | Ajout de pages, suivi lu/à lire, tags, reprise depuis le Nouvel onglet et synchronisation optionnelle. |
| IA locale | Résumé, traduction selon disponibilité Chrome, analyse stylistique indicative, palettes, contrôles YouTube et synthèse sourcée de jusqu’à huit onglets ouverts. |
| Commandes rapides | Palette de commandes depuis `Alt` + `Maj` + `K` ou `Ctrl`/`⌘` + `K` pour créer, capturer, enregistrer, lancer un Pomodoro et naviguer rapidement. |
| Données | Sauvegarde/restauration JSON, migration locale versionnée, export Markdown, CSV et diagnostic, avec exclusion stricte des jetons d’authentification. |
| Compte | Google OAuth PKCE, session renouvelée, profil et droits d’abonnement. |
| Synchronisation | Notes, tâches, lecture, espaces de travail et préférences peuvent être synchronisés volontairement avec Supabase après application de la migration SQL. Le fonctionnement local ne dépend pas du compte. |
| Rétrospective | Analyse hebdomadaire strictement locale des tâches, échéances, sessions Pomodoro, domaines déjà enregistrés et état de synchronisation. |
| Facturation | Checkout Stripe, portail client et synchronisation de plan par webhook Edge sécurisé. |

## Installation locale

Ouvrez `chrome://extensions`, activez **Mode développeur**, choisissez **Charger l’extension non empaquetée**, puis sélectionnez le dossier racine du dépôt. Après une modification du manifeste, utilisez **Recharger** sur la carte de l’extension.

L’archive de distribution ne contient que les fichiers exécutables de l’extension. Les documents, tests et dossiers `supabase/` restent dans le dépôt pour le développement et la configuration.

## Synchronisation et configuration de production

Le parcours local ne nécessite aucun compte. Les fonctions distantes — connexion Google, synchronisation Supabase et abonnement Stripe — nécessitent l’accès administrateur aux services concernés. Avant d’activer la synchronisation personnelle, exécutez la version à jour de [`supabase/schema.sql`](./supabase/schema.sql) dans Supabase : elle ajoute les tables `tasks`, `reading_items`, `workspaces` et `user_preferences`, les colonnes de récurrence et les politiques RLS qui limitent chaque ligne à son propriétaire authentifié.

Le guide détaillé est disponible dans [`CONFIGURATION_PRODUCTION.md`](./CONFIGURATION_PRODUCTION.md). La politique de confidentialité prête à publier est dans [`PRIVACY_POLICY.md`](./PRIVACY_POLICY.md), le dossier de soumission Chrome Web Store dans [`CHROME_WEB_STORE.md`](./CHROME_WEB_STORE.md) et le résultat du contrôle de livraison dans [`VERIFICATION_V7.md`](./VERIFICATION_V7.md). L’audit ciblé de fiabilité du résumé et des replis est disponible dans [`RELIABILITY_AUDIT_V7.md`](./RELIABILITY_AUDIT_V7.md). Les documents complémentaires sont [`AUTH_ARCHITECTURE.md`](./AUTH_ARCHITECTURE.md), [`FULL_FEATURE_ARCHITECTURE.md`](./FULL_FEATURE_ARCHITECTURE.md), [`supabase/functions/`](./supabase/functions) et [`EXTERNAL_CONFIGURATION_SOURCES.md`](./EXTERNAL_CONFIGURATION_SOURCES.md).

## Vérifications effectuées

Les contrôles automatisés couvrent la syntaxe de tous les modules JavaScript, le manifeste JSON, les chemins déclarés, la simulation OAuth PKCE, les préférences, les notes, la liste de lecture, les tâches récurrentes, la boîte À traiter, les migrations locales, l’IA locale, les analyses privées ainsi que la normalisation des tags et statistiques de concentration. Aucune clé Stripe secrète ni clé Supabase `service_role` n’est présente dans les modules client.

> L’analyse stylistique IA est une estimation heuristique. Elle ne prouve jamais l’origine humaine ou artificielle d’un texte.
