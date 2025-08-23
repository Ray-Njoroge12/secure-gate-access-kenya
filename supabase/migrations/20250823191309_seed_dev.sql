-- Seed community
INSERT INTO communities (name, address, phone)
VALUES ('Kileleshwa Heights', 'Kileleshwa, Nairobi', '+254700000000');

-- Seed resident (sample)
INSERT INTO residents (email, phone_encrypted, unit_number, community_id)
VALUES (
  'resident@test.com',
  '\x746573745f656e637279707465645f70686f6e65'::bytea,
  'A101',
  (SELECT id FROM communities WHERE name='Kileleshwa Heights')
);
