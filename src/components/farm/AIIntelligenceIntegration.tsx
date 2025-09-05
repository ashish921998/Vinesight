'use client';

import React, { useState, useEffect } from 'react';
import { CriticalAlertsBanner } from './CriticalAlertsBanner';
import { AIInsightsCarousel } from '@/components/ai/AIInsightsCarousel';
import { PestPredictionService } from '@/lib/pest-prediction-service';
import type { CriticalAlert, AIInsight } from '@/types/ai';

interface AIIntelligenceIntegrationProps {
  farmId: number;
  farmData?: {
    latitude: number;
    longitude: number;
    region: string;
    userId: string;
  };
  className?: string;
}

export function AIIntelligenceIntegration({
  farmId,
  farmData,
  className = ''
}: AIIntelligenceIntegrationProps) {
  const [criticalAlerts, setCriticalAlerts] = useState<CriticalAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (farmData) {
      loadCriticalAlerts();
    }
  }, [farmId, farmData]);

  const loadCriticalAlerts = async () => {
    try {
      setLoading(true);
      
      // Generate fresh pest predictions
      const pestPredictions = await PestPredictionService.generatePredictions(farmId, farmData);
      
      if (pestPredictions.success && pestPredictions.data) {
        // Get critical alerts from predictions
        const criticalPredictions = pestPredictions.data.filter(
          p => p.riskLevel === 'critical' || p.riskLevel === 'high'
        );

        // Convert to critical alerts
        const alerts: CriticalAlert[] = criticalPredictions.map(prediction => ({
          id: `pest_${prediction.id}`,
          type: 'pest_prediction' as const,
          severity: prediction.riskLevel === 'critical' ? 'critical' as const : 'high' as const,
          title: `${prediction.pestDiseaseType.replace('_', ' ').toUpperCase()} Risk Alert`,
          message: `${Math.round(prediction.probabilityScore * 100)}% probability of outbreak. ${prediction.preventionWindow.optimalTiming}`,
          icon: prediction.pestDiseaseType.includes('mildew') ? 'fungus' : 'pest',
          actionRequired: true,
          timeWindow: {
            start: prediction.preventionWindow.startDate,
            end: prediction.preventionWindow.endDate,
            urgency: prediction.preventionWindow.optimalTiming
          },
          actions: [
            {
              label: 'View Treatment Options',
              type: 'primary' as const,
              action: 'navigate' as const,
              actionData: { 
                route: `/farms/${farmId}/pest-management?prediction=${prediction.id}`,
                pestType: prediction.pestDiseaseType,
                riskLevel: prediction.riskLevel
              }
            },
            {
              label: 'Acknowledge Alert',
              type: 'secondary' as const,
              action: 'execute' as const,
              actionData: { 
                action: 'acknowledge', 
                predictionId: prediction.id 
              }
            }
          ],
          farmId,
          createdAt: prediction.createdAt
        }));

        setCriticalAlerts(alerts);
      }
    } catch (error) {
      console.error('Error loading critical alerts:', error);
      setCriticalAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAlertAction = async (alertId: string, action: string, actionData?: Record<string, any>) => {
    try {
      if (action === 'navigate' && actionData?.route) {
        // Navigate to the specified route
        window.location.href = actionData.route;
      } else if (action === 'execute' && actionData?.action === 'acknowledge') {
        // Mark alert as acknowledged
        const predictionId = actionData.predictionId;
        await PestPredictionService.updatePredictionOutcome(
          predictionId,
          'acknowledged',
          'farmer_acknowledged'
        );
        
        // Remove from critical alerts
        setCriticalAlerts(prev => prev.filter(alert => alert.id !== alertId));
        
        // Show success feedback
        console.log('Alert acknowledged successfully');
      } else if (action === 'view_all') {
        // Navigate to comprehensive alerts page
        window.location.href = `/farms/${farmId}/ai-insights?filter=alerts`;
      }
    } catch (error) {
      console.error('Error handling alert action:', error);
    }
  };

  const handleDismissAlert = async (alertId: string) => {
    try {
      // Remove alert from state
      setCriticalAlerts(prev => prev.filter(alert => alert.id !== alertId));
      
      // If it's a pest prediction, mark as dismissed
      if (alertId.startsWith('pest_')) {
        const predictionId = alertId.replace('pest_', '');
        await PestPredictionService.updatePredictionOutcome(
          predictionId,
          'dismissed',
          'farmer_dismissed'
        );
      }
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  if (loading) {
    return (
      <div className={className}>
        {/* Loading skeleton for critical alerts */}
        <div className="mb-6">
          <div className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded-lg mb-3"></div>
          </div>
        </div>
        
        {/* AI Insights Carousel will handle its own loading */}
        <AIInsightsCarousel farmId={farmId} />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Critical Alerts Banner - Only show if there are alerts */}
      {criticalAlerts.length > 0 && (
        <div className="mb-6">
          <CriticalAlertsBanner
            alerts={criticalAlerts}
            onAlertAction={handleAlertAction}
            onDismiss={handleDismissAlert}
          />
        </div>
      )}

      {/* Enhanced AI Insights Carousel */}
      <AIInsightsCarousel farmId={farmId} />
    </div>
  );
}

export default AIIntelligenceIntegration;