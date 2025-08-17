import React from 'react'
import ReactDOM from 'react-dom/client'

const styles = {
  display: 'grid',
  placeContent: 'center',
  height: '100vh',
  fontFamily: 'sans-serif',
  textAlign: 'center',
} as React.CSSProperties;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div style={styles}>
      <h1>React Playground Lite</h1>
      <p>
        The component playground is running at{' '}
        <a href="/__rplite">/__rplite</a>.
      </p>
    </div>
  </React.StrictMode>,
)
