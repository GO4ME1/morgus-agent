/**
 * Document Templates - Professional PDFs, Reports, Letters
 * 
 * Generates styled HTML that can be converted to PDF
 */

export type DocumentTemplateType = 
  | 'report'
  | 'proposal'
  | 'contract'
  | 'resume'
  | 'cover-letter'
  | 'letter'
  | 'invoice'
  | 'memo'
  | 'whitepaper'
  | 'case-study';

export interface DocumentData {
  title: string;
  subtitle?: string;
  author?: string;
  date?: string;
  recipient?: {
    name: string;
    title?: string;
    company?: string;
    address?: string;
  };
  sender?: {
    name: string;
    title?: string;
    company?: string;
    address?: string;
    email?: string;
    phone?: string;
  };
  sections: Array<{
    title?: string;
    content: string;
    type?: 'text' | 'list' | 'table' | 'quote' | 'highlight';
  }>;
  footer?: string;
  logo?: string;
  theme?: 'professional' | 'modern' | 'minimal' | 'creative';
}

// Color themes
const THEMES = {
  professional: {
    primary: '#1a365d',
    secondary: '#2c5282',
    accent: '#3182ce',
    text: '#1a202c',
    muted: '#718096',
    background: '#ffffff',
    headerBg: '#1a365d',
  },
  modern: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#a855f7',
    text: '#1e1e2e',
    muted: '#64748b',
    background: '#ffffff',
    headerBg: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  },
  minimal: {
    primary: '#000000',
    secondary: '#333333',
    accent: '#666666',
    text: '#1a1a1a',
    muted: '#888888',
    background: '#ffffff',
    headerBg: '#000000',
  },
  creative: {
    primary: '#00f5ff',
    secondary: '#ff00ff',
    accent: '#00ff88',
    text: '#ffffff',
    muted: '#a0a0a0',
    background: '#0a0a0f',
    headerBg: 'linear-gradient(135deg, #1a1a2e, #2d1b4e)',
  },
};

/**
 * Detect document type from user message
 */
export function detectDocumentTemplate(message: string): DocumentTemplateType {
  const lower = message.toLowerCase();
  
  const patterns: Array<{ type: DocumentTemplateType; keywords: string[] }> = [
    { type: 'report', keywords: ['report', 'analysis report', 'status report', 'annual report', 'quarterly'] },
    { type: 'proposal', keywords: ['proposal', 'business proposal', 'project proposal', 'bid', 'rfp'] },
    { type: 'contract', keywords: ['contract', 'agreement', 'terms', 'legal', 'nda', 'mou'] },
    { type: 'resume', keywords: ['resume', 'cv', 'curriculum vitae', 'job application'] },
    { type: 'cover-letter', keywords: ['cover letter', 'application letter', 'job letter'] },
    { type: 'letter', keywords: ['letter', 'formal letter', 'business letter', 'correspondence'] },
    { type: 'invoice', keywords: ['invoice', 'bill', 'billing statement'] },
    { type: 'memo', keywords: ['memo', 'memorandum', 'internal', 'notice'] },
    { type: 'whitepaper', keywords: ['whitepaper', 'white paper', 'technical paper', 'research'] },
    { type: 'case-study', keywords: ['case study', 'success story', 'client story'] },
  ];
  
  for (const pattern of patterns) {
    if (pattern.keywords.some(keyword => lower.includes(keyword))) {
      return pattern.type;
    }
  }
  
  return 'report'; // Default
}

/**
 * Generate document HTML
 */
export function generateDocument(type: DocumentTemplateType, data: DocumentData): string {
  const theme = THEMES[data.theme || 'professional'];
  const isCreative = data.theme === 'creative';
  
  switch (type) {
    case 'resume':
      return generateResume(data, theme);
    case 'cover-letter':
    case 'letter':
      return generateLetter(data, theme);
    case 'invoice':
      return generateInvoiceDoc(data, theme);
    case 'proposal':
      return generateProposal(data, theme);
    default:
      return generateReport(data, theme, isCreative);
  }
}

