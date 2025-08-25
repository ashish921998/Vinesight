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
// Removed ProtectedRoute - calculators work without authentication
import { ETcCalculatorComponent } from "@/components/calculators/ETcCalculator";
import { LAICalculatorComponent } from "@/components/calculators/LAICalculator";
import { NutrientCalculatorComponent } from "@/components/calculators/NutrientCalculator";
import { SystemDischargeCalculatorComponent } from "@/components/calculators/SystemDischargeCalculator";

const calculators = [
  {
    id: "etc",
    title: "Water Needs Calculator",
    description: "Calculate how much water your grapes need daily",
    icon: Droplets,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    component: ETcCalculatorComponent,
  },
  {
    id: "system-discharge",
    title: "System Flow Rate",
    description: "Check if your irrigation system delivers enough water",
    icon: Target,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    component: SystemDischargeCalculatorComponent,
  },
  {
    id: "lai",
    title: "Leaf Coverage Calculator",
    description: "Measure how well your vines cover the ground",
    icon: Leaf,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    component: LAICalculatorComponent,
  },
  {
    id: "nutrient",
    title: "Fertilizer Calculator",
    description: "Find out exactly how much fertilizer to apply",
    icon: Beaker,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    component: NutrientCalculatorComponent,
  },
];

export default function CalculatorsPage() {
  const [selectedCalculator, setSelectedCalculator] = useState<string | null>(null);

  const handleCalculatorSelect = (calculatorId: string) => {
    setSelectedCalculator(calculatorId);
  };

  const handleBackToCalculators = () => {
    setSelectedCalculator(null);
  };

  if (selectedCalculator) {
    const calculator = calculators.find((calc) => calc.id === selectedCalculator);
    if (!calculator) return null;

    const CalculatorComponent = calculator.component;
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <Button
              onClick={handleBackToCalculators}
              variant="ghost"
              className="mb-4 w-full sm:w-auto h-12 sm:h-10 px-6 sm:px-4 text-base sm:text-sm bg-white hover:bg-gray-50 border border-gray-200"
            >
              <ChevronRight className="mr-2 h-5 w-5 rotate-180" />
              Back to Calculators
            </Button>
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <calculator.icon className="h-8 w-8 sm:h-6 sm:w-6 text-green-600" />
                <h1 className="text-2xl sm:text-xl font-bold text-gray-900">
                  {calculator.title}
                </h1>
              </div>
              <p className="text-base sm:text-sm text-gray-600 max-w-2xl mx-auto">
                {calculator.description}
              </p>
            </div>
          </div>
          <CalculatorComponent />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Calculator className="h-10 w-10 sm:h-8 sm:w-8 text-green-600" />
            <h1 className="text-3xl sm:text-2xl font-bold text-gray-900">
              Farm Calculators
            </h1>
          </div>
          <p className="text-lg sm:text-base text-gray-600 max-w-2xl mx-auto">
            Get accurate calculations for your vineyard needs
          </p>
        </div>

        {/* Calculator Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-4 mb-8">
          {calculators.map((calculator) => (
            <Card
              key={calculator.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 hover:border-green-300 ${calculator.bgColor} ${calculator.borderColor}`}
              onClick={() => handleCalculatorSelect(calculator.id)}
            >
              <CardHeader className="p-6 sm:p-5 text-center">
                <div className="flex justify-center mb-4">
                  <div className={`p-4 sm:p-3 rounded-full ${calculator.bgColor} border-2 ${calculator.borderColor}`}>
                    <calculator.icon className={`h-10 w-10 sm:h-8 sm:w-8 ${calculator.color}`} />
                  </div>
                </div>
                <CardTitle className="text-xl sm:text-lg font-bold text-gray-900 mb-2">
                  {calculator.title}
                </CardTitle>
                <CardDescription className="text-base sm:text-sm text-gray-600 leading-relaxed">
                  {calculator.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 sm:p-5 pt-0">
                <div className="flex items-center justify-center text-green-600 font-medium text-sm">
                  <span>Get Started</span>
                  <ArrowRight className="ml-2 h-5 w-5 sm:h-4 sm:w-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Section */}
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-8 sm:p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-green-100 border-2 border-green-200">
                <Calculator className="h-8 w-8 sm:h-6 sm:w-6 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl sm:text-xl font-bold text-gray-900 mb-3">
              Science-Based Results
            </h2>
            <p className="text-base sm:text-sm text-gray-600 leading-relaxed max-w-2xl mx-auto">
              All calculations use internationally recognized agricultural formulas for accurate, reliable results.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}