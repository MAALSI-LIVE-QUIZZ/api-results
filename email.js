const nodemailer = require('nodemailer');

// Create SMTP transporter
const createTransporter = () => {
  const config = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  };

  return nodemailer.createTransport(config);
};

// Generate HTML email template for quiz results
const generateEmailHTML = (quizResult) => {
  const { email, quizTitle, score, answers, completedAt, sessionDuration } = quizResult;

  // Determine score color based on percentage
  const getScoreColor = (percentage) => {
    if (percentage >= 70) return '#10b981'; // green
    if (percentage >= 50) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  const scoreColor = getScoreColor(score.percentage);

  // Format duration
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Generate answers table rows
  const answersHTML = answers.map((answer, index) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; text-align: center; font-weight: 600; color: #6b7280;">${index + 1}</td>
      <td style="padding: 12px;">
        <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">${answer.questionTitle}</div>
        <div style="color: #6b7280; font-size: 14px;">${answer.answerText}</div>
      </td>
      <td style="padding: 12px; text-align: center;">
        ${answer.isCorrect
          ? '<span style="display: inline-block; background-color: #dcfce7; color: #16a34a; padding: 4px 12px; border-radius: 9999px; font-weight: 600; font-size: 14px;">✓ Correct</span>'
          : '<span style="display: inline-block; background-color: #fee2e2; color: #dc2626; padding: 4px 12px; border-radius: 9999px; font-weight: 600; font-size: 14px;">✗ Incorrect</span>'
        }
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Résultats du Quiz</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 40px 20px;">
            <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; border-radius: 8px 8px 0 0; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🎯 Résultats du Quiz</h1>
                  <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">${quizTitle}</p>
                </td>
              </tr>

              <!-- Score Section -->
              <tr>
                <td style="padding: 40px 30px; text-align: center; background-color: #f9fafb;">
                  <div style="background-color: ${scoreColor}; color: #ffffff; padding: 30px; border-radius: 12px; margin-bottom: 20px;">
                    <div style="font-size: 48px; font-weight: 700; margin-bottom: 8px;">${score.percentage}%</div>
                    <div style="font-size: 20px; font-weight: 600; opacity: 0.9;">Note: ${score.grade}</div>
                    <div style="font-size: 16px; margin-top: 12px; opacity: 0.8;">${score.correct} / ${score.total} bonnes réponses</div>
                  </div>
                </td>
              </tr>

              <!-- Details Section -->
              <tr>
                <td style="padding: 0 30px 30px 30px;">
                  <h2 style="color: #1f2937; font-size: 20px; font-weight: 600; margin: 0 0 20px 0;">📋 Détails des réponses</h2>

                  <table role="presentation" style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                    <thead>
                      <tr style="background-color: #f9fafb;">
                        <th style="padding: 12px; text-align: center; color: #6b7280; font-weight: 600; font-size: 14px; width: 50px;">#</th>
                        <th style="padding: 12px; text-align: left; color: #6b7280; font-weight: 600; font-size: 14px;">Question et Réponse</th>
                        <th style="padding: 12px; text-align: center; color: #6b7280; font-weight: 600; font-size: 14px; width: 120px;">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${answersHTML}
                    </tbody>
                  </table>
                </td>
              </tr>

              <!-- Info Section -->
              <tr>
                <td style="padding: 0 30px 30px 30px;">
                  <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
                    <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 16px; font-weight: 600;">📊 Informations de session</h3>
                    <div style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                      <div style="margin-bottom: 6px;"><strong>Email:</strong> ${email}</div>
                      <div style="margin-bottom: 6px;"><strong>Date de complétion:</strong> ${formatDate(completedAt)}</div>
                      <div><strong>Durée:</strong> ${formatDuration(sessionDuration)}</div>
                    </div>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">
                    Merci d'avoir participé à ce quiz!
                  </p>
                  <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
                    Cet email a été envoyé automatiquement, merci de ne pas y répondre.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// Send quiz results email
const sendQuizResultsEmail = async (quizResult) => {
  // Check if email is enabled
  if (process.env.SMTP_ENABLED !== 'true') {
    console.log('Email sending is disabled (SMTP_ENABLED != true)');
    return { success: false, message: 'Email disabled' };
  }

  // Validate required environment variables
  const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM_EMAIL'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error(`Missing required email environment variables: ${missingVars.join(', ')}`);
    return { success: false, message: `Missing env vars: ${missingVars.join(', ')}` };
  }

  try {
    const transporter = createTransporter();

    // Prepare email options
    const mailOptions = {
      from: {
        name: process.env.SMTP_FROM_NAME || 'Quiz Results',
        address: process.env.SMTP_FROM_EMAIL
      },
      to: quizResult.email,
      subject: `Quiz ${quizResult.quizTitle} - Score: ${quizResult.score.percentage}% (${quizResult.score.grade})`,
      html: generateEmailHTML(quizResult)
    };

    // Add BCC if configured
    if (process.env.SMTP_BCC_EMAIL) {
      mailOptions.bcc = process.env.SMTP_BCC_EMAIL;
    }

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log(`Email sent successfully to ${quizResult.email} - Message ID: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
      recipient: quizResult.email
    };

  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  sendQuizResultsEmail
};
