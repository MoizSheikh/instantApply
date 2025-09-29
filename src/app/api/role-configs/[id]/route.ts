import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { id } = await params

    const { role, templateId, resumeName } = body

    if (!role || !templateId || !resumeName) {
      return NextResponse.json(
        { error: 'Role, templateId, and resumeName are required' },
        { status: 400 }
      )
    }

    const roleConfig = await prisma.roleConfig.update({
      where: { id },
      data: {
        role,
        templateId,
        resumeName
      },
      include: {
        template: true
      }
    })

    return NextResponse.json(roleConfig)
  } catch (error) {
    console.error('Error updating role config:', error)
    return NextResponse.json({ error: 'Failed to update role config' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.roleConfig.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting role config:', error)
    return NextResponse.json({ error: 'Failed to delete role config' }, { status: 500 })
  }
}
