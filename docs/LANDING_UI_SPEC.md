# PulseOps Lite - Landing Page UI Specification

> **PULSEOPS_LANDING_02_UI_SPEC_CUTE**  
> Principal UI/UX designer output  
> Based on: PULSEOPS_LANDING_01_NARRATIVE_MAP_CUTE

---

## 1. Layout Specifications

### Global Container

```
Max Width: 1280px (80rem)
Padding: 0 24px (mobile) | 0 48px (tablet) | 0 64px (desktop)
```

### Responsive Breakpoints

| Name | Min Width | Grid Columns |
|------|-----------|--------------|
| Mobile | 0px | 1 |
| Tablet | 768px | 2 |
| Desktop | 1024px | 12 |
| Wide | 1280px | 12 (capped) |

### Typography Scale

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `--text-hero` | 56px / 3.5rem | 700 | 1.1 | Hero headline |
| `--text-h1` | 40px / 2.5rem | 700 | 1.2 | Section titles |
| `--text-h2` | 28px / 1.75rem | 600 | 1.3 | Card titles |
| `--text-h3` | 20px / 1.25rem | 600 | 1.4 | Subsection headers |
| `--text-body` | 16px / 1rem | 400 | 1.6 | Body copy |
| `--text-small` | 14px / 0.875rem | 400 | 1.5 | Captions, labels |
| `--text-xs` | 12px / 0.75rem | 500 | 1.4 | Badges, pills |

**Font Stack**: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`

### Spacing Scale

| Token | Value |
|-------|-------|
| `--space-xs` | 4px |
| `--space-sm` | 8px |
| `--space-md` | 16px |
| `--space-lg` | 24px |
| `--space-xl` | 32px |
| `--space-2xl` | 48px |
| `--space-3xl` | 64px |
| `--space-4xl` | 96px |

---

## 2. Section-by-Section Layout

### Section 1: Hero

```
┌─────────────────────────────────────────────────────────────┐
│ [Navbar - Sticky]                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│     ┌───────────────────┬──────────────────────────────┐    │
│     │  HEADLINE         │                              │    │
│     │  Subheadline      │     [Animated Terminal]     │    │
│     │                   │                              │    │
│     │  [CTA]  [CTA 2nd] │                              │    │
│     └───────────────────┴──────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Min Height | 100vh - navbar height |
| Grid | 2 columns (50/50) on desktop, stacked on mobile |
| Padding Top | `--space-4xl` |
| Padding Bottom | `--space-3xl` |
| Background | Gradient mesh (see Visual Style) |

**Responsive**:
- Mobile: Single column, terminal below headline, smaller text
- Tablet: 2 columns, terminal slightly smaller

---

### Section 2: Credibility Strip

```
┌─────────────────────────────────────────────────────────────┐
│  [Icon] 13 Migrations  •  [Icon] 37 APIs  •  [Icon] RBAC   │
└─────────────────────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Height | 64px |
| Background | `var(--color-surface-subtle)` |
| Border | 1px solid `var(--color-border)` top/bottom |
| Layout | Flex, center, gap `--space-xl` |

**Pills**:
- Padding: `--space-sm` `--space-md`
- Border Radius: `--radius-full` (pill shape)
- Font: `--text-xs`, `--font-medium`
- Icon: 16x16, left of text

**Responsive**:
- Mobile: Horizontal scroll with snap points
- Tablet+: Centered row

---

### Section 3: Feature Grid

```
┌─────────────────────────────────────────────────────────────┐
│  Section Title                                              │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ Card 1  │ │ Card 2  │ │ Card 3  │ │ Card 4  │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ Card 5  │ │ Card 6  │ │ Card 7  │ │ Card 8  │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Padding | `--space-4xl` 0 |
| Grid | 4 columns desktop, 2 tablet, 1 mobile |
| Gap | `--space-lg` |

**Feature Card**:
- Padding: `--space-xl`
- Border Radius: `--radius-lg` (12px)
- Background: `var(--color-surface)`
- Border: 1px solid `var(--color-border)`
- Shadow: `var(--shadow-sm)` default, `var(--shadow-md)` on hover
- Illustration: 48x48, top-left
- Title: `--text-h3`
- Description: `--text-body`, `--color-text-secondary`
- Proof Link: `--text-small`, `--color-primary`, icon arrow

