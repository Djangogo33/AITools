# Finalisation de production — AITools 8

**Auteur : Manus AI**  
**Portée :** cette checklist sépare les éléments déjà prêts dans le dépôt de ceux qui nécessitent un accès administrateur à Supabase, Google Cloud, Stripe ou au Chrome Web Store.

> **État actuel du code.** AITools 8 fonctionne en mode local sans compte. La validation automatisée couvre le manifeste, les services locaux, l’authentification simulée, la synchronisation, la facturation configurée, le popup, le résumé, l’inventaire média et la reprise d’un Pomodoro après suspension. Les opérations ci-dessous restent nécessaires pour activer les services distants réels et publier l’extension.

## 1. Ordre recommandé

| Ordre | Action à réaliser par vous | Bloque |
|---:|---|---|
| 1 | Stabiliser l’ID de l’extension et relever son URI de retour Chrome. | Google OAuth et Supabase Auth. |
| 2 | Appliquer les migrations Supabase et vérifier RLS. | Profils et synchronisation. |
| 3 | Configurer le fournisseur Google dans Google Cloud puis Supabase. | Connexion utilisateur. |
| 4 | Tester une connexion, puis la synchronisation des notes et de l’espace personnel. | Validation de Supabase Auth et Postgres. |
| 5 | Créer les produits Stripe, secrets et fonctions Edge. | Checkout, portail client et abonnements. |
| 6 | Tester un achat Stripe en mode test et le webhook signé. | Plans PRO/MAX. |
| 7 | Préparer les pages HTTPS de retour Stripe, la fiche Web Store et publier. | Mise en production publique. |

## 2. Stabiliser l’identité Chrome

Chargez le dossier de l’extension dans `chrome://extensions` avec le **Mode développeur**, puis relevez l’ID affiché. Dans la console du service worker de l’extension, exécutez :

```js
chrome.identity.getRedirectURL('auth')
```

Conservez **exactement** l’URL obtenue, de forme `https://<extension-id>.chromiumapp.org/auth`. `chrome.identity` génère les URL de retour sous le domaine `chromiumapp.org`, et `launchWebAuthFlow()` termine le flux lorsque le fournisseur redirige vers cette URL. [1]

| Usage | ID à enregistrer |
|---|---|
| Développement local | ID affiché sur la carte de l’extension chargée localement. |
| Test d’un paquet distinct | ID du paquet de test réellement installé. |
| Publication | ID définitif attribué par le Chrome Web Store. Mettez à jour la configuration OAuth une dernière fois après son attribution. |

## 3. Finaliser Supabase

### 3.1 Contrôler les paramètres publics de l’extension

Dans `shared/supabase-config.js`, vérifiez que `url` cible votre projet Supabase et que `publishableKey` est sa clé **publishable**. Cette clé peut être présente dans une extension distribuée ; elle ne remplace pas les politiques RLS. Ne placez jamais une clé `service_role` ou une clé secrète Stripe dans l’extension.

### 3.2 Appliquer les migrations SQL

Votre base a déjà rencontré l’erreur `provider_subscription_id does not exist`. Pour une base Supabase existante, ouvrez **SQL Editor** et exécutez dans cet ordre :

1. [`supabase/migrations/20260818_subscriptions_compatibility.sql`](./supabase/migrations/20260818_subscriptions_compatibility.sql) ;
2. [`supabase/schema.sql`](./supabase/schema.sql).

Ne supprimez aucune table pour corriger cette erreur. Les scripts sont conçus pour être relancés sans effacer les données existantes.

Ensuite, dans **Table Editor**, vérifiez l’existence de `profiles`, `subscriptions`, `notes`, `tasks`, `reading_items`, `workspaces` et `user_preferences`. Vérifiez aussi que RLS est activée sur chacune de ces tables, et que `subscriptions` ne permet pas à un utilisateur connecté de modifier directement son plan.

### 3.3 Configurer les URL Supabase Auth

Dans **Authentication → URL Configuration** :

