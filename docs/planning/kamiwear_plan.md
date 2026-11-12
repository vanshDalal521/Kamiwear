# 🎌 Kamiwear — Anime E-Commerce Rebuild: Full Detailed Plan

> **Design Philosophy**: Where anime culture meets Silicon Valley minimalism. Every pixel is intentional. Every interaction is fluid.  
> **Style**: `Liquid Glass Minimalism` — frosted transparency, razor-sharp typography, breathing whitespace, micro-animations.  
> **Theme**: Anime-coded, globally premium.

---

## 🎨 1. DESIGN SYSTEM

### 1.1 Color Palette

| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `--color-bg-primary` | `#F8F6FF` | `#0A0812` | Page background |
| `--color-bg-secondary` | `#EDE8FF` | `#120D1E` | Section backgrounds |
| `--color-glass-bg` | `rgba(255,255,255,0.12)` | `rgba(255,255,255,0.06)` | Glass cards |
| `--color-glass-border` | `rgba(255,255,255,0.35)` | `rgba(255,255,255,0.12)` | Glass card borders |
| `--color-accent-primary` | `#3C1A5B` | `#9B5DD4` | Deep purple – brand |
| `--color-accent-yellow` | `#FFF748` | `#FFE500` | Electric yellow – CTAs, highlights |
| `--color-accent-glow` | `rgba(60,26,91,0.3)` | `rgba(155,93,212,0.4)` | Glow effects, shadows |
| `--color-text-primary` | `#0A0812` | `#F2EDFF` | Headings |
| `--color-text-secondary` | `#5B4A7A` | `#9B85BE` | Body, captions |
| `--color-text-muted` | `#9B85BE` | `#5B4A7A` | Placeholders, labels |
| `--color-success` | `#1ED760` | `#1ED760` | In-stock, success |
| `--color-warning` | `#FF6B35` | `#FF8C5A` | Low-stock alerts |
| `--color-error` | `#FF2D55` | `#FF4D6D` | Errors |

### 1.2 Liquid Glass Effect System

The **liquid glass** effect is the visual signature of the entire site. Every card, modal, drawer, and nav element uses it.

```css
/* Core glass mixin — applied globally */
.glass {
  background: var(--color-glass-bg);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--color-glass-border);
  border-radius: 20px;
  box-shadow:
    0 8px 32px rgba(60, 26, 91, 0.15),
    inset 0 1px 0 rgba(255,255,255,0.2);
}

/* Elevated glass — for modals, cart drawer */
.glass--elevated {
  backdrop-filter: blur(40px) saturate(200%);
  box-shadow:
    0 24px 64px rgba(60, 26, 91, 0.3),
    inset 0 1px 0 rgba(255,255,255,0.3);
}

/* Subtle glass — for product cards */
.glass--card {
  backdrop-filter: blur(12px) saturate(150%);
  box-shadow:
    0 4px 16px rgba(60, 26, 91, 0.1),
    inset 0 1px 0 rgba(255,255,255,0.15);
}
```

### 1.3 Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| Display / Hero | `Syne` | 800 | `clamp(52px, 8vw, 120px)` |
| Headings (H1–H3) | `Syne` | 700 | `clamp(28px, 4vw, 56px)` |
| Sub-headings | `Inter` | 600 | `20px–28px` |
| Body | `Inter` | 400 | `15px–17px` |
| Labels / Caps | `Inter` | 500 | `11px–13px`, `letter-spacing: 0.15em` |
| Prices | `Syne` | 700 | `22px–28px` |
| Anime / Accent | `Orbitron` | 700 | Used on sale badges, countdown timers |

> Google Fonts import: `Syne`, `Inter`, `Orbitron`

### 1.4 Spacing & Layout Grid

- **Base unit**: `8px`
- **Layout**: CSS Grid + Flexbox, max-width `1440px`, padding `clamp(16px, 4vw, 80px)`
- **Breakpoints**: `480px` (xs), `768px` (md), `1024px` (lg), `1280px` (xl), `1440px` (2xl)
- **Product grid**: `auto-fill, minmax(260px, 1fr)` — fluid, no fixed column counts