---

### Section 4: Live Demo Preview

```
┌─────────────────────────────────────────────────────────────┐
│  Section Title + Description                                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ [Tab: Dashboard] [Tab: Logs] [Tab: Incidents]       │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │                                                     │    │
│  │               [Screenshot Preview]                  │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Padding | `--space-4xl` 0 |
| Preview Container | Max 900px width, centered |
| Border Radius | `--radius-xl` (16px) |
| Shadow | `var(--shadow-lg)` |
| Border | 1px solid `var(--color-border)` |

**Tabs**:
- Style: Segmented control inside container
- Active: Filled background, primary color
- Inactive: Ghost, hover shows subtle bg

---

### Section 5: PRD Showroom

```
┌─────────────────────────────────────────────────────────────┐
│  Section Title + Description                                │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ [Tab] [Tab] [Tab] [Tab] [Tab] [Tab]                   │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │                                                       │  │
│  │  [Accordion Item 1]                                   │  │
│  │  [Accordion Item 2]                                   │  │
│  │  [Accordion Item 3]                                   │  │
│  │                                                       │  │
│  │  [Code Block / Diagram / Content]                     │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Padding | `--space-4xl` 0 |
| Background | `var(--color-background-alt)` (subtle tint) |
| Container | Full width with internal max-width |

**Tabs (6)**: Overview, Flows, API, DB, Security, Ops  
**Tab Bar**: Scrollable on mobile, centered on desktop

**Accordion**:
- Border Radius: `--radius-md`
- Padding: `--space-md` `--space-lg`
- Chevron: Right side, rotates on open
- Content: Code blocks, diagrams, bullet lists

---

### Section 6: How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  Section Title                                              │
│                                                             │
│  ┌─────┐ ─ ─ ─ ┌─────┐ ─ ─ ─ ┌─────┐ ─ ─ ─ ┌─────┐        │
│  │  1  │       │  2  │       │  3  │       │  4  │        │
│  │ Key │       │ Log │       │ Alert       │ Notify       │
│  └─────┘       └─────┘       └─────┘       └─────┘        │
└─────────────────────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Padding | `--space-4xl` 0 |
| Layout | 4 columns desktop, 2x2 tablet, stacked mobile |
| Gap | `--space-xl` |

**Step Card**:
- Number Badge: 32x32, circle, primary bg, white text
- Icon: 40x40, centered above title
- Title: `--text-h3`
- Description: `--text-body`

**Connector**:
- Dotted line, `--color-border`
- Hidden on mobile (cards stack vertically)

---

### Section 7: Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│  Section Title                                              │
│                                                             │
│  [Next.js] [React] [Vercel] [Neon] [GitHub Actions]        │
└─────────────────────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Padding | `--space-3xl` 0 |
| Layout | Flex, center, wrap, gap `--space-xl` |

**Logo**:
- Size: 48x48 (desktop), 40x40 (mobile)
- Filter: grayscale(1) opacity(0.6) default
- Hover: grayscale(0) opacity(1)
- Transition: 200ms ease

---

### Section 8: CTA Footer

```
┌─────────────────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────────────────┐  │
│  │                                                       │  │
│  │       Ready to explore?                              │  │
│  │       [Primary CTA]    [Secondary CTA]               │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  [Footer Links]                        [Social] [GitHub]    │
└─────────────────────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| CTA Card Padding | `--space-3xl` |
| CTA Card Radius | `--radius-xl` |
| CTA Card Background | Gradient (primary to accent) |
| Footer Padding | `--space-2xl` |
| Footer Background | `var(--color-surface)` |

---

## 3. Navbar Specification

### Structure

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]     [Features] [Demo] [PRD] [Stack]    [Login][Sign Up]
└─────────────────────────────────────────────────────────────┘
```

### Properties

| Property | Value |
|----------|-------|
| Height | 64px |
| Position | `sticky`, `top: 0` |
| Z-Index | `50` |
| Background | `rgba(var(--bg-rgb), 0.8)` + `backdrop-filter: blur(12px)` |
| Border Bottom | 1px solid `var(--color-border)` (appears on scroll) |
| Padding | 0 `--space-lg` |
| Max Width | 1280px, centered |

