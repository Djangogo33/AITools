# Itération 5.3 — Gestion du travail local-first

La version 5.2 offre déjà des notes, une liste de lecture, un minuteur et une reprise de lecture. L’extension ne propose toutefois pas encore d’élément de planification actionnable. Cette itération ajoute un espace de tâches local, sans API externe ni nouvelle permission de domaine.

| Priorité | Besoin d’usage | Réponse prévue |
|---|---|---|
| Tâches rapides | Transformer une intention en action suivie, sans quitter le navigateur. | Créer, valider, supprimer et filtrer des tâches locales. |
| Priorisation | Distinguer une action urgente d’une tâche à réaliser plus tard. | Attribuer une priorité faible, normale ou haute ; classer les tâches à faire. |
| Reprise de contexte | Visualiser les prochaines actions au moment d’ouvrir un nouvel onglet. | Afficher les tâches non terminées prioritaires dans le tableau de bord du Nouvel onglet. |
| Concentration | Associer une tâche à la session de travail en cours. | Permettre de définir une tâche active, visible dans le popup et le Nouvel onglet avec le Pomodoro. |
| Portabilité | Conserver l’export/restauration introduit en 5.2. | Stocker les tâches sous une clé locale `aitools.*`, automatiquement incluse dans les sauvegardes. |
