-- Update user 'admin@anatomia.co' to Super Admin and set name
UPDATE users
SET 
  role = 'super_admin',
  first_name = 'Anatomia',
  last_name = 'Healthcare'
WHERE email = 'admin@anatomia.co';
