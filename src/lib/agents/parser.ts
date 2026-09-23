import { getStructuredCompletion } from '@/lib/ai/client'
import { CandidateProfile } from '@/types'

const PARSER_SYSTEM_PROMPT = `You are an elite, highly precise ATS Resume Parsing Agent.
Your job is to extract comprehensive, structured candidate data from the provided raw resume text into valid JSON.
Never invent or hallucinate dates, skills, or companies. If a field is missing, use empty arrays or null.

Your output must be a valid JSON object strictly matching this TypeScript structure:
{
  "personal": {
    "full_name": "string",
    "email": "string",
    "phone": "string",
    "location": {
      "city": "string",
      "state": "string",
      "country": "string",
      "timezone": "string"
    },
    "links": {
      "linkedin": "string or undefined",
      "github": "string or undefined",
      "portfolio": "string or undefined",
      "twitter": "string or undefined"
    }
  },
  "summary": "string",
  "experience": [
    {
      "company": "string",
      "title": "string",
      "location": "string",
      "start_date": "string",
      "end_date": "string",
      "highlights": ["string"],
      "technologies": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field_of_study": "string",
      "graduation_year": 2024,
      "gpa": "string or undefined"
    }
  ],
  "skills": {
    "primary": ["string"],
    "secondary": ["string"],
    "tools_and_platforms": ["string"]
  },
  "certifications": ["string"],
  "work_authorization": {
    "us_authorized": true,
    "requires_sponsorship": false,
    "clearance_level": "string or undefined"
  }
}
Output only the raw JSON object. No conversational preamble or trailing remarks.`

/**
 * Agent 1: Parses raw resume text into structured candidate JSON using NVIDIA Nemotron
 */
export async function parseResumeText(rawText: string): Promise<CandidateProfile> {
  if (!rawText || rawText.trim().length < 50) {
    throw new Error('Resume text is too short or empty to parse')
  }

  const profile = await getStructuredCompletion<CandidateProfile>({
    systemPrompt: PARSER_SYSTEM_PROMPT,
    userPrompt: `Raw Resume Text to Parse:\n\n${rawText}`,
    temperature: 0.1, // Near-deterministic for parsing accuracy
  })

  // Sanitize structure fallbacks
  if (!profile.skills) {
    profile.skills = { primary: [], secondary: [], tools_and_platforms: [] }
  }
  if (!profile.experience) {
    profile.experience = []
  }
  if (!profile.education) {
    profile.education = []
  }

  return profile
}
