export interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  type: 'irrigation' | 'spray' | 'fertigation' | 'training' | 'harvest' | 'soil_test' | 'other';
  priority: 'low' | 'medium' | 'high';
  estimatedDuration?: string;
  frequency?: 'once' | 'weekly' | 'biweekly' | 'monthly' | 'seasonal' | 'yearly';
  growthStage?: string[];
  season?: 'spring' | 'summer' | 'monsoon' | 'winter';
  instructions?: string;
}

export const TASK_TEMPLATES: TaskTemplate[] = [
  // Irrigation Tasks
  {
    id: 'irrigation_daily_check',
    title: 'Daily Irrigation System Check',
    description: 'Check drip irrigation system, filters, and water pressure',
    type: 'irrigation',
    priority: 'high',
    estimatedDuration: '30 minutes',
    frequency: 'weekly',
    growthStage: ['flowering', 'fruit_set', 'veraison'],
    instructions: 'Inspect drippers, clean filters, check pressure gauges, verify timer settings'
  },
  {
    id: 'irrigation_summer_schedule',
    title: 'Summer Irrigation Schedule',
    description: 'Increase irrigation frequency during peak summer',
    type: 'irrigation',
    priority: 'high',
    estimatedDuration: '2 hours',
    frequency: 'weekly',
    season: 'summer',
    instructions: 'Water early morning (5-8 AM) and evening (6-8 PM). Check soil moisture at 30cm depth.'
  },
  
  // Spray Tasks
  {
    id: 'preventive_spray_powdery_mildew',
    title: 'Preventive Spray - Powdery Mildew',
    description: 'Apply preventive fungicide spray for powdery mildew control',
    type: 'spray',
    priority: 'high',
    estimatedDuration: '3 hours',
    frequency: 'biweekly',
    growthStage: ['bud_break', 'flowering', 'fruit_set'],
    instructions: 'Use sulfur-based fungicide. Apply in early morning or evening. Ensure complete canopy coverage.'
  },
  {
    id: 'insecticide_spray_thrips',
    title: 'Insecticide Spray - Thrips Control',
    description: 'Target spray for thrips control during vulnerable stages',
    type: 'spray',
    priority: 'medium',
    estimatedDuration: '2.5 hours',
    frequency: 'monthly',
    growthStage: ['bud_break', 'flowering'],
    instructions: 'Use imidacloprid or spinosad. Check weather conditions - avoid spraying before rain.'
  },
  
  // Training & Pruning Tasks
  {
    id: 'winter_pruning',
    title: 'Winter Pruning',
    description: 'Annual dormant season pruning to shape vines and control yield',
    type: 'training',
    priority: 'high',
    estimatedDuration: '8 hours per acre',
    frequency: 'yearly',
    season: 'winter',
    growthStage: ['dormant'],
    instructions: 'Remove 80-90% of previous year growth. Maintain 2 canes per arm. Prune when vines are fully dormant.'
  },
  {
    id: 'summer_topping',
    title: 'Summer Topping',
    description: 'Trim shoot tips to redirect energy to fruit development',
    type: 'training',
    priority: 'medium',
    estimatedDuration: '4 hours per acre',
    frequency: 'monthly',
    season: 'summer',
    growthStage: ['fruit_set', 'veraison'],
    instructions: 'Remove 6-8 inches from shoot tips. Do after fruit set. Avoid during water stress.'
  },
  
  // Fertigation Tasks
  {
    id: 'fertigation_npk_schedule',
    title: 'NPK Fertigation Schedule',
    description: 'Apply balanced NPK fertilizer through drip system',
    type: 'fertigation',
    priority: 'high',
    estimatedDuration: '1 hour',
    frequency: 'weekly',
    growthStage: ['bud_break', 'flowering', 'fruit_set'],
    instructions: 'Mix 19:19:19 NPK at 0.5% concentration. Apply for 30-45 minutes. Check EC levels.'
  },
  {
    id: 'calcium_spray_application',
    title: 'Calcium Foliar Application',
    description: 'Foliar spray of calcium chloride to prevent berry disorders',
    type: 'fertigation',
    priority: 'medium',
    estimatedDuration: '2 hours',
    frequency: 'biweekly',
    growthStage: ['fruit_set', 'veraison'],
    instructions: 'Use calcium chloride at 0.5% concentration. Apply in evening hours. Avoid during flowering.'
  },
  
  // Harvest Tasks
  {
    id: 'harvest_readiness_check',
    title: 'Harvest Readiness Assessment',
    description: 'Check Brix levels, pH, and berry taste for harvest timing',
    type: 'harvest',
    priority: 'high',
    estimatedDuration: '2 hours',
    frequency: 'weekly',
    growthStage: ['veraison', 'harvest'],
    instructions: 'Sample from multiple blocks. Target: Brix 18-22°, pH 3.2-3.8. Check seed color and berry taste.'
  },
  {
    id: 'pre_harvest_preparation',
    title: 'Pre-harvest Preparation',
    description: 'Prepare harvesting equipment and logistics',
    type: 'harvest',
    priority: 'medium',
    estimatedDuration: '4 hours',
    frequency: 'once',
    growthStage: ['veraison'],
    instructions: 'Clean and sanitize crates, arrange transport, coordinate with workers, check grape crusher.'
  },
  
  // Soil & Plant Health
  {
    id: 'soil_moisture_monitoring',
    title: 'Soil Moisture Monitoring',
    description: 'Check soil moisture levels at different depths',
    type: 'soil_test',
    priority: 'medium',
    estimatedDuration: '1 hour',
    frequency: 'weekly',
    instructions: 'Use soil moisture meter at 15cm, 30cm, and 60cm depths. Record readings for irrigation scheduling.'
  },
  {
    id: 'leaf_analysis_sampling',
    title: 'Leaf Analysis Sampling',
    description: 'Collect leaf samples for nutrient analysis',
    type: 'soil_test',
    priority: 'medium',
    estimatedDuration: '2 hours',
    frequency: 'seasonal',
    growthStage: ['flowering', 'fruit_set'],
    instructions: 'Collect 100 petioles from 5th-6th leaf from shoot tip. Sample from multiple blocks.'
  },
  
  // Canopy Management
  {
    id: 'leaf_removal_veraison',
    title: 'Leaf Removal at Veraison',
    description: 'Remove leaves around grape clusters for better air circulation',
    type: 'training',
    priority: 'medium',
    estimatedDuration: '6 hours per acre',
    frequency: 'once',
    growthStage: ['veraison'],
    instructions: 'Remove 4-6 basal leaves per shoot. Maintain cluster exposure to morning sun. Avoid over-exposure.'
  },
  
  // Disease Monitoring
  {
    id: 'disease_scouting',
    title: 'Weekly Disease Scouting',
    description: 'Scout vineyard for early signs of diseases',
    type: 'other',
    priority: 'high',
    estimatedDuration: '2 hours',
    frequency: 'weekly',
    instructions: 'Check for powdery mildew, downy mildew, black rot. Record disease pressure levels. Take photos if needed.'
  }
];

export const getTemplatesByType = (type: TaskTemplate['type']): TaskTemplate[] => {
  return TASK_TEMPLATES.filter(template => template.type === type);
};

export const getTemplatesByGrowthStage = (growthStage: string): TaskTemplate[] => {
  return TASK_TEMPLATES.filter(template => 
    template.growthStage?.includes(growthStage)
  );
};

export const getTemplatesBySeason = (season: TaskTemplate['season']): TaskTemplate[] => {
  return TASK_TEMPLATES.filter(template => template.season === season);
};

export const getCurrentSeasonTemplates = (): TaskTemplate[] => {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  
  let currentSeason: TaskTemplate['season'];
  if (month >= 3 && month <= 5) currentSeason = 'spring';
  else if (month >= 6 && month <= 8) currentSeason = 'summer';
  else if (month >= 9 && month <= 11) currentSeason = 'monsoon';
  else currentSeason = 'winter';
  
  return getTemplatesBySeason(currentSeason);
};