### 1.5 Border Radius Scale

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `8px` | Buttons, tags, inputs |
| `--radius-md` | `16px` | Small cards |
| `--radius-lg` | `24px` | Product cards, modals |
| `--radius-xl` | `36px` | Cart drawer, hero sections |
| `--radius-pill` | `999px` | Pills, badges, search bar |

---

## 🌙☀️ 2. LIGHT / DARK MODE

### Implementation Strategy
- CSS custom properties (`--color-*` tokens) defined in `:root` for light, overridden in `[data-theme="dark"]`
- `localStorage` persists user preference across sessions
- Smooth `transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1)` on all color transitions
- System preference detected via `prefers-color-scheme` media query as default
- Toggle button: animated sun/moon SVG swap with a spring morph animation

```javascript
// Theme engine (theme.js)
const applyTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('kw-theme', theme);
};

const getSystemTheme = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const init = () => {
  const saved = localStorage.getItem('kw-theme') || getSystemTheme();
  applyTheme(saved);
};
```

---

## ✨ 3. ANIMATION SYSTEM

All animations use **CSS custom properties** for timing and easing, plus `IntersectionObserver` for scroll-triggered reveals.

### 3.1 Core Easing Curves

```css
--ease-spring:    cubic-bezier(0.34, 1.56, 0.64, 1);  /* bouncy spring */
--ease-smooth:    cubic-bezier(0.23, 1, 0.32, 1);      /* silky smooth */
--ease-sharp:     cubic-bezier(0.77, 0, 0.18, 1);      /* sharp entry */
--ease-elastic:   cubic-bezier(0.68, -0.55, 0.27, 1.55); /* elastic */
```

### 3.2 Animation Catalogue

| Animation | Trigger | Effect |
|---|---|---|
| **Hero Text Reveal** | Page load | Characters split + stagger float up with blur dissolve |
| **Glass Card Hover** | Hover | `transform: translateY(-8px) scale(1.02)` + glow pulse |
| **Product Image Zoom** | Hover | `scale(1.08)` with overflow hidden |
| **Add to Cart** | Click | Item "flies" from product card to cart icon (FLIP animation) |
| **Cart Counter** | Item added | Bounce + pulse ring |
| **Page Transitions** | Route change | Frosted glass curtain wipe |
| **Scroll Reveal** | Scroll into view | `opacity: 0 → 1` + `translateY(40px → 0)` staggered |
| **Shimmer Loader** | Loading state | Animated gradient sweep on skeleton |
| **Image Gallery** | Swipe/click | Smooth fade + scale morphing between images |
| **Notification Toast** | Actions | Slide in from top-right, spring ease, auto-dismiss |
| **Wishlist Heart** | Toggle | Liquid fill animation + scale burst |
| **Parallax Layers** | Scroll | Hero background moves at 0.4x scroll speed |
| **Cursor Trail** | Mouse move | Glowing orb follows cursor (desktop only) |
| **Size Selector** | Click | Active pill morphs with a liquid slide underline |
| **Countdown Timer** | Sale active | Individual digit flip animation |

---

## 📁 4. FILE STRUCTURE (Rebuilt Clean)

