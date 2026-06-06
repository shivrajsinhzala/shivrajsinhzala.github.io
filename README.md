# Shivrajsinh Zala — Frontend Developer Portfolio

This is the repository for the personal developer portfolio, blog, and online resume of **Shivrajsinh Zala**, based in Rajkot, Gujarat. The website is styled in a custom, premium, high-contrast **Brutalist Web Design** aesthetic, incorporating tactile mouse-tilt interactions, smooth scroll mechanics, and micro-animations.

---

## 🚀 Key Features

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

### Regenerating the PDF Resume
If you update your credentials in the resume page and want to regenerate the clean ATS PDF, run the local server (`npm run dev`) and compile it using Google Chrome's CLI headless print engine:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --print-to-pdf-no-header --print-to-pdf="./public/assets/resume-shivrajsinh-zala.pdf" http://localhost:4321/resume-pdf
```
Then build the site (`npm run build`) to copy the newly generated PDF into your production deployment assets.
