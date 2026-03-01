import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Effective February 28, 2026</p>

      <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. What We Collect</h2>
          <p className="mt-2">
            When you use AgentBay, we collect the following information:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li><strong className="text-foreground">Account information</strong> &mdash; your email address and profile details provided through Google or GitHub OAuth.</li>
            <li><strong className="text-foreground">API keys</strong> &mdash; keys you provide for AI providers (Google, Anthropic, OpenAI). These are stored encrypted and used solely to power your agents.</li>
            <li><strong className="text-foreground">Conversation data</strong> &mdash; messages exchanged with your agents, stored to maintain chat history.</li>
            <li><strong className="text-foreground">Usage data</strong> &mdash; token counts and compute time for usage analytics.</li>
            <li><strong className="text-foreground">Technical data</strong> &mdash; IP address, browser type, and device information for security and performance.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. How We Use Your Data</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Authenticate and manage your account</li>
            <li>Provision and operate AI agent containers on your behalf</li>
            <li>Route your API keys to agent runtimes (keys are never logged or shared)</li>
            <li>Track usage for usage dashboards and analytics</li>
            <li>Improve the platform and diagnose technical issues</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Data Storage &amp; Security</h2>
          <p className="mt-2">
            Your data is stored in Supabase (hosted on AWS) with encryption at rest and in transit. API keys are stored in an encrypted column and injected into isolated agent containers at runtime &mdash; they are never stored in plain text in logs or configuration files.
          </p>
          <p className="mt-2">
            Agent containers run on Fly.io in isolated Firecracker microVMs. Each agent has its own ephemeral environment that is destroyed when removed.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Third-Party Services</h2>
          <p className="mt-2">We use the following third-party services to operate AgentBay:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li><strong className="text-foreground">Supabase</strong> &mdash; database, authentication, and real-time features</li>
            <li><strong className="text-foreground">Google OAuth / GitHub OAuth</strong> &mdash; account sign-in</li>
            <li><strong className="text-foreground">Fly.io</strong> &mdash; agent compute infrastructure</li>
            <li><strong className="text-foreground">AI providers (Google, Anthropic, OpenAI)</strong> &mdash; your API keys are passed directly to these providers; we do not proxy or store their responses</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Cookies</h2>
          <p className="mt-2">
            We use essential cookies for authentication (Supabase session tokens). We do not use third-party tracking cookies or advertising pixels.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Data Retention</h2>
          <p className="mt-2">
            Your data is retained for as long as your account is active. Conversation history and usage records are kept to provide you with chat history and usage analytics. When you delete your account, all associated data (conversations, API keys, agent instances, usage records) is permanently deleted via cascade.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">7. Your Rights</h2>
          <p className="mt-2">You have the right to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Access the data we store about you</li>
            <li>Delete your API keys at any time through Settings</li>
            <li>Delete your account and all associated data</li>
            <li>Export your conversation history</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">8. Changes to This Policy</h2>
          <p className="mt-2">
            We may update this policy from time to time. Material changes will be communicated via email or an in-app notice. Continued use of AgentBay after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">9. Contact</h2>
          <p className="mt-2">
            Questions about this policy? Reach us at{' '}
            <a href="mailto:privacy@agentbay.dev" className="text-primary hover:underline">
              privacy@agentbay.dev
            </a>
          </p>
        </section>

        <div className="border-t border-border pt-6 text-sm">
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>
        </div>
      </div>
    </div>
  )
}
