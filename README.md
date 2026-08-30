# Shivrajsinh Zala — Frontend Developer Portfolio

This is the repository for the personal developer portfolio, blog, and online resume of **Shivrajsinh Zala**, based in Rajkot, Gujarat. The website is styled in a custom, premium, high-contrast **Brutalist Web Design** aesthetic, incorporating tactile mouse-tilt interactions, smooth scroll mechanics, and micro-animations.

---

## 🌟 Featured Project: ST Tracker (GSRTC Live Bus Tracker)

**ST Tracker** is an independent, high-performance transit tracking application and programmatic SEO network built for Gujarat ST (GSRTC) daily commuters.

* **Live App (PWA)**: [tracker.shivrajsinh.in](https://tracker.shivrajsinh.in)
* **SEO & Guides Portal**: [gsrtc.shivrajsinh.in](https://gsrtc.shivrajsinh.in)
* **Open Source Repository**: [github.com/shivrajsinhzala/gsrtc-live-tracker](https://github.com/shivrajsinhzala/gsrtc-live-tracker)

### Highlights & Engineering
* **Real-Time GPS Telematics**: Live map tracking by vehicle registration number (e.g. `GJ-18-ZT-1028`), speed gauge, continuous motion trail, and next-stop ETA derivation.
* **19,000+ Stations & 8,500+ Buses**: Instant timetable searches across all Gujarat transit stops with live departure countdowns, delay indicators, and crowd capacity reporting.
* **Zero Dependencies / Vanilla PWA**: Lightweight, instant-load frontend built with ES Modules, vendored Leaflet maps, and Service Workers (offline-ready, installable on Android/iOS).
* **High-Contrast Dark/Light Design**: Clean commuter interface with full bilingual support in English and Gujarati (ગુજરાતી).
* **Generative Engine Optimization (GEO)**: Implements structured JSON-LD schemas (`WebApplication`, `FAQPage`, `BreadcrumbList`) and standardized `/llms.txt` for ChatGPT, Gemini, and Perplexity discoverability.

---

## 🚀 Portfolio Key Features

* **Brutalist Design System**: Built with strict high-contrast borders, solid shadows (`brutal-shadow`), curated neon/pastel accents (pink, cyan, yellow, purple), and graph-paper backdrop coordinates.
* **Online Resume (`/resume`)**: A professional overview page presenting work history, MCA/BCA education, and skill level charts.
* **Optimized PDF CV**: Includes a one-click PDF download pointing to a clean, standard CV file (`/assets/resume-shivrajsinh-zala.pdf`). Generated via headless browser print layouts to ensure it has no web elements (nav/footer) and is 100% **ATS-friendly** (optimized down to a lean **134 KB**).
* **Interactive CLI Terminal (`_TERMINAL`)**: An in-browser developer console mockup allowing command-line navigation (`about`, `projects`, `skills`, `clear`, `neofetch`, `secrets`).
* **Interactive Contact Form (`/contact`)**: Form inquiries integrated asynchronously with **Web3Forms** featuring custom GSAP modal states ("TRANSMITTING", "SUCCESS") and field shake validation.
* **A11y & SEO Compliance**: High-contrast ratios to satisfy WCAG AA standards, structured breadcrumbs schema JSON-LD, self-referencing canonical links, and automated sitemap compilation.

---

## 🛠️ Tech Stack

* **Framework**: [Astro v6](https://astro.build/) (Static Site Generation)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (using Vite compilation directives and `@theme` custom HSL bindings)
* **Components**: React.js
* **Animations**: GSAP (GreenSock Animation Platform) & ScrollTrigger
* **Smooth Scrolling**: Lenis
* **Icons**: Lucide Icons
* **Hosting**: GitHub Pages

---

## 📂 Project Structure

```text
/
├── public/
│   ├── assets/
│   │   ├── fonts/         # Preloaded JetBrains Mono & Space Grotesk fonts
│   │   └── resume-shivrajsinh-zala.pdf  # Clean ATS-friendly resume file
│   └── favicon.png
├── src/
│   ├── components/        # Astro & React components (Navbar, Footer, Terminal, etc.)
│   ├── layouts/           # Global HTML wrapper Layout.astro
│   ├── styles/            # Main global.css importing Tailwind CSS v4 directives
│   └── pages/             # Route endpoints:
│       ├── index.astro    # Core Homepage
│       ├── resume.astro   # Interactive CV Webpage
│       ├── resume-pdf.astro # Standalone print layout page used to print the PDF
│       ├── contact.astro  # Web3Forms Contact Form
│       ├── gallery.astro  # Image kit and gallery
│       └── blog/          # SEO blogs and article markdown templates
└── package.json
```

---

## 💻 Developer Commands

All commands are run from the project root directory:

| Command | Action |
| :--- | :--- |
| `npm install` | Installs project dependencies |
| `npm run dev` | Starts local development server at `http://localhost:4321` |
| `npm run build` | Builds optimized static production bundle in `/dist/` |
| `npm run preview` | Previews the compiled `/dist/` output locally |
