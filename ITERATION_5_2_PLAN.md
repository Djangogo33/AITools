# Itération 5.2 — Priorités produit

L’itération conserve le principe **local-first** et n’ajoute ni service distant ni permission de domaine supplémentaire. Elle cible trois frictions observées après la version 5.1.

| Axe | Friction actuelle | Amélioration retenue |
|---|---|---|
| Reprise de lecture | La liste de lecture est accessible dans le popup, mais invisible au démarrage d’une nouvelle session. | Afficher les pages à lire prioritaires dans le Nouvel onglet, avec ouverture directe et compteur. |
| Portabilité des données | L’export JSON protège les données locales mais ne permet pas encore de les restaurer. | Ajouter un import JSON local validé, en excluant les sessions et en demandant confirmation lors d’un remplacement. |
| Concentration | Le Pomodoro est utile mais rigide à 25 minutes. | Ajouter une durée préférée, validée entre 5 et 120 minutes, utilisée par les interfaces et le raccourci clavier. |
| Accessibilité | Les interactions doivent rester perceptibles au clavier. | Uniformiser les indicateurs `:focus-visible` et enrichir les libellés d’actions essentiels. |
