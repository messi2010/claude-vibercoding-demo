# TruyệnHay

Website đọc truyện tiếng Việt với nhiều thể loại: Kinh Dị, Huyền Huyễn, Kiếm Hiệp, Ngôn Tình, 18+.

## Tính năng

- Đăng nhập email/mật khẩu, Google, Facebook
- Lưu tiến độ đọc tự động theo chương và trang
- Xác minh tuổi 18+ tại đăng ký, chặn nội dung người lớn
- Phân trang theo trang trong chương
- Giao diện tối, responsive mobile-first
- Admin CMS: tạo truyện, chương, trang

## Stack

| Layer | Tech |
|-------|------|
| Monorepo | Turborepo + pnpm |
| Frontend | Next.js 14 App Router + Tailwind CSS |
| Backend | Express.js (port 4000) |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js v4 (Credentials + OAuth) |

## Cài đặt

### Yêu cầu

- Node.js 18+
- pnpm 9+
- PostgreSQL

### Bước 1: Clone và cài dependencies

```bash
git clone https://github.com/messi2010/claude-vibercoding-demo.git
cd claude-vibercoding-demo
pnpm install
```

### Bước 2: Cấu hình biến môi trường

```bash
cp .env.example .env
```

Điền vào `.env`:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/truyen
NEXTAUTH_SECRET=<random 32 bytes>
INTERNAL_API_SECRET=<random 32 bytes>
```

Tạo file `apps/web/.env.local`:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/truyen
NEXTAUTH_SECRET=<same as above>
NEXTAUTH_URL=http://localhost:3000
INTERNAL_API_SECRET=<same as above>
API_URL=http://localhost:4000
```

> **Lý do cần 2 file:** API đọc `.env` từ root, Next.js đọc `apps/web/.env.local`.

Tạo secret ngẫu nhiên:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Bước 3: Migrate database và seed

```bash
cd packages/db
npx prisma migrate deploy
npx prisma db seed
cd ../..
```

Seed tạo sẵn:
- **Admin:** `admin@truyen.dev` / `admin123`
- **User:** `user@truyen.dev` / `user123`
- 3 truyện mẫu (Kiếm Hiệp, Kinh Dị, 18+ Ngôn Tình)

### Bước 4: Chạy

```bash
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000

## Cấu trúc

```
claude-vibercoding-demo/
├── apps/
│   ├── web/          # Next.js 14 App Router
│   └── api/          # Express.js REST API
├── packages/
│   ├── db/           # Prisma client + schema + migrations
│   └── types/        # Shared TypeScript types
├── .env.example
└── turbo.json
```

## API nội bộ

Next.js server gọi Express qua header `x-internal-secret` — secret này không bao giờ ra đến browser. Token của user được forward qua `x-user-token` (JWT ký bởi `NEXTAUTH_SECRET`).
