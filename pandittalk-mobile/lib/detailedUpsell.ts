export function detailedUpsellCopy(
  canBuy: boolean,
  cost: number,
): { title: string; body: string; action: string } {
  if (!canBuy) {
    return {
      title: 'Talk through this chart',
      body: 'A pandit can read this free chart with you in a live chat. Paid chart reports are not sold in the iPhone app.',
      action: 'Start a chat',
    };
  }
  const coins = Number.isFinite(cost) && cost > 0 ? Math.round(cost) : 251;
  return {
    title: 'Go deeper on this chart',
    body: `Detailed Kundli adds a life reading, dosha analysis, the current dasha, lucky elements, and remedies. ${coins} coins.`,
    action: 'Get the detailed report',
  };
}
