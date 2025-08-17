import type { Plugin, ViteDevServer } from 'vite';
import path from 'path';
import { createScanner, Manifest, Scanner } from './scanner.js';

const VIRTUAL_MODULE_ID = 'virtual:rplite-manifest';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

export interface RplitePluginOptions {
  /**
   * The directory to scan for components, relative to the project root.
   * @default 'src'
   */
  srcDir?: string;
}

export default function rplitePlugin(options: RplitePluginOptions = {}): Plugin {
  const { srcDir = 'src' } = options;
  const projectRoot = process.cwd();
  const resolvedSrcDir = path.resolve(projectRoot, srcDir);

  let server: ViteDevServer;
  let scanner: Scanner;
  let manifest: Manifest | null = null;

  const getManifest = () => {
    if (!scanner) {
      scanner = createScanner({
        srcDir: resolvedSrcDir,
        projectRoot,
      });
    }
    // Invalidate manifest cache for every request in dev to catch changes.
    // A watcher is better, but this is simpler for now.
    if (server) {
       return scanner.scan();
    }
    // For build, scan once.
    if (!manifest) {
      manifest = scanner.scan();
    }
    return manifest;
  };

  return {
    name: 'vite-plugin-rplite',

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        const currentManifest = getManifest();
        return `export default ${JSON.stringify(currentManifest)}`;
      }
    },

    configureServer(_server) {
      server = _server;

      server.middlewares.use('/__rplite', (req, res) => {
        const runtimePath = path.resolve(projectRoot, 'packages/runtime/src/index.tsx');
        res.setHeader('Content-Type', 'text/html');
        res.end(`
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
              <script type="module">
                  import React from 'react';
                  import { createRoot } from 'react-dom/client';
                  import { Playground } from '/@fs/${runtimePath}';
                  import manifest from '${VIRTUAL_MODULE_ID}';

                  const container = document.getElementById('root');
                  const root = createRoot(container);
                  root.render(React.createElement(Playground, { manifest }));
              </script>
          </body>
          </html>
        `);
      });

      server.watcher.on('all', (event, filePath) => {
        if (filePath.startsWith(resolvedSrcDir) && (filePath.endsWith('.tsx') || filePath.endsWith('.ts'))) {
          const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID);
          if (mod) {
            server.moduleGraph.invalidateModule(mod);
            server.ws.send({ type: 'full-reload', path: '*' });
          }
        }
      });
    },
  };
}
