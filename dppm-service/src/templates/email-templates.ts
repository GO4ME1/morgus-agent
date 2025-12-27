/**
 * Email Templates - Professional, Marketing, and Personal Emails
 * 
 * Generates styled HTML emails with responsive design
 */

export type EmailTemplateType = 
  | 'professional'
  | 'marketing'
  | 'newsletter'
  | 'follow-up'
  | 'thank-you'
  | 'welcome'
  | 'announcement'
  | 'invitation'
  | 'reminder'
  | 'cold-outreach';

export interface EmailData {
  subject: string;
  preheader?: string;
  sender: {
    name: string;
    email?: string;
    company?: string;
    title?: string;
    logo?: string;
  };
  recipient?: {
    name: string;
    company?: string;
  };
  greeting?: string;
  body: string | Array<{
    type: 'text' | 'heading' | 'button' | 'image' | 'list' | 'divider' | 'quote';
    content: string;
    url?: string;
    alt?: string;
  }>;
  signature?: {
    name: string;
    title?: string;
    company?: string;
    phone?: string;
    website?: string;
    socialLinks?: { platform: string; url: string }[];
  };
  cta?: {
    text: string;
    url: string;
    secondary?: { text: string; url: string };
  };
  footer?: string;
  unsubscribe?: string;
  theme?: 'light' | 'dark' | 'branded';
  brandColor?: string;
}

// Email-safe color schemes
const EMAIL_THEMES = {
  light: {
    background: '#f4f4f5',
    cardBg: '#ffffff',
    text: '#1a1a1a',
    muted: '#6b7280',
    primary: '#6366f1',
    accent: '#8b5cf6',
    border: '#e5e7eb',
  },
  dark: {
    background: '#1a1a2e',
    cardBg: '#2d2d44',
    text: '#ffffff',
    muted: '#a0a0a0',
    primary: '#00f5ff',
    accent: '#ff00ff',
    border: '#3d3d5c',
  },
  branded: {
    background: '#f4f4f5',
    cardBg: '#ffffff',
    text: '#1a1a1a',
    muted: '#6b7280',
    primary: '#6366f1', // Will be overridden by brandColor
    accent: '#8b5cf6',
    border: '#e5e7eb',
  },
};

/**
 * Detect email type from user message
 */
export function detectEmailTemplate(message: string): EmailTemplateType {
  const lower = message.toLowerCase();
  
  const patterns: Array<{ type: EmailTemplateType; keywords: string[] }> = [
    { type: 'professional', keywords: ['professional email', 'business email', 'formal email', 'work email'] },
    { type: 'marketing', keywords: ['marketing', 'promotional', 'promo', 'sale', 'discount', 'offer'] },
    { type: 'newsletter', keywords: ['newsletter', 'weekly update', 'monthly update', 'digest', 'roundup'] },
    { type: 'follow-up', keywords: ['follow up', 'follow-up', 'checking in', 'touching base', 'following up'] },
    { type: 'thank-you', keywords: ['thank you', 'thanks', 'appreciation', 'grateful'] },
    { type: 'welcome', keywords: ['welcome', 'onboarding', 'getting started', 'new user', 'new customer'] },
    { type: 'announcement', keywords: ['announcement', 'announce', 'launching', 'introducing', 'new feature'] },
    { type: 'invitation', keywords: ['invitation', 'invite', 'event', 'webinar', 'meeting', 'rsvp'] },
    { type: 'reminder', keywords: ['reminder', 'don\'t forget', 'upcoming', 'due', 'deadline'] },
    { type: 'cold-outreach', keywords: ['cold email', 'outreach', 'introduction', 'reaching out', 'connect'] },
  ];
  
  for (const pattern of patterns) {
    if (pattern.keywords.some(keyword => lower.includes(keyword))) {
      return pattern.type;
    }
  }
  
  return 'professional'; // Default
}

/**
 * Generate HTML email
 */
