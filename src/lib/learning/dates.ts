/** All daily boundaries in the app use the Europe/Paris calendar. */
export const TIMEZONE = "Europe/Paris";

const dateFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" });
const partsFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});

/** Paris calendar date (YYYY-MM-DD) for an instant. */
export function parisDate(d: Date = new Date()): string {
  return dateFmt.format(d);
}

export function parisParts(d: Date = new Date()) {
  const p = Object.fromEntries(partsFmt.formatToParts(d).map((x) => [x.type, x.value]));
  return { year: +p.year, month: +p.month, day: +p.day, hour: +p.hour, minute: +p.minute, second: +p.second };
}

/** Offset of Paris from UTC at a given instant, in ms (+1h winter, +2h summer). */
export function parisOffsetMs(d: Date): number {
  const p = parisParts(d);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(d.getTime() / 1000) * 1000;
}

function toUtcDate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(date: string, n: number): string {
  const d = toUtcDate(date);
  d.setUTCDate(d.getUTCDate() + Math.round(n));
  return d.toISOString().slice(0, 10);
}

/** Whole days from a to b (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((toUtcDate(b).getTime() - toUtcDate(a).getTime()) / 86_400_000);
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayIndex(date: string): number {
  return (toUtcDate(date).getUTCDay() + 6) % 7;
}

export function startOfWeek(date: string): string {
  return addDays(date, -weekdayIndex(date));
}

/** The instant at which Paris wall-clock time hh:mm next occurs after `now`. */
export function nextParisTime(hhmm: string, now: Date = new Date()): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const today = parisDate(now);
  for (const offsetDays of [0, 1, 2]) {
    const date = addDays(today, offsetDays);
    const [y, mo, d] = date.split("-").map(Number);
    const guess = new Date(Date.UTC(y, mo - 1, d, h, m));
    const instant = new Date(guess.getTime() - parisOffsetMs(guess));
    if (instant.getTime() > now.getTime()) return instant;
  }
  throw new Error("unreachable");
}

/** Is Paris wall-clock time currently at or after hh:mm today? */
export function isPastParisTime(hhmm: string, now: Date = new Date()): boolean {
  const [h, m] = hhmm.split(":").map(Number);
  const p = parisParts(now);
  return p.hour * 60 + p.minute >= h * 60 + m;
}

export function formatDateLong(date: string): string {
  return toUtcDate(date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}

export function formatDateShort(date: string): string {
  return toUtcDate(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}
