import React from 'react';
import { createRoot } from 'react-dom/client';

let root = createRoot(document.getElementById('root')!);

window.addEventListener('message', async (event) => {
  if (event.data.type === 'rplite-render') {
    const { component, props } = event.data;
    try {
      const componentPath = `/${component.path}`;
      const CompModule = await import(/* @vite-ignore */ componentPath);
      const Component = component.isDefaultExport ? CompModule.default : CompModule[component.name];

      if (Component) {
        const element = React.createElement(Component, props);
        root.render(element);
      } else {
        console.error(`Component not found at ${componentPath}`);
        root.render(React.createElement('div', { style: { color: 'red' } }, `Component not found at ${componentPath}`));
      }
    } catch (e) {
      console.error('Error loading component:', e);
      root.render(React.createElement('div', { style: { color: 'red' } }, (e as Error).message));
    }
  } else if (event.data.type === 'rplite-unmount') {
      root.unmount();
      document.getElementById('root')!.innerHTML = '';
      root = createRoot(document.getElementById('root')!);
  }
});

// Signal to the parent that the iframe is ready to receive messages
window.parent.postMessage({ type: 'rplite-iframe-ready' }, '*');
