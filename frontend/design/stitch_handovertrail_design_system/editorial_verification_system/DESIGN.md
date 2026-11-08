---
name: Editorial Verification System
colors:
  surface: '#fff8f5'
  surface-dim: '#e3d8d2'
  surface-bright: '#fff8f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fdf1eb'
  surface-container: '#f7ece5'
  surface-container-high: '#f2e6e0'
  surface-container-highest: '#ece0da'
  on-surface: '#201a17'
  on-surface-variant: '#4d4540'
  inverse-surface: '#352f2b'
  inverse-on-surface: '#faeee8'
  outline: '#7f756f'
  outline-variant: '#d0c4bd'
  surface-tint: '#655d57'
  primary: '#2f2925'
  on-primary: '#ffffff'
  primary-container: '#463f3a'
  on-primary-container: '#b5aaa4'
  inverse-primary: '#cfc4bd'
  secondary: '#7c5549'
  on-secondary: '#ffffff'
  secondary-container: '#ffccbc'
  on-secondary-container: '#7a5448'
  tertiary: '#17301c'
  on-tertiary: '#ffffff'
  tertiary-container: '#2d4630'
  on-tertiary-container: '#97b398'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ece0d9'
  primary-fixed-dim: '#cfc4bd'
  on-primary-fixed: '#201b16'
  on-primary-fixed-variant: '#4d4540'
  secondary-fixed: '#ffdbd0'
  secondary-fixed-dim: '#edbbac'
  on-secondary-fixed: '#2f140b'
  on-secondary-fixed-variant: '#613e33'
  tertiary-fixed: '#cceacc'
  tertiary-fixed-dim: '#b1ceb1'
  on-tertiary-fixed: '#07200e'
  on-tertiary-fixed-variant: '#334d36'
  background: '#fff8f5'
  on-background: '#201a17'
  surface-variant: '#ece0da'
typography:
  display-stat:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '500'
    lineHeight: 44px
    letterSpacing: -0.03em
  headline-page:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-page-mobile:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-section:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-default:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22.4px
    letterSpacing: -0.005em
  body-medium:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 22.4px
    letterSpacing: -0.005em
  label-caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-mono-metadata:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 3rem
  margin-tablet: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes an atmosphere of calm authority, meticulous documentation, and quiet luxury. Designed for high-stakes operational knowledge transfers, the UI deliberately rejects standard SaaS gloss, neon accents, and heavy containerization. Instead, it treats enterprise handovers with the rigor of legal briefs and architectural folios.

The aesthetic blends the surgical precision of Linear, the informational hierarchy of the Stripe Dashboard, and the structural calm of Notion. Visual tension is resolved through generous, disciplined whitespace, hairline borders, and an analog-inspired tactile balance. The interface feels reassuring, archival, and definitive—elevating administrative reviews into deliberate sign-offs.

## Colors

The palette avoids synthetic cool-greys, opting instead for organic, warm mineral tones that evoke archival paper, print ink, and stone.

### Core Canvas & Structure
- **Page Canvas (`#F4F3EE`):** Warm parchment providing an earthy, non-glare foundation.
- **Card & Surface Background (`#FFFFFF`):** Pure white used strategically to elevate content nodes from the parchment canvas.
- **Border Default (`#E7E4DE`):** Hairline container definition matching the parchment undertone.
- **Border Inactive / Structural Rule (`#BCB8B1`):** Muted silver for unselected states, horizontal rules, and framing dividers.

### Content & Intent
- **Primary Ink (`#463F3A`):** Deep taupe for primary headings, body titles, active pills, and high-emphasis controls. Never use pitch black (`#000000`).
- **Secondary Ink (`#8A817C`):** Grey-olive for supporting metadata, subheadings, and contextual descriptions.
- **Accent Powder Blush (`#E0AFA0`):** Reserved for focal points, evidence highlights, and selected records. Used as a tint (`rgba(224, 175, 160, 0.15)`) for background selections.

### Semantic Status (Restrained & Muted)
Status badges must remain desaturated, preserving document calm:
- **Verified (`#5F7A61`):** Muted sage for validated transfers and completed trails.
- **Inferred (`#6B7F94`):** Slate blue for derived, non-authoritative knowledge.
- **Conflicting (`#C9822B`):** Warm ochre amber for discrepancies requiring audit.
- **Missing Evidence (`#8A817C`):** Subdued grey-olive for unevidenced handover items.

## Typography

Typography relies on a disciplined single-family hierarchy powered by Inter. Strict adherence to an 8px vertical baseline grid ensures rhythmic consistency across both high-density data tables and editorial documentation panels.

Text is set with slightly tightened letter-spacing at display scales to establish an authoritative print feeling, while body copy preserves an open 1.6 relative line height to facilitate long-form document verification without fatigue. All label roles utilize uppercase or elevated tracking only where semantic metadata needs clear disambiguation from adjacent narrative prose.

## Layout & Spacing

The layout model is anchored by a structured 12-column grid capped at a maximum width of 1440px to retain an editorial reading measure. 

