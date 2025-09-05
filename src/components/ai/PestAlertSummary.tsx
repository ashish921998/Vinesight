"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  TrendingUp,
  Shield,
  ChevronRight,
  Bug,
  Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PestPredictionService } from '@/lib/pest-prediction-service';
import type { PestDiseasePrediction } from '@/types/ai';

interface PestAlertSummaryProps {
  farmId: number;
  className?: string;
}

export function PestAlertSummary({ farmId, className }: PestAlertSummaryProps) {
  const [predictions, setPredictions] = useState<PestDiseasePrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadPredictions = useCallback(async () => {
    try {
      setLoading(true);
      const activePredictions = await PestPredictionService.getActivePredictions(farmId);
      setPredictions(activePredictions);
    } catch (error) {
      // Log error for debugging in development only
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error loading pest predictions:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    loadPredictions();
  }, [loadPredictions]);

  const formatPestName = (pestType: string) => {
    return pestType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high': return <TrendingUp className="h-4 w-4 text-orange-600" />;
      default: return <Bug className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleViewDetails = () => {
    router.push(`/farms/${farmId}/pest-alerts`);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="animate-pulse flex items-center space-x-4">
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (predictions.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="text-sm font-medium text-green-800">All Clear</h3>
                <p className="text-xs text-green-600">No threats detected</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              AI Monitoring
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  const criticalAlerts = predictions.filter(p => p.riskLevel === 'critical');
  const highAlerts = predictions.filter(p => p.riskLevel === 'high');
  const mediumAlerts = predictions.filter(p => p.riskLevel === 'medium');
  const lowAlerts = predictions.filter(p => p.riskLevel === 'low');

  // Get the most urgent alert
  const mostUrgentAlert = criticalAlerts[0] || highAlerts[0] || predictions[0];

  return (
    <Card className={`${className} border-l-4 ${getRiskColor(mostUrgentAlert?.riskLevel)}`}>
      <CardHeader className="pb-2 px-4 pt-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">AI Pest Alerts</span>
          </div>
          <div className="flex items-center gap-1">
            {criticalAlerts.length > 0 && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                {criticalAlerts.length} Critical
              </Badge>
            )}
            {highAlerts.length > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                {highAlerts.length} High
              </Badge>
            )}
            {(mediumAlerts.length > 0 || lowAlerts.length > 0) && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                +{mediumAlerts.length + lowAlerts.length}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 pb-3 pt-0">
        <div className="space-y-3">
          {/* Most Urgent Alert Preview */}
          {mostUrgentAlert && (
            <div className="flex items-start gap-3">
              {getRiskIcon(mostUrgentAlert.riskLevel)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-medium truncate">
                    {formatPestName(mostUrgentAlert.pestDiseaseType)}
                  </h4>
                  <Badge 
                    variant={mostUrgentAlert.riskLevel === 'critical' ? 'destructive' : 'secondary'} 
                    className="text-xs"
                  >
                    {Math.round(mostUrgentAlert.probabilityScore * 100)}%
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 truncate">
                  {mostUrgentAlert.region} • Prevention window active
                </p>
              </div>
            </div>
          )}

          {/* View Details Button */}
          <Button 
            onClick={handleViewDetails}
            variant="outline"
            size="sm"
            className="w-full h-8 justify-between"
          >
            <span className="text-sm">View All Details</span>
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}