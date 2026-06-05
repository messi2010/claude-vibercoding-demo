import { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import bcrypt from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { prisma, AuthProvider } from '@truyen/db'

export const authOptions: AuthOptions = {
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) return null

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isAgeVerified: user.isAgeVerified,
          dobSubmitted: user.dob !== null,
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider && account.provider !== 'credentials') {
        const provider =
          account.provider === 'google' ? AuthProvider.GOOGLE : AuthProvider.FACEBOOK

        const existing = await prisma.user.findUnique({
          where: { email: user.email! },
        })

        if (!existing) {
          const newUser = await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name,
              avatar: user.image,
              provider,
              isAgeVerified: false,
            },
          })
          user.id = newUser.id
        } else {
          user.id = existing.id
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
        if (dbUser) {
          token.userId = dbUser.id
          token.role = dbUser.role
          token.isAgeVerified = dbUser.isAgeVerified
          token.dobSubmitted = dbUser.dob !== null
        }
      }
      token.accessToken = sign(
        {
          sub: token.userId,
          email: token.email,
          role: token.role,
          isAgeVerified: token.isAgeVerified,
          dobSubmitted: token.dobSubmitted,
        },
        process.env.NEXTAUTH_SECRET!,
        { expiresIn: '7d' }
      )
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string
        session.user.role = token.role as string
        session.user.isAgeVerified = token.isAgeVerified as boolean
        session.user.dobSubmitted = token.dobSubmitted as boolean
        session.accessToken = token.accessToken as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/login',
  },
}
