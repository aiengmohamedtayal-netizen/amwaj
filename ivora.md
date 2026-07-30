---
title: "Smart HMS Design System"
description: "The Single Source of Truth for the Smart HMS visual language and architecture."
version: "1.0.0"
design_tokens:
  colors:
    primary:
      50: '#eff6ff'
      100: '#dbeafe'
      200: '#bfdbfe'
      300: '#93c5fd'
      400: '#60a5fa'
      500: '#3b82f6'
      600: '#2563eb'
      700: '#1d4ed8'
      800: '#1e40af'
      900: '#1e3a8a'
    slate:
      50: '#f8fafc'
      100: '#f1f5f9'
      200: '#e2e8f0'
      300: '#cbd5e1'
      400: '#94a3b8'
      500: '#64748b'
      600: '#475569'
      700: '#334155'
      800: '#1e293b'
      900: '#0f172a'
    danger:
      50: '#fef2f2'
      100: '#fee2e2'
      200: '#fecaca'
      300: '#fca5a5'
      400: '#f87171'
      500: '#ef4444'
      600: '#dc2626'
      700: '#b91c1c'
      800: '#991b1b'
      900: '#7f1d1d'
  semantic_colors:
    light:
      surface: '#f3f6fb'
      surface_strong: '#ffffff'
      text_primary: '#0f172a'
      text_secondary: '#475569'
      border: '#e2e8f0'
      focus_ring: '#3b82f6'
    dark:
      surface_base: '#020617'
      surface: '#0f172a'
      surface_raised: '#172554'
      surface_strong: '#1e293b'
      text_primary: '#f1f5f9'
      text_secondary: '#cbd5e1'
      text_tertiary: '#94a3b8'
      border: 'rgba(255, 255, 255, 0.1)'
  typography:
    families:
      heading: ['Lora', 'Georgia', 'serif']
      body: ['Inter', 'system-ui', 'sans-serif']
      data: ['JetBrains Mono', 'monospace']
      arabic: ['Tajawal', 'sans-serif']
      brand: ['Thorny Roses', 'Trebuchet MS', 'sans-serif']
    weights:
      light: 300
      regular: 400
      medium: 500
      semibold: 600
      bold: 700
      extrabold: 800
  spacing:
    container_max: 'max-w-7xl'
    section_py: 'py-12 md:py-20'
    gap_sm: '0.5rem'
    gap_md: '1rem'
    gap_lg: '1.5rem'
    gap_xl: '2rem'
  breakpoints:
    xs: '400px'
    sm: '640px'
    md: '768px'
    lg: '1024px'
    xl: '1280px'
    2xl: '1536px'
  radius:
    sm: '0.25rem'
    md: '0.375rem'
    lg: '0.5rem'
    xl: '0.75rem'
    2xl: '1rem'
    3xl: '1.5rem'
    full: '9999px'
  elevation:
    shadow_sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
    shadow_md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    shadow_lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    shadow_xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    shadow_2xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
    shadow_card: '0 6px 20px rgba(15, 23, 42, 0.05)'
    shadow_button_hover: '0 8px 20px rgba(59, 130, 246, 0.4)'
    shadow_glow: '0 0 15px rgba(255,255,255,0.1), 0 0 30px var(--glow-color)'
  motion:
    durations:
      fast: '150ms'
      normal: '200ms'
      slow: '300ms'
      slower: '500ms'
    easings:
      default: 'cubic-bezier(0.4, 0, 0.2, 1)'
      in: 'cubic-bezier(0.4, 0, 1, 1)'
      out: 'cubic-bezier(0, 0, 0.2, 1)'
      in_out: 'cubic-bezier(0.4, 0, 0.2, 1)'
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
    presets:
      fade_in_up: 'fade-in-up 240ms ease-out'
      route_fade: 'route-fade 220ms ease-out'
      shimmer: 'shimmer 1.2s linear infinite'
      stagger_fade_in: 'stagger-fade-in 400ms ease-out'
      dropdown_enter: 'dropdown-enter 180ms ease-out'
      skeleton_wave: 'skeleton-wave 1.5s ease-in-out infinite'
      float_slow: 'float-slow 4.6s ease-in-out infinite'
      btn_shine: 'left 480ms ease-out'
