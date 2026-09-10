import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deliverJob, markFailed } from '@/lib/send-job'

export async function POST(request: NextRequest) {
  let jobId: string | undefined

  try {
    jobId = (await request.json()).jobId

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { template: true }
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.status === 'SENT') {
      return NextResponse.json({ error: 'Job already sent' }, { status: 400 })
    }

    await prisma.job.update({ where: { id: jobId }, data: { status: 'PENDING' } })

    const success = await deliverJob(job)

    const updatedJob = await prisma.job.findUnique({
      where: { id: jobId },
      include: { template: true }
    })

    return NextResponse.json({
      success,
      job: updatedJob,
      message: success ? 'Email sent successfully' : 'Failed to send email'
    })
  } catch (error) {
    console.error('Error sending email:', error)
    if (jobId) await markFailed(jobId)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
