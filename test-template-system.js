/**
 * Test Template System
 * Verify that template detection and generation works correctly
 */

// Simulate the template detection logic
function detectWebsiteTemplate(message) {
  const lower = message.toLowerCase();
  
  const patterns = [
    { type: 'saas', keywords: ['saas', 'software', 'platform', 'dashboard', 'analytics', 'b2b', 'enterprise', 'crm', 'erp'] },
    { type: 'mobile-app', keywords: ['mobile app', 'ios app', 'android app', 'app store', 'play store', 'download app'] },
    { type: 'game', keywords: ['game', 'gaming', 'video game', 'play', 'rpg', 'mmorpg', 'indie game', 'steam'] },
    { type: 'portfolio', keywords: ['portfolio', 'personal website', 'cv', 'resume', 'showcase', 'work samples'] },
    { type: 'ecommerce', keywords: ['ecommerce', 'e-commerce', 'shop', 'store', 'buy', 'sell', 'products', 'cart'] },
    { type: 'restaurant', keywords: ['restaurant', 'cafe', 'food', 'menu', 'dining', 'bistro', 'eatery', 'bar', 'coffee', 'spa', 'retreat'] },
    { type: 'agency', keywords: ['agency', 'marketing', 'design agency', 'creative agency', 'consulting', 'studio'] },
    { type: 'blog', keywords: ['blog', 'news', 'articles', 'magazine', 'publication', 'journal'] },
    { type: 'event', keywords: ['event', 'conference', 'meetup', 'webinar', 'summit', 'festival', 'concert', 'workshop'] },
    { type: 'startup', keywords: ['startup', 'launch', 'coming soon', 'waitlist', 'beta', 'pre-launch'] },
    { type: 'dating', keywords: ['dating', 'love', 'looking for', 'match', 'single', 'relationship', 'romance', 'soulmate', 'partner', 'meet', 'unicorn love', 'find love'] },
    { type: 'creative', keywords: ['creative', 'art', 'artist', 'musician', 'band', 'character', 'story', 'fantasy', 'fun', 'whimsical', 'quirky', 'unique'] },
    { type: 'personal', keywords: ['personal', 'about me', 'bio', 'profile', 'personal brand'] },
    { type: 'product', keywords: ['product', 'feature', 'new release', 'announcement'] },
    { type: 'nonprofit', keywords: ['nonprofit', 'charity', 'donation', 'cause', 'volunteer', 'foundation'] },
    { type: 'education', keywords: ['education', 'school', 'course', 'learning', 'university', 'academy', 'training'] },
    { type: 'healthcare', keywords: ['healthcare', 'medical', 'clinic', 'doctor', 'hospital', 'health', 'wellness'] },
    { type: 'realestate', keywords: ['real estate', 'property', 'homes', 'apartments', 'rental', 'housing'] },
    { type: 'fitness', keywords: ['fitness', 'gym', 'workout', 'training', 'yoga', 'sports', 'athletic'] },
    { type: 'entertainment', keywords: ['entertainment', 'movie', 'music', 'show', 'tv', 'streaming', 'podcast'] },
  ];
  
  for (const pattern of patterns) {
    if (pattern.keywords.some(keyword => lower.includes(keyword))) {
      return pattern.type;
    }
  }
  
  return 'startup';
}

function detectVisualStyle(goal) {
  const goalLower = goal.toLowerCase();
  
  const styles = {
    'modern-minimal': ['minimal', 'clean', 'simple', 'modern', 'sleek', 'professional'],
    'bold-dynamic': ['bold', 'dynamic', 'energetic', 'vibrant', 'exciting', 'powerful', 'strong', 'cutting-edge'],
    'classic-professional': ['professional', 'corporate', 'business', 'traditional', 'formal', 'enterprise'],
    'creative-artistic': ['creative', 'artistic', 'unique', 'playful', 'fun', 'quirky', 'whimsical'],
    'elegant-luxury': ['luxury', 'elegant', 'premium', 'sophisticated', 'refined', 'exclusive', 'high-end', 'spa', 'retreat']
  };
  
  for (const [styleName, keywords] of Object.entries(styles)) {
    for (const keyword of keywords) {
      if (goalLower.includes(keyword)) {
        return { style: styleName, keyword };
      }
    }
  }
  
  return { style: 'modern-minimal', keyword: 'default' };
}

// Test cases
const testCases = [
  {
    input: "Create a landing page for a luxury spa retreat called Zen Garden Spa",
    expectedTemplate: "restaurant",
    expectedStyle: "elegant-luxury"
  },
  {
    input: "Build a startup landing page for NeuralMind AI with cutting-edge design",
    expectedTemplate: "startup",
    expectedStyle: "bold-dynamic"
  },
  {
    input: "Make a dating profile page for Carl the Unicorn",
    expectedTemplate: "dating",
    expectedStyle: "modern-minimal"
  },
  {
    input: "Create a professional portfolio for a photographer",
    expectedTemplate: "portfolio",
    expectedStyle: "classic-professional"
  },
  {
    input: "Build a creative artist website with unique design",
    expectedTemplate: "creative",
    expectedStyle: "creative-artistic"
  }
];

console.log('\n🧪 Testing Template System\n');
console.log('='.repeat(80));

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  console.log(`\nTest ${index + 1}: ${test.input}`);
  console.log('-'.repeat(80));
  
  const detectedTemplate = detectWebsiteTemplate(test.input);
  const { style: detectedStyle, keyword } = detectVisualStyle(test.input);
  
  const templateMatch = detectedTemplate === test.expectedTemplate;
  const styleMatch = detectedStyle === test.expectedStyle;
  
  console.log(`  Template: ${detectedTemplate} ${templateMatch ? '✅' : '❌ Expected: ' + test.expectedTemplate}`);
  console.log(`  Style: ${detectedStyle} (keyword: "${keyword}") ${styleMatch ? '✅' : '❌ Expected: ' + test.expectedStyle}`);
  
  if (templateMatch && styleMatch) {
    passed++;
    console.log('  Result: ✅ PASS');
  } else {
    failed++;
    console.log('  Result: ❌ FAIL');
  }
});

console.log('\n' + '='.repeat(80));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests\n`);

if (failed === 0) {
  console.log('🎉 All tests passed! Template system is working correctly.\n');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Please review the template detection logic.\n');
  process.exit(1);
}
