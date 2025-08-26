"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Download, 
  FileText, 
  FileSpreadsheet,
  Calendar,
  Filter,
  BarChart3,
  IndianRupee,
  Shield,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  TrendingUp
} from 'lucide-react';
import { DatabaseService, type Farm } from '@/lib/db-utils';
import { ExportService, type ExportOptions } from '@/lib/export-service';

type ReportType = 'operations' | 'financial' | 'compliance' | 'comprehensive';

export default function ExportPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState<string>('');
  const [farmsLoading, setFarmsLoading] = useState(true);

  const [exportOptions, setExportOptions] = useState<Partial<ExportOptions>>({
    dateRange: {
      from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days ago
      to: new Date().toISOString().split('T')[0]
    },
    includeTypes: [],
    format: 'pdf',
    reportType: 'comprehensive'
  });

  useEffect(() => {
    loadFarms();
  }, []);

  useEffect(() => {
    if (selectedFarm) {
      loadAvailableTypes();
    }
  }, [selectedFarm]);

  const loadFarms = async () => {
    try {
      console.log('Export: Loading farms from DatabaseService...');
      const farmList = await DatabaseService.getAllFarms();
      console.log('Export: Loaded farms:', farmList.length, farmList);
      setFarms(farmList);
      if (farmList.length > 0) {
        setSelectedFarm(farmList[0]);
      }
    } catch (error) {
      console.error('Error loading farms:', error);
    } finally {
      setFarmsLoading(false);
    }
  };

  const loadAvailableTypes = async () => {
    if (!selectedFarm) return;
    
    try {
      const types = await ExportService.getAvailableExportTypes(selectedFarm.id!);
      setAvailableTypes(types);
      setExportOptions(prev => ({
        ...prev,
        includeTypes: types // Select all available types by default
      }));
    } catch (error) {
      console.error('Error loading available types:', error);
    }
  };

  const handleExport = async () => {
    if (!selectedFarm || !exportOptions.includeTypes?.length) return;

    setLoading(true);
    setExportProgress('Preparing export...');

    try {
      const options: ExportOptions = {
        farmId: selectedFarm.id!,
        dateRange: exportOptions.dateRange!,
        includeTypes: exportOptions.includeTypes!,
        format: exportOptions.format!,
        reportType: exportOptions.reportType!
      };

      setExportProgress('Gathering data...');
      await new Promise(resolve => setTimeout(resolve, 500)); // Show progress

      setExportProgress(`Generating ${exportOptions.format?.toUpperCase()} report...`);
      await ExportService.exportData(options);

      setExportProgress('Export completed successfully!');
      setTimeout(() => setExportProgress(''), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      setExportProgress('Export failed. Please try again.');
      setTimeout(() => setExportProgress(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeToggle = (type: string, checked: boolean) => {
    setExportOptions(prev => ({
      ...prev,
      includeTypes: checked 
        ? [...(prev.includeTypes || []), type]
        : (prev.includeTypes || []).filter(t => t !== type)
    }));
  };

  const reportTypes = [
    {
      id: 'operations' as ReportType,
      title: 'Operations Report',
      description: 'Irrigation, spraying, fertigation, and harvest records',
      icon: FileCheck,
      color: 'text-blue-600',
      includes: ['irrigation', 'spray', 'fertigation', 'harvest']
    },
    {
      id: 'financial' as ReportType,
      title: 'Financial Report', 
      description: 'Expense tracking, cost analysis, and revenue data',
      icon: IndianRupee,
      color: 'text-green-600',
      includes: ['expenses', 'harvest']
    },
    {
      id: 'compliance' as ReportType,
      title: 'Compliance Report',
      description: 'Soil tests, chemical applications, and record keeping',
      icon: Shield,
      color: 'text-purple-600',
      includes: ['spray', 'soilTests', 'calculations']
    },
    {
      id: 'comprehensive' as ReportType,
      title: 'Comprehensive Report',
      description: 'Complete farm data with all records and analysis',
      icon: Database,
      color: 'text-orange-600',
      includes: ['all']
    }
  ];

  const dataTypes = [
    { id: 'irrigation', label: 'Irrigation Records', icon: '💧', description: 'Water application events and schedules' },
    { id: 'spray', label: 'Spray Records', icon: '🌿', description: 'Pesticide and fungicide applications' },
    { id: 'fertigation', label: 'Fertigation Records', icon: '🧪', description: 'Fertilizer through irrigation system' },
    { id: 'harvest', label: 'Harvest Records', icon: '🍇', description: 'Yield data, grades, and sales' },
    { id: 'expenses', label: 'Expense Records', icon: '💰', description: 'Cost tracking and financial data' },
    { id: 'calculations', label: 'Calculations History', icon: '📊', description: 'Scientific calculation results' },
    { id: 'soilTests', label: 'Soil Tests', icon: '🌱', description: 'Soil analysis and recommendations' },
    { id: 'tasks', label: 'Task Records', icon: '📋', description: 'Completed and pending tasks' }
  ];

  const getDataCounts = () => {
    // This would normally fetch actual counts from the database
    // For now, showing available types count
    return availableTypes.length;
  };

  return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
              <Download className="h-8 w-8" />
              Data Export & Reports
            </h1>
            <p className="text-muted-foreground mt-2">
              Export your farm data as CSV files or generate professional PDF reports
            </p>
          </div>
          <Badge variant="outline" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            {getDataCounts()} data types available
          </Badge>
        </div>

        {/* Farm Selection */}
        {farms.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Select Farm</CardTitle>
              <CardDescription>Choose a farm to export data from</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {farms.map((farm) => (
                  <Button
                    key={farm.id}
                    variant={selectedFarm?.id === farm.id ? "default" : "outline"}
                    onClick={() => setSelectedFarm(farm)}
                    className="flex items-center gap-2"
                  >
                    {farm.name}
                    <Badge variant="secondary">
                      {farm.area}ha • {farm.grapeVariety}
                    </Badge>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedFarm && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Export Configuration */}
            <div className="space-y-6">
              {/* Report Type Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Report Type
                  </CardTitle>
                  <CardDescription>Choose the type of report to generate</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {reportTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <div
                        key={type.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          exportOptions.reportType === type.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setExportOptions(prev => ({ ...prev, reportType: type.id }))}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className={`h-5 w-5 mt-0.5 ${type.color}`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{type.title}</span>
                              {exportOptions.reportType === type.id && (
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{type.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Date Range */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Date Range
                  </CardTitle>
                  <CardDescription>Select the period for data export</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="from-date">From Date</Label>
                      <Input
                        id="from-date"
                        type="date"
                        value={exportOptions.dateRange?.from}
                        onChange={(e) => setExportOptions(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange!, from: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="to-date">To Date</Label>
                      <Input
                        id="to-date"
                        type="date"
                        value={exportOptions.dateRange?.to}
                        onChange={(e) => setExportOptions(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange!, to: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                  
                  {/* Quick Date Presets */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                        const to = new Date().toISOString().split('T')[0];
                        setExportOptions(prev => ({ ...prev, dateRange: { from, to } }));
                      }}
                    >
                      Last 30 days
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                        const to = new Date().toISOString().split('T')[0];
                        setExportOptions(prev => ({ ...prev, dateRange: { from, to } }));
                      }}
                    >
                      Last 3 months
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const from = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
                        const to = new Date().toISOString().split('T')[0];
                        setExportOptions(prev => ({ ...prev, dateRange: { from, to } }));
                      }}
                    >
                      This year
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Format Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Export Format
                  </CardTitle>
                  <CardDescription>Choose the output format for your data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        exportOptions.format === 'pdf'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setExportOptions(prev => ({ ...prev, format: 'pdf' }))}
                    >
                      <div className="text-center">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-red-600" />
                        <div className="font-medium">PDF Report</div>
                        <div className="text-sm text-muted-foreground">Professional formatted reports</div>
                      </div>
                    </div>
                    <div
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        exportOptions.format === 'csv'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setExportOptions(prev => ({ ...prev, format: 'csv' }))}
                    >
                      <div className="text-center">
                        <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-green-600" />
                        <div className="font-medium">CSV Data</div>
                        <div className="text-sm text-muted-foreground">Raw data for analysis</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Data Selection & Preview */}
            <div className="space-y-6">
              {/* Data Types Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Data Selection
                  </CardTitle>
                  <CardDescription>Choose which types of data to include</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Select data types:</span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExportOptions(prev => ({ 
                          ...prev, 
                          includeTypes: availableTypes 
                        }))}
                      >
                        Select All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExportOptions(prev => ({ 
                          ...prev, 
                          includeTypes: [] 
                        }))}
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>

                  {dataTypes.map((type) => {
                    const isAvailable = availableTypes.includes(type.id);
                    const isSelected = exportOptions.includeTypes?.includes(type.id);
                    
                    return (
                      <div
                        key={type.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg border ${
                          !isAvailable ? 'bg-muted/50 opacity-60' : ''
                        }`}
                      >
                        <Checkbox
                          id={type.id}
                          checked={isSelected}
                          disabled={!isAvailable}
                          onCheckedChange={(checked) => handleTypeToggle(type.id, !!checked)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{type.icon}</span>
                            <label 
                              htmlFor={type.id} 
                              className="font-medium cursor-pointer"
                            >
                              {type.label}
                            </label>
                            {!isAvailable && (
                              <Badge variant="outline" className="text-xs">
                                No data
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {type.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Export Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Export Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Farm:</span>
                      <span className="font-medium">{selectedFarm.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Date Range:</span>
                      <span className="font-medium">
                        {new Date(exportOptions.dateRange?.from!).toLocaleDateString()} - {new Date(exportOptions.dateRange?.to!).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Report Type:</span>
                      <span className="font-medium capitalize">{exportOptions.reportType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Format:</span>
                      <span className="font-medium uppercase">{exportOptions.format}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Data Types:</span>
                      <span className="font-medium">{exportOptions.includeTypes?.length || 0} selected</span>
                    </div>
                  </div>

                  {/* Export Progress */}
                  {exportProgress && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        {loading ? (
                          <Clock className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                        <span className="text-sm">{exportProgress}</span>
                      </div>
                    </div>
                  )}

                  {/* Export Button */}
                  <Button 
                    onClick={handleExport}
                    disabled={loading || !exportOptions.includeTypes?.length}
                    className="w-full mt-4"
                  >
                    {loading ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Generate {exportOptions.format?.toUpperCase()} Export
                      </>
                    )}
                  </Button>

                  {!exportOptions.includeTypes?.length && (
                    <div className="flex items-center gap-2 mt-2 text-yellow-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">Please select at least one data type to export</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {farmsLoading ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span>Loading farms...</span>
              </div>
            </CardContent>
          </Card>
        ) : farms.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No farms found</h3>
              <p className="text-muted-foreground mb-4">
                Add a farm first to export data and generate reports
              </p>
              <Button onClick={() => window.location.href = "/farms"}>
                Add Your First Farm
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
  );
}