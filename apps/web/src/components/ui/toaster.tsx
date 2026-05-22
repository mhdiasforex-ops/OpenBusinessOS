'use client';

import { useToast } from '@/hooks/use-toast';

export function Toaster() {
  const { toasts } = useToast();
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="rounded-md border bg-card px-4 py-3 shadow-lg text-sm"
        >
          {toast.title && <p className="font-semibold">{toast.title}</p>}
          {toast.description && <p className="text-muted-foreground">{toast.description}</p>}
        </div>
      ))}
    </div>
  );
}
