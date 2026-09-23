import { User, Bell, Link, Search, AlertTriangle, Trash2, Shield, Globe, Clock, Zap, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const tabs = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'platforms', label: 'Platforms', icon: Link },
  { id: 'discovery', label: 'Discovery', icon: Search },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
]

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('account')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-secondary text-sm">Manage your account, notifications, and platform connections</p>
      </div>

      <div className="card-glass overflow-hidden">
        <div className="border-b border-white/5">
          <nav className="flex overflow-x-auto" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap',
                  activeTab === tab.id
                    ? 'text-accent-primary border-b-2 border-accent-primary'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6 max-w-2xl">
          {activeTab === 'account' && (
            <div className="space-y-6">
              <h3 className="font-semibold text-text-primary">Account Information</h3>
              <div className="card-glass p-4 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent-primary/20 to-accent-ai/20 flex items-center justify-center">
                    <User className="w-8 h-8 text-accent-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">John Doe</p>
                    <p className="text-text-secondary text-sm">john@example.com</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Display Name</label>
                    <input type="text" value="John Doe" className="glass-input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Email (from Clerk)</label>
                    <input type="email" value="john@example.com" disabled className="glass-input bg-white/3" />
                  </div>
                </div>
              </div>

              <h3 className="font-semibold text-text-primary">Avatar</h3>
              <div className="card-glass p-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-accent-primary/20 to-accent-ai/20 flex items-center justify-center">
                    <User className="w-10 h-10 text-accent-primary" />
                  </div>
                  <button className="btn-secondary">Upload New Avatar</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-text-primary">Email Notifications</h3>
              {[
                { id: 'needs_review', label: 'Needs Review Alerts', desc: 'Get notified when an application requires your approval' },
                { id: 'daily_summary', label: 'Daily Activity Summary', desc: 'Receive a daily digest of agent activity' },
                { id: 'interview', label: 'Interview Detected', desc: 'Instant alert when an interview is scheduled' },
                { id: 'failure', label: 'Failure Alerts', desc: 'Get notified of submission failures or CAPTCHA blocks' },
              ].map((item) => (
                <div key={item.id} className="card-glass p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-primary">{item.label}</p>
                    <p className="text-sm text-text-secondary">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-5 after:h-5 after:bg-white after:border-white/20 after:border after:rounded-full after:transition-all"></div>
                  </label>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'platforms' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-text-primary">Connected Job Platforms</h3>
              {[
                { name: 'LinkedIn', icon: 'in', connected: true, status: 'Active', lastUsed: '2 hours ago' },
                { name: 'Greenhouse', icon: 'gh', connected: true, status: 'Active', lastUsed: '5 hours ago' },
                { name: 'Lever', icon: 'lv', connected: true, status: 'Active', lastUsed: '1 day ago' },
                { name: 'Workday', icon: 'wd', connected: false, status: 'Not Connected', lastUsed: 'Never' },
                { name: 'Indeed', icon: 'id', connected: false, status: 'Not Connected', lastUsed: 'Never' },
              ].map((platform) => (
                <div key={platform.name} className="card-glass p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-primary/20 to-accent-ai/20 flex items-center justify-center font-bold text-accent-primary">
                      {platform.icon}
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{platform.name}</p>
                      <p className="text-sm text-text-secondary">{platform.status} · {platform.lastUsed}</p>
                    </div>
                  </div>
                  {platform.connected ? (
                    <button className="btn-secondary text-sm">Disconnect</button>
                  ) : (
                    <button className="btn-primary text-sm">Connect</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'discovery' && (
            <div className="space-y-6">
              <h3 className="font-semibold text-text-primary">Discovery Settings</h3>
              <div className="card-glass p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Scan Frequency</label>
                  <p className="text-text-muted text-sm mb-3">Based on your Pro plan: Hourly scans enabled</p>
                  <div className="space-y-2">
                    {[
                      { platform: 'LinkedIn', frequency: 'Hourly', enabled: true },
                      { platform: 'Greenhouse', frequency: 'Hourly', enabled: true },
                      { platform: 'Lever', frequency: 'Every 3 hours', enabled: true },
                      { platform: 'Workday', frequency: 'Every 6 hours', enabled: false },
                    ].map((item) => (
                      <div key={item.platform} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-gradient-to-br from-accent-primary/20 to-accent-ai/20 flex items-center justify-center text-accent-primary font-bold text-sm">
                            {item.platform.slice(0,2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">{item.platform}</p>
                            <p className="text-sm text-text-secondary">{item.frequency}</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked={item.enabled} className="sr-only peer" />
                          <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-5 after:h-5 after:bg-white after:border-white/20 after:border after:rounded-full after:transition-all"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4">
                  <label className="block text-sm font-medium text-text-secondary mb-2">Daily Application Cap</label>
                  <p className="text-text-muted text-sm mb-3">Pro plan limit: 15 applications per day</p>
                  <input type="range" min="1" max="15" defaultValue={15} className="w-full accent-accent-primary" />
                  <div className="flex justify-between text-sm text-text-secondary mt-1">
                    <span>1</span>
                    <span>15 (Plan Max)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="space-y-6">
              <h3 className="font-semibold text-text-primary">Danger Zone</h3>

              <div className="card-glass p-6 border border-accent-warning/20">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-accent-warning" />
                  <div>
                    <p className="font-medium text-text-primary">Pause All Agent Activity</p>
                    <p className="text-sm text-text-secondary">Immediately stop all running agents and clear the queue. You can resume anytime.</p>
                  </div>
                </div>
                <button className="btn-warning px-6 py-2 flex items-center gap-2">
                  <Pause className="w-4 h-4" />
                  Pause All Agents
                </button>
              </div>

              <div className="card-glass p-6 border border-accent-danger/20">
                <div className="flex items-center gap-3 mb-4">
                  <Trash2 className="w-6 h-6 text-accent-danger" />
                  <div>
                    <p className="font-medium text-text-primary">Delete Account</p>
                    <p className="text-sm text-text-secondary">Permanently delete your account, all profiles, applications, and data. This action cannot be undone.</p>
                  </div>
                </div>
                <button className="btn-danger px-6 py-2 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}