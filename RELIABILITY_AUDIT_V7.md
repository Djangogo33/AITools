# Audit de fiabilité AITools 7.0

## Constat initial

Le résumé n’était pas suffisamment fiable dans sa forme initiale. Lorsque les APIs IA de Chrome n’étaient pas disponibles, le repli renvoyait simplement les premières phrases du contenu. Ce comportement pouvait omettre les idées importantes, conserver du bruit de navigation et donner l’impression d’un résumé alors qu’il s’agissait d’une troncature.

Plusieurs actions validaient également l’interface sans vérifier systématiquement la réponse du service worker ou du script de contenu. Une erreur pouvait donc être affichée comme une réussite silencieuse, notamment pour certaines actions de page, le Pomodoro du Nouvel onglet et la synchronisation personnelle.

## Corrections appliquées

Le moteur IA utilise désormais une cascade explicite. Il tente d’abord le `Summarizer` natif de Chrome, puis le `LanguageModel` lorsque ces APIs sont disponibles. Les erreurs d’initialisation, de téléchargement de modèle ou de génération sont interceptées et déclenchent un repli extractif déterministe. Le moteur et son état sont affichés comme `summarizer-api`, `prompt-api` ou `heuristique-extractif`, afin que le résultat ne soit pas présenté comme une génération IA lorsque ce n’est pas le cas.

Le repli extractif découpe les paragraphes et phrases, retire les marqueurs de liste, calcule un score simple combinant position, longueur et récurrence lexicale, sélectionne plusieurs idées puis les remet dans leur ordre original. Il ne prétend pas produire une paraphrase sémantique : il conserve des phrases présentes dans le texte source. Les textes vides, trop courts ou les réponses IA vides sont désormais traités explicitement.

L’extraction de contenu de page choisit le bloc `article`, `main` ou `[role="main"]` le plus substantiel. À défaut, elle retire scripts, styles, navigation, en-têtes, pieds de page, barres latérales et bannières de cookies d’une copie temporaire du document. Les titres, paragraphes, listes et citations sont séparés avant le résumé, ce qui évite les sorties collées entre titre et corps de texte.

Les actions du popup vérifient désormais `response.ok` et refusent un résumé vide. Le Nouvel onglet signale les erreurs du Pomodoro au lieu de rafraîchir silencieusement un état supposé valide. Les Préférences tolèrent une réponse de synchronisation partielle et affichent l’erreur réelle lorsqu’une synchronisation échoue. Le diagnostic IA utilise les méthodes `availability()` réellement présentes au lieu de supposer qu’une API partiellement exposée est disponible.

## Vérifications effectuées

| Contrôle | Résultat |
| --- | --- |
| Test du repli extractif sur texte court et texte long | Réussi |
| Test d’échec de création du `Summarizer` | Repli extractif réussi |
| Test d’échec de création du `LanguageModel` | Repli extractif réussi |
| Test du résumé par script de contenu sur Chromium | Réussi, sortie en points lisible |
| Test de capture, résumé et temps de lecture sur `example.com` | Réussi |
| Test du popup et de ses routes locales | Réussi sans exception JavaScript |
| Test du Pomodoro démarrage puis remise à zéro | Réussi |
| Test du lanceur de commandes et de la navigation des vues | Réussi |
| Test du Nouvel onglet et des Préférences | Réussi |
| Suite des simulations locales et syntaxe JavaScript | Réussie |
| Archive Manifest V3 | Intègre, SHA-256 `e4b47ebe5cedb6c0a9ce085e91c9ba7636e0d94817b553c89e3f54297616d5d0` |

## Limites à conserver

Un résumé extractif déterministe est plus transparent mais moins naturel qu’une véritable synthèse sémantique. Les APIs IA natives restent dépendantes de la version de Chrome, de la disponibilité du modèle et du matériel de la machine. Même avec une API disponible, une sortie générative doit être relue pour les usages importants.

La synchronisation Supabase et la facturation Stripe restent dépendantes du déploiement distant décrit dans `CONFIGURATION_PRODUCTION.md`. Cet audit valide les chemins locaux et les erreurs de configuration, mais ne peut pas transformer une table ou une fonction Edge non déployée en service opérationnel.
