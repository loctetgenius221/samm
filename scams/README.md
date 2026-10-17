# Corpus d'arnaques Sàmm (`scams/`)

Ce dossier regroupe les entrées documentées des arnaques et tentatives d'escroquerie mobile money au Sénégal.

## Spécification du schéma d'une entrée

Chaque entrée représente un scénario d'arnaque identifié et doit comporter obligatoirement les champs suivants :

| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Identifiant unique de l'arnaque (ex: `scam_fictif_001`). |
| `operateur` | `string` | Opérateur mobile money concerné ou usurpé (ex: Wave, Orange Money, Free Money). |
| `langue` | `string` | Langue du message (`fr`, `wo`, etc.). |
| `canal` | `string` | Canal de communication (`SMS`, `WhatsApp`, `Appel`, etc.). |
| `niveau` | `string` | Niveau d'alerte : `danger`, `suspect` ou `aucun_signal` (**jamais** le terme « sûr »). |
| `resume` | `string` | Synthèse brève du scénario frauduleux. |
| `exemple_masque` | `string` | Texte type du message avec tous les numéros, montants et noms masqués. |
| `signaux` | `string[]` | Liste des indices et signaux d'alerte observés dans ce scénario. |
| `conduite_id` | `string` | Identifiant de la conduite à tenir définie dans `conduite.yaml`. |
| `source` | `string` | Origine ou contributeur du signalement. |
| `date_source` | `string` | Date du signalement (ou `TODO` si non renseignée). |

## Règles strictes relatives aux données

- **Anonymisation obligatoire** : Aucun vrai numéro de téléphone, aucune URL active ni nom de personne ne doit figurer dans les exemples de messages.
- **Transparence** : Tout exemple illustratif ou fictif doit être explicitement désigné comme tel.
- **TODO explicites** : Si une information d'origine est manquante ou en cours de vérification, le champ doit mentionner explicitement `TODO`.
