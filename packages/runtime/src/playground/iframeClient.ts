// This script runs inside the preview iframe. It is responsible for
// receiving messages from the main playground window and rendering the
// selected component.

import React from 'react';
import { createRoot, Root } from 'react-dom/client';

let root: Root | null = null;

// Listen for messages from the parent window (the playground UI).
window.addEventListener('message', async event => {
  // Security: In a real-world scenario, you would want to check `event.origin`
  // to ensure messages are coming from a trusted source.

  if (event.data.type === 'rplite-render') {
    const { component, props } = event.data;
    if (!document.getElementById('root')) {
      console.error('Root element not found in iframe.');
      return;
    }
    // Ensure we have a root to render into.
    if (!root) {
      root = createRoot(document.getElementById('root')!);
    }

    try {
      // Dynamically import the component module.
      // The `/@fs/` prefix is a Vite-specific feature that allows absolute paths.
      // The `/* @vite-ignore */` comment is crucial to prevent Vite from trying
      // to bundle the dynamic import path at build time.
      const componentPath = `/${component.path}`;
      const CompModule = await import(/* @vite-ignore */ componentPath);
      const Component = component.isDefaultExport
        ? CompModule.default
        : CompModule[component.name];

      if (Component) {
        const element = React.createElement(Component, props);
        root.render(element);
      } else {
        console.error(`Component not found at ${componentPath}`);
        root.render(
          React.createElement(
            'div',
            { style: { color: 'red' } },
            `Component not found at ${componentPath}`,
          ),
        );
      }
    } catch (e) {
      console.error('Error loading or rendering component:', e);
      // Display the error in the iframe for easier debugging.
      root.render(
        React.createElement(
          'div',
          { style: { color: 'red' } },
          (e as Error).message,
        ),
      );
    }
  } else if (event.data.type === 'rplite-unmount') {
    // When the component changes, unmount the old one before rendering the new one.
    if (root) {
      root.unmount();
      root = null;
    }
  }
});

// Signal to the parent window that the iframe is ready to receive messages.
window.parent.postMessage({ type: 'rplite-iframe-ready' }, '*');
