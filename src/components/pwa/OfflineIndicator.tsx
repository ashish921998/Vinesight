"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Wifi, 
  WifiOff, 
  CloudOff, 
  Cloud, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  HardDrive,
  RefreshCw,
  X
} from "lucide-react";
import { OfflineService } from "@/lib/offline-service";

interface OfflineIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export function OfflineIndicator({ showDetails = false, className = "" }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [offlineStats, setOfflineStats] = useState({
    totalActions: 0,
    pendingActions: 0,
    failedActions: 0,
    storageUsed: 0,
    lastSync: null as Date | null
  });

  useEffect(() => {
    // Initialize offline service
    OfflineService.init().catch(console.error);

    // Set initial online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
      // Hide the message after 5 seconds
      setTimeout(() => setShowOfflineMessage(false), 5000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update stats periodically
    const updateStats = async () => {
      try {
        const stats = await OfflineService.getOfflineStats();
        setOfflineStats(stats);
      } catch (error) {
        console.error('Failed to update offline stats:', error);
      }
    };

    updateStats();
    const statsInterval = setInterval(updateStats, 30000); // Update every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(statsInterval);
      OfflineService.stopSyncProcess();
    };
  }, []);

  const triggerSync = async () => {
    if (!isOnline) return;
    
    setSyncStatus('syncing');
    try {
      await OfflineService.triggerSync();
      setSyncStatus('idle');
      
      // Update stats after sync
      const stats = await OfflineService.getOfflineStats();
      setOfflineStats(stats);
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
    }
  };

  const retryFailedActions = async () => {
    try {
      await OfflineService.retryFailedActions();
      const stats = await OfflineService.getOfflineStats();
      setOfflineStats(stats);
    } catch (error) {
      console.error('Failed to retry actions:', error);
    }
  };

  const formatStorageSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatLastSync = (date: Date | null): string => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Offline notification toast
  if (showOfflineMessage) {
    return (
      <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
        <Card className="border-orange-200 bg-orange-50 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <WifiOff className="h-5 w-5 text-orange-600" />
              <div className="flex-1">
                <p className="font-medium text-orange-800">You're offline</p>
                <p className="text-sm text-orange-700">Your data will sync when you reconnect</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOfflineMessage(false)}
                className="text-orange-600 hover:text-orange-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Compact status indicator
  if (!showDetails) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-600" />
          )}
          <span className="text-sm text-muted-foreground">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        
        {offlineStats.pendingActions > 0 && (
          <Badge variant="outline" className="text-xs">
            <RotateCcw className="h-3 w-3 mr-1" />
            {offlineStats.pendingActions}
          </Badge>
        )}
      </div>
    );
  }

  // Detailed offline status panel
  return (
    <Card className="border-gray-200">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              <div>
                <p className="font-medium">
                  {isOnline ? 'Online' : 'Offline'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isOnline ? 'Connected to internet' : 'Working in offline mode'}
                </p>
              </div>
            </div>
            
            {isOnline && (
              <Button
                variant="outline"
                size="sm"
                onClick={triggerSync}
                disabled={syncStatus === 'syncing'}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                {syncStatus === 'syncing' ? 'Syncing...' : 'Sync'}
              </Button>
            )}
          </div>

          {/* Sync Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Pending</span>
              </div>
              <div className="text-lg font-bold text-blue-600">
                {offlineStats.pendingActions}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Failed</span>
              </div>
              <div className="text-lg font-bold text-red-600">
                {offlineStats.failedActions}
              </div>
            </div>
          </div>

          {/* Storage Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Storage Used</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatStorageSize(offlineStats.storageUsed)}
              </span>
            </div>
          </div>

          {/* Last Sync */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Last Sync</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatLastSync(offlineStats.lastSync)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          {(offlineStats.failedActions > 0 || offlineStats.pendingActions > 0) && (
            <div className="flex gap-2 pt-2 border-t">
              {offlineStats.failedActions > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={retryFailedActions}
                  className="flex-1 gap-2 text-red-600 hover:text-red-700"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry Failed ({offlineStats.failedActions})
                </Button>
              )}
              
              {offlineStats.pendingActions > 0 && isOnline && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={triggerSync}
                  className="flex-1 gap-2 text-blue-600 hover:text-blue-700"
                  disabled={syncStatus === 'syncing'}
                >
                  <RotateCcw className={`h-4 w-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                  Sync Now ({offlineStats.pendingActions})
                </Button>
              )}
            </div>
          )}

          {/* Success State */}
          {isOnline && offlineStats.pendingActions === 0 && offlineStats.failedActions === 0 && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">All data is synced</span>
            </div>
          )}

          {/* Offline Mode Benefits */}
          {!isOnline && (
            <div className="bg-blue-50 p-3 rounded-lg space-y-2">
              <h4 className="font-medium text-blue-800">Working Offline</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• All your data is saved locally</li>
                <li>• Changes will sync when you reconnect</li>
                <li>• Calculators and tools work normally</li>
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Simple network status hook for other components
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}