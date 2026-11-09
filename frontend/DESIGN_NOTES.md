# HandoverTrail Frontend Design Analysis & Notes

> **Source of Truth**: Extracted from `/design/stitch/` HTML files, PNG mockups, and `editorial_verification_system/DESIGN.md`.
> **Alignment Rule**: Inconsistencies across screens are resolved toward the **Review Workspace** (`/review`) styling standard.

---

## 1. Extracted Design Tokens

### A. Color Palette
The design system establishes an atmosphere of calm authority, tactile mineral tones, and architectural rigor. Neon colors, SaaS glossy gradients, dark mode, and pure black (`#000000`) are strictly avoided.

| Token Name | Hex Code | Tailwind / CSS Variable | Usage in Application |
|---|---|---|---|
| **Page Canvas** | `#F4F3EE` | `bg-parchment` / `--bg-parchment` | Primary page background across all routes |
| **Surface Card** | `#FFFFFF` | `bg-white` / `--bg-card` | Content cards, floating header, modals, panels |
| **Surface Recessed** | `#F7ECE5` / `#FDF1EB` | `bg-surface-recessed` | Sub-cards, input container background, callouts |
| **Border Default** | `#E7E4DE` | `border-border` / `--border-default` | 1px hairline container definition, dividers |
| **Border Inactive** | `#BCB8B1` | `border-silver` / `--border-inactive` | Rules, unselected filter borders, input borders |
| **Primary Ink** | `#463F3A` | `text-primary` / `bg-primary` | Headings, primary buttons, active pill navigation |
| **Secondary Ink** | `#8A817C` | `text-secondary` / `--text-secondary` | Metadata, captions, timestamps, descriptions |
| **Accent Powder Blush** | `#E0AFA0` | `bg-blush` / `border-blush` | Selected claim border, quote `<mark>`, freeze peak bar |
| **Blush Tint (12%)** | `rgba(224, 175, 160, 0.12)` | `bg-blush-subtle` | Recessed quote highlight containers, callouts |

### B. Semantic Verification Status Tokens (Icon + Text mandatory)
All status badges pair a 12% desaturated background with solid glyph and label ink:

| Status | Hex Code | Background (12% tint) | Lucide Icon | Usage |
|---|---|---|---|---|
| **Verified** | `#5F7A61` (Muted Sage) | `rgba(95, 122, 97, 0.12)` | `<CheckCircle2 />` or `<Check />` | Exact quote verified in evidence |
| **Inferred** | `#6B7F94` (Slate Blue) | `rgba(107, 127, 148, 0.12)` | `<HelpCircle />` or `<Info />` | Derived assumption lacking quote |
| **Conflicting** | `#C9822B` (Warm Ochre) | `rgba(201, 130, 43, 0.12)` | `<AlertTriangle />` | Discrepant cross-source claims |
| **Missing Evidence** | `#8A817C` (Grey-Olive) | `rgba(138, 129, 124, 0.12)` | `<HelpCircle />` | Unsubstantiated knowledge gap |

### C. Typography Scale (Inter Font Family)
Typography is locked to a single disciplined family (`Inter`) on an 8px vertical grid:

| Scale Name | Font Size | Line Height | Letter Spacing | Font Weight | Tailwind Class |
|---|---|---|---|---|---|
| `display-stat` | 36px | 44px | -0.03em | 500 (Medium) | `text-display-stat` |
| `headline-page` | 28px | 36px | -0.02em | 600 (Semibold) | `text-headline-page` |
| `headline-section` | 16px | 24px | -0.01em | 600 (Semibold) | `text-headline-section` |
| `body-default` | 14px | 22.4px | -0.005em | 400 (Regular) | `text-body-default` |
| `body-medium` | 14px | 22.4px | -0.005em | 500 (Medium) | `text-body-medium` |
| `label-caption` | 12px | 16px | +0.01em | 500 (Medium) | `text-label-caption` |
| `label-mono-metadata` | 11px | 14px | +0.04em | 600 (Semibold uppercase) | `text-label-mono-metadata` |

### D. Radii Scale
- **Pills / Status Chips**: `rounded-full` (`9999px`)
- **Containers / Panels / Cards**: `rounded-2xl` (`16px`)
- **Top Navigation Bar**: `rounded-xl` (`12px`)
- **Interactive Controls & Buttons**: `rounded-[10px]` (`10px`)
- **Small Badges / Micro Tags**: `rounded-md` (`6px`)

### E. Shadows & Depth
- **Level 0 (Canvas)**: None (flat `#F4F3EE`)
- **Level 1 (Cards & Modules)**: `shadow-[0_1px_2px_rgba(70,63,58,0.06)]` with 1px border `#E7E4DE`
- **Level 2 (Floating Header & Modals)**: `shadow-[0_4px_16px_-2px_rgba(70,63,58,0.08)]` with 1px border `#E7E4DE`

