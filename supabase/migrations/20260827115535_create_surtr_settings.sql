/*
# Create surtr_settings table for clap detection sensitivity

1. New Tables
- `surtr_settings`: single-row table storing the user's clap detection sensitivity preference
  - `id` (text, primary key, always 'singleton')
  - `sensitivity` (text, not null, default 'medium' — values: 'low', 'medium', 'high')
  - `updated_at` (timestamp)
2. Security
- Enable RLS on `surtr_settings`.
- Allow anon + authenticated full CRUD (single-tenant, no-auth app, intentionally public data).
3. Seed Data
- Insert default row with sensitivity = 'medium'.
*/

CREATE TABLE IF NOT EXISTS surtr_settings (
  id text PRIMARY KEY DEFAULT 'singleton',
  sensitivity text NOT NULL DEFAULT 'medium',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE surtr_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_settings" ON surtr_settings;
CREATE POLICY "anon_select_settings" ON surtr_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_settings" ON surtr_settings;
CREATE POLICY "anon_insert_settings" ON surtr_settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_settings" ON surtr_settings;
CREATE POLICY "anon_update_settings" ON surtr_settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO surtr_settings (id, sensitivity) VALUES ('singleton', 'medium')
  ON CONFLICT (id) DO NOTHING;