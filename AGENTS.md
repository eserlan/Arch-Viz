# Project Context: Arch Viz

This project is a Cytoscape-based architecture visualization tool.
- **Tech Stack:**
  - Vite
  - TypeScript
  - Tailwind CSS
  - Cytoscape.js
  - Vitest (Unit Testing)
  - Playwright (E2E Testing)

## Code Quality & Review Guidelines

We prioritize high test coverage and clean, maintainable logic.

### Review Checklist for Agents:
1.  **Logical Correctness:** Verify that the logic handles edge cases and follows the intended behavior.
2.  **TypeScript Best Practices:** Ensure proper typing, avoid `any` where possible, and use modern TS features.
3.  **Test Coverage & Verification:**
    - New features and major logic changes **MUST** include unit tests.
    - Run `npm run verify` to ensure all tests (unit and E2E), linting, and formatting pass before finalizing.
    - Critical UI flows should be covered by E2E tests in `e2e/`.
4.  **UI/UX Design:** Ensure the UI feels premium and consistent with the existing Tailwind styling.
5.  **Clean Code:** Follow the existing project structure (`src/logic`, `src/styles`, etc.).

## Instructions for Jules

When reviewing a PR:
- If you find issues (bugs, missing tests, poor style), **fix them directly** by amending the PR.
- If the PR is perfect or you have fixed all issues, **approve the PR** so it can be auto-merged.
