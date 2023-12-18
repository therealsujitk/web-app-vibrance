import { intervalToDuration } from "date-fns";

export async function sleep(milliseconds: number) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

export function formatNumber(x: number) {
  let result = x.toString();

  if (x / 1000 >= 1) {
    x /= 1000;
    result = Number(x.toFixed(1)) + 'K';
  }

  if (x / 1000 >= 1) {
    x /= 1000;
    result = Number(x.toFixed(1)) + 'M';
  }

  return result;
}

export function formatDuration(x: number) {
  const duration = intervalToDuration({start: 0, end: x * 1000});
  let result = '';
  
  if (duration.hours && duration.hours > 0) {
    result += `${duration.hours}h `;
  }

  if (duration.minutes && duration.minutes > 0) {
    result += `${duration.minutes}m `;
  }

  return result !== '' ? result.trim() : '0m';
}

/**
 * Use this interface incase of name collisions
 */
export interface DOMEvent extends Event {};
