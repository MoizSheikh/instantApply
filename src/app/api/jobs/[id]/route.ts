import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id }
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Delete the job
    await prisma.job.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Job deleted successfully' })

  } catch (error) {
    console.error('Error deleting job:', error)
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const data = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    // Check if job exists
    const existingJob = await prisma.job.findUnique({
      where: { id }
    })

    if (!existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Update the job
    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        jobTitle: data.jobTitle,
        role: data.role,
        contactEmail: data.contactEmail,
        notes: data.notes,
        resumeName: data.resumeName,
        templateId: data.templateId,
        companyName: data.companyName,
        updatedAt: new Date()
      },
      include: {
        template: true
      }
    })

    return NextResponse.json(updatedJob)

  } catch (error) {
    console.error('Error updating job:', error)
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 })
  }
}