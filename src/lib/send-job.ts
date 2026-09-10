import path from 'path'
import { prisma } from '@/lib/prisma'
import { GmailService } from '@/lib/gmail'
import { interpolateTemplate, extractCompanyFromEmail } from '@/lib/utils'
import { Template } from '@/types'

export interface SendableJob {
  id: string
  jobTitle: string
  role: string
  contactEmail: string
  companyName: string | null
  notes: string | null
  resumeName: string
  template: Template
}

export async function deliverJob(job: SendableJob): Promise<boolean> {
  const { subject, body } = interpolateTemplate(job.template, job)

  const success = await GmailService.sendEmail({
    to: job.contactEmail,
    subject,
    body,
    attachmentPath: path.join(process.cwd(), 'public', 'resumes', job.resumeName)
  })

  await prisma.job.update({
    where: { id: job.id },
    data: {
      status: success ? 'SENT' : 'FAILED',
      companyName: job.companyName || extractCompanyFromEmail(job.contactEmail),
      sentAt: success ? new Date() : null
    }
  })

  return success
}

export async function markFailed(jobId: string): Promise<void> {
  await prisma.job.update({ where: { id: jobId }, data: { status: 'FAILED' } }).catch(() => {})
}
