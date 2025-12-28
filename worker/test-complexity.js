/**
 * Simple test for TaskComplexityAnalyzer
 */

// Inline the TaskComplexityAnalyzer class for testing
class TaskComplexityAnalyzer {
  static analyze(userMessage) {
    const messageLower = userMessage.toLowerCase();
    let score = 0;
    const indicators = [];
    
    const devKeywords = [
      'build', 'create app', 'develop', 'full-stack', 'backend', 'frontend',
      'database', 'authentication', 'api', 'deploy', 'website', 'application',
      'system', 'platform', 'service', 'microservice', 'architecture'
    ];
    
    const featureKeywords = [
      'with authentication', 'user login', 'crud', 'dashboard', 'admin panel',
      'payment', 'subscription', 'real-time', 'chat', 'notifications',
      'email', 'search', 'filter', 'sort', 'pagination', 'upload',
      'profile', 'settings', 'analytics', 'reporting', 'export'
    ];
    
    const multiStepKeywords = [
      'and', 'then', 'also', 'plus', 'including', 'with', 'that has',
      'as well as', 'along with', 'together with', 'followed by'
    ];
    
    const techStackKeywords = [
      'react', 'vue', 'angular', 'node', 'express', 'fastapi', 'django',
      'postgres', 'mysql', 'mongodb', 'redis', 'supabase', 'firebase',
      'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'ci/cd'
    ];
    
    const integrationKeywords = [
      'integrate', 'connect', 'api integration', 'third-party', 'webhook',
      'oauth', 'stripe', 'paypal', 'twilio', 'sendgrid', 'aws s3'
    ];
    
    // Check for development keywords
    let devMatches = 0;
    for (const keyword of devKeywords) {
      if (messageLower.includes(keyword)) {
        devMatches++;
        score += 2;
      }
    }
    if (devMatches > 0) {
      indicators.push(`Development task (${devMatches} indicators)`);
    }
    
    // Check for feature keywords
    let featureMatches = 0;
    for (const keyword of featureKeywords) {
      if (messageLower.includes(keyword)) {
        featureMatches++;
        score += 1;
      }
    }
    if (featureMatches > 0) {
      indicators.push(`Multiple features (${featureMatches} features)`);
    }
    
    // Check for multi-step indicators
    let multiStepMatches = 0;
    for (const keyword of multiStepKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = messageLower.match(regex);
      if (matches) {
        multiStepMatches += matches.length;
      }
    }
    if (multiStepMatches >= 3) {
      score += 1;
      indicators.push(`Multi-step task (${multiStepMatches} connectors)`);
    }
    
    // Check for technology stack mentions
    let techMatches = 0;
    for (const keyword of techStackKeywords) {
      if (messageLower.includes(keyword)) {
        techMatches++;
        score += 1;
      }
    }
    if (techMatches > 0) {
      indicators.push(`Technology stack specified (${techMatches} technologies)`);
    }
    
    // Check for integration requirements
    let integrationMatches = 0;
    for (const keyword of integrationKeywords) {
      if (messageLower.includes(keyword)) {
        integrationMatches++;
        score += 1.5;
      }
    }
    if (integrationMatches > 0) {
      indicators.push(`External integrations (${integrationMatches} integrations)`);
    }
    
    // Check message length
    const wordCount = userMessage.split(/\s+/).length;
    if (wordCount > 50) {
      score += 1;
      indicators.push(`Detailed requirements (${wordCount} words)`);
    } else if (wordCount > 100) {
      score += 2;
      indicators.push(`Very detailed requirements (${wordCount} words)`);
    }
    
    // Check for deployment
    if (messageLower.includes('deploy') || messageLower.includes('production') || messageLower.includes('live')) {
      score += 1;
      indicators.push('Deployment required');
    }
    
    // Estimate subtasks
    let estimatedSubtasks = 3;
    if (devMatches > 0) estimatedSubtasks += 2;
    if (featureMatches > 0) estimatedSubtasks += Math.min(featureMatches, 3);
    if (integrationMatches > 0) estimatedSubtasks += integrationMatches;
    if (techMatches > 2) estimatedSubtasks += 1;
    estimatedSubtasks = Math.min(estimatedSubtasks, 7);
    
    const useDPPM = score >= 5;
    
    let reasoning = '';
    if (useDPPM) {
      reasoning = `This is a complex task (score: ${score.toFixed(1)}/10) that requires structured planning. ` +
        `DPPM will decompose it into ${estimatedSubtasks} subtasks and execute them sequentially.`;
    } else {
      reasoning = `This is a simple task (score: ${score.toFixed(1)}/10) that can be handled by the standard agent loop.`;
    }
    
    return {
      score: Math.min(score, 10),
      indicators,
      useDPPM,
      estimatedSubtasks,
      reasoning
    };
  }
  
  static isComplex(userMessage) {
    return this.analyze(userMessage).useDPPM;
  }
}

// Test cases
const testCases = [
  {
    name: 'Simple Search Query',
    message: 'Search for the latest AI news',
    expectedDPPM: false
  },
  {
    name: 'Simple Question',
    message: 'What is the capital of France?',
    expectedDPPM: false
  },
  {
    name: 'Medium Task - HTML Page',
    message: 'Create a simple HTML page with a contact form',
    expectedDPPM: false
  },
  {
    name: 'Complex Task - Todo App',
    message: 'Build a todo app with user authentication and deploy it to production',
    expectedDPPM: true
  },
  {
    name: 'Very Complex Task - E-commerce',
    message: 'Build a full-stack e-commerce platform with Stripe payment integration, user authentication, admin dashboard, product catalog, shopping cart, order management, and real-time inventory tracking. Deploy to production with CI/CD.',
    expectedDPPM: true
  },
  {
    name: 'Complex Task - Blog Platform',
    message: 'Create a blog platform with user registration, authentication, post creation, comments, likes, admin panel, and SEO optimization. Use React for frontend and Node.js with PostgreSQL for backend.',
    expectedDPPM: true
  },
  {
    name: 'Medium-Complex Task - Landing Page',
    message: 'Build a landing page for my bakery with hero section, menu, contact form, and deploy it',
    expectedDPPM: true
  },
  {
    name: 'Simple Task - Chart',
    message: 'Create a bar chart showing Q1=100, Q2=150, Q3=120',
    expectedDPPM: false
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
  const passed = analysis.useDPPM === testCase.expectedDPPM;
  
  if (passed) {
    console.log(`\n   ✅ PASSED`);
    passedTests++;
  } else {
    console.log(`\n   ❌ FAILED`);
    console.log(`      Expected DPPM: ${testCase.expectedDPPM}, Got: ${analysis.useDPPM}`);
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
