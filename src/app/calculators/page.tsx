'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calculator, Droplets, Leaf, Beaker, ArrowRight } from 'lucide-react'
import { ETcCalculatorComponent } from '@/components/calculators/ETcCalculator'
import { LAICalculatorComponent } from '@/components/calculators/LAICalculator'
import { NutrientCalculatorComponent } from '@/components/calculators/NutrientCalculator'
import { SystemDischargeCalculatorComponent } from '@/components/calculators/NewSystemDischargeCalculator'
import { MADCalculatorComponent } from '@/components/calculators/MADCalculator'

const calculatorCategories = [
  {
    title: 'Irrigation & Water Use',
    description: 'Calculate water needs and irrigation system requirements',
    icon: Droplets,
    calculators: [
      {
        id: 'etc',
        title: 'Water Needs Calculator',
        description: 'Calculate daily water requirements for optimal irrigation',
        component: ETcCalculatorComponent,
      },
      {
        id: 'mad',
        title: 'MAD (Maximum Allowable Deficit)',
        description: 'Calculate maximum allowable water deficit and refill tank requirements',
        component: MADCalculatorComponent,
      },
      {
        id: 'system-discharge',
        title: 'System Discharge Calculator',
        description: 'Calculate system discharge rates for irrigation planning',
        component: SystemDischargeCalculatorComponent,
      },
    ],
  },
  {
    title: 'Crop & Growth Analysis',
    description: 'Monitor vine development and leaf coverage',
    icon: Leaf,
    calculators: [
      {
        id: 'lai',
        title: 'Leaf Area Index',
        description: 'Calculate leaf coverage and canopy development',
        component: LAICalculatorComponent,
      },
    ],
  },
  {
    title: 'Nutrition Management',
    description: 'Calculate fertilizer requirements and nutrient planning',
    icon: Beaker,
    calculators: [
      {
        id: 'nutrient',
        title: 'Fertilizer Calculator',
        description: 'NPK and micronutrient recommendations by growth stage',
        component: NutrientCalculatorComponent,
      },
    ],
  },
]

export default function CalculatorsPage() {
  // const pathname = usePathname();
  const [selectedCalculator, setSelectedCalculator] = useState<string | null>(null)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  // Reset calculator selection when navigating back to main calculators page
  // useEffect(() => {
  //   if (pathname === '/calculators') {
  //     setSelectedCalculator(null);
  //     setExpandedCategory(null);
  //   }
  // }, [pathname]);
  const handleCalculatorSelect = (calculatorId: string) => {
    setSelectedCalculator(calculatorId)
  }

  // Get selected calculator details
  const selectedCalc = calculatorCategories
    .flatMap((cat) => cat.calculators)
    .find((calc) => calc.id === selectedCalculator)

  if (selectedCalculator && selectedCalc) {
    const CalculatorComponent = selectedCalc.component
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-300 z-10 shadow-sm">
          <div className="px-6 py-4">
            {/* Calculator Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl p-6 shadow-lg">
              <h1 className="text-xl font-bold mb-2">{selectedCalc.title}</h1>
              <p className="text-green-100 text-sm leading-relaxed">{selectedCalc.description}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <CalculatorComponent />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-300 z-10 shadow-sm">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600 rounded-xl">
              <Calculator className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Farm Calculators</h1>
              <p className="text-sm text-gray-600 mt-1">Scientific tools for vineyard management</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calculator Categories */}
      <div className="p-6 space-y-4">
        {calculatorCategories.map((category) => (
          <Card key={category.title} className="overflow-hidden border-gray-200">
            <CardHeader
              className="pb-4 cursor-pointer bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200 touch-target-large"
              onClick={() =>
                setExpandedCategory(expandedCategory === category.title ? null : category.title)
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-600 rounded-xl shadow-sm">
                    <category.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-green-800">
                      {category.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-green-700 mt-1 font-medium">
                      {category.description}
                    </CardDescription>
                  </div>
                </div>
                <ArrowRight
                  className={`h-6 w-6 text-green-600 transition-transform duration-200 ${
                    expandedCategory === category.title ? 'rotate-90' : ''
                  }`}
                />
              </div>
            </CardHeader>

            {expandedCategory === category.title && (
              <CardContent className="p-0">
                <div className="space-y-3 p-6">
                  {category.calculators.map((calculator) => (
                    <div
                      key={calculator.id}
                      onClick={() => handleCalculatorSelect(calculator.id)}
                      className="bg-white border-2 border-gray-200 rounded-xl p-5 cursor-pointer hover:border-green-400 hover:bg-green-50 transition-all active:scale-98 touch-target-large shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-base mb-2">
                            {calculator.title}
                          </h3>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {calculator.description}
                          </p>
                        </div>
                        <div className="p-2 bg-green-100 rounded-lg ml-4 flex-shrink-0">
                          <ArrowRight className="h-5 w-5 text-green-600" />
                        </div>
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
  )
}
