# Pixel Pet — web

Next.js (App Router) marketing site + upload/gallery/auth surfaces.

## Setup

```bash
cp .env.local.example .env.local
# fill NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Routes (PRD §5.2)

`/`, `/upload`, `/gallery`, `/pet/[petId]`, `/login`, `/register`, `/account`, `/pricing`

## Deploy

Push to GitHub → import on Vercel → set the same env vars.
