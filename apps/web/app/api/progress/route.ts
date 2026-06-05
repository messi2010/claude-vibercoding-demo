import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '../../../lib/auth'
import { apiCall } from '../../../lib/api'

export async function GET(_req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await apiCall('/progress', { userToken: session.accessToken as string })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const data = await apiCall('/progress', {
    method: 'PATCH',
    body: JSON.stringify(body),
    userToken: session.accessToken as string,
  })
  return NextResponse.json(data)
}
