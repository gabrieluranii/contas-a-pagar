-- Migration: add_base_cat_obs_to_tvo_registros
-- Adds three optional text columns to tvo_registros for base, category, and observation.

ALTER TABLE tvo_registros
  ADD COLUMN IF NOT EXISTS base text DEFAULT '',
  ADD COLUMN IF NOT EXISTS cat  text DEFAULT '',
  ADD COLUMN IF NOT EXISTS obs  text DEFAULT '';
