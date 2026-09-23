import { Outlet } from 'react-router-dom'
import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/clerk-react'
import { LayoutDashboard, Briefcase, SendHorizonal, UserCircle, Activity, Settings2, CreditCard, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    <div className="min-h-screen bg-bg-base">
      {/* Top Nav */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-bg-surface/80 backdrop-blur-md border-b border-white/5 z-40">
        <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Toggle sidebar"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <a href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-text-primary">
              <span className="text-accent-primary">JobHunt</span> AI
            </a>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8 rounded-full',
                    userButtonPopoverCard: 'bg-bg-elevated border border-white/10',
                  },
                }}
              />
            </SignedIn>
            <SignedOut>
              <SignInButton
                mode="modal"
                appearance={{
                  elements: {
                    formButtonPrimary: 'bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)]',
                    card: 'bg-bg-elevated border border-white/10',
                  },
                }}
              >
                <button className="btn-primary">Sign In</button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-16 left-0 bottom-0 z-30 bg-bg-surface border-r border-white/5 transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-20 lg:w-20',
          mobileMenuOpen ? 'lg:w-64' : ''
        )}
      >
        <nav className="flex flex-col p-4 space-y-1 h-full overflow-y-auto">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                'text-text-secondary hover:text-text-primary hover:bg-white/5',
                !sidebarOpen && 'justify-center px-0'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              {sidebarOpen && <span>{item.label}</span>}
              {item.divider && sidebarOpen && (
                <div className="w-full h-px bg-white/5 my-2" />
              )}
            </a>
          ))}
        </nav>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
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
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}