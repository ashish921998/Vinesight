"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { SupabaseService } from "@/lib/supabase-service";
import { PhotoService } from "@/lib/photo-service";
import { type Farm } from "@/lib/supabase";

// Import our new components
import { FarmHeader } from "@/components/farm-details/FarmHeader";
import { FarmOverview } from "@/components/farm-details/FarmOverview";
import { QuickActions } from "@/components/farm-details/QuickActions";
import { ActivityFeed } from "@/components/farm-details/ActivityFeed";
import { WeatherCard } from "@/components/farm-details/WeatherCard";
import { RemainingWaterCard } from "@/components/farm-details/RemainingWaterCard";
import { IrrigationForm } from "@/components/farm-details/forms/IrrigationForm";
import { SprayForm } from "@/components/farm-details/forms/SprayForm";
import { HarvestForm } from "@/components/farm-details/forms/HarvestForm";
import { FertigationForm } from "@/components/farm-details/forms/FertigationForm";
import { ExpenseForm } from "@/components/farm-details/forms/ExpenseForm";
import { SoilTestForm } from "@/components/farm-details/forms/SoilTestForm";
import { WaterCalculationModal } from "@/components/farm-details/WaterCalculationModal";
import { EditRecordModal } from "@/components/journal/EditRecordModal";

interface DashboardData {
  farm: Farm | null;
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

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states
  const [showIrrigationModal, setShowIrrigationModal] = useState(false);
  const [showSprayModal, setShowSprayModal] = useState(false);
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  const [showFertigationModal, setShowFertigationModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSoilTestModal, setShowSoilTestModal] = useState(false);
  const [showWaterCalculationModal, setShowWaterCalculationModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);

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

  const completeTask = async (taskId: number) => {
    try {
      await SupabaseService.completeTask(taskId);
      await loadDashboardData();
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  const handleIrrigationSubmit = async (data: {
    date: string;
    duration: string;
    notes: string;
    photos: File[];
  }) => {
    setIsSubmitting(true);
    try {
      const record = await SupabaseService.addIrrigationRecord({
        farm_id: parseInt(farmId),
        date: data.date,
        duration: parseFloat(data.duration),
        area: dashboardData?.farm?.area || 0,
        growth_stage: "Active",
        moisture_status: "Good",
        system_discharge: dashboardData?.farm?.system_discharge || 100,
        notes: data.notes
      });
      
      // Upload photos if any
      if (record.id) {
        for (const photo of data.photos) {
          try {
            await PhotoService.uploadPhoto(photo, 'irrigation', record.id);
          } catch (photoError) {
            console.error("Error uploading photo:", photoError);
          }
        }
      }
      
      setShowIrrigationModal(false);
      await loadDashboardData();
    } catch (error) {
      console.error("Error logging irrigation:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSpraySubmit = async (data: {
    date: string;
    product: string;
    notes: string;
    photos: File[];
  }) => {
    setIsSubmitting(true);
    try {
      const record = await SupabaseService.addSprayRecord({
        farm_id: parseInt(farmId),
        date: data.date,
        pest_disease: "General",
        chemical: data.product,
        dose: "As per label",
        area: dashboardData?.farm?.area || 0,
        weather: "Clear",
        operator: "Farm Owner",
        notes: data.notes
      });
      
      // Upload photos if any
      if (record.id) {
        for (const photo of data.photos) {
          try {
            await PhotoService.uploadPhoto(photo, 'spray', record.id);
          } catch (photoError) {
            console.error("Error uploading photo:", photoError);
          }
        }
      }
      
      setShowSprayModal(false);
      await loadDashboardData();
    } catch (error) {
      console.error("Error logging spray:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHarvestSubmit = async (data: {
    date: string;
    quantity: string;
    quality: string;
    price?: string;
    buyer?: string;
    notes: string;
    photos: File[];
  }) => {
    setIsSubmitting(true);
    try {
      const record = await SupabaseService.addHarvestRecord({
        farm_id: parseInt(farmId),
        date: data.date,
        quantity: parseFloat(data.quantity),
        grade: data.quality,
        price: data.price ? parseFloat(data.price) : undefined,
        buyer: data.buyer || undefined,
        notes: data.notes
      });
      
      // Upload photos if any
      if (record.id) {
        for (const photo of data.photos) {
          try {
            await PhotoService.uploadPhoto(photo, 'harvest', record.id);
          } catch (photoError) {
            console.error("Error uploading photo:", photoError);
          }
        }
      }
      
      setShowHarvestModal(false);
      await loadDashboardData();
    } catch (error) {
      console.error("Error logging harvest:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/farms');
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
      <FarmHeader 
        farm={dashboardData?.farm || null}
        loading={loading}
        onBack={handleBack}
      />

      {/* Farm Overview */}
      <FarmOverview 
        dashboardData={dashboardData}
        loading={loading}
      />

      {/* Weather and Water Cards */}
      {dashboardData?.farm && (
        <div className="px-4 mb-4 space-y-4">
          <WeatherCard farm={dashboardData.farm} />
          <RemainingWaterCard 
            farm={dashboardData.farm} 
            onCalculateClick={() => setShowWaterCalculationModal(true)}
          />
        </div>
      )}

      {/* Quick Actions */}
      <QuickActions
        onIrrigationClick={() => setShowIrrigationModal(true)}
        onSprayClick={() => setShowSprayModal(true)}
        onHarvestClick={() => setShowHarvestModal(true)}
        onExpenseClick={() => setShowExpenseModal(true)}
        onFertigationClick={() => setShowFertigationModal(true)}
        onSoilTestClick={() => setShowSoilTestModal(true)}
      />

      {/* Activity Feed */}
      <ActivityFeed
        recentActivities={dashboardData?.recentActivities || []}
        pendingTasks={dashboardData?.pendingTasks || []}
        loading={loading}
        onCompleteTask={completeTask}
        onEditRecord={handleEditRecord}
      />

      {/* Data Entry Forms */}
      <IrrigationForm
        isOpen={showIrrigationModal}
        onClose={() => setShowIrrigationModal(false)}
        onSubmit={handleIrrigationSubmit}
        isSubmitting={isSubmitting}
      />

      <SprayForm
        isOpen={showSprayModal}
        onClose={() => setShowSprayModal(false)}
        onSubmit={handleSpraySubmit}
        isSubmitting={isSubmitting}
      />

      <HarvestForm
        isOpen={showHarvestModal}
        onClose={() => setShowHarvestModal(false)}
        onSubmit={handleHarvestSubmit}
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
          recordType={editingRecord.type as 'irrigation' | 'spray' | 'harvest'}
        />
      )}

      {/* Fertigation Form */}
      <FertigationForm
        isOpen={showFertigationModal}
        onClose={() => setShowFertigationModal(false)}
        onSubmit={async (data) => {
          // TODO: Implement fertigation submission
          setShowFertigationModal(false);
          await loadDashboardData();
        }}
        isSubmitting={isSubmitting}
      />

      {/* Expense Form */}
      <ExpenseForm
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onSubmit={async (data) => {
          // TODO: Implement expense submission
          setShowExpenseModal(false);
          await loadDashboardData();
        }}
        isSubmitting={isSubmitting}
      />

      {/* Soil Test Form */}
      <SoilTestForm
        isOpen={showSoilTestModal}
        onClose={() => setShowSoilTestModal(false)}
        onSubmit={async (data) => {
          // TODO: Implement soil test submission
          setShowSoilTestModal(false);
          await loadDashboardData();
        }}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}