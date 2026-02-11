-- Optimize Admin Saves by indexing the user_id in user_roles for faster RLS role checks
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Ensure the admin user has the admin role
-- We use a subquery to find the UUID of the admin user based on the email
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'lydia@ninaarmend.co.site'
ON CONFLICT (user_id, role) DO NOTHING;
