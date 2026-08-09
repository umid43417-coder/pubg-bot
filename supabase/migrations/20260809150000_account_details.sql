-- PUBG akkaunt e'lonlari uchun to'liq ma'lumot (ranklar, qurollar, X-Suit, RP, UC, statistika...)
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS details jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.accounts.details IS
  'PUBG spetsifikatsiyasi: {section_id: {field_key: value}} — src/lib/pubg-spec.ts ga mos.';
