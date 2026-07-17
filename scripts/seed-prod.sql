-- Seed production database with essential data
-- Super admin (password: SuperAdmin@123 - bcrypt hash)
INSERT INTO "Admin" (username, email, password, role) VALUES
('superadmin', 'superadmin@ipt.herpydevs.com', '$2b$12$GWTI3R9QK0NNF23cP03sauZuseMjfqvx/bwEh.bcDeoTKLWJPI8iy', 'super_admin'),
('admin', 'admin@ipt.herpydevs.com', '$2b$12$g6kub1BXAr2O8YQuJHjJ.e5y/kPAg7yifPzCNpJ/A2Jc5WgKziSI2', 'admin'),
('coordinator', 'coordinator@ipt.herpydevs.com', '$2b$12$g6kub1BXAr2O8YQuJHjJ.e5y/kPAg7yifPzCNpJ/A2Jc5WgKziSI2', 'coordinator')
ON CONFLICT (username) DO NOTHING;
