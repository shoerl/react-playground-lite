import React from 'react';

type ButtonProps = {
  label: string;
  disabled: boolean;
  variant: 'primary' | 'secondary';
};

export const Button = (props: ButtonProps) => (
  <button disabled={props.disabled} data-variant={props.variant}>
    {props.label}
  </button>
);

export default function ButtonDefault(props: ButtonProps) {
  return (
    <button disabled={props.disabled} data-default="true">
      {props.label}
    </button>
  );
}

export function HelperComponent(props: any) {
  return <span>{props.count ?? 0}</span>;
}
