# 🎨 Morgus Brand & UI Guidelines

**Date:** December 28, 2025  
**Version:** 2.7.0  
**Purpose:** Brand identity and UI design system for Morgus

---

## 🌈 Brand Identity

### Core Concept

**Morgus** uses a **neon cyberpunk aesthetic** with vibrant, glowing colors that convey:
- **Energy** - Active, dynamic, autonomous
- **Intelligence** - Futuristic, advanced AI
- **Creativity** - Colorful, expressive, unique
- **Power** - Bright, attention-grabbing, confident

Think: **"Cyberpunk meets productivity"** or **"Neon-lit AI workspace"**

---

## 🎨 Color Palette

### Primary Colors (Neon Gradients)

**Logo Gradient:**
```css
background: linear-gradient(135deg, #ff0080 0%, #ff8800 50%, #ffff00 100%);
/* Pink → Orange → Yellow */
```

**Logo Icon Gradient:**
```css
background: linear-gradient(135deg, #00ff00 0%, #00ffff 100%);
/* Green → Cyan */
```

### Neon Accent Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **Neon Pink** | `#ff0080` | Primary brand color, CTAs |
| **Neon Orange** | `#ff8800` | Accents, highlights |
| **Neon Yellow** | `#ffff00` | Warnings, highlights |
| **Neon Green** | `#00ff00` | Success, active status |
| **Neon Cyan** | `#00ffff` | Info, links |
| **Neon Magenta** | `#ff00ff` | Borders, glows |

### Background Gradient

**Main App Background:**
```css
background: linear-gradient(135deg, 
  #e0f7ff 0%,    /* Light cyan */
  #d0fff0 15%,   /* Light mint */
  #e8ffcc 30%,   /* Light lime */
  #fffacd 50%,   /* Light yellow */
  #ffe4f0 70%,   /* Light pink */
  #f0e0ff 85%,   /* Light purple */
  #e0f0ff 100%   /* Light blue */
);
background-size: 400% 400%;
animation: gradientShift 12s ease infinite;
```

**Effect:** Slowly shifting pastel rainbow background

### Glow Overlays

**Neon Glow Effect:**
```css
background: 
  radial-gradient(ellipse at 20% 20%, rgba(0, 255, 255, 0.15) 0%, transparent 50%),
  radial-gradient(ellipse at 80% 80%, rgba(255, 0, 255, 0.12) 0%, transparent 50%),
  radial-gradient(ellipse at 50% 50%, rgba(0, 255, 128, 0.08) 0%, transparent 60%);
```

**Effect:** Subtle neon glows scattered across the interface

---

## 🎭 Visual Effects

### Glow Animation

**Logo Icon Glow:**
```css
box-shadow: 0 6px 20px rgba(0, 255, 0, 0.5), 0 0 40px rgba(0, 255, 255, 0.3);
animation: glow 2s ease-in-out infinite;

@keyframes glow {
  0%, 100% { 
    box-shadow: 0 6px 20px rgba(0, 255, 0, 0.5), 0 0 40px rgba(0, 255, 255, 0.3); 
  }
  50% { 
    box-shadow: 0 8px 30px rgba(0, 255, 0, 0.8), 0 0 60px rgba(0, 255, 255, 0.5); 
  }
}
```

### Pulse Animation

**Status Indicator:**
```css
animation: pulse 1.5s ease-in-out infinite;

@keyframes pulse {
  0%, 100% { 
    opacity: 1; 
    transform: scale(1);
    box-shadow: 0 0 15px rgba(0, 255, 0, 0.8);
  }
  50% { 
    opacity: 0.7; 
    transform: scale(1.2);
    box-shadow: 0 0 25px rgba(0, 255, 0, 1);
  }
}
```

### Gradient Shift

