export type BookingStatusCopy = {
  label: string;
  explanation: string;
};

export function bookingStatusCopy(status: string): BookingStatusCopy {
  switch (status) {
    case 'pending':
      return {
        label: 'Waiting',
        explanation: 'This time is not confirmed yet.',
      };
    case 'confirmed':
      return {
        label: 'Booked',
        explanation: 'This time is set. Join when it starts.',
      };
    case 'in_progress':
      return {
        label: 'Now',
        explanation: 'This session is happening now.',
      };
    case 'completed':
      return {
        label: 'Finished',
        explanation: 'This session is over.',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        explanation: 'This session will not take place.',
      };
    default:
      return {
        label: 'Session',
        explanation: 'Open this session for the details.',
      };
  }
}
