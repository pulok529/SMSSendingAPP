# Pulse Dispatch Backend

Express + Prisma API for the Pulse Dispatch project.

## Local scripts

- `npm run dev` starts the API in watch mode
- `npm run prisma:generate` generates the Prisma client
- `npm run prisma:push` pushes the schema to the configured database
- `npm run db:seed` seeds demo data

## Docker

The root `docker-compose.yml` runs:

- `web` on port `3000`
- `api` on port `4000`
- `db` on port `5432`
- `redis` on port `6379`
