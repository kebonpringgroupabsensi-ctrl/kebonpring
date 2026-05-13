-- =============================================
-- FIX: Disable RLS on API-controlled tables
-- Run this in Supabase SQL Editor
--
-- Reason:
-- Tables like shifts and shift_assignments are accessed exclusively
-- through our backend API which uses supabaseAdmin (service role).
-- All authorization (who can do what) is handled in the API middleware
-- (authorizeRole), so RLS adds no extra security but CAN cause 
-- intermittent issues with cold-start timing on Vercel serverless.
-- =============================================

-- Disable RLS on shifts table (API controls access via authorizeRole middleware)
ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;

-- Disable RLS on shift_assignments table (same reason)
ALTER TABLE shift_assignments DISABLE ROW LEVEL SECURITY;

-- Optional: also disable on other tables accessed only via API
-- These are safe because the API already enforces role-based access
ALTER TABLE branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- Note: Keep RLS ENABLED on:
-- - profiles (has direct frontend access)
-- - attendances (has direct frontend access via face scan)
-- - leaves (accessed directly)