---

# 1. Overview

The Smart HMS Design System is the definitive Single Source of Truth (SSOT) for all UI, UX, styling, motion, and architectural decisions across the Smart HMS ecosystem. It is framework-agnostic but optimized for React, Tailwind CSS, and TypeScript. This document provides enterprise-grade guidelines to ensure that all current and future projects maintain a consistent, premium, and highly accessible visual identity.

# 2. Philosophy

- **Premium First**: Every interface must feel expensive, polished, and meticulously crafted. We use curated gradients, subtle blurs, glassmorphism, and precise micro-interactions to achieve a high-end feel.
- **Dynamic & Alive**: The UI is not static. It breathes. Elements react to user intent via hover states, focus rings, page transitions, and staggered animations.
- **Clarity over Cleverness**: While aesthetically rich, functionality is never compromised. Information hierarchy is paramount, especially in healthcare and data-heavy interfaces.
- **Component-Driven Composition**: Build small, testable, and highly reusable components. Compose complex views from simple primitives.
- **Universal Accessibility**: Design works for everyone. Full keyboard navigation, screen reader support, RTL support (Arabic natively integrated), and reduced motion awareness are non-negotiable.

# 3. Brand DNA

The Smart HMS visual identity conveys trust, technological advancement, and clinical precision.
- **Core Identity**: Trustworthy medical blue combined with stark, clean whitespace.
- **Typography**: A juxtaposition of traditional serif elegance (`Lora`) for headings, modern sans-serif readability (`Inter`) for body text, tabular monospaces (`JetBrains Mono`) for data, and refined Arabic (`Tajawal`).
- **Texture**: Surfaces are rarely flat. They employ subtle radial gradients, soft layered shadows (`shadow-2xl`, `shadow-md`), and translucent overlays to establish depth.

# 4. Design Principles

1. **Aesthetics Matter**: If it looks generic, it is wrong. Use tailored tokens, not default values.
2. **Predictable Interaction**: Interactive elements must provide immediate visual feedback (e.g., scale transformations, shine effects, box-shadow shifts).
3. **Graceful Degradation**: Features like complex animations or blur filters must degrade gracefully on low-powered devices or when reduced motion is preferred.
4. **Contextual Density**: Dashboards require high density and tabular numeric fonts. Landing pages require low density, high impact, and expressive typography.
5. **Localization as a First-Class Citizen**: RTL and LTR must be perfectly mirrored. Fonts shift seamlessly to `Tajawal` when Arabic is active.

# 5. Visual Language

The visual language relies on:
- **Glassmorphism**: Translucent panels with background blurs (e.g., `backdrop-blur-md`, `bg-white/80`).
- **Glows & Blooms**: Accentuated focal points using radial gradients (e.g., `.hero-glow-text`, `clamp-bloom`).
- **Organic Shapes**: Blob-like background elements for landing and login pages to break rigid grid structures.
- **Vignettes**: Darkened edges in dark mode or cinematic views to focus attention on the center.

# 6. Color System

## 6.1 Brand Colors (Primary)
- **Primary 50-900**: Extracted from Tailwind Config. The core brand color is `Primary 600` (`#2563eb`) with `Primary 500` (`#3b82f6`) as the main interactive tint.
- **Gradients**: Often used on buttons and text clips. E.g., `linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)`.

## 6.2 Semantic Colors
- **Surface (Light)**: Background `#f3f6fb`, Cards/Modals `#ffffff`.
- **Surface (Dark)**: Background uses a radial gradient `radial-gradient(circle at 0% 0%, #172554 0%, #0f172a 45%, #020617 100%)`. Cards use `#1e293b` or `#0f172a/90`.
- **Text**: `text-slate-900` for primary headings, `text-slate-500` for secondary text. Dark mode shifts these to `text-f1f5f9` and `text-cbd5e1`.
- **Danger/Error**: Red 500 (`#ef4444`) for critical errors, Red 50/100 for error backgrounds.
- **Success**: Green 500 (`#22c55e`) for success states.

