import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateJobData } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const whereClause = status ? { status: status as any } : {}

    const jobs = await prisma.job.findMany({
      where: whereClause,
      include: {
        template: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(jobs)
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateJobData = await request.json()
    
    const job = await prisma.job.create({
      data: {
        jobTitle: body.jobTitle,
        role: body.role,
        contactEmail: body.contactEmail,
        notes: body.notes,
        resumeName: body.resumeName,
        templateId: body.templateId,
        status: 'DRAFT'
      },
      include: {
        template: true
      }
    })

    return NextResponse.json(job)
  } catch (error) {
    console.error('Error creating job:', error)
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
  }
}
