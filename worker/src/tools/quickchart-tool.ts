/**
 * QuickChart.io - Free chart generation tool
 * Generates charts using Chart.js via URL parameters
 * Completely FREE with no API key required!
 */

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'radar' | 'polarArea' | 'scatter';
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string;
      borderWidth?: number;
    }>;
  };
  options?: {
    title?: {
      display: boolean;
      text: string;
    };
    legend?: {
      display: boolean;
    };
  };
}

/**
 * Generate a chart using QuickChart.io (FREE!)
 */
export async function generateChart(config: ChartConfig): Promise<string> {
  try {
    // Build Chart.js config
    const chartConfig = {
      type: config.type,
      data: config.data,
      options: config.options || {}
    };

    // Encode config as URL parameter
    const encodedConfig = encodeURIComponent(JSON.stringify(chartConfig));
    
    // Generate QuickChart URL (max 2048 chars for GET, use POST for larger)
    const chartUrl = `https://quickchart.io/chart?c=${encodedConfig}&width=800&height=600&backgroundColor=white`;

    return chartUrl;
  } catch (error: any) {
    throw new Error(`Chart generation failed: ${error.message}`);
  }
}

/**
 * Format chart result for display
 */
export function formatChartResult(chartUrl: string, description: string): string {
  return `### 📊 Generated Chart

**Description:** ${description}

![Chart](${chartUrl})

*Generated with QuickChart.io (100% FREE) ✨*

You can [download the chart](${chartUrl}) or modify it by adjusting the parameters.`;
}

/**
 * Helper: Create a bar chart
 */
export function createBarChart(labels: string[], data: number[], title: string): Promise<string> {
  return generateChart({
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: title,
        data,
        backgroundColor: '#FF1493',
        borderColor: '#FF1493',
        borderWidth: 2
      }]
    },
    options: {
      title: {
        display: true,
        text: title
      }
    }
  });
}

/**
 * Helper: Create a line chart
 */
export function createLineChart(labels: string[], data: number[], title: string): Promise<string> {
  return generateChart({
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: title,
        data,
        backgroundColor: 'rgba(255, 20, 147, 0.2)',
        borderColor: '#FF1493',
        borderWidth: 3
      }]
    },
    options: {
      title: {
        display: true,
        text: title
      }
    }
  });
}

/**
 * Helper: Create a pie chart
 */
export function createPieChart(labels: string[], data: number[], title: string): Promise<string> {
  const colors = [
    '#FF1493', '#00CED1', '#FFD700', '#FF6347', '#9370DB',
    '#32CD32', '#FF69B4', '#1E90FF', '#FFA500', '#BA55D3'
  ];

  return generateChart({
    type: 'pie',
    data: {
      labels,
      datasets: [{
        label: title,
        data,
        backgroundColor: colors.slice(0, labels.length)
      }]
    },
    options: {
      title: {
        display: true,
        text: title
      }
    }
  });
}