## 6.3 State Colors
- **Hover**: Typically a 1-step lighter or darker shade in Tailwind, accompanied by opacity changes or shadows.
- **Focus**: A distinct `outline: 2px solid #3b82f6` with `outline-offset: 2px`.

# 7. Typography

## 7.1 Font Families
- **Heading**: `Lora`, `Georgia`, serif. Class: `.premium-serif`. Used for titles, card headers, and premium narrative text.
- **Body**: `Inter`, `system-ui`, sans-serif. Used for all standard text, form inputs, and buttons.
- **Data/Code**: `JetBrains Mono`, monospace. Class: `.font-data`. Enforces `font-variant-numeric: tabular-nums` for perfect alignment in data tables and analytics.
- **Arabic**: `Tajawal`. Defined in 400, 500, 700, 800 weights. Used when `direction: rtl` is active.
- **Brand**: `Thorny Roses`. Class: `.brand-logo`.

## 7.2 Typographic Hierarchy
- **H1**: 2.5rem (40px) to 4rem (64px) on desktop, bold/extrabold, tight leading.
- **H2**: 1.8rem to 2.5rem, bold, tight leading.
- **H3**: 1.25rem to 1.5rem, semibold.
- **Body**: 0.875rem (14px) or 1rem (16px), regular/medium, relaxed leading (1.5 to 1.6).
- **Small/Micro**: 0.75rem (12px) to 0.85rem, uppercase, wide tracking (e.g., `tracking-wider`) for labels and table headers.

# 8. Spacing System

Smart HMS uses an 8px (0.5rem) base scale via Tailwind CSS.
- **Micro**: `2px`, `4px` (gap-1) for icon-to-text spacing.
- **Small**: `8px` (gap-2), `12px` (gap-3) for inner component padding (e.g., button px/py).
- **Medium**: `16px` (gap-4), `24px` (gap-6) for card padding and section margins.
- **Large**: `32px` (gap-8), `48px` (gap-12) for layout sectioning.
- **Extra Large**: `64px` (gap-16), `96px` (gap-24) for landing page structural breaks.

# 9. Grid System

