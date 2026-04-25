#!/bin/bash
# Load environment variables from root .env so Next.js API routes have
# server-side vars (e.g. SUPABASE_SERVICE_ROLE_KEY) at runtime.
set -a
source "$(dirname "$0")/.env"
set +a

cd "$(dirname "$0")/apps/web"
npm run dev
