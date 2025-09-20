import React from 'react';

export const LegacyButton = ({ label }: { label: string }) => (
  <button data-legacy="true">{label}</button>
);
