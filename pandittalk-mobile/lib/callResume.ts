export function shouldResumeCall(previous: string, next: string): boolean {
  if (next !== 'active') return false;
  return previous === 'background' || previous === 'inactive';
}
