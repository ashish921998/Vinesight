"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Download, 
  Calendar,
  DollarSign,
  Shield,
  TrendingUp,
  PieChart,
  BarChart3,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Eye,
  Settings
} from "lucide-react";
import { CloudDataService, Farm } from "@/lib/cloud-data-service";
import { ReportingService } from "@/lib/reporting-service";
import { ComplianceReport, FinancialReport, RegulatoryCompliance } from "@/lib/reporting-types";
import { FinancialChart } from "@/components/reports/FinancialChart";
import { ComplianceStatus } from "@/components/reports/ComplianceStatus";

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: any;
  type: 'compliance' | 'financial';
  category: string;
  lastGenerated?: Date;
  status: 'available' | 'generating' | 'error';
}

export default function ReportsPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [generatingReports, setGeneratingReports] = useState(new Set<string>());
  const [compliance, setCompliance] = useState<RegulatoryCompliance | null>(null);
  const [recentReports, setRecentReports] = useState<(ComplianceReport | FinancialReport)[]>([]);
  const [previewReport, setPreviewReport] = useState<FinancialReport | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadFarms();
  }, []);

  useEffect(() => {
    if (selectedFarm) {
      loadComplianceData();
      loadRecentReports();
    }
  }, [selectedFarm]);

  const loadFarms = async () => {
    try {
      const farmList = await CloudDataService.getAllFarms();
      setFarms(farmList);
      if (farmList.length > 0 && !selectedFarm) {
        setSelectedFarm(farmList[0]);
      }
    } catch (error) {
      console.error("Error loading farms:", error);
    }
  };

  const loadComplianceData = async () => {
    if (!selectedFarm?.id) return;
    
    try {
      const complianceData = await ReportingService.getRegulatoryCompliance(selectedFarm.id.toString());
      setCompliance(complianceData);
    } catch (error) {
      console.error("Error loading compliance data:", error);
    }
  };

  const loadRecentReports = () => {
    // In a real implementation, this would load from database
    setRecentReports([]);
  };

  const generatePreviewData = async () => {
    if (!selectedFarm?.id) return;
    
    try {
      const { start, end } = getPeriodDates(selectedPeriod);
      const report = await ReportingService.generateFinancialReport(
        selectedFarm.id.toString(),
        'profit_loss',
        start,
        end
      );
      setPreviewReport(report);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating preview:', error);
    }
  };

  const getPeriodDates = (period: string) => {
    const now = new Date();
    let start: Date, end: Date;

    switch (period) {
      case 'current_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'last_month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'current_quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
        break;
      case 'current_year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    return { start, end };
  };

  const generateReport = async (reportType: string, category: 'compliance' | 'financial') => {
    if (!selectedFarm?.id) {
      alert('Please select a farm first');
      return;
    }

    const reportId = `${category}_${reportType}`;
    setGeneratingReports(prev => new Set([...prev, reportId]));

    try {
      const { start, end } = getPeriodDates(selectedPeriod);
      let report: ComplianceReport | FinancialReport;

      if (category === 'compliance') {
        report = await ReportingService.generateComplianceReport(
          selectedFarm.id.toString(),
          reportType as ComplianceReport['reportType'],
          start,
          end
        );
      } else {
        report = await ReportingService.generateFinancialReport(
          selectedFarm.id.toString(),
          reportType as FinancialReport['reportType'],
          start,
          end
        );
      }

      // Generate and download PDF
      const pdfBlob = await ReportingService.exportReportToPDF(report);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Update recent reports
      setRecentReports(prev => [report, ...prev.slice(0, 9)]);

    } catch (error) {
      console.error('Error generating report:', error);
      alert(`Failed to generate report: ${error}`);
    } finally {
      setGeneratingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
    }
  };

  const availableReports: ReportCard[] = [
    // Compliance Reports
    {
      id: 'compliance_organic',
      title: 'Organic Certification Report',
      description: 'Comprehensive organic compliance documentation for certification bodies',
      icon: Shield,
      type: 'compliance',
      category: 'organic',
      status: 'available'
    },
    {
      id: 'compliance_pesticide',
      title: 'Pesticide Usage Report',
      description: 'Detailed pesticide application records and safety compliance',
      icon: FileCheck,
      type: 'compliance', 
      category: 'pesticide',
      status: 'available'
    },
    {
      id: 'compliance_water_usage',
      title: 'Water Usage Compliance',
      description: 'Water consumption tracking and regulatory compliance report',
      icon: FileText,
      type: 'compliance',
      category: 'water_usage', 
      status: 'available'
    },
    {
      id: 'compliance_soil_health',
      title: 'Soil Health Assessment',
      description: 'Comprehensive soil testing results and health recommendations',
      icon: FileText,
      type: 'compliance',
      category: 'soil_health',
      status: 'available'
    },
    {
      id: 'compliance_harvest',
      title: 'Harvest Records Report',
      description: 'Complete harvest documentation with quality and quantity details',
      icon: FileCheck,
      type: 'compliance',
      category: 'harvest',
      status: 'available'
    },
    // Financial Reports
    {
      id: 'financial_cost_analysis',
      title: 'Cost Analysis Report', 
      description: 'Detailed breakdown of operational costs by category and activity',
      icon: PieChart,
      type: 'financial',
      category: 'cost_analysis',
      status: 'available'
    },
    {
      id: 'financial_profit_loss',
      title: 'Profit & Loss Statement',
      description: 'Complete P&L statement with revenue, costs, and profitability metrics',
      icon: TrendingUp,
      type: 'financial',
      category: 'profit_loss',
      status: 'available'
    },
    {
      id: 'financial_roi_analysis',
      title: 'ROI Analysis Report',
      description: 'Return on investment analysis for different farm operations',
      icon: DollarSign,
      type: 'financial',
      category: 'roi_analysis',
      status: 'available'
    },
    {
      id: 'financial_budget_vs_actual',
      title: 'Budget vs Actual Report',
      description: 'Comparison of budgeted vs actual expenses and revenues',
      icon: BarChart3,
      type: 'financial', 
      category: 'budget_vs_actual',
      status: 'available'
    }
  ];

  const complianceReports = availableReports.filter(report => report.type === 'compliance');
  const financialReports = availableReports.filter(report => report.type === 'financial');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <FileText className="h-8 w-8" />
          Advanced Reporting
        </h1>
        <p className="text-muted-foreground mt-2">
          Generate comprehensive compliance and financial reports for your vineyard operations
        </p>
      </div>

      {/* Farm and Period Selection */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Select Farm</Label>
              <div className="mt-2">
                {farms.length > 0 && (
                  <Select 
                    value={selectedFarm?.id?.toString() || ""} 
                    onValueChange={(value) => {
                      const farm = farms.find(f => f.id?.toString() === value);
                      setSelectedFarm(farm || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a farm" />
                    </SelectTrigger>
                    <SelectContent>
                      {farms.map(farm => (
                        <SelectItem key={farm.id} value={farm.id!.toString()}>
                          {farm.name} - {farm.area}ha
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div>
              <Label>Report Period</Label>
              <div className="mt-2">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current_month">Current Month</SelectItem>
                    <SelectItem value="last_month">Last Month</SelectItem>
                    <SelectItem value="current_quarter">Current Quarter</SelectItem>
                    <SelectItem value="current_year">Current Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Overview */}
      {compliance && (
        <div className="mb-6">
          <ComplianceStatus compliance={compliance} />
        </div>
      )}

      {/* Financial Preview */}
      {selectedFarm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Financial Analysis Preview
            </CardTitle>
            <CardDescription>
              Quick financial overview for the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button onClick={generatePreviewData} className="gap-2">
                <Eye className="h-4 w-4" />
                Generate Preview
              </Button>
              {previewReport && (
                <Button 
                  variant="outline" 
                  onClick={() => setShowPreview(!showPreview)}
                  className="gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  {showPreview ? 'Hide Charts' : 'Show Charts'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Charts Preview */}
      {showPreview && previewReport && (
        <div className="mb-6">
          <FinancialChart
            costBreakdown={previewReport.data.costBreakdown}
            revenueBreakdown={previewReport.data.revenueBreakdown}
            totalRevenue={previewReport.data.totalRevenue}
            totalCosts={previewReport.data.totalCosts}
            netProfit={previewReport.data.netProfit}
            profitMargin={previewReport.data.profitMargin}
          />
        </div>
      )}

      {/* Compliance Reports */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Compliance Reports
          </CardTitle>
          <CardDescription>
            Generate regulatory compliance reports for certification and audits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {complianceReports.map((report) => {
              const Icon = report.icon;
              const isGenerating = generatingReports.has(report.id);
              
              return (
                <Card key={report.id} className="border-2 hover:border-blue-200 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{report.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {report.description}
                        </p>
                        <div className="mt-3">
                          <Button
                            size="sm"
                            onClick={() => generateReport(report.category, 'compliance')}
                            disabled={!selectedFarm || isGenerating}
                            className="w-full gap-2"
                          >
                            {isGenerating ? (
                              <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4" />
                                Generate PDF
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Financial Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Reports
          </CardTitle>
          <CardDescription>
            Comprehensive financial analysis and cost management reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {financialReports.map((report) => {
              const Icon = report.icon;
              const isGenerating = generatingReports.has(report.id);
              
              return (
                <Card key={report.id} className="border-2 hover:border-green-200 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{report.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {report.description}
                        </p>
                        <div className="mt-3">
                          <Button
                            size="sm"
                            onClick={() => generateReport(report.category, 'financial')}
                            disabled={!selectedFarm || isGenerating}
                            className="w-full gap-2"
                          >
                            {isGenerating ? (
                              <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4" />
                                Generate PDF
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* No Farm Selected Message */}
      {farms.length === 0 && (
        <Card className="text-center py-12 mt-6">
          <CardContent>
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No farms found</h3>
            <p className="text-muted-foreground mb-4">
              Add a farm first to generate compliance and financial reports
            </p>
            <Button onClick={() => window.location.href = "/farms"}>
              Add Your First Farm
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}