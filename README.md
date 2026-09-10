# InstantApply

Paste a job post, get a tailored application email out the door. Built for one person applying to a lot of remote roles.

## What it does

- Paste a job post (LinkedIn, email, anywhere) and it pulls out the contact email, job title, company and role
- Picks the matching resume and email template automatically from your role config
- Tells you loudly when a post has no email in it, instead of leaving a blank field
- Recognises application-form links (Greenhouse, Lever, Ashby, Workable, Workday and friends) so you know that one has to be done in the browser
- Sends through your own Gmail with the resume attached, one at a time or in bulk
- Dashboard with status per application: draft, pending, sent, failed

Parsing runs locally — no API key, no model call, no network.

## Stack

Next.js 15 (App Router) · TypeScript · TailwindCSS · Prisma + SQLite · Gmail API

## Setup

### 1. Install

```bash
npm install
```

### 2. Gmail API credentials

1. [Google Cloud Console](https://console.cloud.google.com/) → new project → enable the Gmail API
2. Credentials → Create Credentials → OAuth 2.0 Client ID → Web application
3. Add redirect URI `http://localhost:3000/api/auth/gmail/callback`
4. Keep the Client ID and Client Secret

### 3. Environment

Create `.env.local`:

```env
GMAIL_CLIENT_ID="your-client-id"
GMAIL_CLIENT_SECRET="your-client-secret"
GMAIL_REDIRECT_URI="http://localhost:3000/api/auth/gmail/callback"
GMAIL_REFRESH_TOKEN="filled in at step 5"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="any-random-string"
```

The database is a local SQLite file at `prisma/dev.db`, configured in `prisma/schema.prisma` — no `DATABASE_URL` needed.

### 4. Database

```bash
npm run db:push
npm run db:seed
```

### 5. Gmail refresh token

```bash
npm run dev
```

Visit `http://localhost:3000/api/auth/gmail`, approve the consent screen, copy the `refresh_token` out of the response into `.env.local`, restart.

### 6. Resumes

Upload your PDFs at `http://localhost:3000/settings/resumes`, or drop them straight into `public/resumes/`. The dropdowns read that folder, so any filename works.

## Usage

Dashboard → **Extract from job description** → paste the post → review the prefilled fields → send. Or use `/add-job` for the full form with the same paste box at the top.

Set up one resume + template pair per role under `/settings/roles` and the right pair gets picked for you every time.

## Template variables

| Variable | Value |
|---|---|
| `{{jobTitle}}` | Job title from the post |
| `{{role}}` | Role category it mapped to |
| `{{company}}` | Company name, falling back to the email domain |
| `{{contactEmail}}` | Where it's being sent |
| `{{notes}}` | Your notes, which include the pasted post |

## Notes

- `prisma/dev.db` holds your applications and the contact emails you've written to. Keep it out of git.
- Bulk send waits a second between emails. Gmail will rate-limit you if you push it.
- Deploying to Vercel means moving off SQLite — the filesystem is read-only there, so switch the Prisma datasource to Postgres and use blob storage for resumes.

## License

MIT
