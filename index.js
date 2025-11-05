require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 80;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'API Results Documentation'
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Vérifier l'état de l'API
 *     description: Endpoint de santé pour vérifier que l'API fonctionne correctement
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: API en bon état de fonctionnement
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Validation middleware for quiz results
const validateQuizResult = (req, res, next) => {
  const { email, quizId, quizTitle, score, answers, completedAt, sessionDuration } = req.body;

  // Validate required fields
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing email' });
  }

  if (!quizId || typeof quizId !== 'number') {
    return res.status(400).json({ error: 'Invalid or missing quizId' });
  }

  if (!quizTitle || typeof quizTitle !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing quizTitle' });
  }

  if (!score || typeof score !== 'object') {
    return res.status(400).json({ error: 'Invalid or missing score' });
  }

  if (typeof score.correct !== 'number' || typeof score.total !== 'number' ||
      typeof score.percentage !== 'number' || typeof score.grade !== 'string') {
    return res.status(400).json({ error: 'Invalid score structure' });
  }

  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: 'Invalid or missing answers array' });
  }

  // Validate each answer
  for (const answer of answers) {
    if (typeof answer.questionId !== 'number' ||
        typeof answer.questionTitle !== 'string' ||
        typeof answer.answerId !== 'number' ||
        typeof answer.answerText !== 'string' ||
        typeof answer.isCorrect !== 'boolean') {
      return res.status(400).json({ error: 'Invalid answer structure' });
    }
  }

  if (!completedAt || typeof completedAt !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing completedAt' });
  }

  if (typeof sessionDuration !== 'number' || sessionDuration < 0) {
    return res.status(400).json({ error: 'Invalid or missing sessionDuration' });
  }

  next();
};

/**
 * @swagger
 * /api/quiz-results:
 *   post:
 *     summary: Soumettre les résultats d'un quiz
 *     description: Enregistre les résultats d'un quiz complété par un utilisateur, incluant le score et les réponses détaillées
 *     tags:
 *       - Quiz Results
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuizResult'
 *     responses:
 *       201:
 *         description: Résultats enregistrés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QuizResultResponse'
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/api/quiz-results', validateQuizResult, async (req, res) => {
  const { email, quizId, quizTitle, score, answers, completedAt, sessionDuration } = req.body;

  let connection;

  try {
    // Get database connection
    connection = await db.getConnection();

    // Start transaction
    await connection.beginTransaction();

    // Insert main quiz result
    const [resultInsert] = await connection.query(
      `INSERT INTO quiz_results
       (email, quiz_id, quiz_title, completed_at, session_duration)
       VALUES (?, ?, ?, ?, ?)`,
      [email, quizId, quizTitle, new Date(completedAt), sessionDuration]
    );

    const resultId = resultInsert.insertId;

    // Insert quiz score
    await connection.query(
      `INSERT INTO quiz_scores
       (result_id, correct_answers, total_questions, percentage, grade)
       VALUES (?, ?, ?, ?, ?)`,
      [resultId, score.correct, score.total, score.percentage, score.grade]
    );

    // Insert all answers
    for (const answer of answers) {
      await connection.query(
        `INSERT INTO quiz_answers
         (result_id, question_id, question_title, answer_id, answer_text, is_correct)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          resultId,
          answer.questionId,
          answer.questionTitle,
          answer.answerId,
          answer.answerText,
          answer.isCorrect
        ]
      );
    }

    // Commit transaction
    await connection.commit();

    console.log(`Quiz result saved successfully - ID: ${resultId}, Email: ${email}, Quiz: ${quizTitle}`);

    res.status(201).json({
      success: true,
      message: 'Quiz results saved successfully',
      resultId: resultId
    });

  } catch (error) {
    // Rollback transaction on error
    if (connection) {
      await connection.rollback();
    }

    console.error('Error saving quiz results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save quiz results',
      message: error.message
    });
  } finally {
    // Release connection back to pool
    if (connection) {
      connection.release();
    }
  }
});

/**
 * @swagger
 * /api/quiz-results:
 *   get:
 *     summary: Récupérer les résultats de quiz
 *     description: Récupère une liste de résultats de quiz avec possibilité de filtrer par email ou ID de quiz
 *     tags:
 *       - Quiz Results
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Filtrer par email d'utilisateur
 *       - in: query
 *         name: quizId
 *         schema:
 *           type: integer
 *         description: Filtrer par ID de quiz
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Nombre maximum de résultats à retourner
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Nombre de résultats à ignorer (pagination)
 *     responses:
 *       200:
 *         description: Liste des résultats de quiz
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QuizResultsList'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/quiz-results', async (req, res) => {
  try {
    const { email, quizId, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT
        qr.id, qr.email, qr.quiz_id, qr.quiz_title,
        qr.completed_at, qr.session_duration, qr.created_at,
        qs.correct_answers, qs.total_questions, qs.percentage, qs.grade
      FROM quiz_results qr
      LEFT JOIN quiz_scores qs ON qr.id = qs.result_id
      WHERE 1=1
    `;

    const params = [];

    if (email) {
      query += ' AND qr.email = ?';
      params.push(email);
    }

    if (quizId) {
      query += ' AND qr.quiz_id = ?';
      params.push(parseInt(quizId));
    }

    query += ' ORDER BY qr.completed_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const results = await db.query(query, params);

    res.json({
      success: true,
      count: results.length,
      data: results
    });

  } catch (error) {
    console.error('Error fetching quiz results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quiz results',
      message: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database with retries
    await db.initializeDatabase();

    // Start Express server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`API RESULTS service is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Database: ${process.env.DB_NAME || 'cesi_live_quizz'}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await db.closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server...');
  await db.closePool();
  process.exit(0);
});

// Start the server
startServer();
