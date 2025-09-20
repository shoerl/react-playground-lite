# Repository Guidelines

## Project Structure & Module Organization
React Playground Lite is a Yarn workspaces monorepo. The Vite scanner plugin lives in `packages/plugin/src`, the playground runtime UI in `packages/runtime/src/playground`, and the live integration example in `example/src`. TypeScript build settings are shared via `tsconfig.base.json`, while each package emits compiled artifacts to its own `dist/` directory during builds.

## Environment & Tooling Expectations
- Use Node 24.8.0 as defined in `mise.toml`; keep your runtime in sync before installing packages.
- Enable Corepack and use Yarn 3.2.0 (`packageManager` in the root `package.json`). Avoid mixing in `npm` or `pnpm` installs.
- Install workspace dependencies with `yarn install`; this wires the `workspace:*` links between packages.
- Workspace tooling targets TypeScript 5.3.x and Vite 5.0.x. React 18.2 is the supported runtime for the UI packages.
- Respect package peer dependencies: `@rplite/plugin` peers on `vite` and `typescript`, and `@rplite/runtime` peers on `react` and `react-dom`.

## Build, Test, and Development Commands
- `yarn install` — install all workspace dependencies (run after `corepack enable`).
- `yarn dev` — start the Vite dev server for the example app and expose the playground at `/__rplite` with HMR.
- `yarn preview` — serve the production build generated for the example workspace.
- `yarn build` — compile both `@rplite/plugin` and `@rplite/runtime` via `tsc -p tsconfig.json`.
- `yarn typecheck` — run project references type-checking across `packages/*` and `example`.
- `yarn lint` — currently a stub; update the script alongside any linting setup changes.

## Agent Workflow Expectations
- Commit in meaningful increments as you work. Follow the conventional commit prefixes already in the history and write descriptive subjects.
- Keep worktrees tidy: stage only related changes per commit and ensure formatting and type checks pass before you move on.
- Document notable environment or dependency updates in commits and in this guide so future agents stay aligned.

## Coding Style & Naming Conventions
Code is written in TypeScript with native ES modules. Use two-space indentation, single quotes for strings, and trailing commas where TypeScript defaults produce them. Components should use PascalCase filenames (`Playground.tsx`), helper utilities camelCase, and exported APIs document intent with concise TSDoc blocks. Prefer named exports so the plugin can discover components reliably; default exports are supported but should be reserved for entry points.

## Testing Guidelines
Automated tests are not yet configured. When introducing features, rely on `yarn typecheck` and the example app for regression coverage, and call out manual verification steps in the pull request. If you add a testing framework (Vitest or React Testing Library are good candidates), colocate specs beside the implementation using a `.test.ts` or `.test.tsx` suffix and document any new commands in `package.json`.

## Commit & Pull Request Guidelines
Existing history follows conventional prefixes (`feat:`, `fix:`, etc.) with concise summaries and optional issue references (`(#123)`). Use the same format and group related changes per commit. Pull requests should describe the problem, the solution, and manual test evidence; include screenshots for UI-facing updates and note any impacts on the plugin manifest or runtime API. Keep branches rebased onto `main` before requesting review.