export function generateEmail(type: EmailTemplateType, data: EmailData): string {
  const themeKey = data.theme || 'light';
  const theme = { ...EMAIL_THEMES[themeKey] };
  if (data.brandColor) {
    theme.primary = data.brandColor;
  }
  
  const bodyContent = typeof data.body === 'string' 
    ? [{ type: 'text' as const, content: data.body }]
    : data.body;
  
  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${escapeHtml(data.subject)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset */
    body, table, td, p, a, li { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      background-color: ${theme.background};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
    }
    
    .email-body {
      background-color: ${theme.cardBg};
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .header {
      background: ${themeKey === 'dark' ? 'linear-gradient(135deg, #1a1a2e, #2d1b4e)' : theme.primary};
      padding: 30px 40px;
      text-align: center;
    }
    
    .header img {
      max-height: 50px;
      margin-bottom: 10px;
    }
    
    .header h1 {
      color: #ffffff;
      font-size: 24px;
      font-weight: 700;
      margin: 0;
      ${themeKey === 'dark' ? 'text-shadow: 0 0 20px rgba(0, 245, 255, 0.5);' : ''}
    }
    
    .content {
      padding: 40px;
      color: ${theme.text};
    }
    
    .greeting {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
      color: ${theme.text};
    }
    
    .body-text {
      font-size: 16px;
      line-height: 1.6;
      color: ${theme.text};
      margin-bottom: 20px;
    }
    
    .body-heading {
      font-size: 20px;
      font-weight: 600;
      color: ${theme.primary};
      margin: 30px 0 15px 0;
    }
    
    .cta-button {
      display: inline-block;
      background: ${theme.primary};
      color: #ffffff !important;
      padding: 14px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      ${themeKey === 'dark' ? 'box-shadow: 0 0 20px rgba(0, 245, 255, 0.3);' : ''}
    }
    
    .cta-button:hover {
      opacity: 0.9;
    }
    
    .secondary-button {
      display: inline-block;
      background: transparent;
      color: ${theme.primary} !important;
      padding: 12px 28px;
      border: 2px solid ${theme.primary};
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      margin: 10px 10px 10px 0;
    }
    
    .divider {
      height: 1px;
      background: ${theme.border};
      margin: 30px 0;
    }
    
    .quote-block {
      border-left: 4px solid ${theme.primary};
      padding-left: 20px;
      margin: 20px 0;
      font-style: italic;
      color: ${theme.muted};
    }
    
    .list-item {
      padding: 8px 0;
      padding-left: 20px;
      position: relative;
    }
    
    .list-item::before {
      content: "•";
      color: ${theme.primary};
      font-weight: bold;
      position: absolute;
      left: 0;
    }
    
    .signature {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid ${theme.border};
    }
    
    .signature-name {
      font-weight: 600;
      color: ${theme.text};
      margin-bottom: 5px;
    }
    
    .signature-title {
      font-size: 14px;
      color: ${theme.muted};
    }
    
    .signature-contact {
      font-size: 13px;
      color: ${theme.muted};
      margin-top: 10px;
    }
    
    .social-links {
      margin-top: 15px;
    }
    
    .social-links a {
      display: inline-block;
      margin-right: 10px;
      color: ${theme.primary};
      text-decoration: none;
    }
    
    .footer {
      background: ${themeKey === 'dark' ? '#1a1a2e' : '#f9fafb'};
      padding: 30px 40px;
      text-align: center;
      font-size: 13px;
      color: ${theme.muted};
    }
    
    .footer a {
      color: ${theme.primary};
      text-decoration: none;
    }
    
    .unsubscribe {
      margin-top: 15px;
      font-size: 12px;
    }
    
    /* Responsive */
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .content { padding: 25px !important; }
      .header { padding: 25px !important; }
      .footer { padding: 25px !important; }
    }
  </style>
</head>
<body>
  ${data.preheader ? `
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${escapeHtml(data.preheader)}
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  ` : ''}
  
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${theme.background};">
    <tr>
      <td style="padding: 40px 20px;">
        <div class="email-container">
          <div class="email-body">
            <!-- Header -->
            <div class="header">
              ${data.sender.logo ? `<img src="${escapeHtml(data.sender.logo)}" alt="${escapeHtml(data.sender.company || data.sender.name)}">` : ''}
              ${type === 'newsletter' || type === 'marketing' || type === 'announcement' 
                ? `<h1>${escapeHtml(data.subject)}</h1>` 
                : `<h1>${escapeHtml(data.sender.company || data.sender.name)}</h1>`}
            </div>
            
            <!-- Content -->
            <div class="content">
              ${data.greeting || data.recipient?.name 
                ? `<p class="greeting">${escapeHtml(data.greeting || `Hi ${data.recipient?.name},`)}</p>` 
                : ''}
              
              ${bodyContent.map(block => {
                switch (block.type) {
                  case 'heading':
                    return `<h2 class="body-heading">${escapeHtml(block.content)}</h2>`;
                  case 'button':
                    return `<p style="text-align: center;"><a href="${escapeHtml(block.url || '#')}" class="cta-button">${escapeHtml(block.content)}</a></p>`;
                  case 'image':
                    return `<p style="text-align: center;"><img src="${escapeHtml(block.content)}" alt="${escapeHtml(block.alt || '')}" style="max-width: 100%; border-radius: 8px;"></p>`;
                  case 'list':
                    return block.content.split('\n').map(item => 
                      `<div class="list-item">${escapeHtml(item.replace(/^[-*]\s*/, ''))}</div>`
                    ).join('');
                  case 'divider':
                    return '<div class="divider"></div>';
                  case 'quote':
                    return `<div class="quote-block">${escapeHtml(block.content)}</div>`;
                  default:
                    return `<p class="body-text">${escapeHtml(block.content).replace(/\n/g, '<br>')}</p>`;
                }
              }).join('')}
              
              ${data.cta ? `
              <p style="text-align: center; margin: 30px 0;">
                <a href="${escapeHtml(data.cta.url)}" class="cta-button">${escapeHtml(data.cta.text)}</a>
                ${data.cta.secondary ? `<br><a href="${escapeHtml(data.cta.secondary.url)}" class="secondary-button">${escapeHtml(data.cta.secondary.text)}</a>` : ''}
              </p>
              ` : ''}
              
              ${data.signature ? `
              <div class="signature">
                <div class="signature-name">${escapeHtml(data.signature.name)}</div>
                ${data.signature.title ? `<div class="signature-title">${escapeHtml(data.signature.title)}${data.signature.company ? ` at ${escapeHtml(data.signature.company)}` : ''}</div>` : ''}
                ${data.signature.phone || data.signature.website ? `
                <div class="signature-contact">
                  ${data.signature.phone ? escapeHtml(data.signature.phone) : ''}
                  ${data.signature.phone && data.signature.website ? ' | ' : ''}
                  ${data.signature.website ? `<a href="${escapeHtml(data.signature.website)}">${escapeHtml(data.signature.website.replace(/^https?:\/\//, ''))}</a>` : ''}
                </div>
                ` : ''}
                ${data.signature.socialLinks?.length ? `
                <div class="social-links">
                  ${data.signature.socialLinks.map(link => 
                    `<a href="${escapeHtml(link.url)}">${escapeHtml(link.platform)}</a>`
                  ).join('')}
                </div>
                ` : ''}
              </div>
              ` : ''}
            </div>
            
            <!-- Footer -->
            <div class="footer">
              ${data.footer ? `<p>${escapeHtml(data.footer)}</p>` : `
              <p>
                ${data.sender.company ? escapeHtml(data.sender.company) : escapeHtml(data.sender.name)}<br>
                ${data.sender.email ? `<a href="mailto:${escapeHtml(data.sender.email)}">${escapeHtml(data.sender.email)}</a>` : ''}
              </p>
              `}
              ${data.unsubscribe ? `
              <p class="unsubscribe">
                <a href="${escapeHtml(data.unsubscribe)}">Unsubscribe</a> from these emails
              </p>
              ` : ''}
            </div>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generate plain text version of email
 */
export function generatePlainTextEmail(data: EmailData): string {
  const bodyContent = typeof data.body === 'string' 
    ? data.body 
    : data.body.map(block => {
        if (block.type === 'button') return `[${block.content}](${block.url})`;
        if (block.type === 'divider') return '\n---\n';
        return block.content;
      }).join('\n\n');
  
  return `${data.subject}
${'='.repeat(data.subject.length)}

${data.greeting || (data.recipient?.name ? `Hi ${data.recipient.name},` : '')}

${bodyContent}

${data.cta ? `${data.cta.text}: ${data.cta.url}` : ''}

${data.signature ? `
--
${data.signature.name}
${data.signature.title || ''}${data.signature.company ? ` at ${data.signature.company}` : ''}
${data.signature.phone || ''}
${data.signature.website || ''}
` : ''}

${data.footer || `Sent by ${data.sender.company || data.sender.name}`}
${data.unsubscribe ? `\nUnsubscribe: ${data.unsubscribe}` : ''}
`.trim();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
