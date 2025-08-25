"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  Droplets, 
  Leaf, 
  Beaker, 
  Target,
  ArrowRight,
  ChevronRight
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ETcCalculatorComponent } from "@/components/calculators/ETcCalculator";
import { LAICalculatorComponent } from "@/components/calculators/LAICalculator";
import { NutrientCalculatorComponent } from "@/components/calculators/NutrientCalculator";
import { SystemDischargeCalculatorComponent } from "@/components/calculators/SystemDischargeCalculator";

export default function CalculatorsPage() {
  const [activeCalculator, setActiveCalculator] = useState<string | null>(null);

  const calculators = [
    {
      id: "etc",
      title: "Water Needs Calculator",
      shortTitle: "Water",
      description: "Calculate how much water your grapes need daily",
      simpleDesc: "Daily water requirement",
      icon: Droplets,
      bgGradient: "from-green-500 to-green-600"
    },
    {
      id: "discharge",
      title: "System Flow Rate",
      shortTitle: "Flow Rate", 
      description: "Check if your irrigation system delivers enough water",
      simpleDesc: "System capacity check",
      icon: Target,
      bgGradient: "from-green-400 to-green-500"
    },
    {
      id: "lai",
      title: "Leaf Coverage Calculator",
      shortTitle: "Leaf Cover",
      description: "Measure how well your vines cover the ground",
      simpleDesc: "Canopy density check",
      icon: Leaf,
      bgGradient: "from-green-600 to-green-700"
    },
    {
      id: "nutrients",
      title: "Fertilizer Calculator",
      shortTitle: "Fertilizer",
      description: "Find out exactly how much fertilizer to apply",
      simpleDesc: "Nutrient requirements",
      icon: Beaker,
      bgGradient: "from-green-500 to-green-600"
    }
  ];

  return (
    <ProtectedRoute>
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-6 px-3">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Farm Calculators</h1>
          <p className="text-gray-600">
            Get accurate calculations for your vineyard needs
          </p>
        </div>

        {/* No Active Calculator - Show Grid */}
        {!activeCalculator && (
          <div className="px-3 space-y-3">
            {calculators.map((calc) => {
              const Icon = calc.icon;
              
              return (
                <Card 
                  key={calc.id} 
                  className="hover:shadow-md transition-all duration-200 cursor-pointer border-0 shadow-sm"
                  onClick={() => setActiveCalculator(calc.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className={`
                        w-14 h-14 rounded-2xl bg-gradient-to-br ${calc.bgGradient} 
                        flex items-center justify-center flex-shrink-0
                      `}>
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                          {calc.title}
                        </h3>
                        <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                          {calc.description}
                        </p>
                      </div>
                      
                      {/* Arrow */}
                      <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Active Calculator View */}
        {activeCalculator && (
          <div className="px-3">
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={() => setActiveCalculator(null)}
              className="mb-4 text-gray-600 hover:text-gray-900 p-0 h-auto"
            >
              <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
              Back to Calculators
            </Button>
            
            {/* Calculator Content */}
            {activeCalculator === "etc" && <ETcCalculatorComponent />}
            {activeCalculator === "discharge" && <SystemDischargeCalculatorComponent />}
            {activeCalculator === "lai" && <LAICalculatorComponent />}
            {activeCalculator === "nutrients" && <NutrientCalculatorComponent />}
          </div>
        )}

        {/* Bottom Tip - Only show when no calculator is active */}
        {!activeCalculator && (
          <div className="mx-3 mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-start gap-3">
              <Calculator className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-green-800 mb-1">Science-Based Results</h4>
                <p className="text-green-700 text-sm leading-relaxed">
                  All calculations use internationally recognized agricultural formulas for accurate, reliable results.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}