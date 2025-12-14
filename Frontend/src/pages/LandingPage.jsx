import React from 'react'
import { Container, Heading, Text, Button, Flex } from '@radix-ui/themes'
import { 
  SignedIn, 
  SignedOut, 
  SignUpButton
} from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom'
import {
  ArrowRightIcon,
  PersonIcon,
  Pencil2Icon,
  LockClosedIcon,
  FileTextIcon,
  LightningBoltIcon,
  ClockIcon,
  GitHubLogoIcon,
  LinkedInLogoIcon,
} from '@radix-ui/react-icons'

const features = [
  {
    icon: PersonIcon,
    title: 'Real-time Collaboration',
    description:
      "See who's editing what, when they're editing it. Multiple cursors, live updates, and seamless collaboration.",
    colorVar: '--accent-11',
  },
  {
    icon: Pencil2Icon,
    title: 'Markdown-first Editor',
    description:
      'Type naturally with Markdown shortcuts. Add headings, lists, checkboxes, tables, and fenced code blocks with syntax highlighting — fast and distraction‑free.',
    colorVar: '--accent-11',
  },
  {
    icon: FileTextIcon,
    title: 'Smart Document Management',
    description:
      'Organize your documents in vaults with powerful search, tagging, and version control.',
    colorVar: '--blue-11',
  },
  {
    icon: LightningBoltIcon,
    title: 'Lightning Fast',
    description:
      'Built for performance. Changes sync instantly across all devices and team members.',
    colorVar: '--green-11',
  },
  {
    icon: LockClosedIcon,
    title: 'Enterprise Security',
    description:
      'End-to-end encryption, role-based permissions, and enterprise-grade security controls.',
    colorVar: '--accent-11',
  },
  {
    icon: ClockIcon,
    title: 'Activity Tracking',
    description:
      "See who's active, what they're working on, and track document engagement in real-time.",
    colorVar: '--green-11',
  },
]

