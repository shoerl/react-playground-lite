import React from 'react';

type ButtonProps = {
  /**
   * The text to display inside the button.
   */
  label: string;
  /**
   * The style variant of the button.
   */
  variant?: 'text' | 'outlined' | 'contained';
  /**
   * If `true`, the button will be disabled.
   */
  disabled?: boolean;
};

const baseStyles: React.CSSProperties = {
  padding: '8px 16px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '16px',
  fontWeight: 600,
  transition: 'background-color 0.2s, color 0.2s, border-color 0.2s',
};

const variantStyles: Record<NonNullable<ButtonProps['variant']>, React.CSSProperties> = {
  text: {
    backgroundColor: 'transparent',
    color: '#1976d2',
  },
  outlined: {
    backgroundColor: 'transparent',
    color: '#1976d2',
    border: '1px solid #1976d2',
  },
  contained: {
    backgroundColor: '#1976d2',
    color: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
};

/**
 * A simple button component for demonstration purposes.
 */
export default function Button({
  label,
  variant = 'contained',
  disabled = false,
}: ButtonProps) {
  const style = {
    ...baseStyles,
    ...variantStyles[variant],
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };

  return (
    <button style={style} disabled={disabled}>
      {label}
    </button>
  );
}
