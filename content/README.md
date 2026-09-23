# Shanvi Hospitality — Website Content Package

**Website:** https://shanvihospitality.in  
**Prepared for:** Developer Handoff  
**Purpose:** Full website redesign / rebuild

---

## 📁 Folder Structure

```
shanvi_website_content/
│
├── README.md                    ← You are here
│
├── company/
│   ├── about.md                 ← Company story, mission, values, USPs
│   └── company_info.json        ← Structured company data
│
├── packages/
│   ├── domestic_packages.json   ← All India tour packages with itineraries
│   ├── international_packages.json ← Thailand, Vietnam & abroad packages
│   └── packages_overview.md     ← Summary of all packages
│
├── destinations/
│   ├── domestic_destinations.json   ← States & cities covered
│   └── international_destinations.json ← Countries & cities covered
│
├── services/
│   └── services.json            ← All services offered
│
├── testimonials/
│   └── testimonials.json        ← Customer reviews & ratings
│
├── contact/
│   └── contact.json             ← Contact details, social links, office info
│
├── seo/
│   ├── page_titles.json         ← Recommended SEO titles per page
│   ├── meta_descriptions.json   ← Meta descriptions per page
│   └── keywords.json            ← Target keywords
│
└── assets_notes/
    └── images_needed.md         ← List of images/visuals the developer will need
```

---

## 🛠 Developer Notes

- All content is in **JSON** (for easy import into any CMS or framework) and **Markdown** (for readable copy)
- The website currently runs on WordPress. The new version can use any modern stack (Next.js, React, etc.)
- All phone numbers use **+91 9999885087** as the primary contact
- WhatsApp CTA should be prominent on every page
- Color scheme suggestion: Deep Saffron (#FF6B35), Royal Navy (#1B2A4A), Cream White (#FFF8F0)

---

## ✅ Key Pages to Build

1. **Home** — Hero, USPs, Featured Packages, Destinations, Testimonials, CTA
2. **About Us** — Company story, team, why choose us
3. **Domestic Packages** — Filter by state/duration/budget
4. **International Packages** — Filter by country
5. **Services** — Hotel, Transport, Corporate, Visa, etc.
6. **Destinations** — Gallery-style destination pages
7. **Testimonials** — Reviews with star ratings
8. **Contact Us** — Form, map, WhatsApp button, phone, email
9. **Blog** — Travel tips & destination guides (optional but great for SEO)
