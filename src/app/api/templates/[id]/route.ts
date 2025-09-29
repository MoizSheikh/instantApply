import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { id } = await params

    const template = await prisma.template.update({
      where: { id },
      data: {
        name: body.name,
        subject: body.subject,
        body: body.body
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if template is being used by any jobs
    const jobsUsingTemplate = await prisma.job.findMany({
      where: { templateId: id }
    })

    if (jobsUsingTemplate.length > 0) {
      return NextResponse.json(
        { error: `Cannot delete template. It is being used by ${jobsUsingTemplate.length} job(s).` },
        { status: 400 }
      )
    }

    await prisma.template.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
