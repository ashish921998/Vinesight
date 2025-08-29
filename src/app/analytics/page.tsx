"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Droplets, 
  Scissors, 
  SprayCan,
  TrendingUp,
  Calendar,
  BarChart3,
  PieChart,
  DollarSign,
  Target,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Award,
  Zap
} from "lucide-react";
import { DatabaseService, Farm, IrrigationRecord, SprayRecord, HarvestRecord } from "@/lib/db-utils";
import { AnalyticsService, AdvancedAnalytics } from "@/lib/analytics-service";

interface AnalyticsData {
  totalFarms: number;
  totalArea: number;
  totalIrrigationHours: number;
  totalHarvestQuantity: number;
  totalHarvestValue: number;
  irrigationsByMonth: { month: string; hours: number; count: number }[];
  spraysByType: { type: string; count: number }[];
  harvestsByFarm: { farmName: string; quantity: number; value: number }[];
  recentActivity: {
    type: 'irrigation' | 'spray' | 'harvest';
    farmName: string;
    date: string;
    details: string;
  }[];
}

export default function AnalyticsPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [advancedAnalytics, setAdvancedAnalytics] = useState<AdvancedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const farmList = await DatabaseService.getAllFarms();
      setFarms(farmList);
      
      if (!selectedFarm && farmList.length > 0) {
        setSelectedFarm(farmList[0]);
      }

      if (farmList.length === 0) {
        setAnalytics(null);
        setLoading(false);
        return;
      }

      // Calculate analytics
      const analyticsData: AnalyticsData = {
        totalFarms: farmList.length,
        totalArea: farmList.reduce((sum, farm) => sum + farm.area, 0),
        totalIrrigationHours: 0,
        totalHarvestQuantity: 0,
        totalHarvestValue: 0,
        irrigationsByMonth: [],
        spraysByType: [],
        harvestsByFarm: [],
        recentActivity: []
      };

      // Get all records for analysis
      const allIrrigations: (IrrigationRecord & { farmName: string })[] = [];
      const allSprays: (SprayRecord & { farmName: string })[] = [];
      const allHarvests: (HarvestRecord & { farmName: string })[] = [];

      for (const farm of farmList) {
        try {
          const irrigations = await DatabaseService.getIrrigationRecords(farm.id!);
          const sprays = await DatabaseService.getSprayRecords(farm.id!);
          const harvests = await DatabaseService.getHarvestRecords(farm.id!);

          // Add farm name to records
          irrigations.forEach(record => {
            allIrrigations.push({ ...record, farmName: farm.name });
          });
          sprays.forEach(record => {
            allSprays.push({ ...record, farmName: farm.name });
          });
          harvests.forEach(record => {
            allHarvests.push({ ...record, farmName: farm.name });
          });

          // Calculate farm-specific harvest totals
          const farmHarvestQuantity = harvests.reduce((sum, h) => sum + h.quantity, 0);
          const farmHarvestValue = harvests.reduce((sum, h) => sum + (h.quantity * (h.price || 0)), 0);
          
          if (farmHarvestQuantity > 0) {
            analyticsData.harvestsByFarm.push({
              farmName: farm.name,
              quantity: farmHarvestQuantity,
              value: farmHarvestValue
            });
          }
        } catch (farmError) {
          console.error(`Error loading data for farm ${farm.name}:`, farmError);
        }
      }

      // Calculate totals
      analyticsData.totalIrrigationHours = allIrrigations.reduce((sum, r) => sum + r.duration, 0);
      analyticsData.totalHarvestQuantity = allHarvests.reduce((sum, r) => sum + r.quantity, 0);
      analyticsData.totalHarvestValue = allHarvests.reduce((sum, r) => sum + (r.quantity * (r.price || 0)), 0);

      // Group irrigations by month
      const irrigationsByMonth = new Map<string, { hours: number; count: number }>();
      allIrrigations.forEach(record => {
        const date = new Date(record.date);
        const monthYear = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        const existing = irrigationsByMonth.get(monthYear) || { hours: 0, count: 0 };
        irrigationsByMonth.set(monthYear, {
          hours: existing.hours + record.duration,
          count: existing.count + 1
        });
      });

      analyticsData.irrigationsByMonth = Array.from(irrigationsByMonth.entries())
        .map(([month, data]) => ({ month, ...data }))
        .slice(-6); // Last 6 months

      // Group sprays by pest/disease type
      const spraysByType = new Map<string, number>();
      allSprays.forEach(record => {
        const type = record.pestDisease;
        spraysByType.set(type, (spraysByType.get(type) || 0) + 1);
      });

      analyticsData.spraysByType = Array.from(spraysByType.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Recent activity (last 10 activities)
      const recentActivity: any[] = [];
      
      allIrrigations.slice(-5).forEach(record => {
        recentActivity.push({
          type: 'irrigation' as const,
          farmName: (record as any).farmName,
          date: record.date,
          details: `${record.duration}h irrigation - ${record.growthStage}`
        });
      });

      allSprays.slice(-5).forEach(record => {
        recentActivity.push({
          type: 'spray' as const,
          farmName: (record as any).farmName,
          date: record.date,
          details: `${record.pestDisease} treatment with ${record.chemical}`
        });
      });

      allHarvests.slice(-5).forEach(record => {
        recentActivity.push({
          type: 'harvest' as const,
          farmName: (record as any).farmName,
          date: record.date,
          details: `${record.quantity}kg harvested - ${record.grade} grade`
        });
      });

      // Sort by date descending
      analyticsData.recentActivity = recentActivity
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

      setAnalytics(analyticsData);
      
      // Generate advanced analytics
      try {
        const advanced = await AnalyticsService.generateAdvancedAnalytics(farmList);
        setAdvancedAnalytics(advanced);
      } catch (error) {
        console.error("Error generating advanced analytics:", error);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'irrigation': return <Droplets className="h-4 w-4 text-blue-600" />;
      case 'spray': return <SprayCan className="h-4 w-4 text-green-600" />;
      case 'harvest': return <Scissors className="h-4 w-4 text-orange-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground animate-pulse mb-4" />
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics || farms.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No data to analyze</h3>
          <p className="text-muted-foreground mb-4">
            Add farms and record some operations to see analytics
          </p>
          <Button onClick={() => window.location.href = "/farms"}>
            Add Your First Farm
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Data Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Insights and trends from your farming operations
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={timeRange === '30d' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setTimeRange('30d')}
          >
            30 Days
          </Button>
          <Button 
            variant={timeRange === '90d' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setTimeRange('90d')}
          >
            90 Days
          </Button>
          <Button 
            variant={timeRange === '1y' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setTimeRange('1y')}
          >
            1 Year
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Farms</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalFarms}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalArea.toFixed(1)} hectares total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Irrigation Hours</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalIrrigationHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              {(analytics.totalIrrigationHours / analytics.totalArea).toFixed(1)} hrs/hectare avg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Harvest</CardTitle>
            <Scissors className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalHarvestQuantity.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">kg harvested</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Harvest Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.totalHarvestValue)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(analytics.totalHarvestValue / analytics.totalArea)}/hectare
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics Section */}
      {advancedAnalytics && (
        <>
          {/* Cost Analysis Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-green-600" />
              Cost Analysis & Profitability
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
                  <DollarSign className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(advancedAnalytics.costAnalysis.totalCosts)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(advancedAnalytics.costAnalysis.costPerHectare)}/hectare
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${advancedAnalytics.costAnalysis.profitMargin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {advancedAnalytics.costAnalysis.profitMargin.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {advancedAnalytics.costAnalysis.profitMargin > 0 ? 'Profitable' : 'Loss'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">ROI</CardTitle>
                  <Target className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${advancedAnalytics.costAnalysis.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {advancedAnalytics.costAnalysis.roi.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Return on investment
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cost Efficiency</CardTitle>
                  <Zap className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {advancedAnalytics.costAnalysis.costBreakdown.length > 0 ? 
                      advancedAnalytics.costAnalysis.costBreakdown[0].category : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Top cost category
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Cost Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Cost Breakdown
                  </CardTitle>
                  <CardDescription>Expenses by category</CardDescription>
                </CardHeader>
                <CardContent>
                  {advancedAnalytics.costAnalysis.costBreakdown.length > 0 ? (
                    <div className="space-y-3">
                      {advancedAnalytics.costAnalysis.costBreakdown.slice(0, 5).map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-sm">{item.category}</span>
                            <div className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold">{formatCurrency(item.amount)}</span>
                            <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                              <div 
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${item.percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No cost data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Monthly P&L Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Monthly P&L Trends
                  </CardTitle>
                  <CardDescription>Profit and loss by month</CardDescription>
                </CardHeader>
                <CardContent>
                  {advancedAnalytics.costAnalysis.monthlyTrends.length > 0 ? (
                    <div className="space-y-3">
                      {advancedAnalytics.costAnalysis.monthlyTrends.slice(-6).map((item, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-sm">{item.month}</span>
                            <span className={`font-bold ${item.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(item.profit)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>Revenue: {formatCurrency(item.revenue)}</div>
                            <div>Costs: {formatCurrency(item.costs)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No monthly trend data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Yield Analysis Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Scissors className="h-6 w-6 text-orange-600" />
              Yield Analysis & Predictions
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Yield</CardTitle>
                  <Scissors className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {advancedAnalytics.yieldAnalysis.currentYield.toFixed(1)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    tons/hectare
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Yield Efficiency</CardTitle>
                  <Target className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${advancedAnalytics.yieldAnalysis.yieldEfficiency > 80 ? 'text-green-600' : advancedAnalytics.yieldAnalysis.yieldEfficiency > 60 ? 'text-orange-600' : 'text-red-600'}`}>
                    {advancedAnalytics.yieldAnalysis.yieldEfficiency.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    vs target yield
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Projected Yield</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {advancedAnalytics.yieldAnalysis.projectedYield.toFixed(1)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    tons/hectare (next season)
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">vs Regional</CardTitle>
                  <Award className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${advancedAnalytics.yieldAnalysis.benchmarkComparison.your > advancedAnalytics.yieldAnalysis.benchmarkComparison.regional ? 'text-green-600' : 'text-red-600'}`}>
                    {advancedAnalytics.yieldAnalysis.benchmarkComparison.your > advancedAnalytics.yieldAnalysis.benchmarkComparison.regional ? '+' : ''}
                    {(advancedAnalytics.yieldAnalysis.benchmarkComparison.your - advancedAnalytics.yieldAnalysis.benchmarkComparison.regional).toFixed(1)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    tons/hectare difference
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Benchmark Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Yield Benchmarks
                  </CardTitle>
                  <CardDescription>Compare against industry standards</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Your Farms</span>
                      <div className="text-right">
                        <span className="font-bold">{advancedAnalytics.yieldAnalysis.benchmarkComparison.your.toFixed(1)} t/ha</span>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ 
                              width: `${(advancedAnalytics.yieldAnalysis.benchmarkComparison.your / advancedAnalytics.yieldAnalysis.benchmarkComparison.optimal) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Regional Average</span>
                      <div className="text-right">
                        <span className="font-bold">{advancedAnalytics.yieldAnalysis.benchmarkComparison.regional.toFixed(1)} t/ha</span>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-orange-600 h-2 rounded-full"
                            style={{ 
                              width: `${(advancedAnalytics.yieldAnalysis.benchmarkComparison.regional / advancedAnalytics.yieldAnalysis.benchmarkComparison.optimal) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Optimal Yield</span>
                      <div className="text-right">
                        <span className="font-bold">{advancedAnalytics.yieldAnalysis.benchmarkComparison.optimal.toFixed(1)} t/ha</span>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full w-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Yield Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Yield Trends
                  </CardTitle>
                  <CardDescription>Historical yield performance</CardDescription>
                </CardHeader>
                <CardContent>
                  {advancedAnalytics.yieldAnalysis.yieldTrends.length > 0 ? (
                    <div className="space-y-3">
                      {advancedAnalytics.yieldAnalysis.yieldTrends.map((trend, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{trend.year}</span>
                            <div className="text-sm text-muted-foreground">Quality: {trend.quality}</div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold">{trend.yield.toFixed(1)} t/ha</span>
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-orange-600 h-2 rounded-full"
                                style={{ 
                                  width: `${(trend.yield / Math.max(...advancedAnalytics.yieldAnalysis.yieldTrends.map(t => t.yield))) * 100}%` 
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No yield trend data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Performance Metrics Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Activity className="h-6 w-6 text-purple-600" />
              Performance Insights
            </h2>
            
            {/* Overall Score */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Overall Farm Performance Score
                </CardTitle>
                <CardDescription>Comprehensive assessment of your farming practices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${advancedAnalytics.performanceMetrics.overallScore > 85 ? 'text-green-600' : advancedAnalytics.performanceMetrics.overallScore > 70 ? 'text-orange-600' : 'text-red-600'}`}>
                      {advancedAnalytics.performanceMetrics.overallScore.toFixed(0)}
                    </div>
                    <div className="text-sm text-muted-foreground">out of 100</div>
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className={`h-4 rounded-full ${advancedAnalytics.performanceMetrics.overallScore > 85 ? 'bg-green-600' : advancedAnalytics.performanceMetrics.overallScore > 70 ? 'bg-orange-600' : 'bg-red-600'}`}
                        style={{ width: `${advancedAnalytics.performanceMetrics.overallScore}%` }}
                      />
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {advancedAnalytics.performanceMetrics.overallScore > 85 ? 'Excellent performance!' : 
                       advancedAnalytics.performanceMetrics.overallScore > 70 ? 'Good performance with room for improvement' : 
                       'Needs attention - focus on key areas'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Performance Categories */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Irrigation</CardTitle>
                  <Droplets className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${advancedAnalytics.performanceMetrics.categories.irrigation.score > 75 ? 'text-green-600' : advancedAnalytics.performanceMetrics.categories.irrigation.score > 60 ? 'text-orange-600' : 'text-red-600'}`}>
                    {advancedAnalytics.performanceMetrics.categories.irrigation.score.toFixed(0)}
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    {advancedAnalytics.performanceMetrics.categories.irrigation.trend === 'up' ? 
                      <TrendingUp className="h-3 w-3 text-green-500" /> : 
                      advancedAnalytics.performanceMetrics.categories.irrigation.trend === 'down' ? 
                      <TrendingDown className="h-3 w-3 text-red-500" /> : 
                      <span className="w-3 h-3 bg-gray-400 rounded-full" />}
                    <span className="text-muted-foreground">
                      {advancedAnalytics.performanceMetrics.categories.irrigation.trend}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Nutrition</CardTitle>
                  <Zap className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${advancedAnalytics.performanceMetrics.categories.nutrition.score > 75 ? 'text-green-600' : advancedAnalytics.performanceMetrics.categories.nutrition.score > 60 ? 'text-orange-600' : 'text-red-600'}`}>
                    {advancedAnalytics.performanceMetrics.categories.nutrition.score.toFixed(0)}
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    {advancedAnalytics.performanceMetrics.categories.nutrition.trend === 'up' ? 
                      <TrendingUp className="h-3 w-3 text-green-500" /> : 
                      advancedAnalytics.performanceMetrics.categories.nutrition.trend === 'down' ? 
                      <TrendingDown className="h-3 w-3 text-red-500" /> : 
                      <span className="w-3 h-3 bg-gray-400 rounded-full" />}
                    <span className="text-muted-foreground">
                      {advancedAnalytics.performanceMetrics.categories.nutrition.trend}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pest Management</CardTitle>
                  <SprayCan className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${advancedAnalytics.performanceMetrics.categories.pestManagement.score > 75 ? 'text-green-600' : advancedAnalytics.performanceMetrics.categories.pestManagement.score > 60 ? 'text-orange-600' : 'text-red-600'}`}>
                    {advancedAnalytics.performanceMetrics.categories.pestManagement.score.toFixed(0)}
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    {advancedAnalytics.performanceMetrics.categories.pestManagement.trend === 'up' ? 
                      <TrendingUp className="h-3 w-3 text-green-500" /> : 
                      advancedAnalytics.performanceMetrics.categories.pestManagement.trend === 'down' ? 
                      <TrendingDown className="h-3 w-3 text-red-500" /> : 
                      <span className="w-3 h-3 bg-gray-400 rounded-full" />}
                    <span className="text-muted-foreground">
                      {advancedAnalytics.performanceMetrics.categories.pestManagement.trend}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Yield Quality</CardTitle>
                  <Award className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${advancedAnalytics.performanceMetrics.categories.yieldQuality.score > 75 ? 'text-green-600' : advancedAnalytics.performanceMetrics.categories.yieldQuality.score > 60 ? 'text-orange-600' : 'text-red-600'}`}>
                    {advancedAnalytics.performanceMetrics.categories.yieldQuality.score.toFixed(0)}
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    {advancedAnalytics.performanceMetrics.categories.yieldQuality.trend === 'up' ? 
                      <TrendingUp className="h-3 w-3 text-green-500" /> : 
                      advancedAnalytics.performanceMetrics.categories.yieldQuality.trend === 'down' ? 
                      <TrendingDown className="h-3 w-3 text-red-500" /> : 
                      <span className="w-3 h-3 bg-gray-400 rounded-full" />}
                    <span className="text-muted-foreground">
                      {advancedAnalytics.performanceMetrics.categories.yieldQuality.trend}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Recommendations
                  </CardTitle>
                  <CardDescription>AI-generated suggestions to improve performance</CardDescription>
                </CardHeader>
                <CardContent>
                  {advancedAnalytics.performanceMetrics.recommendations.length > 0 ? (
                    <div className="space-y-3">
                      {advancedAnalytics.performanceMetrics.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                          <span className="text-sm">{rec}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No recommendations available</p>
                  )}
                </CardContent>
              </Card>

              {/* Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Alerts & Notifications
                  </CardTitle>
                  <CardDescription>Important updates and actions needed</CardDescription>
                </CardHeader>
                <CardContent>
                  {advancedAnalytics.performanceMetrics.alerts.length > 0 ? (
                    <div className="space-y-3">
                      {advancedAnalytics.performanceMetrics.alerts.map((alert, index) => (
                        <div key={index} className={`flex items-start gap-3 p-3 rounded-lg ${
                          alert.type === 'warning' ? 'bg-orange-50' : 
                          alert.type === 'success' ? 'bg-green-50' : 'bg-blue-50'
                        }`}>
                          {alert.type === 'warning' ? 
                            <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" /> :
                            alert.type === 'success' ? 
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" /> :
                            <Activity className="h-4 w-4 text-blue-600 mt-0.5" />
                          }
                          <div className="flex-1">
                            <div className="text-sm font-medium">{alert.message}</div>
                            {alert.action && (
                              <div className="text-xs text-muted-foreground mt-1">{alert.action}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No alerts at this time</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Irrigation Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Irrigation Trends
            </CardTitle>
            <CardDescription>Monthly irrigation hours and frequency</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.irrigationsByMonth.length > 0 ? (
              <div className="space-y-4">
                {analytics.irrigationsByMonth.map((data, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{data.month}</div>
                      <div className="text-sm text-muted-foreground">{data.count} sessions</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{data.hours.toFixed(1)}h</div>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ 
                            width: `${(data.hours / Math.max(...analytics.irrigationsByMonth.map(d => d.hours))) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No irrigation data available</p>
            )}
          </CardContent>
        </Card>

        {/* Pest/Disease Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Pest & Disease Treatments
            </CardTitle>
            <CardDescription>Most common issues treated</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.spraysByType.length > 0 ? (
              <div className="space-y-3">
                {analytics.spraysByType.map((data, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{data.type}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{data.count} treatments</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ 
                            width: `${(data.count / Math.max(...analytics.spraysByType.map(d => d.count))) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No spray treatment data available</p>
            )}
          </CardContent>
        </Card>

        {/* Harvest Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5" />
              Harvest Performance
            </CardTitle>
            <CardDescription>Yield and value by farm</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.harvestsByFarm.length > 0 ? (
              <div className="space-y-4">
                {analytics.harvestsByFarm.map((data, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="font-medium text-sm mb-2">{data.farmName}</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Quantity:</span>
                        <span className="ml-2 font-medium">{data.quantity.toLocaleString()} kg</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Value:</span>
                        <span className="ml-2 font-medium">{formatCurrency(data.value)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No harvest data available</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest farm operations</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {analytics.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{activity.farmName}</span>
                        <Badge variant="outline" className="text-xs">
                          {activity.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{activity.details}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}