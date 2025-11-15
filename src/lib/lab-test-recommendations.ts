/**
 * Lab Test Recommendations Engine
 * Generates rule-based recommendations for soil and petiole test results
 * Based on established agricultural science thresholds for grape farming
 */

export type RecommendationPriority = 'critical' | 'high' | 'moderate' | 'low' | 'optimal'
export type RecommendationType = 'action' | 'watch' | 'optimal' | 'savings'

export interface Recommendation {
  priority: RecommendationPriority
  type: RecommendationType
  parameter: string
  technical: string // Technical explanation
  simple: string // Simple farmer-friendly explanation
  icon: string // Emoji or icon identifier
}

interface SoilTestParameters {
  ph?: number
  ec?: number // Electrical Conductivity (dS/m)
  organicCarbon?: number // %
  organicMatter?: number // %
  nitrogen?: number // ppm
  phosphorus?: number // ppm
  potassium?: number // ppm
  calcium?: number // ppm
  magnesium?: number // ppm
  sulfur?: number // ppm
  iron?: number // ppm
  manganese?: number // ppm
  zinc?: number // ppm
  copper?: number // ppm
  boron?: number // ppm
}

interface PetioleTestParameters {
  total_nitrogen?: number // %
  nitrate_nitrogen?: number // ppm
  phosphorus?: number // %
  potassium?: number // %
  calcium?: number // %
  magnesium?: number // %
  sulphur?: number // %
  ferrous?: number // ppm
  manganese?: number // ppm
  zinc?: number // ppm
  copper?: number // ppm
  boron?: number // ppm
}

/**
 * Generate recommendations for soil test results
 */
