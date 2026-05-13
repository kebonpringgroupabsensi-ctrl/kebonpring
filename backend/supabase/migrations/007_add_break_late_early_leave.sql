-- Migration 007: Add is_break_late and is_early_leave columns to attendances
-- Run this in Supabase SQL Editor

-- Add column to track if employee was late returning from break
ALTER TABLE attendances
  ADD COLUMN IF NOT EXISTS is_break_late BOOLEAN DEFAULT FALSE;

-- Add column to track if employee left early (before shift end)
ALTER TABLE attendances
  ADD COLUMN IF NOT EXISTS is_early_leave BOOLEAN DEFAULT FALSE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendances_is_break_late ON attendances(is_break_late) WHERE is_break_late = TRUE;
CREATE INDEX IF NOT EXISTS idx_attendances_is_early_leave ON attendances(is_early_leave) WHERE is_early_leave = TRUE;

-- Note: The values for these columns are determined when:
-- 1. is_break_late: set to TRUE when end_break is recorded and total_break_minutes > shift.max_break_minutes
-- 2. is_early_leave: set to TRUE when check_out is recorded and check_out_time < shift.end_time
