# InstantApply - Personal Job Application Sender

A Next.js 14 application for managing and automating job application emails with Gmail integration.

## Features

- 📝 Store job applications with details (title, role, contact email, notes, resume)
- 📧 Multiple email templates with string interpolation
- 🚀 Send individual or bulk emails via Gmail API
- 📊 Dashboard with filtering and status tracking
- 📱 Mobile-friendly interface
- 🗄️ PostgreSQL database with Prisma ORM

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Email**: Gmail API with OAuth2
- **Icons**: Lucide React

## Setup Instructions

### 1. Database Setup

Choose one of these free PostgreSQL hosting options:
- [Supabase](https://supabase.com/) - Free tier: 500MB, 2 projects
- [Neon](https://neon.tech/) - Free tier: 3GB, 1 project
- [Railway](https://railway.app/) - Free tier with usage limits

Create a database and get the connection URL.

### 2. Gmail API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Gmail API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Configure consent screen if needed
6. Set application type to "Web application"
7. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/gmail/callback` (development)
   - Your production URL + `/api/auth/gmail/callback` (production)
8. Save the Client ID and Client Secret

### 3. Environment Variables

Create a `.env.local` file in the root directory:

\`\`\`env
# Database
DATABASE_URL="your-postgresql-connection-string"

# Gmail API OAuth2
GMAIL_CLIENT_ID="your-gmail-client-id"
GMAIL_CLIENT_SECRET="your-gmail-client-secret"
GMAIL_REDIRECT_URI="http://localhost:3000/api/auth/gmail/callback"
GMAIL_REFRESH_TOKEN="your-refresh-token"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-random-secret-key"
\`\`\`

### 4. Get Gmail Refresh Token

1. Start the development server: \`npm run dev\`
2. Visit: \`http://localhost:3000/api/auth/gmail\`
3. Follow the OAuth flow to authorize your Gmail account
4. Copy the \`refresh_token\` from the response
5. Add it to your \`.env.local\` file as \`GMAIL_REFRESH_TOKEN\`

### 5. Database Migration & Seeding

\`\`\`bash
# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed with default templates
npm run db:seed
\`\`\`

### 6. Add Your Resumes

Place your resume PDF files in \`public/resumes/\` directory:
- \`resume-frontend.pdf\`
- \`resume-backend.pdf\`
- \`resume-fullstack.pdf\`
- \`resume-general.pdf\`

Or update the resume options in \`src/app/add-job/page.tsx\` to match your files.

### 7. Start Development

\`\`\`bash
npm run dev
\`\`\`

Visit \`http://localhost:3000\` to start using the application!

## Usage

### Adding Jobs
1. Click "Add Job" in the navigation
2. Fill in job details (title, role, contact email, notes)
3. Select a resume and email template
4. Save as draft

### Managing Jobs
1. View all jobs in the Dashboard
2. Filter by status (Draft, Pending, Sent, Failed)
3. Preview generated emails before sending
4. Send individual jobs or bulk send all pending

### Email Templates

The application comes with 4 default templates:
- **Professional Standard**: Formal business tone
- **Casual & Friendly**: Relaxed, personable approach
- **Technical Focus**: Emphasizes technical skills
- **Startup Focused**: Energetic, impact-oriented

Templates support variable interpolation:
- \`{{jobTitle}}\` - Job title
- \`{{role}}\` - Your role/position
- \`{{company}}\` - Company name (extracted from email domain)
- \`{{contactEmail}}\` - Contact email address
- \`{{notes}}\` - Your custom notes

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms
- Railway
- Netlify (with serverless functions)
- DigitalOcean App Platform

## Database Schema

### Jobs Table
- \`id\` - Unique identifier
- \`jobTitle\` - Position title
- \`role\` - Your role category
- \`contactEmail\` - Hiring manager email
- \`notes\` - Additional notes
- \`resumeName\` - Resume file name
- \`status\` - DRAFT | PENDING | SENT | FAILED
- \`templateId\` - Foreign key to template
- \`createdAt\` / \`updatedAt\` - Timestamps

### Templates Table
- \`id\` - Unique identifier
- \`name\` - Template name
- \`subject\` - Email subject template
- \`body\` - Email body template
- \`createdAt\` / \`updatedAt\` - Timestamps

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use this for your job search! 🚀
