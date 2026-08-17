# AITools 7 — Dossier de publication Chrome Web Store

**Auteur : Manus AI**  
**Version visée : 7.0.0**  
**Catégorie suggérée : Productivité**

> **Positionnement à déclarer dans la fiche.** AITools est un espace de travail personnel local-first pour capturer une page à la demande, organiser des notes et des tâches, reprendre une lecture, restaurer des espaces d’onglets et travailler avec un Pomodoro. Un compte n’est pas nécessaire pour les fonctionnalités locales ; la connexion active uniquement les services distants explicitement choisis.

## 1. Texte de la fiche

| Champ Chrome Web Store | Contenu prêt à coller |
| --- | --- |
| Nom | **AITools — espace de travail local-first** |
| Résumé court | **Capturez, planifiez et retrouvez votre travail web dans un espace privé qui fonctionne d’abord localement.** |
| Catégorie | **Productivité** |
| Langue principale | **Français** |
| Objectif unique | **Aider l’utilisateur à organiser son travail web personnel : capturer, transformer et retrouver ses propres contenus, tâches, lectures et espaces d’onglets.** |

### Description détaillée

AITools rassemble les actions de travail utiles dans un espace personnel, sans imposer de compte. Capturez une page ou une sélection à votre demande, puis transformez-la en note, tâche ou élément de lecture depuis la boîte **À traiter**. Planifiez des tâches ponctuelles ou récurrentes, choisissez une tâche active et lancez un Pomodoro lié à votre travail.

Le nouvel onglet et le tableau **Aujourd’hui** regroupent les échéances, les captures en attente et le temps de concentration. AITools offre également une recherche unifiée parmi vos données locales, des espaces de travail réouvrables, une liste de lecture, des règles d’onglets et des outils de page déclenchés par vous.

Vos données restent dans le stockage local du navigateur par défaut. Si vous choisissez de vous connecter, vous pouvez synchroniser vos notes, tâches, lectures, espaces de travail et préférences avec votre propre compte Supabase. Les capacités IA intégrées de Chrome sont utilisées seulement lorsqu’elles sont disponibles ; sinon, AITools conserve des solutions locales de repli. Aucun compte n’est requis pour travailler hors ligne.

### Points essentiels à mettre en avant

| Fonction | Bénéfice utilisateur |
| --- | --- |
| Tableau Aujourd’hui | Reprendre immédiatement avec les échéances, captures et indicateurs de concentration. |
| Boîte À traiter | Convertir une capture en note, tâche ou page à lire au moment choisi. |
| Tâches récurrentes | Créer automatiquement la prochaine occurrence quotidienne, hebdomadaire ou mensuelle après validation. |
| Lanceur de commandes | Accéder rapidement aux actions principales avec `Alt` + `Maj` + `K` ou `Ctrl`/`⌘` + `K`. |
| Local-first | Utiliser les fonctionnalités essentielles sans compte ni serveur. |
| Synchronisation optionnelle | Synchroniser uniquement après connexion et action volontaire de l’utilisateur. |

## 2. Politique de confidentialité prête à publier

Publiez le texte ci-dessous sur une **page HTTPS publique**, puis placez son URL exacte dans le champ « Politique de confidentialité » du tableau de bord Chrome Web Store. Un fichier inclus dans le ZIP ne remplace pas cette URL publique. Une politique est nécessaire dès lors que l’extension traite des données utilisateur, y compris lorsqu’elles restent locales.[1] [2]

---

# Politique de confidentialité d’AITools

**Dernière mise à jour : 17 août 2026**

AITools est un espace de travail personnel pour Chrome. Son fonctionnement est **local-first** : les notes, tâches, listes de lecture, captures, espaces de travail, préférences et statistiques de concentration sont conservés dans le stockage local du navigateur par défaut.

## Données traitées

AITools traite les données que vous choisissez d’enregistrer, notamment le texte d’une sélection ou d’une page capturée, les URL et titres associés, les notes, tâches, tags, échéances, rappels, éléments de lecture et espaces de travail. L’extension traite aussi les informations de l’onglet actif lorsque vous déclenchez une action qui en a besoin, par exemple enregistrer une page, calculer un temps de lecture, regrouper des onglets ou appliquer un outil de page.

