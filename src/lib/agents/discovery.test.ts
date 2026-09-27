import { describe, it, expect } from 'vitest'
import { computeDedupHash, cleanJobDescription } from './discovery'

describe('Discovery Agent & Deduplication Unit Tests', () => {
  it('should generate consistent SHA-256 hashes for identical normalized jobs', async () => {
    const hash1 = await computeDedupHash('Google LLC', 'Senior Software Engineer', 'Mountain View, CA')
    const hash2 = await computeDedupHash('  google llc  ', 'senior software engineer', 'mountain view, ca')
    expect(hash1).toBe(hash2)
  })

  it('should generate different hashes for distinct companies or titles', async () => {
    const hash1 = await computeDedupHash('Google', 'Frontend Engineer', 'Remote')
    const hash2 = await computeDedupHash('Meta', 'Frontend Engineer', 'Remote')
    const hash3 = await computeDedupHash('Google', 'Backend Engineer', 'Remote')

    expect(hash1).not.toBe(hash2)
    expect(hash1).not.toBe(hash3)
  })

  it('should cleanly strip HTML, style, and script tags from raw job descriptions', () => {
    const rawHtml = `
      <div>
        <style>.job { color: red; }</style>
        <h1>Senior React Developer</h1>
        <p>We are looking for an <strong>expert</strong> in React &amp; TypeScript.</p>
        <script>alert("tracking");</script>
        <p>Salary:&nbsp;$150,000</p>
      </div>
    `
    const cleaned = cleanJobDescription(rawHtml)
    expect(cleaned).not.toContain('<style>')
    expect(cleaned).not.toContain('<script>')
    expect(cleaned).not.toContain('<h1>')
    expect(cleaned).toContain('Senior React Developer')
    expect(cleaned).toContain('expert in React & TypeScript.')
    expect(cleaned).toContain('Salary: $150,000')
  })
})