- **Dashboard Layouts**: CSS Grid with a fixed or collapsible sidebar. Main content area typically uses a 12-column grid or CSS flexbox with `gap-6`.
- **Card Grids**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` depending on card density.
- **Form Layouts**: Stacked vertically by default, but side-by-side (`grid-cols-2`) on `md` breakpoints for complex forms.

# 10. Layout Rules

- **Max Widths**: Container max-width is typically `max-w-7xl` (1280px).
- **Centered Content**: Landing pages and auth screens center content vertically and horizontally, often using absolute positioning or CSS Grid `place-items: center`.
- **Sidebars**: Sticky or fixed positioning. 
- **Z-Index Scale**: 
  - 0-10: Backgrounds, Blobs, Decors
  - 10-20: Content elements
  - 30: Sticky Navbars / Headers
  - 40: Drawers / Sidebars
  - 50: Overlays / Modals
  - 100+: Toasts / Tooltips

# 11. Responsive Rules

- **Mobile First**: All baseline styles apply to mobile. Breakpoints (`sm:`, `md:`, `lg:`) layer enhancements.
- **Input Zoom Prevention**: On mobile (<=768px), all form inputs must have `font-size: 16px !important` to prevent iOS Safari auto-zoom.
- **Touch Targets**: Minimum 44x44px for buttons and interactive elements on coarse pointer devices (`@media (pointer: coarse)`).
- **Mobile Tables**: Data tables transform into block-level cards (`.table-mobile-cards`) on screens <=768px. `thead` is hidden, and `td` elements display block with `::before` pseudo-elements containing the data label.

# 12. Elevation

Elevation is achieved through a combination of shadows and borders.
- **Level 1 (Cards, Inputs)**: 1px border (`border-slate-200` or `white/10`), soft shadow (`shadow-sm` or custom `0 6px 20px rgba(15, 23, 42, 0.05)`).
- **Level 2 (Dropdowns, Hover States)**: `shadow-md`, slight negative Y-translation (`-translate-y-[1px]`).
- **Level 3 (Modals, High-impact elements)**: `shadow-2xl` or massive custom glows (e.g., `0 20px 60px rgba(59, 130, 246, 0.15)`).
- **Dark Mode Elevation**: Shadows are generally replaced by lighter borders (`border-white/10`) and deeper radial background gradients, though soft, dark shadows are still applied.

# 13. Shapes

- **Base Radius**: `rounded-2xl` (1rem / 16px) is the signature shape for buttons, inputs, and primary cards.
- **Pills**: `rounded-full` for badges, tags, and specific submit buttons.
- **Organic**: Heavy use of custom `border-radius` (e.g., `40% 60% 70% 30% / 40% 50% 60% 50%`) for background blobs and decorative elements.

# 14. Icons Guidelines

- **Style**: Line icons, 1.5px to 2px stroke width. Consistent rounded corners.
- **Sizing**: Default to `w-5 h-5` or `w-6 h-6`.
- **Placement**: Left-aligned in LTR buttons, right-aligned in RTL. Wrapped in an absolute positioned span for inputs (`absolute inset-y-0 left-3`).
- **Color**: Inherit from parent (`currentColor`) or map to `text-slate-400` / `text-slate-500` for input prefixes.

# 15. Animation Library

Animations are defined in `index.css` and mapped to utility classes:
- **Entrances**: 
  - `.animate-fade-in-up`: Slides up 8px and fades in over 240ms.
  - `.animate-route-fade`: Scales from 0.995 and translates Y over 220ms.
  - `.animate-dropdown-enter`: Drops down 4px and scales from 0.97 over 180ms.
  - `.animate-stagger-[1-5]`: Staggered fade-ins with 80ms delays for list/card items.
- **Loading**:
  - `.animate-shimmer`: Linear 1.2s infinite gradient slide.
  - `.animate-skeleton-wave`: 1.5s infinite opacity wave (0.6 to 1).
- **Attention**:
  - `.animate-error-shake`: 320ms horizontal shake for invalid inputs.
  - `.animate-risk-pulse`: 1.8s infinite red text-shadow pulse.
- **Ambient**:
  - `.animate-float-slow`: 4.6s infinite 8px vertical float.
  - `.animate-sheen`: 6s infinite background sheen.

# 16. Motion Library

- **Transitions**: Global use of `transition-all duration-200` or `duration-300`.
- **Springs**: Custom cubic beziers (e.g., `cubic-bezier(0.34, 1.56, 0.64, 1)`) for snappy, bouncy interactions (used in auth cards and GSAP-like elements).
- **Reduced Motion**: All animations MUST respect `@media (prefers-reduced-motion: reduce)`. Defined in CSS to forcefully apply `animation: none !important` and `transition-duration: 0ms !important`.

# 17. Accessibility

- **Focus Rings**: Universally applied to actionable elements via `.focus-ring` or global resets. Custom outline: `2px solid #3b82f6` with `2px` offset. Focus rings are hidden on mouse click (`:focus:not(:focus-visible)`).
- **Color Contrast**: Text must meet WCAG AA standards. (e.g., Slate 500 on white is minimum for helper text, Slate 700/900 for primary text).
- **Semantic HTML**: Buttons must be `<button>`, inputs must have associated `<label>` (linked via `htmlFor` and `id`).
- **Screen Readers**: Use `sr-only` classes to hide decorative elements and radio controls.

# 18. RTL Rules

- **Fonts**: Automatically switch to `Tajawal`.
- **Layout**: Use logical CSS properties where possible (e.g., `padding-inline-start`, `margin-inline-end`).
- **Icons**: Mirror directional icons (arrows, chevrons).
- **Forms**: Labels right-aligned. Input icons switch sides (prefix on right, suffix on left).
- **Specific Implementations**: See `.clamp-field-ar` and `.clamp-form` which explicitly force `direction: rtl` and custom paddings.

