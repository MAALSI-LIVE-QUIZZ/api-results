# API RESULTS

API pour recevoir et stocker les résultats de quiz en provenance de l'application React.

## 📋 Description

Cette API RESTful reçoit les résultats des quiz soumis par les utilisateurs et les stocke dans une base de données MariaDB. Elle gère les scores, les réponses détaillées et les métadonnées de session.

## 🚀 Démarrage

### Production

```bash
docker-compose up -d
```

L'API sera disponible sur `http://localhost:3030`

**Documentation Swagger:** `http://localhost:3030/api-docs`

### Développement (avec hot reload)

```bash
docker-compose -f compose.dev.yml up
```

Avec cette configuration, les modifications de code seront automatiquement rechargées grâce à nodemon.

## 📚 Documentation API (Swagger)

Une documentation interactive complète de l'API est disponible via Swagger UI:

- **Interface Swagger:** `http://localhost:3030/api-docs`
- **Spécification OpenAPI JSON:** `http://localhost:3030/api-docs.json`

Swagger UI vous permet de:
- Visualiser tous les endpoints disponibles
- Voir les schémas de données requis
- Tester les endpoints directement depuis le navigateur
- Télécharger la spécification OpenAPI

## 📡 Endpoints

### POST /api/quiz-results

Soumettre les résultats d'un quiz.

**Body (JSON):**
```json
{
  "email": "user@example.com",
  "quizId": 1,
  "quizTitle": "Quiz JavaScript",
  "score": {
    "correct": 8,
    "total": 10,
    "percentage": 80,
    "grade": "B"
  },
  "answers": [
    {
      "questionId": 1,
      "questionTitle": "Qu'est-ce que JavaScript?",
      "answerId": 2,
      "answerText": "Un langage de programmation",
      "isCorrect": true
    }
  ],
  "completedAt": "2025-01-15T10:30:00.000Z",
  "sessionDuration": 300
}
```

**Réponse (201):**
```json
{
  "success": true,
  "message": "Quiz results saved successfully",
  "resultId": 123
}
```

### GET /api/quiz-results

Récupérer les résultats de quiz (pour administration/tests).

**Query Parameters:**
- `email` (optionnel): Filtrer par email
- `quizId` (optionnel): Filtrer par ID de quiz
- `limit` (optionnel, défaut: 100): Nombre de résultats
- `offset` (optionnel, défaut: 0): Pagination

**Exemple:**
```bash
curl "http://localhost:3030/api/quiz-results?email=user@example.com&limit=10"
```

### GET /health

Vérifier l'état de l'API.

**Réponse (200):**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

## 🗄️ Structure de la base de données

### Table: quiz_results
- `id`: Identifiant unique
- `email`: Email de l'utilisateur
- `quiz_id`: ID du quiz
- `quiz_title`: Titre du quiz
- `completed_at`: Date de complétion
- `session_duration`: Durée de la session (en secondes)
- `created_at`: Date de création

### Table: quiz_scores
- `id`: Identifiant unique
- `result_id`: Référence vers quiz_results
- `correct_answers`: Nombre de bonnes réponses
- `total_questions`: Nombre total de questions
- `percentage`: Pourcentage de réussite
- `grade`: Note (A, B, C, etc.)

### Table: quiz_answers
- `id`: Identifiant unique
- `result_id`: Référence vers quiz_results
- `question_id`: ID de la question
- `question_title`: Titre de la question
- `answer_id`: ID de la réponse
- `answer_text`: Texte de la réponse
- `is_correct`: Réponse correcte ou non

## 🔧 Configuration

Copier `.env.example` vers `.env` et ajuster les valeurs si nécessaire:

```bash
cp .env.example .env
```

### Variables d'environnement

- `PORT`: Port de l'API (défaut: 80)
- `NODE_ENV`: Environnement (production/development)
- `DB_HOST`: Hôte de la base de données (défaut: db)
- `DB_PORT`: Port de la base de données (défaut: 3306)
- `DB_USER`: Utilisateur de la base de données
- `DB_PASSWORD`: Mot de passe de la base de données
- `DB_NAME`: Nom de la base de données

## 🛠️ Services Docker

- **API**: Port 3030 → 80
- **MariaDB**: Port 3306
- **Adminer**: Port 8080 (interface d'administration de la base de données)

Accéder à Adminer: `http://localhost:8080`
- Système: MySQL
- Serveur: db
- Utilisateur: apiresultsuser
- Mot de passe: apiresultspwd
- Base de données: cesi_live_quizz

## 📦 Dépendances

- **express**: Framework web
- **mysql2**: Driver MySQL/MariaDB
- **cors**: Support CORS
- **dotenv**: Gestion des variables d'environnement
- **swagger-ui-express**: Interface Swagger UI
- **swagger-jsdoc**: Génération de documentation OpenAPI
- **nodemon** (dev): Hot reload en développement

## 🔒 Sécurité

- Validation des données entrantes
- Requêtes SQL paramétrées (protection contre l'injection SQL)
- Transactions pour l'intégrité des données
- Gestion des erreurs complète

## 📝 Développement

### Installer les dépendances
```bash
npm install
```

### Lancer en mode développement
```bash
npm run dev
```

### Lancer en production
```bash
npm start
```
