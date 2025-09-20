import React from 'react';
import {
  PrimaryButton as BasePrimaryButton,
  type PrimaryButtonProps,
  InfoCard as BaseInfoCard,
  type InfoCardProps,
  MetricBadge as BaseMetricBadge,
  type MetricBadgeProps,
  ToggleSetting as BaseToggleSetting,
  type ToggleSettingProps,
  AvatarList as BaseAvatarList,
  type AvatarListProps,
  TagList as BaseTagList,
  type TagListProps,
} from '@rplite/mui-demo';

/**
 * Wrappers around the MUI demo components so the local scanner can discover them
 * as React components with explicit props.
 */
export function PrimaryButton(props: PrimaryButtonProps) {
  return <BasePrimaryButton {...props} />;
}

export function InfoCard(props: InfoCardProps) {
  return <BaseInfoCard {...props} />;
}

export function MetricBadge(props: MetricBadgeProps) {
  return <BaseMetricBadge {...props} />;
}

export function ToggleSetting(props: ToggleSettingProps) {
  return <BaseToggleSetting {...props} />;
}

export function AvatarList(props: AvatarListProps) {
  return <BaseAvatarList {...props} />;
}

export function TagList(props: TagListProps) {
  return <BaseTagList {...props} />;
}
