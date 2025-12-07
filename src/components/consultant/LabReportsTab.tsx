import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { FileText, Plus, TestTube, Leaf, Trash2 } from 'lucide-react'
import type { ClientLabReport } from '@/types/consultant'
import { useLabReportManagement } from '@/hooks/consultant/useLabReportManagement'

interface LabReportsTabProps {
  clientId: number
  reports: ClientLabReport[]
  onRefresh: () => void
}

export function LabReportsTab({ clientId, reports, onRefresh }: LabReportsTabProps) {
  const {
    showReportModal,
    setShowReportModal,
    isSubmitting,
    reportForm,
    setReportForm,
    handleAddReport,
    handleDeleteReport
  } = useLabReportManagement(clientId, onRefresh)

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Lab Reports</h2>
        <Button size="sm" onClick={() => setShowReportModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Report
        </Button>
      </div>

      {reports && reports.length > 0 ? (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        report.reportType === 'soil'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {report.reportType === 'soil' ? (
                        <TestTube className="h-5 w-5" />
                      ) : (
                        <Leaf className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold capitalize">{report.reportType} Test</h3>
                        <Badge variant="outline">
                          {new Date(report.testDate).toLocaleDateString()}
                        </Badge>
                      </div>
                      {report.labName && (
                        <p className="text-sm text-gray-500 mt-1">Lab: {report.labName}</p>
                      )}
                      {report.notes && <p className="text-sm text-gray-500 mt-1">{report.notes}</p>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteReport(report.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No lab reports added yet</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setShowReportModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Report
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Report Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Lab Report</DialogTitle>
            <DialogDescription>Add a soil or petiole test report for this client</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Report Type *</Label>
                <Select
                  value={reportForm.reportType}
                  onValueChange={(value) =>
                    setReportForm({ ...reportForm, reportType: value as 'soil' | 'petiole' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="soil">Soil Test</SelectItem>
                    <SelectItem value="petiole">Petiole Test</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Test Date *</Label>
                <Input
                  type="date"
                  value={reportForm.testDate as string}
                  onChange={(e) => setReportForm({ ...reportForm, testDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Lab Name</Label>
              <Input
                placeholder="e.g., Agricultural Lab, Pune"
                value={reportForm.labName || ''}
                onChange={(e) => setReportForm({ ...reportForm, labName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Add any notes about this report..."
                value={reportForm.notes || ''}
                onChange={(e) => setReportForm({ ...reportForm, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddReport} disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
