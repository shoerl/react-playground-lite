import React from 'react';

type Theme = {
  primary: string;
  secondary?: string;
};

type Option = { id: number; label: string };

type Props = {
  label: string;
  theme: Theme; // unsupported (object)
  options: Option[]; // unsupported (array of objects)
};

export const BadComponent = (props: Props) => <div>{props.label}</div>;

