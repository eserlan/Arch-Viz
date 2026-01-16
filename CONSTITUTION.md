# Project Constitution: Arch-Viz

This document defines the mandatory development process for all contributors (human or AI). Following these rules ensures code quality, stability, and a clear audit trail.

## 1. Branching Strategy
- **NO DIRECT PUSHES TO `main`**: All changes must be made in a separate feature or bug-fix branch.
- **Naming Convention**: Use descriptive prefixes:
  - `feat/`: For new features (e.g., `feat/viewport-export`)
  - `fix/`: For bug fixes (e.g., `fix/stale-cy-instance`)
  - `chore/`: For maintenance (e.g., `chore/linting-setup`)

## 2. Testing Requirements
- **Mandatory Tests**: Every new feature or bug fix MUST include corresponding tests.
  - **Unit Tests**: Use Vitest for logic and utility functions.
  - **E2E Tests**: Use Playwright for UI interactions and integrated flows.
- **Verification**: All existing tests must pass before a branch is pushed.
  - `npm test`: Runs Vitest suite.
  - `npx playwright test`: Runs E2E suite.

## 3. Pull Request Process
- **Mandatory PRs**: All branches must be merged via a Pull Request.
- **Documentation**: PR descriptions must include:
  - The problem or feature being addressed.
  - A summary of changes.
  - Proof of verification (e.g., test results, screenshots).
- **Walkthroughs**: Include a `walkthrough.md` artifact in the PR for visual and structural review.

## 4. Code Standards
- **Linting & Formatting**: Use ESLint and Prettier. Run `npm run lint` and `npm run format` before committing.
- **No Placeholders**: Do not use placeholder images or "TODO" code in submitted PRs.

---

> [!IMPORTANT]
> Failure to follow these rules is considered a "critical error". Always consult this document before starting any task.
