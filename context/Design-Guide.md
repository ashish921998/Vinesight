# VineSight Design System — 4pt Grid Compliance

**Status:** Enforced  
**Scope:** All product UI (design + frontend implementation)

---

## LLM Quick Start (Read First)

Use this file as the single source of truth for UI geometry and color rules.

- **Source of truth files:** `context/Design-Guide.md`, `src/app/globals.css` (color tokens), `tailwind.config.mjs` (type/spacing/radius scales).
- **Enforce:** 4pt grid for layout + typography, and token-only colors.
- **Allowed exceptions:** chip radius 999px, icon stroke 1.75px, hairline borders/lines (1px and 0.5px), and box-shadow values (optical).
- **Output format:** list violations with file:line, rule, current value, and a token-based fix.

---

## 0. Global 4pt Rule (Non‑Negotiable)

All layout sizing, spacing, radius, and typography values must be **multiples of 4**.

- ❌ No odd numbers
- ❌ No arbitrary pixel values like `10px`, `14px`, `22px` (unless explicitly listed as an exception)
- ✅ All dimensions ∈ `{4, 8, 12, 16, 20, 24, 32, 40, 48, …}`

If a value is **not divisible by 4**, it is **invalid**, except for documented exceptions.

**Scope note:** The 4pt rule applies to layout dimensions and typography. Border widths and box-shadow values are exempt unless they affect layout.

---

## 1. Typography (4pt‑Aligned)

### 1.1 Type Scale

| Role | Size | Weight | Usage           |
| ---- | ---- | ------ | --------------- |
| H1   | 24px | 600    | Page titles     |
| H2   | 20px | 600    | Section headers |
| H3   | 16px | 600    | Card titles     |
| Body | 16px | 400    | Default body    |
| Meta | 12px | 400    | Labels, dates   |

**Rules**

- Body text is **16px**, not 14px.
- Do not introduce new font sizes without updating this table.

### 1.2 Line Heights

All line heights are also on the 4pt grid.

| Text | Line height |
| ---- | ----------- |
| H1   | 32px        |
| H2   | 28px        |
| H3   | 24px        |
| Body | 24px        |
| Meta | 16px        |

**Rationale**

- Better readability (including “sunlight” / low-contrast scenarios)
- Improved accessibility
- More comfortable for long reading sessions

### 1.3 Tailwind Typography Tokens

**Preferred classes**

- `text-h1`, `text-h2`, `text-h3`, `text-body`, `text-meta`

**Allowed aliases (mapped in Tailwind)**

- `text-xs`, `text-sm` -> 12px (Meta)
- `text-base` -> 16px (Body)
- `text-lg` -> 20px (H2)
- `text-xl` -> 24px (H1)

Avoid `text-2xl` and above for product UI unless a new Display scale is added here.

---

## 2. Spacing System (4pt Tokens)

The spacing system is **tokenized and closed**. Use only the tokens below.

| Token | Size |
| ----- | ---- |
| XS    | 4px  |
| SM    | 8px  |
| SM+   | 12px |
| MD    | 16px |
| LG    | 24px |
| XL    | 32px |
| XXL   | 40px |
| XXXL  | 48px |

**Rules**

- Use these tokens for margin, padding, gap, etc.
- ❌ No intermediate values like `10px`, `14px`, `18px`, `20px`, `22px` unless they are explicitly added to this table.
- If you need a new token, propose it in design review and then add it here.

**Tailwind Mapping**

- `1=4px`, `2=8px`, `3=12px`, `4=16px`, `6=24px`, `8=32px`, `10=40px`, `12=48px`

---

## 3. Radius (4pt Grid)

| Component | Old   | New   | Status              |
| --------- | ----- | ----- | ------------------- |
| Cards     | 12px  | 12px  | ✅ On‑grid          |
| Buttons   | 10px  | 8px   | ✅ Fixed            |
| Inputs    | 10px  | 8px   | ✅ Fixed            |
| Chips     | 999px | 999px | ✅ Exception (pill) |

**Rules**

- All radii must be multiples of 4, **except** documented exceptions.
- Chip radius **999px** is a **deliberate exception** for pill-shaped chips.
- Do not introduce new radii without aligning to the 4pt grid.

**Tailwind Mapping**

- `rounded`, `rounded-sm`, `rounded-md`, `rounded-lg` -> 8px
- `rounded-xl`, `rounded-2xl`, `rounded-3xl` -> 12px
- `rounded-full` -> 999px (chips/pills only)

---

## 4. Component Heights (Standardized)

### 4.1 Buttons

- Min height: **48px** (not 44px)
- Horizontal padding: **16px**
- Vertical padding: **12px**

### 4.2 Inputs

- Height: **48px**
- Padding: **12px** vertical / **16px** horizontal

### 4.3 List Rows

- Default min height: **56px**
- Dense variant: **48px**

---

## 5. Icons

- Allowed icon sizes: **16px**, **20px**, **24px** only
- Icon stroke width: **1.75px**
  - This is an **exception** to the 4pt rule, for optical reasons (stroke only, not layout).

---

## 6. Elevation & Motion

- Existing elevation and motion specs are considered valid and 4pt‑compliant.
- This document only constrains _pixel-based_ geometry (typography, spacing, radii, sizes, component heights).

---

## 7. Enforcement Rules

### 7.1 What Causes a Rejection

A PR **must be rejected** if it introduces **any** of the following:

- Any `px` value **not divisible by 4**,
- Any custom size **outside** the defined:
  - Type scale (font sizes, line heights),
  - Spacing tokens,
  - Radius values,
  - Icon sizes,
- Any undocumented exception to the 4pt rule.

### 7.2 Allowed Exceptions (Explicit)

The only currently allowed exceptions are:

