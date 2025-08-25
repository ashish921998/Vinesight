"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DiseasePredictionComponent } from "@/components/calculators/DiseasePrediction";

export default function DiseasePredictionPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <DiseasePredictionComponent />
      </div>
    </ProtectedRoute>
  );
}