function generateReport(data: DocumentData, theme: any, isCreative: boolean): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:wght@400;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: ${theme.text};
      background: ${theme.background};
      ${isCreative ? `
        background-image: 
          radial-gradient(ellipse at top left, rgba(0, 245, 255, 0.05) 0%, transparent 50%),
          radial-gradient(ellipse at bottom right, rgba(255, 0, 255, 0.05) 0%, transparent 50%);
      ` : ''}
    }
    
    .document {
      max-width: 210mm;
      margin: 0 auto;
      padding: 2rem;
      ${isCreative ? `
        background: rgba(20, 20, 35, 0.95);
        border-radius: 20px;
        box-shadow: 0 0 60px rgba(0, 245, 255, 0.1);
        border: 1px solid rgba(0, 245, 255, 0.2);
      ` : ''}
    }
    
    .header {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 3px solid ${theme.primary};
    }
    
    .logo {
      max-height: 60px;
      margin-bottom: 1rem;
    }
    
    .title {
      font-family: 'Merriweather', serif;
      font-size: 28pt;
      font-weight: 700;
      color: ${theme.primary};
      margin-bottom: 0.5rem;
      ${isCreative ? `
        background: linear-gradient(135deg, ${theme.primary}, ${theme.secondary});
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-shadow: 0 0 30px rgba(0, 245, 255, 0.3);
      ` : ''}
    }
    
    .subtitle {
      font-size: 14pt;
      color: ${theme.muted};
    }
    
    .meta {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin-top: 1rem;
      font-size: 10pt;
      color: ${theme.muted};
    }
    
    .section {
      margin-bottom: 1.5rem;
    }
    
    .section-title {
      font-size: 14pt;
      font-weight: 600;
      color: ${theme.primary};
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid ${theme.accent};
      ${isCreative ? `
        color: ${theme.primary};
        text-shadow: 0 0 10px rgba(0, 245, 255, 0.5);
      ` : ''}
    }
    
    .section-content {
      text-align: justify;
    }
    
    .section-content p {
      margin-bottom: 0.75rem;
    }
    
    .highlight-box {
      background: ${isCreative ? 'rgba(0, 245, 255, 0.1)' : '#f7fafc'};
      border-left: 4px solid ${theme.accent};
      padding: 1rem;
      margin: 1rem 0;
      border-radius: 0 8px 8px 0;
    }
    
    .quote {
      font-style: italic;
      font-size: 12pt;
      color: ${theme.muted};
      border-left: 4px solid ${theme.secondary};
      padding-left: 1rem;
      margin: 1rem 0;
    }
    
    ul, ol {
      margin-left: 1.5rem;
      margin-bottom: 1rem;
    }
    
    li {
      margin-bottom: 0.5rem;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }
    
    th, td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid ${isCreative ? 'rgba(255,255,255,0.1)' : '#e2e8f0'};
    }
    
    th {
      background: ${isCreative ? 'rgba(0, 245, 255, 0.1)' : '#f7fafc'};
      font-weight: 600;
      color: ${theme.primary};
    }
    
    .footer {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid ${isCreative ? 'rgba(255,255,255,0.1)' : '#e2e8f0'};
      text-align: center;
      font-size: 9pt;
      color: ${theme.muted};
    }
    
    @media print {
      body { background: white; }
      .document { box-shadow: none; border: none; }
    }
  </style>
</head>
<body>
  <div class="document">
    <header class="header">
      ${data.logo ? `<img src="${escapeHtml(data.logo)}" alt="Logo" class="logo">` : ''}
      <h1 class="title">${escapeHtml(data.title)}</h1>
      ${data.subtitle ? `<p class="subtitle">${escapeHtml(data.subtitle)}</p>` : ''}
      <div class="meta">
        ${data.author ? `<span>By: ${escapeHtml(data.author)}</span>` : ''}
        ${data.date ? `<span>Date: ${escapeHtml(data.date)}</span>` : ''}
      </div>
    </header>
    
    <main>
      ${data.sections.map(section => `
        <section class="section">
          ${section.title ? `<h2 class="section-title">${escapeHtml(section.title)}</h2>` : ''}
          <div class="section-content ${section.type === 'highlight' ? 'highlight-box' : ''} ${section.type === 'quote' ? 'quote' : ''}">
            ${formatContent(section.content, section.type)}
          </div>
        </section>
      `).join('')}
    </main>
    
    ${data.footer ? `<footer class="footer">${escapeHtml(data.footer)}</footer>` : ''}
  </div>
