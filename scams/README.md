# Corpus d'arnaques (`scams/`)

Une arnaque documentée par fichier JSON : ajouter une arnaque, c'est ouvrir une pull request.

## Ajouter une arnaque

1. Copiez le gabarit ci-dessous dans `scams/<operateur>-<scenario>.json` (exemple : `scams/wave-faux-transfert-code-sms.json`).
2. Remplissez chaque champ. Sous VS Code, le schéma `schema.json` complète et vérifie le fichier pendant la saisie.
3. Lancez `npm run validate:data` : la commande liste tout ce qui manque.

```json
{
  "id": "wave-faux-transfert-code-sms",
  "operateur": "Wave",
  "langue": "fr",
  "canal": "sms",
  "niveau": "danger",
  "resume": "Faux transfert reçu, puis faux expéditeur qui demande un code SMS",
  "exemple_masque": "Vous avez reçu [MONTANT_MASQUE] de [NOM_MASQUE]. Pouvez-vous me renvoyer le code reçu ?",
  "signaux": ["Demande d'un code reçu par SMS", "Erreur d'envoi invoquée pour créer l'urgence"],
  "conduite_id": "conduite_suspicion_generale",
  "source": "https://lien-vers-l-article-ou-l-avertissement",
  "date_source": "2022-01-14"
}
```

## Champs

| Champ | Contenu |
| :--- | :--- |
| `id` | Identifiant unique, en minuscules avec tirets |
| `operateur` | Opérateur visé ou usurpé : Wave, Orange Money, Free Money, Senelec… |
| `langue` | `fr` ou `wo` |
| `canal` | `sms`, `whatsapp`, `appel`… |
| `niveau` | `danger`, `suspect` ou `aucun_signal`, jamais « sûr » |
| `resume` | Le mode opératoire en une phrase |
| `exemple_masque` | Le message type, données personnelles remplacées par les marqueurs ci-dessous |
| `signaux` | Au moins un signal d'alerte court |
| `conduite_id` | Un `id` existant dans `conduite.yaml` |
| `source` | Lien de l'article, de l'avertissement officiel, ou origine du témoignage |
| `date_source` | Date de publication ou d'observation, au format `AAAA-MM-JJ` |

## Masquage

Remplacez toute donnée personnelle par le marqueur que produit `lib/mask.ts` :

| Donnée | Marqueur |
| :--- | :--- |
| Numéro de téléphone | `[NUMERO_MASQUE]` |
| Montant | `[MONTANT_MASQUE]` |
| Nom de personne | `[NOM_MASQUE]` |
| Lien | `[LIEN_MASQUE]` |
| Code secret ou OTP | `[CODE_MASQUE]` |

La CI refuse une entrée sans source, sans date valide, ou dont `exemple_masque` contient encore un numéro, un montant ou un lien. Les noms ne sont détectés qu'en partie : relisez-les vous-même.

Les variantes réservées à l'évaluation (`eval/`) ne doivent pas figurer ici, sinon la mesure sur variantes inédites perd son sens.