```
Kamiwear-main/
│
├── index.html                  # Homepage
├── shop.html                   # All products / catalog
├── product.html                # Single product detail
├── cart.html                   # Cart page
├── checkout.html               # Checkout flow
├── confirmation.html           # Order success
├── wishlist.html               # Saved items
├── account.html                # User profile / orders
├── register.html               # Sign up / Sign in
├── collections/
│   ├── demon-slayer.html       # Demon Slayer collection
│   ├── naruto.html             # Naruto collection
│   ├── jujutsu.html            # Jujutsu Kaisen collection
│   ├── one-piece.html          # One Piece collection
│   └── new-arrivals.html       # New drops
├── info/
│   ├── contact.html
│   ├── faqs.html
│   ├── size-guide.html
│   ├── shipping.html
│   ├── returns.html
│   ├── privacy.html
│   └── terms.html
│
├── css/
│   ├── tokens.css              # All CSS custom properties (design tokens)
│   ├── reset.css               # Modern CSS reset
│   ├── glass.css               # Liquid glass utility classes
│   ├── animations.css          # All keyframes + animation utilities
│   ├── typography.css          # Font system
│   ├── components.css          # Reusable UI components
│   ├── layout.css              # Grid, flex, spacing utilities
│   └── pages/
│       ├── home.css
│       ├── shop.css
│       ├── product.css
│       ├── cart.css
│       ├── checkout.css
│       └── account.css
│
├── js/
│   ├── core/
│   │   ├── theme.js            # Light/dark mode engine
│   │   ├── animations.js       # Scroll reveal, GSAP-like utilities
│   │   ├── cursor.js           # Custom cursor + trail
│   │   └── router.js           # Smooth page transitions
│   ├── store/
│   │   ├── cart.js             # Cart state (localStorage)
│   │   ├── wishlist.js         # Wishlist state
│   │   └── user.js             # User session state
│   ├── components/
│   │   ├── navbar.js           # Sticky nav, search, cart icon
│   │   ├── product-card.js     # Card interactions
│   │   ├── quick-view.js       # Product quick-view modal
│   │   ├── filters.js          # Shop filter/sort panel
│   │   ├── image-gallery.js    # Product image carousel
│   │   ├── size-chart.js       # Size guide modal
│   │   └── toast.js            # Notification toasts
│   └── pages/
│       ├── home.js
│       ├── shop.js
│       ├── product.js
│       ├── cart.js
│       └── checkout.js
│
└── assets/
    ├── icons/                  # SVG icon system
    ├── fonts/                  # Self-hosted fallback fonts
    ├── images/
    │   ├── hero/
    │   ├── products/
    │   └── collections/
    └── videos/                 # Hero background loops
```

---

## 🖥️ 5. PAGE-BY-PAGE BREAKDOWN

### 5.1 Homepage (`index.html`)

**Sections in order:**

1. **Navbar** — glass sticky nav, logo left, links center, icons right (search, wishlist, cart, theme toggle). On scroll: blur deepens, border appears.

2. **Hero Section** — Full-viewport immersive hero.
   - Background: looping subtle anime particle animation (cherry blossom or ink drops) via Canvas API
   - Foreground: `"WEAR THE ANIME"` in massive Syne 800 display type, character-by-character reveal
   - Sub-heading: small label `"Premium drops. Limited editions."`
   - Two CTAs: `[SHOP NOW]` (yellow pill) + `[NEW ARRIVALS]` (glass outline pill)
   - Floating product image right side, rotating slowly, with a purple glow halo
   - Hero scroll indicator: animated bouncing chevron

3. **Announcement Ticker** — full-width glass strip, marquee scrolling: `FREE SHIPPING OVER ₹999 · NEW DEMON SLAYER DROP · LOYALTY POINTS ON EVERY ORDER`

4. **Featured Collections** — 4 glass cards in a responsive grid. Each card has:
   - Collection cover image with parallax on hover
   - Collection name overlaid in display type
   - Item count label
   - "EXPLORE" label that slides in on hover

5. **Trending Products** — horizontal scroll on mobile, grid on desktop. Heading with anime-style accent underline. Cards with glass effect, quick-add buttons.

6. **Loyalty Points Banner** — full-width glass section: "EARN KAMIKOIN WITH EVERY ORDER". Animated coin icon, points breakdown table.

7. **New Arrivals Spotlight** — 2-column layout. Left: large product image with a floating badge `"JUST DROPPED"`. Right: product name, description, price, add to cart, wishlist.

