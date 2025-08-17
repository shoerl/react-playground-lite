import React, { useEffect, useRef } from 'react';
import type { ComponentDef } from '../../../plugin/src/scanner';

interface PreviewProps {
  component?: ComponentDef;
  props: Record<string, any>;
}

const iframeContent = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Preview</title>
    <style>
      body { margin: 0; }
      #root {
        padding: 1rem;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        box-sizing: border-box;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/@fs/${process.cwd()}/packages/runtime/src/playground/iframeClient.ts"></script>
  </body>
</html>
`;

export function Preview({ component, props }: PreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isReadyRef = useRef(false);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.source === iframeRef.current?.contentWindow && event.data.type === 'rplite-iframe-ready') {
        isReadyRef.current = true;
        sendRenderMessage();
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [component]);

  const sendRenderMessage = () => {
    if (iframeRef.current?.contentWindow && component && isReadyRef.current) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'rplite-render',
          componentPath: `/${component.path}`,
          props,
        },
        '*'
      );
    }
  };

  useEffect(() => {
     // When component changes, tell iframe to unmount the old one before we send the new one.
     if (iframeRef.current?.contentWindow && isReadyRef.current) {
        iframeRef.current.contentWindow.postMessage({ type: 'rplite-unmount' }, '*');
     }
  }, [component?.path])

  useEffect(() => {
    sendRenderMessage();
  }, [props, component?.path]);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={iframeContent}
      style={{
        width: '100%',
        height: '100%',
        border: 0,
        backgroundColor: '#fff',
      }}
      title="Component Preview"
    />
  );
}
