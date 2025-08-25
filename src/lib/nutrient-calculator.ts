/**
 * Nutrient Calculator for Grape Fertilization Planning
 * Based on soil test results, yield targets, and growth stage requirements
 */

export interface SoilTestResults {
  ph: number;
  organicMatter: number; // percentage
  nitrogen: number; // ppm or kg/ha
  phosphorus: number; // ppm or kg/ha
  potassium: number; // ppm or kg/ha
  calcium: number; // ppm or kg/ha
  magnesium: number; // ppm or kg/ha
  sulfur: number; // ppm or kg/ha
  boron: number; // ppm
  zinc: number; // ppm
  manganese: number; // ppm
  iron: number; // ppm
  copper: number; // ppm
  cec: number; // Cation Exchange Capacity
}

export interface NutrientCalculationInputs {
  farmId: number;
  targetYield: number; // tons per hectare
  currentGrowthStage: GrapeGrowthStage;
  soilTest: SoilTestResults;
  grapeVariety: 'table' | 'wine' | 'raisin';
  irrigationMethod: 'drip' | 'sprinkler' | 'surface';
  previousApplications: PreviousApplication[];
  farmArea: number; // hectares
}

export interface PreviousApplication {
  date: string;
  fertilizer: string;
  rate: number; // kg/ha
  npkRatio: {
    n: number;
    p: number;
    k: number;
  };
}

export interface NutrientResults {
  recommendations: {
    nitrogen: NutrientRecommendation;
    phosphorus: NutrientRecommendation;
    potassium: NutrientRecommendation;
    secondary: {
      calcium: NutrientRecommendation;
      magnesium: NutrientRecommendation;
      sulfur: NutrientRecommendation;
    };
    micronutrients: {
      boron: NutrientRecommendation;
      zinc: NutrientRecommendation;
      iron: NutrientRecommendation;
      manganese: NutrientRecommendation;
    };
  };
  fertilizerProgram: FertilizerProgram[];
  totalCost: number;
  applicationSchedule: ApplicationSchedule[];
  soilHealthAssessment: SoilHealthAssessment;
}

export interface NutrientRecommendation {
  required: number; // kg/ha
  available: number; // from soil
  deficit: number; // needs to be applied
  timing: string[];
  form: string[]; // recommended fertilizer forms
  method: string; // application method
  notes: string[];
}

export interface FertilizerProgram {
  stage: GrapeGrowthStage;
  timing: string;
  fertilizer: string;
  rate: number; // kg/ha
  costPerKg: number;
  totalCost: number;
  method: string;
  notes: string;
}

export interface ApplicationSchedule {
  month: string;
  stage: GrapeGrowthStage;
  applications: {
    fertilizer: string;
    rate: number;
    method: string;
  }[];
}

export interface SoilHealthAssessment {
  phStatus: 'acidic' | 'optimal' | 'alkaline';
  organicMatterStatus: 'low' | 'adequate' | 'high';
  cationBalance: 'poor' | 'fair' | 'good';
  recommendations: string[];
  limeRequirement?: number; // tons/ha if needed
}

export type GrapeGrowthStage = 
  | 'dormant' 
  | 'budbreak' 
  | 'flowering' 
  | 'fruit_set' 
  | 'veraison' 
  | 'harvest' 
  | 'post_harvest';

// Nutrient uptake requirements by growth stage (kg/ton of grapes)
const NUTRIENT_UPTAKE_FACTORS = {
  nitrogen: {
    dormant: 0.2,
    budbreak: 2.5,
    flowering: 4.5,
    fruit_set: 6.0,
    veraison: 3.5,
    harvest: 1.5,
    post_harvest: 2.0
  },
  phosphorus: {
    dormant: 0.1,
    budbreak: 0.8,
    flowering: 1.2,
    fruit_set: 1.8,
    veraison: 1.0,
    harvest: 0.5,
    post_harvest: 0.6
  },
  potassium: {
    dormant: 0.3,
    budbreak: 3.5,
    flowering: 5.5,
    fruit_set: 8.0,
    veraison: 6.5,
    harvest: 2.5,
    post_harvest: 3.0
  }
};

