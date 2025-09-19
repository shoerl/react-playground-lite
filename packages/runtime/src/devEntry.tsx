import React from 'react';
import { createRoot } from 'react-dom/client';
import type { Manifest } from '../../plugin/src/scanner';
import { Playground } from './playground/Playground';
import manifest from 'virtual:rplite-manifest';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Failed to find #root container for React Playground Lite.');
}

const root = createRoot(container);

root.render(<Playground manifest={manifest as Manifest} />);
