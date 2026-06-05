import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '../../../../../../lib/auth'
import { apiCall } from '../../../../../../lib/api'

async function requireAdmin() {
  const session = await getSession()
  if (!session?.accessToken) return null
  if ((session.user as { role?: string })?.role !== 'ADMIN') return null
  return session
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdmin()
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const body = await req.json()
    const data = await apiCall(`/admin/chapters/${params.id}/pages`, {
      method: 'POST',
      body: JSON.stringify(body),
      userToken: session.accessToken,
    })
    return NextResponse.json(data)
  } catch (err) {
    console.error('POST /admin/chapters/[id]/pages error:', err)
    return NextResponse.json({ error: 'Failed to create page' }, { status: 500 })
  }
}
