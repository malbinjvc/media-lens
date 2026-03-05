# MediaLens

AI-powered multi-modal content intelligence platform. Upload images, PDFs, and documents — get instant AI analysis, auto-tagging, summarization, and multi-modal Q&A powered by Google Gemini.

## Tech Stack

**Server:** Express.js, TypeScript, tRPC v11, Drizzle ORM, PostgreSQL, Arctic (OAuth 2.0), Google Gemini AI, MinIO (S3), Meilisearch

**Client:** SvelteKit, TypeScript, Tailwind CSS, Lucide Icons

**Infrastructure:** Docker Compose, PostgreSQL 16, Meilisearch, MinIO

**Testing:** Playwright E2E

## Features

- **OAuth 2.0 Authentication** — Google and GitHub login via Arctic
- **Media Library** — Upload, organize, and manage images, PDFs, and text files
- **Project Organization** — Group media into color-coded projects
- **AI Image Analysis** — Describe images, extract text (OCR) via Gemini
- **Document Summarization** — Auto-summarize uploaded documents
- **Auto-Tagging** — Generate relevant tags from content
- **Multi-Modal Q&A** — Ask questions about any uploaded media
- **Full-Text Search** — Instant search with Meilisearch across all metadata
- **Presigned Uploads** — Secure direct-to-S3 file uploads via MinIO
- **Type-Safe API** — End-to-end type safety with tRPC

## Architecture

```
┌─────────────┐     tRPC      ┌──────────────┐
│  SvelteKit  │ ◄────────────► │  Express.js  │
│   Client    │   HTTP/JSON    │   tRPC API   │
└─────────────┘                └──────┬───────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                  │
              ┌─────▼─────┐   ┌──────▼──────┐   ┌──────▼──────┐
              │ PostgreSQL │   │    MinIO     │   │ Meilisearch │
              │  (Drizzle) │   │  (S3 Store)  │   │  (Search)   │
              └────────────┘   └─────────────┘   └─────────────┘
                                      │
                               ┌──────▼──────┐
                               │   Google     │
                               │   Gemini AI  │
                               └─────────────┘
```

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Google Cloud OAuth credentials
- GitHub OAuth App credentials
- Google Gemini API key

### 1. Clone and configure

```bash
git clone https://github.com/malbinjose/media-lens.git
cd media-lens
cp .env.example .env
# Edit .env with your credentials
```

### 2. Start infrastructure

```bash
docker compose up -d postgres meilisearch minio
```

### 3. Run server

```bash
cd server
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

### 4. Run client

```bash
cd client
npm install
npm run dev
```

Server runs on `http://localhost:4000`, client on `http://localhost:5173`.

## API (tRPC)

| Router | Procedure | Description |
|--------|-----------|-------------|
| `auth.getLoginUrl` | mutation | Get OAuth URL for Google/GitHub |
| `auth.callback` | mutation | Exchange OAuth code for session |
| `auth.me` | query | Get current user |
| `auth.logout` | mutation | Invalidate session |
| `media.list` | query | List media (paginated) |
| `media.get` | query | Get media with download URL |
| `media.getUploadUrl` | mutation | Get presigned upload URL |
| `media.create` | mutation | Register uploaded media |
| `media.update` | mutation | Update media metadata |
| `media.delete` | mutation | Delete media + S3 object |
| `projects.list` | query | List user projects |
| `projects.get` | query | Get project with media |
| `projects.create` | mutation | Create project |
| `projects.update` | mutation | Update project |
| `projects.delete` | mutation | Delete project |
| `ai.analyze` | mutation | Gemini multi-modal analysis |
| `ai.summarize` | mutation | Generate summary |
| `ai.tag` | mutation | Auto-generate tags |
| `ai.ask` | mutation | Q&A about media |
| `search.query` | query | Full-text search via Meilisearch |

## Database Schema

```
users       → id, email, name, avatarUrl, provider, providerId
sessions    → id, userId, token, expiresAt
projects    → id, userId, name, description, color
media       → id, userId, projectId, filename, mimeType, size,
              storageKey, title, description, aiAnalysis, tags, status
```

## Testing

```bash
cd e2e
npx playwright test
```

## Docker

```bash
docker compose up -d
```

## License

MIT
