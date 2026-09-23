import { SignedOut, SignInButton, SignUpButton } from '@clerk/clerk-react'
import { ArrowRight, Mail, Github, Linkedin, Lock, User, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

export function SignInPage() {
  return (
    <div className="min-h-screen flex">
      {/* Brand Panel */}
      <div className="hidden lg:flex lg:w-3/5 bg-gradient-to-br from-bg-base via-bg-surface to-bg-elevated p-12 flex-col justify-between relative overflow-hidden">
        <div>
          <div className="flex items-center gap-2 font-bold text-2xl text-text-primary mb-12">
            <span className="text-accent-primary">JobHunt</span> AI
          </div>
        </div>
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-4xl font-black text-text-primary mb-6">
            Welcome back to your{' '}
            <span className="text-accent-primary">Command Center</span>
          </h1>
          <p className="text-text-secondary text-lg leading-relaxed">
            Sign in to continue monitoring your autonomous job hunt agents.
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

      {/* Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <div className="flex items-center gap-2 font-bold text-2xl text-text-primary justify-center mb-8">
              <span className="text-accent-primary">JobHunt</span> AI
            </div>
          </div>
          <SignInButton mode="modal">
            <button className="btn-primary w-full py-3 mb-3 flex items-center justify-center gap-2">
              <Github className="w-5 h-5" />
              Continue with GitHub
            </button>
          </SignInButton>
          <SignInButton mode="modal">
            <button className="btn-secondary w-full py-3 mb-3 flex items-center justify-center gap-2">
              <Linkedin className="w-5 h-5" />
              Continue with LinkedIn
            </button>
          </SignInButton>
          <SignInButton mode="modal">
            <button className="btn-secondary w-full py-3 mb-6 flex items-center justify-center gap-2">
              <Mail className="w-5 h-5" />
              Continue with Email
            </button>
          </SignInButton>
          
          <p className="text-center text-text-muted text-sm mb-6">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
          
          <p className="text-center text-text-secondary text-sm">
            New to JobHunt AI?{' '}
            <SignUpButton mode="modal">
              <button className="text-accent-primary hover:underline font-medium">Create an account</button>
            </SignUpButton>
          </p>
        </div>
      </div>
    </div>
  )
}