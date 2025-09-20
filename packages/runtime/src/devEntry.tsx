import React from 'react';
import { createRoot } from 'react-dom/client';
import { Playground } from './playground/Playground';
import { validateManifest } from './manifest';
import manifestModule from 'virtual:rplite-manifest';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Failed to find #root container for React Playground Lite.');
}

const root = createRoot(container);
const manifest = validateManifest(manifestModule);

root.render(<Playground manifest={manifest} />);
