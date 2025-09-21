export type JobStatus = 'DRAFT' | 'PENDING' | 'SENT' | 'FAILED'

export type Role = 
  | 'Frontend Developer'
  | 'Backend Developer'
  | 'Full Stack Developer'
  | 'Software Engineer'
  | 'DevOps Engineer'
  | 'Data Scientist'
  | 'Product Manager'
  | 'UI/UX Designer'
  | 'QA Engineer'
  | 'Other'

export interface Job {
  id: string
  jobTitle: string
  role: string
  contactEmail: string
  notes: string | null
  resumeName: string
  status: JobStatus
  templateId: string
  createdAt: Date
  updatedAt: Date
  template?: Template
}

export interface Template {
  id: string
  name: string
  subject: string
  body: string
  createdAt: Date
  updatedAt: Date
}

export interface RoleConfig {
  id: string
  role: string
  templateId: string
  resumeName: string
  createdAt: Date
  updatedAt: Date
  template?: Template
}

export interface CreateJobData {
  jobTitle: string
  role: string
  contactEmail: string
  notes?: string
  resumeName: string
  templateId: string
}

export interface UpdateJobData {
  jobTitle?: string
  role?: string
  contactEmail?: string
  notes?: string
  resumeName?: string
  templateId?: string
  status?: JobStatus
}

export interface EmailData {
  to: string
  subject: string
  body: string
  attachmentPath?: string
}
