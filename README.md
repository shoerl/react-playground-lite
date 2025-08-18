# React Playground Lite (`rplite`)

<p align="center">
  <strong>A zero-config, Vite-first React component playground.</strong>
  <br />
  `rplite` finds your components, infers controls for their props, and serves a fast, clean UI to preview them. No story files needed.
</p>

<p align="center">
  <img src="https://i.imgur.com/example.png" alt="rplite screenshot" width="600">
</p>

---

## Why `rplite`?

`rplite` is designed for developers who want a simple, fast, and unobtrusive way to visualize their React components. If you're building a component library or just want to work on components in isolation, `rplite` provides the essentials without the boilerplate.

- **For Component-Driven Development**: Work on one component at a time, see its different states, and share your work with your team.
- **For Design Systems**: `rplite` can serve as a lightweight, living documentation for your design system's components.
- **For Rapid Prototyping**: Quickly iterate on component design and functionality in a clean, isolated environment.

## Features

- **🚀 Zero-Configuration**: Drop it into your Vite-powered React project and it just works.
- **🔍 Automatic Component Discovery**: Finds all your exported React components in your source directory.
- **✨ Prop Control Inference**: Automatically generates controls for props with `string`, `number`, `boolean`, and string literal union types.
- **🖼️ Isolated Previews**: Renders each component in an `iframe` to prevent style conflicts.
- **⚡ Fast Development**: Integrates seamlessly with Vite's fast development server and Hot Module Replacement (HMR).

## Quick Start

### 1. Installation

This project is not yet published to npm. To use it, you can clone the repository and use it locally.

```bash
# Clone the repository
git clone https://github.com/your-username/rplite.git
cd rplite

# Install dependencies using Yarn workspaces
yarn install
```

### 2. Vite Configuration

In your own Vite project, you would add `@rplite/plugin`. For this example project, the plugin is already configured in `example/vite.config.ts`.

```typescript
// example/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import rplite from '../packages/plugin/src/index'; // Using local path

export default defineConfig({
  plugins: [
    react(),
    // Add the rplite plugin
    rplite(),
  ],
});
```

### 3. Run the Dev Server

Start the example's Vite development server.

```bash
yarn dev
```

### 4. Open the Playground

Navigate to `http://localhost:5173/__rplite` (or whatever port Vite is using) to see your component playground!

## How It Works

`rplite`'s architecture is simple and leverages the power of Vite's development server.

```mermaid
graph LR
    subgraph Browser
        A[Playground UI @ /__rplite]
        B[User's Application]
    end

    subgraph Vite Dev Server
        C[Vite Server]
        D{rplite Plugin}
        E[Virtual Module: manifest.json]
    end

    subgraph Filesystem
        F[React Components (.tsx)]
    end

    C --> B
    C -- serves --> A

    D -- scans --> F
    F -- informs --> E
    D -- generates & serves --> E
    A -- imports --> E
```

1.  **Plugin Initialization**: The `@rplite/plugin` is added to your Vite config.
2.  **Component Scanning**: On startup, the plugin scans your source code (`src` by default) for React components. It uses the TypeScript compiler to understand your code and extract information about each component and its props.
3.  **Manifest Generation**: The plugin creates a virtual JSON file (the "manifest") in memory that lists all the found components.
4.  **Serving the UI**: The plugin tells the Vite server to serve the `@rplite/runtime` application at the `/__rplite` URL.
5.  **Fetching the Manifest**: The runtime UI fetches the component manifest from the virtual module to know what to display.
6.  **Rendering**: The UI lists the components and, when one is selected, renders it in an `iframe` with controls for its props.

For more technical details, see the README files in the `@rplite/plugin` and `@rplite/runtime` packages.

## Comparison with Other Tools

| Feature                  | `rplite`                                  | Storybook                                  |
| ------------------------ | ----------------------------------------- | ------------------------------------------ |
| **Setup**                | Zero-config, single plugin                | More complex setup, many packages          |
| **"Stories"**            | Not required, components are discovered   | Requires `.stories.js` files for each component |
| **Speed**                | Very fast, built on Vite                  | Can be slower, especially on large projects |
| **Features**             | Focused on component previewing           | Extremely feature-rich (addons, testing, etc.) |
| **Best For**             | Quick, simple component visualization     | Comprehensive design system documentation  |

## Limitations

- Prop type inference is limited to simple primitive types.
- No support for complex theming or context providers yet.

## Roadmap

- [x] Support for named exports.
- [ ] Better type inference for more complex types.
- [ ] Theming and context provider support.
- [ ] Saving component states as "stories" or "scenarios".
- [ ] UI/UX improvements.
