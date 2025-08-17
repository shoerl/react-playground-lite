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
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [propValues, setPropValues] = useState<Record<string, any>>({});

  const sortedComponents = useMemo(() => {
    return [...manifest.components].sort((a, b) => {
      const aName = a.isDefaultExport ? a.path : `${a.path} / ${a.name}`;
      const bName = b.isDefaultExport ? b.path : `${b.path} / ${b.name}`;
      return aName.localeCompare(bName);
    });
  }, [manifest.components]);

  useEffect(() => {
    if (!selectedComponentId && sortedComponents.length > 0) {
      const firstComponent = sortedComponents[0];
      setSelectedComponentId(`${firstComponent.path}:${firstComponent.name}`);
    }
  }, [sortedComponents, selectedComponentId]);

  const selectedComponent = useMemo(() => {
    if (!selectedComponentId) return null;
    const [path, name] = selectedComponentId.split(':');
    return manifest.components.find(c => c.path === path && c.name === name) ?? null;
  }, [selectedComponentId, manifest.components]);

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
          {sortedComponents.map(c => {
            const id = `${c.path}:${c.name}`;
            const displayName = c.isDefaultExport
              ? c.path.split('/').pop()?.replace('.tsx', '')
              : `${c.path.split('/').pop()?.replace('.tsx', '')} / ${c.name}`;

            return (
              <li
                key={id}
                onClick={() => setSelectedComponentId(id)}
                style={{
                  ...listItemStyles,
                  backgroundColor: selectedComponentId === id ? '#e0eafc' : 'transparent',
                  fontWeight: selectedComponentId === id ? 600 : 'normal',
                }}
              >
                {displayName}
              </li>
            );
          })}
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
