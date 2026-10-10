# Study Hub

A study materials platform for Khulna University students: share lecture notes, past questions and lab manuals, find them by discipline, batch and course, and ask questions in a Q&A board.

![Study Hub home page](docs/screenshots/home.png)

## Features

- **Materials:** upload PDFs, slides, notes, images and videos; categories such as previous questions, class tests, lecture notes and lab manuals; tags; an approval step for admins before materials go public
- **Find what you need:** filter by discipline, batch, course and category, with search
- **Q&A:** ask questions with image attachments and answer them
- **Personal tools:** bookmarks, collections with share links, view history, ratings and reviews
- **Schedules:** class tests, lab tests, assignments, vivas and presentations per course
- **Roles:** student, admin and super admin, enforced by JWT checks on the API and row-level security in the database
- **Sign-in:** email and password, or Google
- **Storage:** Supabase Storage or Cloudflare R2, chosen by a setting

## Tech stack

| Part | Built with |
| --- | --- |
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand, React Hook Form, Zod |
| Backend | Node.js, Express, TypeScript, Zod, JWT |
| Database | PostgreSQL on Supabase, with row-level security |
| Files | Supabase Storage or Cloudflare R2 (presigned uploads) |

## Project structure

```
backend/      Express API (routes, controllers, services, middleware)
frontend/     Next.js app
supabase/     SQL migrations (run in order) and seed data
uiUx/         UI designs for each page (HTML mock-ups with a preview image)
postman-collection.json   API requests for Postman
```

API routes live under `/api`: `auth`, `materials`, `filters`, `courses`, `questions`, `collections`, `notifications`, `schedules`, `super-admin` and `webhooks`.

## Run it locally

Requirements: Node.js 20 and a free [Supabase](https://supabase.com) project.

**1. Database.** In the Supabase SQL editor, run the files in `supabase/migrations` in number order, starting at `001`. Then run `supabase/seed.sql` for disciplines, batches and courses.

> `000_drop_all_tables.sql` deletes every table. Only run it to reset a development database.

**2. Backend**

```bash
cd backend
cp .env.example .env      # add your Supabase URL and keys, and a JWT secret of 32+ characters
npm install
npm run dev               # http://localhost:5000
```

**3. Frontend**

```bash
cd frontend
cp .env.example .env.local   # add the API URL, Supabase URL and anon key
npm install
npm run dev                  # http://localhost:3000
```

## Tests

```bash
cd backend
npm test
```

The backend tests cover file handling (material type detection, safe unique file names, file sizes, search input cleaning) and request validation (upload, schedule, election and vote rules). GitHub Actions runs the backend tests and type check, and builds the frontend, on every push and pull request.

## Security notes

- Secrets live only in `.env` files, which are ignored by git. The service role key is used by the backend only, never the browser.
- Request validation errors log the names of the fields that failed, never the values that were sent.

