import type { Plugin, ViteDevServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { createScanner, type Scanner } from './scanner';
import type { Manifest } from './manifest';

export { MANIFEST_VERSION } from './manifest';
export type { Manifest } from './manifest';
export type { ComponentDef, PropDef } from './scanner';

/**
 * @internal
 * The virtual module ID for the component manifest.
 */
const VIRTUAL_MODULE_ID = 'virtual:rplite-manifest';

/**
 * @internal
 * The resolved virtual module ID.
 */
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

/**
 * Options for the rplite Vite plugin.
 */
export interface RplitePluginOptions {
  /**
   * The directory to scan for components, relative to the project root.
   * @default 'src'
   */
  srcDir?: string;
}

/**
 * A Vite plugin that discovers React components, generates a manifest,
 * and serves a playground UI to preview them.
 *
 * @param options - The plugin options.
 * @returns A Vite plugin object.
 */
export default function rplitePlugin(options: RplitePluginOptions = {}): Plugin {
  const { srcDir = 'src' } = options;
  const projectRoot = process.cwd();
  const resolvedSrcDir = path.resolve(projectRoot, srcDir);
  const pluginDir = path.dirname(fileURLToPath(import.meta.url));
  const localRuntimeDevEntry = path.resolve(
    pluginDir,
    '../../runtime/src/devEntry.tsx',
  );
  const requireFromPlugin = createRequire(import.meta.url);
  let cachedDevEntryPath: string | null = null;

  let server: ViteDevServer;
  let scanner: Scanner;
  let manifest: Manifest | null = null;

  /**
   * Lazily creates a scanner and returns the component manifest.
   * In development, it rescans on every request to ensure freshness.
   * In build mode, it scans once and caches the result.
   */
  const getManifest = () => {
    if (!scanner) {
      scanner = createScanner({
        srcDir: resolvedSrcDir,
        projectRoot,
      });
    }
    // Invalidate manifest cache for every request in dev to catch changes.
    // A watcher-based approach would be more efficient, but this is simple.
    if (server) {
      return scanner.scan();
    }
    // For build, scan once and cache.
    if (!manifest) {
      manifest = scanner.scan();
    }
    return manifest;
  };

  return {
    name: 'vite-plugin-rplite',

    /**
     * Resolves the virtual module ID for the manifest.
     */
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }
    },

    /**
     * Loads the virtual module by generating and returning the manifest as a JSON string.
     */
    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        const currentManifest = getManifest();
        return `export default ${JSON.stringify(currentManifest)}`;
      }
    },

    /**
     * Configures the Vite development server.
     * - Serves the playground UI at `/__rplite`.
     * - Sets up a file watcher to invalidate the manifest and trigger a reload on component changes.
     */
    configureServer(_server) {
      server = _server;

      // Middleware to serve the playground HTML
      server.middlewares.use('/__rplite', async (req, res, next) => {
        // Resolve the runtime development entry point from the project root.
        // This is a bit brittle and assumes a monorepo structure.
        if (!cachedDevEntryPath) {
          try {
            const runtimePackageJson = requireFromPlugin.resolve(
              '@rplite/runtime/package.json',
              { paths: [projectRoot] },
            );
            cachedDevEntryPath = path.resolve(
              path.dirname(runtimePackageJson),
              'src/devEntry.tsx',
            );
          } catch (error) {
            if (fs.existsSync(localRuntimeDevEntry)) {
              cachedDevEntryPath = localRuntimeDevEntry;
            } else {
              next(error as Error);
              return;
            }
          }
        }

        const template = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>React Playground Lite</title>
              <style> body { margin: 0; font-family: sans-serif; } </style>
          </head>
          <body>
              <div id="root"></div>
              <script type="module" src="/@fs/${cachedDevEntryPath}"></script>
          </body>
          </html>
        `;

        try {
          const requestUrl = req.originalUrl ?? req.url ?? '/__rplite';
          const html = await server.transformIndexHtml(requestUrl, template);
          res.setHeader('Content-Type', 'text/html');
          res.end(html);
        } catch (error) {
          next(error as Error);
        }
      });

      // Watch for changes in component files and invalidate the manifest module
      server.watcher.on('all', (_event, filePath) => {
        if (
          filePath.startsWith(resolvedSrcDir) &&
          (filePath.endsWith('.tsx') || filePath.endsWith('.ts'))
        ) {
          const mod =
            server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID);
          if (mod) {
            server.moduleGraph.invalidateModule(mod);
            // Trigger a full page reload to update the playground
            server.ws.send({ type: 'full-reload', path: '*' });
          }
        }
      });
    },
  };
}
