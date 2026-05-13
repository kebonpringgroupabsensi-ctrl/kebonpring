-- =============================================
-- FIX: shift_assignments RLS policies
-- Run this in Supabase SQL Editor
-- 
-- Problem: "new row violates row-level security policy for table shift_assignments"
-- This happens because:
-- 1. The existing "Super admin can manage shift assignments" policy uses FOR ALL
--    but the separate SELECT policies may conflict with INSERT/UPDATE/DELETE
-- 2. The service role key might be misconfigured on Vercel
--
-- Solution: 
-- 1. Drop ALL existing policies on shift_assignments
-- 2. Recreate clean, non-conflicting policies
-- 3. Use SECURITY DEFINER functions to avoid recursion
-- =============================================

-- Step 1: Drop ALL existing policies on shift_assignments
DROP POLICY IF EXISTS "Employees can view own shift assignments" ON shift_assignments;
DROP POLICY IF EXISTS "Admin can view branch shift assignments" ON shift_assignments;
DROP POLICY IF EXISTS "Super admin can manage shift assignments" ON shift_assignments;
DROP POLICY IF EXISTS "Admin can manage branch shift assignments" ON shift_assignments;
DROP POLICY IF EXISTS "Super admin can insert shift assignments" ON shift_assignments;
DROP POLICY IF EXISTS "Super admin can update shift assignments" ON shift_assignments;
DROP POLICY IF EXISTS "Super admin can delete shift assignments" ON shift_assignments;

-- Step 2: Ensure helper functions exist (from previous migration)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_branch(user_id UUID)
RETURNS UUID AS $$
  SELECT branch_id FROM public.profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Helper: check if employee belongs to user's branch
CREATE OR REPLACE FUNCTION public.employee_in_branch(emp_id UUID, branch UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = emp_id AND branch_id = branch
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Step 3: Recreate clean policies

-- SELECT: Employees can view their own assignments
CREATE POLICY "sa_emp_view_own"
    ON shift_assignments FOR SELECT
    USING (employee_id = auth.uid());

-- SELECT: Admin cabang can view assignments for employees in their branch
CREATE POLICY "sa_admin_view_branch"
    ON shift_assignments FOR SELECT
    USING (
        get_user_role(auth.uid()) = 'admin_cabang'
        AND employee_in_branch(employee_id, get_user_branch(auth.uid()))
    );

-- SELECT: Super admin can view all
CREATE POLICY "sa_super_view_all"
    ON shift_assignments FOR SELECT
    USING (get_user_role(auth.uid()) = 'super_admin');

-- INSERT: Super admin can insert any
CREATE POLICY "sa_super_insert"
    ON shift_assignments FOR INSERT
    WITH CHECK (get_user_role(auth.uid()) = 'super_admin');

-- UPDATE: Super admin can update any
CREATE POLICY "sa_super_update"
    ON shift_assignments FOR UPDATE
    USING (get_user_role(auth.uid()) = 'super_admin');

-- DELETE: Super admin can delete any
CREATE POLICY "sa_super_delete"
    ON shift_assignments FOR DELETE
    USING (get_user_role(auth.uid()) = 'super_admin');

-- INSERT: Admin cabang can insert for their branch employees
CREATE POLICY "sa_admin_insert_branch"
    ON shift_assignments FOR INSERT
    WITH CHECK (
        get_user_role(auth.uid()) = 'admin_cabang'
        AND employee_in_branch(employee_id, get_user_branch(auth.uid()))
    );

-- UPDATE: Admin cabang can update for their branch employees
CREATE POLICY "sa_admin_update_branch"
    ON shift_assignments FOR UPDATE
    USING (
        get_user_role(auth.uid()) = 'admin_cabang'
        AND employee_in_branch(employee_id, get_user_branch(auth.uid()))
    );

-- DELETE: Admin cabang can delete for their branch employees
CREATE POLICY "sa_admin_delete_branch"
    ON shift_assignments FOR DELETE
    USING (
        get_user_role(auth.uid()) = 'admin_cabang'
        AND employee_in_branch(employee_id, get_user_branch(auth.uid()))
    );

-- Also fix shifts table RLS to be clean (same pattern)
DROP POLICY IF EXISTS "Everyone can view shifts" ON shifts;
DROP POLICY IF EXISTS "Super admin can manage shifts" ON shifts;

CREATE POLICY "shifts_view_all"
    ON shifts FOR SELECT
    USING (true);

CREATE POLICY "shifts_super_insert"
    ON shifts FOR INSERT
    WITH CHECK (get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "shifts_super_update"
    ON shifts FOR UPDATE
    USING (get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "shifts_super_delete"
    ON shifts FOR DELETE
    USING (get_user_role(auth.uid()) = 'super_admin');
