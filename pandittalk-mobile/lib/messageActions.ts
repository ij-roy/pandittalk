const EXCERPT_LIMIT = 280;

export function messageExcerpt(text: string): string {
  return text.trim().replace(/\s+/g, ' ').slice(0, EXCERPT_LIMIT);
}

export function reportMessageBody(input: {
  panditId: string;
  panditName: string;
  bookingId: string;
  messageId: string;
  text: string;
  reason: string;
}): string {
  const excerpt = messageExcerpt(input.text);
  return [
    `Report message id=${input.messageId}`,
    `bookingId=${input.bookingId}`,
    `panditId=${input.panditId}`,
    `name=${input.panditName.trim() || 'Pandit'}`,
    `Excerpt: ${excerpt}`,
    `Reason: ${input.reason.trim()}`,
  ].join('. ');
}
