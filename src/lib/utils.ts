import { Job, Template } from '@/types'

export function interpolateTemplate(template: Template, job: Job): { subject: string; body: string } {
  const variables = {
    jobTitle: job.jobTitle,
    role: job.role,
    company: extractCompanyFromEmail(job.contactEmail),
    contactEmail: job.contactEmail,
    notes: job.notes || ''
  }

  const subject = replaceVariables(template.subject, variables)
  const body = replaceVariables(template.body, variables)

  return { subject, body }
}

function replaceVariables(text: string, variables: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] || match
  })
}

function extractCompanyFromEmail(email: string): string {
  const domain = email.split('@')[1]
  if (!domain) return 'Company'
  
  // Remove common email providers and extract company name
  const commonProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com']
  if (commonProviders.includes(domain.toLowerCase())) {
    return 'Company'
  }
  
  // Extract company name from domain (e.g., jobs@company.com -> Company)
  const companyName = domain.split('.')[0]
  return companyName.charAt(0).toUpperCase() + companyName.slice(1)
}

export { extractCompanyFromEmail }

export function cn(...classes: (string | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}
