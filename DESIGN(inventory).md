---
design_tokens:
  colors:
    primary: "#0F4C81"
    primary_foreground: "#FFFFFF"
    secondary: "#F1F5F9"
    secondary_foreground: "#4A5568"
    accent: "#EFF6FF"
    accent_foreground: "#0F4C81"
    gold: "#D4AF37"
    background: "#F8FAFC"
    foreground: "#1E293B"
    card: "#FFFFFF"
    card_foreground: "#1E293B"
    muted: "#F1F5F9"
    muted_foreground: "#64748B"
    border: "#E2E8F0"
    input: "#E2E8F0"
    ring: "#0F4C81"
    glass_bg: "rgba(255, 255, 255, 0.72)"
    glass_border: "rgba(15, 76, 129, 0.08)"
  typography:
    fonts:
      sans: "var(--font-inter), system-ui, sans-serif"
      display: "var(--font-lora), Georgia, serif"
      rtl: "var(--font-thmanyah)"
    scales:
      display: "clamp(3rem, 5vw + 1rem, 4.5rem)"
      hero_h1: "clamp(2.5rem, 4vw + 1rem, 3.75rem)"
      h1: "clamp(2.25rem, 3vw + 1rem, 3rem)"
      h2: "clamp(1.75rem, 2vw + 1rem, 2.25rem)"
      h3: "clamp(1.5rem, 1.5vw + 1rem, 1.875rem)"
      h4: "clamp(1.25rem, 1vw + 1rem, 1.5rem)"
      body: "clamp(1rem, 0.5vw + 0.875rem, 1.125rem)"
      caption: "clamp(0.75rem, 0.5vw + 0.625rem, 0.875rem)"
  spacing:
    container_padding: "px-4 lg:px-8"
    section_padding: "py-24 lg:py-32"
    hero_padding: "pt-24 pb-16"
  radius:
    sm: "4px"
    md: "8px"
    lg: "12px"
    xl: "16px"
    2xl: "32px"
    full: "9999px"
  shadows:
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
    2xl: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
    glass_initial: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)"
    glass_hover: "inset 0 1px 1px rgba(255, 255, 255, 0.9), 0 4px 8px rgba(15, 76, 129, 0.04), 0 16px 32px rgba(15, 76, 129, 0.06), 0 24px 64px rgba(15, 76, 129, 0.04)"
  breakpoints:
    sm: "640px"
    md: "768px"
    lg: "1024px"
    xl: "1280px"
    2xl: "1536px"
  motion:
    durations:
      fast: "150ms"
      normal: "300ms"
      slow: "500ms"
    springs:
      smooth: "stiffness: 280, damping: 26"
      snappy: "stiffness: 400, damping: 28"
---

# Enterprise Master Design System & AI Guidelines

This document serves as the **Single Source of Truth (SSOT)** for the Mirna Graphic design system. It is specifically structured as an executable reference for AI Agents and human developers alike. By strictly following these rules, tools, and component specifications, you guarantee absolute visual consistency across all current and future projects.

---

## 1. Philosophy & Brand DNA

The design system emphasizes premium quality, absolute digital precision, and modern industrial elegance. It balances a clean, professional B2B aesthetic with engaging micro-interactions.

- **Professional & Authoritative:** Instills immediate trust as an industry-leading manufacturer.
- **Premium & Sophisticated:** Refined typography, subtle glassmorphism, and gold accents.
- **Dynamic & Alive:** Fluid animations, parallax scrolling, and interactive hover states.
- **Clarity First:** Form follows function; never sacrifice readability or usability for aesthetics.
- **Accessible Depth:** Use shadows and glassmorphism to establish hierarchy and focus, never just as decoration.

---

## 2. Export Tokens (Tailwind v4)

To ensure this design system can be instantly transplanted to any new project using Tailwind CSS v4, use the following native `@theme` mapping in the global stylesheet (`globals.css`). This acts as the machine-readable foundation, separating tokens from manual text rules.

```css
@import "tailwindcss";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-gold: var(--gold);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  --font-sans: var(--font-inter), system-ui, -apple-system, sans-serif;
  --font-display: var(--font-lora), var(--font-inter), Georgia, serif;
}

:root {
  --background: #F8FAFC;
  --foreground: #1E293B;
  --primary: #0F4C81;
  --primary-foreground: #FFFFFF;
  --secondary: #F1F5F9;
  --secondary-foreground: #4A5568;
  --accent: #EFF6FF;
  --accent-foreground: #0F4C81;
  --gold: #D4AF37;
  --card: #FFFFFF;
  --card-foreground: #1E293B;
  --muted: #F1F5F9;
  --muted-foreground: #64748B;
  --border: #E2E8F0;
  --input: #E2E8F0;
  --ring: #0F4C81;
  --glass-bg: rgba(255, 255, 255, 0.72);
  --glass-border: rgba(15, 76, 129, 0.08);
}
```

---

## 3. Theme Variants (Dark Mode & Multi-Brand)

The system uses CSS Variables precisely to allow effortless theme switching.

