/**
 * Educational Tools for Prof. Hogsworth the Research Expert
 * 
 * Tools for creating:
 * - Dynamic Views (interactive visual explanations)
 * - Educational content and lessons
 * - Infographics and visual breakdowns
 * - Simplified explanations for any audience
 */

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  execute: (args: any, env: any) => Promise<string>;
}

/**
 * Generate Dynamic View
 * Prof. Hogsworth's signature tool for interactive visual explanations
 */
export const generateDynamicViewTool: Tool = {
  name: 'generate_dynamic_view',
  description: `Prof. Hogsworth creates Dynamic Views - interactive, visual explanations of complex topics. Perfect for teaching, explaining concepts, and making information engaging and memorable.

Use this when users need:
- Visual explanations of complex topics
- Interactive learning experiences
- Step-by-step concept breakdowns
- Animated diagrams and flowcharts
- Educational visualizations`,
  parameters: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description: 'The topic or concept to explain'
      },
      view_type: {
        type: 'string',
        enum: ['flowchart', 'timeline', 'mind-map', 'step-by-step', 'comparison', 'hierarchy', 'process', 'cycle'],
        description: 'Type of dynamic visualization'
      },
      complexity_level: {
        type: 'string',
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        description: 'Target audience complexity level'
      },
      style: {
        type: 'string',
        enum: ['academic', 'playful', 'corporate', 'minimalist', 'colorful', 'technical'],
        description: 'Visual style of the dynamic view'
      },
      include_animations: {
        type: 'boolean',
        description: 'Whether to include animated transitions'
      },
      interactive_elements: {
        type: 'array',
        items: { type: 'string' },
        description: 'Types of interactivity: hover-tooltips, click-expand, drag-explore, quiz-checkpoints'
      }
    },
    required: ['topic', 'view_type']
  },
  execute: async (args: {
    topic: string;
    view_type: string;
    complexity_level?: string;
    style?: string;
    include_animations?: boolean;
    interactive_elements?: string[];
  }, env: any) => {
    const complexity = args.complexity_level || 'intermediate';
    const style = args.style || 'academic';
    const animations = args.include_animations !== false;
    const interactivity = args.interactive_elements || ['hover-tooltips', 'click-expand'];

    // Generate view structure based on type
    const viewStructures: Record<string, string> = {
      'flowchart': `
### 📊 Flowchart Structure for "${args.topic}"

\`\`\`
┌─────────────────┐
│   START POINT   │
│  (Introduction) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   DECISION 1    │──── Yes ────┐
│  (Key Question) │             │
└────────┬────────┘             │
         │ No                   │
         ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│   PROCESS A     │    │   PROCESS B     │
│  (Main Path)    │    │  (Alt Path)     │
└────────┬────────┘    └────────┬────────┘
         │                      │
         └──────────┬───────────┘
                    ▼
         ┌─────────────────┐
         │    OUTCOME      │
         │  (Conclusion)   │
         └─────────────────┘
\`\`\``,
      'timeline': `
### 📅 Timeline Structure for "${args.topic}"

\`\`\`
◄──────────────────────────────────────────────────────►

  ●─────────●─────────●─────────●─────────●─────────●
  │         │         │         │         │         │
Phase 1   Phase 2   Phase 3   Phase 4   Phase 5   Phase 6
Origin    Growth    Peak      Shift     Evolution  Future

  ▼         ▼         ▼         ▼         ▼         ▼
[Details] [Details] [Details] [Details] [Details] [Details]
\`\`\``,
      'mind-map': `
### 🧠 Mind Map Structure for "${args.topic}"

\`\`\`
                    ┌─────────────┐
                    │  SUB-TOPIC  │
                    │      1      │
                    └──────┬──────┘
                           │
    ┌──────────────────────┼──────────────────────┐
    │                      │                      │
┌───┴───┐           ┌──────┴──────┐          ┌───┴───┐
│Detail │           │             │          │Detail │
│  1.1  │           │   CENTRAL   │          │  1.2  │
└───────┘           │    TOPIC    │          └───────┘
                    │             │
                    └──────┬──────┘
                           │
    ┌──────────────────────┼──────────────────────┐
    │                      │                      │
┌───┴───┐           ┌──────┴──────┐          ┌───┴───┐
│Detail │           │  SUB-TOPIC  │          │Detail │
│  2.1  │           │      2      │          │  2.2  │
└───────┘           └─────────────┘          └───────┘
\`\`\``,
      'step-by-step': `
### 📝 Step-by-Step Guide for "${args.topic}"

\`\`\`
╔═══════════════════════════════════════════════════════╗
║  STEP 1: Foundation                                    ║
║  ─────────────────                                     ║
║  • Key concept introduction                            ║
║  • Prerequisites and context                           ║
║  [🎯 Checkpoint: Understanding basics]                 ║
╠═══════════════════════════════════════════════════════╣
║  STEP 2: Core Concepts                                 ║
║  ────────────────────                                  ║
║  • Main principles explained                           ║
║  • Visual examples                                     ║
║  [🎯 Checkpoint: Can explain to others]                ║
╠═══════════════════════════════════════════════════════╣
║  STEP 3: Application                                   ║
║  ───────────────────                                   ║
║  • Real-world examples                                 ║
║  • Practice scenarios                                  ║
║  [🎯 Checkpoint: Can apply knowledge]                  ║
╠═══════════════════════════════════════════════════════╣
║  STEP 4: Mastery                                       ║
║  ───────────────                                       ║
║  • Advanced techniques                                 ║
║  • Edge cases and nuances                              ║
║  [🎯 Checkpoint: Expert level understanding]           ║
╚═══════════════════════════════════════════════════════╝
\`\`\``,
      'comparison': `
### ⚖️ Comparison View for "${args.topic}"

\`\`\`
┌─────────────────────────────────────────────────────────┐
│                    COMPARISON MATRIX                     │
├─────────────┬─────────────────┬─────────────────────────┤
│   Aspect    │    Option A     │       Option B          │
├─────────────┼─────────────────┼─────────────────────────┤
│ Feature 1   │ ✅ Strength     │ ⚠️ Moderate             │
│ Feature 2   │ ⚠️ Moderate     │ ✅ Strength             │
│ Feature 3   │ ✅ Strength     │ ✅ Strength             │
│ Feature 4   │ ❌ Weakness     │ ✅ Strength             │
│ Feature 5   │ ✅ Strength     │ ❌ Weakness             │
├─────────────┼─────────────────┼─────────────────────────┤
│ Best For    │ [Use Case A]    │ [Use Case B]            │
└─────────────┴─────────────────┴─────────────────────────┘
\`\`\``,
      'hierarchy': `
### 🏛️ Hierarchy Structure for "${args.topic}"

\`\`\`
                         ┌───────────────┐
                         │   TOP LEVEL   │
                         │   (Overview)  │
                         └───────┬───────┘
                                 │
            ┌────────────────────┼────────────────────┐
            │                    │                    │
     ┌──────┴──────┐      ┌──────┴──────┐      ┌──────┴──────┐
     │  CATEGORY   │      │  CATEGORY   │      │  CATEGORY   │
     │      A      │      │      B      │      │      C      │
     └──────┬──────┘      └──────┬──────┘      └──────┬──────┘
            │                    │                    │
      ┌─────┼─────┐        ┌─────┼─────┐        ┌─────┼─────┐
      │     │     │        │     │     │        │     │     │
     [A1]  [A2]  [A3]     [B1]  [B2]  [B3]     [C1]  [C2]  [C3]
\`\`\``,
      'process': `
### ⚙️ Process Flow for "${args.topic}"

\`\`\`
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  INPUT  │───►│ PROCESS │───►│ PROCESS │───►│ OUTPUT  │
│         │    │    1    │    │    2    │    │         │
└─────────┘    └────┬────┘    └────┬────┘    └─────────┘
                    │              │
                    ▼              ▼
              ┌─────────┐    ┌─────────┐
              │FEEDBACK │    │ QUALITY │
              │  LOOP   │◄───│  CHECK  │
              └─────────┘    └─────────┘
\`\`\``,
      'cycle': `
### 🔄 Cycle Diagram for "${args.topic}"

\`\`\`
              ┌─────────────┐
              │   PHASE 1   │
              │   (Start)   │
              └──────┬──────┘
                     │
                     ▼
    ┌────────────────────────────────┐
    │                                │
    ▼                                │
┌───────┐                       ┌────┴────┐
│PHASE 4│                       │ PHASE 2 │
│(Reset)│                       │ (Grow)  │
└───┬───┘                       └────┬────┘
    │                                │
    │        ┌─────────────┐         │
    └───────►│   PHASE 3   │◄────────┘
             │   (Peak)    │
             └─────────────┘
\`\`\``
    };

    return `🎓📚 **Prof. Hogsworth's Dynamic View Ready!**

**Topic:** ${args.topic}
**View Type:** ${args.view_type}
**Complexity:** ${complexity}
**Style:** ${style}
**Animations:** ${animations ? 'Enabled' : 'Disabled'}
**Interactive Elements:** ${interactivity.join(', ')}

---

${viewStructures[args.view_type] || viewStructures['flowchart']}

---

### 🎯 Key Learning Points:

**1. Core Concept:**
> [Main idea of ${args.topic} explained simply]

**2. Why It Matters:**
> [Real-world relevance and applications]

**3. Common Misconceptions:**
> [What people often get wrong about this topic]

**4. Deep Dive Areas:**
> [Advanced aspects for further exploration]

---

### 🧪 Interactive Elements:

${interactivity.includes('hover-tooltips') ? '**🔍 Hover Tooltips:** Hover over any element for detailed explanations\n' : ''}
${interactivity.includes('click-expand') ? '**👆 Click to Expand:** Click sections to reveal deeper content\n' : ''}
${interactivity.includes('drag-explore') ? '**✋ Drag to Explore:** Drag the view to explore different areas\n' : ''}
${interactivity.includes('quiz-checkpoints') ? '**❓ Quiz Checkpoints:** Test your understanding at key points\n' : ''}

---

### 📖 Prof. Hogsworth's Teaching Notes:

*"Ah, ${args.topic} - a fascinating subject indeed! Let me break this down for you in a way that makes the complex beautifully simple. Remember, true understanding comes not from memorization, but from seeing the connections between ideas."* 🐷🎓

---

**Want me to:**
- Generate an interactive HTML version of this view?
- Create a quiz to test understanding?
- Dive deeper into any specific section?
- Simplify this for a different audience level?

*Prof. Hogsworth is always happy to teach!* 📚✨`;
  }
};

