import { NextRequest, NextResponse } from 'next/server'
import { DocumentService } from '@/lib/document-service'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { path, expiresIn } = await request.json()

    if (typeof path !== 'string' || path.length === 0) {
      return NextResponse.json({ error: 'Storage path is required' }, { status: 400 })
    }

    const signedUrl = await DocumentService.createSignedUrl(
      path,
      typeof expiresIn === 'number' ? expiresIn : undefined
    )

    return NextResponse.json({ signedUrl })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate signed URL'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