### Scroll Behavior

| State | Background | Border |
|-------|------------|--------|
| At top | Transparent | None |
| Scrolled | Semi-transparent + blur | 1px border |

**Implementation**:
```javascript
// Pseudo-code
onScroll: if (scrollY > 20) addClass('scrolled')
```

### Anchor Links

| Link | Target Section |
|------|---------------|
| Features | #features |
| Demo | #demo |
| PRD | #prd-showroom |
| Stack | #tech-stack |

**Active State**: Underline + primary color when section is in viewport

### Buttons

| Button | Style | Size |
|--------|-------|------|
| Login | Ghost (border only) | `--text-small`, padding `--space-sm` `--space-md` |
| Sign Up | Primary (filled) | `--text-small`, padding `--space-sm` `--space-lg` |

### Mobile Menu

| Property | Value |
|----------|-------|
| Trigger | Hamburger icon (24x24), right side |
| Panel | Slide-in from right, 280px width |
| Overlay | Semi-transparent black, click to close |
| Content | Stacked links + Login + Sign Up (full width) |
| Animation | 200ms ease-out |

**Mobile CTA Behavior**:
- Option A: Sign Up inside hamburger menu (full width button at bottom)
- Option B: Floating bottom bar with Sign Up (persistent) — **Recommended**

---

## 4. Visual Style

### Palette Option 1: Indigo Primary + Cyan Accent (Recommended)

| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| `--color-primary` | `#6366f1` (Indigo 500) | `#818cf8` (Indigo 400) |
| `--color-primary-hover` | `#4f46e5` (Indigo 600) | `#6366f1` (Indigo 500) |
| `--color-accent` | `#06b6d4` (Cyan 500) | `#22d3ee` (Cyan 400) |
| `--color-background` | `#ffffff` | `#0a0a0f` |
| `--color-surface` | `#f9fafb` | `#16161d` |
| `--color-surface-subtle` | `#f3f4f6` | `#1e1e28` |
| `--color-text-primary` | `#111827` | `#f9fafb` |
| `--color-text-secondary` | `#6b7280` | `#9ca3af` |
| `--color-border` | `#e5e7eb` | `#2e2e3a` |
| `--color-success` | `#10b981` | `#34d399` |
| `--color-warning` | `#f59e0b` | `#fbbf24` |
| `--color-error` | `#ef4444` | `#f87171` |

### Palette Option 2: Emerald Primary + Amber Accent

| Token | Dark Mode |
|-------|-----------|
| `--color-primary` | `#10b981` (Emerald 500) |
| `--color-accent` | `#f59e0b` (Amber 500) |

### Gradients

| Usage | Value |
|-------|-------|
| Hero Mesh | Radial gradients: primary at 20% opacity, accent at 15%, positioned top-right and bottom-left |
| CTA Card | `linear-gradient(135deg, var(--color-primary), var(--color-accent))` |
| Hover Glow | `box-shadow: 0 0 40px var(--color-primary) at 20% opacity` |

### Background Texture

- **Subtle Grid**: CSS grid pattern at 2% opacity
- **Noise Overlay**: SVG noise filter at 3% opacity (optional)
- **Gradient Orbs**: Blurred circles (200-400px) positioned at corners

### Card Styling

| Property | Value |
|----------|-------|
| Border Radius | `--radius-lg` (12px) |
| Border | 1px solid `var(--color-border)` |
| Background | `var(--color-surface)` |
| Shadow (default) | `0 1px 3px rgba(0,0,0,0.1)` |
| Shadow (hover) | `0 4px 12px rgba(0,0,0,0.15)` |
| Transition | `all 200ms ease` |

---

## 5. Micro-Interactions

### Hover States

| Element | Effect |
|---------|--------|
| Feature Cards | `transform: translateY(-4px)`, shadow increase |
| Buttons | Background darken 10%, scale(1.02) |
| Links | Underline slide-in from left |
| Logo Pills | Scale(1.05), border color to primary |
| Tech Logos | Color reveal (grayscale to full color) |

### Focus States

