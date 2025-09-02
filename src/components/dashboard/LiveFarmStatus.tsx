"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Activity,
  Droplets, 
  Thermometer,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  CloudRain,
  Gauge,
  Leaf
} from "lucide-react";

interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  condition: string;
}

interface SoilData {
  moisture: number; // percentage
  temperature: number;
  ph: number;
  lastUpdated: Date;
}

interface WaterStatus {
  currentLevel: number; // percentage
  dailyUsage: number; // liters
  weeklyTarget: number; // liters
  weeklyUsed: number; // liters
  efficiency: number; // percentage
}

interface GrowthMetrics {
  stage: string;
  progress: number; // percentage
  healthScore: number; // 0-100
  expectedHarvest: Date;
  daysToHarvest: number;
}

interface FinancialSummary {
  weeklyRevenue: number;
  weeklyExpenses: number;
  profitMargin: number;
  trend: 'up' | 'down' | 'stable';
}

interface LiveFarmStatusProps {
  weather?: WeatherData;
  soil?: SoilData;
  water?: WaterStatus;
  growth?: GrowthMetrics;
  financial?: FinancialSummary;
  loading?: boolean;
  farmName?: string;
}

export function LiveFarmStatus({ 
  weather, 
  soil, 
  water, 
  growth, 
  financial, 
  loading,
  farmName
}: LiveFarmStatusProps) {
  
  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-primary';
    if (value >= thresholds.warning) return 'text-amber-600';
    return 'text-red-600';
  };

  const getProgressColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'bg-primary';
    if (value >= thresholds.warning) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-primary" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Live Farm Status
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                  <div className="w-20 h-4 bg-gray-200 rounded" />
                </div>
                <div className="w-16 h-6 bg-gray-200 rounded mb-2" />
                <div className="w-full h-2 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        {farmName ? `${farmName} - Status & Metrics` : 'Farm Status & Metrics'}
      </h3>
      
      {/* Key Metrics Overview */}
      {(weather || soil || water) && (
        <div className="mb-4 p-3 bg-primary/5 rounded-xl">
          <div className="grid grid-cols-3 gap-3">
            {weather && (
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{weather.temperature}°C</div>
                <div className="text-xs text-muted-foreground">Temperature</div>
              </div>
            )}
            {soil && (
              <div className="text-center">
                <div className={`text-lg font-bold ${getStatusColor(soil.moisture, { good: 60, warning: 30 })}`}>
                  {soil.moisture}%
                </div>
                <div className="text-xs text-muted-foreground">Soil Moisture</div>
              </div>
            )}
            {water && (
              <div className="text-center">
                <div className={`text-lg font-bold ${getStatusColor(water.currentLevel, { good: 70, warning: 40 })}`}>
                  {water.currentLevel}%
                </div>
                <div className="text-xs text-muted-foreground">Water Level</div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Weather & Environment Card */}
        {weather && (
          <Card className="border-primary/20 touch-manipulation">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Thermometer className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Environment</h4>
                  <p className="text-xs text-muted-foreground">{weather.condition}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Humidity</span>
                  <span className={`font-semibold text-sm ${getStatusColor(weather.humidity, { good: 60, warning: 40 })}`}>
                    {weather.humidity}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Wind Speed</span>
                  <span className="font-semibold text-sm text-foreground">{weather.windSpeed} km/h</span>
                </div>
                
                {weather.precipitation > 0 ? (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 rounded-lg">
                    <CloudRain className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-800">{weather.precipitation}mm expected</span>
                  </div>
                ) : (
                  <div className="text-center mt-2 p-2 bg-primary/5 rounded-lg">
                    <span className="text-xs text-muted-foreground">No precipitation expected</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Irrigation & Resources Card */}
        {(soil || water) && (
          <Card className="border-primary/20 touch-manipulation">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Droplets className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Irrigation Status</h4>
                  <p className="text-xs text-muted-foreground">
                    {soil ? `Updated ${soil.lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Live monitoring'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                {soil && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-muted-foreground">Soil Moisture</span>
                      <span className={`font-semibold text-sm ${getStatusColor(soil.moisture, { good: 60, warning: 30 })}`}>
                        {soil.moisture}%
                      </span>
                    </div>
                    <Progress 
                      value={soil.moisture} 
                      className="h-2"
                      style={{
                        backgroundColor: 'var(--muted)',
                      }}
                    />
                    {soil.moisture < 30 && (
                      <div className="mt-1 text-xs text-red-600 font-medium">
                        ⚠️ Irrigation recommended
                      </div>
                    )}
                  </div>
                )}
                
                {water && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-muted-foreground">Water Reserve</span>
                      <span className={`font-semibold text-sm ${getStatusColor(water.currentLevel, { good: 70, warning: 40 })}`}>
                        {water.currentLevel}%
                      </span>
                    </div>
                    <Progress 
                      value={water.currentLevel} 
                      className="h-2"
                    />
                    
                    <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                      <div className="text-center p-1 bg-primary/5 rounded">
                        <div className="font-medium text-foreground">{water.dailyUsage}L</div>
                        <div className="text-muted-foreground">Daily usage</div>
                      </div>
                      <div className="text-center p-1 bg-primary/5 rounded">
                        <div className="font-medium text-foreground">{water.efficiency}%</div>
                        <div className="text-muted-foreground">Efficiency</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Crop Development Card */}
        {growth && (
          <Card className="border-primary/20 touch-manipulation">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Leaf className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Crop Development</h4>
                  <p className="text-xs text-muted-foreground">{growth.stage}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-muted-foreground">Stage Progress</span>
                    <span className="font-semibold text-sm text-primary">{growth.progress}%</span>
                  </div>
                  <Progress value={growth.progress} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-primary/5 rounded">
                    <div className={`font-semibold text-sm ${getStatusColor(growth.healthScore, { good: 80, warning: 60 })}`}>
                      {growth.healthScore}
                    </div>
                    <div className="text-xs text-muted-foreground">Health Score</div>
                  </div>
                  <div className="text-center p-2 bg-primary/5 rounded">
                    <div className="font-semibold text-sm text-primary">
                      {growth.daysToHarvest}
                    </div>
                    <div className="text-xs text-muted-foreground">Days to Harvest</div>
                  </div>
                </div>
                
                {growth.healthScore < 60 && (
                  <div className="text-center p-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="text-xs text-amber-800 font-medium">
                      ⚠️ Monitor crop health closely
                    </div>
                  </div>
                )}
                
                {growth.daysToHarvest <= 7 && (
                  <div className="text-center p-2 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-xs text-green-800 font-medium">
                      🎯 Harvest preparations needed
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Farm Economics Card */}
        {financial && (
          <Card className="border-primary/20 touch-manipulation">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Weekly Performance</h4>
                  <p className="text-xs text-muted-foreground">Financial overview</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="font-semibold text-sm text-green-700">
                      ₹{(financial.weeklyRevenue / 1000).toFixed(0)}K
                    </div>
                    <div className="text-xs text-green-600">Revenue</div>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded">
                    <div className="font-semibold text-sm text-red-700">
                      ₹{(financial.weeklyExpenses / 1000).toFixed(0)}K
                    </div>
                    <div className="text-xs text-red-600">Expenses</div>
                  </div>
                </div>
                
                <div className="text-center p-2 border-t border-border">
                  <div className="flex justify-center items-center gap-2 mb-1">
                    <span className={`font-semibold text-base ${
                      financial.profitMargin > 0 ? 'text-primary' : 'text-red-600'
                    }`}>
                      {financial.profitMargin > 0 ? '+' : ''}{financial.profitMargin.toFixed(1)}%
                    </span>
                    {getTrendIcon(financial.trend)}
                  </div>
                  <div className="text-xs text-muted-foreground">Profit Margin</div>
                  
                  {financial.profitMargin < 20 && (
                    <div className="mt-2 text-xs text-amber-700 bg-amber-50 p-1 rounded">
                      Consider cost optimization
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}