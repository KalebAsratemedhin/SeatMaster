ALTER TABLE users
    DROP COLUMN IF EXISTS first_name,
    DROP COLUMN IF EXISTS last_name,
    DROP COLUMN IF EXISTS phone,
    DROP COLUMN IF EXISTS avatar_url;
