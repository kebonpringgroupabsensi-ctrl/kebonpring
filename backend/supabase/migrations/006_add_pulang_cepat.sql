-- Add 'pulang_cepat' to attendance_status and leave_type enums
-- Note: ALTER TYPE ... ADD VALUE cannot be executed inside a transaction block in some Postgres versions,
-- but Supabase migrations usually handle this.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'attendance_status' AND e.enumlabel = 'pulang_cepat') THEN
        ALTER TYPE attendance_status ADD VALUE 'pulang_cepat';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'leave_type' AND e.enumlabel = 'pulang_cepat') THEN
        ALTER TYPE leave_type ADD VALUE 'pulang_cepat';
    END IF;
END $$;
