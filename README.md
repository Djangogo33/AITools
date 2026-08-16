# AITools

AITools est une extension Chrome Manifest V3 conçue comme un espace de travail local pour rechercher, synthétiser et organiser le web. Cette version 5.0 a été recréée depuis zéro avec une architecture modulaire et une interface popup dark-first.

## Fonctionnalités

| Espace | Fonctions |
|---|---|
| Accueil | Accès rapides vers ChatGPT, Perplexity, WhatsApp et GitHub ; résumé de l’onglet ; création rapide d’une note |
| Recherche | Recherche Google et opérateurs avancés pour les domaines, les PDF, la récence, les images et l’exclusion de mots |
| Outils | Résumé local de la page, anonymisation des emails/téléphones/IP, nettoyage des onglets doublons et Pomodoro |
| Notes | Notes persistantes dans `chrome.storage.local`, suppression individuelle et compteur dans la navigation |
| Préférences | Thème sombre/clair, notifications et mode compact |

## Installation locale

Ouvrez `chrome://extensions`, activez le **mode développeur**, cliquez sur **Charger l’extension non empaquetée**, puis sélectionnez le dossier racine du dépôt. Le popup est déclaré dans `popup/index.html` et le service worker dans `background/service-worker.js`.

## Architecture

Le manifeste est volontairement limité aux permissions nécessaires. Le popup utilise des modules ES natifs. Le service worker gère les alarmes et les actions globales sur les onglets. Le script de contenu est autonome et reçoit uniquement des messages ciblés afin d’extraire le texte ou d’anonymiser le contenu visible. Les préférences et les notes sont centralisées dans `shared/constants.js`.

Le fonctionnement local ne nécessite aucune clé API, aucun serveur et aucun CDN au runtime. Les intégrations distantes pourront être ajoutées ultérieurement derrière des adaptateurs indépendants.

## Vérifications effectuées

La syntaxe des trois fichiers JavaScript a été vérifiée avec Node.js. Le manifeste a été parsé comme JSON et chaque chemin déclaré dans le manifeste a été contrôlé. Le popup a également été ouvert en local pour une vérification visuelle de la hiérarchie, de la navigation et du thème sombre.

## Limites connues de cette première base

Le résumé est volontairement local et heuristique : il extrait les premières phrases lisibles de la page. Les anciennes intégrations Supabase, OAuth, Prompt API, détection IA, traduction, PDF et nouvel onglet ne sont pas réintroduites dans le socle initial ; elles pourront être ajoutées proprement comme modules indépendants après validation de cette base.
