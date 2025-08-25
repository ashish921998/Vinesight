"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Download, 
  Languages, 
  Database,
  FileText,
  CheckCircle,
  AlertCircle,
  Trash2,
  RefreshCw,
  Smartphone
} from "lucide-react";
import { DatabaseService, Farm } from "@/lib/db-utils";
import { ExportService } from "@/lib/export-utils";

export default function SettingsPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [language, setLanguage] = useState('en');
  const [exportInProgress, setExportInProgress] = useState(false);
  const [dbStats, setDbStats] = useState({
    totalRecords: 0,
    lastBackup: null as Date | null
  });

  useEffect(() => {
    loadFarms();
    loadDatabaseStats();
    
    // Load saved language preference
    const savedLang = localStorage.getItem('vinesight-language') || 'en';
    setLanguage(savedLang);
  }, []);

  const loadFarms = async () => {
    try {
      const farmList = await DatabaseService.getAllFarms();
      setFarms(farmList);
      if (farmList.length > 0 && !selectedFarm) {
        setSelectedFarm(farmList[0]);
      }
    } catch (error) {
      console.error("Error loading farms:", error);
    }
  };

  const loadDatabaseStats = async () => {
    try {
      // This is a simplified version - in a real app you'd query actual record counts
      setDbStats({
        totalRecords: farms.length * 10, // Placeholder
        lastBackup: new Date() // Placeholder
      });
    } catch (error) {
      console.error("Error loading database stats:", error);
    }
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    localStorage.setItem('vinesight-language', newLang);
    // In a real implementation, you'd trigger a language change throughout the app
    alert(`Language changed to ${getLanguageName(newLang)}. Restart the app to see changes.`);
  };

  const getLanguageName = (code: string) => {
    const names: { [key: string]: string } = {
      'en': 'English',
      'hi': 'हिंदी (Hindi)',
      'mr': 'मराठी (Marathi)'
    };
    return names[code] || 'Unknown';
  };

  const handleExport = async (format: 'csv' | 'pdf', recordType: 'all' | 'irrigation' | 'spray' | 'harvest' = 'all') => {
    if (!selectedFarm) {
      alert('Please select a farm first');
      return;
    }

    setExportInProgress(true);
    try {
      await ExportService.exportFarmData({
        format,
        farmId: selectedFarm.id!,
        recordType: recordType === 'all' ? 'all' : recordType
      });
      alert(`${format.toUpperCase()} export completed successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      alert(`Export failed: ${error}`);
    } finally {
      setExportInProgress(false);
    }
  };

  const clearAllData = async () => {
    const confirmation = prompt(
      'This will delete ALL farm data permanently. Type "DELETE" to confirm:'
    );
    
    if (confirmation === 'DELETE') {
      try {
        // Delete all farms (which cascades to all records)
        for (const farm of farms) {
          await DatabaseService.deleteFarm(farm.id!);
        }
        await loadFarms();
        alert('All data has been cleared successfully.');
      } catch (error) {
        console.error('Error clearing data:', error);
        alert('Failed to clear data. Please try again.');
      }
    }
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳' }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure app preferences, export data, and manage your farms
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Language Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              Language Settings
            </CardTitle>
            <CardDescription>
              Choose your preferred language for the app interface
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Current Language</Label>
                <div className="mt-2">
                  <Badge variant="outline" className="text-sm">
                    {languages.find(l => l.code === language)?.flag} {getLanguageName(language)}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Available Languages</Label>
                <div className="grid grid-cols-1 gap-2">
                  {languages.map((lang) => (
                    <Button
                      key={lang.code}
                      variant={language === lang.code ? "default" : "outline"}
                      onClick={() => handleLanguageChange(lang.code)}
                      className="justify-start"
                    >
                      <span className="mr-2">{lang.flag}</span>
                      {lang.name}
                    </Button>
                  ))}
                </div>
              </div>

              {language !== 'en' && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Translation Status</span>
                  </div>
                  <p className="text-sm text-amber-700 mt-1">
                    {language === 'hi' ? 'Hindi' : 'Marathi'} translation is coming soon. 
                    The app will restart in English for now.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Data Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Data Export
            </CardTitle>
            <CardDescription>
              Export your farm data for backup or analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedFarm && (
                <div>
                  <Label>Selected Farm</Label>
                  <div className="mt-2">
                    <Badge variant="outline">{selectedFarm.name}</Badge>
                  </div>
                </div>
              )}

              {farms.length > 0 && (
                <div>
                  <Label>Choose Farm</Label>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {farms.map((farm) => (
                      <Button
                        key={farm.id}
                        variant={selectedFarm?.id === farm.id ? "default" : "outline"}
                        onClick={() => setSelectedFarm(farm)}
                        className="justify-start"
                      >
                        {farm.name} - {farm.area}ha
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Label>Export Options</Label>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleExport('pdf')}
                    disabled={!selectedFarm || exportInProgress}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Full Report (PDF)
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => handleExport('csv')}
                    disabled={!selectedFarm || exportInProgress}
                    className="flex items-center gap-2"
                  >
                    <Database className="h-4 w-4" />
                    All Data (CSV)
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => handleExport('csv', 'irrigation')}
                    disabled={!selectedFarm || exportInProgress}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Irrigation Only
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => handleExport('csv', 'harvest')}
                    disabled={!selectedFarm || exportInProgress}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Harvest Only
                  </Button>
                </div>

                {exportInProgress && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Exporting data...</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Management
            </CardTitle>
            <CardDescription>
              Manage your local database and storage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Farms:</span>
                  <span className="ml-2 font-medium">{farms.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Storage:</span>
                  <span className="ml-2 font-medium">Local (IndexedDB)</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={loadDatabaseStats}
                  className="w-full flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Database Stats
                </Button>
                
                <Button
                  variant="destructive"
                  onClick={clearAllData}
                  className="w-full flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear All Data
                </Button>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Offline Storage Active</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  All your data is stored locally and works without internet connection.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PWA Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Progressive Web App
            </CardTitle>
            <CardDescription>
              App installation and offline features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800">
                  <Smartphone className="h-4 w-4" />
                  <span className="text-sm font-medium">Enhanced Mobile Experience</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Install VineSight as an app for offline access and faster performance.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">PWA Features:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    Works completely offline
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    Automatic data synchronization
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    App-like installation
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    Push notifications support
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={() => window.location.href = "/pwa-settings"}
                className="w-full flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Manage PWA Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* App Information */}
        <Card>
          <CardHeader>
            <CardTitle>App Information</CardTitle>
            <CardDescription>
              About VineSight and technical details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Version:</span>
                  <span className="font-medium">1.0.0 MVP</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Platform:</span>
                  <span className="font-medium">Progressive Web App</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Offline Support:</span>
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Available
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Multi-language:</span>
                  <Badge variant="secondary" className="text-xs">
                    Coming Soon
                  </Badge>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Features Available</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    Farm Management
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    Scientific Calculators
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    Operations Journal
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    Data Export
                  </div>
                </div>
              </div>

              <div className="text-center pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  VineSight - Grape Farming Digital Companion
                </p>
                <p className="text-xs text-muted-foreground">
                  Built for Indian farmers with scientific precision
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {farms.length === 0 && (
        <Card className="text-center py-12 mt-6">
          <CardContent>
            <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No farms found</h3>
            <p className="text-muted-foreground mb-4">
              Add a farm first to access export and management features
            </p>
            <Button onClick={() => window.location.href = "/farms"}>
              Add Your First Farm
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}