- Chip radius: **999px** (pill shape)
- Icon stroke width: **1.75px**
- Hairline borders/lines: **1px** (and **0.5px** for decorative outlines only)
- Box-shadow values (optical; not subject to the 4pt grid)

### 7.3 Adding a New Exception

Any new exception **must**:

1. Be justified in writing (why 4pt cannot be applied).
2. Be added to this document in an **Exceptions** subsection.
3. Be reviewed and approved by **design** and **engineering**.

---

## 8. Checklist for Code Reviews

Use this quick checklist when reviewing UI code:

1. **Typography**
   - Font sizes are in the type scale.
   - Body text is **16px**; Meta is **12px**.
   - Line heights match the table.

2. **Spacing**
   - All `margin`, `padding`, and `gap` values use allowed tokens.
   - No `px` values like `10px`, `14px`, `18px`, `22px`, etc.

3. **Radii**
   - Radii are multiples of 4, except chips (`999px`).

4. **Component Heights**
   - Buttons, inputs, and rows respect the standardized heights and padding.

5. **Icons**
   - Only 16 / 20 / 24px sizes.
   - Stroke width 1.75px is allowed as an exception.

6. **New Exceptions**
   - Any non-4pt value must either be removed or documented here with approval.

7. **Colors**
   - Use design tokens (e.g., `bg-background`, `text-foreground`, `bg-primary`, `bg-accent`, `border-border`).
   - ❌ No raw hex/rgba/oklch values in component markup.
   - ❌ No default palette colors like `text-gray-500`, `bg-green-50`, `border-blue-200`.

---

## 9. LLM Review Protocol (Optional)

### 9.1 Input Package

Provide the LLM with:

- This file as **the design-system spec**.
- Target markup + styles (JSX/TSX + CSS/Tailwind classes).
- `src/app/globals.css` for color tokens.
- `tailwind.config.mjs` for spacing/type/radius scales.

### 9.2 Required Output

Ask the LLM to output:

1. **Violations list** with:
   - Location (file:line or selector),
   - Rule violated,
   - Current value,
   - Reason,
   - Fix using an allowed token/value.
2. **Zero-violation response** if nothing fails:
   - State "No violations found."
   - Mention any files not reviewed.

---

## 10. Color Palette (Tokens)

**Source of Truth**

- `src/app/globals.css` defines all CSS variables for light and dark themes.
- Do not define or override colors elsewhere.

### 10.1 Core Palette (Light Theme)

| Token             | Value   | Usage                           |
| ----------------- | ------- | ------------------------------- |
| Primary           | #2F3A44 | Brand / primary surfaces        |
| Accent / Action   | #6F8F5E | CTAs, highlights, active states |
| Background        | #FAFAF8 | App background                  |
| Text (Foreground) | #1C1C1C | Default body text               |

### 10.2 Semantic Tokens (Light Theme)

| Token                        | Value   | Usage                    |
| ---------------------------- | ------- | ------------------------ |
| --background                 | #FAFAF8 | App background           |
| --foreground                 | #1C1C1C | Default text             |
| --card                       | #FFFFFF | Card surface             |
| --card-foreground            | #1C1C1C | Text on cards            |
| --popover                    | #FFFFFF | Popovers                 |
| --popover-foreground         | #1C1C1C | Popover text             |
| --primary                    | #2F3A44 | Primary surfaces         |
| --primary-foreground         | #FFFFFF | Text on primary          |
| --accent                     | #6F8F5E | Actions / highlights     |
| --accent-foreground          | #FFFFFF | Text on accent           |
| --secondary                  | #F4F4F5 | Secondary surfaces       |
| --secondary-foreground       | #1C1C1C | Text on secondary        |
| --muted                      | #F4F4F5 | Muted surfaces           |
| --muted-foreground           | #52525B | Muted text               |
| --border                     | #E4E4E7 | Borders                  |
| --input                      | #E4E4E7 | Input borders            |
| --ring                       | #6F8F5E | Focus ring               |
| --destructive                | #B42318 | Error / destructive      |
| --destructive-foreground     | #FFFFFF | Text on destructive      |
| --chart-1                    | #6F8F5E | Chart series             |
| --chart-2                    | #2F3A44 | Chart series             |
| --chart-3                    | #89A379 | Chart series             |
| --chart-4                    | #1C1C1C | Chart series             |
| --chart-5                    | #52525B | Chart series             |
| --sidebar                    | #F4F4F5 | Sidebar background       |
| --sidebar-foreground         | #1C1C1C | Sidebar text             |
| --sidebar-primary            | #2F3A44 | Sidebar primary surfaces |
| --sidebar-primary-foreground | #FFFFFF | Text on sidebar primary  |
| --sidebar-accent             | #6F8F5E | Sidebar accents          |
| --sidebar-accent-foreground  | #FFFFFF | Text on sidebar accents  |
| --sidebar-border             | #E4E4E7 | Sidebar borders          |
| --sidebar-ring               | #6F8F5E | Sidebar focus ring       |

### 10.3 Color Rules

- Use semantic tokens via Tailwind classes (`bg-background`, `text-foreground`, `bg-primary`, `text-primary-foreground`, `bg-accent`, `text-accent-foreground`, `border-border`, `ring-ring`, etc.).
- Opacity modifiers are allowed (e.g., `bg-primary/10`), but only on tokens.
- ❌ No raw hex/rgba/oklch values in component markup.
- ❌ No default palette colors like `text-gray-500`, `bg-green-50`, `border-blue-200`.
- Dark theme values live under `.dark` in `src/app/globals.css` and must keep the same token names.

---

**Summary**

VineSight uses a strictly enforced **4pt grid** and **token-only colors**.  
Design, frontend, and any layout-impacting code must comply with this document.
