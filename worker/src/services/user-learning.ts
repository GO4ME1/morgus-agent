/**
 * User Learning System
 * 
 * Learns from user feedback and interactions to personalize Morgus responses.
 * Stores preferences, patterns, and lessons learned per user.
 */

export interface UserPreferences {
  user_id: string;
  preferred_tone: 'professional' | 'casual' | 'technical' | 'friendly' | 'concise';
  preferred_models: string[];
  industry?: string;
  common_tasks: string[];
  avoid_patterns: string[];
  style_notes: string[];
  created_at: string;
  updated_at: string;
}

export interface UserLesson {
  id: string;
  user_id: string;
  task_type: string;
  model_used: string;
  feedback_type: 'positive' | 'negative' | 'glitch';
  what_worked?: string;
  what_failed?: string;
  lesson_learned: string;
  applied_count: number;
  created_at: string;
}

export interface UserPattern {
  id: string;
  user_id: string;
  pattern_type: 'task' | 'style' | 'preference';
  pattern_key: string;
  pattern_value: string;
  confidence: number;
  occurrence_count: number;
  last_seen: string;
}

export class UserLearningService {
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
  }

  /**
   * Get user preferences, creating defaults if none exist
   */
  async getPreferences(userId: string): Promise<UserPreferences> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/user_preferences?user_id=eq.${userId}&select=*`,
        {
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
          },
        }
      );

      const data = await response.json();
      
      if (data && data.length > 0) {
        return data[0];
      }

      // Return defaults if no preferences exist
      return {
        user_id: userId,
        preferred_tone: 'professional',
        preferred_models: [],
        common_tasks: [],
        avoid_patterns: [],
        style_notes: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[UserLearning] Failed to get preferences:', error);
      return {
        user_id: userId,
        preferred_tone: 'professional',
        preferred_models: [],
        common_tasks: [],
        avoid_patterns: [],
        style_notes: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId: string, updates: Partial<UserPreferences>): Promise<void> {
    try {
      const existing = await this.getPreferences(userId);
      const updated = {
        ...existing,
        ...updates,
        user_id: userId,
        updated_at: new Date().toISOString(),
      };

      await fetch(
        `${this.supabaseUrl}/rest/v1/user_preferences`,
        {
          method: 'POST',
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify(updated),
        }
      );
    } catch (error) {
      console.error('[UserLearning] Failed to update preferences:', error);
    }
  }

  /**
   * Record a lesson learned from user feedback
   */
  async recordLesson(
    userId: string,
    taskType: string,
    modelUsed: string,
    feedbackType: 'positive' | 'negative' | 'glitch',
    details: { whatWorked?: string; whatFailed?: string; lessonLearned: string }
  ): Promise<void> {
    try {
      const lesson: Omit<UserLesson, 'id'> = {
        user_id: userId,
        task_type: taskType,
        model_used: modelUsed,
        feedback_type: feedbackType,
        what_worked: details.whatWorked,
        what_failed: details.whatFailed,
        lesson_learned: details.lessonLearned,
        applied_count: 0,
        created_at: new Date().toISOString(),
      };

      await fetch(
        `${this.supabaseUrl}/rest/v1/user_lessons`,
        {
          method: 'POST',
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(lesson),
        }
      );

      console.log('[UserLearning] Lesson recorded:', details.lessonLearned);
    } catch (error) {
      console.error('[UserLearning] Failed to record lesson:', error);
    }
  }

  /**
   * Get lessons relevant to a task type
   */
  async getLessonsForTask(userId: string, taskType: string): Promise<UserLesson[]> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/user_lessons?user_id=eq.${userId}&task_type=eq.${taskType}&order=created_at.desc&limit=10`,
        {
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
          },
        }
      );

      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('[UserLearning] Failed to get lessons:', error);
      return [];
    }
  }

  /**
   * Record a user pattern (detected from interactions)
   */
  async recordPattern(
    userId: string,
    patternType: 'task' | 'style' | 'preference',
    patternKey: string,
    patternValue: string
  ): Promise<void> {
    try {
      // Check if pattern exists
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/user_patterns?user_id=eq.${userId}&pattern_key=eq.${patternKey}&select=*`,
        {
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
          },
        }
      );

      const existing = await response.json();

      if (existing && existing.length > 0) {
        // Update existing pattern
        const pattern = existing[0];
        await fetch(
          `${this.supabaseUrl}/rest/v1/user_patterns?id=eq.${pattern.id}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': this.supabaseKey,
              'Authorization': `Bearer ${this.supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              pattern_value: patternValue,
              occurrence_count: pattern.occurrence_count + 1,
              confidence: Math.min(1, pattern.confidence + 0.1),
              last_seen: new Date().toISOString(),
            }),
          }
        );
      } else {
        // Create new pattern
        await fetch(
          `${this.supabaseUrl}/rest/v1/user_patterns`,
          {
            method: 'POST',
            headers: {
              'apikey': this.supabaseKey,
              'Authorization': `Bearer ${this.supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: userId,
              pattern_type: patternType,
              pattern_key: patternKey,
              pattern_value: patternValue,
              confidence: 0.3,
              occurrence_count: 1,
              last_seen: new Date().toISOString(),
            }),
          }
        );
      }
    } catch (error) {
      console.error('[UserLearning] Failed to record pattern:', error);
    }
  }

  /**
   * Get high-confidence patterns for a user
   */
  async getPatterns(userId: string, minConfidence: number = 0.5): Promise<UserPattern[]> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/user_patterns?user_id=eq.${userId}&confidence=gte.${minConfidence}&order=confidence.desc`,
        {
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
          },
        }
      );

      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('[UserLearning] Failed to get patterns:', error);
      return [];
    }
  }

  /**
   * Build a personalization context for prompts
   */
  async buildPersonalizationContext(userId: string, taskType?: string): Promise<string> {
    const preferences = await this.getPreferences(userId);
    const patterns = await this.getPatterns(userId);
    const lessons = taskType ? await this.getLessonsForTask(userId, taskType) : [];

    const contextParts: string[] = [];

    // Add tone preference
    if (preferences.preferred_tone !== 'professional') {
      contextParts.push(`User prefers ${preferences.preferred_tone} tone.`);
    }

    // Add industry context
    if (preferences.industry) {
      contextParts.push(`User works in ${preferences.industry} industry.`);
    }

    // Add avoid patterns
    if (preferences.avoid_patterns.length > 0) {
      contextParts.push(`Avoid: ${preferences.avoid_patterns.join(', ')}.`);
    }

    // Add style notes
    if (preferences.style_notes.length > 0) {
      contextParts.push(`Style notes: ${preferences.style_notes.join('; ')}.`);
    }

    // Add high-confidence patterns
    const stylePatterns = patterns.filter(p => p.pattern_type === 'style');
    for (const pattern of stylePatterns.slice(0, 3)) {
      contextParts.push(`${pattern.pattern_key}: ${pattern.pattern_value}`);
    }

    // Add relevant lessons
    const negativeLessons = lessons.filter(l => l.feedback_type === 'negative');
    for (const lesson of negativeLessons.slice(0, 2)) {
      contextParts.push(`Previous issue: ${lesson.lesson_learned}`);
    }

    if (contextParts.length === 0) {
      return '';
    }

    return `\n\n[User Personalization]\n${contextParts.join('\n')}`;
  }

  /**
   * Learn from user feedback on a response
   */
  async learnFromFeedback(
    userId: string,
    feedbackType: 'positive' | 'negative' | 'glitch',
    taskType: string,
    modelUsed: string,
    userMessage: string,
    modelResponse: string
  ): Promise<void> {
    // Record the feedback as a lesson
    if (feedbackType === 'positive') {
      await this.recordLesson(userId, taskType, modelUsed, feedbackType, {
        whatWorked: `Model ${modelUsed} produced good results for ${taskType}`,
        lessonLearned: `${modelUsed} works well for ${taskType} tasks`,
      });

      // Increase confidence in this model for this task type
      await this.recordPattern(userId, 'preference', `preferred_model_${taskType}`, modelUsed);
    } else if (feedbackType === 'negative') {
      // Try to detect what went wrong
      const issues = this.detectIssues(userMessage, modelResponse);
      
      await this.recordLesson(userId, taskType, modelUsed, feedbackType, {
        whatFailed: issues.join('; '),
        lessonLearned: `Avoid ${modelUsed} for ${taskType} or adjust approach: ${issues[0] || 'unknown issue'}`,
      });

      // Record avoid pattern
      if (issues.length > 0) {
        await this.recordPattern(userId, 'preference', `avoid_${taskType}`, issues[0]);
      }
    }
  }

  /**
   * Detect potential issues in a response
   */
  private detectIssues(userMessage: string, modelResponse: string): string[] {
    const issues: string[] = [];

    // Check for too formal/informal mismatch
    const userCasual = /\b(hey|hi|thanks|cool|awesome)\b/i.test(userMessage);
    const responseFormal = /\b(furthermore|therefore|consequently|hereby)\b/i.test(modelResponse);
    if (userCasual && responseFormal) {
      issues.push('Response too formal for casual request');
    }

    // Check for too long response
    if (modelResponse.length > 3000 && userMessage.length < 100) {
      issues.push('Response too verbose for simple request');
    }

    // Check for code when not requested
    const hasCode = /```[\s\S]+```/.test(modelResponse);
    const askedForCode = /\b(code|script|function|program|implement)\b/i.test(userMessage);
    if (hasCode && !askedForCode) {
      issues.push('Included code when not requested');
    }

    // Check for emoji overuse
    const emojiCount = (modelResponse.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
    if (emojiCount > 5) {
      issues.push('Too many emojis');
    }

    return issues;
  }
}

// SQL Migration for user learning tables
export const USER_LEARNING_MIGRATION = `
-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_tone TEXT DEFAULT 'professional',
  preferred_models TEXT[] DEFAULT '{}',
  industry TEXT,
  common_tasks TEXT[] DEFAULT '{}',
  avoid_patterns TEXT[] DEFAULT '{}',
  style_notes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Lessons Table (learned from feedback)
CREATE TABLE IF NOT EXISTS user_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  model_used TEXT NOT NULL,
  feedback_type TEXT NOT NULL,
  what_worked TEXT,
  what_failed TEXT,
  lesson_learned TEXT NOT NULL,
  applied_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_lessons_user_task ON user_lessons(user_id, task_type);

-- User Patterns Table (detected from interactions)
CREATE TABLE IF NOT EXISTS user_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL,
  pattern_key TEXT NOT NULL,
  pattern_value TEXT NOT NULL,
  confidence DECIMAL(3, 2) DEFAULT 0.3,
  occurrence_count INTEGER DEFAULT 1,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, pattern_key)
);

CREATE INDEX IF NOT EXISTS idx_user_patterns_user_confidence ON user_patterns(user_id, confidence DESC);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_patterns ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to preferences" ON user_preferences FOR ALL USING (true);

CREATE POLICY "Users can view own lessons" ON user_lessons FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to lessons" ON user_lessons FOR ALL USING (true);

CREATE POLICY "Users can view own patterns" ON user_patterns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to patterns" ON user_patterns FOR ALL USING (true);
`;