| Element | Effect |
|---------|--------|
| All Interactive | `outline: 2px solid var(--color-primary)`, `outline-offset: 2px` |
| Buttons | Same + subtle glow |
| Cards | Ring around card |

### Scroll Animations

| Element | Animation | Trigger |
|---------|-----------|---------|
| Section Headers | Fade up + slide (20px) | In viewport |
| Feature Cards | Staggered fade up (50ms delay each) | In viewport |
| Credibility Pills | Subtle bounce | On load |
| How It Works | Sequential reveal left-to-right | In viewport |

**Reduced Motion**:
```css
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

### Pulsing Signal Dot

**Usage Rules** (very limited):
- ✅ One dot next to "Live" status indicator in demo preview
- ✅ One dot on Sign Up button after 10s delay (subtle attention)
- ❌ Never more than 2 dots visible simultaneously
- ❌ Never on static content

**Dot Spec**:
- Size: 8px
- Color: `var(--color-success)`
- Animation: `pulse 2s ease-in-out infinite`
- Keyframes: Scale 1 → 1.5 → 1, opacity 1 → 0.5 → 1

---

## 6. Components Plan

### Reuse from `components/ui/*`

| Component | Usage |
|-----------|-------|
| `Button` | CTAs, nav buttons |
| `Card` | Feature cards, step cards |
| `Badge` | Credibility pills, status tags |
| `CodeBlock` | PRD showroom code snippets |
| `Dialog` | Mobile menu (or custom drawer) |

### New Components (`components/landing/*`)

| Component | Purpose |
|-----------|---------|
| `LandingNavbar.tsx` | Sticky nav with scroll behavior |
| `HeroSection.tsx` | Hero layout + terminal animation |
| `CredibilityStrip.tsx` | Horizontal scrolling pills |
| `FeatureGrid.tsx` | 8-card grid with hover states |
| `DemoPreview.tsx` | Tabbed screenshot viewer |
| `PRDShowroom.tsx` | Tabbed accordion with content |
| `HowItWorks.tsx` | 4-step flow with connectors |
| `TechStack.tsx` | Logo cloud with hover effects |
| `CTAFooter.tsx` | Gradient CTA card + footer |
| `AnimatedTerminal.tsx` | Typing animation component |
| `SignalDot.tsx` | Pulsing dot indicator |

---

## 7. Accessibility Checklist

| Requirement | Implementation |
|-------------|----------------|
| **Color Contrast** | All text meets WCAG AA (4.5:1 normal, 3:1 large) |
| **Focus Visible** | 2px primary outline on all interactive elements |
| **Keyboard Navigation** | Tab order follows visual order; Enter/Space activates |
| **Skip Link** | Hidden "Skip to main content" link on focus |
| **ARIA Labels** | Hamburger: `aria-label="Open menu"`, tabs: `role="tablist"` |
| **Reduced Motion** | All animations disabled via `prefers-reduced-motion` |
| **Alt Text** | All images/icons have descriptive alt or `aria-hidden` |
| **Heading Hierarchy** | Single `h1`, proper `h2`/`h3` nesting |
| **Link Purpose** | All links have clear text or `aria-label` |
| **Touch Targets** | Minimum 44x44px on mobile |

---

## 8. Asset Requirements

### Icons (20x20 default size)

| Name | Usage |
|------|-------|
| `check-circle` | Feature cards |
| `shield` | Security pill |
| `database` | DB pill |
| `git-branch` | GitHub references |
| `terminal` | Log ingestion |
| `alert-triangle` | Incidents |
| `bell` | Notifications |
| `key` | API keys |
| `users` | Multi-tenant |
| `lock` | RBAC |
| `chevron-right` | Links, accordion |
| `menu` | Hamburger |
| `x` | Close menu |
| `arrow-right` | CTAs |
| `external-link` | External links |
| `github` | GitHub logo |

### Illustrations (Line Art Style)

- Hero terminal mockup
- Feature card icons (8 unique)
- How-it-works step icons (4)
- Empty state / mascot (optional)

### Tech Logos

- Next.js
- React
- Vercel
- Neon (Postgres)
- GitHub Actions

---

## Next Step

Run **PULSEOPS_LANDING_03_COPY_PACK_CUTE** to write final copy aligned to this design specification.
