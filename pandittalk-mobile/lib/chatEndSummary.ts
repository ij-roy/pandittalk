export function chatEndSummary(input: {
  panditName: string;
  startedAtMs: number | null;
  endedAtMs: number;
  messageCount: number;
}): { title: string; lines: string[] } {
  const name = input.panditName.trim() || 'your pandit';
  const lines = [`Chat with ${name}`];
  if (
    input.startedAtMs != null &&
    Number.isFinite(input.startedAtMs) &&
    Number.isFinite(input.endedAtMs) &&
    input.endedAtMs >= input.startedAtMs
  ) {
    const minutes = Math.max(1, Math.round((input.endedAtMs - input.startedAtMs) / 60_000));
    lines.push(minutes === 1 ? '1 minute' : `${minutes} minutes`);
  }
  const count = Number.isFinite(input.messageCount) ? Math.max(0, Math.round(input.messageCount)) : 0;
  if (count > 0) {
    lines.push(count === 1 ? '1 message' : `${count} messages`);
  }
  return { title: 'Session ended', lines };
}
