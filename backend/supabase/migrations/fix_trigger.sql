-- Update the handle_new_user function to be more resilient and handle role casting better
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email,
        CASE 
            WHEN NEW.raw_user_meta_data->>'role' = 'super_admin' THEN 'super_admin'::user_role
            WHEN NEW.raw_user_meta_data->>'role' = 'admin_cabang' THEN 'admin_cabang'::user_role
            ELSE 'karyawan'::user_role
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
