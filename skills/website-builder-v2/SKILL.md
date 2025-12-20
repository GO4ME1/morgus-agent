# 🚀 Morgus Website Builder Skill v2.0

## 🌟 Overview

This skill empowers Morgus to architect and construct cutting-edge, professional websites. It's not just about code; it's about creating an experience. This guide ensures every website is built with a foundation of modern best practices, from initial concept to final deployment.

**The Morgus Philosophy:** We build websites that are not only visually stunning but also performant, accessible, and scalable. Every project is a testament to quality and innovation.

---

## 🔮 The Morgus Touch: Core Principles

| Principle | Description |
|---|---|
| **Clarity & Purpose** | Every website must have a clear goal. What should the user do? Learn, buy, sign up? This dictates the entire structure. |
| **User-Centric Design** | We design for the user first. The experience should be intuitive, engaging, and seamless across all devices. |
| **Performance is Key** | A slow website is a broken website. We prioritize speed through optimization at every step. |
| **Secure by Default** | Security is not an afterthought. We build with security in mind from the ground up. |
| **Future-Proof** | We use modern, stable technologies to ensure the website is maintainable and scalable for the future. |

---

## 🛠️ The Build Process: A Step-by-Step Guide

### Phase 1: Discovery & Planning

1.  **Define the Goal:**
    *   Use `ask` to clarify the primary objective of the website (e.g., lead generation, e-commerce, portfolio).
2.  **Identify the Target Audience:**
    *   Who is this website for? Understanding the user helps tailor the design and content.
3.  **Content Strategy:**
    *   What information needs to be on the site? Plan the key sections (Home, About, Services, Contact, etc.).
4.  **Tech Stack Selection:**
    *   For most static sites, **Vite + React + TypeScript + TailwindCSS** is the recommended stack for its performance and developer experience.
    *   Use `webdev_init_project` with the `web-static` scaffold.

### Phase 2: Design & Prototyping

1.  **Logo & Branding:**
    *   Use `generate` to create a unique logo.
    *   Establish a color palette (primary, secondary, accent) and typography.
2.  **Layout & Wireframing:**
    *   Create a low-fidelity layout for each page. Focus on structure and user flow.
    *   **Morgus Pro-Tip:** Use a design tool like Figma or simply sketch it out in a markdown file.
3.  **Visual Design:**
    *   Apply the branding to the wireframes.
    *   Ensure visual hierarchy, contrast, and a clean, modern aesthetic.

### Phase 3: Development

1.  **Component-Based Architecture:**
    *   Break down the design into reusable React components (e.g., Navbar, Hero, Footer, Card).
2.  **Semantic HTML:**
    *   Use meaningful HTML tags (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`) for accessibility and SEO.
3.  **Responsive Design with TailwindCSS:**
    *   Use Tailwind's mobile-first utility classes to ensure the site looks great on all devices.
    *   Example:
        ```html
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- This will be a single column on mobile, and a 3-column grid on medium screens and up -->
        </div>
        ```
4.  **Accessibility (a11y):**
    *   Ensure all images have `alt` tags.
    *   Use proper heading structure (H1, H2, H3).
    *   Ensure sufficient color contrast.

### Phase 4: Optimization & Deployment

1.  **Image Optimization:**
    *   Use modern formats like WebP.
    *   Compress images to reduce file size.
2.  **Performance Tuning:**
    *   Minify CSS and JavaScript (Vite handles this automatically in the build process).
    *   Use lazy loading for images and videos below the fold.
3.  **Deployment:**
    *   Use `wrangler pages deploy` to deploy to Cloudflare Pages for global distribution and free SSL.
    *   Provide instructions for connecting a custom domain.

---

## ✨ The Morgus Flair: Signature Elements

*   **Subtle Animations & Transitions:** Use CSS transitions to add a touch of elegance to hover states and interactions.
*   **Engaging Micro-interactions:** Provide feedback for user actions (e.g., button clicks, form submissions).
*   **Dark Mode:** Always offer a dark mode option for user preference and comfort.
*   **Custom 404 Page:** Create a unique and helpful 404 page that guides users back on track.

---

## 📚 Resources & References

*   [React Documentation](https://react.dev/)
*   [TailwindCSS Documentation](https://tailwindcss.com/docs)
*   [Vite Documentation](https://vitejs.dev/)
*   [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/standards-guidelines/wcag/)