1. Définissez **Site URL** sur un domaine HTTPS que vous contrôlez. Il servira notamment aux pages de retour et aux flux d’e-mail ; ne laissez pas une valeur de développement en production.
2. Ajoutez l’URI exacte `https://<extension-id>.chromiumapp.org/auth` à **Redirect URLs**.
3. Ajoutez les URLs HTTPS définitives de retour de paiement, par exemple `https://votre-domaine.example/billing/success` et `https://votre-domaine.example/billing/cancel`.
4. Préférez les URLs de production exactes aux jokers étendus. Supabase recommande les chemins exacts en production. [2]

## 4. Configurer Google OAuth

AITools utilise un flux PKCE via `chrome.identity.launchWebAuthFlow()`. Le code valide désormais l’URI de callback reçu, supprime le vérificateur PKCE après le flux et sérialise les renouvellements de session concurrents.

| Étape | Configuration attendue |
|---:|---|
| 1 | Dans **Google Cloud Console**, créez ou sélectionnez un projet AITools. |
| 2 | Dans **Google Auth Platform → Branding**, renseignez le nom, l’adresse e-mail de support et les liens publics de politique de confidentialité et conditions d’utilisation. |
| 3 | Dans **Data Access**, conservez `openid`, `userinfo.email` et `userinfo.profile`. N’ajoutez pas de portée sensible sans nécessité métier. |
| 4 | Dans **Clients**, créez un client OAuth de type **Chrome Extension** et fournissez l’Item ID de l’extension correspondant à cet environnement. |
| 5 | Dans **Supabase → Authentication → Providers → Google**, activez Google et renseignez le Client ID obtenu ; renseignez le secret uniquement dans Supabase si le tableau de bord le demande. |
| 6 | Dans Google Cloud, ajoutez comme URI de redirection autorisée l’URL de callback Supabase affichée dans ce même écran, typiquement `https://<project-ref>.supabase.co/auth/v1/callback`. |
| 7 | Dans Supabase **URL Configuration**, ajoutez l’URI `chromiumapp.org/auth` relevée à l’étape 2. |

Supabase documente explicitement le type de client **Chrome Extension** et demande d’enregistrer le Client ID dans le fournisseur Google. [3] Testez ensuite **Se connecter avec Google** depuis le popup. Vous devez constater une ligne dans `auth.users`, une ligne correspondante dans `public.profiles`, puis votre nom dans l’interface AITools.

## 5. Tester la synchronisation sans risque

Après une connexion Google réussie, créez une note, une tâche et un élément de lecture de test. Lancez ensuite la synchronisation depuis les préférences, puis contrôlez que :

| Vérification | Résultat attendu |
|---|---|
| Notes | La note apparaît dans `public.notes` avec votre `user_id`. |
| Espace personnel | Les tâches, la lecture, les espaces et préférences sont synchronisés à la demande. |
| Isolation | Les requêtes et suppressions sont filtrées par `user_id` côté client en complément de RLS. |
| Mode dégradé | En coupant temporairement le réseau, les outils locaux restent utilisables et l’état de synchronisation indique l’échec sans effacer de données. |
| Concurrence | Plusieurs clics de synchronisation simultanés ne déclenchent qu’une opération distante. |

## 6. Activer Stripe et les fonctions Edge

### 6.1 Préparer Stripe

Dans Stripe, commencez en **mode test**. Créez deux produits récurrents, AITools PRO et AITools MAX, puis copiez leurs IDs `price_...`. Activez aussi le Customer Portal avec, au minimum, la mise à jour de moyen de paiement et l’annulation.

Vous devez disposer d’un domaine HTTPS réel pour les URLs de succès, annulation et retour du portail. Si vous n’avez pas encore de site public, créez d’abord ces trois pages de retour très simples ; elles peuvent indiquer que l’utilisateur peut fermer la page puis actualiser son compte dans l’extension.

### 6.2 Déployer les fonctions

Installez la CLI Supabase sur votre poste, connectez-vous, puis exécutez depuis la racine du dépôt :

```bash
supabase login
supabase link --project-ref <votre-project-ref>
supabase functions deploy create-checkout
supabase functions deploy create-portal
supabase functions deploy stripe-webhook
```

