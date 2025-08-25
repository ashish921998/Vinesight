import * as Papa from 'papaparse';
import jsPDF from 'jspdf';
import { DatabaseService } from './db-utils';

export interface ExportOptions {
  format: 'csv' | 'pdf';
  farmId: number;
  recordType?: 'irrigation' | 'spray' | 'harvest' | 'all';
  dateRange?: {
    start: string;
    end: string;
  };
}

export class ExportService {
  static async exportFarmData(options: ExportOptions): Promise<void> {
    const { format, farmId, recordType = 'all', dateRange } = options;

    try {
      // Get farm details
      const farm = await DatabaseService.getFarmById(farmId);
      if (!farm) {
        throw new Error('Farm not found');
      }

      let data: any[] = [];
      let filename = `${farm.name.replace(/\s+/g, '_')}_${recordType}_${new Date().toISOString().split('T')[0]}`;

      // Fetch data based on record type
      if (recordType === 'all' || recordType === 'irrigation') {
        const irrigationRecords = await DatabaseService.getIrrigationRecords(farmId);
        const processedIrrigation = irrigationRecords.map(record => ({
          Type: 'Irrigation',
          Date: record.date,
          Duration_Hours: record.duration,
          Area_Ha: record.area,
          Growth_Stage: record.growthStage,
          Moisture_Status: record.moistureStatus,
          System_Discharge_Lh: record.systemDischarge,
          Notes: record.notes || ''
        }));
        data = [...data, ...processedIrrigation];
      }

      if (recordType === 'all' || recordType === 'spray') {
        const sprayRecords = await DatabaseService.getSprayRecords(farmId);
        const processedSpray = sprayRecords.map(record => ({
          Type: 'Spray',
          Date: record.date,
          Pest_Disease: record.pestDisease,
          Chemical: record.chemical,
          Dose: record.dose,
          Area_Ha: record.area,
          Weather: record.weather,
          Operator: record.operator,
          Notes: record.notes || ''
        }));
        data = [...data, ...processedSpray];
      }

      if (recordType === 'all' || recordType === 'harvest') {
        const harvestRecords = await DatabaseService.getHarvestRecords(farmId);
        const processedHarvest = harvestRecords.map(record => ({
          Type: 'Harvest',
          Date: record.date,
          Quantity_Kg: record.quantity,
          Grade: record.grade,
          Price_Per_Kg: record.price || 0,
          Total_Value: record.price ? (record.quantity * record.price) : 0,
          Buyer: record.buyer || '',
          Notes: record.notes || ''
        }));
        data = [...data, ...processedHarvest];
      }

      // Apply date range filter if provided
      if (dateRange) {
        data = data.filter(record => {
          const recordDate = new Date(record.Date);
          const startDate = new Date(dateRange.start);
          const endDate = new Date(dateRange.end);
          return recordDate >= startDate && recordDate <= endDate;
        });
        filename += `_${dateRange.start}_to_${dateRange.end}`;
      }

      if (data.length === 0) {
        throw new Error('No data found for the specified criteria');
      }

      // Export based on format
      if (format === 'csv') {
        await this.exportToCSV(data, filename, farm.name);
      } else if (format === 'pdf') {
        await this.exportToPDF(data, filename, farm);
      }

    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }

  private static async exportToCSV(data: any[], filename: string, farmName: string): Promise<void> {
    try {
      // Add header information
      const headerInfo = [
        ['Farm Name', farmName],
        ['Export Date', new Date().toLocaleDateString()],
        ['Total Records', data.length.toString()],
        [''], // Empty row for separation
      ];

      // Combine header info with data
      const csvContent = Papa.unparse([
        ...headerInfo,
        ...data
      ]);

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('CSV export error:', error);
      throw new Error('Failed to export CSV file');
    }
  }

  private static async exportToPDF(data: any[], filename: string, farm: any): Promise<void> {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      let yPosition = 20;

      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(5, 150, 105); // Primary color
      pdf.text('🍇 VineSight Farm Report', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 20;
      
      // Farm information
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Farm: ${farm.name}`, 20, yPosition);
      yPosition += 10;
      pdf.text(`Region: ${farm.region}`, 20, yPosition);
      yPosition += 10;
      pdf.text(`Area: ${farm.area} hectares`, 20, yPosition);
      yPosition += 10;
      pdf.text(`Variety: ${farm.grapeVariety}`, 20, yPosition);
      yPosition += 10;
      pdf.text(`Export Date: ${new Date().toLocaleDateString()}`, 20, yPosition);
      yPosition += 10;
      pdf.text(`Total Records: ${data.length}`, 20, yPosition);
      
      yPosition += 20;

      // Group data by type
      const groupedData = data.reduce((acc, record) => {
        if (!acc[record.Type]) {
          acc[record.Type] = [];
        }
        acc[record.Type].push(record);
        return acc;
      }, {});

      // Add each section
      Object.keys(groupedData).forEach(type => {
        const records = groupedData[type];
        
        // Check if we need a new page
        if (yPosition > pdf.internal.pageSize.height - 60) {
          pdf.addPage();
          yPosition = 20;
        }

        // Section header
        pdf.setFontSize(16);
        pdf.setTextColor(5, 150, 105);
        pdf.text(`${type} Records (${records.length})`, 20, yPosition);
        yPosition += 15;

        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);

        records.forEach((record: any, index: number) => {
          if (yPosition > pdf.internal.pageSize.height - 40) {
            pdf.addPage();
            yPosition = 20;
          }

          pdf.text(`${index + 1}. ${record.Date}`, 25, yPosition);
          yPosition += 6;

          // Add record-specific details
          if (type === 'Irrigation') {
            pdf.text(`   Duration: ${record.Duration_Hours}h, Area: ${record.Area_Ha}ha`, 30, yPosition);
            yPosition += 5;
            pdf.text(`   Stage: ${record.Growth_Stage}, Discharge: ${record.System_Discharge_Lh}L/h`, 30, yPosition);
          } else if (type === 'Spray') {
            pdf.text(`   Target: ${record.Pest_Disease}, Chemical: ${record.Chemical}`, 30, yPosition);
            yPosition += 5;
            pdf.text(`   Dose: ${record.Dose}, Area: ${record.Area_Ha}ha, Operator: ${record.Operator}`, 30, yPosition);
          } else if (type === 'Harvest') {
            pdf.text(`   Quantity: ${record.Quantity_Kg}kg, Grade: ${record.Grade}`, 30, yPosition);
            yPosition += 5;
            if (record.Price_Per_Kg > 0) {
              pdf.text(`   Price: ₹${record.Price_Per_Kg}/kg, Total: ₹${record.Total_Value}`, 30, yPosition);
            }
          }
          
          yPosition += 8;
          if (record.Notes) {
            pdf.text(`   Notes: ${record.Notes}`, 30, yPosition);
            yPosition += 8;
          }
        });

        yPosition += 10;
      });

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text('Generated by VineSight - Grape Farming Digital Companion', pageWidth / 2, pdf.internal.pageSize.height - 10, { align: 'center' });

      // Save the PDF
      pdf.save(`${filename}.pdf`);

    } catch (error) {
      console.error('PDF export error:', error);
      throw new Error('Failed to export PDF file');
    }
  }

  // Quick export functions
  static async exportAllFarmData(farmId: number, format: 'csv' | 'pdf' = 'pdf'): Promise<void> {
    return this.exportFarmData({
      format,
      farmId,
      recordType: 'all'
    });
  }

  static async exportIrrigationRecords(farmId: number, format: 'csv' | 'pdf' = 'csv'): Promise<void> {
    return this.exportFarmData({
      format,
      farmId,
      recordType: 'irrigation'
    });
  }

  static async exportHarvestRecords(farmId: number, format: 'csv' | 'pdf' = 'csv'): Promise<void> {
    return this.exportFarmData({
      format,
      farmId,
      recordType: 'harvest'
    });
  }

  // Generate summary statistics for export
  static async generateSummaryReport(farmId: number): Promise<any> {
    const farm = await DatabaseService.getFarmById(farmId);
    const irrigationRecords = await DatabaseService.getIrrigationRecords(farmId);
    const sprayRecords = await DatabaseService.getSprayRecords(farmId);
    const harvestRecords = await DatabaseService.getHarvestRecords(farmId);

    const totalHarvest = harvestRecords.reduce((sum, record) => sum + record.quantity, 0);
    const totalRevenue = harvestRecords.reduce((sum, record) => 
      sum + (record.price ? record.quantity * record.price : 0), 0);
    const totalIrrigationHours = irrigationRecords.reduce((sum, record) => sum + record.duration, 0);
    const totalSprayApplications = sprayRecords.length;

    return {
      farm,
      summary: {
        totalHarvest,
        totalRevenue,
        totalIrrigationHours,
        totalSprayApplications,
        yieldPerHectare: totalHarvest / farm!.area,
        recordCounts: {
          irrigation: irrigationRecords.length,
          spray: sprayRecords.length,
          harvest: harvestRecords.length
        }
      },
      period: {
        start: Math.min(
          ...[...irrigationRecords, ...sprayRecords, ...harvestRecords]
            .map(r => new Date(r.date).getTime())
        ),
        end: Math.max(
          ...[...irrigationRecords, ...sprayRecords, ...harvestRecords]
            .map(r => new Date(r.date).getTime())
        )
      }
    };
  }
}