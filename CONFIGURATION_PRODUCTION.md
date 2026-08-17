# AITools 7 — Configuration de production

**Auteur : Manus AI**
**Portée :** ce guide active l’authentification Google, la synchronisation des notes, les plans payants Stripe, les capacités IA locales de Chrome et la publication de l’extension. Les fonctionnalités locales restent utilisables sans ces services, mais la connexion, la synchronisation et la facturation ne seront pas actives avant la fin de cette procédure.

> Ne placez jamais de clé `service_role`, de clé secrète Stripe ou de secret de webhook dans `manifest.json`, dans le popup ou dans un fichier JavaScript chargé par l’extension. Le client ne conserve qu’une clé Supabase **publishable** ; les secrets sont réservés aux fonctions Edge.

## 1. Préparer une identité d’extension stable

Chargez une première fois l’extension dans Chrome, depuis `chrome://extensions`, en activant **Mode développeur**, puis en choisissant **Charger l’extension non empaquetée** et le dossier racine `AITools`. Relevez l’**ID de l’extension** affiché sur sa carte. Pour une publication, l’ID définitif est attribué par le Chrome Web Store ; après la première soumission, remplacez l’ID de test par cet ID dans les configurations OAuth ci-dessous.

Dans la console du service worker de l’extension, exécutez ensuite :

```js
chrome.identity.getRedirectURL('auth')
```

Copiez exactement l’URL retournée. Elle a la forme :

```text
https://<extension-id>.chromiumapp.org/auth
```

Cette URL ne doit pas être inventée, tronquée ou remplacée par l’URL du popup. Elle est l’URL de retour utilisée par `chrome.identity.launchWebAuthFlow`.

| Environnement | ID à utiliser | URL à autoriser |
|---|---|---|
| Développement non empaqueté | ID de la carte dans `chrome://extensions` | URL retournée par `chrome.identity.getRedirectURL('auth')` |
| Préproduction empaquetée | ID de l’extension empaquetée | URL retournée par la même commande |
| Chrome Web Store | ID affiché dans la fiche Web Store | URL calculée avec cet ID final |

## 2. Configurer Supabase

### 2.1 Vérifier la configuration publique de l’extension

Ouvrez `shared/supabase-config.js`. Confirmez que `url` pointe vers le projet Supabase attendu et que `publishableKey` contient la clé publique actuelle du projet. Les valeurs sont disponibles dans **Supabase Dashboard → Project Settings → API**. Une clé publique est conçue pour être distribuée côté client ; la protection des données repose sur RLS et sur les jetons utilisateur, pas sur le secret de cette clé. [1]

Si vous changez de projet, remplacez uniquement ces deux valeurs publiques :

```js
export const SUPABASE_CONFIG = {
  url: 'https://<project-ref>.supabase.co',
  publishableKey: 'sb_publishable_<votre-cle-publique>'
};
```

### 2.2 Créer le schéma, les politiques et les données synchronisées

Dans **Supabase Dashboard → SQL Editor**, ouvrez une nouvelle requête, collez intégralement le contenu de [`supabase/schema.sql`](./supabase/schema.sql), puis choisissez **Run**. Cette migration crée les tables `profiles`, `subscriptions`, `notes`, `tasks`, `reading_items`, `workspaces` et `user_preferences`, déclenche la création du profil et active les politiques RLS. Elle est idempotente : les `create table if not exists` et `alter table ... if not exists` permettent de la relancer pour appliquer les évolutions v7.

Vérifiez ensuite dans **Table Editor** les résultats suivants :

| Élément | Vérification attendue |
|---|---|
| `public.profiles` | RLS activée ; un utilisateur ne lit et ne modifie que son propre profil |
| `public.notes` | RLS activée ; l’utilisateur ne lit, crée, modifie et supprime que ses notes |
| `public.subscriptions` | RLS activée ; le client peut lire son abonnement mais ne peut pas créer ou modifier un plan |
| `public.tasks` | RLS activée ; champs `recurrence` et `recurrence_series_id` présents pour les tâches récurrentes |
| `public.reading_items` | RLS activée ; chaque élément appartient au compte connecté |
| `public.workspaces` | RLS activée ; les onglets enregistrés sont stockés dans `tabs` au format JSONB |
| `public.user_preferences` | RLS activée ; une ligne par utilisateur, avec les préférences non sensibles dans `settings` JSONB |
| `handle_new_user()` | Fonction présente ; déclencheur exécuté après la création d’un utilisateur Auth |
| `subscriptions_provider_subscription_unique` | Index unique présent ; un webhook Stripe ne crée pas de doublon pour le même abonnement |

