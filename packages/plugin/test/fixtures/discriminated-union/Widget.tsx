import React from 'react';

export type WidgetConfig =
  | {
      variant: 'text';
      content: string;
    }
  | {
      variant: 'metric';
      value: number;
      trend?: 'up' | 'down';
    };

export interface WidgetProps {
  title?: string;
  config: WidgetConfig;
}

export function Widget({ title = 'Widget', config }: WidgetProps) {
  if (config.variant === 'text') {
    return (
      <div>
        <strong>{title}</strong>
        <p>{config.content}</p>
      </div>
    );
  }

  return (
    <div>
      <strong>{title}</strong>
      <span>
        {config.value}
        {config.trend ? ` (${config.trend})` : ''}
      </span>
    </div>
  );
}