8. **Community / Social Proof Section** — Instagram-style grid of user photos wearing Kamiwear (UGC wall). Glassmorphism overlay on each tile.

9. **Newsletter Strip** — glass card with email input, animated submit button, "JOIN THE TRIBE" heading.

10. **Footer** — clean minimal footer. Logo, nav links in columns, social icons, payment badges, copyright.

---

### 5.2 Shop / Catalog (`shop.html`)

- **Filter Sidebar** (desktop) / **Filter Drawer** (mobile):
  - Anime series filter (checkboxes with series icons)
  - Category (T-shirts, Hoodies, Accessories)
  - Price range slider (custom glass-styled)
  - Color swatches
  - Size availability filter
  - Sort by: Newest, Price ↑, Price ↓, Popular
- **Active filter pills** displayed above grid, each removable with ×
- **Product Grid**: `auto-fill, minmax(260px, 1fr)` with 12–24 products per load
- **Infinite scroll / Load More button** at bottom (glass pill button)
- **Product Card Features**:
  - Image with second-image hover swap
  - Quick view button (appears on hover, glass style)
  - Add to wishlist heart
  - Sold-out overlay with blur
  - "Limited" badge if < 10 stock
  - Color variant dots
  - Rating stars + review count

---

### 5.3 Product Detail Page (`product.html`)

**Layout**: 60/40 split — Image left, Info right. Stacks on mobile.

**Left — Image Gallery**:
- Main image (zoomable on hover/pinch)
- Thumbnail strip (4–6 images)
- Swipe on mobile
- "Try On" AR button (future feature flag, disabled initially)

**Right — Product Info**:
- Breadcrumb trail (Collection > Product)
- Anime series badge (e.g., `DEMON SLAYER`)
- Product name in display type
- Price + original price + discount %
- Rating (stars + `"142 reviews"` link)
- Color picker (glass swatch circles with active ring)
- Size selector (pill buttons with hover spring animation)
- Size guide link → modal
- Stock indicator (`"Only 3 left!"` in warning color, pulsing dot)
- Quantity ± stepper (glass style)
- **[ADD TO CART]** — full-width yellow pill CTA with add-to-cart fly animation
- **[ADD TO WISHLIST]** — secondary ghost button
- Loyalty points info: `"Earn 120 KamiKoins"`
- Collapsible accordions: Description, Size & Fit, Materials, Care, Shipping
- Share buttons (native share API)
- `You May Also Like` — 4 related products carousel

---

### 5.4 Cart (`cart.html`)

- Cart drawer (slides from right, glass panel) **+** dedicated cart page
- Each line item: image, name, size, color, price, quantity stepper, remove
- Real-time subtotal updates
- **Upsell strip**: `"Add ₹200 more for free shipping"` progress bar
- Order summary: subtotal, shipping estimate, discount field
- Promo code input (glass input with [APPLY] button)
- `[CHECKOUT]` button fixed at bottom of drawer

---

### 5.5 Checkout (`checkout.html`)

**Two-column layout**:
- **Left**: Form sections (Contact Info, Shipping Address, Payment Method)
- **Right**: Order summary (sticky)

**Glass form fields** with:
- Floating labels (animate up on focus)
- Real-time validation indicators (green tick / red border)
- Auto-fill support
- Payment: Credit card fields + UPI + COD toggle

---

### 5.6 Account & Auth Pages

- **Register/Login** (`register.html`): center glass card, full-page background with animated particles. Social login (Google) + email form. Tabs to switch Login/Register with sliding indicator.
- **Account Dashboard** (`account.html`):
  - Left sidebar: avatar, name, KamiKoin balance, nav links
  - Tabs: Orders, Wishlist, KamiKoins, Profile Settings

---

### 5.7 Collection Pages (`demon-slayer.html`, etc.)

