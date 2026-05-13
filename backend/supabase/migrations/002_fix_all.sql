-- =============================================
-- COMPLETE FIX: Trigger, RLS, and Auth
-- Run this ONCE in Supabase SQL Editor
-- =============================================

-- 1. Drop old trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Recreate a safe trigger function with error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        COALESCE(NEW.email, ''),
        CASE 
            WHEN NEW.raw_user_meta_data->>'role' = 'super_admin' THEN 'super_admin'::user_role
            WHEN NEW.raw_user_meta_data->>'role' = 'admin_cabang' THEN 'admin_cabang'::user_role
            ELSE 'karyawan'::user_role
        END
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'handle_new_user failed for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Recreate trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Clean up any orphaned profiles (emails without auth users)
DELETE FROM public.profiles WHERE id NOT IN (SELECT id FROM auth.users);

-- 5. Also fix the RLS helper functions in case they weren't created
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_branch(user_id UUID)
RETURNS UUID AS $$
  SELECT branch_id FROM public.profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;
