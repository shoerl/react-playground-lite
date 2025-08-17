import React from 'react';

type ButtonProps = {
  label: string;
  variant?: 'text' | 'outlined' | 'contained';
  disabled?: boolean;
};

export default function Button({ label, variant = 'text', disabled = false }: ButtonProps) {
  const style: React.CSSProperties = {
    padding: '0.5rem 1rem',
    border: variant === 'text' ? 'none' : '1px solid #333',
    background: variant === 'contained' ? '#333' : 'transparent',
    color: variant === 'contained' ? '#fff' : '#000',
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer'
  };

  return <button style={style}>{label}</button>;
}
