/**
 * Export Service for VineSight Farm Management System
 * Handles CSV and PDF export functionality for all farm data
 */

import jsPDF from 'jspdf';
import { SupabaseService } from './supabase-service';
import type { Farm } from '@/types/types';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface ExportOptions {
  farmId: number;
  dateRange: {
    from: string;
    to: string;
  };
  includeTypes: string[];
  format: 'csv' | 'pdf';
  reportType: 'operations' | 'financial' | 'compliance' | 'comprehensive';
}

export interface ExportData {
  farm: Farm;
  irrigation: any[];
  spray: any[];
  fertigation: any[];
  harvest: any[];
  expenses: any[];
  calculations: any[];
  soilTests: any[];
  tasks: any[];
}

export class ExportService {
  /**
   * Helper function to ensure autoTable is available on PDF instance
   */
  private static async ensureAutoTable(pdf: jsPDF): Promise<void> {
    if (!(pdf as any).autoTable) {
      try {
        const autoTable = (await import('jspdf-autotable')).default;
        (pdf as any).autoTable = autoTable;
        console.log('AutoTable attached successfully:', typeof (pdf as any).autoTable);
      } catch (error) {
        console.error('Failed to load autoTable:', error);
        throw error;
      }
    }
  }

  /**
   * Main export function - routes to CSV or PDF based on format
   */
  static async exportData(options: ExportOptions): Promise<void> {
    const data = await this.gatherExportData(options);
    
    if (options.format === 'csv') {
      await this.exportToCSV(data, options);
    } else {
      await this.exportToPDF(data, options);
    }
  }

  /**
   * Gather all data for export based on options
   */
  private static async gatherExportData(options: ExportOptions): Promise<ExportData> {
    const { farmId, dateRange, includeTypes } = options;

    // Get farm details
    const farm = await SupabaseService.getFarmById(farmId);
    if (!farm) throw new Error('Farm not found');

    // Initialize data structure
    const data: ExportData = {
      farm,
      irrigation: [],
      spray: [],
      fertigation: [],
      harvest: [],
      expenses: [],
      calculations: [],
      soilTests: [],
      tasks: []
    };

    // Fetch data based on included types
    if (includeTypes.includes('irrigation')) {
      const allRecords = await SupabaseService.getIrrigationRecords(farmId);
      data.irrigation = this.filterByDateRange(allRecords, dateRange);
    }

    if (includeTypes.includes('spray')) {
      const allRecords = await SupabaseService.getSprayRecords(farmId);
      data.spray = this.filterByDateRange(allRecords, dateRange);
    }

    if (includeTypes.includes('fertigation')) {
      const allRecords = await SupabaseService.getFertigationRecords(farmId);
      data.fertigation = this.filterByDateRange(allRecords, dateRange);
    }

    if (includeTypes.includes('harvest')) {
      const allRecords = await SupabaseService.getHarvestRecords(farmId);
      data.harvest = this.filterByDateRange(allRecords, dateRange);
    }

    if (includeTypes.includes('expenses')) {
      const allRecords = await SupabaseService.getExpenseRecords(farmId);
      data.expenses = this.filterByDateRange(allRecords, dateRange);
    }

    if (includeTypes.includes('calculations')) {
      const allRecords = await SupabaseService.getCalculationHistory(farmId);
      data.calculations = this.filterByDateRange(allRecords, dateRange);
    }

    if (includeTypes.includes('soilTests')) {
      const allRecords = await SupabaseService.getSoilTestRecords(farmId);
      data.soilTests = this.filterByDateRange(allRecords, dateRange);
    }

    if (includeTypes.includes('tasks')) {
      const allRecords = await SupabaseService.getTaskReminders(farmId);
      data.tasks = this.filterByDateRange(allRecords, dateRange);
    }

    return data;
  }

