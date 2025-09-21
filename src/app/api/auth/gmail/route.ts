import { NextRequest, NextResponse } from 'next/server'
import { GmailService } from '@/lib/gmail'

export async function GET() {
  try {
    const authUrl = await GmailService.getAuthUrl()
    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Error getting Gmail auth URL:', error)
    return NextResponse.json({ error: 'Failed to get auth URL' }, { status: 500 })
  }
}
