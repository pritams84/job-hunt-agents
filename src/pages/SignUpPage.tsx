import { SignedOut, SignUpButton, SignInButton } from '@clerk/clerk-react'
import { Github, Linkedin, Mail, ArrowRight } from 'lucide-react'

export function SignUpPage() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-3/5 bg-gradient-to-br from-bg-base via-bg-surface to-bg-elevated p-12 flex-col justify-between relative overflow-hidden">
        <div>
          <div className="flex items-center gap-2 font-bold text-2xl text-text-primary mb-12">
            <span className="text-accent-primary">JobHunt</span> AI
          </div>
        </div>
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-4xl font-black text-text-primary mb-6">
            Start your{' '}
            <span className="text-accent-primary">Autonomous Job Hunt</span>
          </h1>
          <p className="text-text-secondary text-lg leading-relaxed">
            Join thousands of developers who let AI handle the grind. 7-day free trial, no credit card required.
          </p>
        </div>
        <div className="flex items-center justify-center gap-4">
          <div className="w-64 h-px bg-white/10" />
          <span className="text-text-muted text-sm">Or continue with</span>
          <div className="w-64 h-px bg-white/10" />
        </div>
        <div className="flex justify-center gap-4">
          <button className="btn-secondary px-6 py-3 flex items-center gap-2">
            <Github className="w-5 h-5" />
            GitHub
          </button>
          <button className="btn-secondary px-6 py-3 flex items-center gap-2">
            <Linkedin className="w-5 h-5" />
            LinkedIn
          </button>
          <button className="btn-secondary px-6 py-3 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <div className="flex items-center gap-2 font-bold text-2xl text-text-primary justify-center mb-8">
              <span className="text-accent-primary">JobHunt</span> AI
            </div>
          </div>
          <SignUpButton mode="modal">
            <button className="btn-primary w-full py-3 mb-3 flex items-center justify-center gap-2">
              <Github className="w-5 h-5" />
              Continue with GitHub
            </button>
          </SignUpButton>
          <SignUpButton mode="modal">
            <button className="btn-secondary w-full py-3 mb-3 flex items-center justify-center gap-2">
              <Linkedin className="w-5 h-5" />
              Continue with LinkedIn
            </button>
          </SignUpButton>
          <SignUpButton mode="modal">
            <button className="btn-secondary w-full py-3 mb-6 flex items-center justify-center gap-2">
              <Mail className="w-5 h-5" />
              Continue with Email
            </button>
          </SignUpButton>
          
          <p className="text-center text-text-muted text-sm mb-6">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
          
          <p className="text-center text-text-secondary text-sm">
            Already have an account?{' '}
            <SignInButton mode="modal">
              <button className="text-accent-primary hover:underline font-medium">Sign in</button>
            </SignInButton>
          </p>
        </div>
      </div>
    </div>
  )
}