import React from 'react';
import type {
  ComponentDef,
  OptionPropDef,
  PrimitivePropDef,
  PropDef,
} from '@rplite/plugin/manifest';
import {
  buildDiscriminatedUnionVariant,
  describeArrayElement,
  ensureDiscriminatedUnionValue,
} from './propValues';

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

const variantContainerStyles: React.CSSProperties = {
  marginTop: '12px',
  padding: '12px',
  border: '1px solid #d5d9e0',
  borderRadius: '6px',
  backgroundColor: '#f9fafc',
};

const nestedControlStyles: React.CSSProperties = {
  marginBottom: '12px',
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
    case 'discriminated-union': {
      const normalizedValue = ensureDiscriminatedUnionValue(propDef, value);
      const currentVariant =
        typeof normalizedValue[propDef.discriminant] === 'string'
          ? (normalizedValue[propDef.discriminant] as string)
          : propDef.options[0]?.value ?? '';
      const activeOption =
        propDef.options.find(option => option.value === currentVariant) ??
        propDef.options[0];

      const handleVariantChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        onChange(buildDiscriminatedUnionVariant(propDef, event.target.value));
      };

      const handleNestedChange = (prop: string, nextValue: unknown) => {
        onChange({
          ...normalizedValue,
          [prop]: nextValue,
        });
      };

      return (
        <>
          <label htmlFor={propName} style={labelStyles}>
            {propName}
          </label>
          <select
            id={propName}
            value={currentVariant}
            onChange={handleVariantChange}
            style={selectStyles}
          >
            {propDef.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.value}
              </option>
            ))}
          </select>
          {activeOption && Object.keys(activeOption.props).length > 0 ? (
            <div style={variantContainerStyles}>
              {Object.entries(activeOption.props).map(([nestedName, nestedProp]) => (
                <div key={nestedName} style={nestedControlStyles}>
                  <PropControl
                    propName={nestedName}
                    propDef={nestedProp}
                    value={normalizedValue[nestedName]}
                    onChange={nextValue => handleNestedChange(nestedName, nextValue)}
                  />
                </div>
              ))}
            </div>
          ) : null}
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
