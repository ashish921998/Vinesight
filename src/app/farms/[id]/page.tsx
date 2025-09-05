"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { SupabaseService } from "@/lib/supabase-service";
import { PhotoService } from "@/lib/photo-service";

// Import our new components
import { FarmHeader } from "@/components/farm-details/FarmHeader";
import { FarmOverview } from "@/components/farm-details/FarmOverview";
import { QuickActions } from "@/components/farm-details/QuickActions";
import { ActivityFeed } from "@/components/farm-details/ActivityFeed";
import { SimpleWeatherCard } from "@/components/dashboard/SimpleWeatherCard";
import { RemainingWaterCard } from "@/components/farm-details/RemainingWaterCard";
import { UnifiedDataLogsModal } from "@/components/farm-details/UnifiedDataLogsModal";
import { WaterCalculationModal } from "@/components/farm-details/WaterCalculationModal";
import { EditRecordModal } from "@/components/journal/EditRecordModal";

// Phase 3A: AI-Powered Components
import { AIInsightsCarousel } from "@/components/ai/AIInsightsCarousel";
import { PestPredictionService } from "@/lib/pest-prediction-service";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Farm } from "@/types/types";

interface DashboardData {
  farm: Farm;
  pendingTasksCount: number;
  recentIrrigations: any[];
  recentActivities: any[];
  totalHarvest: number;
  totalWaterUsage: number;
  pendingTasks: any[];
  recordCounts: {
    irrigation: number;
    spray: number;
    fertigation: number;
    harvest: number;
    expense: number;
    soilTest: number;
  };
}