export function generateSoilTestRecommendations(parameters: SoilTestParameters): Recommendation[] {
  const recommendations: Recommendation[] = []

  // pH Analysis
  if (parameters.ph !== undefined) {
    if (parameters.ph < 5.5) {
      recommendations.push({
        priority: 'critical',
        type: 'action',
        parameter: 'pH',
        technical: `Soil is highly acidic (pH ${parameters.ph}). Apply agricultural lime (CaCO₃) at 2-3 tons/acre to raise pH to optimal range (6.5-7.5).`,
        simple: `खूप आम्लयुक्त माती आहे. चुना 2-3 टन प्रति एकर टाका. / Soil is too acidic. Add lime 2-3 bags per acre.`,
        icon: '🔴'
      })
    } else if (parameters.ph < 6.0) {
      recommendations.push({
        priority: 'high',
        type: 'action',
        parameter: 'pH',
        technical: `Soil is moderately acidic (pH ${parameters.ph}). Apply 1-2 tons/acre agricultural lime before planting season.`,
        simple: `माती थोडी आम्लयुक्त आहे. चुना 1-2 टन टाका. / Soil is slightly acidic. Add lime 1-2 bags per acre.`,
        icon: '🟡'
      })
    } else if (parameters.ph > 8.5) {
      recommendations.push({
        priority: 'critical',
        type: 'action',
        parameter: 'pH',
        technical: `Soil is highly alkaline (pH ${parameters.ph}). Apply gypsum (CaSO₄) at 1-2 tons/acre or elemental sulfur at 200-400 kg/acre.`,
        simple: `खूप क्षारीय माती आहे. जिप्सम 1-2 टन किंवा गंधक टाका. / Soil is too alkaline. Add gypsum 1-2 tons or sulfur.`,
        icon: '🔴'
      })
    } else if (parameters.ph > 8.0) {
      recommendations.push({
        priority: 'high',
        type: 'action',
        parameter: 'pH',
        technical: `Soil is moderately alkaline (pH ${parameters.ph}). Apply gypsum at 500-1000 kg/acre to lower pH.`,
        simple: `माती थोडी क्षारीय आहे. जिप्सम 500 किलो-1 टन टाका. / Soil is slightly alkaline. Add gypsum 500kg-1 ton.`,
        icon: '🟡'
      })
    } else if (parameters.ph >= 6.5 && parameters.ph <= 7.5) {
      recommendations.push({
        priority: 'optimal',
        type: 'optimal',
        parameter: 'pH',
        technical: `pH is optimal for grape cultivation (${parameters.ph}). No correction needed.`,
        simple: `द्राक्षासाठी योग्य pH आहे. / pH is perfect for grapes.`,
        icon: '✅'
      })
    } else {
      recommendations.push({
        priority: 'low',
        type: 'watch',
        parameter: 'pH',
        technical: `pH is acceptable (${parameters.ph}) but monitor regularly. Optimal range is 6.5-7.5.`,
        simple: `pH ठीक आहे पण लक्ष ठेवा. / pH is okay, keep watching.`,
        icon: '⚠️'
      })
    }
  }

  // EC (Salinity) Analysis
  if (parameters.ec !== undefined) {
    if (parameters.ec >= 4.0) {
      recommendations.push({
        priority: 'critical',
        type: 'action',
        parameter: 'EC',
        technical: `Very high salinity (EC ${parameters.ec} dS/m). Immediate leaching irrigation required. Apply 150% of normal water quantity to flush salts.`,
        simple: `खूप मीठ आहे मातीत. लगेच धुवाईसाठी पाणी द्या. / Too much salt. Give heavy watering now to wash it out.`,
        icon: '🔴'
      })
    } else if (parameters.ec >= 2.0) {
      recommendations.push({
        priority: 'high',
        type: 'action',
        parameter: 'EC',
        technical: `Moderate salt buildup (EC ${parameters.ec} dS/m). Schedule leaching irrigation with 120% of normal water quantity.`,
        simple: `माती मीठ वाढत आहे. जास्त पाणी देऊन धुवा. / Salt is building up. Give extra watering to clean soil.`,
        icon: '🟡'
      })
    } else if (parameters.ec >= 1.5) {
      recommendations.push({
        priority: 'moderate',
        type: 'watch',
        parameter: 'EC',
        technical: `EC is slightly elevated (${parameters.ec} dS/m). Monitor irrigation water quality and consider occasional leaching.`,
        simple: `माती थोडी मीठ होत आहे. लक्ष ठेवा. / Soil getting a bit salty. Keep an eye on it.`,
        icon: '⚠️'
      })
    } else {
      recommendations.push({
        priority: 'optimal',
        type: 'optimal',
        parameter: 'EC',
        technical: `Salinity is in optimal range (EC ${parameters.ec} dS/m). Soil health is good.`,
        simple: `मीठपणा योग्य आहे. माती चांगली आहे. / Salinity is good. Soil is healthy.`,
        icon: '✅'
      })
    }
  }

  // Nitrogen Analysis
  if (parameters.nitrogen !== undefined) {
    if (parameters.nitrogen < 150) {
      recommendations.push({
        priority: 'high',
        type: 'action',
        parameter: 'Nitrogen',
        technical: `Low nitrogen (${parameters.nitrogen} ppm). Apply urea at 25-30 kg/acre or well-decomposed compost at 2-3 tons/acre.`,
        simple: `नायट्रोजन कमी आहे. युरिया 25-30 किलो किंवा खत 2-3 टन टाका. / Nitrogen is low. Add urea 25-30 kg or compost.`,
        icon: '🟡'
      })
    } else if (parameters.nitrogen > 400) {
      recommendations.push({
        priority: 'moderate',
        type: 'action',
        parameter: 'Nitrogen',
        technical: `Excess nitrogen (${parameters.nitrogen} ppm). Reduce nitrogen fertilizers to prevent soft vegetative growth and disease susceptibility.`,
        simple: `नायट्रोजन जास्त आहे. युरिया कमी करा. / Too much nitrogen. Reduce urea application.`,
        icon: '⚠️'
      })
    } else {
      recommendations.push({
        priority: 'optimal',
        type: 'optimal',
        parameter: 'Nitrogen',
        technical: `Nitrogen is in adequate range (${parameters.nitrogen} ppm). Maintain current fertilization practices.`,
        simple: `नायट्रोजन योग्य आहे. सध्याचे खत चालू ठेवा. / Nitrogen is good. Continue same fertilizer.`,
        icon: '✅'
      })
    }
  }

  // Phosphorus Analysis (with pH interaction)
  if (parameters.phosphorus !== undefined) {
    const highPH = parameters.ph !== undefined && parameters.ph > 8.0

    if (parameters.phosphorus < 20) {
      if (highPH) {
        recommendations.push({
          priority: 'high',
          type: 'action',
          parameter: 'Phosphorus',
          technical: `Low phosphorus (${parameters.phosphorus} ppm) with high pH reduces P availability. First correct pH with gypsum, then apply DAP at 50-60 kg/acre.`,
          simple: `फॉस्फरस कमी आणि pH जास्त. प्रथम pH दुरुस्त करा नंतर डीएपी द्या. / Phosphorus low and pH high. Fix pH first, then add DAP.`,
          icon: '🔴'
        })
      } else {
        recommendations.push({
          priority: 'high',
          type: 'action',
          parameter: 'Phosphorus',
          technical: `Low phosphorus (${parameters.phosphorus} ppm). Apply DAP or SSP at 50-60 kg/acre before flowering stage.`,
          simple: `फॉस्फरस कमी आहे. डीएपी 50-60 किलो प्रति एकर टाका. / Phosphorus is low. Add DAP 50-60 kg per acre.`,
          icon: '🟡'
        })
      }
    } else if (parameters.phosphorus > 80) {
      recommendations.push({
        priority: 'low',
        type: 'savings',
        parameter: 'Phosphorus',
        technical: `High phosphorus (${parameters.phosphorus} ppm). You can skip phosphate fertilizers this season. Potential savings: ₹15,000-20,000 per acre.`,
        simple: `फॉस्फरस जास्त आहे. यावर्षी डीएपी वाचवा. ₹15,000-20,000 बचत होईल. / Phosphorus is high. Skip DAP this year. Save ₹15,000-20,000.`,
        icon: '💰'
      })
    } else {
      recommendations.push({
        priority: 'optimal',
        type: 'optimal',
        parameter: 'Phosphorus',
        technical: `Phosphorus is adequate (${parameters.phosphorus} ppm). Apply maintenance dose of 30-40 kg/acre DAP.`,
        simple: `फॉस्फरस योग्य आहे. कायम ठेवण्यासाठी 30-40 किलो डीएपी द्या. / Phosphorus is good. Give 30-40 kg DAP to maintain.`,
        icon: '✅'
      })
    }
  }

  // Potassium Analysis
  if (parameters.potassium !== undefined) {
    if (parameters.potassium < 200) {
      recommendations.push({
        priority: 'high',
        type: 'action',
        parameter: 'Potassium',
        technical: `Low potassium (${parameters.potassium} ppm). Apply muriate of potash (MOP) at 40-50 kg/acre. Critical for fruit quality and disease resistance.`,
        simple: `पोटॅश कमी आहे. एमओपी 40-50 किलो टाका. फळाच्या गुणवत्तेसाठी महत्वाचे. / Potash is low. Add MOP 40-50 kg. Important for fruit quality.`,
        icon: '🟡'
      })
    } else if (parameters.potassium > 500) {
      recommendations.push({
        priority: 'low',
        type: 'savings',
        parameter: 'Potassium',
        technical: `Potassium is abundant (${parameters.potassium} ppm). Reduce or skip potash application. Potential savings: ₹8,000-12,000 per acre.`,
        simple: `पोटॅश जास्त आहे. एमओपी वाचवा. ₹8,000-12,000 बचत. / Potash is high. Skip MOP. Save ₹8,000-12,000.`,
        icon: '💰'
      })
    } else {
      recommendations.push({
        priority: 'optimal',
        type: 'optimal',
        parameter: 'Potassium',
        technical: `Potassium is in optimal range (${parameters.potassium} ppm). Continue current potash application.`,
        simple: `पोटॅश योग्य आहे. सध्याचे खत चालू ठेवा. / Potash is good. Continue same fertilizer.`,
        icon: '✅'
      })
    }
  }

  // Organic Matter Analysis
  if (parameters.organicMatter !== undefined) {
    if (parameters.organicMatter < 1.0) {
      recommendations.push({
        priority: 'high',
        type: 'action',
        parameter: 'Organic Matter',
        technical: `Very low organic matter (${parameters.organicMatter}%). Apply 5-7 tons/acre well-decomposed FYM or compost to improve soil health.`,
        simple: `सेंद्रिय पदार्थ फार कमी आहे. शेणखत किंवा कंपोस्ट 5-7 टन टाका. / Organic matter very low. Add compost 5-7 tons.`,
        icon: '🟡'
      })
    } else if (parameters.organicMatter > 3.0) {
      recommendations.push({
        priority: 'optimal',
        type: 'optimal',
        parameter: 'Organic Matter',
        technical: `Excellent organic matter content (${parameters.organicMatter}%). Soil structure and microbial activity are healthy.`,
        simple: `सेंद्रिय पदार्थ उत्तम आहे. माती चांगली आहे. / Organic matter excellent. Soil is healthy.`,
        icon: '✅'
      })
    } else {
      recommendations.push({
        priority: 'moderate',
        type: 'watch',
        parameter: 'Organic Matter',
        technical: `Organic matter is moderate (${parameters.organicMatter}%). Continue adding 2-3 tons/acre compost annually.`,
        simple: `सेंद्रिय पदार्थ ठीक आहे. दरवर्षी 2-3 टन खत टाका. / Organic matter okay. Add 2-3 tons compost yearly.`,
        icon: '⚠️'
      })
    }
  }

  // Micronutrient Analysis (brief checks)
  if (parameters.zinc !== undefined && parameters.zinc < 1.0) {
    recommendations.push({
      priority: 'moderate',
      type: 'action',
      parameter: 'Zinc',
      technical: `Low zinc (${parameters.zinc} ppm). Apply zinc sulfate at 10-15 kg/acre or foliar spray of 0.5% ZnSO₄.`,
      simple: `झिंक कमी आहे. झिंक सल्फेट 10-15 किलो किंवा पानांवर फवारा. / Zinc is low. Add zinc sulfate 10-15 kg.`,
      icon: '⚠️'
    })
  }

  if (parameters.boron !== undefined && parameters.boron < 0.5) {
    recommendations.push({
      priority: 'moderate',
      type: 'action',
      parameter: 'Boron',
      technical: `Low boron (${parameters.boron} ppm). Apply borax at 5-10 kg/acre. Essential for fruit set and development.`,
      simple: `बोरॉन कमी आहे. बोरॅक्स 5-10 किलो टाका. फळधारणेसाठी गरजेचे. / Boron is low. Add borax 5-10 kg. Important for fruit.`,
      icon: '⚠️'
    })
  }

  if (parameters.iron !== undefined && parameters.iron < 5.0) {
    recommendations.push({
      priority: 'moderate',
      type: 'action',
      parameter: 'Iron',
      technical: `Low iron (${parameters.iron} ppm). Apply ferrous sulfate at 20-25 kg/acre or foliar spray chelated iron.`,
      simple: `लोह कमी आहे. फेरस सल्फेट 20-25 किलो किंवा पानांवर फवारा. / Iron is low. Add ferrous sulfate.`,
      icon: '⚠️'
    })
  }

  // Sort recommendations by priority
  const priorityOrder: Record<RecommendationPriority, number> = {
    critical: 0,
    high: 1,
    moderate: 2,
    low: 3,
    optimal: 4
  }

  return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
}

