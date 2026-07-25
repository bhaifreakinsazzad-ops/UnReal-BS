-- 0006_coming_soon_interest.sql
-- Waitlist interest signal for features that are genuinely coming soon
-- (Opportunities lead-matching, Credit Center powered by CGW Systems).
-- Replaces the old PaymentsComingSoon pattern's decorative "if (email)
-- setSubmitted(true)" -- this actually persists what the user submits.

create table if not exists unreal_bs_coming_soon_interest (
  id uuid primary key default gen_random_uuid(),
  feature text not null,   -- 'opportunities' | 'credit_center'
  email text not null,
  user_id uuid references unreal_bs_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists unreal_bs_coming_soon_interest_feature_idx
  on unreal_bs_coming_soon_interest(feature);

alter table unreal_bs_coming_soon_interest enable row level security;
create policy unreal_bs_coming_soon_interest_service_all on unreal_bs_coming_soon_interest for all using (true) with check (true);
