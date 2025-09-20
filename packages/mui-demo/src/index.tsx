import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Box from '@mui/material/Box';

export interface PrimaryButtonProps {
  label: string;
  variant?: 'contained' | 'outlined' | 'text';
  disabled?: boolean;
  onClick?: () => void;
}

export function PrimaryButton({
  label = 'Get Started',
  variant = 'contained',
  disabled = false,
  onClick,
}: PrimaryButtonProps) {
  return (
    <Button variant={variant} disabled={disabled} onClick={onClick} size="large">
      {label}
    </Button>
  );
}

export interface InfoCardProps {
  title: string;
  body: string;
  tags: string[];
  actionLabel?: string;
  onActionClick?: () => void;
}

export function InfoCard({
  title = 'Weekly Summary',
  body = 'Stay in sync with your team by reviewing highlights and upcoming milestones.',
  tags = ['team', 'planning', 'insights'],
  actionLabel = 'View report',
  onActionClick,
}: InfoCardProps) {
  return (
    <Card sx={{ maxWidth: 340 }}>
      <CardContent>
        <Typography variant="h6" component="h3" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {body}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {tags.map(tag => (
            <Chip key={tag} label={tag} size="small" color="primary" variant="outlined" />
          ))}
        </Stack>
      </CardContent>
      <CardActions>
        <Button size="small" onClick={onActionClick} variant="text">
          {actionLabel}
        </Button>
      </CardActions>
    </Card>
  );
}

export type MetricStatus = 'positive' | 'neutral' | 'negative';

export interface MetricBadgeProps {
  label: string;
  value: number;
  suffix?: string;
  status: MetricStatus;
}

const statusToColor: Record<MetricStatus, 'success' | 'default' | 'error'> = {
  positive: 'success',
  neutral: 'default',
  negative: 'error',
};

export function MetricBadge({
  label = 'Active sessions',
  value = 128,
  suffix = 'today',
  status = 'positive',
}: MetricBadgeProps) {
  return (
    <Chip
      label={`${label}: ${value.toLocaleString()} ${suffix}`.trim()}
      color={statusToColor[status]}
      variant={status === 'neutral' ? 'outlined' : 'filled'}
      sx={{ fontWeight: 500 }}
    />
  );
}

export interface ToggleSettingProps {
  label: string;
  helperText?: string;
  enabled: boolean;
  onChange?: (enabled: boolean) => void;
}

export function ToggleSetting({
  label = 'Email notifications',
  helperText = 'Send a summary when activity exceeds thresholds.',
  enabled = true,
  onChange,
}: ToggleSettingProps) {
  return (
    <Box>
      <FormControlLabel
        label={label}
        control={
          <Switch
            checked={enabled}
            onChange={event => onChange?.(event.target.checked)}
            color="primary"
          />
        }
      />
      {helperText ? (
        <Typography color="text.secondary" variant="caption" display="block" ml={6}>
          {helperText}
        </Typography>
      ) : null}
    </Box>
  );
}

export interface AvatarListProps {
  names: string[];
  max?: number;
}

export function AvatarList({
  names = ['Amelia', 'Jordan', 'Priya', 'Kai'],
  max = 4,
}: AvatarListProps) {
  return (
    <AvatarGroup max={max} sx={{ justifyContent: 'flex-start' }}>
      {names.map(name => (
        <Avatar key={name} alt={name}>
          {name.slice(0, 1).toUpperCase()}
        </Avatar>
      ))}
    </AvatarGroup>
  );
}

export interface TagListProps {
  tags: string[];
}

export function TagList({ tags = ['next.js', 'design system', 'analytics'] }: TagListProps) {
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap">
      {tags.map(tag => (
        <Chip key={tag} label={tag} size="small" />
      ))}
    </Stack>
  );
}
