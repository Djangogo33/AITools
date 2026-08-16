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
| Compte | Connexion Google via Supabase Auth, profil, session renouvelée et affichage du plan |

## Installation locale

Ouvrez `chrome://extensions`, activez le **mode développeur**, cliquez sur **Charger l’extension non empaquetée**, puis sélectionnez le dossier racine du dépôt. Le popup est déclaré dans `popup/index.html` et le service worker dans `background/service-worker.js`.

## Architecture

Le manifeste est volontairement limité aux permissions nécessaires. Le popup utilise des modules ES natifs. Le service worker gère les alarmes et les actions globales sur les onglets. Le script de contenu est autonome et reçoit uniquement des messages ciblés afin d’extraire le texte ou d’anonymiser le contenu visible. Les préférences et les notes sont centralisées dans `shared/constants.js`.

Le fonctionnement local ne nécessite aucun compte. Lorsqu’il est configuré, le module Supabase ajoute une connexion Google via OAuth PKCE, une session renouvelée, un profil protégé par RLS et la lecture du plan utilisateur. Consultez [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) pour activer ce parcours et [`AUTH_ARCHITECTURE.md`](./AUTH_ARCHITECTURE.md) pour ses garanties de sécurité.

## Vérifications effectuées

La syntaxe des trois fichiers JavaScript a été vérifiée avec Node.js. Le manifeste a été parsé comme JSON et chaque chemin déclaré dans le manifeste a été contrôlé. Le popup a également été ouvert en local pour une vérification visuelle de la hiérarchie, de la navigation et du thème sombre.

## Limites connues de cette première base

Le résumé est volontairement local et heuristique : il extrait les premières phrases lisibles de la page. L’intégration Supabase couvre désormais l’identité et le profil ; la synchronisation des notes, la détection IA, la traduction, les outils PDF et le nouvel onglet restent des modules distincts à réintégrer ultérieurement.
