# Quick Setup

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Then:

1. Put your Gmail OAuth credentials in `.env.local` (see the README for the variable list and where to get them)
2. Visit `http://localhost:3000/api/auth/gmail`, approve, copy the `refresh_token` into `.env.local`, restart
3. Upload resumes at `/settings/resumes`
4. Pair a resume and template per role at `/settings/roles`

Full detail is in [README.md](README.md).

## Commands

| Command | What |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run db:push` | Apply the schema to SQLite |
| `npm run db:seed` | Seed default templates |
| `npm run db:studio` | Browse the database |

## Trouble

- **Email fails**: refresh token expired — redo step 2
- **Empty resume dropdown**: nothing in `public/resumes/` yet
- **Nothing parsed from a paste**: the post genuinely has no email; check the amber banner