Dans **Project Settings → API → Data API**, assurez-vous que le schéma `public` et les tables nécessaires sont accessibles. Les politiques RLS restent obligatoires avant d’accorder des droits au rôle `authenticated`. [1]

### 2.3 Vérifier la synchronisation personnelle v7

Après connexion dans AITools, ouvrez **Préférences → Données → Synchroniser mon espace**. Cette action synchronise volontairement les tâches, les éléments de lecture, les espaces de travail et les préférences non sensibles. Les notes disposent de leur propre bouton de synchronisation. Vérifiez que l’indicateur affiche une date de réussite et que les tables concernées contiennent uniquement des lignes avec votre `user_id`.

La résolution de conflit est déterminée par `updated_at` : la version la plus récente d’un même élément est conservée. Les suppressions locales sont mises en attente puis propagées lors de la synchronisation suivante. Le mode local continue de fonctionner même si la connexion ou Supabase est indisponible.

**Ne synchronisez pas** les jetons, secrets, sessions d’authentification, clés Stripe, clés Supabase privées ou diagnostics contenant des informations de support. AITools ne les place pas dans `user_preferences`.

### 2.4 Configurer les URL de redirection Supabase

Ouvrez **Authentication → URL Configuration**.

1. Définissez **Site URL** sur le domaine HTTPS public qui affichera vos pages de confirmation de paiement, par exemple `https://app.example.com`.
2. Ajoutez dans **Redirect URLs** l’URL exacte produite par `chrome.identity.getRedirectURL('auth')`.
3. Ajoutez aussi, si vous les utilisez, les pages de retour Stripe : `https://app.example.com/billing/success` et `https://app.example.com/billing/cancel`.
4. En production, utilisez des URL exactes plutôt qu’un wildcard large. Supabase recommande les chemins exacts pour la production. [2]

## 3. Configurer Google OAuth

Supabase documente spécifiquement le type de client **Chrome Extension** pour Google OAuth. [3]