# 19. Theme Variants

- **Default (Corporate/Dashboard)**: Clean, high-information density, slate/blue tones.
- **Landing Page**: Immersive, heavy gradients, glassmorphism, animated backgrounds.
- **Auth (Mastery/Cinematic/Cute)**: Highly experimental, heavily animated, illustrative or 3D-effect driven interfaces.

# 20. Dark Mode

- **Trigger**: Class `.hms-dark` applied to `html` or `body`.
- **Backgrounds**: Replaces white/slate-50 with rich, deep blues/blacks (`#020617`, `#0f172a`, `#172554`).
- **Borders**: Subdued borders using alpha transparency (`rgba(255,255,255,0.1)`).
- **Text**: Inverts to `#f1f5f9` (Slate 100) for primary, `#cbd5e1` (Slate 300) for secondary.
- **Forms**: Inputs use `#334155` background and `#475569` border. Focus states retain the bright blue ring.

# 21. Tailwind Export

```javascript
// tailwind.config.js mapping
export default {
  darkMode: ['class', '.hms-dark'],
  theme: {
    extend: {
      colors: { primary: { 50: '#eff6ff', /* ... */ 900: '#1e3a8a' } },
      fontFamily: { heading: ['Lora', 'Georgia', 'serif'], body: ['Inter', 'system-ui', 'sans-serif'] },
    }
  }
}
```

# 22. CSS Variables

Defined in `:root`:
```css
:root {
  --surface: #f3f6fb;
  --surface-strong: #ffffff;
  --text-primary: #0f172a;
  --text-secondary: #475569;
}
```
Theme specific variables (e.g., Cute Lamp):
`--cord`, `--opening`, `--feature`, `--accent`, `--tongue`, etc.

# 23. Component APIs

## 23.1 Button (`Button.tsx`)
**Props**: 
- `variant?: 'primary' | 'secondary' | 'danger' | 'ghost'`
- `size?: 'sm' | 'md' | 'lg'`
- `loading?: boolean`
**Behavior**: Applies variant-specific classes, disables button and shows a spinner if `loading=true`. Includes hover translations and active state compressions.

## 23.2 Card (`Card.tsx`)
**Props**: 
- `title?: string`
- `subtitle?: string`
- `actions?: ReactNode`
- `contentClassName?: string`
**Behavior**: Renders a semantic `<section>`. Optionally renders a `<header>` if title/subtitle/actions exist. Content is wrapped in a padded `<div>`. Applies responsive borders and shadows.

## 23.3 InputField (`InputField.tsx`)
**Props**: 
- `label?: string`
- `helperText?: string`
- `error?: string`
- `icon?: ReactNode`
- `suffix?: ReactNode`
**Behavior**: Auto-generates IDs if omitted. Renders labels above inputs. Absolute positions icons/suffixes. Applies red borders/text on `error`.

# 24. Component Anatomy

- **Wrapper**: Usually a `div` or semantic tag with layout utility classes (flex, grid, space-y).
- **Header**: Title (H2/H3) and Subtitle (p), often alongside action buttons.
- **Body**: The main content area with controlled padding (`p-6` or `px-4 py-5`).
- **Footer**: Optional action area at the bottom, typically separated by a border.

# 25. Component Composition

Never build monolithic components. 
- A **DataTable** is composed of `Card`, `Table`, `Badge` (for status), and `Pagination`.
- A **Form** is composed of `InputField`, `Select`, `Checkbox`, and `Button`.
- Use the `cn()` utility (`clsx` + `tailwind-merge`) strictly for class composition and overriding.

# 26. Component Inventory

