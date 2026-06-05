import { getServerSession } from 'next-auth'
import { authOptions } from '../app/api/auth/[...nextauth]/route'

export { getServerSession, authOptions }

export async function getSession() {
  return getServerSession(authOptions)
}
