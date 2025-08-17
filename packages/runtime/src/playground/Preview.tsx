import React, { useEffect, useRef } from 'react';
import { ComponentDef } from './Playground';
import iframeClient from './iframeClient';

interface PreviewProps {
  component: ComponentDef;
  props: Record<string, any>;
}

export default function Preview({ component, props }: PreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    iframe.contentWindow?.postMessage({ type: 'init', componentPath: '/' + component.path }, '*');
  }, [component]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    iframe.contentWindow?.postMessage({ type: 'render', props }, '*');
  }, [props]);

  const srcDoc = `<!DOCTYPE html>
<html>
  <body>
    <div id="root"></div>
    <script type="module">
      ${iframeClient}
    </script>
  </body>
</html>`;

  return <iframe ref={iframeRef} style={{ flex: 1, border: 'none' }} srcDoc={srcDoc} />;
}
