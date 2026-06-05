import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '../../../../../lib/auth'
import { apiCall } from '../../../../../lib/api'

async function requireAdmin() {
  const session = await getSession()
  if (!session?.accessToken) return null
  if ((session.user as { role?: string })?.role !== 'ADMIN') return null
  return session
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdmin()
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const data = await apiCall(`/admin/chapters/${params.id}`, { userToken: session.accessToken })
    return NextResponse.json(data)
  } catch (err) {
    console.error('GET /admin/chapters/[id] error:', err)
    return NextResponse.json({ error: 'Failed to fetch chapter' }, { status: 500 })
  }
}