Core UI library exists in `src/components/ui/`:
- `Badge.tsx`: Status indicators.
- `Button.tsx`: Core interactive element.
- `Card.tsx`: Structural container.
- `CursorFollower.tsx`: Decorative motion element.
- `EmptyState.tsx`: Fallback UI for no data.
- `FileUploader.tsx`: Drag-and-drop file interface.
- `InfoTooltip.tsx`: Contextual help popovers.
- `InputField.tsx`: Text inputs.
- `KPICard.tsx`: Dashboard metric cards.
- `Modal.tsx`: Dialog overlays.
- `NotificationPanel.tsx`: Toast/Alert container.
- `PageContainer.tsx`: Main layout wrapper.
- `Pagination.tsx`: List navigation.
- `Skeleton.tsx`: Loading placeholders.
- `Table.tsx`: Data grids.
- `Toast.tsx`: Transient messages.

# 27. Naming Conventions

- **Components**: PascalCase (e.g., `InputField.tsx`, `KPICard.tsx`).
- **Files/Folders**: Kebab-case for generic folders (`ai-service`, `smart-hms`), PascalCase for React component folders if treating folder-as-module.
- **CSS Classes**: Kebab-case. Prefix specialized UI modules with their domain (e.g., `.clamp-form`, `.mastery-left`, `.cute-lamp-page`).
- **Props**: camelCase. Use descriptive booleans (e.g., `isLoading`, `hasError`).

# 28. Folder Conventions

- `/src/components/ui`: Dumb, highly reusable primitive components.
- `/src/components/layout`: Structural components (Sidebar, Navbar, Footer).
- `/src/pages`: Top-level route components.
- `/src/features`: Domain-specific modules (e.g., Auth, Dashboard, Pharmacy).
- `/src/styles`: Global CSS, Tailwind configurations.
- `/src/lib`: Utility functions (e.g., `cn.ts`).
- `/src/hooks`: Custom React hooks.

# 29. Page Blueprints

## 29.1 Dashboard
- **Layout**: Fixed sidebar (left LTR, right RTL), sticky top header, scrollable main content area.
- **Content**: Grid of `KPICard`s at the top. Followed by a 2-column layout (Chart on left, Recent Activity table on right).

## 29.2 Authentication (Login/Register)
- **Layout**: Split screen (50/50). Left side contains branded illustration/blobs. Right side contains the form centered. OR a highly stylized cinematic view (e.g., Clamp Register).
- **Vibe**: Immersive, high animation, distinct from the utilitarian dashboard.

## 29.3 Data Tables (Patients, Pharmacy)
- **Layout**: `PageContainer` with a header row (Title + Add Button + Search/Filter Input).
- **Content**: Full-width `Card` containing the `Table`. Implements mobile card-view responsive overrides.

# 30. Code Generation Rules

- **React**: Use Functional Components and Hooks. Export default functions.
- **TypeScript**: Strictly type all Props using `interface`. Avoid `any`.
- **Styling**: Exclusively use Tailwind CSS. Only use `index.css` for complex keyframes, @font-face, or pseudo-element trickery that Tailwind cannot handle cleanly.
- **Class Merging**: Always wrap `className` props with `cn(...)` to allow consumers to override styles safely.

# 31. Agent Workflow

1. **Understand Requirements**: Analyze requested feature against DESIGN.md.
2. **Find Primitives**: Check `src/components/ui/` for existing components.
3. **Draft Composition**: Combine primitives. If a new primitive is needed, design it strictly adhering to colors, typography, and spacing scales.
4. **Implement Responsiveness**: Code mobile-first. Test mentally against the `table-mobile-cards` and touch-target rules.
5. **Add Motion**: Apply standard entrance animations (e.g., `.animate-fade-in-up`) to new page elements.
6. **Verify Dark Mode**: Ensure `.hms-dark` classes are respected (use `dark:` tailwind variants).

# 32. Decision Tree

- **Need a shadow?** -> Is it a card? Use `shadow-sm` or custom card shadow. Is it a modal? Use `shadow-2xl`. Is it a hover state? Use `shadow-md`.
- **Need an animation?** -> Is it an entrance? Use `animate-fade-in-up`. Is it a list? Use `animate-stagger-*`. Is it a loading state? Use `animate-skeleton-wave`.
- **Need a color?** -> Is it primary action? Use `blue-600`. Is it text? Use `slate-900` (light) or `slate-200` (dark).
- **Need a font?** -> Is it a large title or stylized narrative? Use `premium-serif`. Is it numerical data? Use `font-data`. Otherwise, default Inter.

