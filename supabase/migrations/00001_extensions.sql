-- ============================================================
-- Bike Bin – Complete Database Schema
-- Initial schema split by domain; apply migrations in filename order.
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
-- Schema `extensions` is created by Supabase before migrations (avoid CREATE SCHEMA here — it duplicates and emits NOTICE 42P06).

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

