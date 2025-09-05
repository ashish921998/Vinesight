/**
 * Irrigation System Discharge Calculator
 * For designing and evaluating drip, sprinkler, and surface irrigation systems
 */

export interface SystemDesignInputs {
  farmId: number;
  farmArea: number; // acres
  vineSpacing: number; // meters
  rowSpacing: number; // meters
  irrigationMethod: 'drip' | 'sprinkler' | 'surface';
  soilType: 'sandy' | 'loamy' | 'clay';
  slope: number; // percentage
  waterSource: 'bore' | 'canal' | 'tank' | 'river';
  availablePressure: number; // bars
  dailyIrrigationHours: number; // hours per day
  peakETc: number; // mm/day - from ETc calculator
}

export interface EmitterSpecs {
  emitterType: 'drip' | 'microsprinkler' | 'bubbler';
  flowRate: number; // L/hr per emitter
  spacing: number; // cm between emitters
  pressureRating: number; // bars
  wetDiameter: number; // cm
}

export interface SprinklerSpecs {
  sprinklerType: 'impact' | 'spray' | 'rotary';
  flowRate: number; // L/hr per sprinkler
  spacing: number; // meters between sprinklers
  pressureRating: number; // bars
  wetDiameter: number; // meters
  applicationRate: number; // mm/hr
}

export interface SystemResults {
  designParameters: {
    totalVines: number;
    totalEmitters: number;
    systemFlowRate: number; // L/hr
    operatingPressure: number; // bars
    dailyWaterRequirement: number; // liters
    pumpCapacity: number; // HP
    mainlineSize: number; // mm diameter
    lateralSize: number; // mm diameter
  };
  efficiency: {
    distributionUniformity: number; // percentage
    applicationEfficiency: number; // percentage
    waterUseEfficiency: number; // percentage
  };
  economics: {
    initialCost: number; // INR
    annualOperatingCost: number; // INR
    costPerAcre: number; // INR/ha
    paybackPeriod: number; // years
  };
  recommendations: {
    systemDesign: string[];
    maintenance: string[];
    optimization: string[];
  };
  technicalSpecs: TechnicalSpecifications;
}

export interface TechnicalSpecifications {
  pumpSpecifications: {
    capacity: number; // L/hr
    head: number; // meters
    powerRequired: number; // HP
    efficiency: number; // percentage
  };
  pipeNetwork: {
    mainline: PipeSpec;
    submain: PipeSpec;
    lateral: PipeSpec;
  };
  filtrationSystem: {
    type: string;
    capacity: number; // L/hr
    cost: number; // INR
  };
  fertigation: {
    tankCapacity: number; // liters
    injectionRate: number; // L/hr
    cost: number; // INR
  };
}

export interface PipeSpec {
  diameter: number; // mm
  material: string;
  pressure: number; // bars
  length: number; // meters
  cost: number; // INR per meter
}

// System component costs (INR)
const COMPONENT_COSTS = {
  drip: {
    emitter: 3, // per piece
    lateral: 8, // per meter
    submain: 25, // per meter
    mainline: 85, // per meter
    filter: 15000, // basic filter system
    pump: 25000, // per HP
    fertigation: 35000 // basic system
  },
  sprinkler: {
    sprinkler: 150, // per piece
    lateral: 35, // per meter
    submain: 45, // per meter
    mainline: 95, // per meter
    filter: 8000, // basic filter
    pump: 30000, // per HP
    fertigation: 25000
  },
  surface: {
    gates: 200, // per gate
    channels: 50, // per meter
    structures: 5000, // per acre
    pump: 20000, // per HP
    leveling: 15000 // per acre
  }
};

// Emitter specifications database
const EMITTER_DATABASE = {
  'Standard Drip (2 L/hr)': { flowRate: 2, spacing: 30, pressure: 1.0, wetDiameter: 40 },
  'Standard Drip (4 L/hr)': { flowRate: 4, spacing: 40, pressure: 1.0, wetDiameter: 60 },
  'Pressure Compensating (2 L/hr)': { flowRate: 2, spacing: 30, pressure: 1.5, wetDiameter: 45 },
  'Micro-sprinkler (20 L/hr)': { flowRate: 20, spacing: 200, pressure: 1.5, wetDiameter: 300 },
  'Micro-sprinkler (40 L/hr)': { flowRate: 40, spacing: 300, pressure: 2.0, wetDiameter: 400 }
};

