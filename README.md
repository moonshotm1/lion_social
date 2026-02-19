# Gains - Wellness Social

A premium wellness social platform where people share their fitness journeys, healthy meals, motivational quotes, and inspiring stories. Built with a Turborepo monorepo powering both a Next.js web app and an Expo React Native mobile app.

## Vision

Gains is a social network for people who are serious about self-improvement. Think Nike app meets Instagram — dark, bold, and premium. Users share workouts, meals, quotes, and stories to inspire and be inspired by the community.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo |
| Web | Next.js 14 (App Router), Tailwind CSS, shadcn/ui |
| Mobile | Expo (React Native), NativeWind |
| Auth | Clerk (web + mobile) |
| Database | Supabase (PostgreSQL) |
| ORM | Prisma |
| File Storage | Supabase Storage |
| API | tRPC (shared between web + mobile) |
| State | Zustand |

## Project Structure

```
lion_social/
├── apps/
│   ├── web/              # Next.js 14 web app
│   └── mobile/           # Expo React Native app
├── packages/
│   ├── api/              # tRPC router & procedures
│   ├── database/         # Prisma schema & client
│   ├── types/            # Shared TypeScript types
│   ├── ui/               # Shared UI components
│   └── config/           # Shared configs (tailwind, tsconfig)
├── turbo.json
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 10+
- A [Supabase](https://supabase.com) project
- A [Clerk](https://clerk.com) application

### 1. Clone & Install

```bash
cd lion_social
npm install
```

### 2. Environment Variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase Postgres connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

### 3. Database Setup

Generate the Prisma client and push the schema to your Supabase database:

```bash
npm run db:generate
npm run db:push
```

### 4. Run Development Servers

Run both web and mobile in parallel:

```bash
npm run dev
```

Or run individually:

```bash
# Web only (http://localhost:3000)
cd apps/web && npm run dev

# Mobile only (Expo)
cd apps/mobile && npm run dev
```

### 5. View Database

```bash
npm run db:studio
```

## Core Features

### Post Feed
- Infinite scroll feed from followed users + explore tab
- Four post types: Workout, Meal, Quote, Story
- Like, comment, and share interactions

### Create Post
- Select post type with visual cards
- Upload images via Supabase Storage
- Add captions and tags

### User Profiles
- Avatar, bio, follower/following counts
- Instagram-style post grid
- Follow/unfollow functionality

### Explore
- Search users and posts
- Trending posts by category
- Featured creators

### Notifications
- Real-time follow, like, and comment notifications
- Unread indicators

## Design System

- **Primary**: Gold `#D4A843`
- **Background**: Near-black `#0A0A0A`
- **Dark mode first** with premium, motivational aesthetic
- Bold typography, clean spacing, subtle gold accents

## License

Private project.