1. Ouvrez [Google Cloud Console](https://console.cloud.google.com/), créez ou choisissez le projet dédié à AITools.
2. Dans **Google Auth Platform → Branding**, renseignez le nom de l’application, l’email de support, l’URL de politique de confidentialité et, si nécessaire, les domaines autorisés.
3. Dans **Data Access**, conservez les scopes minimaux : `openid`, `.../auth/userinfo.email` et `.../auth/userinfo.profile`. N’ajoutez pas de scopes Google sensibles sans besoin réel. [3]
4. Dans **Clients**, choisissez **Create client**, puis le type **Chrome Extension**.
5. Collez l’Item ID de l’extension correspondant à l’environnement concerné. Conservez le client ID généré.
6. Dans **Supabase Dashboard → Authentication → Providers → Google**, activez Google et collez ce **Client ID** dans le champ prévu. Si le tableau de bord demande un secret, utilisez uniquement le secret généré pour ce client ; ne le mettez jamais dans l’extension.
7. Dans la même page, relevez l’URL de callback Supabase affichée, généralement :

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

8. Si Google Cloud demande une URI de redirection autorisée, ajoutez cette URL de callback Supabase. Le callback fournisseur est Supabase ; l’URL `chromiumapp.org` est la redirection finale autorisée par Supabase.
9. Dans Supabase, ajoutez l’URL `chromiumapp.org/auth` de l’étape 1 à **Authentication → URL Configuration → Redirect URLs**.

Testez depuis le popup : **Préférences → Se connecter avec Google**. Après consentement, vérifiez l’apparition d’une ligne dans `auth.users`, dans `public.profiles`, puis l’affichage du nom et de l’email dans AITools.

## 4. Configurer Stripe pour les plans PRO et MAX

Les abonnements Stripe sont synchronisés par webhook côté serveur ; le popup ne modifie jamais directement la table `subscriptions`. Les transitions de statut Stripe sont asynchrones et doivent être suivies par des événements de webhook. [4]

### 4.1 Créer produits et prix

Dans **Stripe Dashboard → Product catalog** :

1. Créez un produit **AITools PRO** et un prix récurrent, mensuel ou annuel selon votre offre.
2. Créez un produit **AITools MAX** et son prix récurrent.
3. Copiez les deux IDs de prix, de la forme `price_...`.
4. Dans **Settings → Billing → Customer portal**, activez le portail client et autorisez au minimum la mise à jour du moyen de paiement et l’annulation. Activez les changements de plan uniquement si vous avez défini leurs règles de prorata.

### 4.2 Déployer les fonctions Edge

Installez et authentifiez la CLI Supabase sur votre poste, puis, depuis la racine du dépôt :

```bash
supabase login
supabase link --project-ref <project-ref>
supabase functions deploy create-checkout
supabase functions deploy create-portal
supabase functions deploy stripe-webhook --no-verify-jwt
```

Les deux premières fonctions conservent la vérification JWT par défaut. La fonction `stripe-webhook` reçoit Stripe, pas un utilisateur Supabase, et doit donc être déployée avec `--no-verify-jwt` ; la signature Stripe reste alors la protection obligatoire du endpoint.

Dans **Supabase Dashboard → Edge Functions → Secrets**, créez les secrets suivants :

| Secret | Valeur attendue |
|---|---|
| `STRIPE_SECRET_KEY` | Clé secrète Stripe, par exemple `sk_live_...` ou `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Secret `whsec_...` de l’endpoint webhook Stripe |
| `STRIPE_PRICE_PRO` | ID du prix Stripe PRO, `price_...` |
| `STRIPE_PRICE_MAX` | ID du prix Stripe MAX, `price_...` |
| `BILLING_SUCCESS_URL` | URL HTTPS réelle de confirmation, par exemple `https://app.example.com/billing/success` |
| `BILLING_CANCEL_URL` | URL HTTPS réelle d’annulation, par exemple `https://app.example.com/billing/cancel` |
| `BILLING_PORTAL_RETURN_URL` | URL HTTPS où ramener l’utilisateur après le portail Stripe |
| `SUPABASE_URL` | URL de votre projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé de service Supabase, strictement réservée aux fonctions Edge |

> Ne renseignez aucun de ces secrets dans `shared/supabase-config.js`, dans le manifeste, ni dans les outils de développement du navigateur.

### 4.3 Créer et vérifier le webhook Stripe

Dans **Stripe Dashboard → Developers/Workbench → Webhooks**, créez un endpoint :

```text
https://<project-ref>.supabase.co/functions/v1/stripe-webhook
```

Sélectionnez les événements suivants :

```text
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.paid
invoice.payment_failed
```

Copiez le secret de signature `whsec_...` dans `STRIPE_WEBHOOK_SECRET`, puis redéployez la fonction si nécessaire. Stripe demande un endpoint HTTPS et recommande de vérifier chaque événement avec le corps brut et l’en-tête `Stripe-Signature`. [5]

Effectuez ensuite une transaction en **mode test** : connectez-vous dans AITools, cliquez sur **Passer à PRO**, terminez le Checkout Stripe avec une carte de test Stripe, puis contrôlez, dans cet ordre :

1. une session Checkout est créée dans Stripe ;
2. l’événement `checkout.session.completed` est reçu dans Stripe ;
3. `customer.subscription.created` ou `customer.subscription.updated` est reçu ;
4. une ligne `subscriptions` apparaît ou est mise à jour dans Supabase ;
5. après **Actualiser le compte** dans AITools, le plan devient `PRO` ;
6. le bouton **Gérer l’abonnement** ouvre le portail Stripe.

## 5. Activer les capacités IA locales de Chrome

AITools fonctionne sans clé IA distante. La page IA détecte les API intégrées disponibles et emploie, selon le navigateur : Summarizer API, Translator API, Language Detector API ou Prompt API ; sinon elle utilise des solutions déterministes limitées.

Les APIs Summarizer, Translator et Language Detector sont annoncées dans Chrome 138 pour les extensions ; Prompt API est également disponible dans les extensions Chrome à partir de Chrome 138. [6] Les modèles locaux requièrent une machine compatible, au moins 22 Go libres pour les modèles concernés, et une connexion non limitée au premier téléchargement ; après téléchargement, l’exécution locale ne transmet pas le texte à Google ou à un tiers. [7]

Pour tester :

1. Utilisez Chrome 138 ou une version plus récente sur ordinateur.
2. Ouvrez `chrome://on-device-internals` pour observer l’état du modèle.
3. Ouvrez AITools → **IA** puis consultez le diagnostic, ou ouvrez **Préférences → IA intégrée à Chrome**.
4. Lancez un résumé ou une traduction avec un clic utilisateur ; ce geste peut démarrer le téléchargement local si Chrome le propose.
5. Si l’API est indisponible, utilisez les fonctions de repli et ne promettez pas la traduction comme disponible sur tous les appareils.

## 6. Vérification de l’extension avant publication

Après chaque changement de manifeste, ouvrez `chrome://extensions` puis cliquez sur **Recharger**. Testez systématiquement les parcours suivants.

| Parcours | Résultat attendu |
|---|---|
| Mode local | Recherche, notes locales, Pomodoro, outils d’onglets et page Nouvel onglet fonctionnent sans connexion |
| Connexion Google | Session créée, profil affiché, déconnexion possible |
| Notes | Création locale, import des notes existantes, synchronisation du compte, suppression locale et distante |
| À traiter | Capture ajoutée localement ; transformation en note, tâche ou lecture ; écartement possible |
| Tâches | Création avec tags, échéance, rappel et récurrence ; la complétion crée la prochaine occurrence attendue |
| Synchronisation | État lisible ; tâches, lecture, espaces et préférences synchronisés seulement après action volontaire |
| Productivité | Doublons fermés, groupes par domaine créés, mode focus et temps de lecture disponibles sur une page HTTP(S) |
| IA | Diagnostic visible ; résumé ou repli heuristique ; avertissement clair pour l’analyse stylistique |
| Facturation | Checkout et portail s’ouvrent seulement pour un utilisateur connecté ; le webhook détermine le plan final |
| Nouvel onglet | Recherche, tableau Aujourd’hui, raccourcis, dernières notes, tâches et Pomodoro affichés |
| Rétrospective | Les compteurs de tâche, concentration et domaines déjà enregistrés restent disponibles localement ; le diagnostic exporté ne contient ni page, ni jeton, ni URL complète |

Sur `chrome://extensions`, ouvrez **Erreurs** et le lien **service worker** de l’extension. Il ne doit pas y avoir d’erreur de chargement du manifeste, de module introuvable, de CSP ou de permission.

## 7. Préparer le package Chrome Web Store

Depuis la racine du dépôt, construisez l’archive avec le manifeste à la racine :

```bash
cd /chemin/vers/AITools
zip -r ../AITools-v7.0.zip . \
  -x '.git/*' '.audit/*' 'tests/*' '.env*' '*.md' 'node_modules/*' \
  -x '.chrome-validation.md'
```

Avant l’import Web Store, vérifiez que l’archive contient `manifest.json` au premier niveau :

```bash
unzip -l ../AITools-v7.0.zip | head -30
```

Dans le Chrome Web Store Developer Dashboard, créez l’élément, chargez le ZIP, ajoutez des captures d’écran, une politique de confidentialité, une explication honnête de chaque permission et les mentions concernant le traitement local de l’IA. Après attribution de l’ID définitif, retournez aux étapes 1 et 3 pour mettre à jour le client OAuth et l’URL de redirection de production.

## 8. Exploitation et sécurité

| Fréquence | Action |
|---|---|
| À chaque déploiement | Tester le flux Google, une synchronisation de notes et l’ouverture du popup |
| À chaque changement Stripe | Tester Checkout en mode test et consulter les livraisons webhook Stripe |
| Mensuelle | Examiner les journaux Edge Functions et les erreurs du service worker |
| En cas de fuite suspectée | Révoquer ou faire tourner immédiatement les clés Stripe/Supabase concernées, redéployer les fonctions et invalider les sessions si nécessaire |
| Avant une nouvelle permission Chrome | Justifier l’usage, mettre à jour la fiche Web Store et tester les régressions |

## Références

[1] [Supabase JavaScript Reference — Data API, clés et RLS](https://supabase.com/docs/reference/javascript/auth-signinwithoauth)

[2] [Supabase — Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)

[3] [Supabase — Login with Google, section Chrome Extensions](https://supabase.com/docs/guides/auth/social-login/auth-google)

[4] [Stripe — Using webhooks with subscriptions](https://docs.stripe.com/billing/subscriptions/webhooks)

[5] [Stripe — Receive webhook events](https://docs.stripe.com/webhooks)

[6] [Chrome for Developers — Built-in AI APIs](https://developer.chrome.com/docs/ai/built-in-apis)

[7] [Chrome for Developers — Prompt API, exigences matérielles et téléchargement](https://developer.chrome.com/docs/ai/prompt-api)
