import { Outlet, useLocation } from 'react-router-dom'
import { SignedIn, SignedOut, UserButton, SignInButton, useUser } from '@clerk/clerk-react'
import {
  LayoutDashboard,
  Briefcase,
  SendHorizonal,
  UserCircle,
  Activity,
  Settings2,
  CreditCard,
  Menu,
  X,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useQuota } from '@/hooks/useQuota'
import { AgentPulse } from '@/components/ui'

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const { user } = useUser()
  const { dailyUsed, dailyCap, dailyPercentage } = useQuota(user?.id)

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Jobs', icon: Briefcase, href: '/jobs' },
    { label: 'Applications', icon: SendHorizonal, href: '/applications' },
    { label: 'Profile', icon: UserCircle, href: '/profile' },
    { label: 'Activity Log', icon: Activity, href: '/activity' },
    { label: 'Settings', icon: Settings2, href: '/settings' },
    { label: 'Billing & Plans', icon: CreditCard, href: '/billing', divider: true },
  ]

  return (
    <div className="min-h-screen bg-black text-neutral-100">
      {/* Top Nav */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-neutral-950/80 backdrop-blur-md border-b border-white/[0.08] z-40">
        <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Toggle sidebar"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <a href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-white">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
              <span>JobHunt AI</span>
            </a>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            {navItems.slice(0, 4).map((item) => {
              const isActive = location.pathname === item.href
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'text-xs font-medium transition-colors',
                    isActive ? 'text-indigo-400 font-semibold' : 'text-neutral-400 hover:text-white'
                  )}
                >
                  {item.label}
                </a>
              )
            })}
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs">
              <AgentPulse status="active" size="sm" />
              <span className="text-neutral-300 font-medium">Autopilot</span>
            </div>

            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8 rounded-full border border-white/20',
                    userButtonPopoverCard: 'bg-neutral-900 border border-white/10 text-white',
                  },
                }}
              />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3.5 py-1.5 rounded-lg font-medium transition-colors">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-16 left-0 bottom-0 z-30 bg-neutral-950/90 backdrop-blur-xl border-r border-white/[0.08] transition-all duration-300 flex flex-col justify-between',
          sidebarOpen ? 'w-64' : 'w-20 lg:w-20',
          mobileMenuOpen ? 'lg:w-64' : ''
        )}
      >
        <nav className="flex flex-col p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <div key={item.href}>
                {item.divider && sidebarOpen && (
                  <div className="w-full h-px bg-white/[0.08] my-2" />
                )}
                <a
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                      : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]',
                    !sidebarOpen && 'justify-center px-0'
                  )}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  {sidebarOpen && <span>{item.label}</span>}
                </a>
              </div>
            )
          })}
        </nav>

        {/* Quota Progress Meter in Sidebar */}
        {sidebarOpen && (
          <div className="p-4 m-3 rounded-xl bg-neutral-900/60 border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400 font-medium flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Daily Quota
              </span>
              <span className="font-mono font-bold text-white">
                {dailyUsed} / {dailyCap}
              </span>
            </div>
            <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${dailyPercentage}%` }}
              />
            </div>
            <p className="text-[10px] text-neutral-500">Resets daily at 00:00 UTC</p>
          </div>
        )}
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-300',
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        )}
      >
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}