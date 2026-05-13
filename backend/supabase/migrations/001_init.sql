-- =============================================
-- WARUNG REQUEST - Employee Attendance App
-- Supabase Database Schema Initialization
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 1. ENUM TYPES
-- =============================================

CREATE TYPE user_role AS ENUM ('super_admin', 'admin_cabang', 'karyawan');
CREATE TYPE employment_status AS ENUM ('tetap', 'kontrak');
CREATE TYPE employee_status AS ENUM ('aktif', 'non_aktif', 'cuti');
CREATE TYPE branch_status AS ENUM ('aktif', 'non_aktif');
CREATE TYPE shift_type AS ENUM ('full_time', 'pagi', 'malam');
CREATE TYPE attendance_status AS ENUM ('hadir', 'terlambat', 'izin', 'sakit', 'alpa');
CREATE TYPE attendance_action AS ENUM ('check_in', 'start_break', 'end_break', 'check_out');
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE leave_type AS ENUM ('izin', 'sakit', 'cuti_tahunan', 'cuti_khusus', 'lainnya');

-- =============================================
-- 2. TABLES
-- =============================================

-- ----------------------------------------
-- 2.1 Branches (Cabang)
-- ----------------------------------------
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    radius_meters INTEGER DEFAULT 50,
    admin_name VARCHAR(100),
    status branch_status DEFAULT 'aktif',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------
-- 2.2 Profiles (User accounts & employee data)
-- Links to Supabase Auth (auth.users)
-- ----------------------------------------
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    nik VARCHAR(50) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role user_role DEFAULT 'karyawan',
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    position VARCHAR(50),
    employment_status employment_status DEFAULT 'kontrak',
    employee_status employee_status DEFAULT 'aktif',
    avatar_url TEXT,
    face_descriptor JSONB,
    face_registered BOOLEAN DEFAULT FALSE,
    join_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------
-- 2.3 Shifts
-- ----------------------------------------
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    shift_type shift_type NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_start TIME,
    break_end TIME,
    late_tolerance_minutes INTEGER DEFAULT 15,
    max_break_minutes INTEGER DEFAULT 60,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------
-- 2.4 Employee Shift Assignments
-- Maps employees to shifts on specific dates
-- ----------------------------------------
CREATE TABLE shift_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, date)
);

-- ----------------------------------------
-- 2.5 Attendance Records
-- ----------------------------------------
CREATE TABLE attendances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status attendance_status DEFAULT 'hadir',
    check_in_time TIMESTAMPTZ,
    check_in_latitude DOUBLE PRECISION,
    check_in_longitude DOUBLE PRECISION,
    check_in_face_verified BOOLEAN DEFAULT FALSE,
    start_break_time TIMESTAMPTZ,
    end_break_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    check_out_latitude DOUBLE PRECISION,
    check_out_longitude DOUBLE PRECISION,
    check_out_face_verified BOOLEAN DEFAULT FALSE,
    is_late BOOLEAN DEFAULT FALSE,
    late_minutes INTEGER DEFAULT 0,
    total_work_minutes INTEGER DEFAULT 0,
    total_break_minutes INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, date)
);

-- ----------------------------------------
-- 2.6 Leave Requests (Izin / Sakit / Cuti)
-- ----------------------------------------
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    leave_type leave_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    attachment_url TEXT,
    status leave_status DEFAULT 'pending',
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------
-- 2.7 Announcements (Pengumuman)
-- ----------------------------------------
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    is_global BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------
-- 2.8 App Settings (Pengaturan Sistem)
-- ----------------------------------------
CREATE TABLE app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. INDEXES for Performance
-- =============================================

CREATE INDEX idx_profiles_branch ON profiles(branch_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_nik ON profiles(nik);

CREATE INDEX idx_shift_assignments_employee ON shift_assignments(employee_id);
CREATE INDEX idx_shift_assignments_date ON shift_assignments(date);

CREATE INDEX idx_attendances_employee ON attendances(employee_id);
CREATE INDEX idx_attendances_date ON attendances(date);
CREATE INDEX idx_attendances_branch ON attendances(branch_id);
CREATE INDEX idx_attendances_status ON attendances(status);

CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);

CREATE INDEX idx_announcements_branch ON announcements(branch_id);
CREATE INDEX idx_announcements_active ON announcements(is_active);

-- =============================================
-- 4. AUTO-UPDATE TIMESTAMPS TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_branches_updated_at
    BEFORE UPDATE ON branches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_shifts_updated_at
    BEFORE UPDATE ON shifts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_attendances_updated_at
    BEFORE UPDATE ON attendances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_leave_requests_updated_at
    BEFORE UPDATE ON leave_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- 5. AUTO-CREATE PROFILE ON AUTH SIGNUP
-- =============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email,
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'karyawan')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Admin can view all profiles in their branch"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'admin_cabang'
            AND p.branch_id = profiles.branch_id
        )
    );

CREATE POLICY "Super admin can view all profiles"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'super_admin'
        )
    );

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Super admin can update any profile"
    ON profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'super_admin'
        )
    );

