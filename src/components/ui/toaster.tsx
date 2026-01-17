'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Toast {
  id: string;
  title: string;
  description?: string;
  type?: 'default' | 'success' | 'error' | 'warning';
}

let toasts: Toast[] = [];
let listeners: ((toasts: Toast[]) => void)[] = [];

const addToast = (toast: Omit<Toast, 'id'>) => {
  const id = Math.random().toString(36).substr(2, 9);
  toasts = [...toasts, { ...toast, id }];
  listeners.forEach((listener) => listener(toasts));
  setTimeout(() => {
    removeToast(id);
  }, 5000);
};

const removeToast = (id: string) => {
  toasts = toasts.filter((t) => t.id !== id);
  listeners.forEach((listener) => listener(toasts));
};

export const toast = {
  show: (title: string, description?: string) => 
    addToast({ title, description, type: 'default' }),
  success: (title: string, description?: string) => 
    addToast({ title, description, type: 'success' }),
  error: (title: string, description?: string) => 
    addToast({ title, description, type: 'error' }),
  warning: (title: string, description?: string) => 
    addToast({ title, description, type: 'warning' }),
};

export function Toaster() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    listeners.push(setCurrentToasts);
    return () => {
      listeners = listeners.filter((l) => l !== setCurrentToasts);
    };
  }, []);

  if (!mounted) return null;

  const toastColors = {
    default: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  };

  const iconColors = {
    default: 'text-gray-500',
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
  };

  return createPortal(
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {currentToasts.map((toastItem) => (
        <div
          key={toastItem.id}
          className={`
            min-w-[320px] max-w-md p-4 rounded-lg border shadow-lg
            animate-in slide-in-from-right-5 fade-in-0
            ${toastColors[toastItem.type || 'default']}
          `}
        >
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 ${iconColors[toastItem.type || 'default']}`}>
              {toastItem.type === 'success' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {toastItem.type === 'error' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {toastItem.type === 'warning' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              {(!toastItem.type || toastItem.type === 'default') && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">{toastItem.title}</p>
              {toastItem.description && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{toastItem.description}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toastItem.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>,
    document.body
  );
}
