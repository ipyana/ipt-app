INSERT INTO "Admin" (username, email, phone, password, role) VALUES
('emmanuel.malissa', 'Malissaemmanuel@gmail.com', '+255782536312', '$2b$12$g6kub1BXAr2O8YQuJHjJ.e5y/kPAg7yifPzCNpJ/A2Jc5WgKziSI2', 'admin'),
('benard.joseph', 'benardjosephi18@gmail.com', '+255676203734', '$2b$12$g6kub1BXAr2O8YQuJHjJ.e5y/kPAg7yifPzCNpJ/A2Jc5WgKziSI2', 'admin'),
('juma.ally', 'jeiside@gmail.com', '+255657903492', '$2b$12$g6kub1BXAr2O8YQuJHjJ.e5y/kPAg7yifPzCNpJ/A2Jc5WgKziSI2', 'admin')
ON CONFLICT (email) DO NOTHING;
