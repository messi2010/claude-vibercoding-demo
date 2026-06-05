import { getServerSession } from 'next-auth'
import { authOptions } from './auth-options'

export { getServerSession, authOptions }

export async function getSession() {
  return getServerSession(authOptions)
}
