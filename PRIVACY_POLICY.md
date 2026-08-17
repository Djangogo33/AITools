# Politique de confidentialité d’AITools

**Dernière mise à jour : 17 août 2026**

AITools est un espace de travail personnel pour Chrome. Son fonctionnement est **local-first** : les notes, tâches, listes de lecture, captures, espaces de travail, préférences et statistiques de concentration sont conservés dans le stockage local du navigateur par défaut.

## Données traitées

AITools traite les données que vous choisissez d’enregistrer, notamment le texte d’une sélection ou d’une page capturée, les URL et titres associés, les notes, tâches, tags, échéances, rappels, éléments de lecture et espaces de travail. L’extension traite aussi les informations de l’onglet actif lorsque vous déclenchez une action qui en a besoin, par exemple enregistrer une page, calculer un temps de lecture, regrouper des onglets ou appliquer un outil de page.

Lorsque vous vous connectez volontairement, AITools traite votre identité de connexion, telle que le nom, l’adresse e-mail et l’avatar fournis par le fournisseur d’identité. Cette information sert à afficher votre compte et à synchroniser les données que vous choisissez de synchroniser. Les paiements sont réalisés sur les pages Stripe ; AITools ne collecte ni ne stocke vos numéros de carte bancaire.

## Finalités et partage

Les données locales servent uniquement aux fonctions que vous activez dans AITools. Aucune donnée de navigation, capture, note ou tâche n’est vendue, utilisée pour de la publicité ciblée, ni transmise à des courtiers en données.

La synchronisation distante est optionnelle. Après connexion et action volontaire de synchronisation, les notes, tâches, éléments de lecture, espaces de travail et préférences concernés sont transmis par HTTPS à votre projet Supabase afin de les retrouver sur vos appareils. L’authentification peut utiliser Google OAuth via Supabase. Stripe intervient uniquement si vous ouvrez volontairement son parcours de paiement ou son portail client.

Les fonctionnalités IA intégrées du navigateur sont sollicitées uniquement à votre demande. Lorsqu’une API IA locale de Chrome est disponible, le traitement est effectué par le navigateur. Les capacités et transferts éventuels d’une API de navigateur restent soumis aux paramètres et politiques de Chrome.

## Conservation, contrôle et sécurité

Vous pouvez supprimer vos données locales depuis AITools ou réinitialiser le stockage local dans les préférences. Les suppressions d’éléments synchronisés sont propagées lors de la prochaine synchronisation volontaire. Vous pouvez exporter vos données locales et votre journal de diagnostic. Les jetons de session, secrets et données de paiement ne sont pas inclus dans les exports.

Les échanges avec Supabase et Stripe utilisent HTTPS. Les secrets côté serveur, tels qu’une clé `service_role` Supabase, une clé Stripe secrète ou un secret de webhook, ne sont jamais inclus dans l’extension distribuée.

## Contact

Pour toute question relative à la confidentialité, utilisez le canal de support indiqué dans la fiche Chrome Web Store d’AITools.

> L’utilisation par AITools des informations reçues depuis les API Google respecte la [Politique relative aux données utilisateur du Chrome Web Store](https://developer.chrome.com/docs/webstore/program-policies/policies), y compris les exigences d’utilisation limitée.[1]

## Références

[1] [Chrome Web Store Developer Program Policies — confidentialité et exigences d’utilisation limitée](https://developer.chrome.com/docs/webstore/program-policies/policies)

[2] [Chrome Web Store — FAQ données utilisateur et traitement local](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)
