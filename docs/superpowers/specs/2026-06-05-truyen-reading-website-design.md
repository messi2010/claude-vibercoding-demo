# Truyện Reading Website — Design Spec
**Date:** 2026-06-05  
**Status:** Approved

---

## 1. Overview

A Vietnamese novel reading website supporting multiple genres (kinh dị, huyền huyễn, kiếm hiệp, ngôn tình, 18+). Users can browse stories, read paginated chapters, and have their reading progress automatically saved per story so they can resume from where they left off after logging in.

---

## 2. Architecture

### Stack
- **Frontend:** Next.js 14 (App Router) — SSR for SEO-friendly story pages
- **Backend:** Express.js REST API
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** NextAuth.js (email/password + OAuth)
- **Monorepo:** Turborepo

### Structure
```
/apps
  /web       → Next.js 14 (App Router)
  /api       → Express.js + Prisma
/packages
  /db        → Prisma schema + migrations
  /types     → Shared TypeScript types
```

### Communication
- NextAuth.js runs inside Next.js for session management (cookie-based sessions)
- Next.js Server Actions / Route Handlers call Express API server-side, attaching a shared `INTERNAL_API_SECRET` header — the secret never reaches the browser
- Express middleware validates the `INTERNAL_API_SECRET` header on all protected routes; user identity extracted from a signed JWT embedded in the session cookie (shared `NEXTAUTH_SECRET`)

---

## 3. Database Schema

```sql
-- Users
users (
  id          UUID PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  name        TEXT,
  avatar      TEXT,
  dob         DATE,                          -- for age verification
  password    TEXT,                          -- null for OAuth users
  provider    TEXT DEFAULT 'local',          -- local | google | facebook
  is_age_verified BOOLEAN DEFAULT false,
  role        TEXT DEFAULT 'user',           -- user | admin
  created_at  TIMESTAMPTZ DEFAULT NOW()
)

-- Stories
stories (
  id          UUID PRIMARY KEY,
  title       TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  cover_image TEXT,
  status      TEXT DEFAULT 'ongoing',        -- ongoing | completed
  is_adult    BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
)

-- Story genres (many-to-many)
story_genres (
  story_id    UUID REFERENCES stories(id),
  genre       TEXT,                          -- horror | fantasy | martial_arts | romance | adult
  PRIMARY KEY (story_id, genre)
)

-- Chapters
chapters (
  id          UUID PRIMARY KEY,
  story_id    UUID REFERENCES stories(id),
  number      INT NOT NULL,
  title       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (story_id, number)
)

-- Pages
pages (
  id          UUID PRIMARY KEY,
  chapter_id  UUID REFERENCES chapters(id),
  number      INT NOT NULL,
  content     TEXT NOT NULL,
  UNIQUE (chapter_id, number)
)

-- Reading progress
reading_progress (
  id          UUID PRIMARY KEY,
  user_id     UUID REFERENCES users(id),
  story_id    UUID REFERENCES stories(id),
  chapter_id  UUID REFERENCES chapters(id),
  page_number INT NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, story_id)               -- one record per user per story, upserted on each page turn
)
```

---

## 4. UI Design

### Homepage (Dark Theme)
- Dark background (`#1a1a2e`)
- Top navigation: logo, genre dropdown, search, login/avatar
- Hero section: featured stories grid (4 columns)
- "Mới cập nhật" list: story title, latest chapter, timestamp
- For logged-in users: "Tiếp tục đọc" widget showing last-read story + progress

### Reading Page (Sidebar + Progress)
- Dark theme matching homepage
- Top bar: site logo, breadcrumb (story → chapter → page), settings (font size, brightness)
- Left sidebar: chapter list with current chapter highlighted
- Main content: chapter title + paginated text content
- Bottom bar: prev/next page buttons, page indicator (3/12), progress percentage, "Đã lưu" status indicator
- Progress auto-saved on every page navigation (debounced PATCH to API)

### Other Pages
- **Story detail:** cover, description, genre tags, chapter list, "Đọc ngay" / "Đọc tiếp" CTA
- **Genre listing:** filterable grid of stories by genre
- **User profile:** avatar, reading history, continue-reading list
- **Auth pages:** login, register (with DOB field), OAuth callback + profile completion
- **Admin CMS:** story/chapter/page management forms (role=admin only)

---

## 5. Authentication

### Email/Password Registration
1. User submits: email, password, name, date of birth
2. Server calculates age from DOB → sets `is_age_verified = (age >= 18)`
3. Password hashed with bcrypt (rounds=12)
4. JWT session issued via NextAuth

### OAuth (Google / Facebook)
1. NextAuth handles OAuth redirect and callback
2. On first login: user record created, `is_age_verified = false`
3. User redirected to mandatory "Hoàn tất hồ sơ" page to submit DOB — cannot skip; all other routes redirect back to this page until DOB is submitted
4. Server calculates age from DOB → sets `is_age_verified`, session refreshed

### 18+ Content Protection
- Story listing: `is_adult` stories hidden for non-verified users
- Story/page API: middleware checks `story.is_adult && !user.is_age_verified` → 403
- Frontend shows age gate message with link to profile settings

---

## 6. Reading Progress Tracking

### Save on Page Turn
```
PATCH /api/progress
Authorization: Bearer <jwt>
Body: { story_id, chapter_id, page_number }

→ INSERT INTO reading_progress (user_id, story_id, chapter_id, page_number, updated_at)
  VALUES (...)
  ON CONFLICT (user_id, story_id)
  DO UPDATE SET chapter_id = EXCLUDED.chapter_id,
                page_number = EXCLUDED.page_number,
                updated_at = NOW()
```

### Resume Reading
- Homepage "Tiếp tục đọc": `GET /api/progress` → returns list of in-progress stories
- Story detail page: CTA changes from "Đọc ngay" to "Đọc tiếp (Ch.X Trang Y)" when progress exists
- Deep link: `/stories/:slug/chapters/:chapterNumber/pages/:pageNumber`

---

## 7. API Routes

### Public
```
GET  /api/stories                    list stories (with genre filter, pagination)
GET  /api/stories/:slug              story detail + chapters
GET  /api/stories/:slug/chapters/:n  chapter detail + pages
GET  /api/stories/:slug/chapters/:n/pages/:p  page content
```

### Authenticated
```
GET  /api/progress                   get all reading progress for current user
PATCH /api/progress                  upsert progress (story_id, chapter_id, page_number)
GET  /api/profile                    user profile
PATCH /api/profile                   update profile (name, avatar, dob)
```

### Admin (`role=admin`)
```
POST   /api/admin/stories            create story
PATCH  /api/admin/stories/:id        update story metadata
POST   /api/admin/stories/:id/chapters        add chapter
POST   /api/admin/chapters/:id/pages          add page (paste content)
POST   /api/admin/stories/:id/cover           upload cover image (Multer)
```

---

## 8. Content Upload (Admin CMS)

- Admin pastes chapter/page content into a textarea in the CMS UI
- Cover images uploaded via Multer → stored in `/uploads` on the API server
- No WYSIWYG editor needed for v1 — plain text preserved as-is, rendered with `white-space: pre-wrap`
- Story genre assigned via multi-select (can have multiple genres)

---

## 9. Out of Scope (v1)

- Comments / ratings
- Full-text search
- Email verification / forgot password
- Bookmarks
- Mobile app
- CDN / S3 for image storage (local uploads only for v1)
- Story recommendations / trending algorithm