Lorsque vous vous connectez volontairement, AITools traite votre identité de connexion (nom, adresse e-mail et avatar fournis par le fournisseur d’identité) afin d’afficher votre compte et de synchroniser les données que vous choisissez de synchroniser. Les paiements sont effectués sur les pages Stripe ; AITools ne collecte ni ne stocke vos numéros de carte bancaire.

## Finalités et partage

Les données locales servent uniquement aux fonctions que vous activez dans AITools. Aucune donnée de navigation, capture, note ou tâche n’est vendue, utilisée pour de la publicité ciblée, ni transmise à des courtiers en données.

La synchronisation distante est optionnelle. Lorsque vous choisissez de vous connecter puis de synchroniser, les notes, tâches, éléments de lecture, espaces de travail et préférences concernés sont transmis par HTTPS à votre projet Supabase afin de les retrouver sur vos appareils. L’authentification peut utiliser Google OAuth via Supabase. Stripe intervient uniquement pour le paiement et la gestion d’abonnement lorsque vous ouvrez volontairement son parcours de paiement ou son portail client.

Les fonctionnalités IA intégrées du navigateur sont sollicitées uniquement à votre demande. Lorsqu’une API IA locale de Chrome est disponible, le traitement est effectué par le navigateur. Les capacités et transferts éventuels d’une API de navigateur restent soumis aux paramètres et politiques de Chrome.

## Conservation, contrôle et sécurité

Vous pouvez supprimer vos données locales depuis AITools ou réinitialiser le stockage local dans les préférences. Les suppressions d’éléments synchronisés sont propagées lors de la prochaine synchronisation volontaire. Vous pouvez exporter vos données locales et votre journal de diagnostic. Les jetons de session, secrets et données de paiement ne sont pas inclus dans les exports.

Les échanges avec Supabase et Stripe utilisent HTTPS. Les secrets côté serveur, tels qu’une clé `service_role` Supabase, une clé Stripe secrète ou un secret de webhook, ne sont jamais inclus dans l’extension distribuée.

## Contact

Pour toute question relative à la confidentialité, utilisez le canal de support indiqué dans la fiche Chrome Web Store d’AITools.