# 33. UI Quality Checklist

- [ ] Does it work on 320px width? (No horizontal scroll)
- [ ] Are inputs zoomed on iOS Safari? (Fix: Ensure 16px font-size)
- [ ] Do all interactive elements have `.focus-ring` or `focus-visible:` states?
- [ ] Does the UI degrade gracefully if `prefers-reduced-motion` is active?
- [ ] Are data tables legible on mobile? (Do they convert to cards?)
- [ ] Is contrast WCAG AA compliant in both Light and Dark modes?
- [ ] Are structural HTML semantics correct? (nav, main, section, aside, header, footer)
- [ ] Do components compose well? (Are margins/paddings hardcoded externally or internally?)
- [ ] Is RTL supported natively without breaking layout?

# 34. Testing Rules

- **Visual QA**: Ensure padding and alignment are pixel-perfect against the 8px grid.
- **Interaction**: Tab through the entire interface to ensure keyboard focus is visible and logical.
- **State**: Test Empty, Loading, Error, and Success states for every data-fetching component.

# 35. Performance Rules

- **CSS Weight**: Avoid overusing complex CSS shadows and blurs on large scrolling lists, as it impacts paint performance. Reserve heavy blurs for fixed overlays (navbars, modals).
- **Animations**: Use `transform` and `opacity` for animations exclusively to prevent layout thrashing. Avoid animating `width`, `height`, or `margin`.
- **SVGs**: Inline SVGs should be optimized and have `currentColor` fill/stroke for easy theme switching.

# 36. AI Rules

- **NEVER** invent colors outside the defined palette in `tailwind.config.js`.
- **NEVER** invent spacing values. Stick to Tailwind's default spacing scale.
- **NEVER** invent typography sizes or families.
- **ALWAYS** reuse existing components from `src/components/ui`.
- **ALWAYS** follow the `.hms-dark` paradigm for dark mode (use `dark:` prefixes).
- **ALWAYS** implement responsive design mobile-first.
- **ALWAYS** respect RTL layout constraints (use `start` and `end` logical properties in Tailwind where applicable, like `ps-4`, `me-2`).

# 37. Anti Patterns

- ❌ **Hardcoding colors**: `style={{ color: '#123456' }}`. (Use Tailwind classes).
- ❌ **Inline media queries**: Using inline styles for responsive design. (Use `md:`, `lg:`).
- ❌ **Missing focus states**: Removing outlines without providing an alternative focus indicator.
- ❌ **God Components**: A single file handling fetching, state, layout, and primitive styling. (Break it down).
- ❌ **Over-animating**: Animating every single element on the page. (Use motion to draw attention, not distract).

# 38. Migration Guide

When porting a legacy component to this design system:
1. Strip all custom CSS classes and inline styles.
2. Replace hardcoded hex values with semantic Tailwind classes (`text-slate-900`, `bg-blue-600`).
3. Replace generic HTML tags with UI primitives (`<button>` -> `<Button>`, `<input>` -> `<InputField>`).
4. Apply the standard card wrapper (`<Card>`) for structural boundaries.
5. Add `dark:` variants for dark mode compatibility.
6. Add `.animate-fade-in-up` for entrance motion.

# 39. Future Components

Planned system expansions:
- **Date/Time Picker**: Adhering to the premium visual style, integrating `JetBrains Mono` for dates.
- **Advanced Data Grid**: With resizable columns, pinned rows, and virtualized scrolling.
- **Complex Charts Wrapper**: A standardized wrapper around Recharts/Chart.js enforcing the semantic color palette.

# 40. Appendix

- **CSS Variables Source**: `src/index.css`
- **Tailwind Config Source**: `tailwind.config.js`
- **Component Source**: `src/components/ui/`
- **Design Tokens**: Defined in YAML frontmatter of this document.
- **Version**: 1.0.0
- **Status**: Stable / Production Ready
