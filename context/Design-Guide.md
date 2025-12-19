# VineSight Design System — 4pt Grid Compliance

**Status:** Enforced  
**Scope:** All product UI (design + frontend implementation)

---

## 0. Global 4pt Rule (Non‑Negotiable)

All spacing, sizing, radius, and typography values must be **multiples of 4**.

- ❌ No odd numbers
- ❌ No arbitrary pixel values like `10px`, `14px`, `22px` (unless explicitly listed as an exception)
- ✅ All dimensions ∈ `{4, 8, 12, 16, 20, 24, 32, 40, 48, …}`

If a value is **not divisible by 4**, it is **invalid**, except for documented exceptions.

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

---

## 2. Spacing System (4pt Tokens)

The spacing system is **tokenized and closed**. Use only the tokens below.

| Token | Size |
| ----- | ---- |
| XS    | 4px  |
| SM    | 8px  |
| MD    | 16px |
| LG    | 24px |
| XL    | 32px |
| XXL   | 40px |
| XXXL  | 48px |

**Rules**

- Use these tokens for margin, padding, gap, etc.
- ❌ No intermediate values like `12px`, `20px` unless they are explicitly added to this table.
- If you need a new token, propose it in design review and then add it here.

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

---

## 9. Suggested LLM Review Usage (Optional)

When using an LLM as a code reviewer for this design system, provide:

- This file as **the design-system spec**, and
- The landing page markup + styles to analyze.

Ask the LLM to:

1. List all violations with:
   - Location (selector / component, property),
   - Current value,
   - Reason it violates the system,
   - Proposed fix using the nearest valid scale value.
2. Output updated HTML/CSS (or JSX + styles) that is fully 4pt-compliant.

---

**Summary**

VineSight uses a strictly enforced **4pt grid** for all UI geometry.  
Design, frontend, and any layout-impacting code must comply with this document.
