"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  X, 
  Smartphone, 
  Monitor, 
  Wifi, 
  WifiOff,
  Check,
  Star,
  Zap
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface InstallPromptProps {
  onDismiss?: () => void;
  showManualInstructions?: boolean;
}

export function InstallPrompt({ onDismiss, showManualInstructions = true }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [platform, setPlatform] = useState<string>('');
  const [isDismissed, setIsDismissed] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Mark as hydrated on client side
    setIsHydrated(true);
    
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user has permanently dismissed the prompt
    const dismissed = localStorage.getItem('vinesight-install-dismissed');
    console.log('Checking dismissed state on load:', dismissed);
    if (dismissed === 'true') {
      setIsDismissed(true);
      setShowPrompt(false);
      console.log('PWA install prompt already dismissed, not showing');
      return; // Don't show prompt if permanently dismissed
    }

    // Detect platform
    const userAgent = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/Android/.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const installEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(installEvent);
      setCanInstall(true);
      // Only show native prompt if not dismissed
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.removeItem('vinesight-install-dismissed'); // Clear dismissal when installed
      console.log('PWA installed successfully');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Show manual instructions after delay if no native prompt and not dismissed
    const promptTimer = setTimeout(() => {
      if (!dismissed && !isInstalled) {
        console.log('Showing PWA install prompt after timeout');
        setShowPrompt(true);
      }
    }, 3000); // Show after 3 seconds

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(promptTimer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);
    
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
    } catch (error) {
      console.error('Error during installation:', error);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    console.log('PWA install prompt dismissed by user');
    setShowPrompt(false);
    setIsDismissed(true);
    try {
      localStorage.setItem('vinesight-install-dismissed', 'true');
      console.log('PWA dismiss state saved to localStorage');
    } catch (error) {
      console.error('Failed to save PWA dismiss state:', error);
    }
    onDismiss?.();
  };

  const getManualInstallInstructions = () => {
    switch (platform) {
      case 'ios':
        return {
          steps: [
            'Tap the Share button in Safari',
            'Scroll down and tap "Add to Home Screen"',
            'Tap "Add" to install VineSight'
          ],
          note: 'VineSight works best when installed as an app'
        };
      case 'android':
        return {
          steps: [
            'Tap the menu button (⋮) in Chrome',
            'Select "Add to Home screen"',
            'Tap "Add" to install VineSight'
          ],
          note: 'Get the full app experience with offline access'
        };
      case 'desktop':
        return {
          steps: [
            'Look for the install icon in your browser address bar',
            'Click the install button or use browser menu',
            'Follow the installation prompts'
          ],
          note: 'Install for quick access and offline functionality'
        };
      default:
        return {
          steps: ['Use your browser\'s install option'],
          note: 'Install for the best experience'
        };
    }
  };

  if (isInstalled) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center">
              <Check className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-green-800">App Installed!</h3>
              <p className="text-sm text-green-700">VineSight is ready to use offline</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Don't show anything until hydrated (prevents hydration mismatch)
  if (!isHydrated) {
    return null;
  }

  // Don't show anything if dismissed
  if (isDismissed) {
    return null;
  }

  if (!showPrompt && !showManualInstructions) return null;

  const instructions = getManualInstallInstructions();

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
              <Download className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-blue-800 flex items-center gap-2">
                Install VineSight App
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  <Star className="h-3 w-3 mr-1" />
                  Recommended
                </Badge>
              </CardTitle>
              <CardDescription className="text-blue-700">
                Get the best experience with offline access
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <WifiOff className="h-4 w-4 text-blue-600" />
            <span>Works offline</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Zap className="h-4 w-4 text-blue-600" />
            <span>Faster loading</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-700">
            {platform === 'desktop' ? (
              <Monitor className="h-4 w-4 text-blue-600" />
            ) : (
              <Smartphone className="h-4 w-4 text-blue-600" />
            )}
            <span>Native feel</span>
          </div>
        </div>

        {/* Install Button or Manual Instructions */}
        {canInstall && deferredPrompt ? (
          <div className="flex gap-2">
            <Button 
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isInstalling ? (
                <>Installing...</>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Install Now
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleDismiss}>
              Maybe Later
            </Button>
          </div>
        ) : showManualInstructions && (
          <div className="space-y-3">
            <div className="text-sm">
              <p className="font-medium text-blue-800 mb-2">How to install:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-700">
                {instructions.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <p className="text-xs text-blue-700">
                💡 {instructions.note}
              </p>
            </div>
            <Button variant="outline" onClick={handleDismiss} className="w-full">
              Got it, thanks!
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const installEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(installEvent);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setCanInstall(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
    } catch (error) {
      console.error('Error during installation:', error);
    }
  };

  if (isInstalled) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <Check className="h-4 w-4" />
        Installed
      </Button>
    );
  }

  if (!canInstall) return null;

  return (
    <Button onClick={handleInstall} variant="outline" className="gap-2">
      <Download className="h-4 w-4" />
      Install App
    </Button>
  );
}