export default function FarmDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const farmId = params.id as string;
  
  // Authentication
  const { user } = useSupabaseAuth();

  const [dashboardData, setDashboardData] = useState<DashboardData>();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states
  const [showDataLogsModal, setShowDataLogsModal] = useState(false);
  const [showWaterCalculationModal, setShowWaterCalculationModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // AI Features state
  const [aiPredictionsGenerated, setAiPredictionsGenerated] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await SupabaseService.getDashboardSummary(parseInt(farmId));
      setDashboardData({
        ...data,
        farm: data.farm || null
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    if (farmId) {
      loadDashboardData();
    }
  }, [farmId, loadDashboardData]);

  // Generate AI predictions when farm data is loaded
  useEffect(() => {
    const generateAIPredictions = async () => {
      if (dashboardData?.farm && user && !aiPredictionsGenerated) {
        try {
          await PestPredictionService.generatePredictions(
            parseInt(farmId),
            dashboardData.farm
          );
          setAiPredictionsGenerated(true);
        } catch (error) {
          console.error("Error generating AI predictions:", error);
        }
      }
    };

    generateAIPredictions();
  }, [dashboardData, farmId, user, aiPredictionsGenerated]);

  const completeTask = async (taskId: number) => {
    try {
      await SupabaseService.completeTask(taskId);
      await loadDashboardData();
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  // Unified handler for all data logs
  const handleDataLogsSubmit = async (logs: any[], date: string, dayNotes: string, dayPhotos: File[]) => {
    setIsSubmitting(true);
    try {
      let firstRecordId: number | null = null;
      
      for (let i = 0; i < logs.length; i++) {
        const logEntry = logs[i];
        const record = await saveLogEntry(logEntry, date, dayNotes);
        
        // Store first record ID for photo upload
        if (i === 0 && record?.id) {
          firstRecordId = record.id;
        }
      }
      
      // Upload day photos only once, associated with the first record
      if (firstRecordId && dayPhotos && dayPhotos.length > 0) {
        for (const photo of dayPhotos) {
          try {
            await PhotoService.uploadPhoto(photo, 'day_photos', firstRecordId);
          } catch (photoError) {
            console.error("Error uploading day photo:", photoError);
          }
        }
      }
      
      setShowDataLogsModal(false);
      await loadDashboardData();
    } catch (error) {
      console.error("Error saving data logs:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveLogEntry = async (logEntry: any, date: string, dayNotes: string) => {
    const { type, data } = logEntry;
    let record;

    switch (type) {
      case 'irrigation':
        record = await SupabaseService.addIrrigationRecord({
          farm_id: parseInt(farmId),
          date: date,
          duration: parseFloat(data.duration || '0'),
          area: parseFloat(data.area || '0') || dashboardData?.farm?.area || 0,
          growth_stage: "Active",
          moisture_status: "Good",
          system_discharge: dashboardData?.farm?.systemDischarge || 100,
          notes: dayNotes || ''
        });
        break;
      
      case 'spray':
        record = await SupabaseService.addSprayRecord({
          farm_id: parseInt(farmId),
          date: date,
          pest_disease: data.pest_disease || 'General',
          chemical: data.chemical || 'Unknown',
          dose: "As per label",
          area: dashboardData?.farm?.area || 0,
          weather: "Clear",
          operator: "Farm Owner",
          notes: dayNotes || ''
        });
        break;
      
      case 'harvest':
        record = await SupabaseService.addHarvestRecord({
          farm_id: parseInt(farmId),
          date: date,
          quantity: parseFloat(data.quantity || '0'),
          grade: data.grade || 'Standard',
          price: 0,
          buyer: '',
          notes: dayNotes || ''
        });
        break;
      
      case 'expense':
        record = await SupabaseService.addExpenseRecord({
          farm_id: parseInt(farmId),
          date: date,
          type: data.type || 'other',
          description: data.description || '',
          cost: parseFloat(data.cost || '0'),
          remarks: dayNotes || ''
        });
        break;
      
      case 'fertigation':
        record = await SupabaseService.addFertigationRecord({
          farm_id: parseInt(farmId),
          date: date,
          fertilizer: data.fertilizer || 'Unknown',
          dose: data.quantity ? `${data.quantity} kg/L` : 'As per requirement',
          purpose: 'Nutrient Application',
          area: dashboardData?.farm?.area || 0,
          notes: dayNotes || ''
        });
        break;
      
      case 'soil_test':
        record = await SupabaseService.addSoilTestRecord({
          farm_id: parseInt(farmId),
          date: date,
          parameters: {
            pH: parseFloat(data.ph || '7'),
            nitrogen: parseFloat(data.nitrogen || '0'),
            phosphorus: parseFloat(data.phosphorus || '0'),
            potassium: parseFloat(data.potassium || '0')
          },
          notes: dayNotes || ''
        });
        break;
    }

    return record;
  };

  const handleEditRecord = (record: any, recordType: string) => {
    setEditingRecord(record);
    setShowEditModal(true);
  };

  const handleSaveRecord = () => {
    setShowEditModal(false);
    setEditingRecord(null);
    loadDashboardData();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Farm Header */}
      {dashboardData?.farm && <FarmHeader 
        farm={dashboardData?.farm}
        loading={loading}
      />}

      {/* Farm Overview */}
      <FarmOverview
        loading={loading}
      />

      {/* Weather Card */}
      {dashboardData?.farm && (
        <div className="px-4 mt-6 mb-4">
          <SimpleWeatherCard farm={dashboardData.farm} />
        </div>
      )}

      {/* Phase 3A: AI-Powered Features */}
      {(dashboardData?.farm || process.env.NEXT_PUBLIC_BYPASS_AUTH) && (
        <div className="px-4 mb-6 space-y-4">
          {/* Comprehensive AI Insights */}
          <AIInsightsCarousel 
            farmId={parseInt(farmId)} 
            className="w-full"
          />
        </div>
      )}

      {/* Water Level Card */}
      {dashboardData?.farm && (
        <div className="px-4 mb-4">
          <RemainingWaterCard 
            farm={dashboardData.farm} 
            onCalculateClick={() => setShowWaterCalculationModal(true)}
          />
        </div>
      )}

      {/* Quick Actions */}
      <QuickActions
        onDataLogsClick={() => setShowDataLogsModal(true)}
      />

      {/* Activity Feed */}
      <ActivityFeed
        recentActivities={dashboardData?.recentActivities || []}
        pendingTasks={dashboardData?.pendingTasks || []}
        loading={loading}
        onCompleteTask={completeTask}
        onEditRecord={handleEditRecord}
        farmId={farmId}
      />

      {/* Unified Data Logs Modal */}
      <UnifiedDataLogsModal
        isOpen={showDataLogsModal}
        onClose={() => setShowDataLogsModal(false)}
        onSubmit={handleDataLogsSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Water Calculation Modal */}
      {dashboardData?.farm && (
        <WaterCalculationModal
          isOpen={showWaterCalculationModal}
          onClose={() => setShowWaterCalculationModal(false)}
          farm={dashboardData.farm}
          onCalculationComplete={loadDashboardData}
        />
      )}

      {/* Edit Record Modal */}
      {editingRecord && (
        <EditRecordModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingRecord(null);
          }}
          onSave={handleSaveRecord}
          record={editingRecord}
          recordType={editingRecord.type as 'irrigation' | 'spray' | 'harvest' | 'fertigation' | 'expense' | 'soil_test'}
        />
      )}
    </div>
  );
}