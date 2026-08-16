# Configuration Supabase et Google

La partie code de l’authentification est prête, mais un administrateur du projet Supabase doit effectuer les réglages ci-dessous avant le premier test. Ces opérations ne sont pas automatisées car elles modifient les fournisseurs d’identité, les URL autorisées et les règles de sécurité du projet.

## 1. Créer les tables sécurisées

Ouvrez le **SQL Editor** du projet Supabase `yvtukwaepqqsvacbbyou`, puis exécutez le contenu de [`supabase/schema.sql`](./supabase/schema.sql). Cette migration crée `public.profiles` et `public.subscriptions`, active Row Level Security, ajoute le profil automatique à chaque nouvel utilisateur et interdit aux clients de modifier un abonnement.

| Table | Rôle | Accès depuis l’extension |
|---|---|---|
| `profiles` | Nom affiché, avatar et dates utilisateur | Lecture, création et modification de son propre profil seulement |
| `subscriptions` | Plan, statut et date de fin | Lecture de son propre abonnement seulement |

> L’ancienne table publique `users` ne doit plus être utilisée par le popup. Les nouvelles identités proviennent de `auth.users` et sont reliées à `profiles.id`.

## 2. Configurer Google dans Supabase Auth

Dans Google Cloud, créez un client OAuth de type **Chrome Extension** et renseignez l’Item ID de l’extension publiée. Ensuite, dans **Supabase Dashboard → Authentication → Providers → Google**, activez Google et ajoutez ce client ID (ainsi que le secret demandé par Google). Supabase recommande spécifiquement ce type de client pour les extensions Chrome. [1]

## 3. Autoriser le callback de l’extension

Chargez une première fois l’extension dans Chrome puis récupérez son URL de retour en ouvrant la console du service worker et en exécutant :

```js
chrome.identity.getRedirectURL('auth')
```

Cette valeur a la forme :

```text
https://<extension-id>.chromiumapp.org/auth
```

Ajoutez **la valeur exacte** dans **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**. Les URL de redirection doivent figurer dans la liste d’autorisation de Supabase pour être acceptées. [2]

Pour les installations non empaquetées, Chrome génère un identifiant différent selon le profil ou la machine. Pour obtenir un identifiant stable lors des tests, conservez une clé publique d’extension (`key`) dans le manifeste ou testez l’extension empaquetée avec son ID définitif.

## 4. Vérifier la clé publique

`shared/supabase-config.js` contient l’URL actuelle du projet et sa clé publiable héritée de la version précédente. Cette clé est destinée au client. Elle ne remplace pas les politiques RLS et **ne doit jamais être remplacée par une clé `service_role`**.

## 5. Tester les parcours

Après rechargement de l’extension dans `chrome://extensions`, ouvrez **Préférences**, choisissez **Se connecter avec Google**, terminez le consentement puis vérifiez :

1. l’affichage du nom, de l’email et de l’avatar dans le popup ;
2. la création d’une ligne dans `auth.users` et `public.profiles` ;
3. le plan `FREE` tant qu’aucune ligne active n’existe dans `subscriptions` ;
4. la déconnexion, puis le retour à un mode local fonctionnel.

Les abonnements doivent être créés par un webhook de paiement exécuté côté serveur avec une clé de service. L’extension les lit mais ne peut ni les créer ni les modifier.

## Références

[1] [Supabase — Login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)

[2] [Supabase — Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
