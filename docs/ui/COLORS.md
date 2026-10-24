# DreamXec (dx-v2.0) Color Palette & Semantic Color System

---

## 🎨 Overview & Brand Palette

The **DreamXec Color System** is built upon a bold, energetic, and expressive palette designed to reflect **curiosity, imagination, and the spirit of innovation**. It combines four primary brand anchors with a dynamic, high-vibrancy secondary palette and clean structural neutrals.

---

## 🌟 Primary Brand Colors

The primary color palette forms the core identity of DreamXec, balancing energetic creativity with deep institutional wisdom and progress.

| Color Token | HEX Code | RGB | Tailwind Key | Semantic Role & Brand Meaning |
| :--- | :--- | :--- | :--- | :--- |
| **DreamX Orange** | `#FE4E1A` | `rgb(254, 78, 26)` | `dreamx.orange` | **Creativity, Enthusiasm, Spark of Curiosity**: Primary brand color. Primary CTAs, active buttons, active tab indicators, high-priority highlights, and donation progress bar fill. |
| **Forest Green** | `#0F534A` | `rgb(15, 83, 74)` | `dreamx.forest` | **Growth, Knowledge, Progress & Society**: Verified milestone badges, escrow release confirmations, institutional credibility headers, and primary structural borders. |
| **Bright Red** | `#F4002C` | `rgb(244, 0, 44)` | `dreamx.red` | **Energy, Passion, Boundary-Pushing**: Urgent milestone deadlines, Maker-Checker rejection alerts, high-priority verification warnings, and live countdown timers. |
| **Deep Purple** | `#4717AE` | `rgb(71, 23, 174)` | `dreamx.purple` | **Wisdom, Intelligence, Intellectual Exploration**: Neobrutalist container frames, hard shadow offsets, governance dashboard panels, and double-entry ledger cards. |

---

## 🌈 Secondary Supporting Colors

The secondary palette adds flexibility, playfulness, and high contrast across category pills, visual tags, graphs, and interactive callouts.

| Color Token | HEX Code | RGB | Tailwind Key | Semantic Role & Guidance |
| :--- | :--- | :--- | :--- | :--- |
| **Bright Yellow** | `#FFDD33` | `rgb(255, 221, 51)` | `dreamx.yellow` | **Attention & Milestone In-Progress**: Pending review states, highlighted annotation banners, featured campaign ribbons, and active step indicators. |
| **Bright Green** | `#9EFC5F` | `rgb(158, 252, 95)` | `dreamx.bright-green` | **Success & Financial Reconciliation**: Reconciled invoice tags, instant settlement status tags, and top donor badges. |
| **Pastel Pink** | `#FEB3FC` | `rgb(254, 179, 252)` | `dreamx.pink` | **Community & Social Interaction**: Social share cards, backer comment bubbles, student club tags, and impact quote callout containers. |
| **Vibrant Blue** | `#18D7E8` | `rgb(24, 215, 232)` | `dreamx.blue` | **Telemetry, Analytics & Connectivity**: Live donor counters, real-time escrow telemetry charts, and university node tags. |

---

## 🏛️ Structural Base & Neutrals

| Token Name | HEX Code | Role |
| :--- | :--- | :--- |
| **Canvas Base** | `#FCFBF7` | Clean warm canvas base for light mode dashboards and landing views. |
| **Paper Tint** | `#FFF9F2` | Warm graph-paper card background with subtle dot-grid rules. |
| **Pure White** | `#FFFFFF` | Form input backgrounds, modal surfaces, and card centers. |
| **Deep Obsidian** | `#121316` | Text headings, deep dark mode surfaces, and extreme contrast borders. |

---

## 🎛️ Semantic System Tokens (CSS Variables)

Mapped inside `client/src/index.css`:

```css
:root {
  --color-dreamx-orange: #FE4E1A;
  --color-dreamx-forest: #0F534A;
  --color-dreamx-red: #F4002C;
  --color-dreamx-purple: #4717AE;

  --color-dreamx-yellow: #FFDD33;
  --color-dreamx-bright-green: #9EFC5F;
  --color-dreamx-pink: #FEB3FC;
  --color-dreamx-blue: #18D7E8;

  --background: #FCFBF7;
  --card: #FFFFFF;
  --card-tint: #FFF9F2;
  --border-primary: #0F534A;
  --border-secondary: #4717AE;
  --shadow-offset: #FE4E1A;
}
```

---

## 🛠️ Utility Class Reference

| Utility Class | Visual Styling & Effect |
| :--- | :--- |
| `.btn-dreamx-primary` | Orange `#FE4E1A` background, 3px Forest Green `#0F534A` border, 4px `#0F534A` tactile offset shadow. |
| `.btn-dreamx-secondary` | Forest Green `#0F534A` background, 3px Deep Purple `#4717AE` border, 4px `#4717AE` offset shadow. |
| `.card-dreamx` | Solid White or Paper background, 4px Forest Green border, 6px Deep Purple hard shadow offset. |
| `.badge-verified` | Forest Green `#0F534A` pill with Bright Green `#9EFC5F` text and 2px border. |
| `.badge-pending` | Bright Yellow `#FFDD33` pill with Deep Purple `#4717AE` text and 2px border. |
| `.badge-urgent` | Bright Red `#F4002C` pill with Pure White text and 2px border. |
| `.brush-highlight-yellow` | Yellow `#FFDD33` semi-transparent highlighter stroke behind headline keywords. |
