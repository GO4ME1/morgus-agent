/**
 * Spreadsheet Templates - Neon-Styled, Professional Spreadsheets
 * 
 * Generates styled Excel files using openpyxl-compatible JSON
 * or HTML tables with neon styling for web display
 */

export type SpreadsheetTemplateType = 
  | 'budget'
  | 'invoice'
  | 'project-tracker'
  | 'data-analysis'
  | 'expense-report'
  | 'inventory'
  | 'schedule'
  | 'comparison'
  | 'financial-report'
  | 'sales-tracker';

export interface SpreadsheetData {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: Array<Array<string | number>>;
  totals?: Array<string | number>;
  metadata?: {
    author?: string;
    date?: string;
    company?: string;
  };
  formatting?: {
    currencyColumns?: number[];
    percentColumns?: number[];
    dateColumns?: number[];
    highlightColumn?: number;
  };
}

// Neon color scheme for spreadsheets
const NEON_THEME = {
  background: '#0a0a0f',
  cardBg: 'rgba(20, 20, 35, 0.95)',
  headerBg: 'linear-gradient(135deg, #1a1a2e, #2d1b4e)',
  headerText: '#00f5ff',
  rowEven: 'rgba(30, 30, 50, 0.5)',
  rowOdd: 'rgba(20, 20, 40, 0.5)',
  rowHover: 'rgba(0, 245, 255, 0.1)',
  border: 'rgba(0, 245, 255, 0.2)',
  text: '#e0e0e0',
  accent: '#ff00ff',
  positive: '#00ff88',
  negative: '#ff6b6b',
  highlight: '#ffff00',
};

/**
 * Detect spreadsheet type from user message
 */
export function detectSpreadsheetTemplate(message: string): SpreadsheetTemplateType {
  const lower = message.toLowerCase();
  
  const patterns: Array<{ type: SpreadsheetTemplateType; keywords: string[] }> = [
    { type: 'budget', keywords: ['budget', 'budgeting', 'monthly budget', 'annual budget', 'spending plan'] },
    { type: 'invoice', keywords: ['invoice', 'bill', 'billing', 'payment due', 'receipt'] },
    { type: 'project-tracker', keywords: ['project', 'task', 'tracker', 'progress', 'milestone', 'timeline', 'gantt'] },
    { type: 'data-analysis', keywords: ['analysis', 'analyze', 'data', 'statistics', 'metrics', 'kpi'] },
    { type: 'expense-report', keywords: ['expense', 'expenses', 'reimbursement', 'travel expense', 'cost report'] },
    { type: 'inventory', keywords: ['inventory', 'stock', 'warehouse', 'products', 'items', 'quantity'] },
    { type: 'schedule', keywords: ['schedule', 'calendar', 'timetable', 'roster', 'shift', 'appointments'] },
    { type: 'comparison', keywords: ['comparison', 'compare', 'versus', 'vs', 'side by side', 'benchmark'] },
    { type: 'financial-report', keywords: ['financial', 'finance', 'profit', 'loss', 'revenue', 'income statement', 'balance sheet'] },
    { type: 'sales-tracker', keywords: ['sales', 'revenue', 'deals', 'pipeline', 'leads', 'conversions'] },
  ];
  
  for (const pattern of patterns) {
    if (pattern.keywords.some(keyword => lower.includes(keyword))) {
      return pattern.type;
    }
  }
  
  return 'data-analysis'; // Default
}

/**
 * Generate HTML spreadsheet with neon styling
 */
