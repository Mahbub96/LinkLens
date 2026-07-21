'use client';

import Link from 'next/link';
import {
  Link2, BarChart3, QrCode, Shield, Zap, Globe, ArrowRight,
  ChevronRight, Sparkles, MousePointerClick, Layers, Code2
} from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Sub-5ms Redirects',
    description: 'Redis-cached Hot Path routing for instant link resolution at enterprise scale.',
  },
  {
    icon: BarChart3,
    title: 'Forensic Analytics',
    description: 'ClickHouse-powered real-time analytics with bot detection, VPN identification, and traffic scoring.',
  },
  {
    icon: Shield,
    title: 'Privacy-First',
    description: 'GDPR-compliant IP anonymization, zero third-party API calls, fully self-hosted.',
  },
  {
    icon: Globe,
    title: 'Dynamic Routing',
    description: 'Geo, device, OS, language, A/B testing – intelligent rule-based redirect engine.',
  },
  {
    icon: QrCode,
    title: 'Dynamic QR Codes',
    description: 'SVG/PNG generation with logo overlay, custom colors, and changeable destinations.',
  },
  {
    icon: Code2,
    title: 'Developer API',
    description: 'Full REST API with OpenAPI spec, API key management, and HMAC-signed webhooks.',
  },
];

const stats = [
  { value: '<5ms', label: 'Redirect Latency' },
  { value: '100K+', label: 'Clicks/Minute' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '365d', label: 'Data Retention' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-0">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-surface-0/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
              <Link2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">LinkLens</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors">Features</a>
            <a href="#stats" className="text-sm text-zinc-400 hover:text-white transition-colors">Performance</a>
            <a href="#pricing" className="text-sm text-zinc-400 hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-sm">Log in</Link>
            <Link href="/register" className="btn-primary text-sm">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Enterprise Link Intelligence Platform v2.0
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            <span className="text-white">Smart Links.</span>{' '}
            <span className="gradient-text">Deep Analytics.</span>{' '}
            <span className="text-white">Zero Cost.</span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            Self-hosted link intelligence with sub-5ms redirects, ClickHouse forensic analytics,
            dynamic QR codes, and enterprise RBAC – all at zero recurring API cost.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="btn-primary text-base px-8 py-3 text-lg glow"
            >
              <MousePointerClick className="w-5 h-5" />
              Start for Free
            </Link>
            <Link href="/login" className="btn-secondary text-base px-8 py-3">
              View Dashboard Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card text-center">
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-zinc-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Enterprise-Grade Features
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Built for scale, designed for security, optimized for speed.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="stat-card group">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4 group-hover:bg-brand-500/20 transition-colors">
                  <feature.icon className="w-5 h-5 text-brand-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="py-20 px-6 bg-surface-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Two-Path Architecture</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Separating hot-path redirects from cold-path analytics ensures zero latency impact on user experience.
            </p>
          </div>
          <div className="glass-card p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                  <h3 className="text-lg font-semibold text-emerald-400">Hot Path (Redirect)</h3>
                </div>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-emerald-400" />Incoming click → Caddy proxy</li>
                  <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-emerald-400" />NestJS resolves from Redis (&lt;2ms)</li>
                  <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-emerald-400" />Match rules evaluated (Geo, Device, OS)</li>
                  <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-emerald-400" />301/302 redirect sent to user</li>
                </ul>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-brand-400 animate-pulse-slow" />
                  <h3 className="text-lg font-semibold text-brand-400">Cold Path (Analytics)</h3>
                </div>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-brand-400" />Click event queued via BullMQ</li>
                  <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-brand-400" />Worker parses UA, detects bots</li>
                  <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-brand-400" />GDPR IP anonymization applied</li>
                  <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-brand-400" />Batch insert into ClickHouse</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Simple Pricing</h2>
            <p className="text-zinc-400">Self-host for free, or let us manage it for you.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Self-Hosted',
                price: 'Free',
                desc: 'Forever',
                features: ['Unlimited Links', 'Unlimited Clicks', 'Full Analytics', 'Docker Compose', 'Community Support'],
                cta: 'Get Started',
                highlight: false,
              },
              {
                name: 'Pro',
                price: '$29',
                desc: '/month',
                features: ['Everything in Free', 'Custom Domains', 'Team Workspaces (5)', 'Priority Support', 'Webhook Integrations'],
                cta: 'Upgrade to Pro',
                highlight: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                desc: '',
                features: ['Everything in Pro', 'SSO / SAML', 'Dedicated Infrastructure', '99.9% SLA', 'Custom Integrations'],
                cta: 'Contact Sales',
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`glass-card p-8 flex flex-col ${
                  plan.highlight ? 'border-brand-500/50 glow' : ''
                }`}
              >
                <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-zinc-500 ml-1">{plan.desc}</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                      <ChevronRight className="w-3 h-3 text-brand-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={plan.highlight ? 'btn-primary w-full' : 'btn-secondary w-full'}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
              <Link2 className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-white">LinkLens</span>
          </div>
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} LinkLens. Open-source enterprise link intelligence.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">Docs</a>
            <a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">API</a>
            <a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