export class SystemDischargeCalculator {
  /**
   * Calculate number of vines and emitters
   */
  private static calculatePlantDensity(vineSpacing: number, rowSpacing: number, farmArea: number): {
    vinesPerHa: number;
    totalVines: number;
  } {
    const vinesPerHa = 10000 / (vineSpacing * rowSpacing);
    const totalVines = vinesPerHa * farmArea;
    return { vinesPerHa, totalVines };
  }

  /**
   * Calculate system flow rate
   */
  private static calculateSystemFlow(
    totalEmitters: number,
    emitterFlowRate: number,
    systemType: string
  ): number {
    let simultaneityFactor = 1.0;
    
    // Account for simultaneous operation
    switch (systemType) {
      case 'drip':
        simultaneityFactor = 0.85; // 85% of emitters operate simultaneously
        break;
      case 'sprinkler':
        simultaneityFactor = 0.75; // Zone-based operation
        break;
      case 'surface':
        simultaneityFactor = 1.0; // Continuous flow
        break;
    }

    return totalEmitters * emitterFlowRate * simultaneityFactor;
  }

  /**
   * Calculate required pump capacity
   */
  private static calculatePumpCapacity(
    systemFlowRate: number,
    totalHead: number
  ): { capacity: number; head: number; powerRequired: number; efficiency: number } {
    // Add safety factor
    const capacity = systemFlowRate * 1.1;
    
    // Calculate power (HP = Q × H / (3960 × efficiency))
    const efficiency = 0.75; // Typical pump efficiency
    const powerRequired = (capacity * totalHead) / (3960 * efficiency);
    
    return {
      capacity,
      head: totalHead,
      powerRequired: Math.ceil(powerRequired),
      efficiency
    };
  }

  /**
   * Calculate pipe diameters based on flow and velocity
   */
  private static calculatePipeDiameter(flowRate: number, maxVelocity: number = 2.0): number {
    // Q = A × V, where A = π × r²
    // Diameter (mm) = 2 × √(Q / (π × V)) × 1000
    const diameterM = 2 * Math.sqrt(flowRate / (Math.PI * maxVelocity * 3600));
    const diameterMm = diameterM * 1000;
    
    // Round to standard pipe sizes
    const standardSizes = [50, 63, 75, 90, 110, 125, 160, 200, 250, 315, 400, 500];
    return standardSizes.find(size => size >= diameterMm) || 500;
  }

  /**
   * Calculate system efficiency
   */
  private static calculateEfficiency(
    irrigationMethod: string,
    soilType: string,
    systemDesign: any
  ): { distributionUniformity: number; applicationEfficiency: number; waterUseEfficiency: number } {
    let distributionUniformity: number;
    let applicationEfficiency: number;
    let waterUseEfficiency: number;

    switch (irrigationMethod) {
      case 'drip':
        distributionUniformity = 90; // High uniformity
        applicationEfficiency = soilType === 'sandy' ? 88 : soilType === 'clay' ? 95 : 92;
        waterUseEfficiency = 85;
        break;
      case 'sprinkler':
        distributionUniformity = 80;
        applicationEfficiency = soilType === 'sandy' ? 75 : soilType === 'clay' ? 85 : 80;
        waterUseEfficiency = 75;
        break;
      case 'surface':
        distributionUniformity = 60;
        applicationEfficiency = soilType === 'sandy' ? 60 : soilType === 'clay' ? 75 : 65;
        waterUseEfficiency = 60;
        break;
      default:
        distributionUniformity = 70;
        applicationEfficiency = 70;
        waterUseEfficiency = 65;
    }

    return { distributionUniformity, applicationEfficiency, waterUseEfficiency };
  }

