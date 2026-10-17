# Guide de contribution à Sàmm

Merci de contribuer à **Sàmm** pour aider à protéger les usagers du mobile money au Sénégal.

## Comment ajouter une arnaque dans `scams/`

Le dossier `scams/` regroupe les scénarios d'escroqueries et de tentatives de phishing observés. Pour ajouter une nouvelle arnaque au corpus :

### 1. Créer un nouveau fichier JSON
Créez un fichier dans `scams/` portant un nom explicite (par exemple `scams/faux-gain-concours.json`).

### 2. Renseigner tous les champs obligatoires
Chaque entrée doit impérativement respecter le schéma suivant :

```json
{
  "id": "scam_identifiant_unique",
  "operateur": "Nom de l'opérateur (ex: Wave, Orange Money, Free Money)",
  "langue": "fr ou wo",
  "canal": "SMS, WhatsApp ou Appel",
  "niveau": "danger, suspect ou aucun_signal",
  "resume": "Synthèse courte du mode opératoire",
  "exemple_masque": "Texte du message avec données personnelles STRICTEMENT masquées",
  "signaux": [
    "Signal d'alerte court 1",
    "Signal d'alerte court 2"
  ],
  "conduite_id": "identifiant_existant_dans_conduite_yaml",
  "source": "Origine ou auteur du signalement vérifié",
  "date_source": "Date de recueil au format AAAA-MM-JJ"
}
```

### 3. Règles strictes de masquage
- **Anonymisation absolue** : Aucun numéro de téléphone réel, aucun nom d'expéditeur, aucun montant spécifique ni URL directe ne doit figurer dans `exemple_masque`.
- Utilisez les marqueurs de remplacement explicites :
  - `[NUMÉRO_MASQUÉ]` pour tout numéro
  - `[MONTANT_MASQUÉ]` pour tout montant
  - `[NOM_MASQUÉ]` pour toute identité
  - `[LIEN_MASQUÉ]` pour tout lien hypertexte

### 4. Source et date obligatoires
- Le champ `source` ne doit jamais être vide (indiquer le canal ou contributeur fiable).
- Le champ `date_source` doit préciser la date d'observation ou de documentation.

### 5. Vérification du `conduite_id`
- L'identifiant indiqué dans `conduite_id` doit impérativement exister dans `conduite.yaml`.

### 6. Règle terminologique
- Le champ `niveau` ne doit comporter que `danger`, `suspect` ou `aucun_signal`.
- Ne jamais employer le qualificatif « sûr ».

### 7. Valider les données localement
Avant de soumettre votre contribution, lancez la commande de validation :

```bash
npm run validate:data
```

Cette commande vérifie :
- La présence de tous les champs obligatoires
- L'existence de `source` et `date_source`
- La validité de `conduite_id` par rapport à `conduite.yaml`
- L'absence de contacts orphelins sans source dans `conduite.yaml`

---

## Vérifications du code

Si vous modifiez le code source de l'application :

```bash
# Vérifier le formatage et le lint
npm run lint

# Vérifier la compilation Next.js
npm run build
```

Toute contribution doit être soumise via une Pull Request sur GitHub.
