import { PluginOption, ViteDevServer } from 'vite';
import { createScanner, Manifest } from './scanner';

export interface RPLiteOptions {
  srcDir?: string;
}

const MANIFEST_ID = 'virtual:rplite-manifest';
const RESOLVED_MANIFEST_ID = '\0' + MANIFEST_ID;

export default function rplitePlugin(options: RPLiteOptions = {}): PluginOption {
  const srcDir = options.srcDir ?? 'src';
  const scanner = createScanner({ srcDir });
  let manifest: Manifest = { components: [] };

  return {
    name: 'rplite-plugin',
    resolveId(id) {
      if (id === MANIFEST_ID) return RESOLVED_MANIFEST_ID;
    },
    load(id) {
      if (id === RESOLVED_MANIFEST_ID) {
        manifest = scanner.scan();
        return `export default ${JSON.stringify(manifest)};`;
      }
    },
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/__rplite', (req, res) => {
        const html = `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /></head>
  <body>
    <div id="root"></div>
    <script type="module">
      import React from 'react';
      import ReactDOM from 'react-dom/client';
      import manifest from '${MANIFEST_ID}';
      import { Playground } from '@rplite/runtime';
      const root = ReactDOM.createRoot(document.getElementById('root')!);
      root.render(React.createElement(Playground, { manifest }));
    </script>
  </body>
</html>`;
        res.setHeader('Content-Type', 'text/html');
        res.end(html);
      });
    }
  };
}
