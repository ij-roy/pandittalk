export function emptyCategoryMessage(label: string): string {
  const name = label.trim() || 'this topic';
  return `No ${name} articles yet. Here are other articles you can read.`;
}
