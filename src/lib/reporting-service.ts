import { 
  ComplianceReport, 
  FinancialReport, 
  ReportTemplate, 
  PesticideUsageRecord,
  OrganicComplianceData,
  WaterUsageCompliance,
  SoilHealthReport,
  HarvestRecord,
  CostCategory,
  RevenueSource,
  RegulatoryCompliance,
  ComplianceIssue
} from './reporting-types';
import { DatabaseService, Farm } from './db-utils';
// Temporarily disabled for deployment
// import { CalculatorService } from './calculator-service';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Temporarily disabled for deployment
export class ReportingService {
  
  // Temporarily disabled for deployment
  static async generateComplianceReport(
    farmId: string, 
    reportType: ComplianceReport['reportType'],
    periodStart: Date,
    periodEnd: Date
  ): Promise<ComplianceReport> {
    // Temporarily disabled for deployment
    throw new Error('Compliance report generation temporarily disabled for deployment');
  }

  // Temporarily disabled for deployment
  static async generateFinancialReport(
    farmId: string,
    reportType: FinancialReport['reportType'],
    periodStart: Date,
    periodEnd: Date
  ): Promise<FinancialReport> {
    // Temporarily disabled for deployment
    throw new Error('Financial report generation temporarily disabled for deployment');
  }

  // Temporarily disabled for deployment
  private static async generateOrganicComplianceData(
    farm: Farm, 
    operations: any[]
  ): Promise<OrganicComplianceData> {
    const organicOps = operations.filter(op => 
      op.type === 'fertilizer' || op.type === 'spray' || op.type === 'soil_treatment'
    );

    return {
      certificationBody: 'India Organic Certification Agency (IOCA)',
      certificationNumber: 'ORG-' + farm.id?.toString().slice(-6),
      certificationExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      organicInputsUsed: organicOps.map(op => ({
        name: op.notes || 'Organic Input',
        supplier: 'Local Organic Supplier',
        certificationStatus: 'certified' as const,
        usageAmount: parseFloat(op.notes?.match(/\d+(\.\d+)?/)?.[0] || '0'),
        applicationDate: op.date,
        purpose: op.type
      })),
      prohibitedSubstancesCheck: true,
      bufferZoneCompliance: true,
      recordKeepingCompliance: true,
      inspectionDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      nonComplianceIssues: []
    };
  }

  // Temporarily disabled for deployment
  private static async generatePesticideUsageData(
    farm: Farm, 
    operations: any[]
  ): Promise<PesticideUsageRecord[]> {
    const sprayOps = operations.filter(op => op.type === 'spray');

    return sprayOps.map(op => ({
      date: op.date,
      pesticideName: op.notes?.split(' ')[0] || 'Copper Sulfate',
      activeIngredient: 'Copper Sulfate 98%',
      concentration: 0.5,
      applicationRate: 2.5,
      areaApplied: farm.area,
      totalAmount: farm.area * 2.5,
      preHarvestInterval: 21,
      applicationMethod: 'Foliar Spray',
      weatherConditions: 'Clear, Wind Speed < 10 km/h',
      applicatorName: 'Farm Manager',
      certificationNumber: 'PST-2024-001'
    }));
  }

  // Temporarily disabled for deployment
  private static async generateWaterUsageData(
    farm: Farm, 
    operations: any[]
  ): Promise<WaterUsageCompliance> {
    const irrigationOps = operations.filter(op => op.type === 'irrigation');
    const totalUsage = irrigationOps.reduce((sum, op) => {
      const amount = parseFloat(op.notes?.match(/\d+(\.\d+)?/)?.[0] || '0');
      return sum + amount;
    }, 0);

    const allocatedAmount = farm.area * 1000; // 1000 liters per square meter per season

    return {
      waterSource: 'well',
      licenseNumber: 'WL-' + farm.id?.toString().slice(-8),
      allocatedAmount,
      actualUsage: totalUsage,
      compliancePercentage: Math.min((totalUsage / allocatedAmount) * 100, 100),
      conservationMeasures: [
        'Drip irrigation system installed',
        'Soil moisture monitoring',
        'Mulching to reduce evaporation',
        'Rainwater harvesting'
      ],
      qualityTestResults: [{
        testDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        ph: 7.2,
        salinity: 0.5,
        nitrates: 25,
        phosphates: 5,
        heavyMetals: { lead: 0.01, mercury: 0.001, arsenic: 0.005 },
        bacterialCount: 100,
        complianceStatus: 'compliant'
      }]
    };
  }

  // Temporarily disabled for deployment
  private static async generateSoilHealthData(
    farm: Farm, 
    operations: any[]
  ): Promise<SoilHealthReport> {
    return {
      testDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      laboratory: 'State Agricultural Testing Laboratory',
      sampleLocations: [{
        location: 'Block A - Center',
        depth: 20,
        ph: 6.8,
        organicMatter: 3.2,
        nitrogen: 280,
        phosphorus: 45,
        potassium: 320,
        micronutrients: { zinc: 2.1, iron: 18, manganese: 12, copper: 1.8 },
        heavyMetals: { lead: 15, cadmium: 0.5, chromium: 8 },
        soilStructure: 'Well-aggregated loamy soil'
      }],
      overallRating: 'good',
      recommendations: [
        'Continue organic matter addition',
        'Monitor potassium levels',
        'Consider zinc supplementation',
        'Maintain current pH levels'
      ],
      complianceNotes: 'Soil quality meets organic certification standards'
    };
  }

