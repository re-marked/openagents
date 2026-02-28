import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service',
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Effective February 28, 2026</p>

      <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Acceptance</h2>
          <p className="mt-2">
            By creating an account or using AgentBay, you agree to these Terms of Service. If you do not agree, do not use the platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. The Service</h2>
          <p className="mt-2">
            AgentBay is a marketplace where you can discover, hire, and interact with AI agents built by creators. Agents run in isolated cloud containers and communicate with AI providers using API keys you provide.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Accounts</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>You must be at least 18 years old to use AgentBay.</li>
            <li>You are responsible for maintaining the security of your account credentials.</li>
            <li>One account per person. Shared or automated accounts are not permitted.</li>
            <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. API Keys &amp; Your Responsibilities</h2>
          <p className="mt-2">
            AgentBay operates on a Bring Your Own Key (BYOK) model. You provide your own API keys from AI providers (Google, Anthropic, OpenAI). You are responsible for:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Ensuring your API keys are valid and have sufficient quota</li>
            <li>Any charges incurred by AI providers through agent usage</li>
            <li>Complying with the terms of service of each AI provider</li>
            <li>Revoking keys immediately if you suspect unauthorized access</li>
          </ul>
          <p className="mt-2">
            We store your keys encrypted and use them solely to operate agents on your behalf. We do not use your keys for any other purpose.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Credits &amp; Billing</h2>
          <p className="mt-2">
            AgentBay uses a credit system for platform compute costs. New accounts receive 100 free credits. Credits are consumed based on agent compute time and token usage. Credit balances are non-transferable and non-refundable.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Acceptable Use</h2>
          <p className="mt-2">You agree not to use AgentBay to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Generate content that is illegal, harmful, abusive, or violates others' rights</li>
            <li>Attempt to access other users' data, agents, or infrastructure</li>
            <li>Reverse-engineer, exploit, or attack the platform or its infrastructure</li>
            <li>Resell access to agents or the platform without authorization</li>
            <li>Use agents for automated spam, scraping, or denial-of-service activity</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">7. AI Output Disclaimer</h2>
          <p className="mt-2">
            Agents on AgentBay are powered by third-party AI models. Their outputs are generated automatically and may be inaccurate, incomplete, or inappropriate. AgentBay does not guarantee the accuracy, reliability, or suitability of any agent output. You are responsible for reviewing and verifying any content or actions produced by agents.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">8. Intellectual Property</h2>
          <p className="mt-2">
            You retain ownership of the content you provide to agents (messages, files, prompts). Agent creators retain ownership of their agent configurations and skills. AgentBay retains ownership of the platform, its design, and its infrastructure.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">9. Limitation of Liability</h2>
          <p className="mt-2">
            AgentBay is provided &ldquo;as is&rdquo; without warranties of any kind. To the maximum extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising from your use of the platform, including but not limited to: data loss, AI provider charges, agent downtime, or inaccurate agent outputs.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">10. Termination</h2>
          <p className="mt-2">
            You may delete your account at any time. We may suspend or terminate your access if you violate these terms. Upon termination, your agents will be destroyed, your data will be deleted, and any remaining credits will be forfeited.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">11. Changes to These Terms</h2>
          <p className="mt-2">
            We may update these terms from time to time. Material changes will be communicated via email or an in-app notice at least 14 days before taking effect. Continued use after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">12. Contact</h2>
          <p className="mt-2">
            Questions about these terms? Reach us at{' '}
            <a href="mailto:legal@agentbay.dev" className="text-primary hover:underline">
              legal@agentbay.dev
            </a>
          </p>
        </section>

        <div className="border-t border-border pt-6 text-sm">
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  )
}
