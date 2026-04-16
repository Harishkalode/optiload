-- Auto-migration: add securements_json column to optimizations table
ALTER TABLE optimizations ADD COLUMN IF NOT EXISTS securements_json JSONB;