// Soil test interpretation ranges
const SOIL_TEST_RANGES = {
  phosphorus: { low: 15, adequate: 30, high: 50 }, // ppm
  potassium: { low: 100, adequate: 200, high: 300 }, // ppm
  organicMatter: { low: 2, adequate: 3.5, high: 6 }, // %
  ph: { acidic: 6.0, optimal: 6.8, alkaline: 8.0 }
};

// Fertilizer database with costs (INR per kg)
const FERTILIZER_DATABASE = {
  'Urea (46-0-0)': { n: 46, p: 0, k: 0, cost: 25 },
  'DAP (18-46-0)': { n: 18, p: 46, k: 0, cost: 35 },
  'MOP (0-0-60)': { n: 0, p: 0, k: 60, cost: 20 },
  'NPK 19-19-19': { n: 19, p: 19, k: 19, cost: 45 },
  'NPK 20-20-20': { n: 20, p: 20, k: 20, cost: 50 },
  'Calcium Nitrate (15.5-0-0)': { n: 15.5, p: 0, k: 0, cost: 40 },
  'Potassium Nitrate (13-0-45)': { n: 13, p: 0, k: 45, cost: 85 },
  'Magnesium Sulfate': { n: 0, p: 0, k: 0, cost: 30 },
  'Micronutrient Mix': { n: 0, p: 0, k: 0, cost: 150 }
};

export class NutrientCalculator {
  /**
   * Calculate nutrient requirements based on yield target
   */
  private static calculateNutrientNeeds(
    targetYield: number,
    stage: GrapeGrowthStage
  ): { n: number; p: number; k: number } {
    return {
      n: targetYield * NUTRIENT_UPTAKE_FACTORS.nitrogen[stage],
      p: targetYield * NUTRIENT_UPTAKE_FACTORS.phosphorus[stage],
      k: targetYield * NUTRIENT_UPTAKE_FACTORS.potassium[stage]
    };
  }

  /**
   * Assess soil nutrient availability
   */
  private static assessSoilAvailability(soilTest: SoilTestResults): {
    n: number; p: number; k: number;
  } {
    // Convert ppm to kg/ha (approximate conversion factors)
    const nAvailable = soilTest.nitrogen * 2.24; // N mineralization factor
    const pAvailable = soilTest.phosphorus * 2.24 * 0.3; // P availability factor
    const kAvailable = soilTest.potassium * 2.24 * 0.5; // K availability factor

    return {
      n: nAvailable,
      p: pAvailable,
      k: kAvailable
    };
  }

