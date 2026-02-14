-- Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';

-- Also reload config just in case
NOTIFY pgrst, 'reload config';
