# Repository Guidelines

## Project Structure & Module Organization
React Playground Lite is a Yarn workspaces monorepo. The Vite scanner plugin lives in `packages/plugin/src`, the playground runtime UI in `packages/runtime/src/playground`, and the live integration example in `example/src`. TypeScript build settings are shared via `tsconfig.base.json`, while each package emits compiled artifacts to its own `dist/` directory during builds.

## Environment & Tooling Expectations
- Use Node 24.8.0 as defined in `mise.toml`; keep your runtime in sync before installing packages.
- Enable Corepack and use Yarn 3.2.0 (`packageManager` in the root `package.json`). Avoid mixing in `npm` or `pnpm` installs.
- Install workspace dependencies with `yarn install`; this wires the `workspace:*` links between packages.
- Workspace tooling targets TypeScript 5.3.x and Vite 5.0.x. React 18.2 is the supported runtime for the UI packages.
- Respect package peer dependencies: `@rplite/plugin` peers on `vite` and `typescript`, and `@rplite/runtime` peers on `react` and `react-dom`.
- The plugin exposes `ignore` glob patterns and a `logger` interface for scanner diagnostics; review `packages/plugin/README.md` for usage and update tests in `packages/plugin/test` alongside behavioral changes.

## Build, Test, and Development Commands
- `yarn install` — install all workspace dependencies (run after `corepack enable`).
- `yarn dev` — start the Vite dev server for the example app and expose the playground at `/__rplite` with HMR.
- `yarn preview` — serve the production build generated for the example workspace.
- `yarn build` — compile both `@rplite/plugin` and `@rplite/runtime` via `tsc -p tsconfig.json`.
- `yarn typecheck` — run project references type-checking across `packages/*` and `example`.
- `yarn test` — execute the Vitest suite covering the plugin scanner and runtime manifest contracts.
- `yarn test:watch` — run Vitest in watch mode for rapid feedback while iterating.
- `yarn lint` — currently a stub; update the script alongside any linting setup changes.

## Agent Workflow Expectations
- Commit in meaningful increments as you work. Follow the conventional commit prefixes already in the history and write descriptive subjects.
- Keep worktrees tidy: stage only related changes per commit and ensure formatting and type checks pass before you move on.
- Document notable environment or dependency updates in commits and in this guide so future agents stay aligned.

## Writing Clean, Reusable, and Extensible TS/JS Code

When contributing TypeScript or JavaScript, prioritize clarity, composability, and long-term maintainability. Code should be easy to read, safe to use, and flexible enough to adapt to future needs without unnecessary complexity.

### Core Principles

* **Favor Functional Composition**

  * Use higher-order functions (`map`, `filter`, `reduce`, `flatMap`) where it improves expressiveness.
  * Prefer pure functions and function composition to avoid hidden side effects.
  * Keep logic declarative whenever possible; describe *what* is being done, not *how*.

* **Reuse and Extensibility**

  * Extract shared logic into small, single-purpose utilities.
  * Design APIs and functions to be extensible without requiring large rewrites.
  * Avoid hard-coding special cases; instead, allow configurable parameters or injected strategies when appropriate.

* **Types and Safety**

  * Use TypeScript type definitions where they provide meaningful safety and clarity.
  * Prefer concise, expressive types over verbose or overly complex generics.
  * Leverage `unknown`, `never`, and discriminated unions judiciously to model domain concepts.
  * Don’t sacrifice readability for theoretical “perfect typing”; good sense takes priority.

* **Readability and Consistency**

  * Name variables, functions, and types clearly and consistently.
  * Use consistent formatting and modern syntax (e.g., destructuring, optional chaining).
  * Keep functions small and composable rather than deeply nested.

* **Pragmatism**

  * Avoid dogmatism. If an imperative loop or a simple type annotation is clearer than the “pure” functional or “perfectly strict” alternative, prefer clarity.
  * Strike a balance between safety and verbosity. The goal is understandable, maintainable code, not theoretical perfection.

### Quick Guidelines

* Start with a pure, functional approach; fall back to imperative only if it’s more readable.
* Extract and reuse logic rather than duplicating.
* Use TypeScript types to capture intent and prevent errors, not to burden the reader.
* Always ask: *Will the next person understand and extend this code easily?*

## Coding Style & Naming Conventions
Code is written in TypeScript with native ES modules. Use two-space indentation, single quotes for strings, and trailing commas where TypeScript defaults produce them. Components should use PascalCase filenames (`Playground.tsx`), helper utilities camelCase, and exported APIs document intent with concise TSDoc blocks. Prefer named exports so the plugin can discover components reliably; default exports are supported but should be reserved for entry points.

## Testing Guidelines
- Run `yarn test` (Vitest) for scanner/runtime coverage and `yarn typecheck` for project references before opening a PR.
- Keep new specs close to the code they cover (e.g., `*.test.ts` beside the implementation).
- Document any manual verification (`yarn dev`, `/__rplite` smoke test) in the pull request description.
- Update the relevant `packages/**/CHANGELOG.md` entry when behaviour changes for a published package.

## Commit & Pull Request Guidelines
Existing history follows conventional prefixes (`feat:`, `fix:`, etc.) with concise summaries and optional issue references (`(#123)`). Use the same format and group related changes per commit. Pull requests should describe the problem, the solution, and manual test evidence; include screenshots for UI-facing updates and note any impacts on the plugin manifest or runtime API. Keep branches rebased onto `main` before requesting review.
