import React, { useEffect, useRef } from 'react';
import type { ComponentDef } from '../../../plugin/src/scanner';

/**
 * Props for the `Preview` component.
 */
interface PreviewProps {
  /** The definition of the component to preview. */
  component?: ComponentDef;
  /** The props to pass to the component. */
  props: Record<string, any>;
}

/**
 * The HTML content for the preview iframe.
 * It includes a root element for React to render into and a client script
 * that handles communication with the main playground app.
 * @internal
 */
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

/**
 * Renders a component in an isolated iframe.
 * Communication with the iframe is done via `postMessage`.
 */
export function Preview({ component, props }: PreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isReadyRef = useRef(false);

  // Effect to handle the 'ready' message from the iframe.
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (
        event.source === iframeRef.current?.contentWindow &&
        event.data.type === 'rplite-iframe-ready'
      ) {
        isReadyRef.current = true;
        // Once the iframe is ready, send the initial render message.
        sendRenderMessage();
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
    // This effect should only run once when the component mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Sends a message to the iframe to render the component with the current props.
   */
  const sendRenderMessage = () => {
    if (iframeRef.current?.contentWindow && component && isReadyRef.current) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'rplite-render',
          component,
          props,
        },
        '*', // Allow any origin to receive the message.
      );
    }
  };

  // Effect to unmount the old component when the selected component changes.
  useEffect(() => {
    if (iframeRef.current?.contentWindow && isReadyRef.current) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'rplite-unmount' },
        '*',
      );
    }
  }, [component?.path]);

  // Effect to send a render message whenever the props or component change.
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
