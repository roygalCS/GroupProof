import { formatDistanceToNow, isPast, differenceInSeconds } from 'date-fns';

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

export function formatCountdown(timestamp: number): string {
  const targetDate = new Date(timestamp * 1000);

  if (isPast(targetDate)) {
    return 'Expired';
  }

  return formatDistanceToNow(targetDate, { addSuffix: true });
}

export function getTimeRemaining(timestamp: number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} {
  const now = new Date();
  const target = new Date(timestamp * 1000);
  const total = differenceInSeconds(target, now);

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  return {
    days: Math.floor(total / (60 * 60 * 24)),
    hours: Math.floor((total % (60 * 60 * 24)) / (60 * 60)),
    minutes: Math.floor((total % (60 * 60)) / 60),
    seconds: Math.floor(total % 60),
    total,
  };
}

export function formatTimeRemaining(timestamp: number): string {
  const { days, hours, minutes, seconds, total } = getTimeRemaining(timestamp);

  if (total <= 0) {
    return 'Time is up!';
  }

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 && days === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}
