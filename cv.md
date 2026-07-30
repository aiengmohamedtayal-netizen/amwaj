---
name: "Delta AI Design System"
version: "1.0.0"
author: "Mohamed Tayal"
description: "Enterprise-grade design system and Single Source of Truth (SSOT) for Mohamed Tayal's portfolio and derived intelligent systems."
tokens:
  colors:
    background: "hsl(230 25% 5%)"
    foreground: "hsl(210 30% 96%)"
    card: "hsl(230 25% 7%)"
    card_foreground: "hsl(210 30% 96%)"
    popover: "hsl(230 25% 7%)"
    popover_foreground: "hsl(210 30% 96%)"
    primary: "hsl(175 85% 55%)"
    primary_foreground: "hsl(230 25% 5%)"
    primary_glow: "hsl(185 90% 65%)"
    accent_violet: "hsl(265 85% 65%)"
    accent_pink: "hsl(320 80% 65%)"
    secondary: "hsl(230 20% 12%)"
    secondary_foreground: "hsl(210 30% 96%)"
    muted: "hsl(230 20% 12%)"
    muted_foreground: "hsl(215 15% 60%)"
    accent: "hsl(265 85% 65%)"
    accent_foreground: "hsl(210 30% 96%)"
    destructive: "hsl(0 84% 60%)"
    destructive_foreground: "hsl(210 30% 96%)"
    border: "hsl(230 20% 16%)"
    input: "hsl(230 20% 14%)"
    ring: "hsl(175 85% 55%)"
  gradients:
    primary: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent-violet)))"
    aurora: "radial-gradient(ellipse at top, hsl(175 85% 55% / 0.18), transparent 50%), radial-gradient(ellipse at bottom right, hsl(265 85% 65% / 0.15), transparent 50%), radial-gradient(ellipse at bottom left, hsl(320 80% 65% / 0.10), transparent 50%)"
    text: "linear-gradient(135deg, hsl(210 30% 98%) 0%, hsl(175 85% 75%) 50%, hsl(265 85% 80%) 100%)"
  typography:
    font_families:
      display: ["'Geist Sans'", "sans-serif"]
      mono: ["'Geist Mono'", "monospace"]
      sans: ["'Geist Sans'", "sans-serif"]
      serif: ["'Newsreader Variable'", "serif"]
    font_weights:
      normal: 400
      medium: 500
      semibold: 600
      bold: 700
      extrabold: 800
    fluid_typography:
      hero: "clamp(2.5rem, 5vw + 1rem, 5.5rem)"
      h2: "clamp(2rem, 4vw, 3.5rem)"
      h3: "clamp(1.5rem, 3vw, 2.5rem)"
      body: "clamp(0.875rem, 1vw + 0.5rem, 1.05rem)"
  spacing:
    container:
      padding: "1.5rem"
      max_width: "1400px"
    scale:
      px: "1px"
      0.5: "0.125rem"
      1: "0.25rem"
      1.5: "0.375rem"
      2: "0.5rem"
      2.5: "0.625rem"
      3: "0.75rem"
      3.5: "0.875rem"
      4: "1rem"
      5: "1.25rem"
      6: "1.5rem"
      7: "1.75rem"
      8: "2rem"
      9: "2.25rem"
      10: "2.5rem"
      12: "3rem"
      14: "3.5rem"
      16: "4rem"
      20: "5rem"
      24: "6rem"
      28: "7rem"
      32: "8rem"
      36: "9rem"
      40: "10rem"
      44: "11rem"
      48: "12rem"
      52: "13rem"
      56: "14rem"
      60: "15rem"
      64: "16rem"
      72: "18rem"
      80: "20rem"
      96: "24rem"
  breakpoints:
    sm: "640px"
    md: "768px"
    lg: "1024px"
    xl: "1280px"
    "2xl": "1536px"
  border_radii:
    sm: "calc(var(--radius) - 8px)" # 6px
    md: "calc(var(--radius) - 4px)" # 10px
    lg: "var(--radius)" # 14px
    xl: "1.5rem" # 24px
    "2xl": "2rem" # 32px
    full: "9999px"
  opacity:
    "0": "0"
    "5": "0.05"
    "10": "0.1"
    "15": "0.15"
    "20": "0.2"
    "30": "0.3"
    "40": "0.4"
    "50": "0.5"
    "60": "0.6"
    "70": "0.7"
    "80": "0.8"
    "90": "0.9"
    "100": "1"
  shadows:
    card: "0 1px 0 hsl(210 30% 96% / 0.04) inset, 0 20px 60px -20px hsl(230 80% 0% / 0.6)"
    glow_primary: "0 0 15px hsl(var(--primary)/0.3)"
    glow_primary_strong: "0 0 25px hsl(var(--primary)/0.4)"
    glow_accent: "0 0 16px hsl(var(--primary) / 0.15)"
  glass:
    standard:
      background: "linear-gradient(180deg, hsl(230 25% 10% / 0.55), hsl(230 25% 6% / 0.55))"
      blur: "20px"
      saturate: "1.4"
      border: "1px solid hsl(210 30% 96% / 0.08)"
    strong:
      background: "linear-gradient(180deg, hsl(230 25% 12% / 0.7), hsl(230 25% 7% / 0.7))"
      blur: "28px"
      saturate: "1.6"
      border: "1px solid hsl(210 30% 96% / 0.1)"
  motion:
    durations:
      fast: "150ms"
      normal: "300ms"
      slow: "600ms"
      drift: "18s"
      blink: "1.1s"
      pulse: "3s"
    easings:
      spring_bouncy: "cubic-bezier(0.175, 0.885, 0.32, 1.275)"
      spring_smooth: "cubic-bezier(0.22, 1, 0.36, 1)"
      ease_out: "cubic-bezier(0, 0, 0.2, 1)"
      ease_in_out: "cubic-bezier(0.4, 0, 0.2, 1)"
  z_index:
    base: "0"
    glow: "1"
    card_content: "10"
    active_modal: "40"
    navigation: "50"
---

# Delta AI Design System Specification
### Single Source of Truth (SSOT) & Visual Architecture Manual
---

