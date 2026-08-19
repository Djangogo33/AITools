# Sauvegarde et restauration Supabase — AITools 8.4

Cette version ajoute une **sauvegarde restaurable** aux données AITools déjà synchronisées. Son objectif est de permettre à un utilisateur qui a supprimé les données de son navigateur de retrouver son espace personnel après reconnexion.

> **Principe de sécurité.** La suppression du cache efface aussi le jeton de session local. L’utilisateur doit donc se reconnecter avec le même compte Google. Cette étape ne peut pas être contournée : elle évite qu’un autre utilisateur du navigateur puisse restaurer des données privées.

## 1. Données couvertes

| Famille | Stockage Supabase | Restauration après reconnexion |
|---|---|---|
| Notes | Table `notes` | Oui |
| Tâches, échéances et récurrences | Table `tasks` | Oui |
| Liste de lecture | Table `reading_items` | Oui |
| Espaces de travail et onglets enregistrés | Table `workspaces` | Oui |
| Préférences, thème, raccourcis et nouvel onglet | Table `user_preferences` | Oui |
| Captures de boîte à traiter | Table `user_backups` | Oui |
| Historique de concentration | Table `user_backups` | Oui |
| Mode Ne pas déranger par domaine | Table `user_backups` | Oui |
| Règles d’organisation d’onglets | Table `user_backups` | Oui |
| Historique de recherche et tâche active | Table `user_backups` | Oui |

Les jetons OAuth, le vérificateur PKCE, le cache de compte, les diagnostics locaux et l’état transitoire du minuteur Pomodoro **ne sont jamais envoyés à Supabase**. Les paramètres durables du Pomodoro sont déjà inclus dans les préférences.

## 2. Migration Supabase obligatoire

La table `user_backups` doit exister avant la première sauvegarde complète. Dans le tableau de bord Supabase du projet AITools, ouvrez **SQL Editor**, créez une nouvelle requête, puis copiez et exécutez intégralement le fichier :

```text
supabase/migrations/20260819_user_backups.sql
```

La migration est idempotente : elle peut être rejouée sans créer de doublons. Elle crée la table, active RLS, ajoute les politiques qui limitent strictement chaque ligne à `auth.uid()` et accorde uniquement les opérations nécessaires au rôle authentifié.

Exécutez ensuite ce contrôle avec le dépôt local :

```bash
cd /chemin/vers/AITools
REQUIRE_USER_BACKUPS=1 node tests/supabase-readonly-health.mjs
```

Le résultat attendu est :

```text
supabase readonly health audit: ok (sauvegarde restaurable disponible)
```

## 3. Activation dans l’extension

Rechargez l’extension dans `chrome://extensions`, ouvrez **Préférences → Données**, puis connectez-vous avec Google si nécessaire. Vérifiez que la fonctionnalité **Synchronisation Supabase** est active dans **Composer votre AITools**. Cliquez ensuite sur **Sauvegarder et restaurer mon espace**.

Après cette première synchronisation, AITools déclenche aussi une sauvegarde différée après une modification de données durable. Une reconnexion Google lance immédiatement une restauration tolérante aux indisponibilités réseau, puis planifie un nouvel essai. Les actions locales ne sont jamais bloquées par une panne de Supabase.

## 4. Vérification de restauration

Commencez par créer ou modifier une note, une tâche et une préférence visible, puis utilisez le bouton de sauvegarde. Attendez le message de succès dans les Préférences. Vous pouvez ensuite simuler une perte locale sur un profil Chrome de test, vider les données de l’extension, relancer AITools et vous reconnecter avec le même compte Google. Les données synchronisées réapparaissent lors de la restauration.

Ne réalisez pas cette simulation sur le seul profil contenant des données non encore sauvegardées. Exportez d’abord une copie JSON depuis **Préférences → Exporter mes données locales**.

## 5. Limites connues et comportement attendu

La sauvegarde distante est volontairement limitée à **1,5 Mo** pour les collections complémentaires stockées dans `user_backups`. En cas de dépassement, AITools conserve toutes les données locales et affiche une erreur de synchronisation ; aucune suppression distante ou locale n’est effectuée. Réduisez alors l’historique ou exportez les données avant de relancer la sauvegarde.

Une suppression de cache ne restaure pas l’authentification : reconnectez-vous toujours avec le même compte Google. Une fois la session recréée, les données Supabase sont fusionnées avec les éventuelles données locales restantes afin de privilégier les versions les plus récentes des éléments identifiés.

## 6. Publication

Chargez l’archive `AITools-v8.4.0.zip` seulement après avoir appliqué la migration et validé le contrôle strict ci-dessus. Pour un nouveau projet Supabase, `supabase/schema.sql` contient également la table `user_backups`.
