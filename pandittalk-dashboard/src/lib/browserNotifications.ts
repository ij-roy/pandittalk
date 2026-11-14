export function requestBrowserNotificationPermission(): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'default') {
    void Notification.requestPermission();
  }
}

export function canShowBrowserNotification(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'granted'
  );
}

export function showBrowserNotification(opts: {
  title: string;
  body: string;
  onClick?: () => void;
}): void {
  if (!canShowBrowserNotification()) return;

  try {
    const notification = new Notification(opts.title, {
      body: opts.body,
      icon: '/icons.svg',
    });

    notification.onclick = () => {
      window.focus();
      opts.onClick?.();
      notification.close();
    };
  } catch {
    // Browser may block notifications in some contexts.
  }
}
