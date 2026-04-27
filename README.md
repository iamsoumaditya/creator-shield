# Creator Shield 🛡️

**Creator Shield** is an AI-powered digital copyright protection platform for content creators. It lets you register your visual assets, detect unauthorized use across the web, and generate legally-precise DMCA takedown notices — all from a single dashboard.

---

## Features

- **Asset Registration** — Upload images and store their metadata. Each asset is invisibly watermarked (LSB steganography on the blue channel) and a perceptual hash (Average Hash) is computed for future matching.
- **Web Detection Scanning** — Uses the Google Cloud Vision Web Detection API to find pages on the internet that contain copies of your registered images.
- **Dashboard** — View all registered assets, track active detections, and see resolution stats at a glance.
- **AI-Generated DMCA Notices** — When an infringement is detected, trigger Gemini (Google Generative AI) to draft a complete, ready-to-send DMCA takedown notice for the target platform, streamed in real time.
- **Authentication** — Secure sign-up / sign-in powered by [Clerk](https://clerk.com). Scanning is restricted to paid users via Clerk public metadata.
- **Dark Mode** — Full light/dark theme support via `next-themes`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui |
| Auth | Clerk |
| Database | Neon (serverless PostgreSQL) |
| ORM | Drizzle ORM |
| Image Processing | Jimp (watermarking & perceptual hashing) |
| Web Detection | Google Cloud Vision API |
| AI / DMCA drafting | Google Gemini API (`@google/generative-ai`) |

---

## Project Structure

```
app/
  auth/           # Login & Register pages (Clerk)
  dashboard/      # Protected dashboard page
  takedown/       # DMCA notice generation UI (per detection)
  api/
    assets/
      register/   # POST: register a new asset
      scan/       # POST: trigger web detection scan (paid users only)
      process/    # Asset processing endpoint
      [id]/       # Asset-specific routes
    takedown/
      generate/   # POST: generate a DMCA notice via Gemini (streaming)
      [id]/       # Takedown-specific routes
components/
  dashboard/      # StatsRow, AssetGrid, TopNavbar
  ui/             # shadcn/ui primitives
lib/
  db/
    schema.ts     # Drizzle schema (users, assets, detections, takedownNotices)
    index.ts      # Neon DB client
  watermark.ts    # LSB watermarking & Average Hash utilities
  utils.ts        # Shared helpers
```

---

## Database Schema

```
users             → id (Clerk UID), name, email
assets            → id, title, description, originalUrl, watermarkedUrl, pHash, userId
detections        → id, assetId, infringingUrl, matchScore, status, screenshotUrl, takedownDraft
takedownNotices   → id, detectionId, platform, draftText, sentAt, status
```

Detection statuses: `UNAUTHORIZED` → `REVIEWING` → `LICENSED` | `RESOLVED`

---

## Getting Started

### 1. Clone & install dependencies

```bash
git clone https://github.com/iamsoumaditya/creator-shield.git
cd creator-shield
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```env
# Neon PostgreSQL
DATABASE_URL=postgresql://<user>:<password>@<host>/creatorshield

# Clerk authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Google Cloud Vision API
GOOGLE_CLOUD_VISION_API_KEY=AIza...

# Google Gemini API
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.5-flash   # optional, defaults to gemini-2.5-flash
```

### 3. Push the database schema

```bash
npx drizzle-kit push
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx drizzle-kit push` | Apply schema changes to the database |
| `npx drizzle-kit studio` | Open Drizzle Studio (DB GUI) |

---

## Enabling Paid Scan for a User

Asset scanning requires the user to have `paid: true` in their Clerk public metadata. Set this via the Clerk Dashboard or the Clerk Backend API:

```bash
curl -X PATCH https://api.clerk.com/v1/users/<USER_ID>/metadata \
  -H "Authorization: Bearer <CLERK_SECRET_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"public_metadata": {"paid": true}}'
```

---

## Deployment

The easiest way to deploy is with [Vercel](https://vercel.com/new):

1. Import the repository on Vercel.
2. Add all `.env.local` variables as Vercel Environment Variables.
3. Deploy.

Vercel's serverless functions handle all API routes out of the box.
