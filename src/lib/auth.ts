import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

const M8VEN_API_URL = process.env.NEXT_PUBLIC_M8VEN_API_URL!
const M8VEN_API_KEY = process.env.M8VEN_API_KEY!

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const res = await fetch(`${M8VEN_API_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${M8VEN_API_KEY}`,
          },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        })

        if (!res.ok) return null

        const data = await res.json()
        return {
          id: data.userId,
          email: credentials.email as string,
          role: data.role,
          brandId: data.brandId,
          passportId: data.passportId,
          accessToken: data.accessToken,
          expiresAt: data.expiresAt,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
        token.role = (user as Record<string, unknown>).role
        token.brandId = (user as Record<string, unknown>).brandId
        token.passportId = (user as Record<string, unknown>).passportId
        token.accessToken = (user as Record<string, unknown>).accessToken
        token.expiresAt = (user as Record<string, unknown>).expiresAt
      }
      return token
    },
    async session({ session, token }) {
      return {
        ...session,
        userId: token.userId as string,
        role: token.role as 'brand' | 'vendor',
        brandId: token.brandId as string | undefined,
        passportId: token.passportId as string | undefined,
        accessToken: token.accessToken as string,
        expiresAt: token.expiresAt as number,
      }
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'jwt',
  },
})
