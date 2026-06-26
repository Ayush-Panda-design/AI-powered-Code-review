#!/usr/bin/env bash
set -euo pipefail

echo "Installing dependencies..."
pnpm install

if [ ! -f apps/web/.env ]; then
  echo "Creating apps/web/.env from .env.example..."
  cp apps/web/.env.example apps/web/.env
  echo "Edit apps/web/.env with your secrets before running pnpm dev"
fi

echo "Generating Prisma client..."
pnpm db:generate

echo "Done. Run: pnpm dev"
