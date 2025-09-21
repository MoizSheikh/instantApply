import { NextRequest, NextResponse } from 'next/server'
import { GmailService } from '@/lib/gmail'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Authorization code not provided' }, { status: 400 })
    }

    const tokens = await GmailService.getTokenFromCode(code)
    
    return NextResponse.json({ 
      message: 'Authorization successful',
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token
    })
  } catch (error) {
    console.error('Error in Gmail callback:', error)
    return NextResponse.json({ error: 'Authorization failed' }, { status: 500 })
  }
}
