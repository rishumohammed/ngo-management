import type { Metadata } from 'next'
import { Roboto } from 'next/font/google'
import Providers from './providers'

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'FMF Trust Management',
    template: '%s | FMF Trust Management',
  },
  description:
    'Internal management system for Free Mind Foundation — members, volunteers, donations, and governance.',
  robots: 'noindex, nofollow', // Internal app — keep private
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
