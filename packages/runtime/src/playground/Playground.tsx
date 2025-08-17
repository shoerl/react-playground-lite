import React, { useState } from 'react';
import Controls from './Controls';
import Preview from './Preview';

export type PropDef =
  | { type: 'string' }
  | { type: 'number' }
  | { type: 'boolean' }
  | { type: 'union'; options: string[] };

export type ComponentDef = {
  name: string;
  path: string;
  props: Record<string, PropDef>;
};

export type Manifest = { components: ComponentDef[] };

export interface PlaygroundProps {
  manifest: Manifest;
}

export function Playground({ manifest }: PlaygroundProps) {
  const components = [...manifest.components].sort((a, b) => a.name.localeCompare(b.name));
  const [selected, setSelected] = useState<ComponentDef | null>(components[0] ?? null);
  const [values, setValues] = useState<Record<string, any>>({});

  const select = (comp: ComponentDef) => {
    setSelected(comp);
    setValues({});
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
      <aside style={{ width: 200, borderRight: '1px solid #ddd' }}>
        {components.map((c) => (
          <div
            key={c.path}
            style={{ padding: '4px 8px', cursor: 'pointer', background: selected?.path === c.path ? '#eee' : 'transparent' }}
            onClick={() => select(c)}
          >
            {c.name}
          </div>
        ))}
      </aside>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selected && (
          <>
            <Controls defs={selected.props} values={values} onChange={setValues} />
            <Preview component={selected} props={values} />
          </>
        )}
      </main>
    </div>
  );
}

export default Playground;