export function generateSpreadsheet(type: SpreadsheetTemplateType, data: SpreadsheetData): string {
  const templateConfig = getTemplateConfig(type);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: ${NEON_THEME.background};
      background-image: 
        radial-gradient(ellipse at top left, rgba(0, 245, 255, 0.05) 0%, transparent 50%),
        radial-gradient(ellipse at bottom right, rgba(255, 0, 255, 0.05) 0%, transparent 50%);
      min-height: 100vh;
      padding: 2rem;
      color: ${NEON_THEME.text};
    }
    
    .spreadsheet-container {
      max-width: 1200px;
      margin: 0 auto;
      background: ${NEON_THEME.cardBg};
      border-radius: 20px;
      padding: 2rem;
      box-shadow: 
        0 0 60px rgba(0, 245, 255, 0.1),
        0 0 100px rgba(255, 0, 255, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      border: 1px solid ${NEON_THEME.border};
      backdrop-filter: blur(10px);
    }
    
    .spreadsheet-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid ${NEON_THEME.border};
    }
    
    .spreadsheet-title-section {
      flex: 1;
    }
    
    .spreadsheet-title {
      font-size: 2rem;
      font-weight: 700;
      background: linear-gradient(135deg, #00f5ff, #ff00ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.5rem;
      text-shadow: 0 0 30px rgba(0, 245, 255, 0.3);
    }
    
    .spreadsheet-subtitle {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.95rem;
    }
    
    .spreadsheet-meta {
      text-align: right;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.5);
    }
    
    .spreadsheet-meta span {
      display: block;
      margin-bottom: 0.25rem;
    }
    
    .spreadsheet-meta .label {
      color: ${NEON_THEME.headerText};
      font-weight: 500;
    }
    
    .table-wrapper {
      overflow-x: auto;
      border-radius: 12px;
      border: 1px solid ${NEON_THEME.border};
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.9rem;
    }
    
    thead {
      background: ${NEON_THEME.headerBg};
      position: sticky;
      top: 0;
      z-index: 10;
    }
    
    th {
      padding: 1rem 1.25rem;
      text-align: left;
      font-weight: 600;
      color: ${NEON_THEME.headerText};
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.1em;
      border-bottom: 2px solid ${NEON_THEME.border};
      white-space: nowrap;
      text-shadow: 0 0 10px rgba(0, 245, 255, 0.5);
    }
    
    th:first-child {
      border-top-left-radius: 12px;
    }
    
    th:last-child {
      border-top-right-radius: 12px;
    }
    
    tbody tr {
      transition: all 0.2s ease;
    }
    
    tbody tr:nth-child(even) {
      background: ${NEON_THEME.rowEven};
    }
    
    tbody tr:nth-child(odd) {
      background: ${NEON_THEME.rowOdd};
    }
    
    tbody tr:hover {
      background: ${NEON_THEME.rowHover};
      box-shadow: inset 0 0 20px rgba(0, 245, 255, 0.1);
    }
    
    td {
      padding: 0.875rem 1.25rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      color: ${NEON_THEME.text};
    }
    
    /* Number formatting */
    .currency {
      color: ${NEON_THEME.positive};
      font-weight: 500;
    }
    
    .currency.negative {
      color: ${NEON_THEME.negative};
    }
    
    .percent {
      color: ${NEON_THEME.accent};
    }
    
    .highlight {
      color: ${NEON_THEME.highlight};
      font-weight: 600;
    }
    
    /* Totals row */
    tfoot tr {
      background: linear-gradient(135deg, rgba(0, 245, 255, 0.1), rgba(255, 0, 255, 0.1));
      border-top: 2px solid ${NEON_THEME.border};
    }
    
    tfoot td {
      padding: 1rem 1.25rem;
      font-weight: 700;
      color: #fff;
      text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
    }
    
    tfoot td:first-child {
      border-bottom-left-radius: 12px;
    }
    
    tfoot td:last-child {
      border-bottom-right-radius: 12px;
    }
    
    /* Status badges */
    .status {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .status-complete {
      background: rgba(0, 255, 136, 0.2);
      color: ${NEON_THEME.positive};
      border: 1px solid ${NEON_THEME.positive};
    }
    
    .status-pending {
      background: rgba(255, 255, 0, 0.2);
      color: ${NEON_THEME.highlight};
      border: 1px solid ${NEON_THEME.highlight};
    }
    
    .status-overdue {
      background: rgba(255, 107, 107, 0.2);
      color: ${NEON_THEME.negative};
      border: 1px solid ${NEON_THEME.negative};
    }
    
    /* Progress bar */
    .progress-bar {
      width: 100%;
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, ${NEON_THEME.headerText}, ${NEON_THEME.accent});
      border-radius: 4px;
      transition: width 0.5s ease;
      box-shadow: 0 0 10px ${NEON_THEME.headerText};
    }
    
    /* Neon glow animation */
    @keyframes neonGlow {
      0%, 100% { box-shadow: 0 0 20px rgba(0, 245, 255, 0.2); }
      50% { box-shadow: 0 0 40px rgba(0, 245, 255, 0.4); }
    }
    
    .spreadsheet-container {
      animation: neonGlow 4s ease-in-out infinite;
    }
    
    /* Download button */
    .download-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, ${NEON_THEME.headerText}, ${NEON_THEME.accent});
      color: #000;
      font-weight: 600;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      margin-top: 1.5rem;
      transition: all 0.3s ease;
    }
    
    .download-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 0 30px rgba(0, 245, 255, 0.5);
    }
  </style>
