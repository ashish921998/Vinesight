import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  const t0 = performance.now()
  try {
    const contentType = req.headers.get('content-type') || ''
    let hasFile = false
    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      const file = form.get('file') as File | null
      hasFile = !!file
    } else {
      await req.json().catch(() => ({}))
    }

    const diseases = ['Powdery Mildew','Downy Mildew','Botrytis Bunch Rot','Black Rot','Healthy Plant'] as const
    const pick = diseases[Math.floor(Math.random() * diseases.length)]
    const confidence = pick === 'Healthy Plant' ? 0.9 : 0.7 + Math.random() * 0.25
    const severity = pick === 'Healthy Plant' ? 'low' : confidence > 0.9 ? 'critical' : confidence > 0.8 ? 'high' : 'medium'

    const result = {
      diseaseDetection: {
        disease: pick,
        confidence,
        severity,
        treatment: pick === 'Healthy Plant' ? [] : ['Improve air circulation','Apply recommended fungicide'],
        description: pick === 'Healthy Plant' ? 'No visible disease symptoms' : 'Potential fungal symptoms detected',
        preventionTips: ['Maintain canopy','Monitor humidity']
      },
      plantHealth: {
        overallHealth: pick === 'Healthy Plant' ? 90 + Math.random() * 10 : 50 + Math.random() * 30,
        leafColor: pick === 'Healthy Plant' ? 'healthy' : (Math.random() > 0.5 ? 'yellowing' : 'spotted'),
        leafDamage: pick === 'Healthy Plant' ? Math.random() * 5 : 10 + Math.random() * 30
      },
      grapeClusterCount: Math.floor(3 + Math.random() * 8),
      berrySize: (['small','medium','large'] as const)[Math.floor(Math.random() * 3)],
      ripeness: (['unripe','veraison','ripe','overripe'] as const)[Math.floor(Math.random() * 4)]
    }

    const t1 = performance.now()
    logger.info(`Vision analysis (stub) ${hasFile ? 'with file' : 'no file'} in ${(t1 - t0).toFixed(1)}ms`)

    return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Vision analysis failed' }), { status: 500 })
  }
}
