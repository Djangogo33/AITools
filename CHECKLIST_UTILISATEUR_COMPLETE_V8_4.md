# Checklist complète utilisateur — AITools 8.4.1

**Auteur : Manus AI**  
**Objectif :** finaliser les services distants, vérifier la restauration après perte du cache et publier AITools sans exposer de secrets.

> Les six modules d’AITools fonctionnent déjà en mode local. Les étapes ci-dessous sont nécessaires uniquement pour activer la connexion Google, la sauvegarde Supabase, la restauration multi-appareils, les abonnements Stripe et la publication publique.

## Vue d’ensemble et ordre conseillé

| Priorité | À faire vous-même | Obligatoire pour |
|---:|---|---|
| 1 | Vérifier l’archive et l’ID Chrome de développement. | Tests locaux et OAuth. |
| 2 | Appliquer les migrations Supabase et vérifier RLS. | Synchronisation et restauration. |
| 3 | Configurer Google OAuth dans Google Cloud et Supabase. | Connexion des utilisateurs. |
| 4 | Tester la sauvegarde, la restauration et la déconnexion. | Protection après suppression du cache. |
| 5 | Configurer Stripe et les fonctions Edge, si vous vendez PRO/MAX. | Paiement et portail client. |
| 6 | Préparer puis publier la fiche Chrome Web Store. | Diffusion publique. |
| 7 | Refaire le test OAuth et de restauration avec l’ID Web Store final. | Production. |

## 1. Installer et vérifier la version de développement

1. Téléchargez ou reconstruisez `AITools-v8.4.1.zip`, puis vérifiez l’empreinte SHA-256 :

   ```text
   cc29a73c0d86e2ca52cea72c046086160d3dbe72b77e4296cfc4e0a85fa2e886
   ```

2. Pour tester avant publication, ouvrez `chrome://extensions`, activez le **Mode développeur**, choisissez **Charger l’extension non empaquetée**, puis sélectionnez le dossier `AITools` du dépôt. Ne sélectionnez pas le ZIP à cette étape.

3. Relevez l’ID indiqué sur la carte de l’extension. Dans la console du service worker, exécutez :

   ```js
   chrome.identity.getRedirectURL('auth')
   ```

4. Conservez l’URL retournée exactement telle quelle. Elle suit normalement ce format :

   ```text
   https://<extension-id>.chromiumapp.org/auth
   ```

Cet ID changera pour la version publiée dans le Chrome Web Store. Il faudra donc répéter les réglages OAuth avec l’ID de production après sa première attribution.

## 2. Finaliser Supabase

### 2.1 Vérifier la configuration publique de l’extension

Dans `shared/supabase-config.js`, vérifiez que `url` pointe vers votre projet Supabase et que `publishableKey` est la clé publique actuelle du projet. Cette clé peut être distribuée dans une extension ; elle ne donne pas accès aux données des autres utilisateurs lorsque RLS est correctement appliqué.

Ne placez jamais dans l’extension, le dépôt Git ou les captures d’écran : une clé `service_role`, une clé secrète Stripe, le secret de webhook Stripe ou un secret OAuth Google.

### 2.2 Appliquer les migrations SQL

Dans **Supabase Dashboard → SQL Editor**, exécutez les fichiers ci-dessous dans cet ordre. Utilisez le contenu du fichier, pas seulement son nom.

| Ordre | Fichier | Quand l’exécuter |
|---:|---|---|
| 1 | `supabase/migrations/20260818_subscriptions_compatibility.sql` | Pour une base existante, notamment si une erreur mentionne `provider_subscription_id`. |
| 2 | `supabase/schema.sql` | Toujours, pour créer ou mettre à jour toutes les tables, triggers et politiques. |
| 3 | `supabase/migrations/20260819_user_backups.sql` | Obligatoire pour AITools 8.4 et la restauration des données après effacement du cache. |

Les scripts sont idempotents : les rejouer ne doit pas supprimer les données existantes. N’effacez jamais les tables pour corriger une migration.

### 2.3 Vérifier les tables et RLS

Dans **Table Editor**, vérifiez que les tables suivantes existent : `profiles`, `subscriptions`, `notes`, `tasks`, `reading_items`, `workspaces`, `user_preferences` et `user_backups`.

