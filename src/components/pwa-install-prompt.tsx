'use client';

import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
      return;
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after 3 seconds
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  if (isStandalone || (!deferredPrompt && !isIOS)) {
    return null;
  }

  // iOS install instructions
  if (isIOS && showPrompt) {
    return (
      <Card className="fixed bottom-4 left-4 right-4 md:right-auto md:max-w-md shadow-lg border-blue-500 animate-in slide-in-from-bottom">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Install Shiteni</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPrompt(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <CardDescription>
            Install Shiteni on your iPhone for a better experience
          </CardDescription>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>Tap the Share button at the bottom</li>
            <li>Select "Add to Home Screen"</li>
            <li>Tap "Add" to confirm</li>
          </ol>
          <Button
            onClick={() => setShowPrompt(false)}
            variant="outline"
            className="w-full"
          >
            Got it
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Android/Desktop install prompt
  if (deferredPrompt && showPrompt) {
    return (
      <Card className="fixed bottom-4 left-4 right-4 md:right-auto md:max-w-md shadow-lg border-blue-500 animate-in slide-in-from-bottom">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Install Shiteni</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPrompt(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <CardDescription>
            Install Shiteni app for quick access and a better experience
          </CardDescription>
          <div className="flex gap-2">
            <Button
              onClick={handleInstallClick}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Install Now
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowPrompt(false)}
            >
              Not Now
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

