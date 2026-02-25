import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@openagents/ui', '@openagents/db'],
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
