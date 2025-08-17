export default `import React from "react";
import { createRoot } from "react-dom/client";

let root: any;
let Comp: any;

window.addEventListener('message', async (e) => {
  const msg = e.data;
  if (msg.type === 'init') {
    const mod = await import(msg.componentPath);
    Comp = mod.default;
    root = createRoot(document.getElementById('root')!);
  }
  if (msg.type === 'render' && Comp && root) {
    root.render(React.createElement(Comp, msg.props));
  }
});
`;
