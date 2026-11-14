/** Display helpers for Indian Standard Time (Asia/Kolkata). */

const istDate = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const istDateTime = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function toValidDate(value: string | number | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatIstDate(value: string | number | Date) {
  const date = toValidDate(value);
  if (!date) return 'Date unavailable';
  return `${istDate.format(date)} IST`;
}

export function formatIstDateTime(value: string | number | Date) {
  const date = toValidDate(value);
  if (!date) return 'Date unavailable';
  return `${istDateTime.format(date)} IST`;
}

export function todayIstIso() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}
