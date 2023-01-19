import _ from "lodash";

export type OrNull<T> = { [K in keyof T]?: T[K] };

export function isEqual<T>(oldObject: T, newObject: T) : boolean {
  return _.isEqual(oldObject, newObject);
}

export function getMysqlErrorCode(err: unknown) {
  if (err instanceof Error && 'code' in err) {
    return (err as any).code;
  }
}

export function getUTCFromString(date: string) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()));
}

export function getDateTimeFromUTC(date: Date) {
  if (isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString().replace('T', ' ').substring(0, 16);
}

export function getDateFromUTC(date: Date) {
  if (isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString().substring(0, 10);
}

export function getTimeFromUTC(date: Date) {
  if (isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString().substring(11, 16);
}

const dateRegexSource = '20[0-9]{2}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])';
const timeRegexSource = '([0-1][0-9]|2[0-3]):[0-5][0-9]';

export const dateRegex = new RegExp('^' + dateRegexSource + '$');
export const timeRegex = new RegExp('^' + timeRegexSource + '$');
export const dateTimeRegex = new RegExp('^' + dateRegexSource + ' ' + timeRegexSource + '$');
