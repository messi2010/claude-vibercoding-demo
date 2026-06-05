import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@truyen/db'

export async function POST(req: NextRequest) {
  const { email, password, name, dob } = await req.json()

  if (!email || !password || !dob) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const parsedDob = new Date(dob)
  if (isNaN(parsedDob.getTime())) {
    return NextResponse.json({ error: 'Invalid date of birth' }, { status: 400 })
  }

  const age = Math.floor(
    (Date.now() - parsedDob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  )
  const isAgeVerified = age >= 18

  const hashed = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      email,
      name: name || null,
      password: hashed,
      dob: parsedDob,
      isAgeVerified,
    },
  })

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
}
