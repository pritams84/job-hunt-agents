import { Upload, FileText, Briefcase, MapPin, DollarSign, Shield, CheckCircle, ChevronRight, Zap, Settings, Link, Mail, Github, Globe, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const steps = [
  { id: 1, title: 'Resume Upload', desc: 'Upload your resume for AI parsing', icon: FileText },
  { id: 2, title: 'Preferences', desc: 'Set your job search criteria', icon: Briefcase },
  { id: 3, title: 'Screening Answers', desc: 'Pre-fill common application questions', icon: Mail },
  { id: 4, title: 'Autonomy Mode', desc: 'Choose how agents apply', icon: Zap },
]

export function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [parsedData, setParsedData] = useState<any>(null)

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setResumeFile(file)
      setParsing(true)
      // Simulate parsing
      setTimeout(() => {
        setParsedData({
          personal: { full_name: 'John Doe', email: 'john@example.com', phone: '+1 555 123 4567', location: { city: 'San Francisco', state: 'CA', country: 'US', timezone: 'UTC-8' } },
          summary: 'Senior Frontend Engineer with 8+ years experience...',
          experience: [{ company: 'Stripe', title: 'Senior Frontend Engineer', start_date: '2022-01', end_date: 'Present', highlights: ['Led dashboard redesign'], technologies: ['React', 'TypeScript'] }],
          skills: { primary: ['React', 'TypeScript', 'Next.js'], secondary: ['Python', 'Go'], tools_and_platforms: ['Git', 'Docker', 'AWS'] },
        })
        setParsing(false)
        nextStep()
      }, 2000)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress Header */}
      <div className="card-glass p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Welcome to JobHunt AI</h1>
            <p className="text-text-secondary">Let's set up your autonomous job hunt in 4 steps</p>
          </div>
        </div>
        <div className="flex items-center">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm transition-all',
                  idx + 1 < currentStep ? 'bg-accent-cta text-text-inverse' :
                  idx + 1 === currentStep ? 'bg-accent-primary text-text-inverse' :
                  'bg-white/10 text-text-muted'
                )}>
                  {idx + 1 < currentStep ? <CheckCircle className="w-5 h-5" /> : step.id}
                </div>
                <div className="hidden sm:block">
                  <p className={cn('font-medium text-sm', idx + 1 <= currentStep ? 'text-text-primary' : 'text-text-muted')}>{step.title}</p>
                  <p className="text-xs text-text-muted">{step.desc}</p>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div className={cn('flex-1 h-1 rounded', idx + 1 < currentStep ? 'bg-accent-cta' : 'bg-white/10')} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="card-glass p-6 sm:p-8">
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-text-primary mb-2">Step 1: Upload Your Resume</h2>
              <p className="text-text-secondary">We'll parse your skills, experience, and generate embeddings for matching</p>
            </div>

            <div className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center transition-colors',
              parsing ? 'border-accent-primary bg-accent-primary/5' : 'border-white/10 hover:border-accent-primary/50'
            )}>
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileUpload}
                disabled={parsing}
                className="hidden"
                id="resume-upload"
              />
              {parsing ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="w-12 h-12 border-3 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
                  </div>
                  <p className="text-text-primary">Parsing resume with AI...</p>
                  <div className="w-1/2 mx-auto h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-accent-primary to-accent-ai animate-pulse" style={{ width: '60%' }} />
                  </div>
                  <p className="text-text-muted text-sm">Extracting skills, experience, and generating embeddings</p>
                </div>
              ) : resumeFile ? (
                <div className="space-y-3">
                  <FileText className="w-12 h-12 text-accent-cta mx-auto" />
                  <p className="font-medium text-text-primary">{resumeFile.name}</p>
                  <p className="text-text-secondary text-sm">{(resumeFile.size / 1024).toFixed(1)} KB • Ready to parse</p>
                  <button onClick={() => setResumeFile(null)} className="btn-secondary mt-4">Remove</button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-12 h-12 text-text-muted mx-auto" />
                  <p className="text-text-primary">Drag & drop your resume here</p>
                  <p className="text-text-secondary text-sm">PDF or DOCX • Max 5MB</p>
                  <label htmlFor="resume-upload" className="btn-primary mt-4 inline-block cursor-pointer">
                    Choose File
                  </label>
                </div>
              )}
            </div>

            {parsedData && (
              <div className="p-4 bg-accent-cta/10 border border-accent-cta/30 rounded-lg">
                <p className="font-medium text-accent-cta flex items-center gap-2 justify-center">
                  <CheckCircle className="w-5 h-5" />
                  Resume parsed successfully! Found 24 skills, 3 positions, 2 degrees
                </p>
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-text-primary">Step 2: Job Search Preferences</h2>
            
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Target Roles</label>
              <div className="flex flex-wrap gap-2">
                {['Senior Frontend Engineer', 'Lead Frontend Engineer', 'Staff Engineer', 'Frontend Architect'].map(r => (
                  <span key={r} className="px-3 py-1 rounded-full bg-accent-primary/20 text-accent-primary text-sm border border-accent-primary/30 flex items-center gap-1">
                    {r}
                  </span>
                ))}
                <input type="text" placeholder="Add role..." className="glass-input px-3 py-1 text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Locations</label>
                <div className="flex flex-wrap gap-2">
                  {['San Francisco, CA', 'New York, NY', 'Remote'].map(l => (
                    <span key={l} className="px-3 py-1 rounded-full bg-white/5 text-text-secondary text-sm border border-white/10">{l}</span>
                  ))}
                  <input type="text" placeholder="Add location..." className="glass-input px-3 py-1 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Remote Preference</label>
                <select className="glass-input">
                  <option>Remote Only</option>
                  <option>Hybrid</option>
                  <option>On-site</option>
                  <option>Any</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Minimum Salary</label>
              <div className="flex items-center gap-3">
                <input type="number" value="180000" className="glass-input flex-1" />
                <span className="text-text-muted">USD/year</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Blacklisted Companies</label>
              <input type="text" placeholder="Add company to exclude..." className="glass-input" />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-text-primary">Step 3: Screening Answers</h2>
            <p className="text-text-secondary">Pre-fill answers to common application questions</p>
            
            <div className="space-y-4">
              {[
                { q: 'Are you legally authorized to work in the US?', placeholder: 'Yes, I am a US citizen' },
                { q: 'Will you require visa sponsorship?', placeholder: 'No' },
                { q: 'What is your notice period?', placeholder: '4 weeks' },
                { q: 'Salary expectations', placeholder: '$180,000 - $250,000' },
                { q: 'Willing to relocate?', placeholder: 'Yes, open to relocation' },
                { q: 'LinkedIn URL', placeholder: 'https://linkedin.com/in/yourname' },
                { q: 'GitHub URL', placeholder: 'https://github.com/yourname' },
                { q: 'Portfolio URL', placeholder: 'https://yourportfolio.dev' },
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <label className="block text-sm font-medium text-text-secondary">{item.q}</label>
                  <input type="text" placeholder={item.placeholder} className="glass-input" />
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-text-primary">Step 4: Autonomy Mode</h2>
            <p className="text-text-secondary">Choose how your agents submit applications</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={cn(
                'card-glass p-6 cursor-pointer border-2 transition-all',
                'border-accent-primary'
              )}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-primary/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-accent-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">Autonomous Autopilot</h3>
                    <p className="text-sm text-text-secondary">Auto-apply to matches ≥85%</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-accent-cta" /> Applies automatically</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-accent-cta" /> Maximum speed</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-accent-cta" /> CAPTCHA pauses for review</li>
                </ul>
              </div>
              
              <div className={cn(
                'card-glass p-6 cursor-pointer border-2 transition-all',
                'border-white/10'
              )}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">Assisted Pilot (Default)</h3>
                    <p className="text-sm text-text-secondary">Review every application before submit</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-accent-cta" /> You approve each one</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-accent-cta" /> Full control</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-accent-cta" /> Safer for senior roles</li>
                </ul>
              </div>
            </div>

            <div className="p-4 bg-white/5 rounded-lg">
              <p className="text-sm text-text-secondary">
                You can change this anytime in Settings → Autonomy. Both modes respect your daily quota and CAPTCHA safety.
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-white/5">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={cn('btn-secondary px-6 py-2', currentStep === 1 && 'opacity-50 cursor-not-allowed')}
          >
            <ChevronRight className="w-4 h-4 mr-2" style={{ transform: 'rotate(180deg)' }} />
            Back
          </button>
          <button
            onClick={currentStep === 4 ? () => alert('Onboarding complete! Redirecting to dashboard...') : nextStep}
            className="btn-cta px-6 py-2 flex items-center gap-2"
          >
            {currentStep === 4 ? 'Complete Setup' : 'Continue'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}