## 1. Overview
The **Delta AI Design System** is an enterprise-grade, machine-readable visual framework constructed specifically for high-performance, AI-driven applications. Originating from the professional portfolio codebase of Mohamed Tayal (AI & Computer Science Specialist), this system bridges the gap between deep machine learning ecosystems and user interfaces. 

This document serves as the permanent, immutable **Single Source of Truth (SSOT)**. Every component, style, page layout, and animation schema documented herein is extracted directly from the physical codebase, normalized to remove visual inconsistencies without altering the brand DNA. All subsequent additions or modifications to this software ecosystem must adhere strictly to these token sets and architectural rules.

---

## 2. Philosophy
Delta AI treats visual engineering as an exact science. Traditional web design depends heavily on arbitrary values; the Delta philosophy relies on mathematically grounded structures, fluid typography clamp equations, GPU-accelerated spatial transforms, and responsive, context-aware interaction states.

### Core Pillars
1. **Performance First**: Zero unnecessary layout shifts (CLS), mandatory GPU acceleration for all translations, and fallback support for systems with reduced motion preferences.
2. **Contextual Intimacy**: Visual components respond directly to user focus and cursor position (e.g., Lerner-smoothed mouse coordinate trackers, magnetic interaction boundaries, dynamic ambient glow fields).
3. **Semantic Hierarchy**: Typography scales and spacing rules are mathematically structured around default grid-units, ensuring absolute consistent density across all resolutions.
4. **Resiliency**: The interface must remain fully functional under extreme settings, including assistive technology readers, dark/light overrides, keyboard-only traversal, and right-to-left layout renders.

---

## 3. Brand DNA
The brand identity conveys a premium, technical aesthetic reflecting advanced artificial intelligence, machine learning research, and full-stack software delivery. It avoids raw black or white colors, using instead deeply saturated slate and dark indigo bases with ultra-thin, low-contrast borders and sharp, glowing highlights.

| Attribute | Visual Vector | Execution |
|---|---|---|
| **Tone** | Academic, precise, premium, developer-focused | Dark UI, clean monospaced subtext, editorial serif narrative blocks. |
| **Glow** | Active AI processes, energy, intelligent highlights | Emerald indicator lights, Teal-green primary glow, violet accent fields. |
| **Depth** | Layered panels, glassmorphism, depth projection | Custom backdrop blur configurations, inset shadows, subtle 3D rotational tilt. |
| **Grid** | Technical blueprints, structural alignment | Low-opacity dot/line overlays, strict horizontal borders, monospaced details. |

---

## 4. Design Principles
To maintain brand fidelity, the following design principles must be applied uniformly to every view:

* **No Faux Layouts**: Interactive components must have explicit focus indicator configurations. Outline rings must never be disabled without a high-visibility alternative state.
* **Invisible AI integration**: AI components or states must be integrated organically. Use standard indicators (e.g., glows, typing sequences, monospaced metadata status logs) rather than separate, high-contrast badges.
* **Proportion over Arbitrary Sizes**: Padding and margin metrics must follow the designated Tailwind base spacing scale. Arbitrary values (e.g., `mt-[17px]`) are strictly forbidden.
* **Transition Accountability**: Every layout transition must utilize either the `spring-smooth` or `spring-bouncy` timing presets. Raw, linear transitions are prohibited.

---

## 5. Visual Language
The visual language mimics a high-performance terminal superimposed on a deep, astronomical space canvas.
* **Substrates**: Heavy reliance on semi-transparent glass paneling (`.glass` and `.glass-strong`) that blends background content with high-contrast text.
* **Highlights**: Color-coded gradients representing system states. Teal denotes primary operations; violet signals creative/architectural elements; pink underlines tertiary details; red outlines destructive actions.
* **Prose**: Body text uses standard sans-serif for optimal readability. Longer text blocks or descriptions use the Newsreader Variable serif typeface (`.text-editorial`) for a polished, editorial feel.

---

## 6. Color System
The color system is defined entirely in the HSL (Hue, Saturation, Lightness) color space, allowing for dynamic opacity manipulation using native Tailwind opacity modifiers (e.g., `bg-primary/20`).

### Palette Variables

```css
:root {
  --background: 230 25% 5%;               /* Deep Dark Navy/Black */
  --foreground: 210 30% 96%;              /* Light Slate White */
  --card: 230 25% 7%;                     /* Slightly Lighter Card Backing */
  --card-foreground: 210 30% 96%;
  --popover: 230 25% 7%;
  --popover-foreground: 210 30% 96%;
  --primary: 175 85% 55%;                 /* Glowing Teal */
  --primary-foreground: 230 25% 5%;
  --primary-glow: 185 90% 65%;            /* Bright Aqua Highlight */
  --accent-violet: 265 85% 65%;           /* Vibrant Violet */
  --accent-pink: 320 80% 65%;             /* Neon Pink */
  --secondary: 230 20% 12%;               /* Dark Navy Secondary Backing */
  --secondary-foreground: 210 30% 96%;
  --muted: 230 20% 12%;
  --muted-foreground: 215 15% 60%;        /* Muted Gray-blue Text */
  --accent: 265 85% 65%;                  /* Default Accent (Violet) */
  --accent-foreground: 210 30% 96%;
  --destructive: 0 84% 60%;               /* Crimson Red */
  --destructive-foreground: 210 30% 96%;
  --border: 230 20% 16%;                  /* Low-contrast Navy Border */
  --input: 230 20% 14%;
  --ring: 175 85% 55%;                    /* Ring Color matching Primary */
}
```

### Gradients

* **Primary Gradient (`--gradient-primary`)**:
  `linear-gradient(135deg, hsl(175 85% 55%), hsl(265 85% 65%))`
  Used for primary action states, call-to-actions, and main status icons.
* **Aurora Glow (`--gradient-aurora`)**:
  `radial-gradient(ellipse at top, hsl(175 85% 55% / 0.18), transparent 50%), radial-gradient(ellipse at bottom right, hsl(265 85% 65% / 0.15), transparent 50%), radial-gradient(ellipse at bottom left, hsl(320 80% 65% / 0.10), transparent 50%)`
  Used exclusively as a viewport background cover to generate spatial depth.
