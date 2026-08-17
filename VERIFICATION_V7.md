# Vérification de livraison — AITools 7.0

**Date de vérification : 17 août 2026**  
**Auteur : Manus AI**  
**Portée :** audit local de l’archive Manifest V3, des services, du runtime Chromium et des intégrations publiques configurées.

> **Conclusion.** Le parcours local-first d’AITools 7.0 est validé dans Chromium avec l’extension réellement chargée. Les fonctionnalités distantes ne peuvent pas encore être déclarées opérationnelles sur le projet Supabase actuellement configuré : les tables v7 et les fonctions Edge attendues ne sont pas déployées. Elles restent désactivées tant que la procédure de [`CONFIGURATION_PRODUCTION.md`](./CONFIGURATION_PRODUCTION.md) n’est pas exécutée.

## Résultats des contrôles locaux

| Domaine contrôlé | Résultat | Preuve de vérification |
| --- | --- | --- |
| Manifeste | Validé | Manifest V3, version `7.0.0`, chemins déclarés existants, trois raccourcis, unique hôte Supabase et aucune ressource de présentation chargée depuis un CDN. |
| Archive distribuable | Validé | Archive `AITools-v7.0.zip` testée par `unzip -t`; manifeste et ressources exécutables présents à la racine. |
| Services locaux | Validé | Simulations réussies pour notes, tâches récurrentes, lecture, tags, concentration, boîte À traiter, migration locale, diagnostics, authentification simulée et IA de repli. |
| Service worker | Validé | Chargé par Chromium avec le manifeste `AITools 7.0.0`; les routes notes, tâches, inbox, lecture, espaces, Pomodoro, statistiques, rétrospective et état de synchronisation répondent correctement. |
| Popup | Validé | Affichage, neuf entrées de navigation, vue Tâches, ouverture et fermeture clavier du lanceur de commandes, sans exception JavaScript. |
| Nouvel onglet | Validé | Carte Aujourd’hui, recherche, tâches, Pomodoro et accès à la boîte À traiter chargés sans exception JavaScript. |
| Préférences | Validé | Synchronisation personnelle, état de synchronisation, rétrospective, export de diagnostic et diagnostic IA présents et chargés sans exception JavaScript. |
| Script de contenu | Validé | Sur `https://example.com/`, la capture enrichie retourne bien le titre et le contenu lisible au travers du service worker. |

## Correction appliquée pendant l’audit

La migration locale v7 utilisait initialement la clé `aitools.inbox`, alors que le service de boîte À traiter persiste les captures sous `aitools.capture-inbox`. La migration et son test ont été corrigés afin que les captures existantes conservent correctement leurs métadonnées de traitement après mise à jour.

## État des services distants

| Service | État observé | Conséquence actuelle | Action nécessaire |
| --- | --- | --- | --- |
| Supabase Auth | Accessible, paramètres renvoyés avec HTTP `200`; fournisseur Google annoncé actif. | La connexion peut être proposée par l’interface. | Finaliser les URL de redirection et le client Chrome Extension dans Google Cloud avant le test de connexion réel. |
| Tables Supabase v7 | Non déployées : `tasks`, `reading_items`, `workspaces` et `user_preferences` répondent `PGRST205` / HTTP `404`. | La synchronisation personnelle reste indisponible sur ce projet. | Exécuter intégralement [`supabase/schema.sql`](./supabase/schema.sql) dans Supabase SQL Editor, puis vérifier RLS. |
| Fonctions Edge Stripe | Non déployées : `create-checkout`, `create-portal` et `stripe-webhook` répondent HTTP `404` aux contrôles `OPTIONS` sans effet. | Checkout, portail client et mise à jour d’abonnement ne peuvent pas fonctionner à distance. | Déployer les trois fonctions Edge, définir leurs secrets et créer le webhook Stripe conformément au guide de production. |
| IA intégrée Chrome | Interface et repli local validés. | Les API natives de Chrome restent conditionnées par la version de Chrome, le matériel et le téléchargement de modèle. | Tester sur la machine cible avec `chrome://on-device-internals`; le repli local demeure disponible. |

## Commandes de vérification reproductibles

```bash
cd /chemin/vers/AITools
for test in tests/*.test.mjs; do node "$test" || exit 1; done
find background content newtab options popup shared -name '*.js' -print0 | xargs -0 -n1 node --check
unzip -t ../AITools-v7.0.zip
```

Pour le test runtime Chromium détaillé, chargez le dossier non empaqueté dans `chrome://extensions`, puis vérifiez le popup, le Nouvel onglet, les Préférences et une page HTTP(S) avec la grille du guide de production.

## Décision de livraison

La distribution locale peut être chargée et utilisée dès maintenant pour les notes, tâches, captures, lecture, espaces, recherche, Pomodoro, export et analyses privées. Avant de présenter la connexion, la synchronisation ou la facturation comme disponibles à des utilisateurs finaux, exécutez les trois actions distantes restantes ci-dessus et réalisez un test réel de connexion Google ainsi qu’un paiement Stripe en mode test.
