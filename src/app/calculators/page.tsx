"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calculator, 
  Droplets, 
  Leaf, 
  Beaker, 
  ArrowRight,
  ArrowLeft,
  CheckCircle
} from "lucide-react";
import { ETcCalculatorComponent } from "@/components/calculators/ETcCalculator";
import { LAICalculatorComponent } from "@/components/calculators/LAICalculator";
import { NutrientCalculatorComponent } from "@/components/calculators/NutrientCalculator";
import { SystemDischargeCalculatorComponent } from "@/components/calculators/SystemDischargeCalculator";

const calculatorCategories = [
  {
    title: "Irrigation & Water Use",
    description: "Calculate water needs and irrigation system requirements",
    icon: Droplets,
    calculators: [
      {
        id: "etc",
        title: "Water Needs Calculator",
        description: "Calculate daily water requirements for optimal irrigation",
        component: ETcCalculatorComponent
      },
      {
        id: "system-discharge",
        title: "System Flow Rate",
        description: "Check if your irrigation system delivers adequate water",
        component: SystemDischargeCalculatorComponent
      }
    ]
  },
  {
    title: "Crop & Growth Analysis",
    description: "Monitor vine development and leaf coverage",
    icon: Leaf,
    calculators: [
      {
        id: "lai",
        title: "Leaf Area Index",
        description: "Calculate leaf coverage and canopy development",
        component: LAICalculatorComponent
      }
    ]
  },
  {
    title: "Nutrition Management",
    description: "Calculate fertilizer requirements and nutrient planning",
    icon: Beaker,
    calculators: [
      {
        id: "nutrient",
        title: "Fertilizer Calculator",
        description: "NPK and micronutrient recommendations by growth stage",
        component: NutrientCalculatorComponent
      }
    ]
  }
];

export default function CalculatorsPage() {
  const [selectedCalculator, setSelectedCalculator] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>("Irrigation & Water Use");

  const handleCalculatorSelect = (calculatorId: string) => {
    setSelectedCalculator(calculatorId);
  };

  const handleBackToCalculators = () => {
    setSelectedCalculator(null);
  };

  // Get selected calculator details
  const selectedCalc = calculatorCategories
    .flatMap(cat => cat.calculators)
    .find(calc => calc.id === selectedCalculator);

  if (selectedCalculator && selectedCalc) {
    const CalculatorComponent = selectedCalc.component;
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
          <div className="px-4 py-3">
            <Button
              onClick={handleBackToCalculators}
              variant="ghost"
              size="sm"
              className="mb-2 text-green-600 hover:text-green-700 hover:bg-green-50 p-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Calculators
            </Button>
            

            {/* Calculator Header */}
            <div className="bg-green-600 text-white rounded-lg p-4">
              <h1 className="text-lg font-bold mb-1">{selectedCalc.title}</h1>
              <p className="text-green-100 text-sm">{selectedCalc.description}</p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <CalculatorComponent />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 z-10">
        <div className="p-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Calculators</h1>
          </div>
        </div>
      </div>

      {/* Calculator Categories */}
      <div className="p-4 space-y-3">
        {calculatorCategories.map((category) => (
          <Card key={category.title} className="overflow-hidden">
            <CardHeader 
              className="pb-3 cursor-pointer bg-green-50 border-b border-green-100"
              onClick={() => setExpandedCategory(expandedCategory === category.title ? null : category.title)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-600 rounded-lg">
                    <category.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-green-800">
                      {category.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-green-600 mt-1">
                      {category.description}
                    </CardDescription>
                  </div>
                </div>
                <ArrowRight className={`h-5 w-5 text-green-600 transition-transform ${
                  expandedCategory === category.title ? 'rotate-90' : ''
                }`} />
              </div>
            </CardHeader>

            {expandedCategory === category.title && (
              <CardContent className="p-0">
                <div className="space-y-2 p-4">
                  {category.calculators.map((calculator) => (
                    <div
                      key={calculator.id}
                      onClick={() => handleCalculatorSelect(calculator.id)}
                      className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-green-300 hover:bg-green-50 transition-all active:scale-95"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 text-sm mb-2">
                            {calculator.title}
                          </h3>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {calculator.description}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-green-600 ml-3 flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}

      </div>
    </div>
  );
}