// services/notification.service.ts — Toast/notification helpers

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  duration?: number;  // ms, default 3000
  position?: 'top' | 'bottom';
}

/**
 * A simple event-based notification service.
 * UI components can listen to 'toast' events to display messages.
 * This keeps the service decoupled from any specific toast library.
 */

const TOAST_EVENT = 'calorique:toast';

export interface ToastEvent {
  type: ToastType;
  message: string;
  duration: number;
}

export const notificationService = {
  /**
   * Dispatch a toast notification event
   */
  show(type: ToastType, message: string, options: ToastOptions = {}): void {
    const event = new CustomEvent<ToastEvent>(TOAST_EVENT, {
      detail: {
        type,
        message,
        duration: options.duration ?? 3000,
      },
    });
    window.dispatchEvent(event);
  },

  success: (message: string, opts?: ToastOptions) =>
    notificationService.show('success', message, opts),

  error: (message: string, opts?: ToastOptions) =>
    notificationService.show('error', message, opts),

  info: (message: string, opts?: ToastOptions) =>
    notificationService.show('info', message, opts),

  warning: (message: string, opts?: ToastOptions) =>
    notificationService.show('warning', message, opts),

  /**
   * Listen for toast events
   */
  onToast(handler: (event: ToastEvent) => void): () => void {
    const listener = (e: Event) => {
      handler((e as CustomEvent<ToastEvent>).detail);
    };
    window.addEventListener(TOAST_EVENT, listener);
    return () => window.removeEventListener(TOAST_EVENT, listener);
  },
};
