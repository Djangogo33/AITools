# Architecture des fonctionnalités étendues

## Principes

Les modules restent **local-first**, sans clé secrète embarquée, et leurs données sont stockées sous le préfixe `aitools.`. La synchronisation Supabase est volontaire, déclenchée par l’utilisateur ou à l’ouverture des interfaces ; elle ne bloque jamais l’usage hors connexion. Les automatisations de navigateur sont déterministes, exécutées par le service worker Manifest V3 et contrôlables dans les préférences.

## Contrats de données

| Domaine | Stockage local | Évolution compatible |
|---|---|---|
| Notes | `aitools.notes*` et notes de compte | Ajout facultatif de `tags`, `sourceUrl` et `sourceTitle`. |
| Tâches | `aitools.tasks` | Ajout facultatif de `tags`, `dueAt`, `reminderAt`, `completedAt` et `sourceUrl`. |
| Lecture | `aitools.reading-list` | Ajout facultatif de `tags`, `savedFrom` et `updatedAt`. |
| Sessions | `aitools.workspaces` | Liste nommée d’onglets HTTP(S), avec groupe, titre et date de capture. |
| Règles | `aitools.tab-rules` | Domaines, couleur de groupe, exécution contrôlée et activation explicite. |
| Statistiques | `aitools.focus-history` | Sessions Pomodoro terminées, sans contenu de page ni donnée d’authentification. |

## Modules partagés

| Service | Responsabilité |
|---|---|
| `tags-service.js` | Normaliser les tags, extraire les suggestions et filtrer par tag. |
| `unified-search-service.js` | Interroger localement notes, tâches, pages sauvegardées et espaces de travail. |
| `workspaces-service.js` | Capturer, lister, restaurer et supprimer des espaces d’onglets. |
| `focus-service.js` | Enregistrer les sessions terminées, produire les statistiques et gérer le mode Ne pas déranger. |
| `export-service.js` | Générer Markdown et CSV depuis les éléments locaux ; ne jamais exporter une session d’authentification. |
| `sync-service.js` | Synchroniser de manière optionnelle les tâches et pages à lire du compte Supabase, avec repli local. |

## Limites de sécurité

Les importations filtrent les URL hors HTTP(S), limitent les tailles de fichier et ignorent systématiquement `aitools.auth.*`. Les règles d’onglets ne ferment ni ne déplacent des onglets épinglés, les onglets internes de Chrome ou les pages sans URL valide. L’assistant de recherche ne lit que les onglets que l’utilisateur déclenche explicitement ou les onglets sélectionnés dans son interface.
