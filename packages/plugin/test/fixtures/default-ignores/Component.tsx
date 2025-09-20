import React from 'react';

type Props = { label: string };

export const Good = (props: Props) => <button>{props.label}</button>;

export default function GoodDefault(props: Props) {
  return <button data-default>{props.label}</button>;
}

