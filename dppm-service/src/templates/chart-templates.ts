/**
 * Chart Templates - Professional, Neon-Styled Charts
 * 
 * Uses Chart.js with custom neon styling
 */

export type ChartTemplateType = 
  | 'line'
  | 'bar'
  | 'pie'
  | 'doughnut'
  | 'area'
  | 'scatter'
  | 'radar'
  | 'polar'
  | 'dashboard'
  | 'comparison';

export interface ChartData {
  title: string;
  subtitle?: string;
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
  options?: {
    showLegend?: boolean;
    showGrid?: boolean;
    animate?: boolean;
    stacked?: boolean;
  };
}

// Neon color palette
const NEON_COLORS = [
  '#00f5ff', // Cyan
  '#ff00ff', // Magenta
  '#00ff88', // Green
  '#ffff00', // Yellow
  '#ff6b6b', // Coral
  '#a855f7', // Purple
  '#f97316', // Orange
  '#06b6d4', // Teal
];

const NEON_GRADIENTS = [
  'linear-gradient(135deg, #00f5ff, #0066ff)',
  'linear-gradient(135deg, #ff00ff, #ff6b6b)',
  'linear-gradient(135deg, #00ff88, #00f5ff)',
  'linear-gradient(135deg, #a855f7, #ff00ff)',
];

/**
 * Detect chart type from user message
 */
export function detectChartTemplate(message: string): ChartTemplateType {
  const lower = message.toLowerCase();
  
  const patterns: Array<{ type: ChartTemplateType; keywords: string[] }> = [
    { type: 'line', keywords: ['line chart', 'line graph', 'trend', 'over time', 'timeline', 'progress'] },
    { type: 'bar', keywords: ['bar chart', 'bar graph', 'column', 'comparison', 'compare'] },
    { type: 'pie', keywords: ['pie chart', 'pie graph', 'breakdown', 'distribution', 'percentage', 'share'] },
    { type: 'doughnut', keywords: ['doughnut', 'donut', 'ring chart'] },
    { type: 'area', keywords: ['area chart', 'area graph', 'filled', 'stacked area'] },
    { type: 'scatter', keywords: ['scatter', 'scatter plot', 'correlation', 'xy plot'] },
    { type: 'radar', keywords: ['radar', 'spider', 'web chart', 'skills', 'comparison radar'] },
    { type: 'polar', keywords: ['polar', 'polar area', 'radial'] },
    { type: 'dashboard', keywords: ['dashboard', 'kpi', 'metrics', 'overview', 'summary'] },
    { type: 'comparison', keywords: ['side by side', 'versus', 'vs', 'before after'] },
  ];
  
  for (const pattern of patterns) {
    if (pattern.keywords.some(keyword => lower.includes(keyword))) {
      return pattern.type;
    }
  }
  
  return 'bar'; // Default
}

/**
 * Generate Chart.js HTML with neon styling
 */
export function generateChart(type: ChartTemplateType, data: ChartData): string {
  const chartId = `chart-${Date.now()}`;
  const colors = data.datasets.map((_, i) => NEON_COLORS[i % NEON_COLORS.length]);
  
  const chartConfig = getChartConfig(type, data, colors);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.title)}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%);
      min-height: 100vh;
      padding: 2rem;
      color: #fff;
    }
    
    .chart-container {
      max-width: 900px;
      margin: 0 auto;
      background: rgba(20, 20, 35, 0.8);
      border-radius: 20px;
      padding: 2rem;
      box-shadow: 
        0 0 40px rgba(0, 245, 255, 0.1),
        0 0 80px rgba(255, 0, 255, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
    }
    
    .chart-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .chart-title {
      font-size: 1.75rem;
      font-weight: 700;
      background: linear-gradient(135deg, #00f5ff, #ff00ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.5rem;
      text-shadow: 0 0 30px rgba(0, 245, 255, 0.3);
    }
    
    .chart-subtitle {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.95rem;
    }
    
    .chart-wrapper {
      position: relative;
      height: 400px;
    }
    
    canvas {
      filter: drop-shadow(0 0 10px rgba(0, 245, 255, 0.2));
    }
    
    /* Neon glow animation */
    @keyframes neonPulse {
      0%, 100% { filter: drop-shadow(0 0 10px rgba(0, 245, 255, 0.3)); }
      50% { filter: drop-shadow(0 0 20px rgba(0, 245, 255, 0.5)); }
    }
    
    .chart-wrapper canvas {
      animation: neonPulse 3s ease-in-out infinite;
    }
  </style>
</head>
<body>
  <div class="chart-container">
    <div class="chart-header">
      <h1 class="chart-title">${escapeHtml(data.title)}</h1>
      ${data.subtitle ? `<p class="chart-subtitle">${escapeHtml(data.subtitle)}</p>` : ''}
    </div>
    <div class="chart-wrapper">
      <canvas id="${chartId}"></canvas>
    </div>
  </div>
  
  <script>
    const ctx = document.getElementById('${chartId}').getContext('2d');
    
    // Neon gradient for datasets
    const createNeonGradient = (ctx, color) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, color + 'cc');
      gradient.addColorStop(1, color + '33');
      return gradient;
    };
    
    new Chart(ctx, ${JSON.stringify(chartConfig, null, 2)});
  </script>
