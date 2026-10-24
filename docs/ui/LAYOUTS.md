# dx-v2.0 UI Layouts & Page Structure Specifications

---

## 📐 Layout Grid System & Breakpoints

The **dx-v2.0** application utilizes standard responsive grid configurations with tailored extra-small (`xs: 475px`) and extra-large (`2xl: 1536px`) breakpoints.

### Tailwind Breakpoint Scale

| Breakpoint | Minimum Width | Target Devices / Use Case |
| :--- | :--- | :--- |
| `xs` | `475px` | Large smartphones, compact mobile views |
| `sm` | `640px` | Portrait tablets, standard mobile landscape |
| `md` | `768px` | Landscape tablets, compact laptops |
| `lg` | `1024px` | Standard desktops, laptops |
| `xl` | `1280px` | Large desktop monitors |
| `2xl` | `1536px` | Ultra-wide displays, high-density dashboard screens |

---

## 🏛️ Standard Page Layout Archetypes

```
  ┌─────────────────────────────────────────────────────────────┐
  │                    Top Header Navigation                    │
  │  Logo • Search Bar • Role Context Switcher • User Profile  │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
     ┌───────────────────────────┴───────────────────────────┐
     ▼                                                       ▼
┌──────────────────────────┐               ┌──────────────────────────┐
│   Archetype A:           │               │   Archetype B:           │
│   Dashboard Layout       │               │   Public Discovery       │
│  [Sidebar] + [Main Grid] │               │  [Hero] + [ScrollStack]  │
└──────────────────────────┘               └──────────────────────────┘
```

---

## 1. Dashboard Layout Archetype

Used in `DonorDashboard.tsx`, `StudentDashboard.tsx`, and `InnovationDashboard.tsx`.

### Structure
* **Fixed Left Sidebar Navigation** (`w-64` on desktop, collateral drawer on mobile).
* **Top Header Bar**: Workspace switcher (College/Club selector), notification bell, profile trigger, and global search input.
* **Main Content Area**:
  - **Metrics Row**: 4-column responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`).
  - **Primary Chart & Activity Panel**: 2-column asymmetric grid (`grid-cols-1 lg:grid-cols-3` with chart spanning 2 columns).
  - **Recent Transactions / Approvals Table**: Full-width neobrutalist table wrapper with double-entry balance summary.

```tsx
<div className="min-h-screen flex flex-col md:flex-row bg-body">
  {/* Sidebar */}
  <aside className="w-full md:w-64 border-r-4 border-dreamxec-navy bg-white p-4">
    {/* Navigation Links */}
  </aside>

  {/* Main Content Area */}
  <main className="flex-1 p-6 space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Metric Cards */}
    </div>
  </main>
</div>
```

---

## 2. Public Landing & Campaign Discovery Archetype

Used in `BrowseCampaigns.tsx`, `BrowseProjects.tsx`, and `ClubDiscovery.tsx`.

### Structure
* **Hero Header Section**: Centered headline with `.text-outlined-saffron` text, floating doodles (`FloatingDoodles.tsx`), and search bar.
* **Sticky Filter Bar**: Category pills (NGO, University, Grant, Disaster Relief) with Neobrutalist borders.
* **Scroll-Stack Stacked Cards**: Interactive vertical card stack (`ScrollStack.tsx`) pinning featured grants as the user scrolls.
* **Swiper Carousel Section**: Touch-enabled horizontal carousel swiper (`CriteriaCarousel`, `WhiteboardCarousel`).

---

## 3. Multi-Step Onboarding & Wizard Archetype

Used in `CreateCampaign.tsx`, `ProfileSetup.tsx`, and `VerifyPresident.tsx`.

### Structure
* **Stepper Timeline Bar**: Top step sequence (`1. Basic Info -> 2. Legal Evidence -> 3. Wallet Setup -> 4. Review`).
* **Centered Card Box**: `max-w-3xl mx-auto card-pastel p-8` container.
* **Action Footer**: Persistent flex bar with "Back" (`.btn-pastel-secondary`) and "Continue" (`.btn-pastel-primary`) buttons.

---

## 4. Modal & Drawer Overlay Archetype

Used in `DonateModal.tsx` and `VerificationModal.tsx`.

### Structure
* **Backdrop**: Faint dark overlay with blur (`bg-black/50 backdrop-blur-sm`).
* **Container Window**: Centered modal container with 5px solid Navy border, 12px hard shadow offset (`shadow-pastel-card`).
* **Header Bar**: Title string + Close button (`X` icon in round `.icon-pastel-container`).