/**
 * Create Educational Lesson
 * Structured learning content with objectives, activities, and assessments
 */
export const createEducationalLessonTool: Tool = {
  name: 'create_educational_lesson',
  description: 'Prof. Hogsworth creates structured educational lessons with learning objectives, activities, examples, and assessments. Perfect for teaching any topic.',
  parameters: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description: 'The topic to teach'
      },
      duration: {
        type: 'string',
        enum: ['5-min', '15-min', '30-min', '1-hour', 'full-course'],
        description: 'Lesson duration'
      },
      audience: {
        type: 'string',
        enum: ['children', 'teens', 'adults', 'professionals', 'seniors'],
        description: 'Target audience'
      },
      learning_style: {
        type: 'string',
        enum: ['visual', 'auditory', 'reading', 'kinesthetic', 'mixed'],
        description: 'Primary learning style to target'
      },
      include_quiz: {
        type: 'boolean',
        description: 'Include assessment quiz at the end'
      }
    },
    required: ['topic', 'duration']
  },
  execute: async (args: {
    topic: string;
    duration: string;
    audience?: string;
    learning_style?: string;
    include_quiz?: boolean;
  }, env: any) => {
    const audience = args.audience || 'adults';
    const style = args.learning_style || 'mixed';
    const includeQuiz = args.include_quiz !== false;

    const durationMinutes: Record<string, number> = {
      '5-min': 5,
      '15-min': 15,
      '30-min': 30,
      '1-hour': 60,
      'full-course': 180
    };
    const minutes = durationMinutes[args.duration] || 15;

    return `🎓📖 **Prof. Hogsworth's Educational Lesson**

# ${args.topic}
### A ${args.duration} Lesson for ${audience}

---

## 📋 Lesson Overview

| Attribute | Value |
|-----------|-------|
| **Duration** | ${minutes} minutes |
| **Audience** | ${audience} |
| **Learning Style** | ${style} |
| **Difficulty** | Progressive (Easy → Advanced) |

---

## 🎯 Learning Objectives

By the end of this lesson, you will be able to:

1. **Understand** the fundamental concepts of ${args.topic}
2. **Explain** how ${args.topic} works in simple terms
3. **Apply** this knowledge to real-world scenarios
4. **Analyze** different aspects and make informed decisions
5. **Create** your own examples and applications

---

## 📚 Lesson Structure

### Part 1: Introduction (${Math.round(minutes * 0.15)} min)
**🎬 Hook:** Start with an engaging question or surprising fact about ${args.topic}

> "Did you know that [interesting fact about ${args.topic}]?"

**📍 Context:** Why does ${args.topic} matter?
- Real-world relevance
- How it affects daily life
- Why you should care

---

### Part 2: Core Concepts (${Math.round(minutes * 0.4)} min)

**Concept 1: The Basics**
- Definition and key terms
- Simple analogy: [${args.topic} is like...]
${style === 'visual' || style === 'mixed' ? '- 📊 Visual diagram included' : ''}

**Concept 2: How It Works**
- Step-by-step breakdown
- Cause and effect relationships
${style === 'kinesthetic' || style === 'mixed' ? '- 🖐️ Hands-on activity: Try this yourself...' : ''}

**Concept 3: Key Principles**
- The rules that govern ${args.topic}
- Exceptions and edge cases
${style === 'auditory' || style === 'mixed' ? '- 🎧 Listen to this explanation...' : ''}

---

### Part 3: Examples & Applications (${Math.round(minutes * 0.25)} min)

**Example 1: Simple Case**
> [Basic example that illustrates the concept]

**Example 2: Real-World Application**
> [How this applies in everyday life]

**Example 3: Advanced Scenario**
> [Complex example for deeper understanding]

---

### Part 4: Practice & Review (${Math.round(minutes * 0.2)} min)

**🧠 Quick Recall:**
- What are the 3 main points about ${args.topic}?
- How would you explain this to a friend?

**💪 Apply It:**
- Think of one way you could use this knowledge today
- Identify one question you still have

${includeQuiz ? `
---

## ❓ Assessment Quiz

**Question 1:** What is the main purpose of ${args.topic}?
- A) [Option A]
- B) [Option B]
- C) [Option C]
- D) [Option D]

