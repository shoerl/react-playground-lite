import React, { useState, useMemo, useEffect } from 'react';
import type { Manifest, ComponentDef } from '../../../plugin/src/scanner';
import { Controls } from './Controls';
import { Preview } from './Preview';

interface PlaygroundProps {
  manifest: Manifest;
}

const playgroundStyles: React.CSSProperties = {
  display: 'flex',
  height: '100vh',
  width: '100vw',
  overflow: 'hidden',
  backgroundColor: '#f0f0f0',
};

const sidebarStyles: React.CSSProperties = {
  width: '250px',
  flexShrink: 0,
  backgroundColor: '#fff',
  borderRight: '1px solid #e0e0e0',
  padding: '16px',
  overflowY: 'auto',
};

const listStyles: React.CSSProperties = {
    listStyle: 'none',
    padding: 0,
    margin: 0,
};

const listItemStyles: React.CSSProperties = {
    padding: '8px 12px',
    cursor: 'pointer',
    borderRadius: '4px',
    marginBottom: '4px',
};

const controlsPanelStyles: React.CSSProperties = {
  width: '300px',
  flexShrink: 0,
  backgroundColor: '#fff',
  borderRight: '1px solid #e0e0e0',
  overflowY: 'auto',
};

const previewPanelStyles: React.CSSProperties = {
  flexGrow: 1,
  position: 'relative',
};

export function Playground({ manifest }: PlaygroundProps) {
  const [selectedComponentPath, setSelectedComponentPath] = useState<string | null>(null);
  const [propValues, setPropValues] = useState<Record<string, any>>({});

  const sortedComponents = useMemo(() => {
    return [...manifest.components].sort((a, b) => a.name.localeCompare(b.name));
  }, [manifest.components]);

  useEffect(() => {
    if (!selectedComponentPath && sortedComponents.length > 0) {
      setSelectedComponentPath(sortedComponents[0].path);
    }
  }, [sortedComponents, selectedComponentPath]);

  const selectedComponent = useMemo(() => {
    return manifest.components.find(c => c.path === selectedComponentPath);
  }, [selectedComponentPath, manifest.components]);

  useEffect(() => {
    if (selectedComponent) {
      const initialProps: Record<string, any> = {};
      for (const [propName, propDef] of Object.entries(selectedComponent.props)) {
        if (propDef.type === 'boolean') {
          initialProps[propName] = false;
        } else if (propDef.type === 'union' && propDef.options.length > 0) {
          initialProps[propName] = propDef.options[0];
        }
      }
      setPropValues(initialProps);
    } else {
      setPropValues({});
    }
  }, [selectedComponent]);

  const handleValueChange = (propName: string, value: any) => {
    setPropValues(prev => ({ ...prev, [propName]: value }));
  };

  return (
    <div style={playgroundStyles}>
      <aside style={sidebarStyles}>
        <h2 style={{ fontSize: '18px', marginTop: 0 }}>Components</h2>
        <ul style={listStyles}>
          {sortedComponents.map(c => (
            <li
              key={c.path}
              onClick={() => setSelectedComponentPath(c.path)}
              style={{
                ...listItemStyles,
                backgroundColor: selectedComponentPath === c.path ? '#e0eafc' : 'transparent',
                fontWeight: selectedComponentPath === c.path ? 600 : 'normal',
              }}
            >
              {c.name}
            </li>
          ))}
        </ul>
      </aside>

      {selectedComponent && (
        <>
          <aside style={controlsPanelStyles}>
            <Controls
              component={selectedComponent}
              values={propValues}
              onValueChange={handleValueChange}
            />
          </aside>
          <main style={previewPanelStyles}>
            <Preview component={selectedComponent} props={propValues} />
          </main>
        </>
      )}

      {!selectedComponent && (
        <main style={{ ...previewPanelStyles, display: 'grid', placeContent: 'center' }}>
          <p>Select a component to preview</p>
        </main>
      )}
    </div>
  );
}
