# Sàmm 🛡️

Application web progressive (PWA) d'aide au repérage des arnaques et tentatives de fraude mobile money au Sénégal, conçue dans le cadre du hackathon **Open Source × AI** de **Galsen DEV**.

---

## Problème

L'adoption massive des services de mobile money (Wave, Orange Money, Free Money) s'accompagne d'une recrudescence des escroqueries ciblant les usagers par SMS, WhatsApp ou appels : usurpation d'identité d'opérateurs, faux messages de transfert de fonds, alertes de blocage de compte fictives ou pressions pour obtenir des codes secrets (OTP, PIN). Les utilisateurs, souvent démunis face à des formulations trompeuses, ont besoin d'un outil d'assistance rapide et transparent pour identifier les signaux d'alerte.

## Solution

**Sàmm** (« protéger / veiller » en wolof) offre une interface épurée, accessible et mobile d'abord permettant d'analyser un message suspect ou une capture d'écran. L'outil combine des règles heuristiques déterministes, une recherche de similarité sur un corpus ouvert d'arnaques documentées et un modèle de langage d'analyse. Il restitue un verdict explicite (symbole et texte), les signaux identifiés, une explication claire et la conduite recommandée.

## Démo

<!-- TODO: Ajouter le lien de démonstration en ligne et capture animée de l'interface -->
- Démo en ligne : TODO
- Vidéo de démonstration : TODO

## Comment fonctionne Sàmm

Le traitement s'articule autour d'un pipeline séquentiel en 7 étapes :

1. **Entrée** : Réception du message textuel saisi ou de la capture d'écran soumise par l'utilisateur.
2. **Lecture d'image** : Extraction du texte via OCR (`lib/ocr/`) avec Tesseract.js (et PaddleOCR en repli).
3. **Masquage** : Anonymisation préalable côté client via `maskText` (`lib/mask.ts`) afin de masquer au mieux les numéros de téléphone, montants et identités avant tout envoi réseau.
4. **Règles** : Analyse heuristique (`lib/rules.ts`) identifiant des signaux déterministes (termes d'urgence, demandes de code PIN/OTP) et activant le cas échéant un plancher minimal suspect.
5. **Recherche d'arnaques proches** : Récupération des scénarios frauduleux similaires (`lib/retrieve.ts`) au sein du corpus documenté (`scams/`).
6. **Modèle de langage** : Évaluation contextuelle (`lib/llm.ts`) par le modèle avec mise en cache (clé = version du prompt + message) et validation stricte de la sortie par schéma Zod.
7. **Verdict** : Restitution d'un verdict consolidé (niveau parmi « danger », « suspect » ou « aucun_signal », signaux courts, explication de 60 mots maximum et conduite à tenir issue de `conduite.yaml`).

## Installation et lancement

### Prérequis
- Node.js version 20 ou supérieure
- npm

### Installation
```bash
git clone https://github.com/loctetgenius221/samm.git
cd samm
npm install
```

### Lancement en mode développement
```bash
npm run dev
```
L'application est accessible à l'adresse [http://localhost:3000](http://localhost:3000).

### Scripts disponibles
- `npm run dev` : Démarre le serveur de développement Next.js avec Turbopack
- `npm run build` : Compile la version de production
- `npm run lint` : Vérifie la conformité du code avec ESLint
- `npm run validate:data` : Valide l'intégrité du corpus `scams/` et de `conduite.yaml`
- `npm run eval` : Exécute la suite d'évaluation du dataset

## Variables d'environnement

Copiez le fichier `.env.example` vers `.env` et complétez les valeurs selon votre fournisseur :

```bash
cp .env.example .env
```

| Variable | Description | Valeur par défaut / Exemple |
| :--- | :--- | :--- |
| `LLM_PROVIDER` | Fournisseur de l'API de modèle de langage (`groq` ou `cerebras`) | `groq` |
| `LLM_MODEL` | Identifiant du modèle utilisé | `openai/gpt-oss-120b` |
| `LLM_BASE_URL` | URL de l'API compatible OpenAI (optionnel si fournisseur par défaut) | `https://api.groq.com/openai/v1` |
| `GROQ_API_KEY` | Clé d'API Groq (requise si `LLM_PROVIDER=groq`) | - |
| `CEREBRAS_API_KEY` | Clé d'API Cerebras (requise si `LLM_PROVIDER=cerebras`) | - |

> **Remarque** : La configuration est validée à l'exécution de l'API (`lib/config.ts`). Le build Next.js s'exécute sans nécessiter ces variables d'environnement.

## Rôle de l'IA

L'intelligence artificielle intervient comme un module d'assistance et d'explication contextuelle. Elle ne remplace pas les règles heuristiques mais complète l'évaluation en explicitant les mécanismes de manipulation psychologique (urgence artificielle, intimidation, appât du gain) et en reliant les messages à des typologies de fraude connues.

## Modèles APIs et outils déclarés

| Outil / Modèle | Rôle | Licence / Accès | Fournisseur / Précision |
| :--- | :--- | :--- | :--- |
| `openai/gpt-oss-120b` | Modèle de langage pour l'analyse sémantique | Apache 2.0 | API Groq (secours : Cerebras) |
| `Tesseract.js` | Moteur OCR pour l'extraction de texte depuis les captures | Apache 2.0 | Exécution locale / worker |
| `PaddleOCR.js` | Moteur OCR alternatif | Apache 2.0 | Repli si utilisé |

### Outils d'IA utilisés pour le développement

- **Antigravity** (Google DeepMind) : Assistant de programmation agentique pour l'architecture, l'échafaudage du code et les tests.
- TODO : Ajouter les autres assistants et outils d'IA utilisés durant le projet.
- TODO : Renseigner les éventuels modèles ou générateurs tiers employés par l'équipe.

## Vie privée et limites

- **Protection des données** : Le masquage des informations sensibles (numéros de téléphone, montants, noms) est effectué côté client avant transmission : masquage au mieux, non garanti.
- TODO : Configurer la rétention des données chez le fournisseur du modèle (conservation zéro à activer dans sa console d'administration).
- **Avertissement** : Sàmm est un dispositif d'aide à la décision citoyen. Il aide à repérer les arnaques et ne garantit rien. En cas de doute, la règle reste de contacter directement l'opérateur via ses canaux officiels.

## Comment contribuer

Les contributions au code, à la documentation et au corpus d'arnaques sont les bienvenues. Consultez le guide détaillé dans [CONTRIBUTING.md](CONTRIBUTING.md) pour les consignes relatives aux formats de données, au masquage et à la validation avec `npm run validate:data`.

## Licences

- Code source de l'application : [Apache License 2.0](LICENSE) (Copyright 2026 Contributeurs de Sàmm).
- Données, corpus (`scams/`), conduites (`conduite.yaml`) et évaluations (`eval/`) : [Creative Commons Attribution 4.0 International (CC-BY-4.0)](DATA_LICENSE).
