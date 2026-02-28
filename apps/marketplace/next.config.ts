import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@agentbay/ui', '@agentbay/db'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
    staleTimes: {
      // Next.js 15 defaults dynamic to 0s, which causes the workspace layout
      // to re-fetch on every sidebar click (10+ DB queries). Cache for 30s.
      dynamic: 30,
    },
  },
}

export default nextConfig