  /**
   * Calculate system costs
   */
  private static calculateCosts(
    designParams: any,
    irrigationMethod: string,
    farmArea: number
  ): { initialCost: number; annualOperatingCost: number; costPerAcre: number; paybackPeriod: number } {
    const costs = COMPONENT_COSTS[irrigationMethod as keyof typeof COMPONENT_COSTS];
    
    let initialCost = 0;
    
    // Component costs
    switch (irrigationMethod) {
      case 'drip': {
        const dripCosts = costs as typeof COMPONENT_COSTS.drip;
        initialCost += designParams.totalEmitters * dripCosts.emitter;
        initialCost += (designParams.totalVines * 3.5) * dripCosts.lateral; // 3.5m lateral per vine
        initialCost += (farmArea * 200) * dripCosts.submain; // 200m submain per ha
        initialCost += (farmArea * 50) * dripCosts.mainline; // 50m mainline per ha
        initialCost += dripCosts.filter;
        initialCost += designParams.pumpCapacity * dripCosts.pump;
        initialCost += dripCosts.fertigation;
        break;
      }
      case 'sprinkler': {
        const sprinklerCosts = costs as typeof COMPONENT_COSTS.sprinkler;
        initialCost += designParams.totalEmitters * sprinklerCosts.sprinkler;
        initialCost += (farmArea * 150) * sprinklerCosts.lateral;
        initialCost += (farmArea * 100) * sprinklerCosts.submain;
        initialCost += (farmArea * 50) * sprinklerCosts.mainline;
        initialCost += sprinklerCosts.filter;
        initialCost += designParams.pumpCapacity * sprinklerCosts.pump;
        break;
      }
      case 'surface': {
        const surfaceCosts = costs as typeof COMPONENT_COSTS.surface;
        initialCost += (farmArea * 10) * surfaceCosts.gates;
        initialCost += (farmArea * 300) * surfaceCosts.channels;
        initialCost += farmArea * surfaceCosts.structures;
        initialCost += designParams.pumpCapacity * surfaceCosts.pump;
        initialCost += farmArea * surfaceCosts.leveling;
        break;
      }
    }

    // Annual operating costs (10% of initial + electricity)
    const maintenanceCost = initialCost * 0.05; // 5% maintenance
    const electricityCost = designParams.pumpCapacity * 0.746 * 8 * 180 * 6; // kW × hours × days × rate
    const annualOperatingCost = maintenanceCost + electricityCost;

    const costPerAcre = initialCost / farmArea;
    
    // Simple payback calculation (assume 20% water savings worth ₹50,000/ha/year)
    const annualSavings = farmArea * 50000 * 0.2;
    const paybackPeriod = initialCost / Math.max(annualSavings - annualOperatingCost, 1);

    return {
      initialCost: Math.round(initialCost),
      annualOperatingCost: Math.round(annualOperatingCost),
      costPerAcre: Math.round(costPerAcre),
      paybackPeriod: Math.round(paybackPeriod * 10) / 10
    };
  }

  /**
   * Generate recommendations
   */
  private static generateRecommendations(
    inputs: SystemDesignInputs,
    results: any
  ): { systemDesign: string[]; maintenance: string[]; optimization: string[] } {
    const systemDesign: string[] = [];
    const maintenance: string[] = [];
    const optimization: string[] = [];

    // System design recommendations
    switch (inputs.irrigationMethod) {
      case 'drip':
        systemDesign.push('Install pressure compensating emitters for uniform distribution');
        systemDesign.push('Use pressure-rated lateral pipes to maintain system pressure');
        systemDesign.push('Install automatic filtration system to prevent clogging');
        if (inputs.slope > 5) {
          systemDesign.push('Consider pressure compensating emitters due to slope');
        }
        break;
      case 'sprinkler':
        systemDesign.push('Ensure adequate overlap between sprinklers (50-60%)');
        systemDesign.push('Install wind-resistant sprinklers in windy areas');
        systemDesign.push('Use proper spacing to avoid over/under watering');
        break;
      case 'surface':
        systemDesign.push('Level fields properly for uniform water distribution');
        systemDesign.push('Install surge valves for improved efficiency');
        systemDesign.push('Design proper field slopes (0.2-2%)');
        break;
    }

    // Maintenance recommendations
    maintenance.push('Perform regular system pressure checks');
    maintenance.push('Clean filters weekly during irrigation season');
    maintenance.push('Inspect and replace damaged emitters monthly');
    maintenance.push('Flush system at start and end of season');
    if (inputs.irrigationMethod === 'drip') {
      maintenance.push('Inject acid treatment monthly to prevent mineral buildup');
    }

    // Optimization recommendations
    if (results.efficiency.distributionUniformity < 80) {
      optimization.push('Improve distribution uniformity through better spacing');
    }
    if (results.efficiency.applicationEfficiency < 80) {
      optimization.push('Optimize irrigation scheduling to match crop needs');
    }
    optimization.push('Install soil moisture sensors for precision irrigation');
    optimization.push('Consider automated controllers for consistent operation');
    optimization.push('Implement fertigation for efficient nutrient delivery');

    return { systemDesign, maintenance, optimization };
  }

