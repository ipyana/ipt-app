#!/bin/bash
# Create super admin in ipt-app production database
# The password hash is for: SuperAdmin@123 (bcrypt 12 rounds)
docker exec ipt_db psql -U postgres -d ipt_db <<'SQL'
INSERT INTO "Admin" (username, email, password, role) 
VALUES ('superadmin', 'superadmin@ipt.herpydevs.com', '$2b$12$GWTI3R9QK0NNF23cP03sauZuseMjfqvx/bwEh.bcDeoTKLWJPI8iy', 'super_admin')
ON CONFLICT (username) DO NOTHING;
SQL
echo "Done"
