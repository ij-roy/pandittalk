export const REPORTS_EMPTY_TITLE = 'No saved reports yet';

export const REPORTS_EMPTY_BODY =
  'A reading you save, including a free chart, shows up in this list.';

export type ReportsEmptyAction = {
  label: string;
  hint: string;
  route: '/bookings/history' | '/tools/kundli-detailed' | '/guidance';
};

export function reportsEmptyActions(canBuyReports: boolean): ReportsEmptyAction[] {
  const pastSessions: ReportsEmptyAction = {
    label: 'Past sessions',
    hint: 'Open a finished session.',
    route: '/bookings/history',
  };
  if (canBuyReports) {
    return [
      {
        label: 'Detailed Kundli',
        hint: 'A longer birth chart is saved here after it is ready.',
        route: '/tools/kundli-detailed',
      },
      pastSessions,
    ];
  }
  return [
    pastSessions,
    {
      label: 'Start a chat',
      hint: 'Talk with a pandit in a live consultation.',
      route: '/guidance',
    },
  ];
}
