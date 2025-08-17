import React from 'react';
import { PropDef } from './Playground';

interface ControlsProps {
  defs: Record<string, PropDef>;
  values: Record<string, any>;
  onChange: (v: Record<string, any>) => void;
}

export default function Controls({ defs, values, onChange }: ControlsProps) {
  const update = (key: string, value: any) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div style={{ padding: '1rem', borderBottom: '1px solid #ddd' }}>
      {Object.entries(defs).map(([key, def]) => {
        const value = values[key] ?? '';
        let input: React.ReactNode = null;
        switch (def.type) {
          case 'boolean':
            input = (
              <input type="checkbox" checked={!!value} onChange={(e) => update(key, e.target.checked)} />
            );
            break;
          case 'number':
            input = (
              <input type="number" value={value} onChange={(e) => update(key, e.target.valueAsNumber)} />
            );
            break;
          case 'string':
            input = (
              <input type="text" value={value} onChange={(e) => update(key, e.target.value)} />
            );
            break;
          case 'union':
            input = (
              <select value={value} onChange={(e) => update(key, e.target.value)}>
                {def.options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            );
            break;
        }
        return (
          <label key={key} style={{ display: 'block', marginBottom: 8 }}>
            {key}: {input}
          </label>
        );
      })}
    </div>
  );
}
