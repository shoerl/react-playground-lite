# Contributing to React Playground Lite (`rplite`)

First off, thank you for considering contributing! We welcome any and all help. By participating in this project, you agree to abide by our [Code of Conduct](#code-of-conduct).

## How to Contribute

There are many ways to contribute, from writing documentation to fixing bugs to suggesting new features.

- **Reporting Bugs**: If you find a bug, please open an issue and provide as much detail as possible, including steps to reproduce it.
- **Suggesting Enhancements**: If you have an idea for a new feature or an improvement, open an issue to discuss it.
- **Pull Requests**: If you're ready to contribute code, please see the sections below on setting up your development environment and submitting a pull request.

## Development Setup

This project is a monorepo using Yarn workspaces. To get started, install [Node.js 24.8.0](https://nodejs.org/) (see `mise.toml`) and [Yarn 3.2.0](https://yarnpkg.com/) via Corepack.

1.  **Fork and Clone the Repository**

    ```bash
    git clone https://github.com/your-username/rplite.git
    cd rplite
    ```

2.  **Enable Corepack**

    This project uses a specific version of Yarn managed by Corepack. You may need to enable it first.

    ```bash
    corepack enable
    ```

3.  **Install Dependencies**

    From the root of the project, run `yarn install`. This will install dependencies for all the packages (`plugin`, `runtime`, `example`) and link them together.

    ```bash
    yarn install
    ```

4.  **Build the Workspace Packages**

    Emit the `dist/` artifacts required by the plugin and runtime:

    ```bash
    yarn build
    ```

5.  **Start the Development Server**

    The best way to see your changes in action is to run the `example` application, which uses the `rplite` plugin and runtime.

    ```bash
    yarn dev
    ```

    This will start the Vite development server for the `example` app.
    - The example app will be available at `http://localhost:5173`.
    - The `rplite` playground will be at `http://localhost:5173/__rplite`.

    Any changes you make to the `plugin` or `runtime` packages will be reflected in the running example thanks to Vite's HMR and Yarn workspaces.

## Project Structure

The monorepo is organized into three main directories:

-   `packages/plugin`: The core Vite plugin. This is where the component scanning and manifest generation logic lives. See the [package README](./packages/plugin/README.md) for more details.
-   `packages/runtime`: The React application for the playground UI. See the [package README](./packages/runtime/README.md) for more details.
-   `example`: A simple Vite + React application that uses the `rplite` plugin. This is used for testing and development.

## Coding Style

- Follow the guidelines in [`AGENTS.md`](./AGENTS.md), especially the "Writing Clean, Reusable, and Extensible TS/JS Code" section.
- Keep changes small, composable, and well named. Prefer TypeScript types that communicate intent without unnecessary complexity.
- The `yarn lint` script is currently a stub; rely on `yarn typecheck`, unit tests, and manual review to validate changes.

## Submitting a Pull Request

1.  Create a new branch from `main` for your feature or bug fix.
2.  Make your changes, following the coding style guidelines.
3.  Run the workspace checks:

    ```bash
    yarn typecheck
    yarn test
    yarn build
    ```

4.  Update the relevant package changelog(s) under `packages/**/CHANGELOG.md` when you change published behaviour.
5.  Verify that the `example` app still works as expected with your changes.
6.  Push your branch and open a pull request to the `main` branch.
7.  In your pull request description, please explain the changes you've made and why. Link to any relevant issues.

---

## Code of Conduct

### Our Pledge

We as members, contributors, and leaders pledge to make participation in our community a harassment-free experience for everyone, regardless of age, body size, visible or invisible disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

Examples of behavior that contributes to a positive environment include:
- Demonstrating empathy and kindness toward other people
- Being respectful of differing opinions, viewpoints, and experiences
- Giving and gracefully accepting constructive feedback
- Accepting responsibility and apologizing to those affected by our mistakes, and learning from the experience
- Focusing on what is best not just for us as individuals, but for the overall community

### Enforcement

Violations of the Code of Conduct may be reported by sending an email to the project owner. All complaints will be reviewed and investigated promptly and fairly. All community leaders are obligated to respect the privacy and security of the reporter of any incident.
