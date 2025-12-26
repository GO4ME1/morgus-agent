# NAMEx Paper Summary: Expert Merging with Nash Bargaining

## Paper: "Expert Merging in Sparse Mixture of Experts with Nash Bargaining"

### Core Concept

The paper introduces **NAMEx (Nash Merging of Experts)**, which reframes expert merging as a cooperative-competitive game among experts using Nash Bargaining Solution (NBS). Instead of simple averaging, it treats each expert's contribution as a "player" in a bargaining game.

### Key Insights for Our MOE Implementation

**1. Expert Interaction Dynamics**
The paper shows that expert behavior varies by layer - some layers show cooperative patterns (high similarity between experts), while others show competitive/adversarial patterns. This suggests we should weight experts dynamically based on their alignment.

**2. Nash Bargaining for Merging**
Instead of simple weighted averaging, the Nash Bargaining approach finds an optimal combination that:
- Is Pareto efficient (no expert can be improved without hurting another)
- Balances cooperative and competitive dynamics
- Uses domain vectors (deviation from base) as utility functions

**3. Speed via Complex Momentum**
The paper introduces complex momentum to accelerate convergence - this is relevant for our speed optimization goal.

### Application to Morgus MOE

**Current Approach:**
- Query multiple models in parallel
- Use Nash equilibrium to select winner based on quality scores

**Improvements Based on Paper:**

1. **Dynamic Weighting by Response Alignment**
   - Calculate cosine similarity between model responses
   - Models with high agreement get cooperative bonus
   - Models with unique insights (low similarity but high quality) get competitive bonus

2. **Speed as a Utility Function**
   - Add latency as a factor in the Nash calculation
   - Faster responses get higher utility, but quality remains primary

3. **Momentum for Consistent Winners**
   - Track which models win over time
   - Apply momentum to favor consistently good performers
   - But allow "upset" wins when a usually-slower model has exceptional quality

### Nash Equilibrium Formula Enhancement

Current: `score = quality_weight * quality + speed_weight * speed_factor`

Enhanced (inspired by NAMEx):
```
utility_i = quality_i * speed_factor_i * alignment_bonus_i
nash_score = product(utility_i - disagreement_point) for all i
winner = argmax(nash_score)
```

Where:
- `quality_i` = semantic similarity + coherence + relevance
- `speed_factor_i` = 1 / (1 + latency_penalty)
- `alignment_bonus_i` = based on agreement with other high-quality responses
- `disagreement_point` = minimum acceptable threshold (too slow = 0 utility)

### Turtle Emoji Logic

Models that exceed timeout threshold get `utility = 0` (disagreement point), displayed with 🐢 turtle emoji to indicate they were "too slow" to participate in the Nash bargaining.
