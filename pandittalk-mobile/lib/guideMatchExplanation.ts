export function guideMatchExplanation(topicLabel: string): string {
  const topic = topicLabel.trim() || 'this topic';
  return `These guides cover ${topic}. They are listed by name, not by a score. You choose who to book.`;
}
