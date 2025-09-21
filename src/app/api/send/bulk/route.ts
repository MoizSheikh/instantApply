import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GmailService } from '@/lib/gmail'
import { interpolateTemplate } from '@/lib/utils'
import * as path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { status = 'PENDING' } = await request.json()

    // Fetch all jobs with the specified status
    const jobs = await prisma.job.findMany({
      where: { status: status as any },
      include: {
        template: true
      }
    })

    if (jobs.length === 0) {
      return NextResponse.json({ message: 'No jobs to send', results: [] })
    }

    const results = []

    for (const job of jobs) {
      try {
        // Interpolate template
        const { subject, body } = interpolateTemplate(job.template, job)

        // Prepare email data
        const resumePath = path.join(process.cwd(), 'public', 'resumes', job.resumeName)
        
        const emailData = {
          to: job.contactEmail,
          subject,
          body,
          attachmentPath: resumePath
        }

        // Send email
        const success = await GmailService.sendEmail(emailData)

        // Update job status
        await prisma.job.update({
          where: { id: job.id },
          data: { 
            status: success ? 'SENT' : 'FAILED' 
          }
        })

        results.push({
          jobId: job.id,
          jobTitle: job.jobTitle,
          contactEmail: job.contactEmail,
          success,
          error: success ? null : 'Failed to send email'
        })

        // Small delay between emails to avoid rate limiting
        if (jobs.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

      } catch (error) {
        console.error(`Error sending email for job ${job.id}:`, error)
        
        // Update job status to failed
        await prisma.job.update({
          where: { id: job.id },
          data: { status: 'FAILED' }
        }).catch(() => {})

        results.push({
          jobId: job.id,
          jobTitle: job.jobTitle,
          contactEmail: job.contactEmail,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.length - successCount

    return NextResponse.json({
      message: `Processed ${results.length} jobs: ${successCount} sent, ${failureCount} failed`,
      results,
      summary: {
        total: results.length,
        sent: successCount,
        failed: failureCount
      }
    })

  } catch (error) {
    console.error('Error in bulk send:', error)
    return NextResponse.json({ error: 'Failed to process bulk send' }, { status: 500 })
  }
}
