'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowRight, Calculator, Droplets } from 'lucide-react'

interface SystemDischargeResult {
  result: number
  irrigationHours?: number
  plantsPerHectare?: number
}

export function SystemDischargeCalculatorComponent() {
  // Common inputs
  const [dbl, setDbl] = useState('') // Distance Between Lines (vine spacing)
  const [refillTankValue, setRefillTankValue] = useState('') // Direct input instead of calculating from MAD

  // System selection
  const [selectedSystem, setSelectedSystem] = useState<'1' | '2' | null>(null)

  // System 1 inputs
  const [dbp, setDbp] = useState('') // Distance Between Plant (row spacing)
  const [drippersPerPlant, setDrippersPerPlant] = useState('')
  const [dischargePerHour1, setDischargePerHour1] = useState('')
  const [plantsPerHectare, setPlantsPerHectare] = useState<number | null>(null)

  // System 2 inputs
  const [dbd, setDbd] = useState('') // Distance Between Dripper
  const [dischargePerHour2, setDischargePerHour2] = useState('')
  const [numberOfLines, setNumberOfLines] = useState('')

  const [result, setResult] = useState<SystemDischargeResult | null>(null)

  const calculateSystemDischarge1 = () => {
    if (dbl && dbp && drippersPerPlant && dischargePerHour1) {
      const dblNum = parseFloat(dbl)
      const dbpNum = parseFloat(dbp)
      const drippersNum = parseFloat(drippersPerPlant)
      const dischargeNum = parseFloat(dischargePerHour1)

      // Step 1: Calculate Plants per Hectare (P/H)
      const pH = 10000 / (dblNum * dbpNum)
      setPlantsPerHectare(pH)

      // Step 2: System Discharge calculation
      const systemDischarge = (pH * drippersNum * dischargeNum) / 10000

      // Calculate irrigation hours if refill tank value is provided
      const refillValue = parseFloat(refillTankValue)
      const irrigationHours = refillValue ? refillValue / systemDischarge : undefined

      setResult({
        result: systemDischarge,
        irrigationHours,
        plantsPerHectare: pH,
      })
    }
  }

  const calculateSystemDischarge2 = () => {
    if (dbl && dbd && dischargePerHour2 && numberOfLines) {
      const dblNum = parseFloat(dbl)
      const dbdNum = parseFloat(dbd)
      const dischargeNum = parseFloat(dischargePerHour2)
      const linesNum = parseFloat(numberOfLines)

      // Formula: ((100 / DBL) * (100/ DBD) * discharge per hour * number of lines) / 10000
      const systemDischarge = ((100 / dblNum) * (100 / dbdNum) * dischargeNum * linesNum) / 10000

      // Calculate irrigation hours if refill tank value is provided
      const refillValue = parseFloat(refillTankValue)
      const irrigationHours = refillValue ? refillValue / systemDischarge : undefined

      setResult({
        result: systemDischarge,
        irrigationHours,
      })
    }
  }

  const resetCalculator = () => {
    setDbl('')
    setRefillTankValue('')
    setSelectedSystem(null)
    setDbp('')
    setDrippersPerPlant('')
    setDischargePerHour1('')
    setPlantsPerHectare(null)
    setDbd('')
    setDischargePerHour2('')
    setNumberOfLines('')
    setResult(null)
  }

  return (
    <div className="space-y-4">
      {/* Common Inputs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-green-600" />
            System Parameters
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
              <Label htmlFor="refillTank">Refill Tank Value (optional)</Label>
              <Input
                id="refillTank"
                type="number"
                step="0.001"
                value={refillTankValue}
                onChange={(e) => setRefillTankValue(e.target.value)}
                placeholder="e.g., 0.024"
              />
              <p className="text-xs text-gray-500 mt-1">For irrigation hours calculation</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Selection */}
      {dbl && !selectedSystem && (
        <Card>
          <CardHeader>
            <CardTitle>Choose System Discharge Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => setSelectedSystem('1')}
                variant="outline"
                className="h-auto p-4 text-left"
              >
                <div>
                  <p className="font-medium">System Discharge 1</p>
                  <p className="text-sm text-gray-600">Using plants per hectare and drippers</p>
                </div>
              </Button>
              <Button
                onClick={() => setSelectedSystem('2')}
                variant="outline"
                className="h-auto p-4 text-left"
              >
                <div>
                  <p className="font-medium">System Discharge 2</p>
                  <p className="text-sm text-gray-600">Using dripper spacing</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Discharge 1 */}
      {selectedSystem === '1' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-green-700" />
              System Discharge 1
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="dbp">Distance Between Plant (DBP) - Row Spacing (m)</Label>
                <Input
                  id="dbp"
                  type="number"
                  step="0.1"
                  value={dbp}
                  onChange={(e) => setDbp(e.target.value)}
                  placeholder="e.g., 1.5"
                />
              </div>
              <div>
                <Label htmlFor="drippersPerPlant">Drippers per Plant</Label>
                <Input
                  id="drippersPerPlant"
                  type="number"
                  value={drippersPerPlant}
                  onChange={(e) => setDrippersPerPlant(e.target.value)}
                  placeholder="e.g., 4"
                />
              </div>
              <div>
                <Label htmlFor="dischargePerHour1">Discharge per Hour (liters)</Label>
                <Input
                  id="dischargePerHour1"
                  type="number"
                  step="0.1"
                  value={dischargePerHour1}
                  onChange={(e) => setDischargePerHour1(e.target.value)}
                  placeholder="e.g., 2.0"
                />
              </div>
            </div>

            <Button
              onClick={calculateSystemDischarge1}
              disabled={!dbp || !drippersPerPlant || !dischargePerHour1}
              className="w-full"
            >
              Calculate System Discharge 1
            </Button>

            {plantsPerHectare && (
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-2">
                  Plants per Hectare (P/H):{' '}
                  <span className="text-lg">{plantsPerHectare.toFixed(2)}</span>
                </p>
                <p className="text-xs text-green-700">
                  Formula: 10000 ÷ (DBL ({dbl}) × DBP ({dbp})) = {plantsPerHectare.toFixed(2)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* System Discharge 2 */}
      {selectedSystem === '2' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-green-500" />
              System Discharge 2
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="dbd">Distance Between Dripper (DBD) (m)</Label>
                <Input
                  id="dbd"
                  type="number"
                  step="0.1"
                  value={dbd}
                  onChange={(e) => setDbd(e.target.value)}
                  placeholder="e.g., 0.5"
                />
              </div>
              <div>
                <Label htmlFor="dischargePerHour2">Discharge per Hour (liters)</Label>
                <Input
                  id="dischargePerHour2"
                  type="number"
                  step="0.1"
                  value={dischargePerHour2}
                  onChange={(e) => setDischargePerHour2(e.target.value)}
                  placeholder="e.g., 2.0"
                />
              </div>
              <div>
                <Label htmlFor="numberOfLines2">Number of Lines</Label>
                <Input
                  id="numberOfLines2"
                  type="number"
                  value={numberOfLines}
                  onChange={(e) => setNumberOfLines(e.target.value)}
                  placeholder="e.g., 10"
                />
              </div>
            </div>

            <Button
              onClick={calculateSystemDischarge2}
              disabled={!dbd || !dischargePerHour2 || !numberOfLines}
              className="w-full"
            >
              Calculate System Discharge 2
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-600" />
              Calculation Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg space-y-3">
              <div>
                <p className="text-sm font-medium text-blue-800">
                  System Discharge Result:{' '}
                  <span className="text-lg">{result.result.toFixed(6)}</span>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {selectedSystem === '1'
                    ? 'Formula: (P/H × Drippers per plant × Discharge per hour) ÷ 10000'
                    : 'Formula: ((100 ÷ DBL) × (100 ÷ DBD) × Discharge per hour × Number of lines) ÷ 10000'}
                </p>
              </div>

              {result.irrigationHours && (
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Irrigation Hours:{' '}
                    <span className="text-lg">{result.irrigationHours.toFixed(2)}</span> hours
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Formula: Refill Tank Value ({refillTankValue}) ÷ System Discharge (
                    {result.result.toFixed(6)})
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reset Button */}
      {(dbl || result) && (
        <div className="text-center">
          <Button onClick={resetCalculator} variant="outline">
            Start New Calculation
          </Button>
        </div>
      )}
    </div>
  )
}
