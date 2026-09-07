---
trigger: always_on 
---

**Architectural Rules:**
1. **Unique Output**: Generate `presentation-{Title}.html`.
2. **Visual Richness**:
   - Every `section` must support an optional `<img>` with glassmorphism styling.
   - Use high-impact typography (Outfit/Inter).
3. **Responsive Design**: Images must scale elegantly on all devices.
4. **Archetype Selection**: Apply CSS tokens based on the requested archetype (Technical, Comparison, System Guide) from `design.md`.

**Constraint**: Never use placeholders. If no source image is found, use a decorative CSS element.