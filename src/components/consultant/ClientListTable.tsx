import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Users,
  Phone,
  Mail,
  Sprout,
  FileText,
  Clipboard,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus
} from 'lucide-react'
import type { ClientSummary } from '@/types/consultant'

interface ClientListTableProps {
  clients: ClientSummary[]
  isLoading: boolean
  searchQuery: string
  onDelete: (id: number) => void
  onAddClient: () => void
}

export function ClientListTable({
  clients,
  isLoading,
  searchQuery,
  onDelete,
  onAddClient
}: ClientListTableProps) {
  const router = useRouter()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'inactive':
        return <Badge className="bg-yellow-100 text-yellow-800">Inactive</Badge>
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800">Archived</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery ? 'No clients found' : 'No clients yet'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchQuery
              ? 'Try adjusting your search query'
              : 'Add your first client to start managing their farms and recommendations'}
          </p>
          {!searchQuery && (
            <Button onClick={onAddClient}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Your First Client
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {clients.map((client) => (
        <Card
          key={client.id}
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push(`/clients/${client.id}`)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary">
                    {client.clientName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{client.clientName}</h3>
                    {getStatusBadge(client.status)}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    {client.clientPhone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {client.clientPhone}
                      </span>
                    )}
                    {client.clientEmail && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {client.clientEmail}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {/* Stats */}
                <div className="hidden sm:flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Sprout className="h-4 w-4" />
                      <span className="font-medium">{client.farmCount}</span>
                    </div>
                    <span className="text-xs text-gray-400">Farms</span>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-gray-600">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">{client.reportCount}</span>
                    </div>
                    <span className="text-xs text-gray-400">Reports</span>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clipboard className="h-4 w-4" />
                      <span className="font-medium">{client.recommendationCount}</span>
                    </div>
                    <span className="text-xs text-gray-400">Plans</span>
                  </div>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/clients/${client.id}`)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(client.id)
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
