# AITools — Architecture cible

## Objectif

Recréer l’extension depuis zéro avec une base Manifest V3 minimale, lisible et modulaire. La nouvelle version privilégie une interface popup compacte et moderne, des permissions limitées, une séparation claire entre l’interface, la logique métier et les communications avec Chrome, ainsi qu’une migration progressive des fonctionnalités utiles de l’ancienne version.

## Périmètre initial

La première version conserve les fonctions qui donnent une valeur immédiate dans le popup : accès rapides, recherche Google, bascule du thème sombre, Pomodoro, notes locales, résumé de la page, anonymisation locale et nettoyage des onglets. Les fonctions dépendantes d’un service distant ou d’une authentification seront isolées derrière des adaptateurs afin de pouvoir être réintégrées sans contaminer le cœur de l’extension.

| Zone | Responsabilité | Décision cible |
|---|---|---|
| `manifest.json` | Déclaration Chrome | Manifest V3, permissions minimales, popup et service worker |
| `popup/` | Interface utilisateur | HTML/CSS/JS natifs, composants réutilisables, aucun état implicite |
| `background/` | Tâches persistantes | Service worker pour messages, alarmes Pomodoro et actions d’onglets |
| `content/` | Interaction avec la page | Extraction de texte, résumé et anonymisation à la demande |
| `shared/` | Contrats communs | Clés de stockage, types de messages et utilitaires purs |
| `options/` | Préférences | Page dédiée ajoutée après stabilisation du popup |
| `assets/` | Icônes et identité | Ressources locales, sans dépendance distante obligatoire |

## Principes d’implémentation

Le stockage sera centralisé dans `chrome.storage.local`, avec des valeurs par défaut explicites et des mises à jour partielles. Les échanges entre le popup, le service worker et les scripts de contenu passeront par des messages typés par un champ `type`. Les opérations qui peuvent échouer — onglet non compatible, permission refusée, absence de contenu — retourneront des erreurs lisibles dans l’interface plutôt que de provoquer une exception silencieuse.

Le design visuel adoptera une direction **dark-first premium**, avec une palette indigo/cyan, une navigation latérale compacte, des cartes avec hiérarchie claire, des états actifs visibles et une largeur adaptée au popup Chrome. Le mode clair restera disponible. Aucun framework ou CDN ne sera requis au runtime.

## Migration

Les anciens fichiers restent consultables dans l’historique Git, mais la nouvelle implémentation ne les importera pas directement. Chaque fonctionnalité sera recréée dans son propre module, puis validée indépendamment. Les intégrations Supabase, OAuth et Prompt API seront traitées comme des extensions optionnelles après validation du socle local.

## Critères de réussite

La nouvelle extension doit être chargeable en mode développeur sans étape de compilation complexe, ne pas demander de permission superflue, fonctionner avec un popup vide de toute erreur JavaScript et préserver les données locales de l’utilisateur lorsqu’une clé de stockage équivalente existe déjà. Les fonctionnalités essentielles doivent rester utilisables depuis une navigation clavier et fournir un retour d’état après chaque action.
