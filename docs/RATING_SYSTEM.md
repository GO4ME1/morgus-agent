# Morgus Rating System Documentation

## Overview

The Morgus Agent includes a comprehensive rating system that allows users to provide feedback on agent responses. This feedback is stored in the database and can be used for training, quality improvement, and analytics.

## Features

### Rating Buttons

Each assistant message displays three rating buttons:

- **👍 Thumbs Up (Good)** - Indicates the response was helpful and accurate
- **👎 Thumbs Down (Bad)** - Indicates the response was unhelpful or inaccurate  
- **🍅 Tomato (Glitch)** - Reports a technical glitch, error, or malfunction

### User Feedback

When a user clicks a rating button:
1. The rating is immediately saved to the `message_ratings` database table
2. A confirmation alert appears with feedback (e.g., "👍 Thanks for the feedback!")
3. The rating is associated with the specific message ID for tracking

## Database Schema

### Table: `message_ratings`

```sql
CREATE TABLE message_ratings (
  id SERIAL PRIMARY KEY,
  message_id TEXT NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('good', 'bad', 'glitch')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id TEXT,
  feedback_text TEXT,
  context JSONB
);

-- Indexes for performance
CREATE INDEX idx_message_ratings_message_id ON message_ratings(message_id);
CREATE INDEX idx_message_ratings_rating ON message_ratings(rating);
CREATE INDEX idx_message_ratings_created_at ON message_ratings(created_at DESC);
```

### Fields

- **id**: Auto-incrementing primary key
- **message_id**: Unique identifier for the rated message
- **rating**: One of `'good'`, `'bad'`, or `'glitch'`
- **created_at**: Timestamp when the rating was submitted
- **user_id**: (Optional) User identifier for multi-user tracking
- **feedback_text**: (Optional) Additional text feedback from user
- **context**: (Optional) JSON context about the rating (conversation state, etc.)

## Implementation Details

### Frontend (App.tsx)

```typescript
const rateMessage = async (messageId: string, rating: 'good' | 'bad' | 'glitch') => {
  try {
    // Save rating to database
    const { error } = await supabase
      .from('message_ratings')
      .insert({
        message_id: messageId,
        rating: rating,
        created_at: new Date().toISOString(),
      });

    if (error) throw error;

    // Show feedback
    const emoji = rating === 'good' ? '👍' : rating === 'bad' ? '👎' : '🍅';
    const text = rating === 'good' ? 'Thanks for the feedback!' : 
                 rating === 'bad' ? 'Sorry! I\'ll try to improve.' : 
                 'Glitch reported!';
    alert(`${emoji} ${text}`);
  } catch (error) {
    console.error('Failed to save rating:', error);
    // Don't show error to user for ratings
  }
};
```

### Rating Buttons UI

```tsx
{message.role === 'assistant' && !message.isStreaming && (
  <div className="message-actions">
    <button 
      className="icon-button" 
      onClick={() => rateMessage(message.id, 'good')}
      title="Good response"
    >
      👍
    </button>
    <button 
      className="icon-button" 
      onClick={() => rateMessage(message.id, 'bad')}
      title="Bad response"
    >
      👎
    </button>
    <button 
      className="icon-button" 
      onClick={() => rateMessage(message.id, 'glitch')}
      title="Report glitch"
    >
      🍅
    </button>
  </div>
)}
```

## Analytics & Insights

### Viewing Ratings Data

You can query the ratings in Supabase SQL Editor:

```sql
-- Get all ratings
SELECT * FROM message_ratings ORDER BY created_at DESC;

-- Count ratings by type
SELECT rating, COUNT(*) as count 
FROM message_ratings 
GROUP BY rating;

-- Get recent bad ratings
SELECT * FROM message_ratings 
WHERE rating = 'bad' 
ORDER BY created_at DESC 
LIMIT 10;

-- Calculate satisfaction rate
SELECT 
  ROUND(100.0 * SUM(CASE WHEN rating = 'good' THEN 1 ELSE 0 END) / COUNT(*), 2) as satisfaction_percentage,
  COUNT(*) as total_ratings
FROM message_ratings;
```

### Common Queries

**Find messages with multiple ratings:**
```sql
SELECT message_id, COUNT(*) as rating_count
FROM message_ratings
GROUP BY message_id
HAVING COUNT(*) > 1;
```

**Get rating trends over time:**
```sql
SELECT 
  DATE(created_at) as date,
  rating,
  COUNT(*) as count
FROM message_ratings
GROUP BY DATE(created_at), rating
ORDER BY date DESC;
```

**Identify glitch patterns:**
```sql
SELECT 
  message_id,
  created_at,
  context
FROM message_ratings
WHERE rating = 'glitch'
ORDER BY created_at DESC;
```

## Future Enhancements

### 1. Training Data Export

Export ratings for machine learning:

