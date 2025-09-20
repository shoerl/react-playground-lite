import React from 'react';

export const TestOnly = (props: { label: string }) => (
  <span data-test>{props.label}</span>
);