**Question 2:** Which of the following best describes [key concept]?
- A) [Option A]
- B) [Option B]
- C) [Option C]

**Question 3:** True or False: [Statement about ${args.topic}]

**Question 4:** In your own words, explain why ${args.topic} is important.
[Open-ended response]

**Question 5:** Apply your knowledge: [Scenario-based question]
` : ''}

---

## 📚 Additional Resources

- **Further Reading:** [Recommended books/articles]
- **Videos:** [Educational videos on the topic]
- **Practice:** [Exercises and activities]
- **Community:** [Forums and discussion groups]

---

## 🎓 Prof. Hogsworth's Final Thoughts

*"Remember, learning is a journey, not a destination. Take your time with ${args.topic}, revisit the concepts, and don't be afraid to ask questions. The best students are those who remain curious!"* 🐷📚

---

**Want me to:**
- Create a Dynamic View visualization for this lesson?
- Generate a printable study guide?
- Design interactive exercises?
- Adapt this for a different audience?

*Prof. Hogsworth is here to help you learn!* ✨`;
  }
};

/**
 * Generate Infographic
 * Visual data storytelling and concept breakdowns
 */
export const generateInfographicTool: Tool = {
  name: 'generate_infographic',
  description: 'Prof. Hogsworth creates infographics - visual representations of data, concepts, and information. Perfect for making complex information digestible and shareable.',
  parameters: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description: 'The topic for the infographic'
      },
      infographic_type: {
        type: 'string',
        enum: ['data-visualization', 'how-it-works', 'comparison', 'timeline', 'list', 'process', 'statistics'],
        description: 'Type of infographic'
      },
      data_points: {
        type: 'array',
        items: { type: 'string' },
        description: 'Key data points or facts to include'
      },
      color_scheme: {
        type: 'string',
        enum: ['professional', 'vibrant', 'pastel', 'dark', 'monochrome', 'brand-colors'],
        description: 'Color scheme for the infographic'
      },
      size: {
        type: 'string',
        enum: ['social-media', 'presentation', 'poster', 'web-banner'],
        description: 'Output size/format'
      }
    },
    required: ['topic', 'infographic_type']
  },
  execute: async (args: {
    topic: string;
    infographic_type: string;
    data_points?: string[];
    color_scheme?: string;
    size?: string;
  }, env: any) => {
    const colorScheme = args.color_scheme || 'professional';
    const size = args.size || 'social-media';
    const dataPoints = args.data_points || ['Key fact 1', 'Key fact 2', 'Key fact 3'];

    const sizeSpecs: Record<string, string> = {
      'social-media': '1080x1920px (Instagram Story) or 1200x630px (Facebook)',
      'presentation': '1920x1080px (16:9 HD)',
      'poster': '2480x3508px (A4 Print)',
      'web-banner': '1200x400px (Header)'
    };

    return `🎓📊 **Prof. Hogsworth's Infographic Blueprint**

# ${args.topic}
### ${args.infographic_type.replace('-', ' ').toUpperCase()} Infographic

---

## 📐 Design Specifications

| Attribute | Value |
|-----------|-------|
| **Type** | ${args.infographic_type} |
| **Size** | ${size} (${sizeSpecs[size]}) |
| **Color Scheme** | ${colorScheme} |
| **Data Points** | ${dataPoints.length} key facts |

---

## 🎨 Infographic Structure

\`\`\`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   📌 HEADER: ${args.topic.toUpperCase().substring(0, 30)}...
║   ═══════════════════════════════════════                ║
║                                                          ║
║   ┌────────────────────────────────────────────────┐     ║
║   │                                                │     ║
║   │   🔢 KEY STATISTIC / MAIN VISUAL              │     ║
║   │      [Eye-catching number or image]           │     ║
║   │                                                │     ║
║   └────────────────────────────────────────────────┘     ║
║                                                          ║
║   ┌──────────┐  ┌──────────┐  ┌──────────┐              ║
║   │  FACT 1  │  │  FACT 2  │  │  FACT 3  │              ║
║   │    📊    │  │    📈    │  │    📉    │              ║
║   │  [Data]  │  │  [Data]  │  │  [Data]  │              ║
║   └──────────┘  └──────────┘  └──────────┘              ║
║                                                          ║
║   ┌────────────────────────────────────────────────┐     ║
║   │                                                │     ║
║   │   📝 SUPPORTING CONTENT                       │     ║
║   │   • Point 1                                   │     ║
║   │   • Point 2                                   │     ║
║   │   • Point 3                                   │     ║
║   │                                                │     ║
║   └────────────────────────────────────────────────┘     ║
║                                                          ║
║   ┌────────────────────────────────────────────────┐     ║
║   │  🎯 CALL TO ACTION / CONCLUSION               │     ║
║   └────────────────────────────────────────────────┘     ║
║                                                          ║
║   📎 Source: [Citation] | 🐷 Created by Prof. Hogsworth  ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
\`\`\`

---

## 📊 Data Points to Include

${dataPoints.map((point, i) => `**${i + 1}.** ${point}`).join('\n')}

---

## 🎨 Visual Elements

**Icons to Use:**
- 📊 Charts and graphs
- 🔢 Numbers and statistics
- 🖼️ Relevant imagery
- ➡️ Flow arrows
- ✅ Checkmarks for lists

**Typography:**
- **Header:** Bold, large (48-72pt)
- **Subheaders:** Semi-bold (24-36pt)
- **Body:** Regular (14-18pt)
- **Data Points:** Bold numbers (36-48pt)

**Color Palette (${colorScheme}):**
${colorScheme === 'professional' ? '- Primary: #2C3E50 (Dark Blue)\n- Secondary: #3498DB (Blue)\n- Accent: #E74C3C (Red)\n- Background: #ECF0F1 (Light Gray)' : ''}
${colorScheme === 'vibrant' ? '- Primary: #FF6B6B (Coral)\n- Secondary: #4ECDC4 (Teal)\n- Accent: #FFE66D (Yellow)\n- Background: #FFFFFF (White)' : ''}
${colorScheme === 'pastel' ? '- Primary: #A8D8EA (Light Blue)\n- Secondary: #AA96DA (Lavender)\n- Accent: #FCBAD3 (Pink)\n- Background: #FFFFD2 (Cream)' : ''}
${colorScheme === 'dark' ? '- Primary: #1A1A2E (Dark Navy)\n- Secondary: #16213E (Navy)\n- Accent: #E94560 (Pink)\n- Background: #0F0F1A (Black)' : ''}

---

## 🎓 Prof. Hogsworth's Design Tips

*"A great infographic tells a story at a glance. Remember: less is more! Focus on the most impactful data points and let the visuals do the heavy lifting."* 🐷📊

**Best Practices:**
1. One main message per infographic
2. Use visual hierarchy to guide the eye
3. Include source citations for credibility
4. Make it shareable with a clear takeaway

---

**Want me to:**
- Generate the actual infographic image?
- Create an interactive web version?
- Design variations for different platforms?
- Add more data points or sections?

*Prof. Hogsworth makes data beautiful!* ✨`;
  }
};

