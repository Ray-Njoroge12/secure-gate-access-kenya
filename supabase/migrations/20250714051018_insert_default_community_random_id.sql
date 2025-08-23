-- Insert a default community if it doesn't exist
INSERT INTO public.communities (id, name, address, phone)
VALUES (gen_random_uuid(), 'Default Community', 'Default Address', '+254700000000')
ON CONFLICT DO NOTHING;