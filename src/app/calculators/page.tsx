'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight, Beaker, Calculator, Droplets, Leaf } from 'lucide-react'
import { ETcCalculatorComponent } from '@/components/calculators/ETcCalculator'
import { LAICalculatorComponent } from '@/components/calculators/LAICalculator'
import { NutrientCalculatorComponent } from '@/components/calculators/NutrientCalculator'
import { SystemDischargeCalculatorComponent } from '@/components/calculators/NewSystemDischargeCalculator'
import { MADCalculatorComponent } from '@/components/calculators/MADCalculator'

const calculatorCategories = [
  {
    title: 'Irrigation & Water Use',
    description: 'Calculate water needs and irrigation system requirements.',
    icon: Droplets,
    calculators: [
      {
        id: 'etc',
        title: 'Water Needs Calculator',
        description: 'Daily water requirements for optimal irrigation.',
        component: ETcCalculatorComponent
      },
      {
        id: 'mad',
        title: 'MAD (Maximum Allowable Deficit)',
        description: 'Maximum allowable deficit and refill tank requirements.',
        component: MADCalculatorComponent
      },
      {
        id: 'system-discharge',
        title: 'System Discharge Calculator',
        description: 'System discharge rates for irrigation planning.',
        component: SystemDischargeCalculatorComponent
      }
    ]
  },
  {
    title: 'Crop & Growth Analysis',
    description: 'Monitor vine development and leaf coverage.',
    icon: Leaf,
    calculators: [
      {
        id: 'lai',
        title: 'Leaf Area Index',
        description: 'Leaf coverage and canopy development.',
        component: LAICalculatorComponent
      }
    ]
  },
  {
    title: 'Nutrition Management',
    description: 'Calculate fertilizer requirements and nutrient planning.',
    icon: Beaker,
    calculators: [
      {
        id: 'nutrient',
        title: 'Fertilizer Calculator',
        description: 'NPK and micronutrient recommendations by growth stage.',
        component: NutrientCalculatorComponent
      }
    ]
  }
]

export default function CalculatorsPage() {
  const [selectedCalculator, setSelectedCalculator] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('All')

  const handleCalculatorSelect = (calculatorId: string) => {
    setSelectedCalculator(calculatorId)
  }

  const totalCalculators = calculatorCategories.reduce(
    (total, category) => total + category.calculators.length,
    0
  )

  const allCalculators = calculatorCategories.flatMap((category) =>
    category.calculators.map((calculator) => ({
      ...calculator,
      categoryTitle: category.title,
      categoryDescription: category.description,
      categoryIcon: category.icon
    }))
  )

  const selectedCalc = allCalculators.find((calculator) => calculator.id === selectedCalculator)

  const selectedCategory = calculatorCategories.find((category) =>
    category.calculators.some((calculator) => calculator.id === selectedCalculator)
  )

  const categoryOptions = ['All', ...calculatorCategories.map((category) => category.title)]

  const visibleCalculators =
    activeCategory === 'All'
      ? allCalculators
      : allCalculators.filter((calculator) => calculator.categoryTitle === activeCategory)

  if (selectedCalculator && selectedCalc) {
    const CalculatorComponent = selectedCalc.component
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="sticky top-0 z-20 border-b border-border bg-background">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <button
              type="button"
              onClick={() => setSelectedCalculator(null)}
              className="inline-flex h-12 items-center gap-2 rounded-lg border border-border bg-card px-4 text-meta font-medium text-accent transition hover:border-accent/40 hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4 text-accent" />
              Back
            </button>
            <span className="text-meta text-muted-foreground">Calculators</span>
          </div>
        </div>

        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="text-meta text-muted-foreground">
                  {selectedCategory?.title ?? 'Calculator'}
                </p>
                <h1 className="text-h1 text-accent">{selectedCalc.title}</h1>
                <p className="text-body text-muted-foreground">{selectedCalc.description}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-accent/10">
                <Calculator className="h-5 w-5 text-accent" />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <CalculatorComponent />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4 sm:px-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-accent/10">
            <Calculator className="h-6 w-6 text-accent" />
          </div>
          <div className="space-y-1">
            <h1 className="text-h1 text-accent">Calculators</h1>
            <p className="text-meta text-muted-foreground">
              {totalCalculators} tools across {calculatorCategories.length} categories.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
        <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2 scrollbar-hide sm:flex-wrap">
          {categoryOptions.map((category) => {
            const isActive = activeCategory === category
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                aria-pressed={isActive}
                className={`inline-flex h-12 shrink-0 items-center rounded-full border px-4 text-meta font-medium transition ${
                  isActive
                    ? 'border-accent bg-accent text-accent-foreground'
                    : 'border-border bg-card text-accent hover:border-accent/40 hover:bg-accent/10'
                }`}
              >
                {category}
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {visibleCalculators.map((calculator) => {
            const displayTitle = calculator.title.replace(/\s*Calculator$/i, '')
            return (
              <button
                key={calculator.id}
                type="button"
                onClick={() => handleCalculatorSelect(calculator.id)}
                className="group flex min-h-12 flex-col overflow-hidden rounded-3xl border border-border bg-card text-left shadow-sm transition hover:border-accent/40 hover:bg-accent/5 hover:shadow-md"
              >
                <div className="h-1 w-full bg-accent/60" />
                <div className="flex flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-6">
                  <h2 className="text-body font-semibold text-accent">{displayTitle}</h2>
                  <p className="hidden text-body text-muted-foreground lg:block">
                    {calculator.description}
                  </p>
                  <div className="mt-auto flex justify-end">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent transition group-hover:border-accent/40 group-hover:bg-accent/20">
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