* **Text Gradient (`--gradient-text`)**:
  `linear-gradient(135deg, hsl(210 30% 98%) 0%, hsl(175 85% 75%) 50%, hsl(265 85% 80%) 100%)`
  Applied to major headers and highlight terms via `-webkit-background-clip: text`.

---

## 7. Typography
Delta AI utilizes a strict typography hierarchy, combining modern sans-serif fonts, monospaced elements for terminal indicators, and a classic serif face for descriptive reading.

### Font Families
* **Sans-serif (`font-sans` / `font-display`)**: `'Geist Sans'`, system-ui, -apple-system, sans-serif. Used for headers, navigation, labels, and form fields. Displays use negative letter-spacing (`tracking-[-0.03em]`).
* **Monospace (`font-mono`)**: `'Geist Mono'`, monospace. Used for status indicators, statistics, technology badges, logs, and metadata elements.
* **Serif (`font-serif` / `.text-editorial`)**: `'Newsreader Variable'`, serif. Used for storytelling paragraphs, case study abstracts, and narrative descriptions.

### Fluid Typography Scale
Typography sizes scale dynamically with screen width, minimizing the need for viewport breakpoint utility overrides.

```css
.text-fluid-hero {
  font-size: clamp(2.5rem, 5vw + 1rem, 5.5rem);
  line-height: 1.0;
  letter-spacing: -0.03em;
}

.text-fluid-h2 {
  font-size: clamp(2rem, 4vw, 3.5rem);
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.text-fluid-h3 {
  font-size: clamp(1.5rem, 3vw, 2.5rem);
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.text-fluid-body {
  font-size: clamp(0.875rem, 1vw + 0.5rem, 1.05rem);
  line-height: 1.6;
}
```

---

## 8. Spacing System
The layout spacing system follows a base-4 grid model to ensure absolute visual consistency across all components.

| Token | Rem | Pixels | Intent / Typical Usage |
|---|---|---|---|
| `space-0.5` | `0.125rem` | 2px | Microscopic alignment adjustments |
| `space-1` | `0.25rem` | 4px | Internal chip spacing, status dot offsets |
| `space-1.5` | `0.375rem` | 6px | Inline icons inside small buttons |
| `space-2` | `0.5rem` | 8px | Border to item margins, inner navigation bar layout |
| `space-2.5` | `0.625rem` | 10px | Inner input fields padding |
| `space-3` | `0.75rem` | 12px | Badge lists, menu margins |
| `space-4` | `1.0rem` | 16px | Container padding on mobile views |
| `space-5` | `1.25rem` | 20px | Input fields spacing, small card contents |
| `space-6` | `1.5rem` | 24px | Default layout grid spacing, subheader spacing |
| `space-8` | `2.0rem` | 32px | Section headers gaps, card internal padding |
| `space-10` | `2.5rem` | 40px | Inner spacing for large forms and landing cards |
| `space-12` | `3.0rem` | 48px | Gap between major section items |
| `space-14` | `3.5rem` | 56px | Vertical margin between minor page elements |
| `space-16` | `4.0rem` | 64px | Default gap between small columns |
| `space-20` | `5.0rem` | 80px | Standard case study header offset spacing |
| `space-24` | `6.0rem` | 96px | Large layout elements gap spacing |
| `space-28` | `7.0rem` | 112px | Standard page section padding (`py-28`) |

---

## 9. Grid System
Grids align structural elements along a 12-column layout. When using grids, explicitly define columns for responsive layout changes.

### Column Mapping
* **Mobile (< 768px)**: 1 column. All layouts stack vertically.
* **Tablet (768px - 1024px)**: 2 columns (`md:grid-cols-2`). 
* **Desktop (> 1024px)**: 3 columns (`lg:grid-cols-3`) or split 12-column systems matching asymmetrical requirements (e.g., `lg:grid-cols-[1.15fr_1fr]`).

### Grid Code Structure
```tsx
// Asymmetrical Hero Split Grid Example
<div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-12 items-center">
  <div>Content Left</div>
  <div>Content Right</div>
</div>
```

---

## 10. Layout Rules
Layouts follow strict structural nesting rules to avoid unexpected behavior when rendering responsive views.

```
+--------------------------------------------------------+
| Main App / Page Container (w-full overflow-hidden)     |
|  +--------------------------------------------------+  |
|  | Nav/Header Layer (fixed inset-x-0 z-50)          |  |
|  +--------------------------------------------------+  |
|  | Page Main (relative min-h-screen)                |  |
|  |  +--------------------------------------------+  |  |
|  |  | Section Block (py-28 relative)             |  |  |
|  |  |  +--------------------------------------+  |  |  |
|  |  |  | Center Container (container max-w-5xl)|  |  |  |
|  |  |  |  +--------------------------------+  |  |  |  |
|  |  |  |  | Responsive Grid/Columns        |  |  |  |  |
|  |  |  |  +--------------------------------+  |  |  |  |
|  |  |  +--------------------------------------+  |  |  |
|  |  +--------------------------------------------+  |  |
|  +--------------------------------------------------+  |
+--------------------------------------------------------+
```

1. **Outer Constraints**: Every page template is wrapped in a `<main className="relative min-h-screen pb-32">` container.
2. **Horizontal Bounds**: Section wrapper elements contain an inner `<div className="container">` or `<div className="container max-w-5xl">` to automatically enforce gutter behavior across diverse screen sizes.
3. **Viewport Bounds**: Background decorations (aurora glows, particle fields) use `fixed` position coordinates and a `pointer-events-none` setup to prevent layout interference.

---

## 11. Responsive Rules
Delta AI is built mobile-first. Responsive adjustments must override mobile styles using larger-breakpoint modifiers, not the other way around.

### Screen Breakpoints
```ts
sm: "640px"   // Mobile landscape / Small tablets
md: "768px"   // Standard tablets (iPad portrait)
lg: "1024px"  // Laptops / Medium Desktops
xl: "1280px"  // Standard Desktops
"2xl": "1400px" // Ultra-wide layouts (Max grid constraint container width)
```