// Small rotating markdown code teaser with subtle fade transitions
function CodeTeaser() {
  const snippets = React.useMemo(
    () => [
      (
        <pre className="text-[12px] leading-5 font-mono text-[var(--gray-12)] whitespace-pre-wrap">
{`# Getting started

- Write with **Markdown**
- Add tasks: [ ] and [x]

\`\`\`js`}
<span style={{ color: 'var(--blue-11)' }}>function</span>{' '}
<span style={{ color: 'var(--accent-11)' }}>hello</span>() {'{'}
  {'\n  '}console.<span style={{ color: 'var(--accent-11)' }}>log</span>(<span style={{ color: 'var(--green-11)' }}>'Hi Scribe!'</span>);
  {'\n'}{' }'}
{`
\`\`\``}
        </pre>
      ),
      (
        <pre className="text-[12px] leading-5 font-mono text-[var(--gray-12)] whitespace-pre-wrap">
{`## Notes & Tips

> Pro-tip: Use shortcuts
`}
<span style={{ color: 'var(--blue-11)' }}>-</span> <span style={{ color: 'var(--accent-11)' }}>Cmd</span> + <span style={{ color: 'var(--accent-11)' }}>B</span> <span style={{ color: 'var(--gray-11)' }}>to toggle</span> <span style={{ color: 'var(--green-11)' }}>bold</span>
{`\n`}
<span style={{ color: 'var(--blue-11)' }}>-</span> <span style={{ color: 'var(--accent-11)' }}>Cmd</span> + <span style={{ color: 'var(--accent-11)' }}>I</span> <span style={{ color: 'var(--gray-11)' }}>for</span> <span style={{ color: 'var(--green-11)' }}>italic</span>
        </pre>
      ),
      (
        <pre className="text-[12px] leading-5 font-mono text-[var(--gray-12)] whitespace-pre-wrap">
{`### Tasks
[ ] Write docs
[x] Set up collaboration
`}
<span style={{ color: 'var(--blue-11)' }}>\`\`\`bash</span>
{`\n`}
<span style={{ color: 'var(--accent-11)' }}>npm</span> <span style={{ color: 'var(--green-11)' }}>run</span> <span style={{ color: 'var(--green-11)' }}>dev</span>
{`\n`}
<span style={{ color: 'var(--blue-11)' }}>\`\`\`</span>
        </pre>
      ),
    ],
    []
  )

  const [idx, setIdx] = React.useState(0)
  const [visible, setVisible] = React.useState(true)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      const t = setTimeout(() => {
        setIdx((i) => (i + 1) % snippets.length)
        setVisible(true)
      }, 200)
      return () => clearTimeout(t)
    }, 3600)
    return () => clearInterval(interval)
  }, [snippets.length])

  return (
    <div className="rounded-xl bg-[var(--gray-2)]/95 border border-[var(--gray-6)] shadow-lg backdrop-blur-sm p-3 w-full sm:w-80">
      <div className="text-[11px] text-[var(--gray-11)] pb-2 border-b border-[var(--gray-6)]">Markdown preview</div>
      <div className={`transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`} key={idx}>
        {snippets[idx]}
      </div>
    </div>
  )
}

function LandingPage() {
  const navigate = useNavigate()

  const handleGetStarted = () => {
    navigate('/home')
  }

  return (
    <div className="min-h-screen bg-[var(--gray-1)] text-[var(--gray-12)]">
      {/* Hero Section */}
  <section className="relative overflow-hidden min-h-[55vh] sm:min-h-[65vh] flex items-center">
        {/* Soft background accents using theme tokens */}
        <div className="absolute inset-0 opacity-60 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-44 h-44 sm:w-80 sm:h-80 bg-[var(--accent-3)] rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-40 h-40 sm:w-72 sm:h-72 bg-[var(--blue-3)] rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-36 h-36 sm:w-56 sm:h-56 bg-[var(--green-3)] rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
        </div>

        <Container size="4" className="relative z-10 py-12 sm:py-16 px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
            {/* Content */}
            <div className="space-y-7 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-[var(--accent-3)]/60 backdrop-blur-sm border border-[var(--accent-6)] rounded-full px-4 py-2 text-sm font-medium">
                <span className="w-2 h-2 bg-[var(--accent-9)] rounded-full" />
                Live Collaboration
              </div>

              <div className="relative inline-block group mx-auto lg:mx-0">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
                  Write Together,{' '}
                  <span className="bg-gradient-to-r from-[var(--accent-11)] to-[var(--blue-11)] bg-clip-text text-transparent">
                    Create Better
                  </span>
                </h1>
                {/* Radiant glow on hover */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                >
                  <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] blur-3xl"
                    style={{
                      background:
                        'radial-gradient(ellipse at center, var(--accent-9) 0%, transparent 60%)',
                    }}
                  />
                </div>
              </div>

              <p className="text-base sm:text-lg lg:text-lg text-[var(--gray-11)] leading-relaxed max-w-xl">
                Scribe transforms the way teams collaborate on documents. Real-time editing, seamless file management, and powerful tools in one platform.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center lg:justify-start">
                <SignedIn>
                  <Button
                    size="3"
                    variant="solid"
                    className="bg-[var(--accent-9)] hover:bg-[var(--accent-10)] text-white w-full sm:w-auto"
                    onClick={handleGetStarted}
                  >
                    Get Started
                    <ArrowRightIcon className="ml-2" />
                  </Button>
                </SignedIn>
                <SignedOut>
                  <SignUpButton>
                    <Button 
                      variant="solid" 
                      size="3"
                      className="bg-[var(--accent-9)] hover:bg-[var(--accent-10)] text-white w-full sm:w-auto"
                    >
                      Get Started
                      <ArrowRightIcon className="ml-2" />
                    </Button>
                  </SignUpButton>
                </SignedOut>
              </div>

              
            </div>

            {/* Hero Image */}
            <div className="relative mt-8 lg:mt-0 max-w-xl mx-auto lg:mx-0">
              <div className="relative rounded-2xl overflow-hidden border border-[var(--gray-6)] shadow-sm">
                <img
                  src="/hero-collaboration.jpg"
                  alt="Collaborative workspace showing multiple team members editing documents in real-time"
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-[var(--accent-3)]/10" />
              </div>

              

              {/* Floating elements */}
              <div className="hidden md:block absolute -top-4 -right-4 bg-[var(--gray-2)]/90 backdrop-blur-sm p-3 rounded-xl border border-[var(--accent-6)] shadow-md">
                <PersonIcon className="h-6 w-6" style={{ color: 'var(--accent-11)' }} />
              </div>
              <div className="hidden md:block absolute -bottom-4 -left-4 bg-[var(--gray-2)]/90 backdrop-blur-sm p-3 rounded-xl border border-[var(--blue-6)] shadow-md">
                <Pencil2Icon className="h-6 w-6" style={{ color: 'var(--blue-11)' }} />
              </div>
              <div className="hidden md:block absolute top-1/2 -right-6 bg-[var(--gray-2)]/90 backdrop-blur-sm p-3 rounded-xl border border-[var(--green-6)] shadow-md -translate-y-1/2">
                <LockClosedIcon className="h-6 w-6" style={{ color: 'var(--green-11)' }} />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-14 sm:py-20">
        <Container size="4" className="px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-4">
              Everything you need for{' '}
              <span className="bg-gradient-to-r from-[var(--accent-11)] to-[var(--blue-11)] bg-clip-text text-transparent">
                effortless collaborative writing
              </span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-[var(--gray-11)] max-w-3xl mx-auto">
              Scribe combines powerful document editing with seamless collaboration tools, making it the perfect platform for teams who value both productivity and quality.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group relative bg-[var(--gray-2)] rounded-2xl p-5 sm:p-6 lg:p-8 border border-[var(--gray-6)] shadow-sm hover:shadow-md transition backdrop-blur-sm"
              >
                <div className="mb-5">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br from-[var(--gray-4)] to-[var(--gray-5)] ring-1 ring-[var(--gray-6)] group-hover:from-[var(--accent-4)] group-hover:to-[var(--blue-4)] group-hover:ring-[var(--accent-7)] transition-colors">
                    <feature.icon className="h-6 w-6" style={{ color: `var(${feature.colorVar})` }} />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-[var(--gray-11)] leading-relaxed">{feature.description}</p>
                </div>

                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-200"
                  style={{
                    background:
                      'radial-gradient(55% 55% at 50% 50%, var(--accent-7) 0%, transparent 45%), radial-gradient(85% 85% at 50% 50%, var(--blue-7) 0%, transparent 70%)',
                  }}
                />
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Footer with code teaser */}
      <footer className="border-t border-[var(--gray-6)] bg-[var(--gray-1)]">
        <Container size="4" className="px-4 sm:px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Scribe</h3>
              <p className="text-[var(--gray-11)] max-w-md">
                Collaborative markdown, presence, and versioned vaults — built for teams who love to write.
              </p>
              <div className="text-[12px] text-[var(--gray-11)]">© {new Date().getFullYear()} Scribe. All rights reserved.</div>
            </div>
            <div className="justify-self-start md:justify-self-end w-full md:w-auto">
              <CodeTeaser />
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="text-[12px] text-[var(--gray-11)] mr-1">Connect:</span>
            <a
              href="https://github.com/purusharthseth"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-[var(--gray-6)] hover:border-[var(--gray-7)] text-[var(--gray-12)]"
            >
              <GitHubLogoIcon />
              <span className="text-[12px]">GitHub</span>
            </a>
            <a
              href="https://linkedin.com/in/purusharthseth"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-[var(--gray-6)] hover:border-[var(--gray-7)] text-[var(--gray-12)]"
            >
              <LinkedInLogoIcon />
              <span className="text-[12px]">LinkedIn</span>
            </a>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-[13px] text-[var(--gray-11)]">
            <a href="#" className="hover:text-[var(--gray-12)]">Docs</a>
            <a href="#" className="hover:text-[var(--gray-12)]">Changelog</a>
            <a href="#" className="hover:text-[var(--gray-12)]">Privacy</a>
            <a href="#" className="hover:text-[var(--gray-12)]">Contact</a>
          </div>
        </Container>
      </footer>
    </div>
  )
}

export default LandingPage