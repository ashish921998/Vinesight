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
  Info,
  Star
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
      title: "ETc Calculator (Advanced)",
      description: "Scientific evapotranspiration calculator using Penman-Monteith equation with grape-specific crop coefficients",
      icon: Droplets,
      formula: "ETc = ETo × Kc (Penman-Monteith based)",
      inputs: ["Weather Data", "Growth Stage", "Location", "Irrigation Method"],
      status: "advanced",
      featured: true,
      color: "border-blue-200 bg-blue-50"
    },
    {
      id: "discharge",
      title: "System Discharge Calculator",
      description: "Calculate irrigation system discharge and flow rates",
      icon: Target,
      formula: "Based on system specifications",
      inputs: ["Emitter Flow Rate", "Number of Emitters", "System Pressure"],
      status: "advanced",
      featured: true,
      color: "border-orange-200 bg-orange-50"
    },
    {
      id: "lai",
      title: "Leaf Area Index (LAI) Calculator",
      description: "Calculate leaf area index for canopy management",
      icon: Leaf,
      formula: "LAI = Total Leaf Area / Ground Area",
      inputs: ["Leaves per Shoot", "Shoots per Vine", "Vine Spacing", "Row Spacing"],
      status: "advanced",
      featured: true,
      color: "border-green-200 bg-green-50"
    },
    {
      id: "nutrients",
      title: "Nutrient Calculator",
      description: "Calculate fertilizer requirements for different growth stages",
      icon: Beaker,
      formula: "Based on yield targets and soil analysis",
      inputs: ["Target Yield", "Soil Test Results", "Growth Stage", "Previous Applications"],
      status: "advanced",
      featured: true,
      color: "border-purple-200 bg-purple-50"
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      advanced: { variant: 'default' as const, text: 'ADVANCED', color: 'bg-blue-600' },
      coming_soon: { variant: 'secondary' as const, text: 'COMING SOON', color: 'bg-gray-500' }
    };
    
    const config = variants[status as keyof typeof variants] || variants.coming_soon;
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.text}
      </Badge>
    );
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto">
        <div className="mb-6 sm:mb-8 px-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-2">
            <Calculator className="h-6 w-6 sm:h-8 sm:w-8" />
            Scientific Calculators
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Advanced agricultural calculations for precision farming and irrigation management
          </p>
        </div>

        {/* Calculator Selection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 px-2">
          {calculators.map((calc) => {
            const Icon = calc.icon;
            const isActive = activeCalculator === calc.id;
            const isAvailable = calc.status === 'advanced';
            
            return (
              <Card 
                key={calc.id} 
                className={`hover:shadow-lg transition-all duration-200 cursor-pointer ${
                  isActive ? 'ring-2 ring-primary shadow-lg' : ''
                } ${calc.color || 'border-gray-200'} ${
                  !isAvailable ? 'opacity-75' : ''
                }`}
                onClick={() => isAvailable && setActiveCalculator(isActive ? null : calc.id)}
              >
                <CardHeader className="pb-3 sm:pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${calc.status === 'advanced' ? 'text-blue-600' : 'text-gray-500'}`} />
                        {calc.featured && (
                          <Star className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-lg flex items-center gap-2 leading-tight">
                          {calc.title}
                          {calc.featured && <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
                        </CardTitle>
                        <CardDescription className="mt-1 text-sm leading-relaxed">{calc.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(calc.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-2 text-sm">
                      <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="text-muted-foreground font-medium">Formula: </span>
                        <span className="text-foreground">{calc.formula}</span>
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground font-medium">Required Inputs: </span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {calc.inputs.map((input, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {input}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant={isActive ? "default" : "outline"} 
                    className="w-full h-10 sm:h-11"
                    disabled={!isAvailable}
                  >
                    {!isAvailable ? "Coming Soon" : isActive ? "Close Calculator" : "Open Calculator"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Active Calculator */}
        {activeCalculator === "etc" && (
          <div className="px-2">
            <ETcCalculatorComponent />
          </div>
        )}
        
        {activeCalculator === "discharge" && (
          <div className="px-2">
            <SystemDischargeCalculatorComponent />
          </div>
        )}
        
        {activeCalculator === "lai" && (
          <div className="px-2">
            <LAICalculatorComponent />
          </div>
        )}
        
        {activeCalculator === "nutrients" && (
          <div className="px-2">
            <NutrientCalculatorComponent />
          </div>
        )}

        {/* Info Section */}
        <Card className="mt-6 sm:mt-8 border-green-200 bg-green-50 mx-2">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-green-800 text-lg sm:text-xl">Scientific Precision</CardTitle>
            <CardDescription className="text-green-700 text-sm sm:text-base">
              Our calculators are based on internationally recognized agricultural formulas and research
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-green-800">
              <div>
                <h4 className="font-semibold mb-2">ETc Calculator Features:</h4>
                <ul className="space-y-1 text-green-700">
                  <li>• FAO Penman-Monteith equation</li>
                  <li>• Grape-specific crop coefficients (Kc)</li>
                  <li>• Growth stage optimization</li>
                  <li>• Weather-based adjustments</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Data Confidence:</h4>
                <ul className="space-y-1 text-green-700">
                  <li>• Real-time calculation validation</li>
                  <li>• Confidence scoring system</li>
                  <li>• Irrigation recommendations</li>
                  <li>• Historical data tracking</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}