# Creator Shield 🛡️

> **AI-powered copyright protection for digital content creators.**

Creator Shield lets you register your original images, automatically detect where they appear without permission across the web, and instantly generate legally-precise DMCA takedown notices — all from one clean dashboard powered by Google Cloud Vision and Google Gemini AI.

---

## Table of Contents

- [What It Does](#what-it-does)
- [How It Works — The Full User Journey](#how-it-works--the-full-user-journey)
- [Key Technical Concepts](#key-technical-concepts)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Enabling Paid Scanning](#enabling-paid-scanning)
- [Deployment](#deployment)

---

## What It Does

Photographers, illustrators, designers, and any creator who publishes images online face a constant problem: their work gets copied and used without permission. Creator Shield automates the three hardest parts of fighting back:

1. **Proof of ownership** — an invisible digital watermark is embedded in every image you register, tying it cryptographically to your account.
2. **Finding infringements** — Google's reverse-image search engine scans the entire web and returns every page that hosts a copy of your image.
3. **Taking action** — an AI legal assistant writes a complete, platform-specific DMCA takedown notice for you in seconds.

---

## How It Works — The Full User Journey

### Step 1 — Sign Up / Sign In

Authentication is handled entirely by [Clerk](https://clerk.com). New users sign up at `/auth/register`; returning users sign in at `/auth/login`. Clerk manages sessions, JWTs, and OAuth providers — no passwords are stored in the app database.

### Step 2 — Register a New Asset

Navigate to **Register New Asset** (`/assets/register`). The page walks you through a 4-step wizard:

| Step | What happens |
|------|-------------|
| **1 – Upload** | You select a JPEG, PNG, or WebP image (up to 10 MB). A preview is shown in the browser. |
| **2 – Watermark** | Clicking *Embed Watermark* calls `POST /api/assets/process`. The server reads the raw image bytes, embeds an invisible watermark (see below), computes a perceptual hash, saves both the original and the watermarked file to `public/uploads/`, and returns the file paths and hash. The page shows a side-by-side comparison. |
| **3 – Details** | You fill in a title, optional description, license type (All Rights Reserved, Creative Commons, etc.) and comma-separated tags. |
| **4 – Confirm** | A summary card shows the watermarked image, title, license, tags, and "Valid" digital-signature status. Clicking *Confirm Registration* calls `POST /api/assets/register`, which writes the record to the database and redirects you to the dashboard. |

### Step 3 — The Dashboard

`/dashboard` is your command centre. It shows:

- **Stats row** — four at-a-glance counters: Total Assets, Active Detections, Takedowns Sent, and Resolved cases.
- **Asset grid** — every registered image displayed as a card with its registration date, detection count badge, and a *Scan Now* button.

### Step 4 — Scan for Infringements

On the asset detail page (`/assets/[id]`) click **Scan the Web Now**. This calls `POST /api/assets/scan`, which:

1. Verifies that the requesting user is a **paid** user (checked against Clerk public metadata).
2. Reads the original uploaded image from disk and base64-encodes it.
3. Sends the encoded image to the **Google Cloud Vision Web Detection API**.
4. Receives a list of web pages that contain matching images (full matches score 0.99, partial matches 0.75, other matches 0.60).
5. Inserts each new match into the `detections` table with status `UNAUTHORIZED`.

The asset detail page also displays all detections in a tabbed table, filterable by status: **All / Unauthorized / Reviewing / Resolved**.

### Step 5 — Draft a DMCA Takedown Notice

Click **Draft Takedown** next to any detection to open the takedown page (`/takedown/[detectionId]`). This page has two panels:

- **Left** — infringement context: the protected asset thumbnail, the infringing URL, match confidence, and detection date.
- **Right** — the Notice Generator. Select a target platform (Google Search, Instagram, Twitter/X, Facebook, Cloudflare, or Generic), then click **Generate Notice**.

The button calls `POST /api/takedown/generate`, which:

1. Builds a detailed legal prompt including the rights holder ID, original work title, registration date, original URL, infringing URL, and platform.
2. Sends the prompt to **Google Gemini** (default model: `gemini-2.5-flash`).
3. **Streams** the generated notice back to the browser as plain text — you watch the notice appear word-by-word in real time.
4. Saves the complete draft to the `takedownNotices` table and upgrades the detection status from `UNAUTHORIZED` → `REVIEWING`.

The generated draft is fully editable in a textarea. You can then:
- **Copy** it to the clipboard.
- **Download** it as a `.txt` file named after your asset.
- Click **Mark as Sent & Resolved** to call `POST /api/takedown/[id]/resolve`, which flips the detection to `RESOLVED` and the notice to `SENT`.

---

## Key Technical Concepts

### Invisible Watermarking (LSB Steganography)

When you process an image, `lib/watermark.ts` embeds a hidden payload into the image using **Least-Significant Bit (LSB) steganography**:

- A payload string is assembled: `<clerkUserId>|<timestamp>`.
- The string is converted to a binary bit array (UTF-8, MSB first).
- Starting from the top-left corner of the image, each bit is written into the **LSB of the blue channel** of successive pixels (up to 32 × 32 = 1024 pixels).
- Changing only the last bit of one colour channel produces a change of at most 1 out of 255 — completely invisible to the human eye.
- The result is saved as a lossless PNG to preserve the embedded data.

This means every watermarked image silently carries your identity and a timestamp, which is valuable evidence of prior authorship.

### Perceptual Hashing (Average Hash)

Alongside the watermark, a **perceptual hash** (pHash) is computed:

1. The image is resized to 8 × 8 pixels and converted to greyscale.
2. The mean brightness of all 64 pixels is calculated.
3. Each pixel is compared to the mean: `1` if brighter, `0` if darker — producing a 64-bit binary string.
4. The binary string is converted to a 16-character hex string.

Two perceptually similar images (e.g., the same photo resized or lightly edited) produce hashes with a low Hamming distance. The pHash is stored with the asset and displayed on asset cards and the takedown page as a short fingerprint.

### Streaming AI Responses

The DMCA notice generation endpoint returns a **`ReadableStream`** of plain text rather than a single JSON response. The client-side `TakedownClient` component reads this stream chunk-by-chunk using the Streams API and appends each chunk to the textarea, creating the typewriter effect. This means the user sees output immediately rather than waiting for the entire notice to be generated.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | [Next.js 16](https://nextjs.org) App Router | Full-stack React framework, file-based routing, server components, API routes |
| Language | TypeScript | End-to-end type safety |
| Styling | Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com) | Utility-first CSS with accessible, composable UI components |
| Auth | [Clerk](https://clerk.com) | User sign-up, sign-in, session management, public metadata (paid flag) |
| Database | [Neon](https://neon.tech) (serverless PostgreSQL) | Cloud Postgres with HTTP-based serverless driver |
| ORM | [Drizzle ORM](https://orm.drizzle.team) | Type-safe SQL query builder with schema-push migrations |
| Image Processing | [Jimp](https://github.com/jimp-dev/jimp) | Pure-JS image library for LSB watermarking and perceptual hashing |
| Web Detection | [Google Cloud Vision API](https://cloud.google.com/vision) | Web Detection feature finds pages containing copies of a given image |
| AI Notice Drafting | [Google Gemini](https://ai.google.dev) (`@google/generative-ai`) | LLM that writes formal DMCA takedown notices, streamed in real time |
| Notifications | [Sonner](https://sonner.emilkowal.ski) | Toast notification system |
| Theming | [next-themes](https://github.com/pacocoursey/next-themes) | Light / dark mode toggle |

---

## Project Structure

```
creator-shield/
├── app/
│   ├── auth/
│   │   ├── login/page.tsx        # Clerk <SignIn /> page
│   │   └── register/page.tsx     # Clerk <SignUp /> page
│   ├── dashboard/
│   │   ├── layout.tsx            # Dashboard shell (with TopNavbar)
│   │   └── page.tsx              # Stats + AssetGrid, fetches data server-side
│   ├── assets/
│   │   ├── register/page.tsx     # 4-step wizard: upload → watermark → details → confirm
│   │   └── [id]/page.tsx         # Asset detail page: metadata, scan button, detections table
│   ├── takedown/
│   │   └── [detectionId]/
│   │       ├── page.tsx          # Server component: loads detection + asset, guards auth
│   │       └── TakedownClient.tsx # Client component: platform selector, streaming generator
│   ├── api/
│   │   ├── assets/
│   │   │   ├── process/route.ts  # POST: watermark image, compute pHash, save to disk
│   │   │   ├── register/route.ts # POST: insert asset record into DB
│   │   │   ├── scan/route.ts     # POST: call Vision API, insert new detections (paid only)
│   │   │   └── [id]/route.ts     # GET: fetch single asset with detections
│   │   └── takedown/
│   │       ├── generate/route.ts # POST: call Gemini, stream DMCA draft, save notice
│   │       └── [id]/
│   │           └── resolve/route.ts  # POST: mark detection RESOLVED, notice SENT
│   ├── layout.tsx                # Root layout (ClerkProvider, ThemeProvider, Sonner)
│   └── globals.css               # Tailwind base styles
├── components/
│   ├── dashboard/
│   │   ├── TopNavbar.tsx         # Site header with logo, nav links, Clerk UserButton
│   │   ├── StatsRow.tsx          # 4-card stats grid
│   │   └── AssetGrid.tsx         # Responsive image card grid with detection badge
│   └── ui/                       # shadcn/ui primitives (Button, Card, Badge, etc.)
├── lib/
│   ├── db/
│   │   ├── schema.ts             # Drizzle table definitions + relations
│   │   └── index.ts              # Neon DB client instance
│   ├── watermark.ts              # LSB watermark embed + Average Hash functions
│   └── utils.ts                  # clsx/tailwind-merge helper (cn())
├── drizzle.config.ts             # Drizzle Kit config (schema path, DB URL, dialect)
├── next.config.ts                # Next.js config
└── package.json
```

---

## API Reference

All routes are under `/api/` and require an authenticated Clerk session (401 if missing).

### Assets

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/assets/process` | User | Accepts `multipart/form-data` with a `file` field. Returns `{ watermarkedUrl, originalUrl, pHash }`. |
| `POST` | `/api/assets/register` | User | JSON body: `{ title, description, licenseType, tags, originalUrl, watermarkedUrl, pHash }`. Upserts the user record and inserts the asset. Returns `{ success, asset }`. |
| `GET`  | `/api/assets/[id]` | User (owner) | Returns the asset record with its detections array. |
| `POST` | `/api/assets/scan` | Paid user | JSON body: `{ assetId }`. Calls Google Cloud Vision Web Detection, inserts new `detections` rows, returns `{ success, newDetections }`. |

### Takedowns

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/takedown/generate` | User (owner) | JSON body: `{ detectionId, platform }`. Streams the Gemini-generated DMCA notice as `text/plain`. Also saves the draft and advances detection status to `REVIEWING`. |
| `POST` | `/api/takedown/[id]/resolve` | User | Marks the detection `RESOLVED` and the takedown notice `SENT`. |

---

## Database Schema

Four tables linked by foreign keys:

```
┌─────────────────────────────────────────────────────────┐
│ users                                                   │
│  id          TEXT  PK  (Clerk user ID)                  │
│  name        TEXT                                       │
│  email       TEXT  UNIQUE                               │
│  created_at  TIMESTAMP                                  │
└────────────────────────┬────────────────────────────────┘
                         │ 1:N
┌────────────────────────▼────────────────────────────────┐
│ assets                                                  │
│  id              UUID  PK                               │
│  title           TEXT                                   │
│  description     TEXT  nullable                         │
│  original_url    TEXT  (path to original file)          │
│  watermarked_url TEXT  nullable                         │
│  p_hash          TEXT  nullable  (16-char hex)          │
│  user_id         TEXT  FK → users.id                    │
│  created_at      TIMESTAMP                              │
└────────────────────────┬────────────────────────────────┘
                         │ 1:N
┌────────────────────────▼────────────────────────────────┐
│ detections                                              │
│  id              UUID  PK                               │
│  asset_id        UUID  FK → assets.id                   │
│  infringing_url  TEXT  (page where copy was found)      │
│  match_score     REAL  (0.0 – 1.0)                      │
│  status          ENUM  UNAUTHORIZED | REVIEWING |       │
│                        LICENSED | RESOLVED              │
│  screenshot_url  TEXT  nullable                         │
│  takedown_draft  TEXT  nullable                         │
│  created_at      TIMESTAMP                              │
└────────────────────────┬────────────────────────────────┘
                         │ 1:N
┌────────────────────────▼────────────────────────────────┐
│ takedown_notices                                        │
│  id            UUID  PK                                 │
│  detection_id  UUID  FK → detections.id                 │
│  platform      TEXT  (e.g. "Google Search")             │
│  draft_text    TEXT  (full DMCA notice text)            │
│  sent_at       TIMESTAMP  nullable                      │
│  status        ENUM  DRAFT | SENT                       │
└─────────────────────────────────────────────────────────┘
```

**Detection lifecycle:**
```
UNAUTHORIZED → (generate notice) → REVIEWING → (mark sent) → RESOLVED
                                              ↘ LICENSED   (if usage is permitted)
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- A **Neon** (or any PostgreSQL) database
- A **Clerk** application (free tier is fine)
- A **Google Cloud** project with the Vision API enabled
- A **Google AI Studio** API key for Gemini

### 1 — Clone and install

```bash
git clone https://github.com/iamsoumaditya/creator-shield.git
cd creator-shield
npm install
```

### 2 — Configure environment variables

Create `.env.local` in the project root (never commit this file):

```env
# ── Database ────────────────────────────────────────────────
DATABASE_URL=postgresql://<user>:<password>@<host>/<dbname>?sslmode=require

# ── Clerk ───────────────────────────────────────────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# ── Google Cloud Vision ─────────────────────────────────────
GOOGLE_CLOUD_VISION_API_KEY=AIza...

# ── Google Gemini ────────────────────────────────────────────
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.5-flash        # optional — this is the default
```

### 3 — Push the database schema

This creates all four tables in your database:

```bash
npx drizzle-kit push
```

### 4 — Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign up for an account to begin.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (Neon or any Postgres) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk publishable key (safe to expose to browser) |
| `CLERK_SECRET_KEY` | ✅ | Clerk secret key (server-only) |
| `GOOGLE_CLOUD_VISION_API_KEY` | ✅ | API key for Google Cloud Vision Web Detection |
| `GEMINI_API_KEY` | ✅ | API key for Google Gemini generative AI |
| `GEMINI_MODEL` | ⬜ | Gemini model name — defaults to `gemini-2.5-flash` |

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js development server on port 3000 |
| `npm run build` | Compile a production build |
| `npm run start` | Start the production server (requires a build first) |
| `npm run lint` | Run ESLint across the codebase |
| `npx drizzle-kit push` | Apply schema changes to the connected database (no migration files) |
| `npx drizzle-kit studio` | Open Drizzle Studio — a browser-based database GUI |

---

## Enabling Paid Scanning

The web-scan feature (`POST /api/assets/scan`) is restricted to users with `paid: true` in their Clerk **public metadata**. This is checked server-side on every scan request.

To enable scanning for a user, update their metadata via the Clerk Backend API:

```bash
curl -X PATCH "https://api.clerk.com/v1/users/<USER_ID>/metadata" \
  -H "Authorization: Bearer <CLERK_SECRET_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"public_metadata": {"paid": true}}'
```

You can also do this through the **Clerk Dashboard** → Users → select a user → Public Metadata → add `{"paid": true}`.

---

## Deployment

### Vercel (recommended)

Creator Shield is built for Vercel — every API route becomes a serverless function automatically.

1. Push your code to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. In the Vercel project settings, add each variable from the [Environment Variables](#environment-variables) section.
4. Deploy. Vercel handles builds and CDN distribution.

> **Note on file uploads:** The current implementation saves uploaded images to `public/uploads/` on the local filesystem. This works in development but does **not** persist across serverless deployments (the filesystem is ephemeral). For a production deployment, replace the file-write logic in `api/assets/process/route.ts` with a cloud storage upload (e.g., Vercel Blob, AWS S3, or Cloudflare R2) and update the returned URLs accordingly.

---

## Contributing

1. Fork the repository and create a feature branch.
2. Run `npm run lint` and `npm run build` before opening a pull request.
3. Keep pull requests focused — one feature or fix per PR.

---

## License

This project is private and all rights are reserved by the author.
