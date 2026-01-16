# Walkthrough: Viewport-Only Image Export

I have updated the image export functionality to capture only the active viewport, as requested. This allows for more focused captures of specific areas of the diagram.

## Changes Made

### Logic Layer
- **[exports.ts](file:///home/espen/proj/Arch-Viz/src/logic/utils/exports.ts)**: Changed `full: true` to `full: false` in `cy.png()` options for both clipboard and file saving.

## Verification Results

### Manual Verification
1.  **Zoomed In**: Verified that exporting while zoomed in produces an image of just that area.
2.  **Zoomed Out**: Verified that exporting while zoomed out produces an image of the entire visible area.

![Verification Recording](/home/espen/.gemini/antigravity/brain/4029e4cf-b265-4f1a-9d63-a52d5300dfa6/verify_viewport_export_1768557561066.webp)

---

The export buttons now correctly capture exactly what you see on the screen.
