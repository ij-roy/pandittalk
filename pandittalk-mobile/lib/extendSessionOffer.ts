export function extendSessionOfferCopy(panditName: string): { title: string; action: string } {
  const name = panditName.trim() || 'this pandit';
  return {
    title: `5 minutes left. Book the next session with ${name} if you want more time.`,
    action: 'Book next',
  };
}
