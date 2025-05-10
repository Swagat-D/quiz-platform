/**
 * Generates an HTML email template with consistent branding
 * @param title - Email title/heading
 * @param content - Main content (can include HTML)
 * @param footerText - Optional footer text
 * @returns HTML string for the email
 */
export function generateEmailTemplate(
  title: string,
  content: string,
  footerText: string = 'This is an automated message from DevQuizWare.'
): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f8f9fa;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border: 1px solid #e4e4e4;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .header {
          background-color: #242b3d;
          padding: 24px;
          text-align: center;
        }
        .header h1 {
          color: #b388ff;
          margin: 0;
          font-size: 24px;
        }
        .content {
          padding: 24px;
        }
        .footer {
          background-color: #f5f5f5;
          padding: 15px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
        .btn {
          display: inline-block;
          background-color: #b388ff;
          color: white;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 4px;
          font-weight: bold;
        }
        @media only screen and (max-width: 600px) {
          .container {
            width: 100%;
            border-radius: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>${footerText}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generates plain text version of an email for clients that don't support HTML
 */
export function generatePlainTextEmail(
  title: string,
  content: string,
  footerText: string = 'This is an automated message from DevQuizWare.'
): string {
  // Remove any HTML tags for plain text version
  const plainContent = content.replace(/<[^>]*>?/gm, '');
  
  return `
${title.toUpperCase()}

${plainContent}

---
${footerText}
  `.trim();
}