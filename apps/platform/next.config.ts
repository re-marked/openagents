import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@agentbay/ui', '@agentbay/db'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

export default nextConfig
