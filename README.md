# AITools 8

**AITools** est une extension Chrome **Manifest V3** conçue comme un couteau suisse local-first. Son popup réunit six modules complémentaires pour agir rapidement sur la page ouverte, transformer du texte, organiser les onglets, explorer les médias, exploiter les capacités IA locales de Chrome et conserver un espace personnel de productivité.

> Les fonctionnalités essentielles restent disponibles sans compte. L’authentification Google et la synchronisation Supabase sont des services optionnels, activés explicitement par l’utilisateur.

## Les six modules

| Module | Finalité | Principales fonctions disponibles |
|---|---|---|
| **Page web** | Améliorer la consultation de l’onglet actif. | Résumé local avec repli heuristique, temps de lecture, mode lecture, filtre sombre, masquage des bannières de consentement et des résultats sponsorisés. |
| **Texte & données** | Transformer un contenu sans service distant. | Nettoyage, majuscules, minuscules, capitalisation, validation et mise en forme JSON, encodage/décodage URL et Base64, statistiques et copie. |
| **Onglets & navigateur** | Retrouver et remettre en ordre la fenêtre courante. | Recherche instantanée parmi les onglets, nettoyage des doublons, regroupement par domaine, copie des titres et URL, enregistrement et restauration d’espaces. |
| **Médias** | Identifier les ressources de la page sans les télécharger automatiquement. | Inventaire des images, vidéos et pistes audio accessibles sur la page, copie d’URL et palette locale déterministe liée au titre de la page. |
| **IA** | Utiliser les API IA intégrées à Chrome lorsqu’elles sont disponibles. | Résumé, traduction, détection de langue et analyse stylistique indicative, avec des replis locaux explicites lorsque l’API n’est pas disponible. |
| **Productivité** | Conserver un espace personnel au sein de l’extension. | Notes, tâches, boîte À traiter, liste de lecture, Pomodoro persistant, rappels, statistiques locales, recherche et rétrospective. |

Le lanceur de commandes est disponible avec `Alt` + `Maj` + `K` ou `Ctrl`/`⌘` + `K`. Il donne accès aux actions majeures sans traverser la navigation.

## Principes de conception

| Principe | Application dans AITools |
|---|---|
| **Local-first** | Les notes, tâches, préférences et résultats d’outils sont stockés localement par défaut. |
| **Contrôle explicite** | Les captures, synchronisations, restaurations d’onglets et actions sur la page sont déclenchées par l’utilisateur. |
| **Sans dépendance CDN** | L’interface n’utilise ni police distante ni bibliothèque chargée à l’exécution. |
| **Aucun secret distribué** | L’extension ne contient ni clé Stripe secrète ni clé Supabase `service_role`. |
| **Dégradation fiable** | Les API IA Chrome sont facultatives ; les fonctions proposent un repli local lorsqu’il est pertinent. |

## Installation locale

Ouvrez `chrome://extensions`, activez le **Mode développeur**, choisissez **Charger l’extension non empaquetée**, puis sélectionnez le dossier racine de ce dépôt. Après chaque modification du manifeste, utilisez **Recharger** depuis la carte de l’extension.

L’archive de distribution inclut uniquement les ressources exécutables de l’extension. Les tests, documents de configuration et migrations Supabase restent dans le dépôt de développement.

## Compte, synchronisation et facturation optionnels

Aucun compte n’est requis pour les six modules. Après une authentification Google facultative, l’utilisateur peut choisir de synchroniser ses notes, tâches, éléments de lecture, espaces de travail et préférences avec Supabase. Les politiques RLS limitent les données synchronisées au propriétaire authentifié.

Avant d’activer cette synchronisation, appliquez le schéma [`supabase/schema.sql`](./supabase/schema.sql) puis, pour une base déjà existante, la migration de reprise [`supabase/migrations/20260818_subscriptions_compatibility.sql`](./supabase/migrations/20260818_subscriptions_compatibility.sql). Les fonctions Edge Stripe restent à déployer côté Supabase avant de proposer un checkout ou un portail client.

La checklist opérationnelle ordonnée est dans [`FINALISATION_V8.md`](./FINALISATION_V8.md). Les procédures détaillées se trouvent dans [`CONFIGURATION_PRODUCTION.md`](./CONFIGURATION_PRODUCTION.md). Les documents de publication et de conformité sont [`PRIVACY_POLICY.md`](./PRIVACY_POLICY.md) et [`CHROME_WEB_STORE.md`](./CHROME_WEB_STORE.md). L’état de l’intégration distante est résumé dans [`SUPABASE_INTEGRATION_AUDIT_V7.md`](./SUPABASE_INTEGRATION_AUDIT_V7.md).

### Personnalisation des fonctionnalités

Dans **Préférences → Composer votre AITools**, chaque sous-fonction peut être activée ou désactivée individuellement. Le catalogue couvre les outils de page, les transformations de texte, les actions sur les onglets, les médias, chaque capacité IA, les briques de productivité, la recherche, les widgets du nouvel onglet et les services distants optionnels.

La désactivation masque l’outil dans le popup, le lanceur de commandes, le nouvel onglet ou les préférences concernées, et bloque également les routes persistantes correspondantes dans le service worker. Les données existantes ne sont jamais supprimées : il suffit de réactiver une fonctionnalité pour les retrouver. Le bouton **Tout réactiver** restaure le comportement par défaut.

### Destination du nouvel onglet

Dans **Préférences → Nouvel onglet**, choisissez l’une des destinations suivantes : le **tableau de bord AITools** (valeur par défaut), la page interne de **Nouvel onglet Chrome** ou la page d’accueil d’un moteur de recherche. Les moteurs proposés sont Google, Qwant, Brave Search, Bing, DuckDuckGo et Ecosia. Le choix est local au profil Chrome et prend effet au prochain onglet créé. Si la destination choisie est désactivée dans le catalogue, l’extension bascule sans boucle vers le nouvel onglet natif de Chrome.

## Vérification de développement

Les audits automatisés couvrent la syntaxe JavaScript, les services locaux, les préférences, les notes, les tâches récurrentes, la boîte À traiter, la lecture, les espaces de travail, l’IA locale, la synchronisation personnelle et les routes du service worker. Les audits Chromium valident également le rendu des six modules, le résumé de page, la transformation JSON et l’inventaire d’images, de vidéos et d’audios sur une fixture HTTP contrôlée.

```bash
cd /home/ubuntu/AITools
find background content newtab options popup shared -name '*.js' -print0 | xargs -0 -n1 node --check
for test in tests/*.test.mjs; do node "$test" || exit 1; done
node tests/supabase-readonly-health.mjs
```

Pour les audits Chromium, lancez d’abord l’instance de test avec l’extension chargée, puis exécutez `node tests/runtime-popup-audit.mjs`. Le test dédié aux médias nécessite en plus `node tests/fixture-server.mjs` et `node tests/runtime-media-audit.mjs`.

> L’analyse stylistique IA est une estimation heuristique. Elle ne permet pas d’établir l’origine humaine ou artificielle d’un texte.
