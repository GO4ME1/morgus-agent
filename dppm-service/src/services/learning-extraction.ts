import OpenAI from 'openai';
import { proposePlatformLearning, proposeMorgyLearning, PlatformLearning, MorgyLearning } from './memory-service';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Extract platform learnings from a task execution reflection
 */
export async function extractPlatformLearnings(
  taskDescription: string,
  execution: string,
  outcome: string,
  userId: string
): Promise<{ success: boolean; learnings: string[] }> {
  try {
    const prompt = `You are an AI system analyzer. Analyze this task execution and extract valuable platform-wide learnings that could help future task executions.

Task: ${taskDescription}
Execution: ${execution}
Outcome: ${outcome}

Extract 1-3 specific, actionable learnings that:
1. Are generalizable to similar tasks
2. Provide clear guidance or insights
3. Could improve future task success rates
4. Are not obvious or trivial

For each learning, provide:
- Title (brief, descriptive)
- Learning (detailed explanation)
- Category (one of: task_execution, user_interaction, model_selection, task_decomposition, error_handling, optimization, user_preference, best_practice, general)
- Keywords (3-5 relevant keywords)
- Applies to categories (task types this applies to)
- Confidence score (0-1)

Format as JSON array:
[{
  "title": "...",
  "learning": "...",
  "category": "...",
  "keywords": ["..."],
  "applies_to_categories": ["..."],
  "confidence_score": 0.8
}]

If no valuable learnings can be extracted, return an empty array.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      return { success: false, learnings: [] };
    }

    const parsed = JSON.parse(content);
    const learnings = Array.isArray(parsed) ? parsed : parsed.learnings || [];

    // Propose each learning
    const proposedIds: string[] = [];
    for (const learning of learnings) {
      try {
        const result = await proposePlatformLearning(learning as PlatformLearning, userId);
        if (result.success) {
          proposedIds.push(result.id);
        }
      } catch (error) {
        console.error('Error proposing platform learning:', error);
      }
    }

    return {
      success: true,
      learnings: proposedIds
    };
  } catch (error) {
    console.error('Error extracting platform learnings:', error);
    return { success: false, learnings: [] };
  }
}

/**
 * Extract Morgy learnings from a conversation
 */
export async function extractMorgyLearnings(
  morgyId: string,
  conversationHistory: Array<{ role: string; content: string }>,
  userId: string,
  sessionId?: string
): Promise<{ success: boolean; learnings: string[] }> {
  try {
    // Only analyze if conversation is substantial (at least 4 messages)
    if (conversationHistory.length < 4) {
      return { success: true, learnings: [] };
    }

    const conversationText = conversationHistory
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n\n');

    const prompt = `You are a Morgy (AI agent) learning analyzer. Analyze this conversation and extract valuable domain-specific learnings that could help this Morgy improve.

Conversation:
${conversationText}

Extract 1-2 specific, actionable learnings that:
1. Are specific to this Morgy's domain/purpose
2. Represent user preferences or successful patterns
3. Could improve future conversations
4. Are not generic advice

For each learning, provide:
- Title (brief, descriptive)
- Learning (detailed explanation)
- Domain (the specific domain this applies to)
- Learning type (one of: insight, best_practice, warning, preference, optimization)
- Keywords (3-5 relevant keywords)
- Confidence score (0-1)
- Example query (a query where this learning would apply)
- Example response (how to apply this learning)

Format as JSON array:
[{
  "title": "...",
  "learning": "...",
  "domain": "...",
  "learning_type": "...",
  "keywords": ["..."],
  "confidence_score": 0.8,
  "example_query": "...",
  "example_response": "..."
}]

If no valuable learnings can be extracted, return an empty array.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      return { success: false, learnings: [] };
    }

    const parsed = JSON.parse(content);
    const learnings = Array.isArray(parsed) ? parsed : parsed.learnings || [];

    // Propose each learning
    const proposedIds: string[] = [];
    for (const learning of learnings) {
      try {
        const result = await proposeMorgyLearning(
          {
            ...learning,
            morgy_id: morgyId,
            specific_user_id: userId // Initially user-specific
          } as MorgyLearning,
          sessionId
        );
        if (result.success) {
          proposedIds.push(result.id);
        }
      } catch (error) {
        console.error('Error proposing Morgy learning:', error);
      }
    }

    return {
      success: true,
      learnings: proposedIds
    };
  } catch (error) {
    console.error('Error extracting Morgy learnings:', error);
    return { success: false, learnings: [] };
  }
}

/**
 * Analyze if a learning should be promoted from user-specific to all-users
 */
export async function analyzeLearningPromotion(
  learningId: string,
  timesApplied: number,
  feedbackScore: number
): Promise<{ shouldPromote: boolean; reason: string }> {
  // Promote if:
  // 1. Applied at least 5 times
  // 2. Feedback score > 0.6 (60% positive)
  // 3. No negative feedback in last 3 applications

  if (timesApplied < 5) {
    return {
      shouldPromote: false,
      reason: 'Not enough applications yet'
    };
  }

  if (feedbackScore < 0.6) {
    return {
      shouldPromote: false,
      reason: 'Feedback score too low'
    };
  }

  return {
    shouldPromote: true,
    reason: `Strong performance: ${timesApplied} applications with ${(feedbackScore * 100).toFixed(0)}% positive feedback`
  };
}

/**
 * Generate a user-friendly explanation of a learning
 */
export async function explainLearning(
  learning: { title: string; learning: string; category?: string; domain?: string }
): Promise<string> {
  try {
    const prompt = `Explain this learning in simple, user-friendly language (1-2 sentences):

Title: ${learning.title}
Learning: ${learning.learning}
${learning.category ? `Category: ${learning.category}` : ''}
${learning.domain ? `Domain: ${learning.domain}` : ''}

Provide a brief, clear explanation of what this learning means and why it's valuable.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 100
    });

    return response.choices[0].message.content || learning.learning;
  } catch (error) {
    console.error('Error explaining learning:', error);
    return learning.learning;
  }
}
