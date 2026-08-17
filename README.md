# AITools 6.0

AITools est une extension Chrome **Manifest V3** recréée comme espace de travail moderne, local-first et extensible. Elle réunit capture web, planification, organisation des onglets, recherche locale, IA intégrée à Chrome, données privées et services distants optionnels.

## Fonctionnalités livrées

| Espace | Fonctions |
|---|---|
| Accueil | Accès rapides personnalisables, résumé de l’onglet, ajout de note et capture enrichie de la page ou de la sélection active. |
| Recherche | Recherche Google par catégories, opérateurs avancés, historique local, raccourcis configurables et recherche transversale dans les données AITools. |
| Capture et tags | Notes, tâches, pages à lire et espaces de travail peuvent recevoir des tags normalisés ; une capture conserve également le titre et l’URL de sa source. |
| Espaces de travail | Enregistrement de la fenêtre courante sous un nom, avec ses onglets web, puis restauration explicite ultérieure. |
| Tâches | Priorités, tâche active, dates d’échéance, rappels locaux, tags et vues Toutes, Aujourd’hui, Cette semaine et En retard. |
| Concentration | Pomodoro persistant, rappels de tâches, historique privé des sessions, statistiques locales sur sept jours et tâche active visible pendant une session. |
| Ne pas déranger | Application automatique du mode concentration sur une liste de domaines contrôlée depuis Préférences. |
| Onglets | Nettoyage des doublons, regroupement par domaine et règles locales d’organisation appliquées explicitement à la fenêtre courante. |
| Lecture | Ajout de pages, suivi lu/à lire, tags, reprise depuis le Nouvel onglet et synchronisation optionnelle. |
| IA locale | Résumé, traduction selon disponibilité Chrome, analyse stylistique indicative, palettes, contrôles YouTube et synthèse sourcée de jusqu’à huit onglets ouverts. |
| Données | Sauvegarde/restauration JSON, export Markdown, export CSV et exclusion stricte des jetons d’authentification. |
| Compte | Google OAuth PKCE, session renouvelée, profil et droits d’abonnement. |
| Synchronisation | Notes, tâches et pages à lire peuvent être synchronisées volontairement avec Supabase après application de la migration SQL. Le fonctionnement local ne dépend pas du compte. |
| Facturation | Checkout Stripe, portail client et synchronisation de plan par webhook Edge sécurisé. |

## Installation locale

Ouvrez `chrome://extensions`, activez **Mode développeur**, choisissez **Charger l’extension non empaquetée**, puis sélectionnez le dossier racine du dépôt. Après une modification du manifeste, utilisez **Recharger** sur la carte de l’extension.

L’archive de distribution ne contient que les fichiers exécutables de l’extension. Les documents, tests et dossiers `supabase/` restent dans le dépôt pour le développement et la configuration.

## Synchronisation et configuration de production

Le parcours local ne nécessite aucun compte. Les fonctions distantes — connexion Google, synchronisation Supabase et abonnement Stripe — nécessitent l’accès administrateur aux services concernés. Avant d’activer la synchronisation de tâches et de lecture, exécutez la version à jour de [`supabase/schema.sql`](./supabase/schema.sql) dans Supabase : elle ajoute les tables `tasks` et `reading_items`, les colonnes de métadonnées aux notes et les politiques RLS qui limitent chaque ligne à son propriétaire authentifié.

Le guide détaillé est disponible dans [`CONFIGURATION_PRODUCTION.md`](./CONFIGURATION_PRODUCTION.md). Les documents complémentaires sont [`AUTH_ARCHITECTURE.md`](./AUTH_ARCHITECTURE.md), [`FULL_FEATURE_ARCHITECTURE.md`](./FULL_FEATURE_ARCHITECTURE.md), [`supabase/functions/`](./supabase/functions) et [`EXTERNAL_CONFIGURATION_SOURCES.md`](./EXTERNAL_CONFIGURATION_SOURCES.md).

## Vérifications effectuées

Les contrôles automatisés couvrent la syntaxe de tous les modules JavaScript, le manifeste JSON, les chemins déclarés, la simulation OAuth PKCE, les préférences, les notes, la liste de lecture, les tâches, l’IA locale ainsi que la normalisation des tags et statistiques de concentration. Aucune clé Stripe secrète ni clé Supabase `service_role` n’est présente dans les modules client.

> L’analyse stylistique IA est une estimation heuristique. Elle ne prouve jamais l’origine humaine ou artificielle d’un texte.
