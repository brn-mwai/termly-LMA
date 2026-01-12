import { toast as sonnerToast } from "sonner";

type ToastType = "success" | "error" | "warning" | "info" | "loading";

interface ToastOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useToast() {
  const toast = (message: string, type: ToastType = "info", options?: ToastOptions) => {
    const toastFn = {
      success: sonnerToast.success,
      error: sonnerToast.error,
      warning: sonnerToast.warning,
      info: sonnerToast.info,
      loading: sonnerToast.loading,
    }[type];

    return toastFn(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action
        ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
        : undefined,
    });
  };

  return {
    toast,
    success: (message: string, options?: ToastOptions) => toast(message, "success", options),
    error: (message: string, options?: ToastOptions) => toast(message, "error", options),
    warning: (message: string, options?: ToastOptions) => toast(message, "warning", options),
    info: (message: string, options?: ToastOptions) => toast(message, "info", options),
    loading: (message: string, options?: ToastOptions) => toast(message, "loading", options),
    dismiss: sonnerToast.dismiss,
    promise: sonnerToast.promise,
  };
}

// Direct export for non-hook usage
export { sonnerToast as toast };