</body>
</html>`;
}

function generateResume(data: DocumentData, theme: any): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.title)} - Resume</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: A4; margin: 1.5cm; }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: ${theme.text};
      background: ${theme.background};
    }
    
    .resume {
      max-width: 210mm;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 0;
    }
    
    .sidebar {
      background: ${theme.primary};
      color: white;
      padding: 2rem 1.5rem;
    }
    
    .main {
      padding: 2rem;
    }
    
    .name {
      font-size: 24pt;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }
    
    .title-role {
      font-size: 12pt;
      opacity: 0.9;
      margin-bottom: 1.5rem;
    }
    
    .sidebar-section {
      margin-bottom: 1.5rem;
    }
    
    .sidebar-title {
      font-size: 10pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid rgba(255,255,255,0.3);
    }
    
    .contact-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      font-size: 9pt;
    }
    
    .skill-bar {
      height: 6px;
      background: rgba(255,255,255,0.2);
      border-radius: 3px;
      margin-top: 0.25rem;
      margin-bottom: 0.75rem;
    }
    
    .skill-fill {
      height: 100%;
      background: ${theme.accent};
      border-radius: 3px;
    }
    
    .main-title {
      font-size: 14pt;
      font-weight: 600;
      color: ${theme.primary};
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid ${theme.accent};
    }
    
    .experience-item {
      margin-bottom: 1.5rem;
    }
    
    .exp-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 0.25rem;
    }
    
    .exp-title {
      font-weight: 600;
      color: ${theme.primary};
    }
    
    .exp-date {
      font-size: 9pt;
      color: ${theme.muted};
    }
    
    .exp-company {
      font-size: 10pt;
      color: ${theme.secondary};
      margin-bottom: 0.5rem;
    }
    
    .exp-description {
      font-size: 9pt;
      color: ${theme.text};
    }
    
    ul {
      margin-left: 1rem;
      margin-top: 0.5rem;
    }
    
    li {
      margin-bottom: 0.25rem;
      font-size: 9pt;
    }
  </style>
</head>
<body>
  <div class="resume">
    <aside class="sidebar">
      <h1 class="name">${escapeHtml(data.sender?.name || data.title)}</h1>
      <p class="title-role">${escapeHtml(data.sender?.title || data.subtitle || '')}</p>
      
      <div class="sidebar-section">
        <h3 class="sidebar-title">Contact</h3>
        ${data.sender?.email ? `<div class="contact-item">📧 ${escapeHtml(data.sender.email)}</div>` : ''}
        ${data.sender?.phone ? `<div class="contact-item">📱 ${escapeHtml(data.sender.phone)}</div>` : ''}
        ${data.sender?.address ? `<div class="contact-item">📍 ${escapeHtml(data.sender.address)}</div>` : ''}
      </div>
      
      ${data.sections.filter(s => s.title?.toLowerCase().includes('skill')).map(section => `
        <div class="sidebar-section">
          <h3 class="sidebar-title">${escapeHtml(section.title || 'Skills')}</h3>
          ${formatSkills(section.content)}
        </div>
      `).join('')}
    </aside>
    
    <main class="main">
      ${data.sections.filter(s => !s.title?.toLowerCase().includes('skill')).map(section => `
        <section style="margin-bottom: 1.5rem;">
          ${section.title ? `<h2 class="main-title">${escapeHtml(section.title)}</h2>` : ''}
          <div>${formatContent(section.content, section.type)}</div>
        </section>
      `).join('')}
    </main>
  </div>
</body>
</html>`;
}

function generateLetter(data: DocumentData, theme: any): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Merriweather:wght@400&display=swap" rel="stylesheet">
  <style>
    @page { size: A4; margin: 2.5cm; }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Merriweather', Georgia, serif;
      font-size: 11pt;
      line-height: 1.8;
      color: ${theme.text};
      background: ${theme.background};
    }
    
    .letter {
      max-width: 210mm;
      margin: 0 auto;
      padding: 2rem;
    }
    
    .letterhead {
      text-align: right;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid ${theme.primary};
    }
    
    .sender-name {
      font-family: 'Inter', sans-serif;
      font-size: 18pt;
      font-weight: 600;
      color: ${theme.primary};
    }
    
    .sender-details {
      font-size: 9pt;
      color: ${theme.muted};
      margin-top: 0.5rem;
    }
    
    .date {
      margin-bottom: 2rem;
      color: ${theme.muted};
    }
    
    .recipient {
      margin-bottom: 2rem;
    }
    
    .recipient-name {
      font-weight: 600;
    }
    
    .salutation {
      margin-bottom: 1.5rem;
    }
    
    .body p {
      margin-bottom: 1rem;
      text-align: justify;
    }
    
    .closing {
      margin-top: 2rem;
    }
    
    .signature {
      margin-top: 3rem;
      font-family: 'Inter', sans-serif;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="letter">
    <header class="letterhead">
      <div class="sender-name">${escapeHtml(data.sender?.name || '')}</div>
      <div class="sender-details">
        ${data.sender?.title ? escapeHtml(data.sender.title) + '<br>' : ''}
        ${data.sender?.address ? escapeHtml(data.sender.address) + '<br>' : ''}
        ${data.sender?.email ? escapeHtml(data.sender.email) + ' | ' : ''}
        ${data.sender?.phone ? escapeHtml(data.sender.phone) : ''}
      </div>
    </header>
    
    <div class="date">${escapeHtml(data.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }))}</div>
    
    ${data.recipient ? `
    <address class="recipient">
      <div class="recipient-name">${escapeHtml(data.recipient.name)}</div>
      ${data.recipient.title ? `<div>${escapeHtml(data.recipient.title)}</div>` : ''}
      ${data.recipient.company ? `<div>${escapeHtml(data.recipient.company)}</div>` : ''}
      ${data.recipient.address ? `<div>${escapeHtml(data.recipient.address)}</div>` : ''}
    </address>
    ` : ''}
    
    <div class="salutation">Dear ${escapeHtml(data.recipient?.name || 'Hiring Manager')},</div>
    
    <div class="body">
      ${data.sections.map(section => formatContent(section.content, section.type)).join('')}
    </div>
    
    <div class="closing">
      <p>Sincerely,</p>
      <div class="signature">${escapeHtml(data.sender?.name || '')}</div>
    </div>
  </div>
