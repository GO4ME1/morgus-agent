/**
 * Test script for TaskComplexityAnalyzer
 * 
 * Run with: npx ts-node test-complexity-analyzer.ts
 */

import { TaskComplexityAnalyzer } from './src/services/task-complexity-analyzer';

// Test cases
const testCases = [
  {
    name: 'Simple Search Query',
    message: 'Search for the latest AI news',
    expectedDPPM: false,
    expectedScore: '<5'
  },
  {
    name: 'Simple Question',
    message: 'What is the capital of France?',
    expectedDPPM: false,
    expectedScore: '<5'
  },
  {
    name: 'Medium Task - HTML Page',
    message: 'Create a simple HTML page with a contact form',
    expectedDPPM: false,
    expectedScore: '3-5'
  },
  {
    name: 'Complex Task - Todo App',
    message: 'Build a todo app with user authentication and deploy it to production',
    expectedDPPM: true,
    expectedScore: '>=5'
  },
  {
    name: 'Very Complex Task - E-commerce',
    message: 'Build a full-stack e-commerce platform with Stripe payment integration, user authentication, admin dashboard, product catalog, shopping cart, order management, and real-time inventory tracking. Deploy to production with CI/CD.',
    expectedDPPM: true,
    expectedScore: '>=8'
  },
  {
    name: 'Complex Task - Blog Platform',
    message: 'Create a blog platform with user registration, authentication, post creation, comments, likes, admin panel, and SEO optimization. Use React for frontend and Node.js with PostgreSQL for backend.',
    expectedDPPM: true,
    expectedScore: '>=7'
  },
  {
    name: 'Medium-Complex Task - Landing Page',
    message: 'Build a landing page for my bakery with hero section, menu, contact form, and deploy it',
    expectedDPPM: true,
    expectedScore: '5-7'
  },
  {
    name: 'Simple Task - Chart',
    message: 'Create a bar chart showing Q1=100, Q2=150, Q3=120',
    expectedDPPM: false,
    expectedScore: '<5'
  }
];

console.log('🧪 Testing TaskComplexityAnalyzer\n');
console.log('='.repeat(80));

let passedTests = 0;
let failedTests = 0;

for (const testCase of testCases) {
  console.log(`\n📝 Test: ${testCase.name}`);
  console.log(`   Message: "${testCase.message}"`);
  
  const analysis = TaskComplexityAnalyzer.analyze(testCase.message);
  
  console.log(`\n   Results:`);
  console.log(`   - Complexity Score: ${analysis.score.toFixed(1)}/10`);
  console.log(`   - Use DPPM: ${analysis.useDPPM ? 'Yes' : 'No'}`);
  console.log(`   - Estimated Subtasks: ${analysis.estimatedSubtasks}`);
  
  if (analysis.indicators.length > 0) {
    console.log(`   - Indicators:`);
    for (const indicator of analysis.indicators) {
      console.log(`     • ${indicator}`);
    }
  }
  
  console.log(`\n   Reasoning: ${analysis.reasoning}`);
  
  // Check if test passed
  const dppmMatch = analysis.useDPPM === testCase.expectedDPPM;
  let scoreMatch = true;
  
  if (testCase.expectedScore.startsWith('>=')) {
    const threshold = parseFloat(testCase.expectedScore.substring(2));
    scoreMatch = analysis.score >= threshold;
  } else if (testCase.expectedScore.startsWith('<')) {
    const threshold = parseFloat(testCase.expectedScore.substring(1));
    scoreMatch = analysis.score < threshold;
  } else if (testCase.expectedScore.includes('-')) {
    const [min, max] = testCase.expectedScore.split('-').map(parseFloat);
    scoreMatch = analysis.score >= min && analysis.score <= max;
  }
  
  const passed = dppmMatch && scoreMatch;
  
  if (passed) {
    console.log(`\n   ✅ PASSED`);
    passedTests++;
  } else {
    console.log(`\n   ❌ FAILED`);
    if (!dppmMatch) {
      console.log(`      Expected DPPM: ${testCase.expectedDPPM}, Got: ${analysis.useDPPM}`);
    }
    if (!scoreMatch) {
      console.log(`      Expected Score: ${testCase.expectedScore}, Got: ${analysis.score.toFixed(1)}`);
    }
    failedTests++;
  }
  
  console.log('-'.repeat(80));
}

console.log(`\n${'='.repeat(80)}`);
console.log(`\n📊 Test Summary:`);
console.log(`   Total Tests: ${testCases.length}`);
console.log(`   Passed: ${passedTests} ✅`);
console.log(`   Failed: ${failedTests} ❌`);
console.log(`   Success Rate: ${((passedTests / testCases.length) * 100).toFixed(1)}%`);

if (failedTests === 0) {
  console.log(`\n🎉 All tests passed!`);
} else {
  console.log(`\n⚠️  Some tests failed. Review the results above.`);
}

console.log(`\n${'='.repeat(80)}\n`);
