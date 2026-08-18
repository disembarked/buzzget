# BuzzGet — Supabase backend setup

The app runs in **local-only mode** until you add Supabase keys. Once configured, it
uses **Supabase Auth** for accounts + passwords (passwords are hashed by Supabase in
`auth.users` — the app never sees or stores them) and **Postgres** for each user's
profile, transactions, and presets, protected by **row-level security** so users can
only read/write their own rows.

## 1. Create the project
1. https://supabase.com → **New project**. Name it `buzzget`, set a DB password, wait ~2 min.
2. **Project Settings → API**, copy **Project URL** and the **anon public** key.
3. Copy `.env.local.example` to `.env.local` and paste them in:
   ```
   VITE_SUPABASE_URL=https://YOURPROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...
   ```
   `.env.local` is gitignored — never commit it. Restart `npm run dev` after creating it.

## 2. Schema — run in Supabase → SQL Editor
```sql
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  total       numeric(10,2) not null default 0,
  start_date  date,
  end_date    date,
  sem_name    text,
  created_at  timestamptz not null default now()
);

create table public.transactions (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users(id) on delete cascade,
  type     text not null check (type in ('spend','add')),
  amount   numeric(10,2) not null check (amount > 0),
  note     text not null default '',
  date     date not null,
  ts       timestamptz not null default now()
);
create index transactions_user_date_idx on public.transactions (user_id, date);

create table public.presets (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users(id) on delete cascade,
  name     text not null,
  amount   numeric(10,2) not null check (amount > 0)
);
```

## 3. Row-level security — run next
```sql
alter table public.profiles     enable row level security;
alter table public.transactions enable row level security;
alter table public.presets      enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id)      with check (auth.uid() = id);
create policy "own tx" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own presets" on public.presets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- auto-create a profile row when someone signs up
create function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```
(The app seeds the four default meal presets automatically the first time a new account signs in.)

## 4. Auth settings
- **Authentication → Providers → Email** is on by default — email + password works immediately.
- For quick local testing, **Authentication → Sign In / Providers → Email → turn off "Confirm email"**
  so new accounts can sign in without clicking a confirmation link. (Leave it on for production.)
- **Google (optional):** enable the Google provider and paste an OAuth client ID/secret from
  Google Cloud, then add `https://YOURPROJECT.supabase.co/auth/v1/callback` as an authorized
  redirect URI. The "Continue with Google" button only appears once Supabase is configured.
- **Restrict to a school domain (optional):** `src/lib/auth.ts` exports `enforceDomain('gatech.edu')`
  — call it after sign-in to sign out anyone off-domain. It's off by default so any email works.

## 5. Deploy (Vercel)
Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Vercel project's Environment
Variables, add your deployed URL under Supabase **Authentication → URL Configuration**, and redeploy.

---
**Files:** `src/lib/supabase.ts` (client), `src/lib/auth.ts` (sign-in/up/out), `src/lib/db.ts`
(typed CRUD), `src/app/useStore.ts` (unifies local + cloud behind one API). Switching modes is
automatic based on whether the env keys are present.
