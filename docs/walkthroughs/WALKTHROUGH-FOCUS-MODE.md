# Walkthrough: Focus Mode (Toggle UI Panels)

Implemented a "Focus Mode" that allows users to hide all UI elements (sidebar, floating panels, minimap, etc.) with a single click to focus entirely on the diagram.

## Changes

### UI
- **`index.html`**: 
  - Added a floating toggle button in the bottom-left corner with an eye icon.
  - Added `id="appSidebar"` to the sidebar for stable selection.

### Logic
- **`src/logic/ui/focusMode.ts`**:
  - Created `FocusModeManager` to handle global visibility state.
  - **Robust Restoration**: Uses `dataset` to store and restore exact original classes, ensuring responsive designs (like `md:flex`) are preserved.
  - State is persisted in `localStorage`.
  - Dispatches `focus-mode-change` events for other components.
- **`src/logic/ui/appUi.ts`**:
  - Integrated `FocusModeManager` into the application initialization.

## Verification Results

### Automated Tests
- **Unit Tests**: `src/logic/ui/focusMode.test.ts` ✅ (4 passed)
- **E2E Tests**: `e2e/focus-mode.spec.ts` ✅ (2 passed)
- **Regression Tests**: `e2e/exports.spec.ts` ✅ (2 passed)

### Visual Verification
I verified that enabling Focus Mode hides the sidebar, all floating panels, and the minimap, and that these are restored correctly when disabled. The state also persists after a page refresh.

![Focus Mode Demo](../../public/assets/focus_mode_demo.webp)
