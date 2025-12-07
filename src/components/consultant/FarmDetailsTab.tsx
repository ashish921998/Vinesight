import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Sprout, Plus, MapPin, MoreVertical, Edit, Trash2 } from 'lucide-react'
import type { ClientFarm } from '@/types/consultant'
import { useFarmManagement } from '@/hooks/consultant/useFarmManagement'

interface FarmDetailsTabProps {
  clientId: number
  farms: ClientFarm[]
  onRefresh: () => void
}

export function FarmDetailsTab({ clientId, farms, onRefresh }: FarmDetailsTabProps) {
  const {
    showFarmModal,
    setShowFarmModal,
    editingFarm,
    isSubmitting,
    farmForm,
    setFarmForm,
    handleAddFarm,
    handleDeleteFarm,
    openEditFarm,
    resetFarmForm
  } = useFarmManagement(clientId, onRefresh)

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Client Farms</h2>
        <Button
          size="sm"
          onClick={() => {
            resetFarmForm()
            setShowFarmModal(true)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Farm
        </Button>
      </div>

      {farms && farms.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {farms.map((farm) => (
            <Card key={farm.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{farm.farmName}</h3>
                    <div className="text-sm text-gray-500 mt-1 space-y-1">
                      {farm.area && (
                        <p>
                          {farm.area} {farm.areaUnit || 'acres'}
                        </p>
                      )}
                      {farm.grapeVariety && <p>Variety: {farm.grapeVariety}</p>}
                      {(farm.village || farm.district) && (
                        <p className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {[farm.village, farm.district].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditFarm(farm)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteFarm(farm.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <Sprout className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No farms added yet</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                resetFarmForm()
                setShowFarmModal(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Farm
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Farm Modal */}
      <Dialog open={showFarmModal} onOpenChange={setShowFarmModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingFarm ? 'Edit Farm' : 'Add Farm'}</DialogTitle>
            <DialogDescription>
              {editingFarm ? 'Update farm details' : 'Add a farm for this client'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Farm Name *</Label>
              <Input
                placeholder="e.g., Main Vineyard"
                value={farmForm.farmName}
                onChange={(e) => setFarmForm({ ...farmForm, farmName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Area</Label>
                <Input
                  type="number"
                  placeholder="e.g., 5"
                  value={farmForm.area || ''}
                  onChange={(e) =>
                    setFarmForm({ ...farmForm, area: parseFloat(e.target.value) || undefined })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Grape Variety</Label>
                <Input
                  placeholder="e.g., Thompson Seedless"
                  value={farmForm.grapeVariety || ''}
                  onChange={(e) => setFarmForm({ ...farmForm, grapeVariety: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Village</Label>
                <Input
                  placeholder="Village name"
                  value={farmForm.village || ''}
                  onChange={(e) => setFarmForm({ ...farmForm, village: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>District</Label>
                <Input
                  placeholder="District name"
                  value={farmForm.district || ''}
                  onChange={(e) => setFarmForm({ ...farmForm, district: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Soil Type</Label>
                <Input
                  placeholder="e.g., Black soil"
                  value={farmForm.soilType || ''}
                  onChange={(e) => setFarmForm({ ...farmForm, soilType: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Irrigation Type</Label>
                <Input
                  placeholder="e.g., Drip"
                  value={farmForm.irrigationType || ''}
                  onChange={(e) => setFarmForm({ ...farmForm, irrigationType: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFarmModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddFarm} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingFarm ? 'Update Farm' : 'Add Farm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