- **Dark Mode Implementation:** Dark mode should be implemented by redefining the CSS variables under a `.dark` class or `@media (prefers-color-scheme: dark)`.
  - Backgrounds invert to deep slate (`#0F172A`).
  - Foregrounds invert to light slate (`#F8FAFC`).
  - Glassmorphism backgrounds shift to dark transparent (`rgba(15, 23, 42, 0.72)`).
- **Multi-Brand Deployment:** To deploy this system for a sister brand, duplicate the `:root` block and simply overwrite the `--primary` and `--gold` tokens. All Tailwind logic remains completely intact.

---

## 4. Typography & Scaling

- **Sans (Base):** `Inter` (`var(--font-inter)`)
- **Display:** `Lora` (`var(--font-lora)`)
- **RTL:** `Thmanyah Sans` (`var(--font-thmanyah)`)

*Rule: Always use fluid typography via CSS `clamp()`.*
- `.text-display`: `clamp(3rem, 5vw + 1rem, 4.5rem)` (Weight 900)
- `.text-hero-h1`: `clamp(2.5rem, 4vw + 1rem, 3.75rem)` (Weight 800)
- `h1`: `clamp(2.25rem, 3vw + 1rem, 3rem)` (Weight 800)
- `h2`: `clamp(1.75rem, 2vw + 1rem, 2.25rem)` (Weight 700)
- `body`: `clamp(1rem, 0.5vw + 0.875rem, 1.125rem)` (Weight 400)
- `.caption`: `clamp(0.75rem, 0.5vw + 0.625rem, 0.875rem)` (Weight 400)

---

## 5. Icons Guidelines

All icons are strictly sourced from `lucide-react`.

1. **Size Standardization:**
   - **Inline Text / Small Buttons:** `w-4 h-4` (16px)
   - **Standard Buttons / Navigation:** `w-5 h-5` (20px)
   - **Cards / Hero Features:** `w-6 h-6` (24px)
   - **Major Dashboard Sections:** `w-8 h-8` (32px)
2. **Stroke Width:** Maintain the default Lucide stroke width of `2px` to ensure optical alignment with Inter font weights (400-600).
3. **Spacing:** Always use a minimum gap of `gap-2` between an icon and text. In RTL mode, icons must logically flip or maintain padding via `gap` (flex).

---

## 6. Animation Library (Framer Motion)

The system enforces standardized motion via `@/lib/motion.ts` to prevent chaotic or disjointed animation states.

### Standard Springs
- `springSmooth`: `{ type: "spring", stiffness: 280, damping: 26 }` (Used for layout shifts, reveals).
- `springSnappy`: `{ type: "spring", stiffness: 400, damping: 28 }` (Used for hover states, taps, button interactions).

### Core Variants
1. **`fadeUp`**: Entry animation. Translates from `y: 24` to `y: 0` while fading opacity `0` to `1`.
2. **`staggerContainer`**: Orchestrator. `staggerChildren: 0.08`, `delayChildren: 0.05`. Used on Grid containers to cascade `fadeUp` children.
3. **`buttonHover`**: Interaction. `whileHover: { y: -2, scale: 1.02 }`, `whileTap: { scale: 0.96 }`.
4. **`cardHover`**: Interaction. `whileHover: { y: -8, scale: 1.02, boxShadow: "..." }`.
5. **`sectionReveal`**: Macro layout. `y: 40` to `y: 0`, ease `[0.22, 1, 0.36, 1]`, duration `0.7s`.

---

## 7. Component APIs

When generating components, adhere strictly to these APIs.

### `Button` (`src/components/ui/Button.tsx`)
| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost'` | `'primary'` | Defines the visual style. |
| `size` | `'sm' \| 'md' \| 'lg' \| 'icon'` | `'md'` | Defines padding and font size. |
| `iconLeft` | `React.ReactNode` | `null` | Icon placed before children. |
| `iconRight` | `React.ReactNode` | `null` | Icon placed after children. |

### `Input` (`src/components/ui/Input.tsx`)
| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `label` | `string` | required | `.text-muted-foreground.uppercase` label above input. |
| `error` | `string` | `undefined` | Error message string. Changes bottom border to red. |

---

## 8. Component Inventory

A live map of current implementations. AI Agents must check this table before writing inline UI.

| Component | Location | Status / Reuse Level | Requires Refactoring? |
| :--- | :--- | :--- | :--- |
| **Navbar** | `src/components/layout/Navbar.tsx` | Global Layout (High) | No |
| **SectionLabel** | `globals.css` (.section-label) | UI Element (High) | Convert to React Component |
| **Button** | *Inline (Hero.tsx, ContactPortal.tsx)* | N/A | **Yes - Needs Extraction** |
| **Input** | *Inline (ContactPortal.tsx)* | N/A | **Yes - Needs Extraction** |
| **GlassCard** | `globals.css` (.glass-card) | UI Element (Medium) | Convert to React Component |
| **Hero** | `src/components/sections/Hero.tsx` | Page Section (Low) | No |

---

## 9. Design Decision Tree

**AI Agents MUST follow this logic before creating ANY new UI element:**

