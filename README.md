# OpenAgents Marketplace

FreeClaw marketplace v2 - Clean rebuild with Next.js 15 monorepo architecture.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
cd apps/marketplace
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the marketplace.

## 📁 Project Structure

```
openagents/
├── apps/
│   └── marketplace/        # Main marketplace app (Next.js 15)
│       ├── app/           # App router pages
│       ├── components/    # React components
│       └── lib/           # Utilities & Supabase client
├── packages/              # Shared packages (future)
│   └── ui/               # Shared UI components
├── pnpm-workspace.yaml   # Monorepo workspace config
└── package.json          # Root package.json
```

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui
- **Auth:** Supabase (Google OAuth)
- **Data Fetching:** TanStack Query (React Query)
- **Validation:** Zod
- **Monorepo:** pnpm workspaces

## 🔧 Development

### Available Scripts

```bash
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm type-check   # Type check with TypeScript
```

### Adding shadcn/ui Components

```bash
cd apps/marketplace
npx shadcn@latest add button
```

## 🗄️ Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Enable Google OAuth in Authentication > Providers
3. Copy your project URL and anon key to `.env.local`
4. Add callback URL: `http://localhost:3000/auth/callback` (and production URL)

## 🚢 Deployment

### Vercel

1. Import the repository in Vercel
2. Set root directory to `./`
3. Add environment variables (Supabase credentials)
4. Deploy!

The monorepo is configured to build the marketplace app automatically.

## 📝 Environment Variables

Required variables in `apps/marketplace/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🏗️ Building Features

The scaffold includes:

- ✅ Next.js 15 with App Router
- ✅ TypeScript strict mode
- ✅ Tailwind CSS + shadcn/ui setup
- ✅ Supabase client & auth helpers
- ✅ Google OAuth flow (login/logout)
- ✅ Protected routes (middleware)
- ✅ React Query provider
- ✅ ESLint + Prettier

Ready to build on top of! 🎉

## 📚 Next Steps

1. Set up Supabase database schema
2. Create deployment wizard UI
3. Implement container management
4. Add payment integration
5. Build admin dashboard

---

**License:** Private  
**Repository:** [github.com/kofiol/openagents](https://github.com/kofiol/openagents)