> L’utilisation par AITools des informations reçues depuis les API Google respecte la [Politique relative aux données utilisateur du Chrome Web Store](https://developer.chrome.com/docs/webstore/program-policies/policies), y compris les exigences d’utilisation limitée.

---

## 3. Déclaration de confidentialité dans le tableau de bord

Les réponses du tableau de bord doivent correspondre au comportement effectif de l’extension et à la politique ci-dessus. Toute divergence peut conduire à une suspension.[2]

| Rubrique | Déclaration à adapter et valider avant envoi |
| --- | --- |
| Données personnelles identifiables | **Oui, uniquement après connexion volontaire** : nom, e-mail et avatar de profil sont utilisés pour afficher le compte et permettre la synchronisation. |
| Activité de navigation / contenu de site | **Oui, à la demande de l’utilisateur** : URL, titre et contenu de la page ou sélection sont traités pour les fonctions visibles de capture, liste de lecture, outils de page et espaces d’onglets. |
| Contenu utilisateur | **Oui** : notes, tâches, tags, échéances et captures choisis par l’utilisateur. |
| Informations financières | **Non** : le paiement est saisi et traité par Stripe, hors de l’extension. |
| Finalité | Fournir l’organisation personnelle locale et, si l’utilisateur le choisit, la synchronisation multi-appareil. |
| Vente / publicité ciblée | **Non**. |
| Certification Limited Use | **Oui**, après avoir relu la politique, la fiche et le comportement livré. |

Avant publication, ajoutez dans l’interface de connexion une divulgation claire expliquant que la connexion active la synchronisation facultative et que les données locales restent utilisables sans compte. Les exigences de divulgation et de consentement ne sont pas satisfaites par la seule politique ou la description de la fiche.[2]

## 4. Justification des autorisations

Chrome exige que les extensions demandent l’ensemble d’autorisations le plus étroit nécessaire à leurs fonctions actuelles, sans réserver des droits pour des fonctions hypothétiques.[1] [2]

| Autorisation | Usage réel dans AITools | Texte de justification pour l’examen |
| --- | --- | --- |
| `storage` | Enregistrer localement les données de l’espace de travail, les préférences, le Pomodoro et les diagnostics. | Nécessaire au fonctionnement local-first et hors ligne. |
| `tabs` | Lire l’onglet actif sur action utilisateur, restaurer des espaces, regrouper et traiter les onglets. | Nécessaire aux fonctions visibles de capture, lecture et organisation des onglets. |
| `tabGroups` | Créer des groupes d’onglets par domaine à la demande. | Utilisée seulement par l’outil « Grouper les onglets par site ». |
| `alarms` | Déclencher le Pomodoro et les rappels de tâches. | Nécessaire aux minuteries et rappels configurés par l’utilisateur. |
| `scripting` | Exécuter l’action de page demandée sur l’onglet actif. | Utilisée uniquement pour les outils déclenchés depuis l’interface AITools. |
| `activeTab` | Limiter les actions de page au seul onglet choisi par l’utilisateur. | Réduit l’accès aux pages au contexte de l’action explicite. |
| `notifications` | Afficher la fin d’un Pomodoro ou un rappel de tâche lorsque les notifications sont activées. | Notifications locales, désactivables dans les préférences. |
| `identity` | Lancer la connexion Google OAuth optionnelle. | Utilisée exclusivement lors d’une connexion volontaire. |
| Hôte Supabase | Appeler le projet Supabase configuré pour la connexion et la synchronisation optionnelles. | Aucun autre hôte distant n’est déclaré. |
| Scripts de contenu HTTP(S) | Répondre aux outils de page pour la capture, le résumé local, le focus et les contrôles YouTube. | Les fonctions concernées sont exposées dans le popup et sont déclenchées par l’utilisateur. |

## 5. Ressources visuelles et captures à fournir

Les règles officielles demandent une icône 128 × 128 incluse dans le ZIP, une image promotionnelle de 440 × 280, et au moins une capture ; les captures 1280 × 800 sont préférables et jusqu’à cinq peuvent être fournies.[3]

| Fichier à préparer | Dimensions | Contenu recommandé |
| --- | --- | --- |
| `assets/icon-128.png` | 128 × 128 PNG | Icône AITools déjà intégrée à l’extension. |
| `store/promo-small-440x280.png` | 440 × 280 PNG | Marque AITools, fond sombre, promesse « Organisez votre travail web, localement ». |
| `store/screenshot-01-today-1280x800.png` | 1280 × 800 PNG | Tableau Aujourd’hui, Pomodoro et accès rapide. |
| `store/screenshot-02-inbox-1280x800.png` | 1280 × 800 PNG | Boîte À traiter et conversion vers note/tâche/lecture. |
| `store/screenshot-03-tasks-1280x800.png` | 1280 × 800 PNG | Tâches, échéances, rappels et récurrence. |
| `store/screenshot-04-workspaces-1280x800.png` | 1280 × 800 PNG | Espaces de travail et restauration d’onglets. |
| `store/screenshot-05-private-review-1280x800.png` | 1280 × 800 PNG | Rétrospective privée et état de synchronisation. |

Les captures doivent représenter l’interface réellement livrée, sans données personnelles réelles et sans promesse non implémentée. Les métadonnées, images et captures doivent rester exactes et à jour.[1]

## 6. Procédure de soumission finale

1. Chargez l’archive ZIP v7 depuis le tableau de bord Chrome Web Store.
2. Renseignez le nom, la description, la catégorie et l’objectif unique présentés dans ce document.
3. Ajoutez l’URL HTTPS de la politique de confidentialité.
4. Remplissez les champs « Privacy practices » selon le tableau ci-dessus et certifiez Limited Use seulement après vérification.
5. Expliquez chaque autorisation avec le tableau de la section 4.
6. Ajoutez l’icône, l’image promotionnelle et les captures représentatives.
7. Relisez la fiche en vérifiant qu’elle ne promet ni stockage cloud imposé, ni IA disponible sur tous les appareils, ni fonctionnalités non incluses.
8. Après publication et attribution de l’ID final, mettez à jour le client Google OAuth de type Chrome Extension et l’URL `chromiumapp.org` dans Supabase, puis envoyez une mise à jour si nécessaire.

## Références

[1] [Chrome Web Store Developer Program Policies — confidentialité, autorisations minimales et exigences de fiche](https://developer.chrome.com/docs/webstore/program-policies/policies)

[2] [Chrome Web Store — FAQ données utilisateur, consentement et déclaration de confidentialité](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)

[3] [Chrome for Developers — images, captures et formats de la fiche](https://developer.chrome.com/docs/webstore/images)
