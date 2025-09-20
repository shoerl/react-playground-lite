# React Playground Lite Roadmap

## Guiding Objectives
- Deliver a stable, publish-ready Vite plugin that discovers React components reliably with minimal configuration.
- Provide a polished playground runtime that feels first-party to Vite/React developers and showcases inferred controls.
- Maintain an example app that demonstrates real-world usage patterns and doubles as a manual QA surface.
- Establish tooling, testing, and documentation guardrails so future contributors can iterate confidently.

## Phase 1 · Core Plugin Hardening (Weeks 1-2)
- **Scanner resilience**: Improve file system watching, ignored paths configuration, and error surfacing during component discovery.
- **Prop inference coverage**: Extend TypeScript analysis to support arrays, enums, and discriminated unions, and document unsupported cases.
- **Manifest contract**: Version the generated manifest schema, add validation, and ensure backwards compatibility within the runtime.
- **Packaging readiness**: Strip emitted `.js/.d.ts` artifacts from source, add `files` fields, and prep `CHANGELOG.md` for publishing.
- **Developer diagnostics**: Introduce optional verbose logging and a `warn` channel for partial inference results.

## Phase 2 · Playground Runtime UX (Weeks 3-4)
- **Navigation polish**: Add search/filter, recent components, and responsive layout handling for narrow viewports.
- **Control widgets**: Map inferred prop types to richer controls (color pickers, enum radios, JSON editors) with sensible defaults.
- **Preview stability**: Harden iframe messaging, error boundaries, and loading states to avoid blank panes during refreshes.
- **Theming hooks**: Provide light/dark themes and allow host projects to override base tokens via CSS variables.
- **Accessibility pass**: Audit keyboard navigation and ARIA semantics to ensure the playground meets AA guidelines.

## Phase 3 · Workflow & Tooling (Week 5)
- **Type-safe integration tests**: Add Vitest + React Testing Library for runtime views and unit coverage for plugin utilities.
- **CI pipeline**: Configure GitHub Actions for `lint`, `typecheck`, and example build, including Node matrix (18.x, 20.x, 22.x).
- **Release scripts**: Automate version bumps and changelog generation via Changesets or custom scripts.
- **Docs site seed**: Generate shared docs (Quick Start, API, FAQ) with VitePress, sourcing content from package READMEs.
- **Contribution templates**: Add issue/PR templates that gather environment, repro steps, and screenshots.

## Phase 4 · Example Application Showcase (Week 6)
- **Component library**: Build a small, themed component set (buttons, forms, layout primitives) to demonstrate control breadth.
- **Scenario presets**: Save curated prop combos as "scenarios" and surface them in the runtime for quick toggling.
- **Design system integration**: Wire Tailwind or styled-components to show customization paths and document setup in the example.
- **Performance profiling**: Measure HMR and initial load, log metrics, and optimize bundler config or code splitting as needed.
- **Tutorial flow**: Add guided steps in the example README walking new users from install to customization.

## Ongoing Maintenance Tracks
- Review community feedback weekly and slot fixes into the appropriate phase.
- Keep dependencies current inside declared support windows (React 18 LTS, Vite 5 minor releases, TypeScript quarterly updates).
- Document manual QA steps in `AGENTS.md` after each significant feature landing.
- Schedule monthly housekeeping: dependency audits, broken link checks, and playground visual regression sweeps.
