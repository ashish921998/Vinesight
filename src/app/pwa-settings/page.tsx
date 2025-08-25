"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Download, 
  HardDrive, 
  RotateCcw as Sync, 
  Trash2, 
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Settings,
  Cloud,
  Monitor,
  Battery
} from "lucide-react";
import { OfflineService } from "@/lib/offline-service";
import { OfflineIndicator, useNetworkStatus } from "@/components/pwa/OfflineIndicator";
import { InstallButton } from "@/components/pwa/InstallPrompt";

export default function PWASettingsPage() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [offlineMode, setOfflineMode] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [offlineStats, setOfflineStats] = useState({
    totalActions: 0,
    pendingActions: 0,
    failedActions: 0,
    storageUsed: 0,
    lastSync: null as Date | null
  });
  const [isLoading, setIsLoading] = useState(false);
  const isOnline = useNetworkStatus();

  useEffect(() => {
    // Check if app is installed
    setIsInstalled(window.matchMedia('(display-mode: standalone)').matches);
    
    // Check notification permission
    if ('Notification' in window) {
      setNotifications(Notification.permission === 'granted');
    }

    // Load offline stats
    loadOfflineStats();
  }, []);

  const loadOfflineStats = async () => {
    try {
      const stats = await OfflineService.getOfflineStats();
      setOfflineStats(stats);
    } catch (error) {
      console.error('Failed to load offline stats:', error);
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
      return;
    }

    if (enabled) {
      const permission = await Notification.requestPermission();
      setNotifications(permission === 'granted');
    } else {
      setNotifications(false);
      // Note: Cannot revoke notification permission programmatically
    }
  };

  const handleSyncNow = async () => {
    if (!isOnline) return;
    
    setIsLoading(true);
    try {
      await OfflineService.triggerSync();
      await loadOfflineStats();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = async () => {
    if (!confirm('Are you sure you want to clear the offline cache? This will remove all cached data.')) {
      return;
    }

    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      await OfflineService.clearSyncedActions();
      await loadOfflineStats();
      
      alert('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      alert('Failed to clear cache');
    }
  };

  const handleRetryFailed = async () => {
    try {
      await OfflineService.retryFailedActions();
      await loadOfflineStats();
    } catch (error) {
      console.error('Failed to retry actions:', error);
    }
  };

  const handleExportData = async () => {
    try {
      setIsLoading(true);
      const data = await OfflineService.exportOfflineData();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vinesight-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Failed to export data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatStorageSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getPlatformInfo = () => {
    const userAgent = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(userAgent)) {
      return { platform: 'iOS', icon: Smartphone };
    } else if (/Android/.test(userAgent)) {
      return { platform: 'Android', icon: Smartphone };
    } else {
      return { platform: 'Desktop', icon: Monitor };
    }
  };

  const platformInfo = getPlatformInfo();
  const PlatformIcon = platformInfo.icon;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
              <Settings className="h-8 w-8" />
              App Settings
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your VineSight app installation and offline features
            </p>
          </div>
        </div>

        {/* Installation Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlatformIcon className="h-5 w-5" />
              App Installation
            </CardTitle>
            <CardDescription>
              Install VineSight for the best experience on {platformInfo.platform}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${isInstalled ? 'bg-green-500' : 'bg-gray-400'}`} />
                <div>
                  <p className="font-medium">
                    {isInstalled ? 'App Installed' : 'Not Installed'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isInstalled ? 
                      'VineSight is installed and ready to use offline' : 
                      'Install for offline access and better performance'
                    }
                  </p>
                </div>
              </div>
              
              {!isInstalled && <InstallButton />}
            </div>

            {isInstalled && (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Installation Benefits Active</span>
                </div>
                <ul className="text-sm text-green-700 mt-2 space-y-1 ml-6">
                  <li>• Works completely offline</li>
                  <li>• Faster app loading and navigation</li>
                  <li>• Native app-like experience</li>
                  <li>• Push notifications support</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Online/Offline Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isOnline ? <Wifi className="h-5 w-5 text-green-600" /> : <WifiOff className="h-5 w-5 text-red-600" />}
              Connection Status
            </CardTitle>
            <CardDescription>
              Current network status and sync information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OfflineIndicator showDetails />
          </CardContent>
        </Card>

        {/* App Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              App Preferences
            </CardTitle>
            <CardDescription>
              Configure app behavior and features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Battery className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified about irrigation schedules and reminders
                  </p>
                </div>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={handleNotificationToggle}
              />
            </div>

            {/* Offline Mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Cloud className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Offline Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Allow app to work without internet connection
                  </p>
                </div>
              </div>
              <Switch
                checked={offlineMode}
                onCheckedChange={setOfflineMode}
              />
            </div>

            {/* Auto Sync */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sync className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium">Auto Sync</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically sync data when connection is available
                  </p>
                </div>
              </div>
              <Switch
                checked={autoSync}
                onCheckedChange={setAutoSync}
              />
            </div>
          </CardContent>
        </Card>

        {/* Storage Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Storage & Data
            </CardTitle>
            <CardDescription>
              Manage offline data and storage usage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Storage Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800">
                  <HardDrive className="h-4 w-4" />
                  <span className="font-medium">Storage Used</span>
                </div>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {formatStorageSize(offlineStats.storageUsed)}
                </p>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <Sync className="h-4 w-4" />
                  <span className="font-medium">Pending Sync</span>
                </div>
                <p className="text-2xl font-bold text-yellow-900 mt-1">
                  {offlineStats.pendingActions}
                </p>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Failed Actions</span>
                </div>
                <p className="text-2xl font-bold text-red-900 mt-1">
                  {offlineStats.failedActions}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <Button
                onClick={handleSyncNow}
                disabled={!isOnline || isLoading}
                className="gap-2"
              >
                <Sync className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Sync Now
              </Button>
              
              {offlineStats.failedActions > 0 && (
                <Button
                  onClick={handleRetryFailed}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry Failed
                </Button>
              )}
              
              <Button
                onClick={handleExportData}
                variant="outline"
                disabled={isLoading}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export Data
              </Button>
              
              <Button
                onClick={handleClearCache}
                variant="outline"
                className="gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Clear Cache
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* PWA Features Info */}
        <Card>
          <CardHeader>
            <CardTitle>Progressive Web App Features</CardTitle>
            <CardDescription>
              What makes VineSight work great as a PWA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-green-800">✅ Available Features</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Offline data storage and sync</li>
                  <li>• App-like installation experience</li>
                  <li>• Background data synchronization</li>
                  <li>• Cached content for fast loading</li>
                  <li>• Weather data caching</li>
                  <li>• Cross-platform compatibility</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-blue-800">🔄 Smart Caching</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Pages cached for 24 hours</li>
                  <li>• Weather data cached for 30 minutes</li>
                  <li>• Static assets cached for 7 days</li>
                  <li>• API responses cached for 5 minutes</li>
                  <li>• Automatic cache management</li>
                  <li>• Intelligent update strategies</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}