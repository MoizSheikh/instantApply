import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deliverJob, markFailed } from '@/lib/send-job'

const THROTTLE_MS = 1000

export async function POST(request: NextRequest) {
  try {
    const { status = 'PENDING' } = await request.json()

    const jobs = await prisma.job.findMany({
      where: { status },
      include: { template: true }
    })

    if (jobs.length === 0) {
      return NextResponse.json({ message: 'No jobs to send', results: [] })
    }

    const results = []

    for (const [i, job] of jobs.entries()) {
      try {
        const success = await deliverJob(job)
        results.push({
          jobId: job.id,
          jobTitle: job.jobTitle,
          contactEmail: job.contactEmail,
          success,
          error: success ? null : 'Failed to send email'
        })
      } catch (error) {
        console.error(`Error sending email for job ${job.id}:`, error)
        await markFailed(job.id)
        results.push({
          jobId: job.id,
          jobTitle: job.jobTitle,
          contactEmail: job.contactEmail,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }

      if (i < jobs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, THROTTLE_MS))
      }
    }

    const sent = results.filter(r => r.success).length

    return NextResponse.json({
      message: `Processed ${results.length} jobs: ${sent} sent, ${results.length - sent} failed`,
      results,
      summary: { total: results.length, sent, failed: results.length - sent }
    })
  } catch (error) {
    console.error('Error in bulk send:', error)
    return NextResponse.json({ error: 'Failed to process bulk send' }, { status: 500 })
  }
}