Vérifiez que **RLS est activée** sur chaque table. Les utilisateurs authentifiés doivent uniquement lire et modifier les lignes dont l’identifiant correspond à leur propre `auth.uid()`. En particulier, `subscriptions` ne doit pas permettre à un utilisateur de modifier lui-même son plan.

Depuis la racine du dépôt, exécutez ensuite :

```bash
REQUIRE_USER_BACKUPS=1 node tests/supabase-readonly-health.mjs
```

Le résultat attendu est :

```text
supabase readonly health audit: ok (sauvegarde restaurable disponible)
```

## 3. Configurer Google OAuth

1. Dans **Google Cloud Console**, créez ou sélectionnez le projet dédié à AITools.
2. Dans **Google Auth Platform → Branding**, renseignez le nom de l’application, une adresse e-mail de support, une URL de politique de confidentialité et, si vous en avez une, une URL de conditions d’utilisation.
3. Dans **Data Access**, conservez uniquement `openid`, `userinfo.email` et `userinfo.profile`. N’ajoutez pas de portée sensible sans besoin réel.
4. Dans **Clients**, créez un client OAuth de type **Application Web**. C’est ce client qui doit être renseigné dans **Supabase → Authentication → Providers → Google** avec son Client ID et son Client Secret.
5. Sur ce client **Application Web**, ajoutez l’URL de callback Supabase affichée dans la configuration du fournisseur Google, normalement :

   ```text
   https://<project-ref>.supabase.co/auth/v1/callback
   ```

6. Vous pouvez aussi créer un client de type **Chrome Extension** et lui associer l’Item ID de l’extension. Il n’a pas de champ callback : c’est normal. Il ne remplace pas le client Web qui porte la callback Supabase.
7. Dans **Supabase → Authentication → URL Configuration**, définissez une **Site URL** HTTPS que vous contrôlez, puis ajoutez aux **Redirect URLs** l’URL exacte retournée sur **votre** Chrome par `chrome.identity.getRedirectURL('auth')`, soit `https://<votre-extension-id>.chromiumapp.org/auth`. N’utilisez jamais l’ID d’un autre navigateur ou d’une capture de test.
8. Ajoutez aussi vos futures URLs HTTPS de paiement, par exemple `https://votre-domaine.example/billing/success` et `https://votre-domaine.example/billing/cancel`.
9. Dans AITools, cliquez sur **Se connecter avec Google**. Vérifiez l’apparition d’une ligne dans `auth.users`, puis dans `public.profiles`, et enfin votre identité dans le popup.

## 4. Activer et tester la sauvegarde restaurable

1. Dans AITools, ouvrez **Préférences → Composer votre AITools** et vérifiez que **Synchronisation Supabase** est activée.
2. Ouvrez **Préférences → Données**, connectez-vous avec Google, puis cliquez sur **Sauvegarder et restaurer mon espace**.
3. Créez au minimum une note, une tâche, une page de lecture, une capture et une préférence visible. Relancez la sauvegarde puis attendez le message de succès.
4. Vérifiez dans Supabase les tables `notes`, `tasks`, `reading_items`, `workspaces`, `user_preferences` et `user_backups`. Les lignes doivent contenir votre `user_id` et uniquement vos données.
5. Exportez une copie locale via **Préférences → Exporter mes données locales** avant tout test de perte de données.
6. Utilisez un **profil Chrome de test** pour simuler une suppression des données de l’extension. Ne faites pas ce test sur le seul profil qui contient des données non sauvegardées.
7. Rechargez AITools dans ce profil de test et reconnectez-vous avec le **même compte Google**. Les notes, tâches, lecture, espaces, préférences, captures, focus, DND, règles d’onglets, recherches et tâche active doivent être restaurés.
8. Vérifiez qu’une coupure réseau temporaire ne bloque pas les outils locaux. Dès le retour du réseau, AITools réessaie automatiquement la sauvegarde pendant que Chrome reste ouvert ; vous pouvez aussi relancer manuellement la synchronisation.