### Media Queries & CSS Target
* Use layout helpers (`sm:w-auto`, `w-full`) to expand inline blocks to full width on mobile screens.
* Disable interactive mouse components (like Spline or CursorGlow overlays) on mobile devices using pointer capabilities queries: `@media (pointer: coarse)`.

---

## 12. Elevation
Depth is created by layering low-opacity backdrops over background glows. This mimics high-end developer tools.

### Elevation Levels

```
+-------------------------------------------------------+  Layer 4: Overlays & Modals
|                     [ Modal Box ]                     |  (z-50, backdrop blur, border)
+-------------------------------------------------------+
                           |
+-------------------------------------------------------+  Layer 3: Global Header/Nav
|                    [ Header Nav ]                     |  (z-50 glass background)
+-------------------------------------------------------+
                           |
+-------------------------------------------------------+  Layer 2: Foreground Cards
|                     [ Content ]                       |  (z-10, backdrop blur, shadow)
+-------------------------------------------------------+
                           |
+-------------------------------------------------------+  Layer 1: Background & Glows
|                [ Canvas & Aurora Glows ]              |  (z-[1] / z-[-10], blur filters)
+-------------------------------------------------------+
```

1. **Background Layer (z-[-10])**: The canvas layer containing background grids and blurred decorative lights.
2. **Decoration Layer (z-[1])**: Interaction objects like the `CursorGlow` tracking blob.
3. **Foreground Layer (z-10)**: Content panels, grid cards, text layout columns.
4. **Header Layer (z-50)**: Fixed menus and structural navigation interfaces.
5. **Overlay Layer (z-50 / Portal)**: Modals, dropdown items, tooltips.

---

## 13. Shapes
The shape system matches the premium developer aesthetic, combining wide curves with strict, straight lines.

* **Cards**: Default rounded panels use `rounded-3xl` (`24px`). On viewport widths below 768px, cards can scale down to `rounded-2xl` (`16px`).
* **Input Fields**: Input containers, select elements, and small card units use `rounded-xl` (`12px`) for a cleaner appearance.
* **Status Badges & Buttons**: Interactive button classes (`btn-magnetic`, `btn-ghost-glow`) and section categories use `rounded-full` (`9999px`) to create clear click targets.

---

## 14. Icons Guidelines
All icons are imported from the Lucide React library. To maintain visual balance, follow these icon styling rules:

* **Size Control**: Standard icons inside text, chips, or cards must set `size={16}` or `size={18}`. Avoid values above `24` unless rendering isolated hero illustrations.
* **Stroke Weight**: Icons must maintain a uniform stroke weight (`strokeWidth={2}`). Avoid using bold or custom stroke overrides.
* **Alignment**: Place icons inside wrapper components using flex alignment to ensure proper layout: `inline-flex items-center justify-center`.
* **Subtle Transitions**: Hover animations on links must trigger subtle translation shifts on adjacent icons (e.g., translation arrow shifts `group-hover:translate-x-1`, or arrow rotations `group-hover:rotate-45`).

---

## 15. Animation Library
Animations are run via **Framer Motion** or custom CSS keyframes. They are designed to feel snappy and responsive.

### Keyframe Animations

```css
@keyframes pulse-glow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1.0; }
}

@keyframes blink {
  0%, 100% { opacity: 1.0; }
  50% { opacity: 0.0; }
}

@keyframes drift {
  0% { transform: translate3d(0, 0, 0); }
  33% { transform: translate3d(20px, -15px, 0); }
  66% { transform: translate3d(-15px, 10px, 0); }
  100% { transform: translate3d(0, 0, 0); }
}
```

* **pulse-glow**: Apply using class `animate-pulse-glow`. Used for glowing ambient accents.
* **blink**: Apply using class `animate-blink`. Typically used for terminal-like text cursors.
* **drift**: Apply using class `animate-drift`. Slow floating movement applied to decorative background elements.

---

## 16. Motion Library
Motion profiles use spring presets instead of traditional linear timings to mimic physical objects.

### Motion Presets
* **Bouncy Spring (`spring-bouncy`)**: `cubic-bezier(0.175, 0.885, 0.32, 1.275)`
  Typically used for hover highlights, click states, and badge interactions.
* **Smooth Spring (`spring-smooth`)**: `cubic-bezier(0.22, 1, 0.36, 1)`
  Applied to layout entries, page cards, modal fades, and navigation bar displays.

### Code Sample: Framer Motion Entry Animation
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
>
  Content Container
</motion.div>
```

---

## 17. Accessibility
Delta AI follows Web Content Accessibility Guidelines (WCAG) 2.1 AA standards, ensuring a usable interface for all visitors.

* **Contrast Ratios**: Body text (`--foreground`) maintains a contrast ratio of **14.8:1** against the default background (`--background`), exceeding the required 4.5:1 minimum.
* **Interactive Focus**: Global focus outlines must be configured for all keyboard navigation:
  ```css
  :focus-visible {
    outline: 2px solid hsl(var(--ring));
    outline-offset: 4px;
    border-radius: 4px;
    transition: outline-offset 0.15s ease;
  }
  ```
* **Accessible Inputs**: Form elements must contain matching `<label>` elements with an explicit `htmlFor` connection to their input fields.
* **Motion Guard**: All animation layouts must respect OS-level motion preferences using media queries:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, ::before, ::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```

---

## 18. RTL Rules
To support right-to-left (RTL) reading layouts, UI code must avoid directional CSS utilities.

* **Grid/Flex gaps**: Use `gap-*` utilities instead of directional margins (e.g., use `gap-4` instead of `mr-4` or `pl-4`).
* **Directional Padding/Margins**: Use logical placement classes (e.g., `ps-4`, `pe-6`, `ms-2`, `me-4`) rather than static side properties (`pl-*`, `pr-*`, `ml-*`, `mr-*`).
* **Icon Orientations**: Navigational arrow icons (like `ArrowLeft` or `ArrowRight`) must rotate 180 degrees when rendered in RTL contexts: `rtl:rotate-180`.

---

## 19. Theme Variants
Delta AI is built around a unified theme palette optimized for dark backgrounds.

