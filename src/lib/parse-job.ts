import { Role } from '@/types'

export interface ParsedJob {
  jobTitle: string
  role: Role | ''
  contactEmail: string
  companyName: string
  applyUrl: string
  missing: string[]
}

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
const JUNK_DOMAINS = ['example.com', 'domain.com', 'company.com', 'email.com', 'yourcompany.com', 'linkedin.com', 'sentry.io']
const JOBBY = /^(careers?|jobs?|hr|hiring|apply|applications?|recruit\w*|talent|people|cv|resume[s]?|join|work)/i
const ATS = /https?:\/\/(?:[\w-]+\.)*(greenhouse\.io|lever\.co|ashbyhq\.com|workable\.com|smartrecruiters\.com|bamboohr\.com|workday(?:jobs)?\.com|myworkdayjobs\.com|jobvite\.com|recruitee\.com|teamtailor\.com|breezy\.hr|wellfound\.com|rippling\.com)\/[^\s<>")\]]+/i

const ROLE_RULES: [RegExp, Role][] = [
  [/\bfull[\s-]?stack\b|\bmern\b|\bmean\b/i, 'Full Stack Developer'],
  [/\bdev[\s-]?ops\b|\bsre\b|\bsite reliability\b|\bplatform engineer\b|\binfrastructure engineer\b|\bcloud engineer\b/i, 'DevOps Engineer'],
  [/\bfront[\s-]?end\b|\breact\b|\bvue\b|\bnext\.?js\b|\bangular\b|\bui engineer\b/i, 'Frontend Developer'],
  [/\bback[\s-]?end\b|\bnode\.?js\b|\bdjango\b|\bgolang\b|\bruby on rails\b|\bapi engineer\b|\bpython engineer\b/i, 'Backend Developer'],
  [/\bdata scientist\b|\bmachine learning\b|\bml engineer\b|\bdata science\b/i, 'Data Scientist'],
  [/\bproduct manager\b|\bproduct owner\b|\bgroup pm\b|\btechnical product manager\b/i, 'Product Manager'],
  [/\bui\s*\/?\s*ux\b|\bux designer\b|\bui designer\b|\bproduct designer\b/i, 'UI/UX Designer'],
  [/\bqa\b|\bquality assurance\b|\bsdet\b|\btest engineer\b|\bautomation engineer\b/i, 'QA Engineer'],
  [/\bsoftware engineer\b|\bsoftware developer\b|\bsde\b|\bswe\b|\bengineer\b|\bdeveloper\b/i, 'Software Engineer'],
]

const TITLE_LABEL = /^\s*(?:job\s*title|position|role|job|title|vacancy|opening)\s*[:\-–]\s*(.+)$/im
const TITLE_PHRASE = /(?:hiring|looking\s+for|seeking|we\s+need|now\s+hiring|urgently\s+hiring|open\s+role)\s*(?:for\s+)?(?:a|an|our\s+next)?\s*[:\-–]?\s*([A-Z][^.!?\n,;()]{2,70})/i
const COMPANY_LABEL = /^\s*(?:company|organi[sz]ation|employer|client)\s*[:\-–]\s*(.+)$/im
const COMPANY_AT = /\b(?:at|@|join|with)\s+((?:[A-Z][\w&.'-]*)(?:\s+(?:[A-Z][\w&.'-]*|of|and|the)){0,3})/

function deobfuscate(text: string): string {
  return text
    .replace(/\s*[\[({<]\s*(?:at|@)\s*[\])}>]\s*|\s+(?:at)\s+(?=[\w.-]+\s*[\[({<]?\s*dot)/gi, '@')
    .replace(/\s*[\[({<]\s*dot\s*[\])}>]\s*|\s+dot\s+/gi, '.')
    .replace(/\s+@\s+/g, '@')
    .replace(/(?<=@[\w-]+)\s+\.\s+(?=[\w-]+)/g, '.')
}

function pickEmail(text: string): string {
  const hits = (text.match(EMAIL_RE) || [])
    .map(e => e.replace(/[.,;:)\]}>'"]+$/, '').toLowerCase())
    .filter(e => !JUNK_DOMAINS.includes(e.split('@')[1]))
    .filter(e => !/\.(png|jpe?g|gif|svg|webp)$/i.test(e))
  if (!hits.length) return ''
  return hits.find(e => JOBBY.test(e.split('@')[0])) || hits[0]
}

function titleCase(s: string): string {
  return s.replace(/\S+/g, w => (w.length > 3 || /^[A-Z]/.test(w) ? w[0].toUpperCase() + w.slice(1) : w))
}

function companyFromEmail(email: string): string {
  const domain = email.split('@')[1]
  if (!domain) return ''
  const free = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'proton.me', 'protonmail.com', 'aol.com', 'live.com', 'me.com']
  if (free.includes(domain)) return ''
  const parts = domain.split('.').filter(p => !['com', 'co', 'io', 'ai', 'net', 'org', 'dev', 'app', 'uk', 'us', 'de', 'nl', 'ca', 'careers', 'jobs', 'hr', 'mail', 'inc'].includes(p))
  const name = parts[0] || domain.split('.')[0]
  return titleCase(name)
}

export function parseJobPost(raw: string): ParsedJob {
  const text = (raw || '').replace(/\r/g, '').trim()
  const contactEmail = pickEmail(text) || pickEmail(deobfuscate(text))
  const applyUrl = (text.match(ATS) || [''])[0].replace(/[.,;:)\]}>'"]+$/, '')

  let jobTitle = ''
  const labelled = text.match(TITLE_LABEL)
  if (labelled) jobTitle = labelled[1]
  if (!jobTitle) {
    const phrase = text.match(TITLE_PHRASE)
    if (phrase) jobTitle = phrase[1]
  }
  if (!jobTitle) {
    const line = text.split('\n').map(l => l.trim()).find(l => l.length > 2 && l.length < 80 && ROLE_RULES.some(([re]) => re.test(l)))
    if (line) jobTitle = line
  }
  jobTitle = jobTitle
    .replace(/^[^A-Za-z0-9]+/, '')
    .replace(/\s*[|(–-]\s*(?:remote|full[\s-]?time|part[\s-]?time|contract|hybrid|on[\s-]?site|urgent|apply now)\b.*$/i, '')
    .replace(/\s*\b(?:at|@)\s+[A-Z][\w&.'-]*(?:\s+[A-Z][\w&.'-]*){0,3}\s*$/, '')
    .replace(/[\s,;:|·•\-–]+$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 120)

  let companyName = ''
  const cLabel = text.match(COMPANY_LABEL)
  if (cLabel) companyName = cLabel[1].trim()
  if (!companyName) {
    const cAt = text.match(COMPANY_AT)
    if (cAt && !ROLE_RULES.some(([re]) => re.test(cAt[1]))) companyName = cAt[1].trim()
  }
  if (!companyName) companyName = companyFromEmail(contactEmail)
  companyName = companyName.replace(/[\s,;:|.·•\-–]+$/, '').replace(/\s+(?:is|are|we)$/i, '').slice(0, 80)

  const roleHit = ROLE_RULES.find(([re]) => re.test(jobTitle)) || ROLE_RULES.find(([re]) => re.test(text))
  const role: Role | '' = roleHit ? roleHit[1] : (jobTitle ? 'Other' : '')

  const missing: string[] = []
  if (!contactEmail) missing.push('contactEmail')
  if (!jobTitle) missing.push('jobTitle')
  if (!companyName) missing.push('companyName')

  return { jobTitle, role, contactEmail, companyName, applyUrl, missing }
}
