'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  Filter,
  Eye,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  BarChart3,
  DollarSign,
  Droplets,
  SprayCan,
  Scissors,
  TrendingUp
} from 'lucide-react'
import { CloudDataService } from '@/lib/cloud-data-service'
import { ExportService, type ExportOptions } from '@/lib/export-service'
import type { Farm } from '@/types/types'
import { capitalize } from '@/lib/utils'
import { DatePicker } from '@/components/ui/date-picker'

interface RecordData {
  irrigation: any[]
  spray: any[]
  harvest: any[]
  expense: any[]
}

interface ReportPreview {
  data: RecordData
  summary: {
    totalRecords: number
    dateRange: string
    totalIrrigationHours: number
    totalWaterUsage: number
    totalHarvest: number
    totalRevenue: number
    totalExpenses: number
    netProfit: number
  }
}

const RECORDS_PER_PAGE = 10

export default function UnifiedReportsPage() {
  const [farms, setFarms] = useState<Farm[]>([])
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null)
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<ReportPreview | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [activeTab, setActiveTab] = useState<keyof RecordData>('irrigation')

  // Export options
  const [exportOptions, setExportOptions] = useState<Partial<ExportOptions>>({
    dateRange: {
      from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0]
    },
    includeTypes: ['irrigation', 'spray', 'harvest', 'expense'],
    format: 'pdf',
    reportType: 'comprehensive'
  })

  const loadFarms = useCallback(async () => {
    try {
      const farmList = await CloudDataService.getAllFarms()
      setFarms(farmList)
      if (farmList.length > 0) {
        setSelectedFarm(farmList[0])
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error loading farms:', error)
      }
    }
  }, [])

  const generatePreview = useCallback(async () => {
    if (!selectedFarm) return

    setLoading(true)
    try {
      const data = await loadReportData(selectedFarm)
      setReportData(data)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error generating preview:', error)
      }
    } finally {
      setLoading(false)
    }
  }, [selectedFarm, exportOptions.dateRange])

  useEffect(() => {
    loadFarms()
  }, [loadFarms])

  useEffect(() => {
    if (selectedFarm) {
      generatePreview()
    }
  }, [selectedFarm, generatePreview])

  // Duplicate loadFarms function removed - using the useCallback version above

  // Load report data function
  const loadReportData = async (farm: Farm) => {
    // Check if auth bypass is enabled for testing
    const isDevelopment = process.env.NODE_ENV === 'development'
    const bypassAuth = isDevelopment && process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'

    let irrigation, spray, harvest, expense

    if (bypassAuth) {
      // Sample data for testing
      irrigation = [
        {
          id: 1,
          farm_id: farm.id,
          date: '2025-08-15',
          duration: 120,
          water_amount: 250.5,
          system_discharge: 2.5,
          notes: 'Morning irrigation cycle',
          created_at: '2025-08-15T06:00:00Z'
        }
      ]

      spray = [
        {
          id: 1,
          farm_id: farm.id,
          date: '2025-08-10',
          product_name: 'Copper Sulfate',
          dosage: '2.5 kg/ha',
          target: 'Powdery mildew prevention',
          weather_conditions: 'Calm, 22°C',
          notes: 'Preventive treatment',
          created_at: '2025-08-10T08:00:00Z'
        }
      ]

      harvest = [
        {
          id: 1,
          farm_id: farm.id,
          date: '2025-08-25',
          variety: farm.cropVariety,
          quantity: 1250.0,
          unit: 'kg',
          quality_grade: 'Premium',
          brix_level: 22.5,
          price: 4.5,
          notes: 'Excellent quality harvest',
          created_at: '2025-08-25T10:00:00Z'
        }
      ]

      expense = [
        {
          id: 1,
          farm_id: farm.id,
          date: '2025-08-12',
          category: 'Chemicals',
          description: 'Copper Sulfate Purchase',
          amount: 125.5,
          cost: 125.5,
          currency: 'USD',
          vendor: 'Farm Supply Co',
          notes: 'Fungicide for preventive treatment',
          created_at: '2025-08-12T14:00:00Z'
        }
      ]
    } else {
      ;[irrigation, spray, harvest, expense] = await Promise.all([
        CloudDataService.getIrrigationRecords(farm.id!),
        CloudDataService.getSprayRecords(farm.id!),
        CloudDataService.getHarvestRecords(farm.id!),
        CloudDataService.getExpenseRecords(farm.id!)
      ])
    }

    // Filter by date range
    const { from, to } = exportOptions.dateRange!
    const filterByDate = (records: any[]) =>
      records.filter((record) => {
        const recordDate = new Date(record.date)
        return recordDate >= new Date(from) && recordDate <= new Date(to)
      })

    const filteredData = {
      irrigation: filterByDate(irrigation),
      spray: filterByDate(spray),
      harvest: filterByDate(harvest),
      expense: filterByDate(expense)
    }

    // Calculate summary
    const totalIrrigationHours = filteredData.irrigation.reduce(
      (sum, r) => sum + (r.duration || 0),
      0
    )
    const totalWaterUsage = filteredData.irrigation.reduce(
      (sum, r) => sum + (r.duration || 0) * (r.system_discharge || 0),
      0
    )
    const totalHarvest = filteredData.harvest.reduce((sum, r) => sum + (r.quantity || 0), 0)
    const totalRevenue = filteredData.harvest.reduce(
      (sum, r) => sum + (r.quantity || 0) * (r.price || 0),
      0
    )
    const totalExpenses = filteredData.expense.reduce((sum, r) => sum + (r.cost || 0), 0)

    const summary = {
      totalRecords: Object.values(filteredData).reduce((sum, arr) => sum + arr.length, 0),
      dateRange: `${from} to ${to}`,
      totalIrrigationHours: Math.round(totalIrrigationHours * 10) / 10,
      totalWaterUsage: Math.round(totalWaterUsage),
      totalHarvest: Math.round(totalHarvest * 10) / 10,
      totalRevenue: Math.round(totalRevenue),
      totalExpenses: Math.round(totalExpenses),
      netProfit: Math.round(totalRevenue - totalExpenses)
    }

    return { data: filteredData, summary }
  }

  const exportToCSV = async (data: any, farm: any) => {
    const csvRows: string[] = []

    // Add header with farm info
    csvRows.push(`Farm Report - ${capitalize(farm.name)}`)
    csvRows.push(`Date Range: ${data.summary.dateRange}`)
    csvRows.push('')

    // Export each data type
    Object.entries(data.data).forEach(([type, records]) => {
      const recordsArray = records as any[]
      if (recordsArray.length > 0) {
        csvRows.push(`${type.toUpperCase()} RECORDS`)

        // Get headers from first record
        const headers = Object.keys(recordsArray[0]).filter(
          (key) => key !== 'id' && key !== 'farm_id'
        )
        csvRows.push(headers.join(','))

        // Add data rows
        recordsArray.forEach((record) => {
          const row = headers.map((header) => {
            const value = record[header]
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
          })
          csvRows.push(row.join(','))
        })
        csvRows.push('')
      }
    })

    // Create and download file
    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${farm.name}_report_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportToPDF = async (data: any, farm: any) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        // eslint-disable-next-line no-console
        // eslint-disable-next-line no-console
      }

      // Simple PDF generation without autoTable to avoid compatibility issues
      const jsPDF = (await import('jspdf')).default
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
      }

      const pdf = new jsPDF()
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
      }

      // Add title
      pdf.setFontSize(16)
      pdf.text(`Farm Report - ${capitalize(farm.name)}`, 20, 20)
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
      }

      pdf.setFontSize(12)
      pdf.text(`Date Range: ${data.summary.dateRange}`, 20, 35)

      // Add summary section
      pdf.setFontSize(14)
      pdf.text('Summary:', 20, 50)
      pdf.setFontSize(10)
      pdf.text(`• Total Records: ${data.summary.totalRecords}`, 25, 60)
      pdf.text(`• Total Water Usage: ${data.summary.totalWaterUsage} L`, 25, 67)
      pdf.text(`• Total Harvest: ${data.summary.totalHarvest} kg`, 25, 74)
      pdf.text(`• Net Profit: ₹${data.summary.netProfit}`, 25, 81)

      let yPosition = 95

      // Add simple text-based data sections
      Object.entries(data.data).forEach(([type, records]) => {
        const recordsArray = records as any[]
        if (recordsArray.length > 0) {
          // Check if we need a new page
          if (yPosition > 250) {
            pdf.addPage()
            yPosition = 20
          }

          // Add section title
          pdf.setFontSize(12)
          pdf.text(`${type.toUpperCase()} RECORDS (${recordsArray.length})`, 20, yPosition)
          yPosition += 10

          // Add records as simple text
          recordsArray.slice(0, 5).forEach((record: any, index: number) => {
            if (yPosition > 270) {
              pdf.addPage()
              yPosition = 20
            }

            pdf.setFontSize(9)
            if (type === 'irrigation') {
              pdf.text(
                `${index + 1}. ${record.date} - Duration: ${record.duration}h, Water: ${record.water_amount}L`,
                25,
                yPosition
              )
            } else if (type === 'harvest') {
              pdf.text(
                `${index + 1}. ${record.date} - Quantity: ${record.quantity}kg, Value: ₹${((record.quantity || 0) * (record.price || 0)).toLocaleString()}`,
                25,
                yPosition
              )
            } else if (type === 'expense') {
              pdf.text(
                `${index + 1}. ${record.date} - ${record.description}: ₹${record.cost}`,
                25,
                yPosition
              )
            } else {
              pdf.text(
                `${index + 1}. ${record.date} - ${record.notes || 'Record available'}`,
                25,
                yPosition
              )
            }
            yPosition += 7
          })

          if (recordsArray.length > 5) {
            pdf.text(`... and ${recordsArray.length - 5} more records`, 25, yPosition)
            yPosition += 7
          }

          yPosition += 10
        }
      })

      // Add footer
      const pageCount = pdf.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i)
        pdf.setFontSize(8)
        pdf.text(`Generated by VineSight - Page ${i} of ${pageCount}`, 20, 285)
        pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, 290)
      }

      // Save PDF
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
      }
      pdf.save(`${farm.name}_report_${new Date().toISOString().split('T')[0]}.pdf`)
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error generating PDF:', error)
        if (error instanceof Error) {
          // eslint-disable-next-line no-console
          console.error('Error details:', error.message, error.stack)
        }
      }
      throw error
    }
  }

  const handleExport = async (format: 'pdf' | 'csv') => {
    if (!selectedFarm || !reportData) return

    setLoading(true)
    try {
      // Check if auth bypass is enabled for testing
      const isDevelopment = process.env.NODE_ENV === 'development'
      const bypassAuth = isDevelopment && process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'

      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        // eslint-disable-next-line no-console
        // eslint-disable-next-line no-console
        // eslint-disable-next-line no-console
        // eslint-disable-next-line no-console
        // eslint-disable-next-line no-console
        // eslint-disable-next-line no-console
      }

      // Temporarily force bypass until we fix the env variable issue
      if (true || bypassAuth) {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
        }
        // Use already-loaded sample data for export
        if (format === 'csv') {
          await exportToCSV(reportData, selectedFarm)
        } else {
          await exportToPDF(reportData, selectedFarm)
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
        }
        // Use ExportService for real data
        const options: ExportOptions = {
          farmId: selectedFarm?.id!,
          dateRange: exportOptions.dateRange!,
          includeTypes: exportOptions.includeTypes!,
          format,
          reportType: exportOptions.reportType as any
        }

        await ExportService.exportData(options)
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error(`Error exporting ${format.toUpperCase()}:`, error)
      }
      alert(`Failed to export ${format.toUpperCase()}: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const getActiveRecords = () => {
    if (!reportData) return []
    return reportData.data[activeTab] || []
  }

  const getCurrentPageRecords = () => {
    const records = getActiveRecords()
    const start = currentPage * RECORDS_PER_PAGE
    return records.slice(start, start + RECORDS_PER_PAGE)
  }

  const getTotalPages = () => {
    const records = getActiveRecords()
    return Math.ceil(records.length / RECORDS_PER_PAGE)
  }

  const getTabIcon = (tab: keyof RecordData) => {
    switch (tab) {
      case 'irrigation':
        return Droplets
      case 'spray':
        return SprayCan
      case 'harvest':
        return Scissors
      case 'expense':
        return DollarSign
    }
  }

  const getTabColor = (tab: keyof RecordData) => {
    switch (tab) {
      case 'irrigation':
        return 'text-green-600 bg-green-100'
      case 'spray':
        return 'text-green-700 bg-green-200'
      case 'harvest':
        return 'text-green-800 bg-green-300'
      case 'expense':
        return 'text-green-900 bg-green-400'
    }
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-3xl font-bold text-primary flex items-center gap-2">
          <BarChart3 className="h-6 w-6 md:h-8 md:w-8" />
          <span className="hidden sm:inline">Farm Reports & Analytics</span>
          <span className="sm:hidden">Reports</span>
        </h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">
          <span className="hidden md:inline">
            View detailed farm data, generate insights, and export comprehensive reports
          </span>
          <span className="md:hidden">Generate and export farm reports</span>
        </p>
      </div>

      {/* Farm and Date Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Farm</Label>
              <Select
                value={selectedFarm?.id?.toString() || ''}
                onValueChange={(value) => {
                  const farm = farms.find((f) => f.id?.toString() === value)
                  setSelectedFarm(farm || null)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select farm" />
                </SelectTrigger>
                <SelectContent>
                  {farms.map((farm) => (
                    <SelectItem key={farm.id} value={farm.id!.toString()}>
                      {capitalize(farm.name)} ({farm.area} acres)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>From Date</Label>
              <DatePicker
                max={new Date().toISOString().split('T')[0]} // Prevent future dates
                value={exportOptions.dateRange?.from}
                onChange={(date) =>
                  setExportOptions((prev) => ({
                    ...prev,
                    dateRange: { ...prev.dateRange!, from: date }
                  }))
                }
              />
            </div>

            <div>
              <Label>To Date</Label>
              <DatePicker
                max={new Date().toISOString().split('T')[0]} // Prevent future dates
                min={exportOptions.dateRange?.from} // Ensure to date is not before from date
                value={exportOptions.dateRange?.to}
                onChange={(date) =>
                  setExportOptions((prev) => ({
                    ...prev,
                    dateRange: { ...prev.dateRange!, to: date }
                  }))
                }
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <Button
              onClick={generatePreview}
              disabled={loading}
              className="gap-2 flex-1 sm:flex-initial"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Generate Preview</span>
              <span className="sm:hidden">Preview</span>
            </Button>

            <Button
              onClick={() => handleExport('pdf')}
              disabled={!reportData || loading}
              variant="outline"
              className="gap-2 flex-1 sm:flex-initial"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Export PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>

            <Button
              onClick={() => handleExport('csv')}
              disabled={!reportData || loading}
              variant="outline"
              className="gap-2 flex-1 sm:flex-initial"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="sm:hidden">CSV</span>
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Summary */}
      {reportData && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <TrendingUp className="h-5 w-5" />
              Report Summary
            </CardTitle>
            <CardDescription className="text-sm">{reportData.summary.dateRange}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              <div className="text-center p-2 rounded-lg bg-blue-50">
                <div className="text-xl md:text-2xl font-bold text-blue-600">
                  {reportData.summary.totalRecords}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">Total Records</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-cyan-50">
                <div className="text-xl md:text-2xl font-bold text-cyan-600">
                  {(reportData.summary.totalWaterUsage || 0).toLocaleString()}
                  <span className="text-sm md:text-base"> L</span>
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">Water Usage</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-purple-50">
                <div className="text-xl md:text-2xl font-bold text-purple-600">
                  {reportData.summary.totalHarvest}
                  <span className="text-sm md:text-base"> kg</span>
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">Total Harvest</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-green-50">
                <div
                  className={`text-xl md:text-2xl font-bold ${reportData.summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  ₹{(reportData.summary.netProfit || 0).toLocaleString()}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">Net Profit</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Preview */}
      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Data Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={(value) => {
                setActiveTab(value as keyof RecordData)
                setCurrentPage(0)
              }}
            >
              {/* Mobile Select Dropdown */}
              <div className="block md:hidden mb-4">
                <Select
                  value={activeTab}
                  onValueChange={(value) => {
                    setActiveTab(value as keyof RecordData)
                    setCurrentPage(0)
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const Icon = getTabIcon(activeTab)
                          const count = reportData.data[activeTab].length
                          return (
                            <>
                              <Icon className="h-4 w-4" />
                              <span className="capitalize">{activeTab}</span>
                              <span className="text-xs text-muted-foreground">({count})</span>
                            </>
                          )
                        })()}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(reportData.data).map((tab) => {
                      const Icon = getTabIcon(tab as keyof RecordData)
                      const count = reportData.data[tab as keyof RecordData].length
                      return (
                        <SelectItem key={tab} value={tab}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span className="capitalize">{tab}</span>
                            <span className="text-xs text-muted-foreground">({count})</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Desktop Tabs */}
              <div className="hidden md:block">
                <TabsList className="grid w-full grid-cols-4">
                  {Object.keys(reportData.data).map((tab) => {
                    const Icon = getTabIcon(tab as keyof RecordData)
                    const count = reportData.data[tab as keyof RecordData].length

                    return (
                      <TabsTrigger
                        key={tab}
                        value={tab}
                        className="flex items-center gap-2 px-3 py-2"
                      >
                        <Icon className="h-4 w-4" />
                        <span className="capitalize">{tab}</span>
                        <span className="text-xs text-muted-foreground">({count})</span>
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
              </div>

              {Object.keys(reportData.data).map((tab) => (
                <TabsContent key={tab} value={tab} className="mt-6">
                  <div className="space-y-4">
                    {getCurrentPageRecords().length > 0 ? (
                      <>
                        {getCurrentPageRecords().map((record, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  {new Date(record.date).toLocaleDateString()}
                                </Badge>
                                {tab === 'irrigation' && <Badge>{record.growth_stage}</Badge>}
                                {tab === 'spray' && <Badge>{record.pest_disease}</Badge>}
                                {tab === 'harvest' && <Badge>{record.grade}</Badge>}
                                {tab === 'expense' && <Badge>{record.type}</Badge>}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                              {tab === 'irrigation' && (
                                <>
                                  <div className="bg-gray-50 p-2 rounded">
                                    <span className="text-muted-foreground block text-xs">
                                      Duration
                                    </span>
                                    <span className="font-medium">{record.duration}h</span>
                                  </div>
                                  <div className="bg-gray-50 p-2 rounded">
                                    <span className="text-muted-foreground block text-xs">
                                      Area
                                    </span>
                                    <span className="font-medium">{record.area} acres</span>
                                  </div>
                                  <div className="bg-gray-50 p-2 rounded">
                                    <span className="text-muted-foreground block text-xs">
                                      Discharge
                                    </span>
                                    <span className="font-medium">
                                      {record.system_discharge}L/h
                                    </span>
                                  </div>
                                  <div className="bg-gray-50 p-2 rounded">
                                    <span className="text-muted-foreground block text-xs">
                                      Moisture
                                    </span>
                                    <span className="font-medium">{record.moisture_status}</span>
                                  </div>
                                </>
                              )}
                              {tab === 'spray' && (
                                <>
                                  <div className="bg-gray-50 p-2 rounded">
                                    <span className="text-muted-foreground block text-xs">
                                      Chemical
                                    </span>
                                    <span className="font-medium">
                                      {record.chemical?.trim() || 'N/A'}
                                    </span>
                                  </div>
                                  <div className="bg-gray-50 p-2 rounded">
                                    <span className="text-muted-foreground block text-xs">
                                      Dose
                                    </span>
                                    <span className="font-medium">
                                      {record.dose?.trim() || 'N/A'}
                                    </span>
                                  </div>
                                  <div className="bg-gray-50 p-2 rounded">
                                    <span className="text-muted-foreground block text-xs">
                                      Area
                                    </span>
                                    <span className="font-medium">{record.area} acres</span>
                                  </div>
                                  <div className="bg-gray-50 p-2 rounded">
                                    <span className="text-muted-foreground block text-xs">
                                      Weather
                                    </span>
                                    <span className="font-medium">{record.weather}</span>
                                  </div>
                                </>
                              )}
                              {tab === 'harvest' && (
                                <>
                                  <div className="bg-gray-50 p-2 rounded">
                                    <span className="text-muted-foreground block text-xs">
                                      Quantity
                                    </span>
                                    <span className="font-medium">{record.quantity}kg</span>
                                  </div>
                                  <div className="bg-gray-50 p-2 rounded">
                                    <span className="text-muted-foreground block text-xs">
                                      Price
                                    </span>
                                    <span className="font-medium">₹{record.price || 'N/A'}</span>
                                  </div>
                                  <div className="bg-gray-50 p-2 rounded">
                                    <span className="text-muted-foreground block text-xs">
                                      Buyer
                                    </span>
                                    <span className="font-medium">{record.buyer || 'N/A'}</span>
                                  </div>
                                  <div className="bg-gray-50 p-2 rounded">
                                    <span className="text-muted-foreground block text-xs">
                                      Value
                                    </span>
                                    <span className="font-medium">
                                      ₹
                                      {record.price
                                        ? (
                                            (record.quantity || 0) * (record.price || 0)
                                          ).toLocaleString()
                                        : 'N/A'}
                                    </span>
                                  </div>
                                </>
                              )}
                              {tab === 'expense' && (
                                <>
                                  <div className="bg-gray-50 p-2 rounded">
                                    <span className="text-muted-foreground block text-xs">
                                      Type
                                    </span>
                                    <span className="font-medium">{record.type}</span>
                                  </div>
                                  <div className="bg-gray-50 p-2 rounded">
                                    <span className="text-muted-foreground block text-xs">
                                      Amount
                                    </span>
                                    <span className="font-medium">
                                      ₹{(record.cost || 0).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="bg-gray-50 p-2 rounded col-span-1 sm:col-span-2">
                                    <span className="text-muted-foreground block text-xs">
                                      Description
                                    </span>
                                    <span className="font-medium">{record.description}</span>
                                  </div>
                                </>
                              )}
                            </div>

                            {record.notes && (
                              <div className="mt-2 pt-2 border-t">
                                <span className="text-muted-foreground text-sm">Notes: </span>
                                <span className="text-sm">{record.notes}</span>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Pagination */}
                        {getTotalPages() > 1 && (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4">
                            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                              Page {currentPage + 1} of {getTotalPages()}
                              <span className="hidden sm:inline">
                                {' '}
                                ({getActiveRecords().length} total records)
                              </span>
                            </p>
                            <div className="flex gap-2 justify-center sm:justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                                disabled={currentPage === 0}
                                className="flex-1 sm:flex-initial"
                              >
                                <ChevronLeft className="h-4 w-4" />
                                <span className="hidden sm:inline">Previous</span>
                                <span className="sm:hidden">Prev</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setCurrentPage((prev) => Math.min(getTotalPages() - 1, prev + 1))
                                }
                                disabled={currentPage >= getTotalPages() - 1}
                                className="flex-1 sm:flex-initial"
                              >
                                <span className="hidden sm:inline">Next</span>
                                <span className="sm:hidden">Next</span>
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <div
                          className={`h-12 w-12 mx-auto rounded-lg ${getTabColor(tab as keyof RecordData)} flex items-center justify-center mb-4`}
                        >
                          {(() => {
                            const Icon = getTabIcon(tab as keyof RecordData)
                            return <Icon className="h-6 w-6" />
                          })()}
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No {tab} records</h3>
                        <p className="text-muted-foreground">
                          No {tab} data found for the selected date range
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* No Farm Selected */}
      {farms.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No farms found</h3>
            <p className="text-muted-foreground mb-4">
              Add a farm first to generate reports and analytics
            </p>
            <Button onClick={() => (window.location.href = '/farms')}>Add Your First Farm</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
