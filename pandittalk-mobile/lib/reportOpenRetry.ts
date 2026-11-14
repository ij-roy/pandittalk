export const REPORT_OPEN_RETRY = 'Try again';

export function reportOpenFailure(message: string): string {
  const detail = message.trim();
  const kept = 'The report is still in your list.';
  if (!detail) return `This report did not open. ${kept}`;
  return `${detail} ${kept}`;
}
