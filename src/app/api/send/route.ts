import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GmailService } from '@/lib/gmail'
import { interpolateTemplate, extractCompanyFromEmail } from '@/lib/utils'
import * as path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { jobId } = await request.json()

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    // Fetch job with template
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        template: true
      }
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.status === 'SENT') {
      return NextResponse.json({ error: 'Job already sent' }, { status: 400 })
    }

    // Interpolate template
    const { subject, body } = interpolateTemplate(job.template, job as any)

    // Prepare email data
    const resumePath = path.join(process.cwd(), 'public', 'resumes', job.resumeName)
    
    const emailData = {
      to: job.contactEmail,
      subject,
      body,
      attachmentPath: resumePath
    }

    // Update job status to pending
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'PENDING' }
    })

    // Send email
    const success = await GmailService.sendEmail(emailData)

    // Update job status based on result
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: { 
        status: success ? 'SENT' : 'FAILED',
        companyName: extractCompanyFromEmail(job.contactEmail),
        sentAt: success ? new Date() : null
      },
      include: {
        template: true
      }
    })

    return NextResponse.json({ 
      success, 
      job: updatedJob,
      message: success ? 'Email sent successfully' : 'Failed to send email'
    })

  } catch (error) {
    console.error('Error sending email:', error)
    
    // Update job status to failed if we have a jobId
    const { jobId } = await request.json().catch(() => ({}))
    if (jobId) {
      await prisma.job.update({
        where: { id: jobId },
        data: { status: 'FAILED' }
      }).catch(() => {})
    }

    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