Le fichier [`supabase/config.toml`](./supabase/config.toml) versionné configure uniquement `stripe-webhook` avec `verify_jwt = false`. Cette exception est nécessaire parce que Stripe n’envoie pas un JWT Supabase ; la fonction vérifie obligatoirement l’en-tête `Stripe-Signature` avec le corps brut et `STRIPE_WEBHOOK_SECRET`. Les fonctions `create-checkout` et `create-portal` conservent leur authentification utilisateur. [4] [5]

Dans **Supabase → Edge Functions → Secrets**, créez les secrets suivants. Ne les mettez ni dans Git, ni dans `manifest.json`, ni dans les scripts JavaScript de l’extension.

| Secret | Valeur à fournir |
|---|---|
| `STRIPE_SECRET_KEY` | Clé secrète Stripe de l’environnement test ou live. |
| `STRIPE_WEBHOOK_SECRET` | Secret de signature `whsec_...` de l’endpoint Stripe. |
| `STRIPE_PRICE_PRO` | ID du prix récurrent PRO. |
| `STRIPE_PRICE_MAX` | ID du prix récurrent MAX. |
| `BILLING_SUCCESS_URL` | Page HTTPS de succès. |
| `BILLING_CANCEL_URL` | Page HTTPS d’annulation. |
| `BILLING_PORTAL_RETURN_URL` | Page HTTPS de retour depuis le portail. |
| `SUPABASE_URL` | URL de votre projet Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé de service Supabase, réservée aux fonctions Edge. |

### 6.3 Créer le webhook Stripe

Dans **Stripe → Developers/Workbench → Webhooks**, créez cet endpoint :

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

Copiez le secret de signature dans `STRIPE_WEBHOOK_SECRET`. La fonction implémentée synchronise les changements de souscription, le Checkout complété et les événements de facture. Les fonctions Edge sont adaptées aux appels tiers et aux webhooks, mais les opérations doivent rester courtes et idempotentes. [4]

### 6.4 Valider le parcours de paiement

Effectuez une souscription avec une carte de test Stripe. Vérifiez, dans cet ordre, la création de la Checkout Session, la livraison du webhook, la mise à jour de `public.subscriptions`, puis l’affichage du plan dans AITools après actualisation du compte. Testez ensuite le portail client, une annulation et un paiement échoué. Passez en mode live uniquement après que tous les événements test ont été livrés avec succès.

## 7. Finaliser la publication Chrome Web Store

1. Appliquez d’abord `supabase/migrations/20260819_user_backups.sql` si votre base Supabase existait avant AITools 8.4, puis validez avec `REQUIRE_USER_BACKUPS=1 node tests/supabase-readonly-health.mjs`.
2. Rechargez l’extension dans `chrome://extensions` et vérifiez l’absence d’erreur dans le service worker.
3. Chargez l’archive `AITools-v8.4.0.zip` ou reconstruisez-la avec le manifeste à la racine.
4. Dans le Chrome Web Store Developer Dashboard, renseignez des captures réelles, la politique de confidentialité et une justification honnête de chaque permission demandée.
5. Après attribution de l’ID Web Store définitif, revenez aux sections 2, 3 et 4 de ce document pour enregistrer l’ID final dans Google Cloud et l’URI de retour exacte dans Supabase.
6. Répétez une connexion Google et une synchronisation sur l’extension installée depuis le canal de publication, pas seulement sur le dossier de développement.

## 8. Limites opérationnelles à connaître

Les outils Page web, Texte & données, Onglets & navigateur, Médias, IA et Productivité ne dépendent pas d’un compte. En revanche, la disponibilité des API IA intégrées dépend de la version de Chrome, de l’appareil et du téléchargement éventuel des modèles locaux ; les replis locaux restent volontairement limités. Les services Stripe restent volontairement indisponibles tant que les trois fonctions Edge et leurs secrets ne sont pas déployés.

## Références

[1] [Chrome for Developers — API `chrome.identity`](https://developer.chrome.com/docs/extensions/reference/api/identity)

[2] [Supabase — Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)

[3] [Supabase — Login with Google, Chrome Extensions](https://supabase.com/docs/guides/auth/social-login/auth-google)

[4] [Supabase — Edge Functions et webhooks Stripe](https://supabase.com/docs/guides/functions)

[5] [Supabase — Configuration et sécurisation des fonctions Edge](https://supabase.com/docs/guides/functions/function-configuration)
