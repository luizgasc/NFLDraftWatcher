# STYLE_GUIDE.md

## Visual direction

This product should feel:

- clean
- modern
- data-driven
- premium without looking luxurious
- sports-oriented without looking childish
- social without looking noisy

The visual language should communicate **clarity, speed, and confidence**.

Avoid visual excess.

---

## Design principles

### 1. Data first
Interfaces must make rankings, boards, player data, and news easy to scan.

### 2. Strong hierarchy
Every screen should make it obvious:
- what is primary
- what is secondary
- what is interactive
- what is contextual

### 3. Low-noise UI
Use whitespace, alignment, contrast, and typography before using borders, shadows, or color.

### 4. Consistent density
Do not mix oversized “marketing UI” with cramped “dashboard UI”.
Spacing should be compact-comfortable.

### 5. Component-driven visuals
Pages should look like they were assembled from a clear system, not handcrafted independently.

---

## Recommended component approach

### Primary recommendation
Use **shadcn/ui** as the component foundation.

### Why this fits the project
- strong fit for a clean modern product
- works well with Tailwind-based systems
- easy to adapt into a custom visual identity
- good match for dashboards, filters, dialogs, tables, cards, forms, sheets, tabs, and command menus

### Usage rule
Do not use components with default styling blindly.
Every imported component must conform to this guide.

### Secondary building blocks
Use:
- `shadcn/ui` for app components
- `Radix primitives` where low-level control is needed
- `lucide-react` for icons

---

## Brand personality

The brand should feel:

- analytical
- current
- sharp
- credible
- fast
- community-driven

It should **not** feel:

- playful
- cartoonish
- hyper-aggressive
- cluttered
- neon-heavy
- overly corporate

---

## Color system

### Base philosophy
Use a restrained palette.

Most of the UI should rely on:
- neutrals
- subtle surfaces
- one strong accent
- one semantic danger color
- one semantic success color

### Core palette

#### Neutral base
- Background: near-white or near-black depending on theme
- Foreground: high-contrast neutral
- Muted background: soft gray layer
- Muted foreground: subdued text gray
- Border: low-contrast gray
- Card: slightly elevated neutral surface

#### Accent
Use a single accent color for:
- active states
- links
- focus rings
- selected controls
- charts where emphasis is needed

Recommended accent direction:
- electric blue
- deep indigo
- blue-violet

Avoid red as the primary accent because it competes with sports urgency and error states.

### Semantic colors
- Success: controlled green
- Warning: amber
- Danger: restrained red
- Info: accent color

### Color usage rules
- Accent color should be used sparingly
- Do not color everything interactive
- Use semantic colors only for real status meaning
- Never rely on color alone to communicate meaning

---

## Suggested token model

```css
--background
--foreground
--card
--card-foreground
--popover
--popover-foreground
--muted
--muted-foreground
--border
--input
--primary
--primary-foreground
--secondary
--secondary-foreground
--accent
--accent-foreground
--destructive
--destructive-foreground
--success
--warning
--ring