---

## 2. Shared Shell (`AppShell`)

Every page shares a unified shell:
1. **Floating Top Bar**:
   - Fixed height 64px, maximum width `max-w-7xl`, suspended with `top-4` padding.
   - Left: Wordmark `HandoverTrail` (with circular dot) and Project Name tag `/ CampusConnect`.
   - Center: Segmented navigation pills:
     - `Dashboard` (`/dashboard`)
     - `Review` (`/review`)
     - `Timeline` (`/timeline`)
     - `Gaps` (`/gaps`)
     - `Handover` (`/handover`)
   - Right:
     - Global review state pill (`In review` in blush or `Approved` in sage).
     - **ViewAs Persona Selector**: Dropdown allowing instant switching between:
       - `Riya Sharma` (Leaver, Clearance 2)
       - `Maya Patel` (Lead / Approver, Clearance 2)
       - `Arjun Rao` (Successor, Clearance 1)
     - Notifications & Help icons (Lucide monoline 1.5px).
2. **Docked Footer**:
   - Border-top `1px solid #E7E4DE`, background `#F4F3EE` or white.
   - Disclaimer: *"HandoverTrail — Synthetic demo data for verification review"*.
   - Nav links: *Protocol Brief*, *Audit Logs*, *Export Artifact*, *Security Specs*.

---

## 3. Screen-to-Route Mapping & Reusable Components

| Stitch Screen Directory | Application Route | Purpose & Primary Interactions | Reusable Components Used |
|---|---|---|---|
| `start_page/` | `/` | Onboarding screen: 4-step process bento, primary "Load demo project" CTA. | `AppShell` (minimal), `StatCard`, `Button`, `TrustPoints` |
| `dashboard/` | `/dashboard` | Executive overview: project activity, readiness donut, claims by type, open gaps preview, next step sign-off card, "Run analysis" modal. | `AppShell`, `ActivityBarChart`, `ReadinessDonut`, `ClaimsByTypeBars`, `GapCard`, `StatCard`, `ProgressStepsModal` |
| `review_workspace/` | `/review` | Three-pane inspection workspace: filter rail, claims stream with selection, evidence drawer with exact quote highlighting, sticky review progress bar, approval modal. | `AppShell`, `FilterRail`, `ClaimCard`, `EvidenceDrawer`, `StatusBadge`, `TypeChip`, `AccessChip`, `StickyReviewBar`, `ConfirmDialog` |
| `timeline/` | `/timeline` | Month-grouped chronological project milestones and architectural decisions. Clicking milestones opens evidence drawer. | `AppShell`, `TimelineItem`, `EvidenceDrawer`, `StatusBadge`, `SearchInput` |
| `gaps/` | `/gaps` | Conflict cards with side-by-side Box A vs Box B quotes, discrepancy callouts, leaver response textarea + submit action. | `AppShell`, `GapCard`, `SideBySideConflict`, `StatusBadge`, `Button` |
| `handover/` | `/handover` | Role-filtered final transition document for successor: First 7 days checklist, What you now own, risks, dependencies, directory table, Acknowledge receipt CTA. | `AppShell`, `FirstSevenDaysCard`, `HiddenItemsBanner`, `EvidenceDrawer`, `StatusBadge`, `TypeChip`, `Button` |

---

## 4. Inconsistencies & Resolution Decisions

| Screen Area | Inconsistency in HTML | Resolution Decision (Review Workspace Standard) |
|---|---|---|
| **Icons** | Stitch HTML uses Google Material Symbols web font (`data-icon`). | Replaced with native **Lucide React** icons (`strokeWidth={1.5}`) for zero external network dependency, reliable rendering, and consistent line weight. |
| **Persona Names** | Stitch HTML varies between "Arjun Mehta" and "Arjun Rao", "Maya Lin" and "Maya Patel". | Standardized to **CONTRACT.md canonical users**: `Riya Sharma` (leaver), `Maya Patel` (lead), `Arjun Rao` (successor). |
| **Claim Counts** | Stitch HTML displays "48 claims" or "14 claims" across different screens. | Wired dynamically to real API counts (`/api/stats` and `/api/claims`). Defaults to 14 verified/conflicting synthetic claims. |
| **Card Border Radii** | Some HTML files use `rounded-xl`, others `rounded-[16px]` or `rounded-2xl`. | Standardized to `16px` (`rounded-2xl`) for content cards and `10px` (`rounded-[10px]`) for buttons and inputs. |
| **Background Color** | Some screens use `#fff8f5`, others `#F4F3EE`. | Standardized to the approved **warm parchment `#F4F3EE`** specified in `DESIGN.md`. |