  /**
   * Account for previous applications
   */
  private static accountForPreviousApplications(
    previousApps: PreviousApplication[]
  ): { n: number; p: number; k: number } {
    let totalN = 0, totalP = 0, totalK = 0;

    for (const app of previousApps) {
      const appDate = new Date(app.date);
      const monthsAgo = (Date.now() - appDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      
      // Apply residual effect based on time and nutrient mobility
      const nResidual = monthsAgo < 3 ? 0.7 : monthsAgo < 6 ? 0.3 : 0.1;
      const pResidual = monthsAgo < 6 ? 0.8 : monthsAgo < 12 ? 0.5 : 0.2;
      const kResidual = monthsAgo < 2 ? 0.6 : monthsAgo < 4 ? 0.3 : 0.1;

      totalN += (app.rate * app.npkRatio.n / 100) * nResidual;
      totalP += (app.rate * app.npkRatio.p / 100) * pResidual;
      totalK += (app.rate * app.npkRatio.k / 100) * kResidual;
    }

    return { n: totalN, p: totalP, k: totalK };
  }

  /**
   * Generate soil health assessment
   */
  private static assessSoilHealth(soilTest: SoilTestResults): SoilHealthAssessment {
    let phStatus: SoilHealthAssessment['phStatus'];
    let organicMatterStatus: SoilHealthAssessment['organicMatterStatus'];
    let cationBalance: SoilHealthAssessment['cationBalance'];
    const recommendations: string[] = [];
    let limeRequirement: number | undefined;

    // pH assessment
    if (soilTest.ph < SOIL_TEST_RANGES.ph.acidic) {
      phStatus = 'acidic';
      recommendations.push('Apply lime to raise pH to optimal range (6.5-7.0)');
      limeRequirement = (6.5 - soilTest.ph) * 2.5; // Rough lime requirement calculation
    } else if (soilTest.ph > SOIL_TEST_RANGES.ph.alkaline) {
      phStatus = 'alkaline';
      recommendations.push('Consider sulfur application to lower pH');
    } else {
      phStatus = 'optimal';
    }

    // Organic matter assessment
    if (soilTest.organicMatter < SOIL_TEST_RANGES.organicMatter.low) {
      organicMatterStatus = 'low';
      recommendations.push('Increase organic matter through compost, cover crops, or green manure');
    } else if (soilTest.organicMatter > SOIL_TEST_RANGES.organicMatter.high) {
      organicMatterStatus = 'high';
    } else {
      organicMatterStatus = 'adequate';
    }

    // Cation balance (Ca:Mg:K ratio)
    const caPercent = (soilTest.calcium / soilTest.cec) * 100;
    const mgPercent = (soilTest.magnesium / soilTest.cec) * 100;
    const kPercent = (soilTest.potassium / soilTest.cec) * 100;

    if (caPercent >= 60 && caPercent <= 75 && mgPercent >= 10 && mgPercent <= 20 && kPercent >= 3 && kPercent <= 7) {
      cationBalance = 'good';
    } else if (caPercent >= 50 && mgPercent >= 8 && kPercent >= 2) {
      cationBalance = 'fair';
      recommendations.push('Monitor cation balance - consider adjusting Ca:Mg:K ratios');
    } else {
      cationBalance = 'poor';
      recommendations.push('Improve cation balance through targeted fertilization');
    }

    return {
      phStatus,
      organicMatterStatus,
      cationBalance,
      recommendations,
      limeRequirement
    };
  }

  /**
   * Generate fertilizer program
   */
  private static generateFertilizerProgram(
    nDeficit: number,
    pDeficit: number,
    kDeficit: number,
    stage: GrapeGrowthStage,
    variety: string
  ): FertilizerProgram[] {
    const program: FertilizerProgram[] = [];

    // Base fertilization strategy
    if (stage === 'dormant' || stage === 'budbreak') {
      // Pre-season application
      if (pDeficit > 0) {
        program.push({
          stage: 'dormant',
          timing: 'Winter (December-January)',
          fertilizer: 'DAP (18-46-0)',
          rate: Math.min(pDeficit * 2.17, 200), // Convert P to DAP
          costPerKg: FERTILIZER_DATABASE['DAP (18-46-0)'].cost,
          totalCost: 0, // Will be calculated
          method: 'Broadcast and incorporate',
          notes: 'Apply before budbreak for root uptake'
        });
      }

      if (nDeficit > 20) {
        program.push({
          stage: 'budbreak',
          timing: 'Early Spring (February-March)',
          fertilizer: 'Urea (46-0-0)',
          rate: nDeficit * 2.17, // Convert N to Urea
          costPerKg: FERTILIZER_DATABASE['Urea (46-0-0)'].cost,
          totalCost: 0,
          method: 'Split application through fertigation',
          notes: 'Support early vegetative growth'
        });
      }
    }

    // Growth season applications
    if (kDeficit > 0) {
      program.push({
        stage: 'fruit_set',
        timing: 'Late Spring (April-May)',
        fertilizer: 'Potassium Nitrate (13-0-45)',
        rate: kDeficit * 2.22, // Convert K to K-Nitrate
        costPerKg: FERTILIZER_DATABASE['Potassium Nitrate (13-0-45)'].cost,
        totalCost: 0,
        method: 'Fertigation',
        notes: 'Critical for fruit development'
      });
    }

    // Calculate total costs
    program.forEach(item => {
      item.totalCost = item.rate * item.costPerKg;
    });

    return program;
  }

  /**
   * Generate application schedule
   */
  private static generateApplicationSchedule(program: FertilizerProgram[]): ApplicationSchedule[] {
    const schedule: ApplicationSchedule[] = [];
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Group applications by month
    const monthlyApps: { [key: string]: any[] } = {};

    program.forEach(item => {
      const month = item.timing.includes('December') || item.timing.includes('January') ? 'January' :
                   item.timing.includes('February') || item.timing.includes('March') ? 'March' :
                   item.timing.includes('April') || item.timing.includes('May') ? 'May' :
                   item.timing.includes('June') || item.timing.includes('July') ? 'June' : 'August';

      if (!monthlyApps[month]) {
        monthlyApps[month] = [];
      }

      monthlyApps[month].push({
        fertilizer: item.fertilizer,
        rate: item.rate,
        method: item.method
      });
    });

    // Convert to schedule format
    Object.keys(monthlyApps).forEach(month => {
      const stageMap: { [key: string]: GrapeGrowthStage } = {
        'January': 'dormant',
        'March': 'budbreak',
        'May': 'fruit_set',
        'June': 'veraison',
        'August': 'harvest'
      };

      schedule.push({
        month,
        stage: stageMap[month] || 'dormant',
        applications: monthlyApps[month]
      });
    });

    return schedule;
  }

  /**
   * Main nutrient calculation function
   */
  static calculateNutrients(inputs: NutrientCalculationInputs): NutrientResults {
    const {
      targetYield,
      currentGrowthStage,
      soilTest,
      grapeVariety,
      previousApplications,
      farmArea
    } = inputs;

    // Calculate nutrient needs
    const nutrientNeeds = this.calculateNutrientNeeds(targetYield, currentGrowthStage);

    // Assess soil availability
    const soilAvailability = this.assessSoilAvailability(soilTest);

    // Account for previous applications
    const residualNutrients = this.accountForPreviousApplications(previousApplications);

    // Calculate deficits
    const nDeficit = Math.max(0, nutrientNeeds.n - soilAvailability.n - residualNutrients.n);
    const pDeficit = Math.max(0, nutrientNeeds.p - soilAvailability.p - residualNutrients.p);
    const kDeficit = Math.max(0, nutrientNeeds.k - soilAvailability.k - residualNutrients.k);

    // Generate fertilizer program
    const fertilizerProgram = this.generateFertilizerProgram(
      nDeficit, pDeficit, kDeficit, currentGrowthStage, grapeVariety
    );

    // Calculate total cost
    const totalCost = fertilizerProgram.reduce((sum, item) => sum + item.totalCost, 0) * farmArea;

    // Generate application schedule
    const applicationSchedule = this.generateApplicationSchedule(fertilizerProgram);

    // Assess soil health
    const soilHealthAssessment = this.assessSoilHealth(soilTest);

    // Create detailed recommendations
    const recommendations = {
      nitrogen: {
        required: nutrientNeeds.n,
        available: soilAvailability.n + residualNutrients.n,
        deficit: nDeficit,
        timing: ['Pre-bloom', 'Post-fruit set', 'Pre-veraison'],
        form: nDeficit > 0 ? ['Urea', 'Calcium Nitrate', 'Ammonium Sulfate'] : [],
        method: 'Fertigation preferred for efficient uptake',
        notes: nDeficit > 0 ? ['Split applications to reduce leaching', 'Avoid late season N to prevent delayed ripening'] : ['No additional nitrogen needed']
      },
      phosphorus: {
        required: nutrientNeeds.p,
        available: soilAvailability.p + residualNutrients.p,
        deficit: pDeficit,
        timing: ['Pre-season application'],
        form: pDeficit > 0 ? ['DAP', 'Single Super Phosphate'] : [],
        method: 'Broadcast and incorporate before planting',
        notes: pDeficit > 0 ? ['Apply in fall or early spring', 'Band application near root zone'] : ['Adequate phosphorus available']
      },
      potassium: {
        required: nutrientNeeds.k,
        available: soilAvailability.k + residualNutrients.k,
        deficit: kDeficit,
        timing: ['Pre-bloom', 'Fruit development', 'Post-harvest'],
        form: kDeficit > 0 ? ['Potassium Nitrate', 'MOP', 'Potassium Sulfate'] : [],
        method: 'Fertigation for quick availability',
        notes: kDeficit > 0 ? ['Critical for fruit quality', 'Monitor soil K levels regularly'] : ['Potassium levels adequate']
      },
      secondary: {
        calcium: {
          required: 40,
          available: soilTest.calcium * 2.24,
          deficit: Math.max(0, 40 - soilTest.calcium * 2.24),
          timing: ['Annual application'],
          form: ['Gypsum', 'Lime', 'Calcium Chloride'],
          method: 'Broadcast or fertigation',
          notes: ['Important for cell wall strength', 'Reduces bitter pit in grapes']
        },
        magnesium: {
          required: 15,
          available: soilTest.magnesium * 2.24,
          deficit: Math.max(0, 15 - soilTest.magnesium * 2.24),
          timing: ['Spring application'],
          form: ['Epsom Salt', 'Dolomitic Lime'],
          method: 'Foliar spray or soil application',
          notes: ['Essential for chlorophyll formation', 'Apply if Mg:K ratio is poor']
        },
        sulfur: {
          required: 10,
          available: soilTest.sulfur,
          deficit: Math.max(0, 10 - soilTest.sulfur),
          timing: ['Spring application'],
          form: ['Elemental Sulfur', 'Gypsum'],
          method: 'Broadcast application',
          notes: ['Important for protein synthesis', 'Helps lower soil pH if needed']
        }
      },
      micronutrients: {
        boron: {
          required: 1,
          available: soilTest.boron * 0.001,
          deficit: Math.max(0, 1 - soilTest.boron * 0.001),
          timing: ['Pre-bloom', 'Fruit set'],
          form: ['Boric Acid', 'Borax'],
          method: 'Foliar application preferred',
          notes: ['Critical for fruit set', 'Apply carefully - narrow safe range']
        },
        zinc: {
          required: 2,
          available: soilTest.zinc * 0.001,
          deficit: Math.max(0, 2 - soilTest.zinc * 0.001),
          timing: ['Dormant season', 'Early spring'],
          form: ['Zinc Sulfate', 'Chelated Zinc'],
          method: 'Foliar spray or soil application',
          notes: ['Important for enzyme function', 'Deficiency common in alkaline soils']
        },
        iron: {
          required: 3,
          available: soilTest.iron * 0.001,
          deficit: Math.max(0, 3 - soilTest.iron * 0.001),
          timing: ['Spring application'],
          form: ['Chelated Iron', 'Iron Sulfate'],
          method: 'Foliar application in alkaline soils',
          notes: ['Essential for chlorophyll', 'Use chelated forms in high pH soils']
        },
        manganese: {
          required: 2,
          available: soilTest.manganese * 0.001,
          deficit: Math.max(0, 2 - soilTest.manganese * 0.001),
          timing: ['Spring application'],
          form: ['Manganese Sulfate', 'Chelated Manganese'],
          method: 'Foliar or soil application',
          notes: ['Important for photosynthesis', 'Deficiency common in organic soils']
        }
      }
    };

    return {
      recommendations,
      fertilizerProgram,
      totalCost,
      applicationSchedule,
      soilHealthAssessment
    };
  }

  /**
   * Get nutrient deficiency symptoms reference
   */
  static getDeficiencySymptoms(): {
    nutrient: string;
    symptoms: string[];
    management: string[];
  }[] {
    return [
      {
        nutrient: 'Nitrogen',
        symptoms: ['Yellowing of older leaves', 'Reduced shoot growth', 'Light green foliage', 'Poor fruit set'],
        management: ['Apply nitrogen fertilizer', 'Use foliar urea spray', 'Improve soil organic matter']
      },
      {
        nutrient: 'Phosphorus',
        symptoms: ['Purple or reddish leaf coloration', 'Delayed maturity', 'Poor root development', 'Reduced flowering'],
        management: ['Apply phosphate fertilizers', 'Improve soil pH if acidic', 'Add organic matter']
      },
      {
        nutrient: 'Potassium',
        symptoms: ['Leaf edge burning', 'Poor fruit quality', 'Reduced sugar content', 'Increased disease susceptibility'],
        management: ['Apply potassium fertilizers', 'Use potassium sulfate for quality', 'Monitor soil K levels']
      }
    ];
  }
}