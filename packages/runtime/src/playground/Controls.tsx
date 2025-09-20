import React from 'react';
import type {
  ComponentDef,
  OptionPropDef,
  PrimitivePropDef,
  PropDef,
} from '@rplite/plugin/manifest';

/**
 * Props for the `Controls` component.
 */
interface ControlsProps {
  /** The definition of the component whose props are being controlled. */
  component: ComponentDef;
  /** The current values of the props. */
  values: Record<string, any>;
  /** Callback function to notify when a prop value changes. */
  onValueChange: (propName: string, value: any) => void;
}

// Internal styles for the control elements.
const controlStyles: React.CSSProperties = {
  marginBottom: '12px',
};

const labelStyles: React.CSSProperties = {
  display: 'block',
  marginBottom: '4px',
  fontSize: '14px',
  fontWeight: 500,
};

const inputStyles: React.CSSProperties = {
  width: '100%',
  padding: '8px',
  fontSize: '14px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  boxSizing: 'border-box',
};

const selectStyles: React.CSSProperties = {
  ...inputStyles,
  appearance: 'none',
};

const textareaStyles: React.CSSProperties = {
  ...inputStyles,
  minHeight: '80px',
  fontFamily: 'monospace',
  resize: 'vertical',
};

const checkboxContainerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

/**
 * Props for the `PropControl` component.
 * @internal
 */
interface PropControlProps {
  propName: string;
  propDef: PropDef;
  value: any;
  onChange: (value: any) => void;
}

/**
 * Renders the appropriate input control for a given prop definition.
 * @internal
 */
function PropControl({ propName, propDef, value, onChange }: PropControlProps) {
  switch (propDef.type) {
    case 'boolean':
      return (
        <div style={checkboxContainerStyles}>
          <input
            type="checkbox"
            id={propName}
            checked={!!value}
            onChange={e => onChange(e.target.checked)}
          />
          <label htmlFor={propName}>{propName}</label>
        </div>
      );
    case 'string':
      return (
        <>
          <label htmlFor={propName} style={labelStyles}>
            {propName}
          </label>
          <input
            type="text"
            id={propName}
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            style={inputStyles}
          />
        </>
      );
    case 'number':
      return (
        <>
          <label htmlFor={propName} style={labelStyles}>
            {propName}
          </label>
          <input
            type="number"
            id={propName}
            value={value || 0}
            onChange={e => onChange(parseFloat(e.target.value))}
            style={inputStyles}
          />
        </>
      );
    case 'union':
      return (
        <>
          <label htmlFor={propName} style={labelStyles}>
            {propName}
          </label>
          <select
            id={propName}
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            style={selectStyles}
          >
            {propDef.options.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </>
      );
    case 'enum':
      return (
        <>
          <label htmlFor={propName} style={labelStyles}>
            {propName}
          </label>
          <select
            id={propName}
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            style={selectStyles}
          >
            {propDef.options.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </>
      );
    case 'array': {
      const serializedValue = Array.isArray(value)
        ? value.join(', ')
        : '';

      return (
        <>
          <label htmlFor={propName} style={labelStyles}>
            {propName}
          </label>
          <textarea
            id={propName}
            value={serializedValue}
            placeholder="Enter comma-separated values"
            onChange={e => onChange(parseArrayInput(e.target.value, propDef.element))}
            style={textareaStyles}
          />
          <small style={{ display: 'block', marginTop: '4px', color: '#555' }}>
            {describeArrayElement(propDef.element)}
          </small>
        </>
      );
    }
    default:
      return null;
  }
}

function parseArrayInput(
  raw: string,
  element: PrimitivePropDef | OptionPropDef,
): unknown[] {
  const parts = raw
    .split(',')
    .map(part => part.trim())
    .filter(part => part.length > 0);

  switch (element.type) {
    case 'number':
      return parts
        .map(part => Number(part))
        .filter(value => !Number.isNaN(value));
    case 'boolean':
      return parts
        .map(part => part.toLowerCase())
        .filter(part => part === 'true' || part === 'false')
        .map(part => part === 'true');
    case 'union':
    case 'enum':
      return parts.filter(part => element.options.includes(part));
    default:
      return parts;
  }
}

function describeArrayElement(element: PrimitivePropDef | OptionPropDef): string {
  switch (element.type) {
    case 'string':
      return 'Comma-separated text values';
    case 'number':
      return 'Comma-separated numbers';
    case 'boolean':
      return 'Comma-separated true/false values';
    case 'union':
    case 'enum':
      return `Allowed values: ${element.options.join(', ')}`;
    default:
      return 'Comma-separated values';
  }
}

/**
 * A panel that displays controls for a component's props.
 * It dynamically renders the correct input type for each prop.
 */
export function Controls({ component, values, onValueChange }: ControlsProps) {
  return (
    <div style={{ padding: '16px' }}>
      <h3 style={{ marginTop: 0, marginBottom: '16px' }}>{component.name}</h3>
      {Object.entries(component.props).map(([propName, propDef]) => (
        <div key={propName} style={controlStyles}>
          <PropControl
            propName={propName}
            propDef={propDef}
            value={values[propName]}
            onChange={newValue => onValueChange(propName, newValue)}
          />
        </div>
      ))}
    </div>
  );
}
