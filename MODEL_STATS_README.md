# Model Statistics Tracking System

## Overview

The Model Stats system tracks performance metrics for all AI models in the MOE (Mixture of Experts) competition. Every time a user query is processed, all 6 models compete and their results are recorded in the database.

---

## Database Schema

### Tables

#### `model_stats`
Aggregate statistics for each model:
- `total_competitions` - Total number of competitions participated in
- `total_wins` - Number of times the model won
- `total_losses` - Number of times the model lost
- `win_rate` - Percentage of wins (0-100)
- `avg_score` - Average Nash Equilibrium score
- `avg_latency` - Average response time in milliseconds
- `avg_tokens` - Average token count
- `avg_cost` - Average cost per query
- `avg_quality_score` - Average quality component score
- `avg_speed_score` - Average speed component score
- `avg_cost_score` - Average cost component score

#### `model_competition_results`
Individual competition records:
- `competition_id` - UUID linking related results
- `model_name` - Name of the model
- `is_winner` - Boolean indicating if this model won
- `score` - Nash Equilibrium score (0-100)
- `rank` - Position in the competition (1st, 2nd, etc.)
- `latency` - Response time in milliseconds
- `tokens` - Token count
- `cost` - Cost of this query
- `user_message` - The user's query
- `model_response` - The model's response (winner only)
- `had_files` - Whether files were attached
- `file_types` - Array of MIME types (e.g., ['image/jpeg', 'application/pdf'])

### Views

#### `model_leaderboard`
Ranked list of all models by win rate and average score.

#### `recent_model_performance`
Performance metrics for the last 7 days.

### Triggers

**`trigger_update_model_stats`**
Automatically updates aggregate stats in `model_stats` whenever a new result is inserted into `model_competition_results`.

---

## API Endpoints

All endpoints are prefixed with `/api/stats/`

### GET /api/stats/leaderboard
Get ranked leaderboard of all models.

**Query Parameters:**
- `limit` (optional) - Number of results (default: 10)

**Response:**
```json
[
  {
    "model_name": "google/gemini-2.0-flash-exp",
    "total_competitions": 150,
    "total_wins": 65,
    "total_losses": 85,
    "win_rate": 43.33,
    "avg_score": 78.50,
    "avg_latency": 542,
    "avg_tokens": 245,
    "avg_cost": 0.00000120,
    "rank": 1
  }
]
```

### GET /api/stats/model/:modelName
Get detailed stats for a specific model.

**Example:** `/api/stats/model/google%2Fgemini-2.0-flash-exp`

**Response:**
```json
{
  "model_name": "google/gemini-2.0-flash-exp",
  "total_competitions": 150,
  "total_wins": 65,
  "total_losses": 85,
  "win_rate": 43.33,
  "avg_score": 78.50,
  "avg_latency": 542,
  "avg_tokens": 245,
  "avg_cost": 0.00000120,
  "avg_quality_score": 82.10,
  "avg_speed_score": 75.20,
  "avg_cost_score": 90.50,
  "last_competition_at": "2025-12-06T08:30:15Z"
}
```

### GET /api/stats/recent
Get performance metrics for the last 7 days.

**Response:**
```json
[
  {
    "model_name": "google/gemini-2.0-flash-exp",
    "recent_competitions": 45,
    "recent_wins": 20,
    "recent_avg_score": 79.20,
    "recent_avg_latency": 538
  }
]
```

### GET /api/stats/history/:modelName
Get competition history for a model.

**Query Parameters:**
- `limit` (optional) - Number of results (default: 50)

**Response:**
```json
[
  {
    "model_name": "google/gemini-2.0-flash-exp",
    "is_winner": true,
    "score": 82.50,
    "rank": 1,
    "latency": 520,
    "tokens": 250,
    "cost": 0.00000125,
    "user_message": "Explain quantum computing",
    "model_response": "Quantum computing is...",
    "had_files": false,
    "created_at": "2025-12-06T08:30:15Z"
  }
]
```

### GET /api/stats/streaks/:modelName
Get win/loss streaks for a model.

**Response:**
```json
{
  "current_streak": 5,
  "streak_type": "win",
  "longest_win_streak": 12,
  "longest_loss_streak": 8
}
```

### GET /api/stats/head-to-head
Compare two models directly.

**Query Parameters:**
- `model1` (required) - First model name
- `model2` (required) - Second model name

**Example:** `/api/stats/head-to-head?model1=google/gemini-2.0-flash-exp&model2=gpt-4o-mini`

**Response:**
```json
{
  "model1_wins": 35,
  "model2_wins": 28,
  "model1_avg_score": 79.50,
  "model2_avg_score": 75.20
}
```

---

## Setup Instructions

### 1. Run Database Migration

Connect to your Supabase database and run:

```bash
psql -h your-supabase-host -U postgres -d postgres -f database/migrations/004_model_stats.sql
```

Or use the Supabase SQL Editor to paste and execute the contents of `004_model_stats.sql`.

### 2. Verify Tables Created

```sql
SELECT * FROM model_stats;
SELECT * FROM model_competition_results;
SELECT * FROM model_leaderboard;
```

### 3. Test the System

