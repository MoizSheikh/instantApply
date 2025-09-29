import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get total jobs count
    const totalJobs = await prisma.job.count()

    // Get jobs by status
    const jobsByStatus = await prisma.job.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })

    // Get recent applications (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentApplications = await prisma.job.count({
      where: {
        sentAt: {
          gte: thirtyDaysAgo
        }
      }
    })

    // Get applications by company (top 10)
    const applicationsByCompany = await prisma.job.groupBy({
      by: ['companyName'],
      where: {
        companyName: {
          not: null
        },
        status: 'SENT'
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    })

    // Get applications over time (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const dailyApplications = await prisma.job.findMany({
      where: {
        sentAt: {
          gte: sevenDaysAgo
        }
      },
      select: {
        sentAt: true
      }
    })

    // Group by day
    const applicationsByDay = dailyApplications.reduce((acc, job) => {
      if (!job.sentAt) return acc
      const date = job.sentAt.toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Fill in missing days with 0
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      last7Days.push({
        date: dateStr,
        count: applicationsByDay[dateStr] || 0
      })
    }

    // Transform status data
    const statusStats = jobsByStatus.reduce((acc, item) => {
      acc[item.status.toLowerCase()] = item._count.id
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      totalJobs,
      recentApplications,
      statusStats: {
        draft: statusStats.draft || 0,
        pending: statusStats.pending || 0,
        sent: statusStats.sent || 0,
        failed: statusStats.failed || 0
      },
      applicationsByCompany: applicationsByCompany.map(item => ({
        company: item.companyName,
        count: item._count.id
      })),
      dailyApplications: last7Days
    })

  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
