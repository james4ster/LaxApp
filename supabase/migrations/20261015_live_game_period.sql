ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS current_period integer NOT NULL DEFAULT 1
  CHECK (current_period BETWEEN 1 AND 6);
