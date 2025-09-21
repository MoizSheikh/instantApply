import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const roleConfigs = await prisma.roleConfig.findMany({
      include: {
        template: true
      }
    })
    return NextResponse.json(roleConfigs)
  } catch (error) {
    console.error('Error fetching role configs:', error)
    return NextResponse.json({ error: 'Failed to fetch role configs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { role, templateId, resumeName } = await request.json()

    if (!role || !templateId || !resumeName) {
      return NextResponse.json(
        { error: 'Role, templateId, and resumeName are required' },
        { status: 400 }
      )
    }

    const roleConfig = await prisma.roleConfig.create({
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
    console.error('Error creating role config:', error)
    return NextResponse.json({ error: 'Failed to create role config' }, { status: 500 })
  }
}
