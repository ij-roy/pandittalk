function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getMaxBirthDate(): Date {
  return new Date();
}

export function clampBirthDate(date: Date): Date {
  const now = new Date();
  const clamped = new Date(date);
  clamped.setHours(0, 0, 0, 0);
  const today = startOfDay(now);
  if (clamped.getTime() > today.getTime()) {
    return today;
  }
  return clamped;
}

export function clampBirthTime(time: Date, birthDate: Date | null): Date {
  const now = new Date();
  const clamped = new Date(time);
  if (!birthDate || !isSameCalendarDay(birthDate, now)) {
    return clamped;
  }
  if (clamped.getTime() > now.getTime()) {
    return new Date(now);
  }
  return clamped;
}

export function combineBirthDateTime(birthDate: Date, birthTime: Date): Date {
  const combined = new Date(birthDate);
  combined.setHours(birthTime.getHours(), birthTime.getMinutes(), 0, 0);
  return combined;
}

export function isBirthDateTimeInFuture(birthDate: Date, birthTime: Date): boolean {
  return combineBirthDateTime(birthDate, birthTime).getTime() > Date.now();
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}
