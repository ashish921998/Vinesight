'use client'

/**
 * AuditLogViewer - View organization audit trail
 * Admin/Owner only component showing all organization actions
 */

import { useState, useEffect } from 'react'
import { useOrganization } from '@/contexts/OrganizationContext'
import { auditLogger } from '@/lib/audit-logger'
import type { AuditAction } from '@/types/rbac'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, Filter, Download, Calendar, User, Activity } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { RequireAdmin } from '@/components/rbac/PermissionGuard'

const ACTION_COLORS: Record<AuditAction, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  export: 'bg-purple-100 text-purple-700',
  import: 'bg-indigo-100 text-indigo-700',
  invite: 'bg-cyan-100 text-cyan-700',
  remove: 'bg-orange-100 text-orange-700',
  login: 'bg-gray-100 text-gray-700',
  logout: 'bg-gray-100 text-gray-700',
  view: 'bg-gray-100 text-gray-700'
}

export function AuditLogViewer() {
  const { currentOrganization } = useOrganization()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterAction, setFilterAction] = useState<AuditAction | 'all'>('all')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedLog, setSelectedLog] = useState<any | null>(null)
  const pageSize = 50

  // Reset page to 1 when organization changes to prevent out-of-bounds requests
  useEffect(() => {
    if (currentOrganization) {
      setPage(1)
    }
  }, [currentOrganization?.id])

  // Load logs when organization, filter, or page changes
  useEffect(() => {
    if (currentOrganization) {
      loadLogs()
    }
  }, [currentOrganization, filterAction, page])

  const loadLogs = async () => {
    if (!currentOrganization) return

    // Capture the organization ID at the start of the request
    const requestOrgId = currentOrganization.id
    setLoading(true)
    try {
      const { data, count } = await auditLogger.getOrganizationLogs(currentOrganization.id, {
        limit: pageSize,
        offset: (page - 1) * pageSize,
        action: filterAction === 'all' ? undefined : filterAction
      })

      // Only update state if we're still on the same organization
      if (currentOrganization?.id === requestOrgId) {
        setLogs(data || [])
        setTotalCount(count || 0)
      }
    } catch (error) {
      console.error('Error loading audit logs:', error)
    } finally {
      // Only update loading state if we're still on the same organization
      if (currentOrganization?.id === requestOrgId) {
        setLoading(false)
      }
    }
  }

  const handleExport = async () => {
    if (!logs || logs.length === 0) return

    // Create CSV content
    const headers = ['Timestamp', 'User', 'Action', 'Resource', 'Details']
    const rows = logs.map((log) => [
      format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      log.user_id ? log.user_id.slice(0, 8) : 'System',
      log.action,
      log.resource_type,
      log.resource_id || ''
    ])

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const formatResourceType = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  if (!currentOrganization) {
    return null
  }

  return (
    <RequireAdmin
      fallback={
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Admin access required to view audit logs</p>
          </CardContent>
        </Card>
      }
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Audit Logs
              </CardTitle>
              <CardDescription>
                Complete audit trail of all actions in your organization
              </CardDescription>
            </div>

            <Button
              onClick={handleExport}
              variant="outline"
              className="gap-2"
              disabled={loading || logs.length === 0}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter:</span>
            </div>

            <Select
              value={filterAction}
              onValueChange={(value) => {
                setFilterAction(value as AuditAction | 'all')
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="export">Export</SelectItem>
                <SelectItem value="invite">Invite</SelectItem>
                <SelectItem value="remove">Remove</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground ml-auto">
              Showing {logs.length} of {totalCount} entries
            </div>
          </div>

          {/* Logs Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Activity className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">No audit logs found</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Timestamp</TableHead>
                    <TableHead className="w-[120px]">User</TableHead>
                    <TableHead className="w-[100px]">Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Resource ID</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">
                              {format(new Date(log.timestamp), 'MMM d, yyyy')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(log.timestamp), 'HH:mm:ss')}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-mono">
                            {log.user_id ? log.user_id.slice(0, 8) : 'System'}
                          </span>
                        </div>
                        {log.user_role && (
                          <Badge variant="outline" className="text-xs mt-1 capitalize">
                            {log.user_role.replace('_', ' ')}
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${ACTION_COLORS[log.action as AuditAction]} capitalize`}
                        >
                          {log.action}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <span className="text-sm">{formatResourceType(log.resource_type)}</span>
                      </TableCell>

                      <TableCell>
                        {log.resource_id && (
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {log.resource_id.slice(0, 12)}...
                          </code>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          {log.metadata?.note || log.metadata?.description || '-'}
                        </div>
                        {(log.old_values || log.new_values) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs mt-1"
                            onClick={() => setSelectedLog(log)}
                          >
                            View Changes
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Changes Dialog */}
      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Audit Log Changes</DialogTitle>
              <DialogDescription>
                {selectedLog.action} on {formatResourceType(selectedLog.resource_type)} at{' '}
                {format(new Date(selectedLog.timestamp), 'PPpp')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedLog.old_values && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Previous Values</h4>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}
              {selectedLog.new_values && (
                <div>
                  <h4 className="font-medium text-sm mb-2">New Values</h4>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </RequireAdmin>
  )
}
