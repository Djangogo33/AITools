# Authentification et comptes — AITools

## Décision d’architecture

La nouvelle intégration utilise **Supabase Auth comme source d’identité**, `chrome.storage.local` comme stockage de session de l’extension et un module unique (`shared/auth-client.js`) comme frontière entre l’interface et Supabase. Contrairement à l’ancienne version, le code ne crée ni ne recherche un utilisateur à partir d’un identifiant Google dans une table publique. L’identité provient exclusivement du jeton émis par Supabase Auth, puis un profil applicatif est associé à `auth.users.id`.

| Élément | Responsabilité |
|---|---|
| `shared/supabase-config.js` | URL de projet et clé publiable uniquement ; aucune clé de service |
| `shared/auth-client.js` | OAuth Google via PKCE, échange de code, renouvellement, profil et droits |
| `background/service-worker.js` | Propriétaire des opérations d’authentification et de l’état de session |
| `popup/popup.js` | Affichage du compte et demande d’actions par messages uniquement |
| `supabase/schema.sql` | Tables, RLS, déclencheur de profil et politiques de moindre privilège |
| `SUPABASE_SETUP.md` | Procédure de configuration du projet, de Google et de l’URL de redirection |

## Flux de connexion

La connexion Google démarre depuis le popup, mais est exécutée par le service worker. Celui-ci génère un couple PKCE, conserve temporairement le vérificateur dans le stockage de l’extension, construit une demande OAuth Supabase puis ouvre la fenêtre contrôlée par Chrome. Après le retour vers `chrome.identity.getRedirectURL('auth')`, il échange le code à usage unique contre la session Supabase et enregistre le jeton d’accès, le jeton de renouvellement et l’expiration dans `chrome.storage.local`.

> Le code PKCE est valide cinq minutes et doit être échangé sur le même navigateur qui a initié le flux. Le vérificateur reste donc local à l’extension et est supprimé une fois l’échange terminé. [1]

Les requêtes de profil et d’abonnement portent un en-tête `Authorization: Bearer <access_token>` rafraîchi au besoin. En cas d’échec réseau ou de session expirée, l’extension retombe sur ses fonctionnalités locales : notes, recherche, anonymisation et Pomodoro restent accessibles.

## Garanties de sécurité

La clé compilée dans une extension est nécessairement publique et ne doit jamais être une `service_role`. La protection des données appartient aux politiques RLS du projet Supabase. Le schéma limite chaque utilisateur authentifié à son profil et à son abonnement. Les droits payants sont seulement lus par l’extension ; ils ne peuvent pas être écrits depuis le client.

Google est configuré dans Supabase comme fournisseur d’identité, et non contacté directement avec un jeton Google par le code de l’extension. La configuration requiert un client OAuth de type **Chrome Extension** dont l’identifiant est enregistré dans le fournisseur Google de Supabase. [2]

## Références

[1] [Supabase — PKCE flow](https://supabase.com/docs/guides/auth/sessions/pkce-flow)

[2] [Supabase — Login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)

[3] [Supabase — Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
