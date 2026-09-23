# Website Structure & Page Plan

## Recommended Tech Stack (Options)

| Option | Stack | Best For |
|---|---|---|
| A (Recommended) | Next.js + Tailwind CSS | Fast, SEO-friendly, modern |
| B | React + Vite + Tailwind | SPA, flexible |
| C | WordPress + Elementor | Easy client management |

---

## Site Map

```
/ (Home)
├── /about
├── /packages
│   ├── /packages/domestic
│   │   ├── /packages/domestic/uttarakhand
│   │   ├── /packages/domestic/rajasthan
│   │   ├── /packages/domestic/himachal-pradesh
│   │   ├── /packages/domestic/kerala
│   │   └── /packages/domestic/golden-triangle
│   └── /packages/international
│       ├── /packages/international/thailand
│       ├── /packages/international/vietnam
│       └── /packages/international/nepal
├── /destinations
├── /services
│   ├── /services/hotel-booking
│   ├── /services/transportation
│   ├── /services/corporate-travel
│   ├── /services/visa-assistance
│   └── /services/flight-booking
├── /testimonials
├── /gallery
├── /blog (optional, great for SEO)
└── /contact
```

---

## Key Sections Per Page

### HOME PAGE
1. **Navigation** — Logo left, links center, "WhatsApp Us" CTA button right
2. **Hero Banner** — Full-screen slider with 3-4 destination images + headline + CTA
   - Headline: "Your Journey, Our Expertise"
   - Sub: "Best Tour Packages in India & Abroad"
   - CTAs: "Explore Packages" + "WhatsApp Us"
3. **Stats Bar** — 4 trust metrics: Years Experience | Happy Travelers | Destinations | 24/7 Support
4. **Popular Destinations** — Card grid (6-8 destinations with photos)
5. **Featured Packages** — Horizontal scrollable cards with price, duration, highlights
6. **Why Choose Us** — 6 USP blocks with icons (see about.md)
7. **Services Overview** — 4-6 service blocks with icons
8. **Testimonials** — Carousel with star ratings
9. **CTA Banner** — "Plan Your Dream Trip Today" + WhatsApp button + phone
10. **Footer** — Logo, links, contact info, social media, copyright

### PACKAGE DETAIL PAGE
1. Package title + destination badges
2. Duration + price tag
3. Hero image
4. Highlights (bullet list with icons)
5. Day-by-Day Itinerary (accordion)
6. Inclusions / Exclusions (two columns)
7. Sticky sidebar CTA: "Book This Package" (WhatsApp / Form)
8. Related packages

### CONTACT PAGE
1. WhatsApp floating button (always visible across site)
2. Contact form (Name, Email, Phone, Destination, Travel Dates, Message)
3. Phone, email, address cards
4. Google Maps embed (Noida Sector 18)
5. WhatsApp chat link

---

## Floating Elements (Always Visible)
- **WhatsApp Chat Button** — Bottom right, all pages
- **Call Now Button** — Bottom left or part of header (mobile)
- **Sticky Header** — On scroll, header should stick with nav links

---

## Mobile Optimization (Critical)
- Most travel bookings happen on mobile
- All CTAs must be tap-friendly (min 44x44px)
- WhatsApp CTA should open wa.me link
- Phone number must be a tel: link
- Package cards must be swipeable on mobile
