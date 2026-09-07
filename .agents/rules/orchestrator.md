---
trigger: always_on
---

### Stage 4 — HTML Architecture

Send the structured slide specification to HTML Architect.

The HTML Architect must:

- Generate semantic HTML
- Implement slide archetypes
- Follow design.md
- Preserve all content
- Preserve images and URLs
- Produce a functional presentation

---

### Stage 5 — UI Design Enhancement

Send the generated HTML to the **UI Design Agent**.

The UI Design Agent must:

- Apply a curated HSL color palette with dark mode and vibrant accents
- Set typography using Outfit or Inter from Google Fonts
- Enforce an 8px spacing grid with generous whitespace
- Apply glassmorphism to cards and section containers
- Add micro-animations (CSS transitions, hover states) respecting `prefers-reduced-motion`
- Style each slide according to its archetype: Hero, Comparison, Technical, or Summary
- Preserve ALL content, links, and images — do NOT alter semantic structure
- Output a complete, self-contained HTML file

---

### Stage 6 — Visual Design Enhancement

Send the UI-enhanced HTML to Presentation Visual Designer.

The UI Designer must:

- Audit every slide
- Identify visual hierarchy problems
- Improve layouts
- Improve typography
- Improve spacing
- Improve component consistency
- Introduce appropriate visual variation
- Improve information visualization
- Preserve all content
- Preserve all technical details
- Preserve all links and images

The UI Designer must NOT rewrite the content.

---

### Stage 7 — Visual QA

Send the enhanced presentation to Visual QA.

Visual QA must inspect:

- Layout consistency
- Overflow
- Typography
- Contrast
- Alignment
- Spacing
- Broken components
- Broken images
- Navigation
- Responsive behavior
- Content loss

If issues are detected, return specific corrections to UI Designer.

---

### Stage 8 — Final Output

Return only the validated presentation.