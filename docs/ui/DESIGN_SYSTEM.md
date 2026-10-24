# DreamXec (dx-v2.0) Design System Specification

---

## 🎨 Overview & Core Philosophy

The **DreamXec (dx-v2.0) Design System** establishes a vibrant, high-impact visual identity combining **Neobrutalism** (tactical 3-5px solid borders, zero-radius geometry, hard directional offset shadows) with **Bold Color Blocking** and **Expressive Handwritten Annotations**.

Designed for the **DreamXec Milestone-Governance Platform**, this design system balances **institutional integrity and fiscal credibility** (for donors, compliance officers, and university reviewers) with **creative human expression and enthusiasm** (for student innovators, researchers, and community clubs).

```
   ┌─────────────────────────────────────────────────────────────┐
   │                    Neobrutalism Base                        │
   │  Hard 3-5px solid borders • 0px border radiuses • Offset    │
   │  box shadows • Ruled graph-paper background texture         │
   └──────────────────────────────┬──────────────────────────────┘
                                  │
      ┌───────────────────────────┴───────────────────────────┐
      ▼                                                       ▼
┌─────────────────────────────┐             ┌─────────────────────────────┐
│  Vibrant Quad-Primary Brand │             │    Dynamic Typography       │
│  • Orange (#FE4E1A)         │             │  • Poppins (Black/Med/Reg)  │
│  • Forest Green (#0F534A)   │             │  • Badlooking Brush Notes   │
│  • Bright Red (#F4002C)     │             │  • Tactile Press Transforms │
│  • Deep Purple (#4717AE)    │             │  • Offset Hover Shadows     │
└─────────────────────────────┘             └─────────────────────────────┘
```

---

## 🏛️ Core Design Principles

### 1. Hard Contrast & Tactical Borders
* **Solid Outlines**: Structural containers and interactive elements utilize bold, solid borders (`3px` to `5px` thickness using Forest Green `#0F534A`, Deep Purple `#4717AE`, or DreamX Orange `#FE4E1A`).
* **Zero Corner Radius Default**: All primary card elements and input controls omit soft rounded corners (`--radius: 0rem`), giving elements a structured, tactile print-like presence.

### 2. Warm Paper Texture Canvas
* **Base Background**: Warm canvas tint (`#FCFBF7`) with optional graph-paper dot rules (`#FFF9F2`).
* **Content Cards**: Crisp white surfaces framed with high-contrast borders and colored shadow dropouts.

### 3. Tactile Offset Shadows
Instead of soft blurred drop shadows, containers use hard directional offset box-shadows:
* `4px 4px 0px #0F534A` (Buttons, inputs)
* `6px 6px 0px #FE4E1A, 10px 10px 0px #4717AE` (Primary Cards)
* `8px 8px 0px #FE4E1A` (Hover states)

### 4. Expressive Annotation Layer
* Features handwritten **Badlooking Brush** sticky notes, arrow doodles, and staff highlights layered over clean Poppins geometric cards.

---

## 🎛️ Color Palette Summary

* **Primary Colors**:
  * **Orange (`#FE4E1A`)**: Spark of curiosity, innovation, primary CTAs, active highlights.
  * **Forest Green (`#0F534A`)**: Growth, knowledge, verified milestone status, primary container borders.
  * **Bright Red (`#F4002C`)**: Energy, determination, urgent deadlines, Maker-Checker alerts.
  * **Deep Purple (`#4717AE`)**: Wisdom, intelligence, governance headers, hard shadow offsets.
* **Secondary Colors**:
  * **Bright Yellow (`#FFDD33`)**: Pending review states, highlighted annotation banners.
  * **Bright Green (`#9EFC5F`)**: Financial settlement tags, verified checkmarks.
  * **Pastel Pink (`#FEB3FC`)**: Community tags, social share cards.
  * **Vibrant Blue (`#18D7E8`)**: Analytics, telemetry, live donor stats.

---

## ⚡ Motion & Micro-Interactions

### Button Tactile Press
```css
.btn-dreamx-primary {
  background: #FE4E1A;
  color: #FFFFFF;
  border: 3px solid #0F534A;
  box-shadow: 4px 4px 0px #0F534A;
  transition: all 0.15s ease;
}

.btn-dreamx-primary:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0px #0F534A;
}

.btn-dreamx-primary:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0px #0F534A;
}
```

### Card Tilt Transforms
Adds human personality to listed campaign cards:
* `.card-tilt-right`: `transform: rotate(0.6deg)`
* `.card-tilt-left`: `transform: rotate(-0.6deg)`
