type ToastHandler = (message: string, type?: 'success' | 'error') => void;
type BookingRefreshHandler = () => void;

let toastHandler: ToastHandler | null = null;
let bookingRefreshHandler: BookingRefreshHandler | null = null;

export function setNotificationToastHandler(handler: ToastHandler | null): void {
  toastHandler = handler;
}

export function setBookingRefreshHandler(
  handler: BookingRefreshHandler | null,
): void {
  bookingRefreshHandler = handler;
}

export function showNotificationToast(
  message: string,
  type: 'success' | 'error' = 'success',
): void {
  toastHandler?.(message, type);
}

export function requestBookingRefresh(): void {
  bookingRefreshHandler?.();
}
