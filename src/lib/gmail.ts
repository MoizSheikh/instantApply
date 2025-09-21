import { google } from 'googleapis'
import { EmailData } from '@/types'
import * as fs from 'fs'
import * as path from 'path'

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
)

// Set refresh token
oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN
})

const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

export class GmailService {
  static async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const { to, subject, body, attachmentPath } = emailData

      let message = [
        `To: ${to}`,
        `Subject: ${subject}`,
        'Content-Type: text/html; charset=utf-8',
        '',
        body
      ].join('\n')

      // If there's an attachment, create multipart message
      if (attachmentPath && fs.existsSync(attachmentPath)) {
        const boundary = 'boundary_' + Math.random().toString(36).substr(2, 9)
        const fileName = path.basename(attachmentPath)
        const fileContent = fs.readFileSync(attachmentPath).toString('base64')

        message = [
          `To: ${to}`,
          `Subject: ${subject}`,
          `Content-Type: multipart/mixed; boundary="${boundary}"`,
          '',
          `--${boundary}`,
          'Content-Type: text/html; charset=utf-8',
          '',
          body,
          '',
          `--${boundary}`,
          `Content-Type: application/pdf; name="${fileName}"`,
          `Content-Disposition: attachment; filename="${fileName}"`,
          'Content-Transfer-Encoding: base64',
          '',
          fileContent,
          '',
          `--${boundary}--`
        ].join('\n')
      }

      const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

      const result = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      })

      return !!result.data.id
    } catch (error) {
      console.error('Error sending email:', error)
      return false
    }
  }

  static async getAuthUrl(): Promise<string> {
    const scopes = ['https://www.googleapis.com/auth/gmail.send']
    
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    })
  }

  static async getTokenFromCode(code: string): Promise<any> {
    try {
      const { tokens } = await oauth2Client.getToken(code)
      return tokens
    } catch (error) {
      console.error('Error getting tokens:', error)
      throw error
    }
  }
}
