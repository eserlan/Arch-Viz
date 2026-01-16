---
description: follow mandatory development process (PRs and Tests)
---
Whenever starting a new task, you MUST follow these steps to comply with the project's [CONSTITUTION.md](file:///home/espen/proj/Arch-Viz/CONSTITUTION.md):

1. **Research & Plan**: Understand the requirements and existing implementation.
2. **Branch**: Create a new branch from `main`: `git checkout -b <prefix>/<description>`.
3. **Implement**: 
   - Write the code.
   - Write Unit Tests (`src/**/*.test.ts`).
   - Write E2E Tests (`e2e/**/*.spec.ts`).
4. **Verify**:
   - Run `npm test`.
   - Run `npx playwright test`.
   - Run `npm run lint`.
5. **Commit & Push**: Push the branch to origin.
6. **PR**: Create a Pull Request using the MCP tool, including a thorough description and passing test results.
7. **Artifacts**: Create a `walkthrough.md` to show proof of work.