Une suppression de cache efface volontairement la session OAuth locale. La reconnexion Google est donc normale et obligatoire avant toute restauration distante.

## 5. Configurer Stripe — uniquement si vous activez PRO/MAX

Ignorez entièrement cette section si AITools reste gratuit et local-first. Les modules locaux et la sauvegarde Supabase n’en dépendent pas.

1. Dans Stripe, passez d’abord en **mode test**.
2. Créez deux prix récurrents, PRO et MAX, puis notez les identifiants `price_...`.
3. Activez le **Customer Portal** avec au minimum la mise à jour du moyen de paiement et l’annulation.
4. Créez trois pages HTTPS réelles : succès, annulation et retour portail. Elles peuvent simplement indiquer que l’utilisateur peut fermer la page et revenir dans l’extension.
5. Installez la CLI Supabase, connectez-vous, liez votre projet, puis exécutez :

   ```bash
   supabase login
   supabase link --project-ref <votre-project-ref>
   supabase functions deploy create-checkout
   supabase functions deploy create-portal
   supabase functions deploy stripe-webhook
   ```

6. Dans **Supabase → Edge Functions → Secrets**, ajoutez `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_MAX`, `BILLING_SUCCESS_URL`, `BILLING_CANCEL_URL`, `BILLING_PORTAL_RETURN_URL`, `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`.
7. Dans Stripe, créez un webhook vers :

   ```text
   https://<project-ref>.supabase.co/functions/v1/stripe-webhook
   ```

8. Sélectionnez les événements : `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid` et `invoice.payment_failed`.
9. Copiez le secret `whsec_...` de Stripe dans `STRIPE_WEBHOOK_SECRET` dans Supabase.
10. Effectuez un abonnement avec une carte de test, puis vérifiez le webhook, la mise à jour de `public.subscriptions`, le plan affiché dans AITools, le portail client, une annulation et un paiement échoué. Passez au mode live uniquement après ces tests.

## 6. Préparer et publier dans le Chrome Web Store

1. Créez ou ouvrez votre fiche dans le **Chrome Web Store Developer Dashboard**.
2. Chargez `AITools-v8.4.1.zip`. Le ZIP doit contenir `manifest.json` à sa racine.
3. Ajoutez des captures d’écran réelles, une description fidèle, la politique de confidentialité et les justifications de permissions. Déclarez honnêtement les données synchronisées avec Supabase et les données qui restent locales.
4. Vérifiez que les URLs de politique de confidentialité, d’assistance et de retour de paiement sont accessibles en HTTPS.
5. Soumettez si possible la fiche d’abord à un canal de test ou à un groupe de testeurs.
6. Lorsque le Web Store attribue l’ID définitif, reprenez intégralement la section **Google OAuth** avec ce nouvel ID. Mettez à jour le client Chrome Extension dans Google Cloud et l’URL `chromiumapp.org/auth` dans Supabase.
7. Installez l’extension depuis son canal Web Store, puis testez une connexion Google, une synchronisation et une restauration sur cette version installée. Ne vous limitez pas à l’extension chargée depuis le dossier de développement.

## 7. Contrôle final avant production

| Contrôle | Attendu |
|---|---|
| Mode local sans compte | Les six modules restent disponibles. |
| Connexion Google | Retour réussi dans l’extension et profil Supabase créé. |
| RLS | Un utilisateur ne voit jamais les données d’un autre compte. |
| Sauvegarde | Le statut indique une synchronisation réussie. |
| Restauration | Un profil Chrome de test récupère les données après reconnexion. |
| Secrets | Aucun secret n’est présent dans l’extension distribuée, Git ou les captures Web Store. |
| Stripe, si activé | Checkout, webhook, plan et portail testés en mode test. |
| Web Store | Fiche, URLs légales, permissions et écran de confidentialité prêts. |

## Références

[1] [Chrome for Developers — API `chrome.identity`](https://developer.chrome.com/docs/extensions/reference/api/identity)

[2] [Supabase — Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)

[3] [Supabase — Login with Google, Chrome Extensions](https://supabase.com/docs/guides/auth/social-login/auth-google)

[4] [Supabase — Edge Functions et webhooks Stripe](https://supabase.com/docs/guides/functions)
