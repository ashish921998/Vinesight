'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FlaskConical, Calendar } from 'lucide-react'
import type { FertilizerPlanWithItems } from '@/lib/fertilizer-plan-service'
import { TriageService, type AcknowledgmentType } from '@/lib/triage-service'
import { PlanAcknowledgment } from './PlanAcknowledgment'

interface TriageLink {
  triageId: string
  acknowledgment: AcknowledgmentType | null
}

interface FertilizerPlanViewProps {
  plans: FertilizerPlanWithItems[]
}

export function FertilizerPlanView({ plans }: FertilizerPlanViewProps) {
  const [triageLinks, setTriageLinks] = useState<Record<string, TriageLink>>({})

  useEffect(() => {
    const loadTriageLinks = async () => {
      const links: Record<string, TriageLink> = {}
      for (const plan of plans) {
        try {
          const result = await TriageService.getTriageByPlanId(plan.id)
          if (result) {
            links[plan.id] = result
          }
        } catch {
          // Plan may not be linked to a triage entry
        }
      }
      setTriageLinks(links)
    }

    if (plans.length > 0) {
      loadTriageLinks()
    }
  }, [plans])

  if (plans.length === 0) {
    return null
  }

  const handleAcknowledge = (planId: string, type: AcknowledgmentType) => {
    setTriageLinks((prev) => ({
      ...prev,
      [planId]: { ...prev[planId], acknowledgment: type }
    }))
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <FlaskConical className="h-5 w-5 text-green-600" />
        Fertilizer Plans from Your Agronomist
      </h2>

      <div className="grid gap-4">
        {plans.map((plan) => {
          const triage = triageLinks[plan.id]

          return (
            <div key={plan.id} className="space-y-3">
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-green-900">{plan.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1 text-green-700">
                    <Calendar className="h-3.5 w-3.5" />
                    Created {new Date(plan.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {plan.notes && <p className="text-sm text-green-800 mb-4">{plan.notes}</p>}

                  <div className="space-y-2">
                    {plan.items.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-green-200"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-green-600 font-medium w-5">
                            {index + 1}.
                          </span>
                          <div>
                            <p className="font-medium text-green-900">{item.fertilizer_name}</p>
                            <p className="text-sm text-green-700">
                              {item.quantity} {item.unit}
                              {item.application_frequency > 1 &&
                                ` x ${item.application_frequency} times`}
                              {item.application_method && ` - ${item.application_method}`}
                            </p>
                            {item.notes && (
                              <p className="text-xs text-green-600 mt-1">{item.notes}</p>
                            )}
                          </div>
                        </div>
                        {item.application_date && (
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                            {new Date(item.application_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {triage && (
                <PlanAcknowledgment
                  triageId={triage.triageId}
                  planTitle={plan.title}
                  initialAcknowledgment={triage.acknowledgment}
                  onAcknowledge={(type) => handleAcknowledge(plan.id, type)}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
