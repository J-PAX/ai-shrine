This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Health check

`GET /api/health` checks PostgreSQL connectivity, required columns, the daily uniqueness index,
the daily divination cache schema, timezone-aware timestamps, and required OpenAI configuration.
It returns HTTP `200` only when the instance is ready; missing configuration, stale migrations, and
unreachable dependencies return HTTP `503`. The response is never cached and does not expose
connection details.

## Daily divination cache

The first divination request of each Tokyo calendar day asks OpenAI for one validated set containing
大吉、中吉、小吉、守. The complete set is stored atomically in `DailyDivinationSet`; later visitors
reuse it without another model call. A short database lease prevents duplicate generation during
concurrent cold requests. Failed generation does not create a `RitualEvent` or consume the visitor's
daily opportunity, and retries use a short backoff.

## Core E2E tests

The Playwright suite runs against an isolated PostgreSQL schema and a local OpenAI Responses mock.
It never reuses the normal development server or calls the real OpenAI API.

```bash
# One-time browser installation
npm run test:e2e:install

# Use a dedicated non-public schema whose name contains "e2e"
E2E_DATABASE_URL='postgresql://user:password@localhost:5432/database?schema=ai_shrine_e2e' npm run test:e2e
```

The preparation script refuses to run unless the URL contains a dedicated non-`public` E2E schema.
Each run resets that schema plus its `_stale` health-check fixture, applies Prisma migrations, starts
the app on ports `3101` and `3102`, and starts the local OpenAI mock on port `4101`.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