CREATE POLICY "Super admin can insert profiles"
    ON profiles FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'super_admin'
        )
        OR auth.uid() = id
    );

CREATE POLICY "Super admin can delete profiles"
    ON profiles FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'super_admin'
        )
    );

-- BRANCHES POLICIES
CREATE POLICY "Everyone can view active branches"
    ON branches FOR SELECT
    USING (true);

CREATE POLICY "Super admin can manage branches"
    ON branches FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'super_admin'
        )
    );

-- SHIFTS POLICIES
CREATE POLICY "Everyone can view shifts"
    ON shifts FOR SELECT
    USING (true);

CREATE POLICY "Super admin can manage shifts"
    ON shifts FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'super_admin'
        )
    );

-- SHIFT ASSIGNMENTS POLICIES
CREATE POLICY "Employees can view own shift assignments"
    ON shift_assignments FOR SELECT
    USING (employee_id = auth.uid());

CREATE POLICY "Admin can view branch shift assignments"
    ON shift_assignments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles admin_p
            JOIN profiles emp_p ON emp_p.id = shift_assignments.employee_id
            WHERE admin_p.id = auth.uid()
            AND admin_p.role IN ('admin_cabang', 'super_admin')
            AND (admin_p.role = 'super_admin' OR admin_p.branch_id = emp_p.branch_id)
        )
    );

CREATE POLICY "Super admin can manage shift assignments"
    ON shift_assignments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'super_admin'
        )
    );

-- ATTENDANCES POLICIES
CREATE POLICY "Employees can view own attendance"
    ON attendances FOR SELECT
    USING (employee_id = auth.uid());

CREATE POLICY "Employees can insert own attendance"
    ON attendances FOR INSERT
    WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Employees can update own attendance"
    ON attendances FOR UPDATE
    USING (employee_id = auth.uid());

CREATE POLICY "Admin can view branch attendances"
    ON attendances FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin_cabang', 'super_admin')
            AND (p.role = 'super_admin' OR p.branch_id = attendances.branch_id)
        )
    );

CREATE POLICY "Super admin can manage all attendances"
    ON attendances FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'super_admin'
        )
    );

-- LEAVE REQUESTS POLICIES
CREATE POLICY "Employees can view own leave requests"
    ON leave_requests FOR SELECT
    USING (employee_id = auth.uid());

CREATE POLICY "Employees can insert own leave requests"
    ON leave_requests FOR INSERT
    WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Admin can view branch leave requests"
    ON leave_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles admin_p
            JOIN profiles emp_p ON emp_p.id = leave_requests.employee_id
            WHERE admin_p.id = auth.uid()
            AND admin_p.role IN ('admin_cabang', 'super_admin')
            AND (admin_p.role = 'super_admin' OR admin_p.branch_id = emp_p.branch_id)
        )
    );

CREATE POLICY "Admin can update leave requests"
    ON leave_requests FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin_cabang', 'super_admin')
        )
    );

-- ANNOUNCEMENTS POLICIES
CREATE POLICY "Everyone can view active announcements"
    ON announcements FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admin can manage announcements"
    ON announcements FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin_cabang', 'super_admin')
        )
    );

-- APP SETTINGS POLICIES
CREATE POLICY "Everyone can view settings"
    ON app_settings FOR SELECT
    USING (true);

CREATE POLICY "Super admin can manage settings"
    ON app_settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'super_admin'
        )
    );

-- =============================================
-- 7. SEED DATA (Default shifts & settings)
-- =============================================

-- Default Shifts
INSERT INTO shifts (name, shift_type, start_time, end_time, break_start, break_end, late_tolerance_minutes, max_break_minutes) VALUES
    ('Full Time', 'full_time', '07:00', '17:00', '12:00', '13:00', 15, 60),
    ('Shift Pagi', 'pagi', '07:00', '15:00', NULL, NULL, 15, 30),
    ('Shift Malam', 'malam', '15:00', '23:00', NULL, NULL, 15, 30);

-- Default App Settings
INSERT INTO app_settings (key, value, description) VALUES
    ('app_name', '"Warung Request App"', 'Nama aplikasi yang tampil di header'),
    ('max_radius_meters', '50', 'Radius maksimal untuk absensi (meter)'),
    ('face_recognition_required', 'true', 'Wajibkan scan wajah untuk absensi'),
    ('mock_location_detection', 'true', 'Deteksi fake GPS / mock location'),
    ('late_tolerance_minutes', '15', 'Toleransi keterlambatan default (menit)'),
    ('notification_email', '"noreply@warungrequest.com"', 'Email untuk notifikasi sistem');

-- =============================================
-- 8. STORAGE BUCKETS (run in Supabase Dashboard)
-- =============================================
-- Note: Storage buckets must be created via Supabase Dashboard or API
-- Required buckets:
--   1. 'avatars' - Profile photos
--   2. 'face-data' - Face recognition reference images
--   3. 'leave-attachments' - Leave request attachments (surat dokter, etc)
--   4. 'app-assets' - App logos and assets

-- Create storage bucket policies (these need to be run after creating buckets)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('face-data', 'face-data', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('leave-attachments', 'leave-attachments', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('app-assets', 'app-assets', true);
