/**
 * MOE Proof of Concept Test
 * 
 * Tests the MOE system with OpenRouter and Nash Equilibrium
 */

import { MOEService } from './service';

async function testMOE() {
  console.log('🚀 Starting MOE Proof of Concept Test\n');

  // Get API key from environment
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENROUTER_API_KEY environment variable not set');
    process.exit(1);
  }

  // Initialize MOE service
  const moe = new MOEService(apiKey);

  console.log('📋 Available Models:');
  const models = moe.getAvailableModels();
  console.log('\nFree Models:');
  models.free.forEach((m) => console.log(`  - ${m.name} (${m.id})`));
  console.log('\nPaid Models:');
  models.paid.forEach((m) => console.log(`  - ${m.name} (${m.id})`));

  // Test prompt
  const prompt = 'Explain quantum computing in one paragraph.';
  console.log(`\n📝 Test Prompt: "${prompt}"\n`);

  try {
    // Query MOE with free models
    console.log('🔄 Querying models...\n');
    const result = await moe.query({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    console.log('✅ MOE Query Complete!\n');
    console.log('=' .repeat(80));
    console.log('RESULTS');
    console.log('='.repeat(80));

    console.log('\n📊 Metadata:');
    console.log(`  Models Queried: ${result.metadata.modelsQueried}`);
    console.log(`  Total Latency: ${result.metadata.totalLatency}ms`);
    console.log(`  Total Cost: $${result.metadata.totalCost.toFixed(6)}`);

    console.log('\n🏆 Winner:');
    console.log(`  Model: ${result.winner.model}`);
    console.log(`  Latency: ${result.winner.latency}ms`);
    console.log(`  Tokens: ${result.winner.tokens.total}`);
    console.log(`  Cost: $${result.winner.cost.toFixed(6)}`);
    console.log(`  Response:\n`);
    console.log(`  ${result.winner.content}\n`);

    console.log('\n📈 Nash Equilibrium Analysis:');
    console.log(result.nashResult.explanation);

    console.log('\n' + '='.repeat(80));
    console.log('ALL RESPONSES');
    console.log('='.repeat(80));

    for (let i = 0; i < result.allResponses.length; i++) {
      const response = result.allResponses[i];
      const isWinner = response.model === result.winner.model;

      console.log(`\n${i + 1}. ${response.model} ${isWinner ? '👑' : ''}`);
      console.log(`   Latency: ${response.latency}ms`);
      console.log(`   Tokens: ${response.tokens.total}`);
      console.log(`   Cost: $${response.cost.toFixed(6)}`);
      console.log(`   Response: ${response.content.substring(0, 200)}...`);
    }

    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run test
testMOE();