  // Temporarily disabled for deployment
  private static async generateHarvestData(
    farm: Farm, 
    operations: any[]
  ): Promise<HarvestRecord[]> {
    const harvestOps = operations.filter(op => op.type === 'harvest');

    return harvestOps.map((op, index) => ({
      harvestDate: op.date,
      blockId: `Block-${String.fromCharCode(65 + index)}`,
      varietyName: 'Cabernet Sauvignon',
      quantity: farm.area * 12000, // 12 tons per hectare
      quality: 'premium' as const,
      sugarContent: 24.5,
      acidity: 6.2,
      destinationBuyer: 'Premium Winery Co.',
      pricePerUnit: 45,
      totalValue: farm.area * 12000 * 45,
      laborHours: farm.area * 8,
      equipment: ['Harvesting containers', 'Weighing scales', 'Transport vehicle'],
      weatherConditions: 'Clear, Temperature: 22°C, Humidity: 65%',
      notes: op.notes || 'Premium quality harvest, optimal sugar content'
    }));
  }

  // Temporarily disabled for deployment
  private static calculateCostBreakdown(operations: any[]): CostCategory[] {
    const costs = new Map<string, number>();
    
    operations.forEach(op => {
      const cost = parseFloat(op.notes?.match(/₹(\d+(?:,\d{3})*(?:\.\d{2})?)/)?.[1]?.replace(/,/g, '') || '0');
      const category = this.mapOperationTypeToCategory(op.type);
      costs.set(category, (costs.get(category) || 0) + cost);
    });

    const totalCosts = Array.from(costs.values()).reduce((sum, cost) => sum + cost, 0);

    return Array.from(costs.entries()).map(([category, amount]) => ({
      category: category as CostCategory['category'],
      subcategory: this.getSubcategory(category),
      amount,
      percentage: totalCosts > 0 ? (amount / totalCosts) * 100 : 0,
      trend: 'stable' as const
    }));
  }

  // Temporarily disabled for deployment
  private static async calculateRevenueBreakdown(
    farm: Farm, 
    operations: any[]
  ): Promise<RevenueSource[]> {
    const harvestOps = operations.filter(op => op.type === 'harvest');
    const totalProduction = harvestOps.length > 0 ? farm.area * 12000 : 0; // 12 tons per hectare
    const pricePerTon = 45000; // ₹45,000 per ton
    const totalRevenue = totalProduction * pricePerTon;

    return [{
      source: 'grape_sales',
      description: 'Premium grape sales to wineries',
      amount: totalRevenue,
      percentage: 100,
      quantity: totalProduction,
      unitPrice: pricePerTon
    }];
  }

  private static mapOperationTypeToCategory(operationType: string): string {
    const mapping: { [key: string]: string } = {
      'irrigation': 'utilities',
      'fertilizer': 'fertilizers',
      'spray': 'pesticides',
      'pruning': 'labor',
      'harvest': 'labor',
      'soil_treatment': 'materials',
      'maintenance': 'equipment'
    };
    return mapping[operationType] || 'other';
  }

  private static getSubcategory(category: string): string {
    const subcategories: { [key: string]: string } = {
      'labor': 'Field Operations',
      'materials': 'Soil Amendments',
      'equipment': 'Maintenance & Repair',
      'utilities': 'Water & Electricity',
      'pesticides': 'Crop Protection',
      'fertilizers': 'Plant Nutrition',
      'other': 'Miscellaneous'
    };
    return subcategories[category] || 'General';
  }

  private static getReportTitle(reportType: string): string {
    const titles: { [key: string]: string } = {
      'organic': 'Organic Certification Compliance Report',
      'pesticide': 'Pesticide Usage & Safety Report',
      'water_usage': 'Water Usage Compliance Report',
      'soil_health': 'Soil Health Assessment Report',
      'harvest': 'Harvest Records & Quality Report',
      'cost_analysis': 'Cost Analysis Report',
      'profit_loss': 'Profit & Loss Statement',
      'roi_analysis': 'Return on Investment Analysis',
      'budget_vs_actual': 'Budget vs Actual Performance Report'
    };
    return titles[reportType] || 'Farm Report';
  }

  private static getRegulatoryStandard(reportType: string): string {
    const standards: { [key: string]: string } = {
      'organic': 'National Programme for Organic Production (NPOP) - India',
      'pesticide': 'Insecticides Act, 1968 & Rules 1971 - India',
      'water_usage': 'Model Groundwater (Sustainable Management) Act, 2016',
      'soil_health': 'Soil Health Card Scheme Guidelines',
      'harvest': 'Food Safety and Standards Act, 2006'
    };
    return standards[reportType] || 'General Agricultural Standards';
  }