1. **Does the UI element match an existing Token?**
   - *Yes:* Use the Tailwind utility (e.g., `bg-primary`).
   - *No:* Use a fallback neutral (e.g., `bg-secondary`) or ask the user to expand the Theme.
2. **Does the component exist in the Inventory?**
   - *Yes:* Import and reuse it. (e.g., `<Button>`)
   - *No:* Proceed to Step 3.
3. **Is it a foundational UI element (Button, Input, Badge, Dialog)?**
   - *Yes:* Create it in `src/components/ui/` with a strict Props API.
   - *No:* Proceed to Step 4.
4. **Is it a specific page block (Testimonials, Hero, Pricing)?**
   - *Yes:* Create it in `src/components/sections/` and compose it using elements from `src/components/ui/`.

---

## 10. Page Blueprints

AI Agents should use these blueprints when scaffolding entire views.

### Landing Page Blueprint
1. **Navbar** (`z-50`, sticky, glassmorphism on scroll)
2. **HeroLayout** (Min-height `92vh`, Parallax images, Trust Badges, primary CTA)
3. **FeaturesSection** (Grid layout, staggering cards via Framer Motion)
4. **ContactPortal** (Split screen: Info on left, elevated form card on right)
5. **LocationFooter** (Dark theme, multi-column links, copyright)

### Dashboard Blueprint (Future)
1. **SidebarNav** (Fixed left, `w-64`, collapsible, contains icons + labels)
2. **TopBar** (Search, User Avatar, Notification Bell, Breadcrumbs)
3. **StatsGrid** (Top row, 3-4 columns, animated counters using `statsCounter`)
4. **MainChartArea** (Spanning 2 columns, `.glass-card` background)
5. **DataTable** (Recent activity, clean borders, pagination)

---

## 11. Code Generation Rules & Agent Workflow

Any code written by an AI Coding Agent MUST follow these absolute rules sequentially:

1. **Strictly Tailwind CSS v4:** Do not write custom CSS in `globals.css` unless defining a token. No CSS Modules.
2. **Strictly Lucide React & Framer Motion:** No other icon or animation libraries are permitted.
3. **Semantic Colors:** Never use raw colors (e.g., `text-blue-500`). Use semantic tokens (e.g., `text-primary`).
4. **Client Components:** Add `'use client';` at the top of any component utilizing `useState`, `useEffect`, or `framer-motion`.

**Workflow:** Read `DESIGN.md` ➔ Check Component Inventory ➔ Traverse Decision Tree ➔ Generate Code ➔ Run UI Quality Checklist.

---

## 12. UI Quality Checklist

Before finalizing any screen, the Agent MUST verify:

- [ ] **Semantic Tokens:** Are all colors mapped to `primary`, `secondary`, `foreground`, `background`, `muted`, `border`?
- [ ] **Responsive Padding:** Does the container use `px-6 lg:px-8` and `py-24 lg:py-32`?
- [ ] **RTL Support:** Will this component flip perfectly when `dir="rtl"`?
- [ ] **Motion & Performance:** Are animations using `transform`/`opacity` instead of layout-altering properties (`margin`/`padding`)?
- [ ] **Accessibility:** Do inputs have labels? Do interactive elements have `focus-visible` outlines? Is contrast sufficient?

---

## 13. Anti Patterns (What NOT to do)

- 🚫 **Arbitrary Colors:** `text-[#123456]` or `bg-blue-600`.
- 🚫 **Divitis:** Wrapping every single text element in nested `<div>`s instead of using CSS Grid/Flexbox gaps.
- 🚫 **Overriding Focus:** Using `focus:outline-none` or `focus:ring-0` without providing a custom visual indicator.
- 🚫 **Z-Index Wars:** Using `z-[9999]` arbitrarily. Stick to the Z-Index Scale (`z-0` to `z-50`).

---

## 14. Code Examples & Migration Guide

### A. Reusable Standard Button (`src/components/ui/Button.tsx`)
```tsx
'use client';
import { motion } from 'framer-motion';
import { buttonHover } from '@/lib/motion';

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all";
  const variants = {
    primary: "bg-primary text-primary-foreground shadow-lg px-8 py-4",
    secondary: "bg-background border border-border/50 text-foreground hover:border-primary/40 hover:bg-secondary/50 px-8 py-4 shadow-sm"
  };

  return (
    <motion.button {...buttonHover} className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </motion.button>
  );
};
```

### B. Standardized Input (`src/components/ui/Input.tsx`)
```tsx
export const Input = ({ label, ...props }) => (
  <div className="space-y-3 group w-full">
    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider group-focus-within:text-primary transition-colors">
      {label}
    </label>
    <input 
      className="w-full bg-secondary/50 border-0 border-b-2 border-border focus:border-primary focus:ring-0 px-4 py-3 rounded-t-xl transition-all outline-none" 
      {...props} 
    />
  </div>
);
```

### C. Refactoring Current Code (Migration)
The current codebase hardcodes `<button>` and `<input>` inside `Hero.tsx` and `ContactPortal.tsx`. **Agents must extract these to `src/components/ui/` based on the examples above before adding new features,** replacing raw inline blocks with `<Button variant="primary">` and `<Input label="Name" />`.
