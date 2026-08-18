# Audit d’intégration Supabase — AITools 7.0

## Portée et méthode

Cet audit a été réalisé après l’activation du projet Supabase configuré dans `shared/supabase-config.js`. Les sondes réseau ont été limitées à des requêtes **en lecture seule** exécutées avec la clé publishable de l’extension. Aucune note, tâche, préférence, espace de travail, session, abonnement ou donnée de paiement n’a été créé, modifié ou supprimé pendant le contrôle.

> Le rôle anonyme ne renvoie aucune ligne sur les tables synchronisées. Ce résultat confirme que les données ne sont pas exposées publiquement par les parcours testés ; il ne remplace pas un test RLS avec deux comptes authentifiés distincts.

## Résultats de connectivité

| Élément contrôlé | Résultat | Observation |
| --- | --- | --- |
| Réglages Auth Supabase | Disponible (`200`) | Le fournisseur Google est activé. |
| `profiles` | Disponible (`200`) | Lecture anonyme vide. |
| `subscriptions` | Disponible (`200`) | Lecture anonyme vide. |
| `notes` | Disponible (`200`) | Lecture anonyme vide. |
| `tasks` | Disponible (`200`) | Lecture anonyme vide. |
| `reading_items` | Disponible (`200`) | Lecture anonyme vide. |
| `workspaces` | Disponible (`200`) | Lecture anonyme vide. |
| `user_preferences` | Disponible (`200`) | Lecture anonyme vide. |
| `create-checkout` | Non déployée (`404`) | La facturation ne peut pas encore ouvrir Checkout. |
| `create-portal` | Non déployée (`404`) | Le portail Stripe ne peut pas encore être ouvert. |
| `stripe-webhook` | Non déployée (`404`) | Les droits Stripe ne sont pas encore synchronisés par webhook. |

Les mesures de lecture publique étaient comprises entre environ **0,18 s** et **0,87 s** pour les tables v7. Ces valeurs sont une référence de disponibilité, non une garantie de latence pour une session authentifiée ou un réseau utilisateur.

## Correctifs et optimisations appliqués

Le service de synchronisation personnelle borne désormais les lectures à la taille locale maximale utile, valide que les réponses PostgREST sont des tableaux, expire clairement après douze secondes et traite les suppressions par lots de vingt requêtes concurrentes. Les préférences bénéficient des mêmes contrôles de forme et de délai.

La synchronisation des notes conserve désormais les `tags`, l’URL source et le titre source dans les lectures et écritures Supabase. Ces métadonnées étaient déjà présentes dans le schéma, mais elles n’étaient pas incluses dans le payload distant, ce qui pouvait les faire disparaître sur un nouvel appareil après synchronisation.

Le client d’authentification et le client Stripe disposent eux aussi d’un délai réseau de douze secondes. Une fonction Edge Stripe absente affiche maintenant le message explicite indiquant qu’elle doit être déployée, au lieu de renvoyer une indisponibilité générique.

## Tests exécutés

| Test | Résultat |
| --- | --- |
| Simulations de services locales | Réussies, dont notes, synchronisation, auth et facturation. |
| Validation syntaxique des modules | Réussie. |
| Audit Supabase réel en lecture seule | Réussi pour Auth et les sept tables v7. |
| Audit Chromium du popup, Nouvel onglet et Préférences | Réussi sans exception JavaScript. |
| Résumé, capture et temps de lecture dans Chromium | Réussis. |
| Intégrité de l’archive Manifest V3 | Réussie ; SHA-256 `5f7be819d067f21e2b974ae1ad10bb04a7049a4f51de31e366eec67743d6642e`. |

## Actions restant au propriétaire

La connexion Google réelle doit être vérifiée une fois dans Chrome, car elle nécessite le consentement du propriétaire du compte. Un test complet de synchronisation authentifiée entre deux appareils nécessite également une session Google réelle et, pour éviter d’écrire dans les données personnelles, une autorisation explicite ou un compte de test.

Avant d’activer les offres payantes, déployez les trois fonctions Edge décrites dans `CONFIGURATION_PRODUCTION.md` : `create-checkout`, `create-portal` et `stripe-webhook`. Tant qu’elles renvoient `404`, le reste de l’extension reste fonctionnel en mode local et la facturation indique clairement que le déploiement manque.