  /**
   * Main system design calculation
   */
  static calculateSystemDischarge(inputs: SystemDesignInputs): SystemResults {
    const {
      farmArea,
      vineSpacing,
      rowSpacing,
      irrigationMethod,
      soilType,
      availablePressure,
      peakETc,
      dailyIrrigationHours
    } = inputs;

    // Calculate plant density
    const { vinesPerHa, totalVines } = this.calculatePlantDensity(vineSpacing, rowSpacing, farmArea);

    // Determine emitters per vine (typically 2-4 for drip)
    const emittersPerVine = irrigationMethod === 'drip' ? 2 : 
                           irrigationMethod === 'sprinkler' ? 0.25 : 1;
    const totalEmitters = Math.ceil(totalVines * emittersPerVine);

    // Select appropriate emitter specifications
    const emitterFlowRate = irrigationMethod === 'drip' ? 4 :
                           irrigationMethod === 'sprinkler' ? 40 : 100;

    // Calculate system flow rate
    const systemFlowRate = this.calculateSystemFlow(totalEmitters, emitterFlowRate, irrigationMethod);

    // Calculate daily water requirement
    const dailyWaterRequirement = (peakETc * farmArea * 10000) / 0.85; // liters, with 85% efficiency

    // Calculate pump requirements
    const totalHead = 20 + (inputs.slope * farmArea * 100 / 1000); // Static + dynamic head
    const pumpSpecs = this.calculatePumpCapacity(systemFlowRate, totalHead);

    // Calculate pipe sizes
    const mainlineSize = this.calculatePipeDiameter(systemFlowRate);
    const lateralSize = this.calculatePipeDiameter(systemFlowRate * 0.3); // 30% of main flow

    // Calculate efficiency
    const efficiency = this.calculateEfficiency(irrigationMethod, soilType, {});

    // Design parameters
    const designParameters = {
      totalVines: Math.ceil(totalVines),
      totalEmitters,
      systemFlowRate: Math.round(systemFlowRate),
      operatingPressure: Math.min(availablePressure, 2.5),
      dailyWaterRequirement: Math.round(dailyWaterRequirement),
      pumpCapacity: pumpSpecs.powerRequired,
      mainlineSize,
      lateralSize
    };

    // Calculate costs
    const economics = this.calculateCosts(designParameters, irrigationMethod, farmArea);

    // Generate recommendations
    const recommendations = this.generateRecommendations(inputs, { efficiency });

    // Technical specifications
    const technicalSpecs: TechnicalSpecifications = {
      pumpSpecifications: pumpSpecs,
      pipeNetwork: {
        mainline: {
          diameter: mainlineSize,
          material: 'HDPE',
          pressure: 6,
          length: farmArea * 50,
          cost: 85
        },
        submain: {
          diameter: Math.ceil(mainlineSize * 0.8),
          material: 'HDPE',
          pressure: 4,
          length: farmArea * 200,
          cost: 45
        },
        lateral: {
          diameter: 16,
          material: 'LDPE',
          pressure: 2.5,
          length: totalVines * 3.5,
          cost: 8
        }
      },
      filtrationSystem: {
        type: 'Screen + Disc Filter',
        capacity: systemFlowRate,
        cost: irrigationMethod === 'drip' ? 15000 : 8000
      },
      fertigation: {
        tankCapacity: 1000,
        injectionRate: systemFlowRate * 0.001,
        cost: 35000
      }
    };

    return {
      designParameters,
      efficiency,
      economics,
      recommendations,
      technicalSpecs
    };
  }