- Unique hero for each anime (themed color overlay matching the anime's palette)
- Character art (licensed or AI-generated) in hero background with parallax
- Collection tagline (anime-specific, e.g., `"Train harder than Rengoku."`)
- Product grid below

---

### 5.8 Info Pages (FAQs, Contact, Shipping, etc.)

- Clean, minimal single-column layout
- Glass cards for each FAQ accordion item
- Contact page: split layout — contact form left, info cards right (Email, WhatsApp, Hours)

---

## 🚀 6. TRENDING & UNIQUE FEATURES

### 6.1 🪙 KamiKoin Loyalty System
- Every purchase earns KamiKoins (1 KamiKoin = ₹1 credit)
- Visible balance in navbar (small badge)
- Redeemable at checkout
- Level tiers: `Genin → Chunin → Jonin → Kage` (anime progression language)
- Tracked in localStorage (upgradeable to backend later)

### 6.2 🔍 Smart Search with Autocomplete
- `Ctrl+K` / tap search icon → full-screen glass search overlay
- Instant autocomplete with product thumbnails
- Recent searches, trending searches displayed by default
- Voice search button (Web Speech API)

### 6.3 🃏 Quick View Modal
- Hover product card → glass sheet rises from bottom or center
- Shows: images, size picker, color, add to cart — without leaving page
- `backdrop-filter` blurs the catalog behind it

### 6.4 📦 Real-Time Stock Counter
- `"Only 2 left!"` displayed with a pulsing amber dot
- Low-stock items display urgency bar fill animation

### 6.5 🔔 Back in Stock Notify
- Sold-out products: email/WhatsApp opt-in for restock
- Glass modal with email + size fields

### 6.6 🖼️ UGC / Community Wall
- Instagram-grid of community photos (static initially, API-upgradeable)
- Each tile: hover reveals user handle + `"Shop this look"` button

### 6.7 🎲 Anime Randomizer / "Pick My Fit" Button
- Fun feature: big yellow button `"PICK MY FIT"` → random product reveal with dramatic animation
- Shareable: generates a URL `kamiwear.com/random/[product-id]`

### 6.8 ⏱️ Flash Sale Countdown Timer
- Hero or banner section with Orbitron-font digit flip timer
- Auto-hides when timer hits 0, shows "SALE ENDED"

### 6.9 🧾 Recently Viewed Band
- Horizontal scroll strip of last 6 viewed products (localStorage)
- Appears on product + cart pages

### 6.10 📱 PWA (Progressive Web App)
- `manifest.json` for "Add to Home Screen" on mobile
- Service worker for offline shell caching
- Feels app-like when launched from home screen

### 6.11 💬 Floating WhatsApp Button
- Fixed bottom-right glass circle with WhatsApp icon
- Opens pre-filled message: `"Hi, I need help with my Kamiwear order"`

### 6.12 🌐 Currency Display (UX only)
- Toggle between ₹ INR and $ USD (using a fixed conversion rate stored in JS)
- Persisted in localStorage

### 6.13 🎨 Custom Cursor (Desktop)
- Small glowing purple orb cursor
- Grows + changes color on hover over interactive elements
- Leaves a brief trailing glow

### 6.14 📸 360° Product Spin (Phase 2)
- For hero products: drag to spin through 12 frames of the product
- Implemented with a simple canvas + image array

### 6.15 🤖 AI Style Recommender (Phase 2)
- `"Customers who liked this also wore..."` row
- Logic: tag-based similarity (anime series + category + color)

---

## 🧩 7. COMPONENT LIBRARY

| Component | Description |
|---|---|
| `GlassCard` | Base glass container, `--radius-lg`, hover lift |
| `PillButton` | CTAs — yellow fill or glass outline variant |
| `ProductCard` | Image, name, price, badges, quick-add |
| `SizeSelector` | Pill buttons with spring animation |
| `ColorSwatch` | Circle with active ring |
| `QuantityStepper` | `−` count `+` with glass input |
| `Toast` | Top-right slide-in notification |
| `Modal` | Centered glass dialog with backdrop blur |
| `Drawer` | Side-slide panel (cart, filters on mobile) |
| `Accordion` | Glass FAQ items with smooth height animation |
| `Badge` | Small label pill — Limited, Sale, New, Sold Out |
| `SkeletonLoader` | Shimmer placeholder for loading state |
| `SearchOverlay` | Full-screen glass search view |
| `ThemeToggle` | Animated sun/moon SVG toggle |
| `RatingStars` | Filled/half/empty stars with color |
| `ProgressBar` | Glass bar (used for shipping threshold) |
| `CountdownTimer` | Digit flip with Orbitron font |
| `StockIndicator` | Pulsing dot + label |

---

## 📋 8. BUILD PHASES

### ✅ Phase 1 — Foundation (Week 1)
- [ ] Design token CSS file (`tokens.css`)
- [ ] Reset + typography CSS
- [ ] Glass utility classes
- [ ] Animation keyframes
- [ ] Theme engine (light/dark JS)
- [ ] Navbar + Footer components
- [ ] Homepage hero section

### ✅ Phase 2 — Core Pages (Week 2)
- [ ] Homepage (all sections complete)
- [ ] Shop / Catalog page with filters
- [ ] Product detail page
- [ ] Cart (drawer + page)

### ✅ Phase 3 — Checkout & Account (Week 3)
- [ ] Checkout form
- [ ] Order confirmation
- [ ] Register / Login
- [ ] Account dashboard

### ✅ Phase 4 — Collections & Info (Week 3–4)
- [ ] All collection pages (Demon Slayer, Naruto, etc.)
- [ ] All info pages (FAQ, Contact, Shipping, etc.)

### ✅ Phase 5 — Trending Features (Week 4–5)
- [ ] KamiKoin loyalty system (localStorage)
- [ ] Smart search overlay
- [ ] Quick view modal
- [ ] PWA manifest + service worker
- [ ] Recently viewed band
- [ ] Flash sale timer
- [ ] Back in stock notify modal
- [ ] WhatsApp floating button
- [ ] Custom cursor

### ✅ Phase 6 — Polish & Optimization (Week 5)
- [ ] All scroll-reveal animations via IntersectionObserver
- [ ] Page transition curtain
- [ ] Mobile responsiveness pass (all breakpoints)
- [ ] Performance audit (image lazy loading, font preload)
- [ ] Cross-browser testing
- [ ] PWA testing on iOS / Android

---

## 🎯 9. KEY DESIGN RULES (NON-NEGOTIABLES)

1. **No plain white cards.** Everything uses glass or a tinted surface.
2. **Every interactive element has a hover state.** No dead zones.
3. **Typography is always in scale.** No arbitrary font sizes.
4. **Animations never block.** All transitions are `< 400ms`. Loading states always shown.
5. **Mobile first.** Design for 390px, enhance for desktop.
6. **Yellow (#FFF748) is for action only.** CTAs, badges, highlights — not decoration.
7. **Purple (#3C1A5B) is the soul of the brand.** Used for headers, active states, backgrounds.
8. **Images are always cropped 4:5 (portrait) for product cards.**
9. **Dark mode is not inverted light mode.** It has its own warmth and depth.
10. **Every section breathes.** Minimum `120px` vertical padding on desktop.

---

## 🛠️ 10. TECH STACK

| Layer | Technology |
|---|---|
| Structure | Vanilla HTML5 (semantic) |
| Styling | Vanilla CSS (custom properties, grid, flexbox) |
| Logic | Vanilla JavaScript (ES6+ modules) |
| Fonts | Google Fonts: Syne, Inter, Orbitron |
| Icons | Self-hosted SVG sprite |
| Animations | CSS transitions + Web Animations API + IntersectionObserver |
| State | `localStorage` for cart, wishlist, theme, recently viewed |
| PWA | `manifest.json` + Service Worker |
| No frameworks | Pure HTML/CSS/JS — fast, no build step needed |

---

*Plan version 1.0 — Kamiwear Rebuild 2026*
