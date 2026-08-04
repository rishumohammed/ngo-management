import 'next-auth'
import { UserRole } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
      isVolunteer: boolean
      volunteerId?: string
    }
  }

  interface User {
    id: string
    role: UserRole
    isVolunteer: boolean
    volunteerId?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    isVolunteer: boolean
    volunteerId?: string
  }
}