</body>
</html>`;
}

function generateInvoiceDoc(data: DocumentData, theme: any): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: A4; margin: 1.5cm; }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', sans-serif;
      font-size: 10pt;
      color: ${theme.text};
      background: ${theme.background};
    }
    
    .invoice {
      max-width: 210mm;
      margin: 0 auto;
      padding: 2rem;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 3px solid ${theme.primary};
    }
    
    .company-name {
      font-size: 24pt;
      font-weight: 700;
      color: ${theme.primary};
    }
    
    .invoice-title {
      font-size: 28pt;
      font-weight: 700;
      color: ${theme.muted};
      text-transform: uppercase;
    }
    
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 2rem;
    }
    
    .detail-section h3 {
      font-size: 9pt;
      text-transform: uppercase;
      color: ${theme.muted};
      margin-bottom: 0.5rem;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 2rem;
    }
    
    .items-table th {
      background: ${theme.primary};
      color: white;
      padding: 0.75rem;
      text-align: left;
      font-weight: 600;
    }
    
    .items-table td {
      padding: 0.75rem;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .items-table tr:nth-child(even) {
      background: #f7fafc;
    }
    
    .totals {
      width: 300px;
      margin-left: auto;
    }
    
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .totals-row.total {
      font-size: 14pt;
      font-weight: 700;
      color: ${theme.primary};
      border-bottom: 3px solid ${theme.primary};
      padding: 1rem 0;
    }
    
    .footer {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 9pt;
      color: ${theme.muted};
    }
  </style>
</head>
<body>
  <div class="invoice">
    <header class="header">
      <div>
        <div class="company-name">${escapeHtml(data.sender?.company || data.sender?.name || 'Company')}</div>
        <div style="font-size: 9pt; color: ${theme.muted}; margin-top: 0.5rem;">
          ${data.sender?.address ? escapeHtml(data.sender.address) + '<br>' : ''}
          ${data.sender?.email ? escapeHtml(data.sender.email) : ''}
        </div>
      </div>
      <div class="invoice-title">Invoice</div>
    </header>
    
    <div class="details-grid">
      <div class="detail-section">
        <h3>Bill To</h3>
        <div>
          <strong>${escapeHtml(data.recipient?.name || 'Client')}</strong><br>
          ${data.recipient?.company ? escapeHtml(data.recipient.company) + '<br>' : ''}
          ${data.recipient?.address ? escapeHtml(data.recipient.address) : ''}
        </div>
      </div>
      <div class="detail-section" style="text-align: right;">
        <h3>Invoice Details</h3>
        <div>
          <strong>Invoice #:</strong> INV-${Date.now().toString().slice(-6)}<br>
          <strong>Date:</strong> ${escapeHtml(data.date || new Date().toLocaleDateString())}<br>
          <strong>Due Date:</strong> ${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()}
        </div>
      </div>
    </div>
    
    ${data.sections.map(section => formatContent(section.content, section.type)).join('')}
    
    <footer class="footer">
      ${data.footer || 'Thank you for your business!'}
    </footer>
  </div>
</body>
</html>`;
}

function generateProposal(data: DocumentData, theme: any): string {
  return generateReport(data, theme, false);
}

function formatContent(content: string, type?: string): string {
  if (type === 'list') {
    const items = content.split('\n').filter(line => line.trim());
    return `<ul>${items.map(item => `<li>${escapeHtml(item.replace(/^[-*]\s*/, ''))}</li>`).join('')}</ul>`;
  }
  
  // Convert markdown-style formatting
  let html = content
    .split('\n\n')
    .map(para => `<p>${escapeHtml(para)}</p>`)
    .join('');
  
  return html;
}

function formatSkills(content: string): string {
  const skills = content.split('\n').filter(line => line.trim());
  return skills.map(skill => {
    const match = skill.match(/(.+?)\s*[-:]\s*(\d+)%?/);
    if (match) {
      return `
        <div style="margin-bottom: 0.5rem;">
          <div style="font-size: 9pt;">${escapeHtml(match[1])}</div>
          <div class="skill-bar">
            <div class="skill-fill" style="width: ${match[2]}%"></div>
          </div>
        </div>
      `;
    }
    return `<div style="font-size: 9pt; margin-bottom: 0.25rem;">• ${escapeHtml(skill)}</div>`;
  }).join('');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
