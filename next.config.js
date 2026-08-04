/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma', '@react-pdf/renderer'],
  },
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig
