import React from 'react';

export enum ButtonStatus {
  Active = 'active',
  Disabled = 'disabled',
}

type ButtonProps = {
  label: string;
  disabled: boolean;
  variant: 'primary' | 'secondary';
  tags: string[];
  status: ButtonStatus;
};

export const Button = (props: ButtonProps) => (
  <button
    disabled={props.disabled}
    data-variant={props.variant}
    data-status={props.status}
  >
    {props.label}
  </button>
);

export default function ButtonDefault(props: ButtonProps) {
  return (
    <button
      disabled={props.disabled}
      data-default="true"
      data-status={props.status}
    >
      {props.label}
    </button>
  );
}

export function HelperComponent(props: any) {
  return <span>{props.count ?? 0}</span>;
}
