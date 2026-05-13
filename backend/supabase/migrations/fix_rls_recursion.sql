-- =============================================
-- FIX: Infinite Recursion in Profiles RLS
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Create a function to check user roles without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 2. Create a function to check user branch without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_branch(user_id UUID)
RETURNS UUID AS $$
  SELECT branch_id FROM public.profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 3. Drop old recursive policies
DROP POLICY IF EXISTS "Admin can view all profiles in their branch" ON profiles;
DROP POLICY IF EXISTS "Super admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admin can update any profile" ON profiles;
DROP POLICY IF EXISTS "Super admin can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Super admin can delete profiles" ON profiles;

-- 4. Re-create policies using the security definer functions
CREATE POLICY "Admin can view all profiles in their branch"
    ON profiles FOR SELECT
    USING (
        get_user_role(auth.uid()) = 'admin_cabang'
        AND get_user_branch(auth.uid()) = branch_id
    );

CREATE POLICY "Super admin can view all profiles"
    ON profiles FOR SELECT
    USING (get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "Super admin can update any profile"
    ON profiles FOR UPDATE
    USING (get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "Super admin can insert profiles"
    ON profiles FOR INSERT
    WITH CHECK (get_user_role(auth.uid()) = 'super_admin' OR auth.uid() = id);

CREATE POLICY "Super admin can delete profiles"
    ON profiles FOR DELETE
    USING (get_user_role(auth.uid()) = 'super_admin');
