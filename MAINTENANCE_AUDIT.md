# Audit de maintenance — AITools 5.1

L’audit de la version 5.0 a confirmé que la syntaxe des modules, le manifeste et les trois simulations existantes passent. Les zones suivantes ont néanmoins été retenues comme prioritaires.

| Priorité | Constat | Correction ou amélioration prévue |
|---|---|---|
| Haute | Une note créée hors ligne alors qu’un compte est connecté est conservée localement, mais l’échec distant remonte comme un échec complet. | Ajouter une file de synchronisation et exposer clairement l’état local/hors ligne. |
| Haute | La suppression hors ligne peut faire réapparaître une note lors de la synchronisation suivante. | Utiliser des tombstones locaux et les envoyer avant la réconciliation distante. |
| Haute | Les anciennes notes sans identifiant reçoivent un nouvel UUID à chaque lecture, ce qui peut dupliquer les imports. | Générer un identifiant déterministe compatible avec les données historiques. |
| Moyenne | Le client n’applique pas la limite de 10 000 caractères imposée par la base Supabase. | Valider la longueur avant l’écriture locale et distante. |
| Moyenne | La valeur des raccourcis vides restaure automatiquement les liens par défaut, empêchant une personnalisation complète. | Préserver explicitement un tableau vide comme choix utilisateur. |
| Moyenne | Les URL de raccourcis lues depuis le stockage ne sont pas revalidées au rendu. | Normaliser et filtrer les protocoles autorisés côté affichage. |
| Fonction | Il n’existe pas de liste locale de pages à lire ni de mécanisme de reprise de lecture. | Ajouter une liste de lecture locale avec capture de l’onglet actif, ouverture et suppression. |
| Fonction | Les préférences ne donnent pas de contrôle d’export simple pour les données locales. | Ajouter l’export JSON des données locales depuis Options. |

Les travaux suivants visent à conserver une approche local-first : aucune nouvelle permission de domaine ni aucune clé externe ne sera nécessaire pour les fonctions de liste de lecture et d’export.
