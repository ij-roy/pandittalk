export type ReviewableBooking = {
  id: string;
  panditId: string;
  status: string;
  review: unknown;
};

/** Completed session with this pandit that the user has not reviewed. */
export function firstUnreviewedSession(
  bookings: ReviewableBooking[],
  panditId: string,
): ReviewableBooking | null {
  const id = panditId.trim();
  if (!id) return null;
  return (
    bookings.find(
      (booking) =>
        booking.panditId === id && booking.status === 'completed' && booking.review == null,
    ) ?? null
  );
}
