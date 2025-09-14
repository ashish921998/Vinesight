'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowRight, Calculator, Droplets } from 'lucide-react'

interface MADResult {
  mad: number
  dbl: number // Store DBL for System Discharge calculations
}

export function MADCalculatorComponent() {
  // Step 1: MAD Calculator
  const [dbl, setDbl] = useState('') // Distance Between Lines (vine spacing)
  const [rootDepth, setRootDepth] = useState('')
  const [rootWidth, setRootWidth] = useState('')
  const [waterRetention, setWaterRetention] = useState('')
  const [madResult, setMadResult] = useState<MADResult | null>(null)

  // Step 2: Refill Tank Calculator
  const [refillSpan, setRefillSpan] = useState('')
  const [refillTankResult, setRefillTankResult] = useState<number | null>(null)

  const calculateMAD = () => {
    const dblNum = parseFloat(dbl)
    const rootDepthNum = parseFloat(rootDepth)
    const rootWidthNum = parseFloat(rootWidth)
    const waterRetentionNum = parseFloat(waterRetention)

    if (dblNum && rootDepthNum && rootWidthNum && waterRetentionNum) {
      // Formula: (100/(DBL) * Root Depth * Root Width * Water Retention * 100) / 10000
      const result =
        ((100 / dblNum) * rootDepthNum * rootWidthNum * waterRetentionNum * 100) / 10000
      setMadResult({ mad: result, dbl: dblNum })
    }
  }

  const calculateRefillTank = () => {
    if (madResult && refillSpan) {
      const refillSpanValue = parseFloat(refillSpan)
      const result = madResult.mad * refillSpanValue
      setRefillTankResult(result)
    }
  }

  const resetCalculator = () => {
    setDbl('')
    setRootDepth('')
    setRootWidth('')
    setWaterRetention('')
    setMadResult(null)
    setRefillSpan('')
    setRefillTankResult(null)
  }

  return (
    <div className="space-y-4">
      {/* Step 1: MAD Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-green-600" />
            Step 1: MAD (Maximum Allowable Deficit) Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dbl">Distance Between Lines (DBL) - Vine Spacing (m)</Label>
              <Input
                id="dbl"
                type="number"
                step="0.1"
                value={dbl}
                onChange={(e) => setDbl(e.target.value)}
                placeholder="e.g., 3.0"
              />
            </div>
            <div>
              <Label htmlFor="rootDepth">Root Depth (m)</Label>
              <Input
                id="rootDepth"
                type="number"
                step="0.1"
                value={rootDepth}
                onChange={(e) => setRootDepth(e.target.value)}
                placeholder="e.g., 0.6"
              />
            </div>
            <div>
              <Label htmlFor="rootWidth">Root Width (m)</Label>
              <Input
                id="rootWidth"
                type="number"
                step="0.1"
                value={rootWidth}
                onChange={(e) => setRootWidth(e.target.value)}
                placeholder="e.g., 1.5"
              />
            </div>
            <div>
              <Label htmlFor="waterRetention">Water Retention (%)</Label>
              <Input
                id="waterRetention"
                type="number"
                step="0.1"
                value={waterRetention}
                onChange={(e) => setWaterRetention(e.target.value)}
                placeholder="e.g., 15"
              />
            </div>
          </div>

          <Button
            onClick={calculateMAD}
            disabled={!dbl || !rootDepth || !rootWidth || !waterRetention}
            className="w-full"
          >
            Calculate MAD
          </Button>

          {madResult && (
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-green-800">
                MAD Result: <span className="text-lg">{madResult.mad.toFixed(4)}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Refill Tank Calculator */}
      {madResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-green-600" />
              Step 2: Refill Tank Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="refillSpan">Refill Span</Label>
              <Select value={refillSpan} onValueChange={setRefillSpan}>
                <SelectTrigger>
                  <SelectValue placeholder="Select growth period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.2">Heavy Growth Period 50% (0.2)</SelectItem>
                  <SelectItem value="0.3">Growth Period 40% (0.3)</SelectItem>
                  <SelectItem value="0.4">Controlled Stress 30% (0.4)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={calculateRefillTank} disabled={!refillSpan} className="w-full">
              Calculate Refill Tank
            </Button>

            {refillTankResult && (
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-green-800">
                  Refill Tank Result: <span className="text-lg">{refillTankResult.toFixed(4)}</span>
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Formula: MAD ({madResult.mad.toFixed(4)}) × Refill Span ({refillSpan})
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reset Button */}
      {(madResult || refillTankResult) && (
        <div className="text-center">
          <Button onClick={resetCalculator} variant="outline">
            Start New Calculation
          </Button>
        </div>
      )}
    </div>
  )
}