* **Dark Theme (Default)**: Deep navy backdrops combined with high-contrast glowing text.
* **Contrast Theme**: Available for visitors using screen readers. This theme forces higher-contrast border lines and removes background gradients to maintain maximum visibility.

---

## 20. Dark Mode
The dark mode theme is enforced globally at the root layout container.

* **Selector Method**: The codebase uses the class selector method: `darkMode: ["class"]`.
* **Execution**: Because the brand DNA is designed around a dark aesthetic, default dark elements (backgrounds, border gradients) are applied directly to the body element inside `index.css`. This reduces standard class clutter in page code.

---

## 21. Tailwind Export
Below is the tailwind configuration for Delta AI, enabling developers to easily export theme tokens to external projects:

```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: { center: true, padding: "1.5rem", screens: { "2xl": "1400px" } },
    extend: {
      fontFamily: {
        display: ["'Geist Sans'", "sans-serif"],
        mono: ["'Geist Mono'", "monospace"],
        sans: ["'Geist Sans'", "sans-serif"],
        serif: ["'Newsreader Variable'", "serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
        },
        violet: { DEFAULT: "hsl(var(--accent-violet))" },
        pink: { DEFAULT: "hsl(var(--accent-pink))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "pulse-glow": { "0%, 100%": { opacity: "0.5" }, "50%": { opacity: "1" } },
        blink: { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0" } },
        drift: {
          "0%": { transform: "translate3d(0, 0, 0)" },
          "33%": { transform: "translate3d(20px, -15px, 0)" },
          "66%": { transform: "translate3d(-15px, 10px, 0)" },
          "100%": { transform: "translate3d(0, 0, 0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        blink: "blink 1.1s steps(2) infinite",
        drift: "drift 18s ease-in-out infinite",
      },
      transitionTimingFunction: {
        "spring-bouncy": "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        "spring-smooth": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
```

---

## 22. CSS Variables
The design system's CSS variables are defined directly inside `index.css`. To implement the default dark theme, place these variables under the `:root` scope.

```css
@import '@fontsource-variable/newsreader';
@import '@fontsource/geist-sans/400.css';
@import '@fontsource/geist-sans/500.css';
@import '@fontsource/geist-sans/600.css';
@import '@fontsource/geist-sans/700.css';
@import '@fontsource/geist-sans/800.css';
@import '@fontsource/geist-mono/500.css';

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 230 25% 5%;
    --foreground: 210 30% 96%;
    --card: 230 25% 7%;
    --card-foreground: 210 30% 96%;
    --popover: 230 25% 7%;
    --popover-foreground: 210 30% 96%;
    --primary: 175 85% 55%;
    --primary-foreground: 230 25% 5%;
    --primary-glow: 185 90% 65%;
    --accent-violet: 265 85% 65%;
    --accent-pink: 320 80% 65%;
    --secondary: 230 20% 12%;
    --secondary-foreground: 210 30% 96%;
    --muted: 230 20% 12%;
    --muted-foreground: 215 15% 60%;
    --accent: 265 85% 65%;
    --accent-foreground: 210 30% 96%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 210 30% 96%;
    --border: 230 20% 16%;
    --input: 230 20% 14%;
    --ring: 175 85% 55%;
    --radius: 0.875rem;

    --gradient-primary: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent-violet)));
    --gradient-aurora: radial-gradient(ellipse at top, hsl(175 85% 55% / 0.18), transparent 50%),
                       radial-gradient(ellipse at bottom right, hsl(265 85% 65% / 0.15), transparent 50%),
                       radial-gradient(ellipse at bottom left, hsl(320 80% 65% / 0.10), transparent 50%);
    --gradient-text: linear-gradient(135deg, hsl(210 30% 98%) 0%, hsl(175 85% 75%) 50%, hsl(265 85% 80%) 100%);
    
    --shadow-card: 0 1px 0 hsl(210 30% 96% / 0.04) inset, 0 20px 60px -20px hsl(230 80% 0% / 0.6);
  }
}
```

---

## 23. Component APIs
Below are the API definitions for the primary interactive components, built using TypeScript and React.

### `MagneticButton`
A high-performance wrapper component that tracks mouse coordinates and applies an interactive magnetic translation effect.

