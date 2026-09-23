import { ApplicationStatus } from '../../types'
import { getStructuredCompletion } from '../ai/client'
import { supabase } from '../supabase'

export interface InboundRecruiterEmail {
  fromEmail: string
  subject: string
  bodyText: string
  receivedAt?: string
}

export type RecruiterEmailClassification =
  | 'APPLICATION_RECEIVED'
  | 'ASSESSMENT_INVITATION'
  | 'INTERVIEW_REQUEST'
  | 'REJECTION_NOTICE'
  | 'OFFER_EXTENDED'
  | 'GENERAL_COMMUNICATION'

export interface InboundEmailParseResult {
  classification: RecruiterEmailClassification
  targetStatus: ApplicationStatus
  companyName?: string
  confidenceScore: number
  summary: string
  interviewLink?: string
  deadlineDate?: string
  feedbackSnippet?: string
}

/**
 * Agent 6: Inbound Status Tracker & Recruiter Email Classifier
 *
 * Automatically parses incoming communications from recruiters, identifies the application,
 * categorizes the lifecycle event, and transitions the Kanban application status in realtime.
 */
export async function parseRecruiterEmail(
  email: InboundRecruiterEmail
): Promise<InboundEmailParseResult> {
  const systemPrompt = `You are a high-accuracy Hiring Communication and Recruiter Email Classifier.
Analyze the inbound email from an employer or ATS system and categorize it into the correct lifecycle event.

ALLOWED CLASSIFICATIONS:
- APPLICATION_RECEIVED: Standard acknowledgment that an application was received.
- ASSESSMENT_INVITATION: Invitation to complete a coding challenge, take-home project, or screening test.
- INTERVIEW_REQUEST: Request for a phone screen, technical interview, or behavioral round. Look for Calendly, GoodTime, or scheduling links.
- REJECTION_NOTICE: Notice that the company has moved forward with other candidates.
- OFFER_EXTENDED: Official or verbal job offer.
- GENERAL_COMMUNICATION: Inquiries about salary, location, or general follow-ups.

Output strictly valid JSON with the following structure:
{
  "classification": "APPLICATION_RECEIVED" | "ASSESSMENT_INVITATION" | "INTERVIEW_REQUEST" | "REJECTION_NOTICE" | "OFFER_EXTENDED" | "GENERAL_COMMUNICATION",
  "targetStatus": "applied" | "interview" | "rejected" | "offer",
  "companyName": "Extracted employer name, or null",
  "confidenceScore": number (0 to 100),
  "summary": "1-2 sentence human-readable takeaway",
  "interviewLink": "Extracted scheduling link (Calendly, etc.), or null",
  "deadlineDate": "Extracted assessment deadline (ISO or text), or null",
  "feedbackSnippet": "Constructive feedback if present, or null"
}`

  const userPrompt = `FROM: ${email.fromEmail}
SUBJECT: ${email.subject}
BODY:
${email.bodyText}`

  const result = await getStructuredCompletion<InboundEmailParseResult>({
    systemPrompt,
    userPrompt,
    temperature: 0.1,
  })

  return result
}

/**
 * Updates application record in Supabase based on parsed inbound status
 */
export async function syncInboundStatusToApplication(params: {
  applicationId: string
  userId: string
  parseResult: InboundEmailParseResult
}): Promise<void> {
  const { applicationId, userId, parseResult } = params

  // 1. Update application status
  await supabase
    .from('applications')
    .update({
      status: parseResult.targetStatus,
    })
    .eq('id', applicationId)

  // 2. Log activity
  await supabase.from('activity_log').insert({
    user_id: userId,
    application_id: applicationId,
    event_type: 'status_changed',
    payload_json: {
      new_status: parseResult.targetStatus,
      classification: parseResult.classification,
      summary: parseResult.summary,
      interview_link: parseResult.interviewLink || null,
      feedback: parseResult.feedbackSnippet || null,
      timestamp: new Date().toISOString(),
    },
  })
}