/**
 * Generate recommendations for petiole test results
 */
export function generatePetioleTestRecommendations(
  parameters: PetioleTestParameters
): Recommendation[] {
  const recommendations: Recommendation[] = []

  // Total Nitrogen Analysis
  if (parameters.total_nitrogen !== undefined) {
    if (parameters.total_nitrogen < 2.0) {
      recommendations.push({
        priority: 'high',
        type: 'action',
        parameter: 'Nitrogen',
        technical: `Low petiole nitrogen (${parameters.total_nitrogen}%). Apply immediate foliar spray of urea (1-2%) or increase fertigation nitrogen by 20%.`,
        simple: `नायट्रोजन कमी आहे. युरिया पानांवर फवारा किंवा फर्टिगेशनमध्ये वाढवा. / Nitrogen low. Spray urea on leaves or increase in drip.`,
        icon: '🟡'
      })
    } else if (parameters.total_nitrogen > 4.0) {
      recommendations.push({
        priority: 'moderate',
        type: 'action',
        parameter: 'Nitrogen',
        technical: `Excess petiole nitrogen (${parameters.total_nitrogen}%). Reduce nitrogen fertilization to prevent excessive vegetative growth and disease risk.`,
        simple: `नायट्रोजन जास्त आहे. युरिया कमी करा, नाहीतर रोग येऊ शकतो. / Nitrogen too high. Reduce urea to avoid diseases.`,
        icon: '⚠️'
      })
    } else {
      recommendations.push({
        priority: 'optimal',
        type: 'optimal',
        parameter: 'Nitrogen',
        technical: `Petiole nitrogen is optimal (${parameters.total_nitrogen}%). Continue current nitrogen management.`,
        simple: `नायट्रोजन योग्य आहे. सध्याचे खत चालू ठेवा. / Nitrogen is good. Continue same fertilizer.`,
        icon: '✅'
      })
    }
  }

  // Phosphorus Analysis
  if (parameters.phosphorus !== undefined) {
    if (parameters.phosphorus < 0.2) {
      recommendations.push({
        priority: 'high',
        type: 'action',
        parameter: 'Phosphorus',
        technical: `Low petiole phosphorus (${parameters.phosphorus}%). Apply phosphoric acid through fertigation at 5-7 liters/acre or foliar spray of DAP (2%).`,
        simple: `फॉस्फरस कमी आहे. फॉस्फोरिक ऍसिड किंवा डीएपी फवारा द्या. / Phosphorus low. Give phosphoric acid or spray DAP.`,
        icon: '🟡'
      })
    } else if (parameters.phosphorus > 0.6) {
      recommendations.push({
        priority: 'low',
        type: 'savings',
        parameter: 'Phosphorus',
        technical: `High petiole phosphorus (${parameters.phosphorus}%). Plant is well-supplied. Reduce phosphorus fertilization.`,
        simple: `फॉस्फरस जास्त आहे. डीएपी कमी करा, पैसे वाचवा. / Phosphorus high. Reduce DAP, save money.`,
        icon: '💰'
      })
    } else {
      recommendations.push({
        priority: 'optimal',
        type: 'optimal',
        parameter: 'Phosphorus',
        technical: `Petiole phosphorus is adequate (${parameters.phosphorus}%). Maintain current phosphorus application.`,
        simple: `फॉस्फरस योग्य आहे. सध्याचे खत चालू ठेवा. / Phosphorus is good. Continue same fertilizer.`,
        icon: '✅'
      })
    }
  }

  // Potassium Analysis
  if (parameters.potassium !== undefined) {
    if (parameters.potassium < 1.5) {
      recommendations.push({
        priority: 'critical',
        type: 'action',
        parameter: 'Potassium',
        technical: `Very low petiole potassium (${parameters.potassium}%). Immediate action required. Apply potassium sulfate through fertigation at 15-20 kg/acre. Critical for fruit quality and color development.`,
        simple: `पोटॅश फार कमी आहे. लगेच पोटॅश सल्फेट 15-20 किलो द्या. फळाच्या रंगासाठी महत्वाचे. / Potash very low. Give potash sulfate 15-20 kg now. Important for fruit color.`,
        icon: '🔴'
      })
    } else if (parameters.potassium < 2.0) {
      recommendations.push({
        priority: 'high',
        type: 'action',
        parameter: 'Potassium',
        technical: `Low petiole potassium (${parameters.potassium}%). Increase potassium fertigation by 30%. Critical stage for berry development.`,
        simple: `पोटॅश कमी आहे. फर्टिगेशनमध्ये पोटॅश वाढवा. / Potash low. Increase potash in drip system.`,
        icon: '🟡'
      })
    } else if (parameters.potassium > 3.5) {
      recommendations.push({
        priority: 'moderate',
        type: 'watch',
        parameter: 'Potassium',
        technical: `High petiole potassium (${parameters.potassium}%). May interfere with calcium and magnesium uptake. Monitor and adjust if needed.`,
        simple: `पोटॅश जास्त आहे. कॅल्शियम शोषणात अडथळा येऊ शकतो. / Potash high. May affect calcium uptake.`,
        icon: '⚠️'
      })
    } else {
      recommendations.push({
        priority: 'optimal',
        type: 'optimal',
        parameter: 'Potassium',
        technical: `Petiole potassium is optimal (${parameters.potassium}%). Excellent for fruit quality and sugar development.`,
        simple: `पोटॅश योग्य आहे. फळाच्या गुणवत्तेसाठी उत्तम. / Potash is perfect. Great for fruit quality.`,
        icon: '✅'
      })
    }
  }

  // Calcium Analysis
  if (parameters.calcium !== undefined) {
    if (parameters.calcium < 1.5) {
      recommendations.push({
        priority: 'high',
        type: 'action',
        parameter: 'Calcium',
        technical: `Low petiole calcium (${parameters.calcium}%). Apply calcium nitrate through fertigation at 10-15 kg/acre or foliar spray. Low calcium increases powdery mildew susceptibility.`,
        simple: `कॅल्शियम कमी आहे. कॅल्शियम नायट्रेट द्या. कमी कॅल्शियममुळे रोग वाढतात. / Calcium low. Give calcium nitrate. Low calcium increases diseases.`,
        icon: '🟡'
      })
    } else if (parameters.calcium > 3.5) {
      recommendations.push({
        priority: 'optimal',
        type: 'optimal',
        parameter: 'Calcium',
        technical: `Excellent petiole calcium (${parameters.calcium}%). Strong cell walls and good disease resistance.`,
        simple: `कॅल्शियम उत्तम आहे. रोगप्रतिकारशक्ती चांगली. / Calcium excellent. Disease resistance good.`,
        icon: '✅'
      })
    } else {
      recommendations.push({
        priority: 'optimal',
        type: 'optimal',
        parameter: 'Calcium',
        technical: `Petiole calcium is adequate (${parameters.calcium}%). Maintain current calcium management.`,
        simple: `कॅल्शियम योग्य आहे. सध्याचे खत चालू ठेवा. / Calcium is good. Continue same fertilizer.`,
        icon: '✅'
      })
    }
  }

  // Magnesium Analysis
  if (parameters.magnesium !== undefined) {
    if (parameters.magnesium < 0.3) {
      recommendations.push({
        priority: 'high',
        type: 'action',
        parameter: 'Magnesium',
        technical: `Low petiole magnesium (${parameters.magnesium}%). Apply magnesium sulfate (Epsom salt) at 10-15 kg/acre or foliar spray at 1%. Essential for chlorophyll production.`,
        simple: `मॅग्नेशियम कमी आहे. एप्सम सॉल्ट 10-15 किलो द्या. पानांच्या हरेपणासाठी गरजेचे. / Magnesium low. Give Epsom salt 10-15 kg. Needed for green leaves.`,
        icon: '🟡'
      })
    } else if (parameters.magnesium > 1.0) {
      recommendations.push({
        priority: 'optimal',
        type: 'optimal',
        parameter: 'Magnesium',
        technical: `Excellent petiole magnesium (${parameters.magnesium}%). Photosynthesis and chlorophyll production are optimal.`,
        simple: `मॅग्नेशियम उत्तम आहे. प्रकाशसंश्लेषण चांगले चालू आहे. / Magnesium excellent. Photosynthesis working well.`,
        icon: '✅'
      })
    } else {
      recommendations.push({
        priority: 'optimal',
        type: 'optimal',
        parameter: 'Magnesium',
        technical: `Petiole magnesium is adequate (${parameters.magnesium}%). Continue current magnesium application.`,
        simple: `मॅग्नेशियम योग्य आहे. सध्याचे खत चालू ठेवा. / Magnesium is good. Continue same fertilizer.`,
        icon: '✅'
      })
    }
  }

  // Micronutrients (brief checks)
  if (parameters.zinc !== undefined && parameters.zinc < 20) {
    recommendations.push({
      priority: 'moderate',
      type: 'action',
      parameter: 'Zinc',
      technical: `Low petiole zinc (${parameters.zinc} ppm). Apply foliar spray of zinc sulfate (0.5%) during active growth stages.`,
      simple: `झिंक कमी आहे. पानांवर झिंक फवारा द्या. / Zinc low. Spray zinc on leaves.`,
      icon: '⚠️'
    })
  }

  if (parameters.boron !== undefined && parameters.boron < 30) {
    recommendations.push({
      priority: 'moderate',
      type: 'action',
      parameter: 'Boron',
      technical: `Low petiole boron (${parameters.boron} ppm). Apply borax foliar spray (0.1-0.2%) before and after flowering. Critical for fruit set.`,
      simple: `बोरॉन कमी आहे. फुलण्यापूर्वी आणि नंतर फवारा द्या. फळधारणेसाठी महत्वाचे. / Boron low. Spray before and after flowering. Important for fruit set.`,
      icon: '⚠️'
    })
  }

  if (parameters.ferrous !== undefined && parameters.ferrous < 50) {
    recommendations.push({
      priority: 'moderate',
      type: 'action',
      parameter: 'Iron',
      technical: `Low petiole iron (${parameters.ferrous} ppm). Apply chelated iron foliar spray or through fertigation. Symptoms: yellowing between leaf veins.`,
      simple: `लोह कमी आहे. पानांवर किंवा ड्रिपमध्ये लोह द्या. पाने पिवळी पडू शकतात. / Iron low. Spray on leaves. Leaves may turn yellow.`,
      icon: '⚠️'
    })
  }

  // Sort by priority
  const priorityOrder: Record<RecommendationPriority, number> = {
    critical: 0,
    high: 1,
    moderate: 2,
    low: 3,
    optimal: 4
  }

  return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
}

/**
 * Get priority color for UI display
 */
export function getPriorityColor(priority: RecommendationPriority): string {
  const colors: Record<RecommendationPriority, string> = {
    critical: 'text-red-600 bg-red-50 border-red-200',
    high: 'text-orange-600 bg-orange-50 border-orange-200',
    moderate: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    low: 'text-blue-600 bg-blue-50 border-blue-200',
    optimal: 'text-green-600 bg-green-50 border-green-200'
  }
  return colors[priority]
}

/**
 * Get priority label for display
 */
export function getPriorityLabel(priority: RecommendationPriority): string {
  const labels: Record<RecommendationPriority, string> = {
    critical: 'Urgent Action Required',
    high: 'High Priority',
    moderate: 'Monitor',
    low: 'Suggestion',
    optimal: 'Optimal'
  }
  return labels[priority]
}
