# Supabase setup for Lemma

Create a table named `shared_projects` with this schema (Postgres):

- `id` uuid PRIMARY KEY DEFAULT gen_random_uuid()
- `project_id` text UNIQUE NOT NULL
- `payload` text NOT NULL
- `created_at` timestamptz DEFAULT now()

SQL example:

```sql
create extension if not exists pgcrypto;

create table shared_projects (
  id uuid primary key default gen_random_uuid(),
  project_id text unique not null,
  payload text not null,
  created_at timestamptz default now()
);
```

Notes:
- For production rate limiting, use a shared store (Redis) and replace the in-memory limiter in `src/app/api/shorten/route.ts`.
- Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in your environment.