* **Location**: [MagneticButton.tsx](file:///d:/PROJECTS/XXX/mohamed-tayal-portfolio/src/components/MagneticButton.tsx)
* **Props**:
  ```typescript
  type MagneticButtonProps = {
    variant?: "primary" | "ghost";
    as?: "button" | "a";
  } & (
    | React.ButtonHTMLAttributes<HTMLButtonElement>
    | React.AnchorHTMLAttributes<HTMLAnchorElement>
  );
  ```
* **Default values**: `variant = "primary"`, `as = "button"`.

### `InteractiveRobotSpline`
A lazy-loaded, performance-optimized container for rendering Spline 3D objects, configured to automatically hide Spline watermark elements.

* **Location**: [interactive-3d-robot.tsx](file:///d:/PROJECTS/XXX/mohamed-tayal-portfolio/src/components/ui/interactive-3d-robot.tsx)
* **Props**:
  ```typescript
  export interface InteractiveRobotSplineProps {
    scene: string;
    className?: string;
  }
  ```

---

## 24. Component Anatomy
To maintain a unified visual hierarchy, components must separate layout containers from interactive elements.

```
MagneticButton Component:
+-------------------------------------------------------------+
| Pointer Event Tracker Wrapper (div)                         |
| Class: "inline-block w-full sm:w-auto transition-transform"  |
| Event: MouseMove -> compute center offsets                   |
|        MouseLeave -> restore standard coordinates           |
|                                                             |
|  +-------------------------------------------------------+  |
|  | Actual Button/Anchor Element                          |  |
|  | Primary: "btn-magnetic" / Secondary: "btn-ghost-glow" |  |
|  +-------------------------------------------------------+  |
|                                                             |
+-------------------------------------------------------------+
```

1. **Outer Boundary**: A wrapper `div` element tracks mouse movement and handles translation offsets. This prevents the button itself from jumping abruptly when hovered.
2. **Action Layer**: The inner element (`<button>` or `<a>`) contains standard action triggers, text, and visual icons.
3. **State Layer**: The component's styling uses Tailwind helpers to declare distinct interactive properties: standard (`btn-magnetic`), hover (`hover:scale-102`), and click (`active:scale-0.98`) states.

---

## 25. Component Composition
Delta AI utilizes a composition model, nesting primitive components to build complex views.

### Card Composition Pattern
Instead of writing large, monolithic components, pages combine structured sub-components to render cards:
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export const ShowcaseCard = () => (
  <Card className="hover:border-primary/20 transition-all">
    <CardHeader>
      <CardTitle>System Monitor</CardTitle>
      <CardDescription>Real-time pipeline logs</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="font-mono text-xs">AI pipeline loaded successfully.</div>
    </CardContent>
  </Card>
);
```

---

## 26. Component Inventory
The design system categorizes components into distinct groups based on their purpose:

### Foundation Components
* **[Card](file:///d:/PROJECTS/XXX/mohamed-tayal-portfolio/src/components/ui/card.tsx)**: Structured panel wrapper. Includes sub-components for header, content, title, and footer layers.
* **[Tooltip](file:///d:/PROJECTS/XXX/mohamed-tayal-portfolio/src/components/ui/tooltip.tsx)**: High-performance tooltip overlays powered by Radix UI primitives.

### Interaction Components
* **[MagneticButton](file:///d:/PROJECTS/XXX/mohamed-tayal-portfolio/src/components/MagneticButton.tsx)**: Glowing buttons with magnetic hover attraction.
* **[CursorGlow](file:///d:/PROJECTS/XXX/mohamed-tayal-portfolio/src/components/CursorGlow.tsx)**: Follows the cursor with an ambient light glow. Auto-disables on touch screens.
* **[InteractiveRobotSpline](file:///d:/PROJECTS/XXX/mohamed-tayal-portfolio/src/components/ui/interactive-3d-robot.tsx)**: Handles 3D asset loaders.

### Section Components
* **[Nav](file:///d:/PROJECTS/XXX/mohamed-tayal-portfolio/src/components/Nav.tsx)**: Floating navigation bar with active section highlighting.
* **[Hero](file:///d:/PROJECTS/XXX/mohamed-tayal-portfolio/src/components/Hero.tsx)**: Entrance section containing title typography and interactive Python code simulation.
* **[Stack](file:///d:/PROJECTS/XXX/mohamed-tayal-portfolio/src/components/Stack.tsx)**: Interactive grid categorizing technology proficiencies.
* **[Experience](file:///d:/PROJECTS/XXX/mohamed-tayal-portfolio/src/components/Experience.tsx)**: Timeline component showing educational milestones and professional experience.
* **[Certificates](file:///d:/PROJECTS/XXX/mohamed-tayal-portfolio/src/components/Certificates.tsx)**: Searchable list of professional certificates.
* **[Contact](file:///d:/PROJECTS/XXX/mohamed-tayal-portfolio/src/components/Contact.tsx)**: Form component with input field animations, WhatsApp integration, and form-submit APIs.

---

## 27. Naming Conventions
Naming conventions must be followed strictly across the codebase:

* **React Components**: Use PascalCase naming (e.g., `MagneticButton.tsx`, `CursorGlow.tsx`).
* **Utility Modules**: Use camelCase naming (e.g., `utils.ts`, `api.ts`).
* **CSS Rules**: Use kebab-case naming for custom CSS classes (e.g., `.btn-magnetic`, `.text-fluid-hero`, `.glass-strong`).
* **Component Exports**: Use named exports (`export const ComponentName`) to ensure clean imports and improve IDE refactoring.

---

## 28. Folder Conventions
Folder structures separate global layouts, page templates, and shared UI primitives.

```
d:\PROJECTS\XXX\mohamed-tayal-portfolio\src\
├── components\
│   ├── ui\            <-- Pure functional components (Card, Tooltip, Sonner)
│   ├── blocks\        <-- Advanced layout blocks
│   └── *.tsx          <-- Page-level sections (Hero, Nav, About, Stack, Contact)
├── data\              <-- Immutable data structures (projects.ts)
├── lib\               <-- Helper utilities and libraries (utils.ts)
├── pages\             <-- Page templates (Index.tsx, ProjectCaseStudy.tsx)
├── test\              <-- Unit tests
├── App.tsx            <-- Global router config
├── index.css          <-- Theme styles and core CSS variables
└── main.tsx           <-- App entry point
```

---

## 29. Page Blueprints
Use these page blueprints to build consistent layouts in new screens:

### Landing Page
```tsx
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Stats } from "@/components/Stats";
import { Projects } from "@/components/Projects";
import { Stack } from "@/components/Stack";
import { Experience } from "@/components/Experience";
import { Contact } from "@/components/Contact";
import { CursorGlow } from "@/components/CursorGlow";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      <CursorGlow />
      <Nav />
      <Hero />
      <Stats />
      <Projects />
      <Stack />
      <Experience />
      <Contact />
    </main>
  );
}
```

### Dashboard
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardBlueprint() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-bold">System Status</h1>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card><CardHeader><CardTitle>AI Operations</CardTitle></CardHeader><CardContent className="font-mono">Online</CardContent></Card>
        <Card><CardHeader><CardTitle>API Latency</CardTitle></CardHeader><CardContent className="font-mono">42ms</CardContent></Card>
        <Card><CardHeader><CardTitle>Deployment</CardTitle></CardHeader><CardContent className="font-mono">v1.2.4</CardContent></Card>
      </div>
    </div>
  );
}
```

### Analytics
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stats } from "@/components/Stats";

export function AnalyticsBlueprint() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-bold">Performance Analytics</h1>
      </header>
      <Stats />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card><CardHeader><CardTitle>Traffic Patterns</CardTitle></CardHeader><CardContent>Pattern charts...</CardContent></Card>
        <Card><CardHeader><CardTitle>Model Latency</CardTitle></CardHeader><CardContent>Latency logs...</CardContent></Card>
      </div>
    </div>
  );
}
```

### CRM
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CRMBlueprint() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-bold">Client Relations</h1>
      </header>
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader><CardTitle>Active Client List</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              <div className="py-3 flex justify-between"><span>Enterprise Client A</span><span className="text-primary-glow font-mono">Active</span></div>
              <div className="py-3 flex justify-between"><span>Startup B</span><span className="text-violet font-mono">Proposal</span></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### Portfolio
```tsx
import { Projects } from "@/components/Projects";
import { Stack } from "@/components/Stack";

