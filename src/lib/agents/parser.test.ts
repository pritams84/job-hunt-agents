import { describe, it, expect, vi } from 'vitest'
import { parseResumeText } from './parser'

// Mock AI client to test parser error handling and structured extraction
vi.mock('@/lib/ai/client', () => ({
  getStructuredCompletion: vi.fn().mockResolvedValue({
    personal: {
      full_name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+1 555 9876',
      location: {
        city: 'Austin',
        state: 'TX',
        country: 'USA',
        timezone: 'America/Chicago',
      },
      links: {},
    },
    summary: 'Full stack engineer with 6 years experience',
    experience: [],
    education: [],
    skills: {
      primary: ['React', 'TypeScript'],
      secondary: ['PostgreSQL'],
      tools_and_platforms: ['Docker'],
    },
    certifications: [],
    work_authorization: {
      us_authorized: true,
      requires_sponsorship: false,
    },
  }),
}))

describe('Resume Parser Agent Unit Tests', () => {
  it('should throw an error if resume text is empty or too short', async () => {
    await expect(parseResumeText('')).rejects.toThrow('too short')
    await expect(parseResumeText('Short text')).rejects.toThrow('too short')
  })

  it('should successfully parse valid resume text and return structured candidate profile', async () => {
    const validResume = `
      Jane Doe
      Senior Full Stack Software Engineer with 6 years of experience building modern web apps.
      Experience in React, TypeScript, Node.js, and PostgreSQL.
      Email: jane@example.com, Phone: +1 555 9876, Location: Austin, TX.
    `
    const profile = await parseResumeText(validResume)
    expect(profile.personal.full_name).toBe('Jane Doe')
    expect(profile.personal.email).toBe('jane@example.com')
    expect(profile.skills.primary).toContain('React')
  })
})