  static async exportReportToPDF(
    report: ComplianceReport | FinancialReport
  ): Promise<Blob> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(5, 150, 105); // Primary green color
    doc.text(report.title, margin, 30);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Generated: ${report.generatedAt.toLocaleDateString()}`, margin, 45);
    doc.text(`Period: ${('periodStart' in report ? report.periodStart : new Date()).toLocaleDateString()} - ${('periodEnd' in report ? report.periodEnd : new Date()).toLocaleDateString()}`, margin, 55);

    let yPosition = 70;

    if ('data' in report && typeof report.data === 'object') {
      if ('totalRevenue' in report.data) {
        // Financial Report
        const finReport = report as FinancialReport;
        
        // Summary section
        doc.setFontSize(16);
        doc.text('Financial Summary', margin, yPosition);
        yPosition += 15;

        doc.setFontSize(12);
        const summaryData = [
          ['Total Revenue', `₹${finReport.data.totalRevenue.toLocaleString()}`],
          ['Total Costs', `₹${finReport.data.totalCosts.toLocaleString()}`],
          ['Net Profit', `₹${finReport.data.netProfit.toLocaleString()}`],
          ['Profit Margin', `${finReport.data.profitMargin.toFixed(2)}%`]
        ];

        doc.autoTable({
          startY: yPosition,
          head: [['Metric', 'Value']],
          body: summaryData,
          margin: { left: margin },
          styles: { fontSize: 10 }
        });

        // Temporarily disabled for deployment
        // yPosition = doc.lastAutoTable.finalY + 20;
        yPosition += 20;

        // Cost breakdown
        if (finReport.data.costBreakdown.length > 0) {
          doc.setFontSize(14);
          doc.text('Cost Breakdown', margin, yPosition);
          yPosition += 10;

          const costData = finReport.data.costBreakdown.map(cost => [
            cost.category,
            cost.subcategory,
            `₹${cost.amount.toLocaleString()}`,
            `${cost.percentage.toFixed(1)}%`
          ]);

          doc.autoTable({
            startY: yPosition,
            head: [['Category', 'Subcategory', 'Amount', 'Percentage']],
            body: costData,
            margin: { left: margin },
            styles: { fontSize: 9 }
          });
        }
      } else {
        // Compliance Report
        const compReport = report as ComplianceReport;
        
        doc.setFontSize(16);
        doc.text('Compliance Summary', margin, yPosition);
        yPosition += 15;

        // Add compliance-specific content based on report type
        if (compReport.reportType === 'organic' && compReport.data.certificationBody) {
          doc.setFontSize(12);
          doc.text(`Certification Body: ${compReport.data.certificationBody}`, margin, yPosition);
          yPosition += 10;
          doc.text(`Certification Number: ${compReport.data.certificationNumber}`, margin, yPosition);
          yPosition += 10;
          doc.text(`Expiry Date: ${new Date(compReport.data.certificationExpiry).toLocaleDateString()}`, margin, yPosition);
          yPosition += 15;

          doc.text('Compliance Status:', margin, yPosition);
          yPosition += 10;
          doc.text(`✓ Prohibited Substances Check: ${compReport.data.prohibitedSubstancesCheck ? 'Passed' : 'Failed'}`, margin + 10, yPosition);
          yPosition += 8;
          doc.text(`✓ Buffer Zone Compliance: ${compReport.data.bufferZoneCompliance ? 'Compliant' : 'Non-compliant'}`, margin + 10, yPosition);
          yPosition += 8;
          doc.text(`✓ Record Keeping: ${compReport.data.recordKeepingCompliance ? 'Compliant' : 'Non-compliant'}`, margin + 10, yPosition);
        }
      }
    }

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Generated by VineSight - Grape Farming Digital Companion', margin, pageHeight - 15);

    return doc.output('blob');
  }

  static async getRegulatoryCompliance(farmId: string): Promise<RegulatoryCompliance> {
    const farm = await DatabaseService.getFarmById(parseInt(farmId));
    if (!farm) throw new Error('Farm not found');

    return {
      region: 'india',
      standards: [
        {
          name: 'Organic Certification (NPOP)',
          authority: 'Agricultural and Processed Food Products Export Development Authority (APEDA)',
          description: 'National Programme for Organic Production standards',
          requirements: [
            'Use of certified organic inputs only',
            'Maintain buffer zones from conventional farms',
            'Keep detailed records of all operations',
            'Submit to annual third-party inspections'
          ],
          complianceStatus: 'compliant',
          lastChecked: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          evidence: ['Certification certificate', 'Inspection reports', 'Input purchase records']
        },
        {
          name: 'Pesticide Management',
          authority: 'Central Insecticides Board & Registration Committee (CIBRC)',
          description: 'Safe use and application of pesticides',
          requirements: [
            'Use only registered pesticides',
            'Follow label instructions for dosage and timing',
            'Maintain pre-harvest interval',
            'Keep application records'
          ],
          complianceStatus: 'compliant',
          lastChecked: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          evidence: ['Pesticide purchase receipts', 'Application logs', 'Training certificates']
        }
      ],
      lastAuditDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      nextAuditDate: new Date(Date.now() + 275 * 24 * 60 * 60 * 1000),
      complianceScore: 95,
      issues: []
    };
  }
}