### Breakpoint Strategy
- **Desktop (1024px+):** 12-column layout with 24px gutters and 48px outer margins. Supports two-pane inspection views: a primary document stream (7–8 columns) paired with an evidence-audit sidebar (4–5 columns).
- **Tablet (768px – 1023px):** 8-column layout with 20px gutters and 24px margins. Auditor panel collapses into an off-canvas drawer.
- **Mobile (< 768px):** 4-column layout with 16px gutters and 16px margins. Information flows linearly in a single column; floating bars span edge-to-edge.

Spacial pacing follows multiples of 8px (with 4px reserved for tight internal metadata spacing). White space should remain deliberate and unoccupied to emphasize key verification artifacts.

## Elevation & Depth

Depth is established primarily via surface distinction and tactile hairline borders, not dramatic drop shadows.

- **Level 0 (Canvas):** Pure `#F4F3EE`. Completely un-elevated.
- **Level 1 (Card & Module Layer):** Crisp white `#FFFFFF`, bordered with 1px solid `#E7E4DE`. Uses a micro-ambient shadow: `0 1px 2px rgba(70, 63, 58, 0.06)`.
- **Level 2 (Floating Top Navigation & Modals):** Crisp white `#FFFFFF`, bordered with 1px solid `#E7E4DE`, accompanied by a quiet float shadow: `0 4px 16px -2px rgba(70, 63, 58, 0.08)`.
- **Evidence Highlight Inset:** Recessed containers sit directly on cards using `#F4F3EE` backgrounds with a left accent border: 3px solid `#E0AFA0`.

No glassmorphism, blur effects, or heavy drop shadows are permitted. Depth remains physical, flat, and architectural.

## Shapes

The geometric architecture pairs soft, approachable perimeter containers with tailored interactive shapes:

- **Panels & Cards:** 16px corner radius (`rounded-lg` token variant) for a quiet frame around dense copy.
- **Form Controls & Action Triggers:** 10px corner radius across input fields, textareas, and standard buttons to create crisp interactive touch targets.
- **Navigation Pills & Status Indicators:** 999px full pill geometry, reinforcing state tags as distinct physical chips.
- **Iconography:** Monoline 1.5px stroke weight (Lucide style) with rounded joins matching container softness.

## Components

### Top Navigation Bar
- A detached floating bar suspended at the page top: height 64px, background `#FFFFFF`, border `1px solid #E7E4DE`, corner radius `16px`, shadow `0 4px 16px -2px rgba(70, 63, 58, 0.08)`.
- Contains the "HandoverTrail" wordmark in `headline-section` (`#463F3A`), a segmented navigation cluster, the persona switcher ("View as: Riya Sharma / Maya / Arjun") framed in an inactive border, and global review status pills.

### Buttons
- **Primary:** Background `#463F3A`, foreground `#FFFFFF`, border none, 10px radius, padding 10px 18px. Hover: `#37312D`. Active: `#2B2724`.
- **Secondary / Outline:** Background `#FFFFFF`, foreground `#463F3A`, border `1px solid #BCB8B1`, 10px radius, padding 10px 18px. Hover: background `#F4F3EE`.
- **Ghost:** Background transparent, foreground `#8A817C`, 10px radius. Hover: foreground `#463F3A`, background `rgba(70,63,58,0.05)`.

### Chips & Status Badges
- **Pill Navigation Items:** Unselected: transparent background, `#8A817C` text. Selected: filled `#463F3A`, text `#FFFFFF`, radius 999px.
- **Status Badges:** Radius 999px, padding 4px 10px, typography `label-caption`. Built with a soft tinted background (12% opacity of token color) paired with solid glyph and label ink:
  - *Verified:* Background `rgba(95, 122, 97, 0.12)`, text `#5F7A61`.
  - *Inferred:* Background `rgba(107, 127, 148, 0.12)`, text `#6B7F94`.
  - *Conflicting:* Background `rgba(201, 130, 43, 0.12)`, text `#C9822B`.
  - *Missing Evidence:* Background `rgba(138, 129, 124, 0.12)`, text `#8A817C`.

### Form Inputs & Checkboxes
- **Inputs:** 10px radius, height 40px, background `#FFFFFF`, border `1px solid #BCB8B1`, typography `body-default`. Focus: border `1.5px solid #463F3A`, outline none.
- **Checkboxes:** 18px × 18px, 4px radius, border `1.5px solid #BCB8B1`. Checked: background `#463F3A`, border-color `#463F3A`, white check icon.

### Cards & Evidence Blocks
- **Card:** Background `#FFFFFF`, border `1px solid #E7E4DE`, radius 16px, padding 24px, subtle shadow `0 1px 2px rgba(70,63,58,0.06)`.
- **Evidence Quote / Annotation:** Inset container, background `rgba(224, 175, 160, 0.12)`, border-left `3px solid #E0AFA0`, radius `0 8px 8px 0`, padding 12px 16px. Inline evidence tags use powder blush highlights under key claims.

### Handover Audit Trails & Sign-off Timeline
- Vertical 1.5px rule in `#E7E4DE` connecting step nodes.
- Completed verification nodes display a 24px circle in `#5F7A61` with a white check icon; disputed or missing steps display an outline circle in `#BCB8B1` with a 6px inner dot in `#C9822B`.