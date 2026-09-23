import { User, Mail, Phone, MapPin, Link, Github, Globe, Settings, Plus, Trash2, Edit2, Save, X, Check, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'experience' | 'skills' | 'preferences' | 'answers' | 'autonomy'>('profile')
  const [editing, setEditing] = useState<string | null>(null)

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'experience', label: 'Experience', icon: Settings },
    { id: 'skills', label: 'Skills', icon: Settings },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'answers', label: 'Screening Answers', icon: Mail },
    { id: 'autonomy', label: 'Autonomy', icon: Settings },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Profile Management</h1>
        <p className="text-text-secondary text-sm">View and edit your AI-parsed profile and application preferences</p>
      </div>

      {/* Profile Snapshot */}
      <div className="card-glass p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-accent-primary/20 to-accent-ai/20 flex items-center justify-center">
            <User className="w-12 h-12 text-accent-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-text-primary">John Doe</h2>
                <p className="text-text-secondary">Senior Frontend Engineer</p>
              </div>
              <button className="btn-secondary px-4 py-2 flex items-center gap-2">
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            </div>
            <div className="flex flex-wrap gap-6 mt-4 text-sm">
              <span className="flex items-center gap-1 text-text-secondary"><Mail className="w-4 h-4" /> john@example.com</span>
              <span className="flex items-center gap-1 text-text-secondary"><Phone className="w-4 h-4" /> +1 (555) 123-4567</span>
              <span className="flex items-center gap-1 text-text-secondary"><MapPin className="w-4 h-4" /> San Francisco, CA</span>
              <span className="flex items-center gap-1 text-text-secondary"><Globe className="w-4 h-4" /> UTC-8</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card-glass overflow-hidden">
        <div className="border-b border-white/5">
          <nav className="flex overflow-x-auto" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id as any)}
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

        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="font-semibold text-text-primary mb-4">Links & Profiles</h3>
                <div className="space-y-3">
                  {['LinkedIn', 'GitHub', 'Portfolio'].map((link) => (
                    <div key={link} className="flex items-center gap-3">
                      <label className="w-24 text-sm text-text-secondary">{link}</label>
                      <input type="url" placeholder={`https://${link.toLowerCase()}.com/username`} className="glass-input flex-1" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'experience' && (
            <div className="space-y-4 max-w-3xl">
              <h3 className="font-semibold text-text-primary mb-4">Work Experience</h3>
              <div className="space-y-4 border-l-2 border-white/10 pl-6">
                {[
                  { company: 'Stripe', title: 'Senior Frontend Engineer', location: 'San Francisco, CA', start: '2022-01', end: 'Present', highlights: ['Led redesign of dashboard', 'Improved performance by 40%'], tech: ['React', 'TypeScript', 'GraphQL'] },
                  { company: 'Vercel', title: 'Frontend Engineer', location: 'Remote', start: '2019-06', end: '2021-12', highlights: ['Built Next.js commerce features', 'Open source contributions'], tech: ['Next.js', 'React', 'Rust'] },
                ].map((exp, idx) => (
                  <div key={idx} className="relative pb-6 before:absolute before:left-[-8px] before:top-0 before:w-3 before:h-3 before:rounded-full before:bg-accent-primary">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-text-primary">{exp.title}</p>
                        <p className="text-text-secondary">{exp.company} · {exp.location}</p>
                        <p className="text-sm text-text-muted">{exp.start} — {exp.end}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {exp.tech.map(t => <span key={t} className="px-2 py-0.5 rounded bg-white/5 text-xs text-text-secondary border border-white/10">{t}</span>)}
                    </div>
                    <ul className="mt-2 space-y-1">
                      {exp.highlights.map((h, i) => <li key={i} className="text-sm text-text-secondary flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />{h}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="space-y-6 max-w-3xl">
              <h3 className="font-semibold text-text-primary mb-4">Technical Skills</h3>
              <div>
                <h4 className="text-sm font-medium text-text-secondary mb-3">Primary</h4>
                <div className="flex flex-wrap gap-2">
                  {['React', 'TypeScript', 'Next.js', 'GraphQL', 'Tailwind CSS', 'Node.js'].map(s => (
                    <span key={s} className="px-3 py-1.5 rounded-full bg-accent-primary/20 text-accent-primary text-sm font-medium border border-accent-primary/30 flex items-center gap-1">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-text-secondary mb-3">Secondary</h4>
                <div className="flex flex-wrap gap-2">
                  {['Python', 'Go', 'Rust', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'AWS'].map(s => (
                    <span key={s} className="px-3 py-1.5 rounded-full bg-white/5 text-text-secondary text-sm border border-white/10">{s}</span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-text-secondary mb-3">Tools & Platforms</h4>
                <div className="flex flex-wrap gap-2">
                  {['Git', 'GitHub Actions', 'Vercel', 'Linear', 'Figma', 'Postman'].map(s => (
                    <span key={s} className="px-3 py-1.5 rounded-full bg-white/5 text-text-secondary text-sm border border-white/10">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="font-semibold text-text-primary mb-4">Job Search Preferences</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Target Roles</label>
                  <div className="flex flex-wrap gap-2">
                    {['Senior Frontend Engineer', 'Lead Frontend Engineer', 'Staff Engineer', 'Frontend Architect'].map(r => (
                      <span key={r} className="px-3 py-1 rounded-full bg-accent-primary/20 text-accent-primary text-sm border border-accent-primary/30 flex items-center gap-1">
                        {r}
                        <button className="ml-1 hover:text-accent-warning"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                    <button className="btn-secondary px-3 py-1 text-sm"><Plus className="w-3 h-3 mr-1" /> Add Role</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Locations</label>
                  <div className="flex flex-wrap gap-2">
                    {['San Francisco, CA', 'New York, NY', 'Remote'].map(l => (
                      <span key={l} className="px-3 py-1 rounded-full bg-white/5 text-text-secondary text-sm border border-white/10 flex items-center gap-1">
                        {l}
                        <button className="ml-1 hover:text-accent-warning"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                    <button className="btn-secondary px-3 py-1 text-sm"><Plus className="w-3 h-3 mr-1" /> Add Location</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Minimum Salary</label>
                    <input type="number" value="180000" className="glass-input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Currency</label>
                    <select className="glass-input"><option>USD</option><option>EUR</option><option>GBP</option></select>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="remote" className="w-4 h-4 rounded accent-accent-primary" defaultChecked />
                  <label htmlFor="remote" className="text-text-primary">Remote OK</label>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="visa" className="w-4 h-4 rounded accent-accent-primary" />
                  <label htmlFor="visa" className="text-text-primary">Require visa sponsorship</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Blacklisted Companies</label>
                  <input type="text" placeholder="Add company to blacklist" className="glass-input" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'answers' && (
            <div className="space-y-4 max-w-2xl">
              <h3 className="font-semibold text-text-primary mb-4">Standard Screening Answers</h3>
              <div className="space-y-4">
                {[
                  { q: 'Are you legally authorized to work in the US?', a: 'Yes, I am a US citizen' },
                  { q: 'Will you now or in the future require visa sponsorship?', a: 'No' },
                  { q: 'What is your notice period?', a: '4 weeks' },
                  { q: 'What are your salary expectations?', a: '$180,000 - $250,000' },
                  { q: 'Are you willing to relocate?', a: 'Yes, open to relocation' },
                  { q: 'LinkedIn Profile URL', a: 'https://linkedin.com/in/johndoe' },
                  { q: 'GitHub Profile URL', a: 'https://github.com/johndoe' },
                  { q: 'Portfolio URL', a: 'https://johndoe.dev' },
                ].map((item, idx) => (
                  <div key={idx} className="card-glass p-4">
                    <p className="text-sm font-medium text-text-secondary mb-1">{item.q}</p>
                    <p className="text-text-primary">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'autonomy' && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="font-semibold text-text-primary mb-4">Autonomy Settings</h3>
              <div className="card-glass p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-primary">Autonomous Autopilot</p>
                    <p className="text-sm text-text-secondary">Automatically apply to jobs with match score ≥ 85%</p>
                  </div>
                  <button className="relative w-12 h-6 rounded-full bg-accent-cta flex items-center p-1">
                    <span className="w-4 h-4 rounded-full bg-white transition-transform translate-x-6" />
                  </button>
                </div>
              </div>
              <div className="card-glass p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-primary">Assisted Pilot (Default)</p>
                    <p className="text-sm text-text-secondary">Review all applications before submission</p>
                  </div>
                </div>
              </div>
              <div className="card-glass p-4 border border-accent-warning/20">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-accent-warning" />
                  <div>
                    <p className="font-medium text-text-primary">Emergency Stop</p>
                    <p className="text-sm text-text-secondary">Immediately pause all active agents and clear queues</p>
                  </div>
                  <button className="btn-danger ml-auto px-4 py-2">Stop All Agents</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}