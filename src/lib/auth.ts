import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  providers: [
    CredentialsProvider({
      id: 'admin-credentials',
      name: 'Admin Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const rawEmail = credentials.email.trim()
        const normalizedEmail = rawEmail.toLowerCase()

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: { equals: rawEmail } },
              { email: { equals: normalizedEmail } },
            ],
          },
          include: { volunteer: true },
        })

        if (!user || !user.isActive) return null

        // Check password
        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) return null

        // If user is a volunteer, check suspension and link if needed
        let volunteer = user.volunteer
        if (user.role === 'VOLUNTEER') {
          if (!volunteer) {
            volunteer = await prisma.volunteer.findFirst({
              where: {
                OR: [
                  { userId: user.id },
                  { email: user.email },
                  { email: normalizedEmail },
                ],
              },
            })
            if (volunteer && !volunteer.userId) {
              await prisma.volunteer.update({
                where: { id: volunteer.id },
                data: { userId: user.id },
              })
            }
          }
          if (volunteer?.isSuspended) return null
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        const isVolunteer = user.role === 'VOLUNTEER'

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isVolunteer,
          volunteerId: volunteer?.id,
        }
      },
    }),
    CredentialsProvider({
      id: 'volunteer-credentials',
      name: 'Volunteer Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const rawEmail = credentials.email.trim()
        const normalizedEmail = rawEmail.toLowerCase()

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: { equals: rawEmail } },
              { email: { equals: normalizedEmail } },
            ],
          },
          include: { volunteer: true },
        })

        if (!user || !user.isActive) return null

        // Link volunteer record if not already linked
        let volunteer = user.volunteer
        if (!volunteer) {
          volunteer = await prisma.volunteer.findFirst({
            where: {
              OR: [
                { userId: user.id },
                { email: user.email },
                { email: normalizedEmail },
              ],
            },
          })
          if (volunteer && !volunteer.userId) {
            await prisma.volunteer.update({
              where: { id: volunteer.id },
              data: { userId: user.id },
            })
          }
        }

        // If volunteer is suspended, deny login
        if (volunteer?.isSuspended) return null

        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) return null

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        const isVolunteer = user.role === 'VOLUNTEER'

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isVolunteer,
          volunteerId: volunteer?.id,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role: string }).role
        token.isVolunteer = (user as { isVolunteer: boolean }).isVolunteer
        token.volunteerId = (user as { volunteerId?: string }).volunteerId
      }
      if (token?.isVolunteer && !token.volunteerId && token.id) {
        try {
          const v = await prisma.volunteer.findFirst({
            where: {
              OR: [
                { userId: token.id as string },
                { email: (token.email as string) || '' },
              ],
            },
            select: { id: true },
          })
          if (v) token.volunteerId = v.id
        } catch (e) {}
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.isVolunteer = token.isVolunteer as boolean
        session.user.volunteerId = token.volunteerId as string | undefined
      }
      return session
    },
  },
}
