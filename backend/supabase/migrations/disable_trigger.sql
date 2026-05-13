-- Disable the trigger temporarily to see if auth user creation works
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
