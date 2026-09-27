import { describe, it, expect, vi } from 'vitest'
import { parseRecruiterEmail } from './tracker'

vi.mock('../ai/client', () => ({
  getStructuredCompletion: vi.fn().mockImplementation(({ userPrompt }: { userPrompt: string }) => {
    if (userPrompt.includes('interview')) {
      return Promise.resolve({
        classification: 'INTERVIEW_REQUEST',
        targetStatus: 'interview',
        companyName: 'Acme Corp',
        confidenceScore: 95,
        summary: 'Invitation for a technical screen with the engineering manager',
        interviewLink: 'https://calendly.com/acme/tech-screen',
      })
    }
    return Promise.resolve({
      classification: 'APPLICATION_RECEIVED',
      targetStatus: 'applied',
      companyName: 'TechCorp',
      confidenceScore: 90,
      summary: 'Confirmation that your application was received',
    })
  }),
}))

describe('Inbound Email Tracker Agent Unit Tests', () => {
  it('should classify an interview invitation correctly', async () => {
    const result = await parseRecruiterEmail({
      fromEmail: 'recruiter@acmecorp.com',
      subject: 'Interview Request: Senior Frontend Engineer at Acme Corp',
      bodyText: 'We would love to schedule a 45-minute technical interview. Please pick a time here: https://calendly.com/acme/tech-screen',
    })

    expect(result.classification).toBe('INTERVIEW_REQUEST')
    expect(result.targetStatus).toBe('interview')
    expect(result.interviewLink).toBe('https://calendly.com/acme/tech-screen')
    expect(result.confidenceScore).toBeGreaterThanOrEqual(90)
  })
})