/**
 * Explain Like I'm Five
 * Simplify complex topics for any audience
 */
export const explainSimplyTool: Tool = {
  name: 'explain_simply',
  description: 'Prof. Hogsworth explains complex topics in simple terms. Can adjust explanation level from "5-year-old" to "PhD candidate". Perfect for making any topic accessible.',
  parameters: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description: 'The complex topic to explain'
      },
      target_level: {
        type: 'string',
        enum: ['5-year-old', 'middle-schooler', 'high-schooler', 'college-student', 'professional', 'expert'],
        description: 'Target comprehension level'
      },
      use_analogies: {
        type: 'boolean',
        description: 'Include relatable analogies'
      },
      include_examples: {
        type: 'boolean',
        description: 'Include practical examples'
      }
    },
    required: ['topic', 'target_level']
  },
  execute: async (args: {
    topic: string;
    target_level: string;
    use_analogies?: boolean;
    include_examples?: boolean;
  }, env: any) => {
    const useAnalogies = args.use_analogies !== false;
    const includeExamples = args.include_examples !== false;

    const levelDescriptions: Record<string, string> = {
      '5-year-old': 'using very simple words, fun comparisons, and things a child would understand',
      'middle-schooler': 'using clear language, relatable examples, and avoiding jargon',
      'high-schooler': 'with some technical terms explained, real-world applications, and logical structure',
      'college-student': 'with proper terminology, theoretical foundations, and academic context',
      'professional': 'with industry context, practical applications, and business implications',
      'expert': 'with technical depth, nuances, edge cases, and advanced considerations'
    };

    const analogyExamples: Record<string, string> = {
      '5-year-old': 'Think of it like building with LEGO blocks...',
      'middle-schooler': 'Imagine your favorite video game...',
      'high-schooler': 'It\'s similar to how social media algorithms work...',
      'college-student': 'Consider the economic principle of supply and demand...',
      'professional': 'Like optimizing a business process...',
      'expert': 'Analogous to the observer pattern in software architecture...'
    };

    return `🎓🧒 **Prof. Hogsworth's Simple Explanation**

# ${args.topic}
### Explained for a ${args.target_level}

---

## 📖 The Simple Version

*Explaining ${levelDescriptions[args.target_level]}*

---

### 🎯 What is ${args.topic}?

**In one sentence:**
> [Simple, clear definition appropriate for ${args.target_level}]

**The key idea:**
${args.target_level === '5-year-old' ? 
`Imagine you have a toy box 🧸. ${args.topic} is like... [fun, simple comparison]` :
args.target_level === 'middle-schooler' ?
`You know how in your favorite game... ${args.topic} works kind of like that!` :
`${args.topic} is fundamentally about... [clear explanation]`}

${useAnalogies ? `
---

### 🎭 Helpful Analogy

${analogyExamples[args.target_level]}

**How the analogy works:**
- Part A of the analogy = Part A of ${args.topic}
- Part B of the analogy = Part B of ${args.topic}
- The relationship between them = How ${args.topic} actually functions
` : ''}

---

### 🔑 Key Points to Remember

${args.target_level === '5-year-old' ? `
1. 🌟 **First thing:** [Super simple point]
2. 🌟 **Second thing:** [Another easy concept]
3. 🌟 **Third thing:** [One more fun fact]
` : args.target_level === 'middle-schooler' ? `
1. **The Basics:** [Foundation concept]
2. **Why It Matters:** [Relevance to their life]
3. **Cool Fact:** [Interesting tidbit]
` : `
1. **Core Concept:** [Fundamental principle]
2. **Mechanism:** [How it works]
3. **Application:** [Real-world use]
4. **Significance:** [Why it matters]
`}

${includeExamples ? `
---

### 💡 Real Examples

**Example 1: Everyday Life**
> [Relatable example from daily experience]

**Example 2: ${args.target_level === '5-year-old' ? 'Fun Scenario' : 'Practical Application'}**
> [${args.target_level === '5-year-old' ? 'Playful example' : 'Useful real-world case'}]

**Example 3: ${args.target_level === '5-year-old' ? 'Story Time' : 'Case Study'}**
> [${args.target_level === '5-year-old' ? 'Mini story illustrating the concept' : 'Detailed example with context'}]
` : ''}

---

### ❓ Common Questions

**Q: Why should I care about ${args.topic}?**
A: ${args.target_level === '5-year-old' ? 
'Because it helps us understand how cool things work!' :
'Because it affects [relevant aspect of their life]...'}

**Q: Is ${args.topic} hard to understand?**
A: Not at all! Once you see it this way, it makes perfect sense.

**Q: What's the most important thing to remember?**
A: [Single most crucial takeaway]

---

### 🎓 Prof. Hogsworth Says:

*"${args.target_level === '5-year-old' ? 
'Learning is like eating ice cream - take small bites and enjoy every bit! 🍦' :
args.target_level === 'middle-schooler' ?
'The best learners are those who ask "why?" Keep being curious!' :
'True mastery comes from being able to explain complex ideas simply. You\'re on the right path!'}"* 🐷📚

---

**Want me to:**
- Explain at a different level?
- Add more examples?
- Create a visual explanation?
- Go deeper into any specific part?

*Prof. Hogsworth makes learning accessible for everyone!* ✨`;
  }
};

// Export all educational tools
export const educationalTools = [
  generateDynamicViewTool,
  createEducationalLessonTool,
  generateInfographicTool,
  explainSimplyTool
];

/**
 * Register educational tools with the ToolRegistry
 */
export function registerEducationalTools(registry: any) {
  educationalTools.forEach(tool => {
    registry.tools.set(tool.name, tool);
  });
}
