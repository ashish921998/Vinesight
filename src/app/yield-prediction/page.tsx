"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { YieldPredictionComponent } from "@/components/calculators/YieldPrediction";

export default function YieldPredictionPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <YieldPredictionComponent />
      </div>
    </ProtectedRoute>
  );
}