  /**
   * Get emitter selection recommendations
   */
  static getEmitterRecommendations(
    soilType: string,
    vineSpacing: number,
    slope: number
  ): { recommended: string; alternatives: string[]; reasoning: string } {
    let recommended: string;
    let alternatives: string[] = [];
    let reasoning: string;

    if (slope > 5) {
      recommended = 'Pressure Compensating (2 L/hr)';
      alternatives = ['Pressure Compensating (4 L/hr)'];
      reasoning = 'Pressure compensating emitters maintain uniform flow rates on sloped terrain';
    } else if (soilType === 'sandy') {
      recommended = 'Standard Drip (2 L/hr)';
      alternatives = ['Standard Drip (4 L/hr)', 'Micro-sprinkler (20 L/hr)'];
      reasoning = 'Lower flow rates prevent deep percolation in sandy soils';
    } else if (soilType === 'clay') {
      recommended = 'Standard Drip (4 L/hr)';
      alternatives = ['Micro-sprinkler (40 L/hr)'];
      reasoning = 'Higher flow rates accommodate lower infiltration rates in clay soils';
    } else {
      recommended = 'Standard Drip (4 L/hr)';
      alternatives = ['Standard Drip (2 L/hr)', 'Pressure Compensating (2 L/hr)'];
      reasoning = 'Standard flow rates work well for loamy soils with good infiltration';
    }

    return { recommended, alternatives, reasoning };
  }

  /**
   * System comparison tool
   */
  static compareIrrigationSystems(inputs: SystemDesignInputs): {
    drip: SystemResults;
    sprinkler: SystemResults;
    comparison: {
      efficiency: { winner: string; difference: number };
      cost: { winner: string; difference: number };
      maintenance: { winner: string; reasoning: string };
      suitability: { winner: string; reasoning: string };
    };
  } {
    const dripInputs = { ...inputs, irrigationMethod: 'drip' as const };
    const sprinklerInputs = { ...inputs, irrigationMethod: 'sprinkler' as const };

    const dripResults = this.calculateSystemDischarge(dripInputs);
    const sprinklerResults = this.calculateSystemDischarge(sprinklerInputs);

    const comparison = {
      efficiency: {
        winner: dripResults.efficiency.waterUseEfficiency > sprinklerResults.efficiency.waterUseEfficiency ? 'Drip' : 'Sprinkler',
        difference: Math.abs(dripResults.efficiency.waterUseEfficiency - sprinklerResults.efficiency.waterUseEfficiency)
      },
      cost: {
        winner: dripResults.economics.initialCost < sprinklerResults.economics.initialCost ? 'Drip' : 'Sprinkler',
        difference: Math.abs(dripResults.economics.initialCost - sprinklerResults.economics.initialCost)
      },
      maintenance: {
        winner: 'Sprinkler',
        reasoning: 'Sprinkler systems generally require less frequent maintenance and are less prone to clogging'
      },
      suitability: {
        winner: inputs.soilType === 'sandy' ? 'Drip' : inputs.farmArea > 10 ? 'Sprinkler' : 'Drip',
        reasoning: inputs.soilType === 'sandy' 
          ? 'Drip irrigation prevents deep percolation in sandy soils'
          : inputs.farmArea > 10
          ? 'Sprinkler systems are more cost-effective for larger areas'
          : 'Drip irrigation provides better water use efficiency for smaller areas'
      }
    };

    return {
      drip: dripResults,
      sprinkler: sprinklerResults,
      comparison
    };
  }
}