  /**
   * Filter records by date range
   */
  private static filterByDateRange(records: any[], dateRange: { from: string; to: string }): any[] {
    return records.filter(record => {
      const recordDate = new Date(record.date || record.created_at);
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);
      return recordDate >= fromDate && recordDate <= toDate;
    });
  }

  /**
   * Export data to CSV format
   */
  private static async exportToCSV(data: ExportData, options: ExportOptions): Promise<void> {
    const { reportType, farmId } = options;
    let csvContent = '';

    // Add farm header
    csvContent += `Farm Report - ${data.farm.name}\n`;
    csvContent += `Generated: ${new Date().toLocaleDateString()}\n`;
    csvContent += `Period: ${options.dateRange.from} to ${options.dateRange.to}\n\n`;

    if (reportType === 'operations' || reportType === 'comprehensive') {
      // Irrigation Records
      if (data.irrigation.length > 0) {
        csvContent += 'IRRIGATION RECORDS\n';
        csvContent += 'Date,Duration (hrs),Area (ha),Growth Stage,Moisture Status,System Discharge (L/h),Notes\n';
        data.irrigation.forEach(record => {
          csvContent += `${record.date},${record.duration},${record.area},${record.growth_stage},${record.moisture_status},${record.system_discharge},"${record.notes || ''}"\n`;
        });
        csvContent += '\n';
      }

      // Spray Records
      if (data.spray.length > 0) {
        csvContent += 'SPRAY RECORDS\n';
        csvContent += 'Date,Pest/Disease,Chemical,Dose,Area (ha),Weather,Operator,Notes\n';
        data.spray.forEach(record => {
          csvContent += `${record.date},"${record.pest_disease}","${record.chemical}",${record.dose},${record.area},"${record.weather_conditions}","${record.operator}","${record.notes || ''}"\n`;
        });
        csvContent += '\n';
      }

      // Fertigation Records
      if (data.fertigation.length > 0) {
        csvContent += 'FERTIGATION RECORDS\n';
        csvContent += 'Date,Fertilizer Type,Quantity (kg),Area (ha),Duration (hrs),Concentration,pH,EC,Notes\n';
        data.fertigation.forEach(record => {
          csvContent += `${record.date},"${record.fertilizer_type}",${record.quantity},${record.area},${record.irrigation_duration},${record.concentration || ''},${record.ph_level || ''},${record.ec_level || ''},"${record.notes || ''}"\n`;
        });
        csvContent += '\n';
      }

      // Harvest Records
      if (data.harvest.length > 0) {
        csvContent += 'HARVEST RECORDS\n';
        csvContent += 'Date,Quantity (kg),Grade,Price per kg,Buyer,Total Value,Notes\n';
        data.harvest.forEach(record => {
          const totalValue = record.price_per_kg ? (record.quantity * record.price_per_kg).toFixed(2) : '';
          csvContent += `${record.date},${record.quantity},"${record.grade}",${record.price_per_kg || ''},"${record.buyer || ''}",${totalValue},"${record.notes || ''}"\n`;
        });
        csvContent += '\n';
      }
    }

    if (reportType === 'financial' || reportType === 'comprehensive') {
      // Expense Records
      if (data.expenses.length > 0) {
        csvContent += 'EXPENSE RECORDS\n';
        csvContent += 'Date,Category,Description,Amount,Vendor,Notes\n';
        data.expenses.forEach(record => {
          csvContent += `${record.date},"${record.category}","${record.description}",${record.amount},"${record.vendor || ''}","${record.notes || ''}"\n`;
        });
        csvContent += '\n';
      }
    }

    if (reportType === 'compliance' || reportType === 'comprehensive') {
      // Soil Test Records
      if (data.soilTests.length > 0) {
        csvContent += 'SOIL TEST RECORDS\n';
        csvContent += 'Date,pH,Organic Matter %,N (ppm),P (ppm),K (ppm),Notes\n';
        data.soilTests.forEach(record => {
          csvContent += `${record.date},${record.ph || ''},${record.organic_matter || ''},${record.nitrogen || ''},${record.phosphorus || ''},${record.potassium || ''},"${record.notes || ''}"\n`;
        });
        csvContent += '\n';
      }

      // Calculation History
      if (data.calculations.length > 0) {
        csvContent += 'CALCULATION HISTORY\n';
        csvContent += 'Date,Type,Confidence Level,Results Summary\n';
        data.calculations.forEach(record => {
          const resultsSummary = this.summarizeCalculationResults(record);
          csvContent += `${record.date},"${record.calculation_type}","${record.confidence_level}","${resultsSummary}"\n`;
        });
        csvContent += '\n';
      }
    }

    // Download CSV file
    const filename = `${data.farm.name.replace(/\s+/g, '_')}_${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
    this.downloadFile(csvContent, filename, 'text/csv');
  }

  /**
   * Export data to PDF format
   */
  private static async exportToPDF(data: ExportData, options: ExportOptions): Promise<void> {
    const { reportType } = options;
    const pdf = new jsPDF();
    let yPosition = 20;

    // PDF Header
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('VineSight Farm Report', 20, yPosition);
    
    yPosition += 10;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${data.farm.name}`, 20, yPosition);
    
    yPosition += 8;
    pdf.setFontSize(10);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPosition);
    
    yPosition += 5;
    pdf.text(`Period: ${options.dateRange.from} to ${options.dateRange.to}`, 20, yPosition);
    
    yPosition += 15;

    // Farm Summary
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Farm Details', 20, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const farmDetails = [
      ['Region', data.farm.region || 'Not specified'],
      ['Area', `${data.farm.area} hectares`],
      ['Grape Variety', data.farm.grapeVariety || 'Not specified'],
      ['Planting Date', data.farm.plantingDate || 'Not specified'],
      ['Vine Spacing', data.farm.vineSpacing ? `${data.farm.vineSpacing}m` : 'Not specified'],
      ['Row Spacing', data.farm.rowSpacing ? `${data.farm.rowSpacing}m` : 'Not specified']
    ];

    await this.ensureAutoTable(pdf);
    (pdf as any).autoTable({
      startY: yPosition,
      head: [['Property', 'Value']],
      body: farmDetails,
      theme: 'grid',
      headStyles: { fillColor: [71, 85, 105] },
      margin: { left: 20, right: 20 },
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 15;

    // Add data sections based on report type
    if (reportType === 'operations' || reportType === 'comprehensive') {
      yPosition = await this.addOperationalDataToPDF(pdf, data, yPosition);
    }

    if (reportType === 'financial' || reportType === 'comprehensive') {
      yPosition = await this.addFinancialDataToPDF(pdf, data, yPosition);
    }

    if (reportType === 'compliance' || reportType === 'comprehensive') {
      yPosition = await this.addComplianceDataToPDF(pdf, data, yPosition);
    }

    // Add summary statistics
    yPosition = await this.addSummaryStatistics(pdf, data, yPosition);

    // Download PDF
    const filename = `${data.farm.name.replace(/\s+/g, '_')}_${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
  }

  /**
   * Add operational data to PDF
   */
  private static async addOperationalDataToPDF(pdf: jsPDF, data: ExportData, startY: number): Promise<number> {
    let yPosition = startY;

    // Irrigation Records
    if (data.irrigation.length > 0) {
      yPosition = this.checkPageBreak(pdf, yPosition, 40);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Irrigation Records', 20, yPosition);
      yPosition += 10;

      const irrigationData = data.irrigation.map(record => [
        record.date,
        `${record.duration}h`,
        `${record.area}ha`,
        record.growth_stage,
        record.moisture_status,
        `${record.system_discharge}L/h`
      ]);

      await this.ensureAutoTable(pdf);
      (pdf as any).autoTable({
        startY: yPosition,
        head: [['Date', 'Duration', 'Area', 'Growth Stage', 'Moisture', 'Discharge']],
        body: irrigationData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 20, right: 20 },
        styles: { fontSize: 8 }
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 15;
    }

    // Spray Records
    if (data.spray.length > 0) {
      yPosition = this.checkPageBreak(pdf, yPosition, 40);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Spray Records', 20, yPosition);
      yPosition += 10;

      const sprayData = data.spray.map(record => [
        record.date,
        record.pest_disease,
        record.chemical,
        record.dose,
        `${record.area}ha`,
        record.operator
      ]);

      await this.ensureAutoTable(pdf);
      (pdf as any).autoTable({
        startY: yPosition,
        head: [['Date', 'Pest/Disease', 'Chemical', 'Dose', 'Area', 'Operator']],
        body: sprayData,
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94] },
        margin: { left: 20, right: 20 },
        styles: { fontSize: 8 }
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 15;
    }

    // Harvest Records
    if (data.harvest.length > 0) {
      yPosition = this.checkPageBreak(pdf, yPosition, 40);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Harvest Records', 20, yPosition);
      yPosition += 10;

      const harvestData = data.harvest.map(record => [
        record.date,
        `${record.quantity}kg`,
        record.grade,
        record.price_per_kg ? `₹${record.price_per_kg}` : 'N/A',
        record.price_per_kg ? `₹${(record.quantity * record.price_per_kg).toLocaleString()}` : 'N/A'
      ]);

      await this.ensureAutoTable(pdf);
      (pdf as any).autoTable({
        startY: yPosition,
        head: [['Date', 'Quantity', 'Grade', 'Price/kg', 'Total Value']],
        body: harvestData,
        theme: 'striped',
        headStyles: { fillColor: [249, 115, 22] },
        margin: { left: 20, right: 20 },
        styles: { fontSize: 8 }
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 15;
    }

    return yPosition;
  }

  /**
   * Add financial data to PDF
   */
  private static async addFinancialDataToPDF(pdf: jsPDF, data: ExportData, startY: number): Promise<number> {
    let yPosition = startY;

    if (data.expenses.length > 0) {
      yPosition = this.checkPageBreak(pdf, yPosition, 40);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Expense Records', 20, yPosition);
      yPosition += 10;

      const expenseData = data.expenses.map(record => [
        record.date,
        record.category,
        record.description,
        `₹${record.amount.toLocaleString()}`,
        record.vendor || 'N/A'
      ]);

      await this.ensureAutoTable(pdf);
      (pdf as any).autoTable({
        startY: yPosition,
        head: [['Date', 'Category', 'Description', 'Amount', 'Vendor']],
        body: expenseData,
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68] },
        margin: { left: 20, right: 20 },
        styles: { fontSize: 8 }
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 15;

      // Add expense summary
      const totalExpenses = data.expenses.reduce((sum, record) => sum + record.amount, 0);
      const categoryTotals = data.expenses.reduce((acc, record) => {
        acc[record.category] = (acc[record.category] || 0) + record.amount;
        return acc;
      }, {} as Record<string, number>);

      yPosition = this.checkPageBreak(pdf, yPosition, 30);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Total Expenses: ₹${totalExpenses.toLocaleString()}`, 20, yPosition);
      yPosition += 8;

      pdf.setFont('helvetica', 'normal');
      pdf.text('Category Breakdown:', 20, yPosition);
      yPosition += 5;

      Object.entries(categoryTotals)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .forEach(([category, amount]) => {
          pdf.text(`• ${category}: ₹${(amount as number).toLocaleString()}`, 25, yPosition);
          yPosition += 5;
        });

      yPosition += 10;
    }

    return yPosition;
  }

  /**
   * Add compliance data to PDF
   */
  private static async addComplianceDataToPDF(pdf: jsPDF, data: ExportData, startY: number): Promise<number> {
    let yPosition = startY;

    // Soil Test Records
    if (data.soilTests.length > 0) {
      yPosition = this.checkPageBreak(pdf, yPosition, 40);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Soil Test Records', 20, yPosition);
      yPosition += 10;

      const soilData = data.soilTests.map(record => [
        record.date,
        record.ph?.toFixed(1) || 'N/A',
        record.organic_matter?.toFixed(1) + '%' || 'N/A',
        record.nitrogen + ' ppm' || 'N/A',
        record.phosphorus + ' ppm' || 'N/A',
        record.potassium + ' ppm' || 'N/A'
      ]);

      await this.ensureAutoTable(pdf);
      (pdf as any).autoTable({
        startY: yPosition,
        head: [['Date', 'pH', 'Organic Matter', 'Nitrogen', 'Phosphorus', 'Potassium']],
        body: soilData,
        theme: 'striped',
        headStyles: { fillColor: [168, 85, 247] },
        margin: { left: 20, right: 20 },
        styles: { fontSize: 8 }
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 15;
    }

    return yPosition;
  }

  /**
   * Add summary statistics to PDF
   */
  private static async addSummaryStatistics(pdf: jsPDF, data: ExportData, startY: number): Promise<number> {
    let yPosition = startY;

    yPosition = this.checkPageBreak(pdf, yPosition, 50);
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Summary Statistics', 20, yPosition);
    yPosition += 15;

    const stats = [
      ['Total Irrigation Events', data.irrigation.length.toString()],
      ['Total Spray Applications', data.spray.length.toString()],
      ['Total Fertigation Events', data.fertigation.length.toString()],
      ['Total Harvest Records', data.harvest.length.toString()],
      ['Total Expense Entries', data.expenses.length.toString()],
    ];

    // Calculate totals
    const totalHarvest = data.harvest.reduce((sum, record) => sum + record.quantity, 0);
    const totalExpenses = data.expenses.reduce((sum, record) => sum + record.amount, 0);
    const totalRevenue = data.harvest.reduce((sum, record) => 
      sum + (record.price_per_kg ? record.quantity * record.price_per_kg : 0), 0);

    if (totalHarvest > 0) {
      stats.push(['Total Harvest Quantity', `${totalHarvest.toLocaleString()} kg`]);
    }
    if (totalRevenue > 0) {
      stats.push(['Total Revenue', `₹${totalRevenue.toLocaleString()}`]);
    }
    if (totalExpenses > 0) {
      stats.push(['Total Expenses', `₹${totalExpenses.toLocaleString()}`]);
    }
    if (totalRevenue > 0 && totalExpenses > 0) {
      stats.push(['Net Profit/Loss', `₹${(totalRevenue - totalExpenses).toLocaleString()}`]);
    }

    await this.ensureAutoTable(pdf);
    (pdf as any).autoTable({
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: stats,
      theme: 'grid',
      headStyles: { fillColor: [71, 85, 105] },
      margin: { left: 20, right: 20 },
    });

    return (pdf as any).lastAutoTable.finalY + 20;
  }

  /**
   * Check if we need a page break and add one if necessary
   */
  private static checkPageBreak(pdf: jsPDF, currentY: number, requiredSpace: number): number {
    if (currentY + requiredSpace > 270) { // A4 page height minus margins
      pdf.addPage();
      return 20; // Start from top of new page
    }
    return currentY;
  }

  /**
   * Summarize calculation results for CSV export
   */
  private static summarizeCalculationResults(record: any): string {
    try {
      const results = JSON.parse(record.results);
      if (record.calculation_type === 'ETc') {
        return `ETc: ${results.etc?.toFixed(2)}mm/day, Irrigation Need: ${results.irrigationNeed?.toFixed(2)}mm/day`;
      } else if (record.calculation_type === 'LAI') {
        return `LAI: ${results.lai?.toFixed(2)}, Canopy Status: ${results.canopyStatus}`;
      } else if (record.calculation_type === 'Nutrient') {
        return `N: ${results.nitrogen?.deficit?.toFixed(1)}kg/ha, P: ${results.phosphorus?.deficit?.toFixed(1)}kg/ha, K: ${results.potassium?.deficit?.toFixed(1)}kg/ha`;
      }
      return 'Calculation completed';
    } catch {
      return 'Results available';
    }
  }

  /**
   * Download file utility
   */
  private static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Get available export types for a farm
   */
  static async getAvailableExportTypes(farmId: number): Promise<string[]> {
    const availableTypes: string[] = [];

    try {
      const [irrigation, spray, fertigation, harvest, expenses, calculations, soilTests, tasks] = await Promise.all([
        SupabaseService.getIrrigationRecords(farmId),
        SupabaseService.getSprayRecords(farmId),
        SupabaseService.getFertigationRecords(farmId),
        SupabaseService.getHarvestRecords(farmId),
        SupabaseService.getExpenseRecords(farmId),
        SupabaseService.getCalculationHistory(farmId),
        SupabaseService.getSoilTestRecords(farmId),
        SupabaseService.getTaskReminders(farmId),
      ]);

      if (irrigation.length > 0) availableTypes.push('irrigation');
      if (spray.length > 0) availableTypes.push('spray');
      if (fertigation.length > 0) availableTypes.push('fertigation');
      if (harvest.length > 0) availableTypes.push('harvest');
      if (expenses.length > 0) availableTypes.push('expenses');
      if (calculations.length > 0) availableTypes.push('calculations');
      if (soilTests.length > 0) availableTypes.push('soilTests');
      if (tasks.length > 0) availableTypes.push('tasks');

      return availableTypes;
    } catch (error) {
      console.error('Error checking available export types:', error);
      return [];
    }
  }
}