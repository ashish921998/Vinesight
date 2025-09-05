"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Calculator, Droplets } from 'lucide-react';

interface MADResult {
  mad: number;
  dbl: number; // Store DBL for System Discharge calculations
}

export function MADCalculatorComponent() {
  // Step 1: MAD Calculator
  const [dbl, setDbl] = useState(''); // Distance Between Lines (vine spacing)
  const [rootDepth, setRootDepth] = useState('');
  const [rootWidth, setRootWidth] = useState('');
  const [waterRetention, setWaterRetention] = useState('');
  const [madResult, setMadResult] = useState<MADResult | null>(null);
  
  // Step 2: Refill Tank Calculator
  const [refillSpan, setRefillSpan] = useState('');
  const [refillTankResult, setRefillTankResult] = useState<number | null>(null);
  
  // Step 3: System Discharge Calculator
  const [selectedSystemDischarge, setSelectedSystemDischarge] = useState<'1' | '2' | null>(null);
  
  // System Discharge 1 inputs
  const [dbp, setDbp] = useState(''); // Distance Between Plant (row spacing)
  const [drippersPerPlant, setDrippersPerPlant] = useState('');
  const [dischargePerHour1, setDischargePerHour1] = useState('');
  const [plantsPerAcre, setPlantsPerHectare] = useState<number | null>(null);
  
  // System Discharge 2 inputs
  const [dbd, setDbd] = useState(''); // Distance Between Dripper
  const [dischargePerHour2, setDischargePerHour2] = useState('');
  
  // Number of lines (common for both system discharge calculators)
  const [numberOfLines, setNumberOfLines] = useState('');
  
  const [finalResult, setFinalResult] = useState<number | null>(null);

  const calculateMAD = () => {
    const dblNum = parseFloat(dbl);
    const rootDepthNum = parseFloat(rootDepth);
    const rootWidthNum = parseFloat(rootWidth);
    const waterRetentionNum = parseFloat(waterRetention);

    if (dblNum && rootDepthNum && rootWidthNum && waterRetentionNum) {
      // Formula: (100/(DBL) * Root Depth * Root Width * Water Retention * 100) / 10000
      const result = (100 / dblNum * rootDepthNum * rootWidthNum * waterRetentionNum * 100) / 10000;
      setMadResult({ mad: result, dbl: dblNum });
    }
  };

  const calculateRefillTank = () => {
    if (madResult && refillSpan) {
      const refillSpanValue = parseFloat(refillSpan);
      const result = madResult.mad * refillSpanValue;
      setRefillTankResult(result);
    }
  };

  const calculateSystemDischarge1 = () => {
    if (madResult && dbp && drippersPerPlant && dischargePerHour1) {
      const dbpNum = parseFloat(dbp);
      const drippersNum = parseFloat(drippersPerPlant);
      const dischargeNum = parseFloat(dischargePerHour1);
      
      // Step 1: Calculate Plants per Hectare (P/H)
      const pH = 10000 / (madResult.dbl * dbpNum);
      setPlantsPerHectare(pH);
      
      // Step 2: Final calculation
      const result = (pH * drippersNum * dischargeNum) / 10000;
      setFinalResult(result);
    }
  };

  const calculateSystemDischarge2 = () => {
    if (madResult && dbd && dischargePerHour2 && numberOfLines) {
      const dbdNum = parseFloat(dbd);
      const dischargeNum = parseFloat(dischargePerHour2);
      const linesNum = parseFloat(numberOfLines);
      
      // Formula: ((100 / DBL) * (100/ DBD) * discharge per hour * number of lines) / 10000
      const result = ((100 / madResult.dbl) * (100 / dbdNum) * dischargeNum * linesNum) / 10000;
      setFinalResult(result);
    }
  };

  const resetCalculator = () => {
    setDbl('');
    setRootDepth('');
    setRootWidth('');
    setWaterRetention('');
    setMadResult(null);
    setRefillSpan('');
    setRefillTankResult(null);
    setSelectedSystemDischarge(null);
    setDbp('');
    setDrippersPerPlant('');
    setDischargePerHour1('');
    setPlantsPerHectare(null);
    setDbd('');
    setDischargePerHour2('');
    setNumberOfLines('');
    setFinalResult(null);
  };

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
            
            <Button 
              onClick={calculateRefillTank}
              disabled={!refillSpan}
              className="w-full"
            >
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

      {/* Step 3: System Discharge Selection */}
      {refillTankResult && !selectedSystemDischarge && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Choose System Discharge Calculator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => setSelectedSystemDischarge('1')}
                variant="outline"
                className="h-auto p-4 text-left"
              >
                <div>
                  <p className="font-medium">System Discharge 1</p>
                  <p className="text-sm text-gray-600">Using plants per acre and drippers</p>
                </div>
              </Button>
              <Button
                onClick={() => setSelectedSystemDischarge('2')}
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
      {selectedSystemDischarge === '1' && (
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
            
            {plantsPerAcre && (
              <div className="bg-green-200 p-4 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-2">
                  Plants per Acre (P/A): <span className="text-lg">{plantsPerAcre.toFixed(2)}</span>
                </p>
                <p className="text-xs text-green-700">
                  Formula: 10000 ÷ (DBL ({madResult?.dbl}) × DBP ({dbp})) = {plantsPerAcre.toFixed(2)}
                </p>
              </div>
            )}
            
            {finalResult && (
              <div className="bg-green-50 p-4 rounded-lg space-y-3">
                <div>
                  <p className="text-sm font-medium text-green-800">
                    System Discharge Result: <span className="text-lg">{finalResult.toFixed(6)}</span>
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Formula: (P/H × Drippers per plant × Discharge per hour) ÷ 10000
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Irrigation Hours: <span className="text-lg">{(refillTankResult! / finalResult).toFixed(2)}</span> hours
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Formula: Refill Tank Result ({refillTankResult?.toFixed(4)}) ÷ System Discharge ({finalResult.toFixed(6)})
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* System Discharge 2 */}
      {selectedSystemDischarge === '2' && (
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
            
            {finalResult && (
              <div className="bg-green-50 p-4 rounded-lg space-y-3">
                <div>
                  <p className="text-sm font-medium text-green-800">
                    System Discharge Result: <span className="text-lg">{finalResult.toFixed(6)}</span>
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Formula: ((100 ÷ DBL) × (100 ÷ DBD) × Discharge per hour × Number of lines) ÷ 10000
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Irrigation Hours: <span className="text-lg">{(refillTankResult! / finalResult).toFixed(2)}</span> hours
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Formula: Refill Tank Result ({refillTankResult?.toFixed(4)}) ÷ System Discharge ({finalResult.toFixed(6)})
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reset Button */}
      {(madResult || refillTankResult || finalResult) && (
        <div className="text-center">
          <Button onClick={resetCalculator} variant="outline">
            Start New Calculation
          </Button>
        </div>
      )}
    </div>
  );
}