</head>
<body>
  <div class="spreadsheet-container">
    <div class="spreadsheet-header">
      <div class="spreadsheet-title-section">
        <h1 class="spreadsheet-title">${escapeHtml(data.title)}</h1>
        ${data.subtitle ? `<p class="spreadsheet-subtitle">${escapeHtml(data.subtitle)}</p>` : ''}
      </div>
      ${data.metadata ? `
      <div class="spreadsheet-meta">
        ${data.metadata.company ? `<span><span class="label">Company:</span> ${escapeHtml(data.metadata.company)}</span>` : ''}
        ${data.metadata.author ? `<span><span class="label">Author:</span> ${escapeHtml(data.metadata.author)}</span>` : ''}
        ${data.metadata.date ? `<span><span class="label">Date:</span> ${escapeHtml(data.metadata.date)}</span>` : ''}
      </div>
      ` : ''}
    </div>
    
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            ${data.headers.map(header => `<th>${escapeHtml(String(header))}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.rows.map(row => `
            <tr>
              ${row.map((cell, i) => {
                let className = '';
                let displayValue = String(cell);
                
                if (data.formatting?.currencyColumns?.includes(i)) {
                  className = 'currency';
                  const num = typeof cell === 'number' ? cell : parseFloat(String(cell).replace(/[^0-9.-]/g, ''));
                  if (!isNaN(num)) {
                    if (num < 0) className += ' negative';
                    displayValue = formatCurrency(num);
                  }
                } else if (data.formatting?.percentColumns?.includes(i)) {
                  className = 'percent';
                  displayValue = formatPercent(cell);
                } else if (data.formatting?.highlightColumn === i) {
                  className = 'highlight';
                }
                
                return `<td class="${className}">${escapeHtml(displayValue)}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
        ${data.totals ? `
        <tfoot>
          <tr>
            ${data.totals.map((cell, i) => {
              let displayValue = String(cell);
              if (data.formatting?.currencyColumns?.includes(i) && typeof cell === 'number') {
                displayValue = formatCurrency(cell);
              }
              return `<td>${escapeHtml(displayValue)}</td>`;
            }).join('')}
          </tr>
        </tfoot>
        ` : ''}
      </table>
    </div>
    
    <button class="download-btn" onclick="downloadAsCSV()">
      📥 Download CSV
    </button>
  </div>
  
  <script>
    function downloadAsCSV() {
      const headers = ${JSON.stringify(data.headers)};
      const rows = ${JSON.stringify(data.rows)};
      const totals = ${JSON.stringify(data.totals || [])};
      
      let csv = headers.join(',') + '\\n';
      rows.forEach(row => {
        csv += row.map(cell => {
          const str = String(cell);
          return str.includes(',') ? '"' + str + '"' : str;
        }).join(',') + '\\n';
      });
      if (totals.length) {
        csv += totals.join(',') + '\\n';
      }
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '${escapeHtml(data.title.replace(/[^a-z0-9]/gi, '_'))}.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  </script>
</body>
</html>`;
}

function getTemplateConfig(type: SpreadsheetTemplateType): any {
  const configs: Record<SpreadsheetTemplateType, any> = {
    'budget': { icon: '💰', accentColor: '#00ff88' },
    'invoice': { icon: '📄', accentColor: '#00f5ff' },
    'project-tracker': { icon: '📊', accentColor: '#a855f7' },
    'data-analysis': { icon: '📈', accentColor: '#ff00ff' },
    'expense-report': { icon: '💳', accentColor: '#ff6b6b' },
    'inventory': { icon: '📦', accentColor: '#f97316' },
    'schedule': { icon: '📅', accentColor: '#06b6d4' },
    'comparison': { icon: '⚖️', accentColor: '#ffff00' },
    'financial-report': { icon: '💹', accentColor: '#00ff88' },
    'sales-tracker': { icon: '🎯', accentColor: '#ff00ff' },
  };
  return configs[type] || configs['data-analysis'];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: string | number): string {
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(num)) return String(value);
  return num.toFixed(1) + '%';
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generate Python code for creating styled Excel file
 */
export function generateExcelPythonCode(type: SpreadsheetTemplateType, data: SpreadsheetData): string {
  return `
import openpyxl
from openpyxl.styles import Font, Fill, PatternFill, Border, Side, Alignment, NamedStyle
from openpyxl.utils import get_column_letter
from openpyxl.formatting.rule import ColorScaleRule

# Create workbook
wb = openpyxl.Workbook()
ws = wb.active
ws.title = "${escapeHtml(data.title)}"

# Neon color scheme
NEON_CYAN = "00F5FF"
NEON_MAGENTA = "FF00FF"
NEON_GREEN = "00FF88"
DARK_BG = "0A0A0F"
CARD_BG = "141423"
HEADER_BG = "1A1A2E"

# Styles
header_font = Font(name='Arial', size=11, bold=True, color=NEON_CYAN)
header_fill = PatternFill(start_color=HEADER_BG, end_color=HEADER_BG, fill_type='solid')
data_font = Font(name='Consolas', size=10, color="E0E0E0")
border = Border(
    left=Side(style='thin', color=NEON_CYAN),
    right=Side(style='thin', color=NEON_CYAN),
    top=Side(style='thin', color=NEON_CYAN),
    bottom=Side(style='thin', color=NEON_CYAN)
)

# Title
ws.merge_cells('A1:${get_column_letter(data.headers.length)}1')
ws['A1'] = "${escapeHtml(data.title)}"
ws['A1'].font = Font(name='Arial', size=16, bold=True, color=NEON_MAGENTA)
ws['A1'].alignment = Alignment(horizontal='center')

# Headers (row 3)
headers = ${JSON.stringify(data.headers)}
for col, header in enumerate(headers, 1):
    cell = ws.cell(row=3, column=col, value=header)
    cell.font = header_font
    cell.fill = header_fill
    cell.border = border
    cell.alignment = Alignment(horizontal='center')

# Data rows
data_rows = ${JSON.stringify(data.rows)}
for row_idx, row_data in enumerate(data_rows, 4):
    for col_idx, value in enumerate(row_data, 1):
        cell = ws.cell(row=row_idx, column=col_idx, value=value)
        cell.font = data_font
        cell.border = border
        # Alternate row colors
        if row_idx % 2 == 0:
            cell.fill = PatternFill(start_color="1E1E32", end_color="1E1E32", fill_type='solid')
        else:
            cell.fill = PatternFill(start_color="141428", end_color="141428", fill_type='solid')

# Totals row
${data.totals ? `
totals = ${JSON.stringify(data.totals)}
total_row = ${data.rows.length + 4}
for col_idx, value in enumerate(totals, 1):
    cell = ws.cell(row=total_row, column=col_idx, value=value)
    cell.font = Font(name='Consolas', size=10, bold=True, color=NEON_GREEN)
    cell.fill = PatternFill(start_color="1A1A2E", end_color="1A1A2E", fill_type='solid')
    cell.border = border
` : ''}

# Auto-adjust column widths
for col in range(1, len(headers) + 1):
    ws.column_dimensions[get_column_letter(col)].width = 15

# Save
wb.save("${escapeHtml(data.title.replace(/[^a-z0-9]/gi, '_'))}.xlsx")
print("Spreadsheet created successfully!")
`;
}
