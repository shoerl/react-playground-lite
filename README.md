# react-playground-lite

A zero config, Vite first React component playground. Finds components, infers prop controls, serves a fast preview UI at `/__rplite`. No story files.

## Quick start

```bash
yarn install
yarn dev # open http://localhost:5173/__rplite
yarn build # build plugin and runtime
```

## Limitations

- Only default exported function components with typed props are discovered.
- Prop inference supports `string`, `number`, `boolean`, and unions of string literals.

## Roadmap

- Support for named exports and more complex patterns.
- Theming and provider injection.
- Persisted scenarios.
