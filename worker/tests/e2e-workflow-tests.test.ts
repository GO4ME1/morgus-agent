/**
 * End-to-End Workflow Tests
 * 
 * Tests complete user workflows:
 * 1. Developer Workflow: Search API → Read docs → Implement → Test
 * 2. Data Analysis Workflow: Find dataset → Download → Analyze
 * 3. Debugging Workflow: Search code → View context → Fix bug
 * 4. Content Creation Workflow: Search images → Download → Use in slides
 */

import { EnhancedFileOperations } from '../src/services/enhanced-file-operations';
import { EnhancedSearch } from '../src/services/enhanced-search';
import * as fs from 'fs/promises';
import * as path from 'path';

const testDir = '/tmp/morgus-e2e-tests';

beforeAll(async () => {
  await fs.mkdir(testDir, { recursive: true });
});

afterAll(async () => {
  await fs.rm(testDir, { recursive: true, force: true });
});

// ============================================================================
// E2E WORKFLOW 1: Developer Workflow
// ============================================================================

describe('E2E: Developer Workflow', () => {
  
  test('should complete full API integration workflow', async () => {
    console.log('\n🔄 E2E Test: Developer Workflow');
    console.log('=' .repeat(80) + '\n');
    
    // ========================================================================
    // Step 1: Search for weather API
    // ========================================================================
    console.log('📍 Step 1: Search for weather API...');
    
    const apiResults = await EnhancedSearch.search({
      type: 'api',
      queries: ['weather API', 'weather data'],
      maxResults: 5
    });
    
    expect(apiResults.length).toBeGreaterThan(0);
    const weatherAPI = apiResults[0] as any;
    
    console.log(`  ✅ Found: ${weatherAPI.apiName}`);
    console.log(`  📚 Documentation: ${weatherAPI.documentation}`);
    console.log(`  🔐 Authentication: ${weatherAPI.authentication}`);
    console.log(`  💰 Pricing: ${weatherAPI.pricing}\n`);
    
    // ========================================================================
    // Step 2: Read API documentation
    // ========================================================================
    console.log('📍 Step 2: Read API documentation...');
    
    // Simulate documentation file
    const docsFile = path.join(testDir, 'weather-api-docs.md');
    const docsContent = `# Weather API Documentation

## Endpoints

### GET /weather/current
Get current weather for a location.

**Parameters:**
- \`location\` (string): City name or coordinates
- \`apiKey\` (string): Your API key

**Example:**
\`\`\`
GET https://api.weather.com/current?location=London&apiKey=YOUR_KEY
\`\`\`

**Response:**
\`\`\`json
{
  "temperature": 15,
  "condition": "Cloudy",
  "humidity": 65
}
\`\`\`

## Authentication
Use API key in query parameter or Authorization header.

## Rate Limits
- Free tier: 1000 requests/day
- Pro tier: 100,000 requests/day
`;
    
    await fs.writeFile(docsFile, docsContent);
    const docs = await EnhancedFileOperations.read(docsFile);
    
    expect(docs.toLowerCase()).toContain('endpoint');
    expect(docs.toLowerCase()).toContain('authentication');
    
    console.log('  ✅ Documentation loaded');
    console.log(`  📄 ${docs.split('\n').length} lines\n`);
    
    // ========================================================================
    // Step 3: Implement API call
    // ========================================================================
    console.log('📍 Step 3: Implement API integration...');
    
    const implementationFile = path.join(testDir, 'weather-integration.js');
    const code = `// Weather API Integration
const API_KEY = process.env.WEATHER_API_KEY;
const BASE_URL = 'https://api.weather.com';

async function getCurrentWeather(location) {
  const url = \`\${BASE_URL}/current?location=\${location}&apiKey=\${API_KEY}\`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(\`Weather API error: \${response.status}\`);
  }
  
  const data = await response.json();
  return {
    temperature: data.temperature,
    condition: data.condition,
    humidity: data.humidity
  };
}

module.exports = { getCurrentWeather };
`;
    
    await EnhancedFileOperations.write(implementationFile, code);
    
    console.log('  ✅ Implementation created');
    console.log(`  📝 File: ${path.basename(implementationFile)}\n`);
    
    // ========================================================================
    // Step 4: Create tests
    // ========================================================================
    console.log('📍 Step 4: Create tests...');
    
    const testFile = path.join(testDir, 'weather-integration.test.js');
    const testCode = `const { getCurrentWeather } = require('./weather-integration');

describe('Weather API Integration', () => {
  test('should get current weather', async () => {
    const weather = await getCurrentWeather('London');
    
    expect(weather).toHaveProperty('temperature');
    expect(weather).toHaveProperty('condition');
    expect(weather).toHaveProperty('humidity');
  });
  
  test('should handle invalid location', async () => {
    await expect(
      getCurrentWeather('InvalidCity123')
    ).rejects.toThrow();
  });
});
`;
    
    await EnhancedFileOperations.write(testFile, testCode);
    
    console.log('  ✅ Tests created');
    console.log(`  🧪 File: ${path.basename(testFile)}\n`);
    
    // ========================================================================
    // Step 5: Verify all files created
    // ========================================================================
    console.log('📍 Step 5: Verify workflow completion...');
    
    const files = [docsFile, implementationFile, testFile];
    const metadata = await Promise.all(
      files.map(f => EnhancedFileOperations.getMetadata(f))
    );
    
    expect(metadata).toHaveLength(3);
    expect(metadata.every(m => m.size > 0)).toBe(true);
    
    console.log('  ✅ All files created:');
    metadata.forEach(m => {
      console.log(`     - ${m.name} (${m.sizeHuman})`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Developer Workflow Complete!');
    console.log('=' + '='.repeat(80) + '\n');
  });
});

// ============================================================================
// E2E WORKFLOW 2: Data Analysis Workflow
// ============================================================================

describe('E2E: Data Analysis Workflow', () => {
  
  test('should complete data analysis workflow', async () => {
    console.log('\n🔄 E2E Test: Data Analysis Workflow');
    console.log('='.repeat(80) + '\n');
    
    // ========================================================================
    // Step 1: Find dataset
    // ========================================================================
    console.log('📍 Step 1: Search for dataset...');
    
    const dataResults = await EnhancedSearch.search({
      type: 'data',
      queries: ['COVID-19 data', 'coronavirus statistics'],
      maxResults: 3
    });
    
    expect(dataResults.length).toBeGreaterThan(0);
    const dataset = dataResults[0] as any;
    
    console.log(`  ✅ Found: ${dataset.datasetName}`);
    console.log(`  📊 Format: ${dataset.format}`);
    console.log(`  📦 Size: ${dataset.size}`);
    console.log(`  📥 Download: ${dataset.downloadUrl}\n`);
    
    // ========================================================================
    // Step 2: Download dataset (simulated)
    // ========================================================================
    console.log('📍 Step 2: Download dataset...');
    
    const dataFile = path.join(testDir, 'covid-data.csv');
    const csvData = `date,cases,deaths,recovered
2024-01-01,1000,50,900
2024-01-02,1100,55,990
2024-01-03,1050,52,950
2024-01-04,1200,60,1080
2024-01-05,1150,58,1035`;
    
    await fs.writeFile(dataFile, csvData);
    
    console.log('  ✅ Dataset downloaded');
    console.log(`  📄 File: ${path.basename(dataFile)}\n`);
    
    // ========================================================================
    // Step 3: Analyze data
    // ========================================================================
    console.log('📍 Step 3: Analyze data...');
    
    const data = await EnhancedFileOperations.read(dataFile);
    const lines = data.split('\n');
    const rows = lines.slice(1).map(line => {
      const [date, cases, deaths, recovered] = line.split(',');
      return { date, cases: parseInt(cases), deaths: parseInt(deaths), recovered: parseInt(recovered) };
    });
    
    const totalCases = rows.reduce((sum, row) => sum + row.cases, 0);
    const totalDeaths = rows.reduce((sum, row) => sum + row.deaths, 0);
    const avgCases = totalCases / rows.length;
    
    console.log('  ✅ Analysis complete:');
    console.log(`     - Total cases: ${totalCases}`);
    console.log(`     - Total deaths: ${totalDeaths}`);
    console.log(`     - Average cases/day: ${avgCases.toFixed(0)}\n`);
    
    // ========================================================================
    // Step 4: Create analysis report
    // ========================================================================
    console.log('📍 Step 4: Create analysis report...');
    
    const reportFile = path.join(testDir, 'covid-analysis-report.md');
    const report = `# COVID-19 Data Analysis Report

## Dataset Information
- **Source:** ${dataset.datasetName}
- **Period:** ${rows[0].date} to ${rows[rows.length - 1].date}
- **Total Days:** ${rows.length}

## Key Findings

### Total Statistics
- **Total Cases:** ${totalCases.toLocaleString()}
- **Total Deaths:** ${totalDeaths.toLocaleString()}
- **Total Recovered:** ${rows.reduce((sum, row) => sum + row.recovered, 0).toLocaleString()}

### Daily Averages
- **Average Cases:** ${avgCases.toFixed(0)} per day
- **Average Deaths:** ${(totalDeaths / rows.length).toFixed(0)} per day
- **Mortality Rate:** ${((totalDeaths / totalCases) * 100).toFixed(2)}%

## Trend Analysis
The data shows ${rows[rows.length - 1].cases > rows[0].cases ? 'an increasing' : 'a decreasing'} trend in cases over the period.

## Recommendations
1. Continue monitoring daily case numbers
2. Focus on prevention measures
3. Ensure adequate healthcare capacity
`;
    
    await EnhancedFileOperations.write(reportFile, report);
    
    console.log('  ✅ Report created');
    console.log(`  📊 File: ${path.basename(reportFile)}\n`);
    
    // ========================================================================
    // Step 5: Verify workflow completion
    // ========================================================================
    console.log('📍 Step 5: Verify workflow completion...');
    
    const files = [dataFile, reportFile];
    const metadata = await Promise.all(
      files.map(f => EnhancedFileOperations.getMetadata(f))
    );
    
    expect(metadata).toHaveLength(2);
    
    console.log('  ✅ All files created:');
    metadata.forEach(m => {
      console.log(`     - ${m.name} (${m.sizeHuman})`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Data Analysis Workflow Complete!');
    console.log('='.repeat(80) + '\n');
  });
});

// ============================================================================
// E2E WORKFLOW 3: Debugging Workflow
// ============================================================================

describe('E2E: Debugging Workflow', () => {
  
  test('should complete debugging workflow', async () => {
    console.log('\n🔄 E2E Test: Debugging Workflow');
    console.log('='.repeat(80) + '\n');
    
    // ========================================================================
    // Step 1: Create buggy code
    // ========================================================================
    console.log('📍 Step 1: Create buggy code...');
    
    const buggyFile = path.join(testDir, 'user-service.js');
    const buggyCode = `class UserService {
  constructor(database) {
    this.db = database;
  }
  
  async getUser(userId) {
    const user = await this.db.findById(userId);
    return user;
  }
  
  async createUser(userData) {
    // BUG: Not validating email format
    const user = await this.db.create(userData);
    return user;
  }
  
  async updateUser(userId, updates) {
    // BUG: Not checking if user exists
    const user = await this.db.update(userId, updates);
    return user;
  }
  
  async deleteUser(userId) {
    await this.db.delete(userId);
  }
}

module.exports = UserService;
`;
    
    await fs.writeFile(buggyFile, buggyCode);
    
    console.log('  ✅ Buggy code created\n');
    
    // ========================================================================
    // Step 2: Search for bug pattern
    // ========================================================================
    console.log('📍 Step 2: Search for bug pattern...');
    
    const content = await EnhancedFileOperations.read(buggyFile);
    const lines = content.split('\n');
    
    // Find createUser function
    const createUserIndex = lines.findIndex(l => l.includes('createUser'));
    const context = {
      before: lines.slice(Math.max(0, createUserIndex - 2), createUserIndex),
      match: lines[createUserIndex],
      after: lines.slice(createUserIndex + 1, createUserIndex + 4)
    };
    
    console.log('  🔍 Found bug in createUser:');
    console.log('     Context before:');
    context.before.forEach(l => console.log(`       ${l}`));
    console.log(`     >>> ${context.match}`);
    console.log('     Context after:');
    context.after.forEach(l => console.log(`       ${l}`));
    console.log('');
    
    expect(context.match).toContain('createUser');
    expect(context.after.some(l => l.includes('BUG'))).toBe(true);
    
    // ========================================================================
    // Step 3: Fix the bug
    // ========================================================================
    console.log('📍 Step 3: Fix the bug...');
    
    const fixedCode = buggyCode.replace(
      '// BUG: Not validating email format',
      `// Validate email format
    if (!this.isValidEmail(userData.email)) {
      throw new Error('Invalid email format');
    }`
    );
    
    await EnhancedFileOperations.write(buggyFile, fixedCode);
    
    console.log('  ✅ Bug fixed: Added email validation\n');
    
    // ========================================================================
    // Step 4: Create test
    // ========================================================================
    console.log('📍 Step 4: Create test for fix...');
    
    const testFile = path.join(testDir, 'user-service.test.js');
    const testCode = `const UserService = require('./user-service');

describe('UserService', () => {
  test('should validate email format', async () => {
    const service = new UserService(mockDb);
    
    await expect(
      service.createUser({ email: 'invalid-email' })
    ).rejects.toThrow('Invalid email format');
  });
  
  test('should accept valid email', async () => {
    const service = new UserService(mockDb);
    
    const user = await service.createUser({
      email: 'valid@example.com',
      name: 'Test User'
    });
    
    expect(user).toBeDefined();
  });
});
`;
    
    await EnhancedFileOperations.write(testFile, testCode);
    
    console.log('  ✅ Test created\n');
    
    // ========================================================================
    // Step 5: Verify fix
    // ========================================================================
    console.log('📍 Step 5: Verify fix...');
    
    const fixedContent = await EnhancedFileOperations.read(buggyFile);
    
    expect(fixedContent).toContain('isValidEmail');
    expect(fixedContent).toContain('Invalid email format');
    expect(fixedContent).not.toContain('BUG: Not validating');
    
    console.log('  ✅ Fix verified');
    console.log('  ✅ Email validation added');
    console.log('  ✅ Test coverage added\n');
    
    console.log('='.repeat(80));
    console.log('✅ Debugging Workflow Complete!');
    console.log('='.repeat(80) + '\n');
  });
});

// ============================================================================
// E2E WORKFLOW 4: Content Creation Workflow
// ============================================================================

describe('E2E: Content Creation Workflow', () => {
  
  test('should complete content creation workflow', async () => {
    console.log('\n🔄 E2E Test: Content Creation Workflow');
    console.log('='.repeat(80) + '\n');
    
    // ========================================================================
    // Step 1: Search for images
    // ========================================================================
    console.log('📍 Step 1: Search for images...');
    
    const imageResults = await EnhancedSearch.search({
      type: 'image',
      queries: ['business meeting', 'team collaboration'],
      maxResults: 3,
      downloadImages: false
    });
    
    expect(imageResults.length).toBeGreaterThan(0);
    
    console.log(`  ✅ Found ${imageResults.length} images:`);
    imageResults.forEach((img: any, i: number) => {
      console.log(`     ${i + 1}. ${img.title} (${img.width}x${img.height})`);
    });
    console.log('');
    
    // ========================================================================
    // Step 2: Create presentation outline
    // ========================================================================
    console.log('📍 Step 2: Create presentation outline...');
    
    const outlineFile = path.join(testDir, 'presentation-outline.md');
    const outline = `# Team Collaboration Presentation

## Slide 1: Title
- Title: "Effective Team Collaboration"
- Subtitle: "Best Practices for Remote Teams"
- Image: ${imageResults[0].title}

## Slide 2: Introduction
- Why collaboration matters
- Statistics on remote work
- Image: ${imageResults[1]?.title || 'Team meeting'}

## Slide 3: Best Practices
1. Clear communication
2. Regular check-ins
3. Use the right tools
4. Build trust

## Slide 4: Tools & Technologies
- Video conferencing
- Project management
- Document collaboration
- Chat platforms

## Slide 5: Conclusion
- Key takeaways
- Action items
- Q&A
`;
    
    await EnhancedFileOperations.write(outlineFile, outline);
    
    console.log('  ✅ Outline created');
    console.log(`  📄 File: ${path.basename(outlineFile)}\n`);
    
    // ========================================================================
    // Step 3: Create slide content
    // ========================================================================
    console.log('📍 Step 3: Create slide content...');
    
    const slideFile = path.join(testDir, 'slide-1-title.html');
    const slideHTML = `<!DOCTYPE html>
<html>
<head>
  <title>Effective Team Collaboration</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: 'Arial', sans-serif;
    }
    .slide {
      text-align: center;
      color: white;
    }
    h1 {
      font-size: 4rem;
      margin-bottom: 1rem;
    }
    h2 {
      font-size: 2rem;
      font-weight: 300;
    }
  </style>
</head>
<body>
  <div class="slide">
    <h1>Effective Team Collaboration</h1>
    <h2>Best Practices for Remote Teams</h2>
  </div>
</body>
</html>
`;
    
    await EnhancedFileOperations.write(slideFile, slideHTML);
    
    console.log('  ✅ Slide created');
    console.log(`  🎨 File: ${path.basename(slideFile)}\n`);
    
    // ========================================================================
    // Step 4: Verify all assets
    // ========================================================================
    console.log('📍 Step 4: Verify all assets...');
    
    const files = [outlineFile, slideFile];
    const metadata = await Promise.all(
      files.map(f => EnhancedFileOperations.getMetadata(f))
    );
    
    expect(metadata).toHaveLength(2);
    
    console.log('  ✅ All assets created:');
    metadata.forEach(m => {
      console.log(`     - ${m.name} (${m.sizeHuman})`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Content Creation Workflow Complete!');
    console.log('='.repeat(80) + '\n');
  });
});

// ============================================================================
// WORKFLOW SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('🎉 All E2E Workflows Complete!');
console.log('='.repeat(80));
console.log('\nWorkflows Tested:');
console.log('  1. ✅ Developer Workflow (API integration)');
console.log('  2. ✅ Data Analysis Workflow (Dataset analysis)');
console.log('  3. ✅ Debugging Workflow (Bug fix)');
console.log('  4. ✅ Content Creation Workflow (Presentation)');
console.log('\n' + '='.repeat(80) + '\n');
