'use client';

import { useState, useEffect } from 'react';
import { usePWA } from '@/hooks/use-pwa';
import { Button } from '@/components/ui/button';
import { Download, X, RefreshCw, WifiOff } from 'lucide-react';

export function PWAPrompt() {
  const { canInstall, isOnline, hasUpdate, promptInstall, updateApp } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [showOffline, setShowOffline] = useState(false);

  // Show offline indicator briefly when going offline
  useEffect(() => {
    if (!isOnline) {
      setShowOffline(true);
      const timer = setTimeout(() => setShowOffline(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (!installed) {
      setDismissed(true);
    }
  };

  // Offline indicator
  if (showOffline && !isOnline) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto z-50 animate-in slide-in-from-bottom-4">
        <div className="bg-yellow-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
          <WifiOff className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">You&apos;re offline. Some features may be limited.</span>
        </div>
      </div>
    );
  }

  // Update available prompt
  if (hasUpdate) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto z-50 animate-in slide-in-from-bottom-4">
        <div className="bg-coffee-cream dark:bg-coffee-espresso border border-coffee-light dark:border-coffee-dark px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-coffee-dark dark:text-coffee-medium flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-coffee-espresso dark:text-coffee-cream">Update available</p>
            <p className="text-xs text-coffee-medium dark:text-coffee-light">A new version is ready</p>
          </div>
          <Button size="sm" onClick={updateApp} className="gradient-bg">
            Update
          </Button>
        </div>
      </div>
    );
  }

  // Install prompt
  if (canInstall && !dismissed) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto z-50 animate-in slide-in-from-bottom-4">
        <div className="bg-coffee-cream dark:bg-coffee-espresso border border-coffee-light dark:border-coffee-dark px-4 py-4 rounded-xl shadow-lg shadow-coffee-dark/10">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coffee-dark to-coffee-medium flex items-center justify-center flex-shrink-0 shadow-coffee">
              <Download className="w-6 h-6 text-coffee-cream" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-coffee-espresso dark:text-coffee-cream">Install VisionBoard Pro</p>
              <p className="text-xs text-coffee-medium dark:text-coffee-light mt-1">Install for quick access and offline support</p>
              <div className="flex items-center gap-2 mt-3">
                <Button size="sm" onClick={handleInstall} className="gradient-bg">
                  Install
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
                  Not now
                </Button>
              </div>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 hover:bg-coffee-light/50 dark:hover:bg-coffee-dark/50 rounded-lg transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-coffee-medium" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