Upload a file or send a message through the Morgus interface. Check that stats are being recorded:

```sql
SELECT * FROM model_stats ORDER BY win_rate DESC;
```

---

## Usage Examples

### View Current Leaderboard
```bash
curl https://morgus-orchestrator.morgan-426.workers.dev/api/stats/leaderboard
```

### Check Gemini's Stats
```bash
curl https://morgus-orchestrator.morgan-426.workers.dev/api/stats/model/google%2Fgemini-2.0-flash-exp
```

### Compare Gemini vs Claude
```bash
curl "https://morgus-orchestrator.morgan-426.workers.dev/api/stats/head-to-head?model1=google/gemini-2.0-flash-exp&model2=claude-3-5-haiku-20241022"
```

---

## Frontend Integration

### Display Leaderboard in UI

```typescript
async function fetchLeaderboard() {
  const response = await fetch('https://morgus-orchestrator.morgan-426.workers.dev/api/stats/leaderboard?limit=6');
  const leaderboard = await response.json();
  
  leaderboard.forEach(model => {
    console.log(`${model.rank}. ${model.model_name} - ${model.win_rate}% win rate`);
  });
}
```

### Show Model Stats After Competition

```typescript
// After MOE competition completes
const winnerModel = moeResult.moeMetadata.winner.model;

const response = await fetch(`https://morgus-orchestrator.morgan-426.workers.dev/api/stats/model/${encodeURIComponent(winnerModel)}`);
const stats = await response.json();

console.log(`${winnerModel} has a ${stats.win_rate}% win rate over ${stats.total_competitions} competitions`);
```

---

## Analytics Queries

### Top 3 Models by Win Rate
```sql
SELECT model_name, win_rate, total_competitions
FROM model_stats
WHERE total_competitions >= 10
ORDER BY win_rate DESC, avg_score DESC
LIMIT 3;
```

### Models with Vision Support Performance
```sql
SELECT 
  model_name,
  COUNT(*) as vision_competitions,
  SUM(CASE WHEN is_winner THEN 1 ELSE 0 END) as vision_wins,
  ROUND(AVG(score), 2) as avg_vision_score
FROM model_competition_results
WHERE had_files = true
GROUP BY model_name
ORDER BY vision_wins DESC;
```

### Performance Trends Over Time
```sql
SELECT 
  DATE(created_at) as date,
  model_name,
  COUNT(*) as competitions,
  SUM(CASE WHEN is_winner THEN 1 ELSE 0 END) as wins,
  ROUND(AVG(score), 2) as avg_score
FROM model_competition_results
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), model_name
ORDER BY date DESC, wins DESC;
```

### Cost Analysis
```sql
SELECT 
  model_name,
  total_competitions,
  ROUND(avg_cost::numeric, 8) as avg_cost_per_query,
  ROUND((avg_cost * total_competitions)::numeric, 6) as total_cost
FROM model_stats
ORDER BY total_cost DESC;
```

---

## Monitoring

### Check Stats Collection Health
```sql
-- Ensure stats are being recorded
SELECT 
  COUNT(*) as total_records,
  MAX(created_at) as last_recorded,
  COUNT(DISTINCT model_name) as unique_models
FROM model_competition_results
WHERE created_at >= NOW() - INTERVAL '1 hour';
```

### Verify Trigger is Working
```sql
-- Insert a test record
INSERT INTO model_competition_results (
  model_name, is_winner, score, rank, latency, tokens, cost
) VALUES (
  'test-model', true, 85.0, 1, 500, 100, 0.0001
);

-- Check if model_stats was updated
SELECT * FROM model_stats WHERE model_name = 'test-model';

-- Clean up
DELETE FROM model_competition_results WHERE model_name = 'test-model';
DELETE FROM model_stats WHERE model_name = 'test-model';
```

---

## Performance Considerations

### Indexing
All necessary indexes are created by the migration:
- `idx_model_stats_win_rate` - Fast leaderboard queries
- `idx_model_stats_avg_score` - Score-based sorting
- `idx_competition_results_model` - Model history lookups
- `idx_competition_results_winner` - Winner filtering
- `idx_competition_results_created` - Time-based queries

### Async Recording
Stats are recorded asynchronously to avoid blocking the main response:
```typescript
statsService.recordCompetition(results).catch(err => {
  console.error('Failed to record stats:', err);
});
```

### Data Retention
Consider implementing a data retention policy:
```sql
-- Archive old competition results (keep last 90 days)
DELETE FROM model_competition_results
WHERE created_at < NOW() - INTERVAL '90 days';
```

---

## Future Enhancements

- [ ] Real-time dashboard with WebSocket updates
- [ ] Model performance predictions based on query type
- [ ] A/B testing framework for model selection strategies
- [ ] User-specific model preferences
- [ ] Cost optimization recommendations
- [ ] Anomaly detection for model performance degradation
- [ ] Export stats to CSV/JSON for external analysis

---

**Status:** ✅ Fully implemented and deployed  
**Last Updated:** Dec 6, 2025  
**Migration File:** `database/migrations/004_model_stats.sql`  
**Service:** `worker/src/services/model-stats.ts`  
**API:** `worker/src/stats-api.ts`
