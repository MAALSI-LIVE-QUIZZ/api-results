const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Results - Quiz Results API',
      version: '1.0.0',
      description: 'API pour recevoir et stocker les résultats de quiz en provenance de l\'application React',
      contact: {
        name: 'API Support',
        url: 'https://github.com/MAALSI-LIVE-QUIZZ/api-results'
      }
    },
    servers: [
      {
        url: 'http://localhost:3030',
        description: 'Serveur de développement'
      },
      {
        url: 'http://localhost:80',
        description: 'Serveur de production (Docker)'
      }
    ],
    components: {
      schemas: {
        QuizScore: {
          type: 'object',
          required: ['correct', 'total', 'percentage', 'grade'],
          properties: {
            correct: {
              type: 'integer',
              description: 'Nombre de réponses correctes',
              example: 8
            },
            total: {
              type: 'integer',
              description: 'Nombre total de questions',
              example: 10
            },
            percentage: {
              type: 'number',
              format: 'float',
              description: 'Pourcentage de réussite',
              example: 80.0
            },
            grade: {
              type: 'string',
              description: 'Note (A, B, C, etc.)',
              example: 'B'
            }
          }
        },
        QuizAnswerDetail: {
          type: 'object',
          required: ['questionId', 'questionTitle', 'answerId', 'answerText', 'isCorrect'],
          properties: {
            questionId: {
              type: 'integer',
              description: 'ID de la question',
              example: 1
            },
            questionTitle: {
              type: 'string',
              description: 'Titre de la question',
              example: 'Qu\'est-ce que JavaScript?'
            },
            answerId: {
              type: 'integer',
              description: 'ID de la réponse',
              example: 2
            },
            answerText: {
              type: 'string',
              description: 'Texte de la réponse',
              example: 'Un langage de programmation'
            },
            isCorrect: {
              type: 'boolean',
              description: 'Réponse correcte ou non',
              example: true
            }
          }
        },
        QuizResult: {
          type: 'object',
          required: ['email', 'quizId', 'quizTitle', 'score', 'answers', 'completedAt', 'sessionDuration'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email de l\'utilisateur',
              example: 'user@example.com'
            },
            quizId: {
              type: 'integer',
              description: 'ID du quiz',
              example: 1
            },
            quizTitle: {
              type: 'string',
              description: 'Titre du quiz',
              example: 'Quiz JavaScript'
            },
            score: {
              $ref: '#/components/schemas/QuizScore'
            },
            answers: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/QuizAnswerDetail'
              },
              description: 'Liste des réponses détaillées'
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date et heure de complétion du quiz',
              example: '2025-01-15T10:30:00.000Z'
            },
            sessionDuration: {
              type: 'integer',
              description: 'Durée de la session en secondes',
              example: 300
            }
          }
        },
        QuizResultResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Quiz results saved successfully'
            },
            resultId: {
              type: 'integer',
              example: 123
            }
          }
        },
        QuizResultsList: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            count: {
              type: 'integer',
              example: 5
            },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  email: { type: 'string' },
                  quiz_id: { type: 'integer' },
                  quiz_title: { type: 'string' },
                  completed_at: { type: 'string', format: 'date-time' },
                  session_duration: { type: 'integer' },
                  created_at: { type: 'string', format: 'date-time' },
                  correct_answers: { type: 'integer' },
                  total_questions: { type: 'integer' },
                  percentage: { type: 'number' },
                  grade: { type: 'string' }
                }
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Error message'
            },
            message: {
              type: 'string',
              example: 'Detailed error description'
            }
          }
        },
        HealthCheck: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'ok'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-15T10:30:00.000Z'
            }
          }
        }
      }
    }
  },
  apis: ['./index.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