**Background Animation:**
```css
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

---

## 🖼️ UI Components

### Sidebar

**Style:**
```css
background: rgba(255, 255, 255, 0.98);
backdrop-filter: blur(30px) saturate(180%);
border-right: 3px solid rgba(255, 0, 255, 0.3);
box-shadow: 8px 0 32px rgba(255, 0, 255, 0.2);
```

**Effect:** Frosted glass with neon magenta border

### Buttons

**Primary Button (CTA):**
```css
background: linear-gradient(135deg, #ff0080 0%, #ff8800 50%, #ffff00 100%);
color: white;
border: 2px solid rgba(255, 255, 255, 0.3);
border-radius: 12px;
box-shadow: 0 6px 20px rgba(255, 0, 128, 0.4);
```

**Hover Effect:**
```css
transform: translateY(-2px);
box-shadow: 0 8px 30px rgba(255, 0, 128, 0.6);
```

### Cards

**Style:**
```css
background: rgba(255, 255, 255, 0.95);
backdrop-filter: blur(20px);
border: 2px solid rgba(255, 136, 0, 0.2);
border-radius: 16px;
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
```

### Text

**Logo Text:**
```css
font-size: 26px;
font-weight: 800;
background: linear-gradient(135deg, #ff0080 0%, #ff8800 50%, #ffff00 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
text-shadow: 0 0 20px rgba(255, 0, 128, 0.3);
```

**Status Text:**
```css
color: #00ff00;
font-weight: 600;
text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
```

---

## 📐 Layout

### Spacing

- **Small:** 8px
- **Medium:** 16px
- **Large:** 24px
- **XLarge:** 32px

### Border Radius

- **Small:** 8px
- **Medium:** 12px
- **Large:** 16px
- **XLarge:** 24px

### Shadows

**Subtle:**
```css
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
```

**Medium:**
```css
box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
```

**Strong:**
```css
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
```

**Neon Glow:**
```css
box-shadow: 0 0 20px rgba(255, 0, 255, 0.5);
```

---

## 🎯 Design Principles

### 1. Vibrant but Readable

- Use neon colors for **accents** and **highlights**
- Use **white/light backgrounds** for content areas
- Ensure **high contrast** for text readability

### 2. Glassmorphism

- Use **frosted glass** effects (`backdrop-filter: blur()`)
- **Semi-transparent** backgrounds (`rgba()`)
- **Layered depth** with shadows

### 3. Animated Glows

- **Subtle animations** (2-3 seconds)
- **Pulsing glows** for active elements
- **Gradient shifts** for backgrounds

### 4. Neon Borders

- **2-3px borders** with neon colors
- **Semi-transparent** (`rgba()`)
- **Glowing shadows** to enhance effect

### 5. Smooth Transitions

- **0.3s ease** for most interactions
- **Transform** for hover effects
- **Opacity** for fade effects

---

## 🖥️ Typography

### Font Family

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
  'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
  sans-serif;
```

**System fonts** for performance and native feel

### Font Sizes

| Element | Size | Weight |
|---------|------|--------|
| **Logo** | 26px | 800 |
| **H1** | 32px | 700 |
| **H2** | 24px | 600 |
| **H3** | 20px | 600 |
| **Body** | 15px | 400 |
| **Small** | 13px | 400 |

### Font Weights

- **Regular:** 400
- **Medium:** 500
- **Semibold:** 600
- **Bold:** 700
- **Extra Bold:** 800

---

## 🎨 Usage Examples

### Logo

```html
<div class="logo">
  <div class="logo-icon">🤖</div>
  <h1 class="logo-text">Morgus</h1>
</div>
```

**Renders:** Glowing green-cyan gradient icon with pink-orange-yellow gradient text

### Status Indicator

```html
<div class="status">
  <div class="status-dot"></div>
  <span>Online</span>
</div>
```

**Renders:** Pulsing green dot with glowing text

### Primary Button

```html
<button class="primary-btn">
  Start Building
</button>
```

**Renders:** Pink-orange-yellow gradient button with glow

### Card

```html
<div class="card">
  <h3>Autonomous Agent</h3>
  <p>Execute complex tasks end-to-end</p>
</div>
```

**Renders:** Frosted glass card with subtle orange border

---

## 🌟 Brand Voice

### Tone

- **Confident** - "Morgus executes complex tasks autonomously"
- **Energetic** - "Get started in seconds"
- **Technical** - "50 tools, DPPM planning, smart error recovery"
- **Friendly** - "Build your first Morgy"

### Language

- **Action-oriented** - "Execute", "Build", "Deploy", "Create"
- **Powerful** - "Autonomous", "Intelligent", "Advanced"
- **Clear** - Avoid jargon, explain concepts
- **Professional** - No swearing or unprofessional language

---

## 🚀 Implementation

### CSS Variables (Recommended)

```css
:root {
  /* Primary Neon Colors */
  --neon-pink: #ff0080;
  --neon-orange: #ff8800;
  --neon-yellow: #ffff00;
  --neon-green: #00ff00;
  --neon-cyan: #00ffff;
  --neon-magenta: #ff00ff;
  
  /* Gradients */
  --gradient-logo: linear-gradient(135deg, #ff0080 0%, #ff8800 50%, #ffff00 100%);
  --gradient-icon: linear-gradient(135deg, #00ff00 0%, #00ffff 100%);
  
  /* Effects */
  --glow-pink: 0 0 20px rgba(255, 0, 128, 0.5);
  --glow-green: 0 0 20px rgba(0, 255, 0, 0.5);
  --glow-cyan: 0 0 20px rgba(0, 255, 255, 0.5);
  
  /* Spacing */
  --space-xs: 8px;
  --space-sm: 12px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  
  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
}
```

### TailwindCSS Config (Recommended)

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        neon: {
          pink: '#ff0080',
          orange: '#ff8800',
          yellow: '#ffff00',
          green: '#00ff00',
          cyan: '#00ffff',
          magenta: '#ff00ff',
        }
      },
      boxShadow: {
        'glow-pink': '0 0 20px rgba(255, 0, 128, 0.5)',
        'glow-green': '0 0 20px rgba(0, 255, 0, 0.5)',
        'glow-cyan': '0 0 20px rgba(0, 255, 255, 0.5)',
      }
    }
  }
}
```

---

## 📱 Responsive Design

### Breakpoints

- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

### Mobile Adjustments

- **Sidebar:** Collapses to hamburger menu
- **Font sizes:** Reduce by 10-15%
- **Spacing:** Reduce by 20-30%
- **Glow effects:** Reduce intensity by 50%

---

## ♿ Accessibility

### Contrast

- **Text on light:** Minimum 4.5:1 contrast ratio
- **Text on neon:** Use white or very light colors
- **Focus indicators:** Visible 2px outline

### Motion

- **Respect prefers-reduced-motion:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 🎉 Summary

**Morgus Brand Identity:**

- **Visual Style:** Neon cyberpunk with glassmorphism
- **Colors:** Vibrant neon accents on pastel backgrounds
- **Effects:** Glowing, pulsing, gradient-shifting
- **Tone:** Confident, energetic, technical, friendly
- **Goal:** Convey power, intelligence, and creativity

**Key Elements:**
- 🌈 Rainbow gradient backgrounds
- ✨ Neon glowing accents
- 🔮 Frosted glass components
- 💫 Smooth animations
- 🎯 High contrast for readability

---

**Created:** December 28, 2025  
**Status:** ✅ Complete  
**Location:** /home/ubuntu/morgus-agent/BRAND_AND_UI_GUIDELINES.md