```sql
-- Export training data
SELECT 
  m.content as message_content,
  r.rating,
  r.feedback_text,
  r.created_at
FROM message_ratings r
JOIN messages m ON r.message_id = m.id
WHERE r.rating IN ('good', 'bad')
ORDER BY r.created_at DESC;
```

### 2. Enhanced Feedback Collection

Add optional text feedback field:

```typescript
const rateMessage = async (
  messageId: string, 
  rating: 'good' | 'bad' | 'glitch',
  feedbackText?: string
) => {
  await supabase.from('message_ratings').insert({
    message_id: messageId,
    rating: rating,
    feedback_text: feedbackText,
    created_at: new Date().toISOString(),
  });
};
```

### 3. User-Specific Tracking

Track ratings by user for personalization:

```typescript
const rateMessage = async (messageId: string, rating: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  await supabase.from('message_ratings').insert({
    message_id: messageId,
    rating: rating,
    user_id: user?.id,
    created_at: new Date().toISOString(),
  });
};
```

### 4. Context Capture

Store conversation context for better analysis:

```typescript
const rateMessage = async (messageId: string, rating: string) => {
  await supabase.from('message_ratings').insert({
    message_id: messageId,
    rating: rating,
    context: {
      thought_id: currentThoughtId,
      message_count: messages.length,
      user_query: messages[messages.length - 2]?.content,
    },
    created_at: new Date().toISOString(),
  });
};
```

### 5. Automated Quality Monitoring

Set up alerts for quality issues:

```sql
-- Create a view for quality monitoring
CREATE VIEW quality_alerts AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE rating = 'bad') as bad_count,
  COUNT(*) FILTER (WHERE rating = 'glitch') as glitch_count,
  COUNT(*) as total_ratings,
  ROUND(100.0 * COUNT(*) FILTER (WHERE rating = 'bad') / COUNT(*), 2) as bad_percentage
FROM message_ratings
GROUP BY DATE(created_at)
HAVING COUNT(*) FILTER (WHERE rating = 'bad') > 5 
   OR ROUND(100.0 * COUNT(*) FILTER (WHERE rating = 'bad') / COUNT(*), 2) > 30;
```

### 6. Reinforcement Learning Integration

Use ratings for RLHF (Reinforcement Learning from Human Feedback):

1. **Collect Preference Data**: Store good/bad ratings as preference pairs
2. **Train Reward Model**: Use ratings to train a reward model
3. **Fine-tune Agent**: Use PPO or similar to optimize agent behavior
4. **A/B Testing**: Compare agent versions using rating metrics

## Testing the Rating System

### Manual Testing

1. Open the Morgus console at https://37129b84.morgus-console.pages.dev
2. Send a message to the agent
3. Click one of the rating buttons (👍, 👎, or 🍅)
4. Verify the confirmation alert appears
5. Check Supabase Table Editor to see the rating was saved

### Automated Testing

```typescript
// Test rating submission
test('should save rating to database', async () => {
  const messageId = 'test-message-123';
  await rateMessage(messageId, 'good');
  
  const { data } = await supabase
    .from('message_ratings')
    .select('*')
    .eq('message_id', messageId)
    .single();
    
  expect(data.rating).toBe('good');
});
```

## Best Practices

1. **Don't Overwhelm Users**: Only show rating buttons on assistant messages
2. **Silent Failures**: Don't show errors to users if rating fails (log silently)
3. **Immediate Feedback**: Show confirmation alert immediately after rating
4. **Privacy**: Don't store sensitive user data in ratings
5. **Analytics**: Regularly review ratings to identify improvement areas
6. **Action Items**: Create a process to address bad ratings and glitches

## Troubleshooting

### Ratings Not Saving

1. Check Supabase connection in browser console
2. Verify `message_ratings` table exists
3. Check table permissions (RLS policies)
4. Verify network requests in browser DevTools

### Missing Rating Buttons

1. Verify `message.role === 'assistant'`
2. Check `!message.isStreaming` condition
3. Inspect CSS for `.message-actions` visibility

### Database Errors

```sql
-- Check table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'message_ratings';

-- Verify indexes
SELECT * FROM pg_indexes 
WHERE tablename = 'message_ratings';
```

## Cost Considerations

The rating system is **completely FREE** with Supabase's free tier:

- ✅ Unlimited rating submissions
- ✅ Up to 500MB database storage
- ✅ 2GB bandwidth per month
- ✅ No additional API costs

## Summary

The Morgus rating system provides a simple, effective way to collect user feedback on agent responses. The data is stored in a structured format that enables:

- **Quality Monitoring**: Track response quality over time
- **Training Data**: Export ratings for ML model improvement
- **User Insights**: Understand what users find helpful
- **Bug Tracking**: Identify and fix glitches quickly

All feedback is stored in the `message_ratings` table and can be analyzed using SQL queries in the Supabase dashboard.
