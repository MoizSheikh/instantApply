# Quick Setup Guide

## 🚀 Get Started in 5 Minutes

### 1. Environment Setup
Copy the environment template and fill in your values:

```bash
cp .env.example .env.local
```

### 2. Database Setup (Choose One)

**Option A: Supabase (Recommended)**
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database
4. Copy the connection string
5. Add to `.env.local` as `DATABASE_URL`

**Option B: Neon**
1. Go to [neon.tech](https://neon.tech)
2. Create database
3. Copy connection string to `.env.local`

### 3. Gmail API Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create project → Enable Gmail API
3. Create OAuth 2.0 credentials
4. Add redirect URI: `http://localhost:3000/api/auth/gmail/callback`
5. Add Client ID & Secret to `.env.local`

### 4. Initialize Database
```bash
npm run db:push
npm run db:seed
```

### 5. Get Gmail Token
```bash
npm run dev
```
Visit: http://localhost:3000/api/auth/gmail
Follow OAuth flow, copy refresh token to `.env.local`

### 6. Add Resumes
Place your PDF resumes in `public/resumes/`:
- `resume-frontend.pdf`
- `resume-backend.pdf`
- `resume-fullstack.pdf`
- `resume-general.pdf`

### 7. Start Using!
- **Add Jobs**: http://localhost:3000/add-job
- **Dashboard**: http://localhost:3000

## 🔧 Commands
- `npm run dev` - Start development
- `npm run build` - Build for production
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed templates

## 🚨 Troubleshooting
- **Build fails**: Check all environment variables are set
- **Email fails**: Verify Gmail refresh token is valid
- **DB errors**: Ensure database URL is correct and accessible

## 📧 Email Variables
Use these in your templates:
- `{{jobTitle}}` - Job title
- `{{role}}` - Your role
- `{{company}}` - Company name (from email domain)
- `{{contactEmail}}` - Contact email
- `{{notes}}` - Your notes