</body>
</html>`;
}

function getChartConfig(type: ChartTemplateType, data: ChartData, colors: string[]): any {
  const baseConfig = {
    type: type === 'area' ? 'line' : type,
    data: {
      labels: data.labels,
      datasets: data.datasets.map((dataset, i) => ({
        label: dataset.label,
        data: dataset.data,
        backgroundColor: type === 'line' || type === 'area' 
          ? colors[i] + '33' 
          : colors.map(c => c + 'cc'),
        borderColor: colors[i],
        borderWidth: 2,
        fill: type === 'area',
        tension: 0.4,
        pointBackgroundColor: colors[i],
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 8,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: data.options?.animate !== false ? 1500 : 0,
        easing: 'easeOutQuart',
      },
      plugins: {
        legend: {
          display: data.options?.showLegend !== false,
          position: 'top',
          labels: {
            color: '#fff',
            font: { size: 12, weight: '500' },
            padding: 20,
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(20, 20, 35, 0.95)',
          titleColor: '#00f5ff',
          bodyColor: '#fff',
          borderColor: 'rgba(0, 245, 255, 0.3)',
          borderWidth: 1,
          cornerRadius: 10,
          padding: 12,
        },
      },
      scales: type !== 'pie' && type !== 'doughnut' && type !== 'radar' && type !== 'polar' ? {
        x: {
          grid: {
            display: data.options?.showGrid !== false,
            color: 'rgba(255, 255, 255, 0.1)',
          },
          ticks: { color: 'rgba(255, 255, 255, 0.7)' },
        },
        y: {
          grid: {
            display: data.options?.showGrid !== false,
            color: 'rgba(255, 255, 255, 0.1)',
          },
          ticks: { color: 'rgba(255, 255, 255, 0.7)' },
        },
      } : undefined,
    },
  };
  
  // Type-specific adjustments
  if (type === 'pie' || type === 'doughnut') {
    baseConfig.data.datasets[0].backgroundColor = colors.map(c => c + 'cc');
    baseConfig.data.datasets[0].borderColor = colors;
    baseConfig.data.datasets[0].borderWidth = 2;
    if (type === 'doughnut') {
      (baseConfig.options as any).cutout = '60%';
    }
  }
  
  if (type === 'radar') {
    baseConfig.options.scales = {
      r: {
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
        pointLabels: { color: 'rgba(255, 255, 255, 0.7)' },
        ticks: { display: false },
      },
    } as any;
  }
  
  return baseConfig;
}

/**
 * Generate a dashboard with multiple charts
 */
export function generateDashboard(title: string, charts: Array<{ type: ChartTemplateType; data: ChartData }>): string {
  const chartHtmls = charts.map((chart, i) => {
    const chartId = `chart-${i}-${Date.now()}`;
    const config = getChartConfig(chart.type, chart.data, NEON_COLORS);
    return { id: chartId, config, title: chart.data.title };
  });
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%);
      min-height: 100vh;
      padding: 2rem;
      color: #fff;
    }
    
    .dashboard-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .dashboard-title {
      font-size: 2.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, #00f5ff, #ff00ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }
    
    .chart-card {
      background: rgba(20, 20, 35, 0.8);
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 0 30px rgba(0, 245, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .chart-card-title {
      font-size: 1.1rem;
      color: #00f5ff;
      margin-bottom: 1rem;
    }
    
    .chart-card canvas {
      height: 250px !important;
    }
  </style>
</head>
<body>
  <div class="dashboard-header">
    <h1 class="dashboard-title">${escapeHtml(title)}</h1>
  </div>
  <div class="dashboard-grid">
    ${chartHtmls.map(chart => `
      <div class="chart-card">
        <h3 class="chart-card-title">${escapeHtml(chart.title)}</h3>
        <canvas id="${chart.id}"></canvas>
      </div>
    `).join('')}
  </div>
  
  <script>
    ${chartHtmls.map(chart => `
      new Chart(document.getElementById('${chart.id}').getContext('2d'), ${JSON.stringify(chart.config)});
    `).join('\n')}
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
