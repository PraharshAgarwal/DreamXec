# DreamXec (dx-v2.0) Typography System & Font Specs

---

## 🔤 Overview & Typography Philosophy

The **DreamXec Typography System** pairs modern, geometric clarity with expressive handwritten brush accents to reflect both **structured intellectual rigor** and **creative human curiosity**:

1. **Primary Typeface — Poppins**:
   - Clean, geometric, and modern structure reflecting clarity, precision, and institutional trust.
   - Used for all interface content, navigation, headers, forms, and data tables.
2. **Secondary Typeface — Badlooking Brush**:
   - Handwritten, expressive brush style bringing a human, organic, and creative touch.
   - Used selectively for highlights, annotations, doodles, and emphasized takeaways without distracting from readability.

---

## 📚 Font Family Stacks

| Font Family Key | Secondary / Fallbacks | Primary Purpose & Usage Guidelines |
| :--- | :--- | :--- |
| **`sans` / `display` / `headline`** | `Poppins`, `Inter`, `system-ui`, `sans-serif` | **Core Application Type**: All headlines, sublines, body text, form controls, and buttons. |
| **`brush`** | `'Badlooking Brush'`, `cursive`, `sans-serif` | **Expressive Annotations**: Handwritten notes, editorial sticky annotations, impact quote highlights, and decorative doodles. |
| **`mono`** | `'Fira Code'`, `monospace` | **Financial Hashes & IDs**: Double-entry ledger transaction hashes, UUIDs, smart escrow balances, and API endpoints. |

---

## 📏 Type Hierarchy & Scale

```
┌────────────────────────────────────────────────────────────────────────┐
│  Headline (H1/Hero)   36px - 64px   Poppins Black (900)   Upper/Bold  │
├────────────────────────────────────────────────────────────────────────┤
│  Subline (H2/Sub)     20px - 28px   Poppins Medium (500)  Contextual   │
├────────────────────────────────────────────────────────────────────────┤
│  Card Title (H3)      18px - 22px   Poppins Bold (700)    Strong      │
├────────────────────────────────────────────────────────────────────────┤
│  Bodycopy (Base)      15px - 16px   Poppins Regular (400) Comfortable │
├────────────────────────────────────────────────────────────────────────┤
│  Annotation (Brush)   18px - 26px   Badlooking Brush      Handwritten │
├────────────────────────────────────────────────────────────────────────┤
│  Badges & Micro       11px - 12px   Poppins Black (900)   Uppercase   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📐 Detailed Style & Token Mapping

### 1. Headline: `Poppins Black` (900)
* **Tailwind Classes**: `font-headline font-black uppercase tracking-tight text-[#0F534A]` or `text-[#121316]`
* **Purpose**: Grabs immediate attention for hero titles, campaign names, and major milestone funding values.
* **Markup Example**:
  ```tsx
  <h1 className="text-4xl md:text-6xl font-black font-headline text-[#0F534A] leading-none uppercase tracking-tight">
    Fund Tomorrow's <span className="text-[#FE4E1A]">Breakthroughs</span>
  </h1>
  ```

### 2. Subline: `Poppins Medium` (500)
* **Tailwind Classes**: `font-sans font-medium text-base md:text-lg text-[#0F534A]/80 leading-relaxed`
* **Purpose**: Introduces sections, provides supporting context, and introduces card modules.
* **Markup Example**:
  ```tsx
  <p className="text-lg font-medium text-[#0F534A]/90">
    Milestone-governed grants with verified deliverables and dual-authorization escrow.
  </p>
  ```

### 3. Bodycopy: `Poppins Regular` (400)
* **Tailwind Classes**: `font-sans font-normal text-sm md:text-base text-gray-800 leading-relaxed`
* **Purpose**: Detailed campaign stories, milestone acceptance criteria, and FAQ content for comfortable readability.
* **Markup Example**:
  ```tsx
  <p className="text-base font-normal text-gray-700 leading-relaxed">
    Our research lab has completed the initial bench test. All sensor logs and third-party validation reports are attached for verification.
  </p>
  ```

### 4. Annotation: `Badlooking Brush` (400)
* **Tailwind Classes**: `font-brush text-xl md:text-2xl text-[#FE4E1A] -rotate-2 inline-block`
* **Purpose**: Small notes, captions, editorial highlights, or supporting information that adds human personality without cluttering the primary layout.
* **Markup Example**:
  ```tsx
  <div className="relative">
    <span className="font-brush text-2xl text-[#FE4E1A] -rotate-3 inline-block">
      100% Verified Proof of Work! 🚀
    </span>
  </div>
  ```

---

## 🎨 Typography Special Effects

### High-Impact Text Outline (`.text-outlined-forest`)
```css
.text-outlined-forest {
  text-shadow:
    -2px -2px 0 #0F534A,
     2px -2px 0 #0F534A,
    -2px  2px 0 #0F534A,
     2px  2px 0 #0F534A;
}
```

### Highlighter Marker Effect (`.brush-highlight-yellow`)
```css
.brush-highlight-yellow {
  background: linear-gradient(180deg, transparent 55%, #FFDD33 55%);
  padding: 0 4px;
}
```
