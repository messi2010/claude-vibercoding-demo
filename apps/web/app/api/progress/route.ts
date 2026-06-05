import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '../../../lib/auth'
import { apiCall } from '../../../lib/api'

export async function GET(_req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await apiCall('/progress', { userToken: session.accessToken })
    return NextResponse.json(data)
  } catch (err) {
    console.error('GET /progress error:', err)
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = await apiCall('/progress', {
      method: 'PATCH',
      body: JSON.stringify(body),
      userToken: session.accessToken,
    })
    return NextResponse.json(data)
  } catch (err) {
    console.error('PATCH /progress error:', err)
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
  }
}
