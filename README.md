# English Notes

Personal English learning notes: NestJS, PostgreSQL/Prisma, Next.js.
Registration, JWT login, private notes with title and content, edit and delete.

## Local setup

Use Node.js 24 and Docker Compose. From the repository root:

```sh
npm run setup
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
openssl rand -hex 32
```

Paste the generated random value into `JWT_SECRET` in `backend/.env`.
Never use the example secret in a deployed environment.

```sh
docker compose -f backend/docker-compose.yml up -d
cd backend
npm run prisma:generate
npm run db:migrate
npm run start:dev
```

In another terminal, from the repository root:

```sh
npm run dev --prefix frontend
```

Open http://localhost:3001 and register. Backend: http://localhost:3000.
Nicknames: 3–40 ASCII letters, numbers, `_`, `-`. Passwords: at least
6 characters and at most 72 UTF-8 bytes (bcrypt's input limit).

## Checks

After generating Prisma Client:

```sh
npm run build
npm run lint
npm test
```

HTTP tests use a fake repository, real guards/JWT/DTO validation, and no database.
They cover private reads/writes, legacy notes, owner injection, malformed input,
expired tokens, and authentication. They do not replace testing PostgreSQL migrations
against a disposable database or browser testing.
API contract: `backend/openapi.yaml`.

## Existing data

Existing notes with `userId = NULL` are preserved but inaccessible through the API.
Do not assign them automatically to the next person who logs in. After backing up
the database, an administrator must verify their owner and explicitly assign that
user's ID. The nullable column remains to preserve these legacy records.
New notes always receive the authenticated user's ID from the server.

## Deployment

- Set a new random `JWT_SECRET` (at least 32 bytes), `DATABASE_URL`, and `PORT`.
- Set `CORS_ORIGINS` to a comma-separated list of exact frontend origins.
- Set `NEXT_PUBLIC_API_URL` **before building** the frontend, to the public HTTPS API URL.
- Generate Prisma Client, apply `prisma migrate deploy`, then build and start both apps.
- The included Docker Compose database credentials are for local development only.
- Back up PostgreSQL; do not expose its development port publicly.
- JWTs expire after 7 days. Logout clears the browser token; it does not revoke
  an already issued token on the server. Rotation of JWT_SECRET invalidates all tokens.
- Tokens currently use localStorage. An HttpOnly cookie/session design is a future
  hardening step; account for CSRF protection if switching to cookies.
- Auth requests are limited to 10 per minute per source IP in one process. For
  multiple replicas use a shared rate limiter or enforce limits at the gateway.
  Behind a proxy configure trusted proxy handling deliberately; arbitrary forwarded
  IP headers are not trusted by this application.