export function PortfolioBlueprint() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Projects />
      <Stack />
    </div>
  );
}
```

### Agency
```tsx
import { Services } from "@/components/Services";
import { Contact } from "@/components/Contact";

export function AgencyBlueprint() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Services />
      <Contact />
    </div>
  );
}
```

### SaaS
```tsx
export function SaaSBlueprint() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 flex flex-col justify-center items-center">
      <div className="text-center max-w-lg">
        <h1 className="text-5xl font-display font-bold">Workflows Automated.</h1>
        <p className="text-editorial mt-4">Connect APIs and run AI pipelines automatically.</p>
        <button className="btn-magnetic mt-8">Start Free Trial</button>
      </div>
    </div>
  );
}
```

### E-commerce
```tsx
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function ECommerceBlueprint() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <h1 className="font-display text-4xl font-bold mb-8">Hardware Store</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((id) => (
          <Card key={id} className="flex flex-col h-full">
            <CardHeader><CardTitle>AI Inference Accelerator v{id}</CardTitle></CardHeader>
            <CardContent className="flex-grow"><p className="text-sm text-muted-foreground">High-performance PCI module.</p></CardContent>
            <CardFooter className="justify-between"><span className="font-mono">$299.00</span><button className="btn-ghost-glow h-9 px-4 text-xs">Buy</button></CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### Authentication
```tsx
export function AuthenticationBlueprint() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-strong rounded-3xl p-8 border border-white/10">
        <h1 className="text-3xl font-display font-bold text-center">Deploy System</h1>
        <form className="mt-8 space-y-6">
          <input className="w-full h-12 rounded-xl bg-background/50 border border-border px-4 text-sm" placeholder="Security Token" type="password" required />
          <button className="btn-magnetic w-full">Authenticate Node</button>
        </form>
      </div>
    </div>
  );
}
```

### Settings
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SettingsBlueprint() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 max-w-4xl mx-auto">
      <h1 className="font-display text-4xl font-bold mb-8">System Settings</h1>
      <Card>
        <CardHeader><CardTitle>API Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-mono uppercase text-primary-glow">Server Endpoint</label>
            <input className="w-full mt-1.5 h-12 rounded-xl bg-background/50 border border-border px-4 text-sm font-mono" defaultValue="https://api.delta.ai/v1" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Profile
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ProfileBlueprint() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 max-w-2xl mx-auto">
      <Card className="text-center">
        <CardHeader>
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-violet mx-auto mb-4" />
          <CardTitle>Mohamed Tayal</CardTitle>
          <p className="text-xs font-mono text-muted-foreground">AI Systems Engineer</p>
        </CardHeader>
        <CardContent>
          <p className="text-editorial">Delta University Artificial Intelligence & Computer Science.</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Pricing
```tsx
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function PricingBlueprint() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 max-w-5xl mx-auto">
      <h1 className="font-display text-center text-4xl font-bold mb-12">Scalable Plans</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader><CardTitle>Developer</CardTitle></CardHeader>
          <CardContent><div className="text-4xl font-mono">$0<span className="text-sm font-light">/mo</span></div></CardContent>
          <CardFooter><button className="btn-ghost-glow w-full">Start Free</button></CardFooter>
        </Card>
        <Card className="border-primary/50 bg-primary/[0.02]">
          <CardHeader><CardTitle>Enterprise</CardTitle></CardHeader>
          <CardContent><div className="text-4xl font-mono">$99<span className="text-sm font-light">/mo</span></div></CardContent>
          <CardFooter><button className="btn-magnetic w-full">Launch Stack</button></CardFooter>
        </Card>
      </div>
    </div>
  );
}
```

### Documentation
```tsx
export function DocumentationBlueprint() {
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="w-64 border-r border-border p-6 hidden md:block">
        <nav className="space-y-4">
          <div className="text-xs font-mono uppercase text-muted-foreground">Getting Started</div>
          <a className="block text-sm text-primary-glow font-medium" href="#setup">System Setup</a>
          <a className="block text-sm text-muted-foreground" href="#deployment">Deployment</a>
        </nav>
      </aside>
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <h1 className="font-display text-4xl font-bold">System Setup</h1>
        <p className="text-editorial mt-4">Initialize the environment settings and run the build process.</p>
        <pre className="mt-6 p-4 rounded-xl bg-secondary font-mono text-sm border border-border">npm install && npm run dev</pre>
      </main>
    </div>
  );
}
```

### Blog
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BlogBlueprint() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 max-w-4xl mx-auto">
      <h1 className="font-display text-5xl font-bold mb-12">AI Field Notes</h1>
      <div className="grid gap-8">
        {[1, 2].map((id) => (
          <Card key={id}>
            <CardHeader>
              <div className="text-xs font-mono text-primary-glow">July {id}, 2026</div>
              <CardTitle className="mt-2 text-3xl">Optimizing Transformer Inference</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-editorial">A deep dive into reducing model latency across web environments...</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### Contact
```tsx
import { Contact } from "@/components/Contact";

export function ContactBlueprint() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Contact />
    </div>
  );
}
```

### Admin
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminBlueprint() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <h1 className="font-display text-4xl font-bold mb-8">System Admin</h1>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card><CardHeader><CardTitle>CPU Usage</CardTitle></CardHeader><CardContent className="font-mono">12%</CardContent></Card>
        <Card><CardHeader><CardTitle>RAM Usage</CardTitle></CardHeader><CardContent className="font-mono">4.2GB / 16GB</CardContent></Card>
        <Card><CardHeader><CardTitle>Active Tokens</CardTitle></CardHeader><CardContent className="font-mono">1,402</CardContent></Card>
        <Card><CardHeader><CardTitle>System Load</CardTitle></CardHeader><CardContent className="font-mono">0.05</CardContent></Card>
      </div>
    </div>
  );
}
```

---

## 30. Code Generation Rules
To ensure all generated code complies with our standards, strict code patterns must be enforced:

1. **Explicit Type Declarations**: Implicit type structures are prohibited. Always declare explicit prop types or interface models.
2. **Strict Component Exports**: Export components exclusively using named exports:
   ```typescript
   // Correct
   export const ComponentName = () => { ... }
   
   // Incorrect
   export default function ComponentName() { ... }
   ```
3. **No Direct DOM Style Manipulation**: Modify style rules using Tailwind classes or local CSS variables. Avoid editing the `element.style` property directly, except when managing coordinate tracking inside animation loops.

---

## 31. Agent Workflow
AI agents and developers must follow this workflow when modifying the codebase:

```
                  +-----------------------------------+
                  | 1. Read tokens in DESIGN.md       |
                  +-----------------------------------+
                                    |
                                    v
                  +-----------------------------------+
                  | 2. Audit existing UI components   |
                  +-----------------------------------+
                                    |
                                    v
                  +-----------------------------------+
                  | 3. Draft changes in sandbox       |
                  +-----------------------------------+
                                    |
                                    v
                  +-----------------------------------+
                  | 4. Validate accessibility checks  |
                  +-----------------------------------+
                                    |
                                    v
                  +-----------------------------------+
                  | 5. Review file output             |
                  +-----------------------------------+
```

1. **Token Verification**: Review the token set in `DESIGN.md` before writing styling code.
2. **Component Check**: Verify if a similar component already exists. Reuse existing primitives instead of building redundant components.
3. **Validation**: Test the layout changes across all responsive breakpoints and verify focus outline indicators work correctly.

---

## 32. Decision Tree
Use this decision tree to determine the best approach when styling components:

```
Is the visual design change global or component-specific?
├── Global (applies to all layouts)
│   └── Update index.css variables inside the @layer base block
└── Component-specific
    ├── Is it a structural layout block (e.g., width, columns)?
    │   └── Apply standard Tailwind layout classes (grid, flex)
    └── Is it an interactive component?
        ├── Does it track mouse coords?
        │   └── Wrap the element in a coordinate listener and track translations using translate3d
        └── Does it trigger a status state?
            └── Apply corresponding indicator styles (primary, primary-glow, violet)
```

---

## 33. UI Quality Checklist
Before shipping layout code, verify that all items on this checklist are met:

* **[ ] Accessibility**: Focus outlines are visible, interactive buttons are fully accessible via keyboard (`Tab` key), and all form inputs contain matching `<label>` elements.
* **[ ] Responsive Layout**: Grid layouts shift to a single-column layout on screens smaller than `768px`.
* **[ ] Performance**: Custom calculations are isolated inside React `useMemo` hooks, and animations use `will-change-transform` to enable GPU acceleration.
* **[ ] Motion Preferences**: Hover animations and transitions auto-disable when prefers-reduced-motion is active.
* **[ ] RTL Integration**: Inline side paddings and margins use logical layout classes (e.g., `ps-*`, `pe-*`, `ms-*`, `me-*`) rather than side properties (`pl-*`, `pr-*`).

---

## 34. Testing Rules
* **Visual Parity**: Validate component rendering using lightweight visual test frameworks (e.g., Vitest + Testing Library).
* **Keyboard Navigation**: Verify keyboard navigation logic using simulated tab key event sweeps.
* **Aria Attributes**: Form inputs and buttons must declare appropriate ARIA roles (`aria-expanded`, `aria-controls`, `aria-hidden`) when managing active or hidden states.

---

## 35. Performance Rules
* **GPU Layer Acceleration**: Complex spatial transformations must utilize `translate3d(x, y, z)` instead of shifting layout properties (like `top` or `left`) to prevent CPU-intensive style recalculations.
* **Vite Optimization**: Leverage dynamic imports and lazy loading (`lazy()`) to split code bundles and optimize page loading times.
* **Scroll Listeners**: Ensure scroll listener callbacks are passive (`{ passive: true }`) to prevent input lag on mobile viewports.

---

## 36. AI Rules
For AI agents generating code in this repository:

* **Never invent colors**: Use only the designated colors from the HSL token list.
* **Never invent spacing values**: Stick to the spacing scale defined in Section 8.
* **Reuse components**: Check the existing inventory before creating new components.
* **Respect motion preferences**: Verify that animations auto-disable when prefers-reduced-motion is active.

---

## 37. Anti Patterns
Avoid these common styling patterns in the codebase:

* **[BAD]**: `className="pl-5 ml-4 mt-[17px]"`
  * *Why*: Directional margins break RTL support, and arbitrary spacing values disrupt layout consistency.
* **[BAD]**: `element.style.left = mouseX + 'px'`
  * *Why*: Modifying the position properties directly causes frequent browser page reflows. Use `transform: translate3d()` instead.
* **[BAD]**: `<button className="focus:outline-none">`
  * *Why*: Disabling focus outlines makes the interface inaccessible for keyboard users.

---

## 38. Migration Guide
Follow these steps to migrate older portfolio features to the new token system:

1. **Replace Colors**: Swap custom color classes (e.g., `text-teal-400`) with semantic variants (`text-primary` or `text-primary-glow`).
2. **Logical Directions**: Update side-based properties (like `pl-*` or `pr-*`) to logical layout directives (`ps-*`, `pe-*`).
3. **Typography**: Replace hardcoded heading sizes with fluid font utilities (`.text-fluid-h2`, `.text-fluid-h3`).

---

## 39. Future Components
Plans for upcoming system components:

* **AI Terminal Console**: A mock terminal component that lets users run simple sandboxed commands and view system statuses.
* **Interactive Architecture Map**: An interactive SVG flow diagram mapping system pipelines, featuring tooltips on hover.

---

## 40. Appendix
* **HSL Converter Formula**:
  `HSL(H, S, L) -> Tailwind class: bg-primary/20`
* **Geist Typography Source**: [Vercel Geist Font Family](https://vercel.com/font)
* **Radix UI Primitive Library**: [Radix UI documentation](https://www.radix-ui.com/)
