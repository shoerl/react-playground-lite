# React Playground Lite (`rplite`)

A zero config, Vite first React component playground. Finds components, infers prop controls, serves a fast preview UI at `/__rplite`. No story files.

## Quick Start

```bash
# Install dependencies
yarn install

# Start the example app and playground
yarn dev
```

The playground will be available at `http://localhost:5173/__rplite`.

## Limitations (MVP)

*   Only discovers default exported React components from `.ts` and `.tsx` files.
*   Prop type inference is limited to `string`, `number`, `boolean`, and unions of string literals.
*   No support for complex types, theming, or provider injection yet.

## Roadmap

*   [ ] Support for named exports.
*   [ ] Better type inference.
*   [ ] Theming and context provider support.
*   [ ] Saving component states as "stories" or "scenarios".
