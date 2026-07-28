-- Seed departments
INSERT INTO "Department" (id, name, abbreviation) VALUES
(1, 'Computer Science and Engineering', 'CSE'),
(2, 'Electronics and Telecommunication Engineering', 'ETE'),
(3, 'Informatics', 'IF'),
(4, 'Information Science and Technology', 'IST'),
(5, 'Technical Education', 'TED')
ON CONFLICT (id) DO NOTHING;

-- Seed clusters with exact names from document
INSERT INTO "Cluster" (id, name, description, capacity, location) VALUES
(1, 'Computer Maintenance and Peripherals', 'Hardware diagnostics and repair', 95, 'Engineering Workshop Lab 1'),
(2, 'Internet of Things (IoT) & Edge AI', 'IoT and edge AI systems', 102, 'Electronics and IoT Lab'),
(3, 'Computer Networking and Fiber Optics', 'Network design and fiber optics', 125, 'Networking Lab Block B'),
(4, 'Electronics Prototyping and Instrumentation', 'Electronic circuit prototyping', 39, 'Electronics Lab'),
(5, 'Software Development', 'Full-stack software development', 180, 'Software Innovation Hub'),
(6, 'Automation and Control Systems', 'Industrial automation and PLC', 37, 'Automation Lab'),
(7, 'Cyber Security', 'Security operations and forensics', 106, 'Cybersecurity Operations Center'),
(8, 'Multimedia and Marketing', 'Digital media and marketing', 101, 'Digital Media Studio'),
(9, 'Artificial Intelligence and Signal Processing', 'ML, DL and signal processing', 109, 'AI Research Lab')
ON CONFLICT (id) DO NOTHING;

-- Seed cluster department slots (cluster_id, department_id, slots, enrolled)
INSERT INTO "ClusterDepartment" (cluster_id, department_id, slots, enrolled) VALUES
(1,1,28,0),(1,2,2,0),(1,3,10,0),(1,4,55,0),(1,5,0,0),
(2,1,70,0),(2,2,25,0),(2,3,2,0),(2,4,5,0),(2,5,0,0),
(3,1,48,0),(3,2,35,0),(3,3,2,0),(3,4,40,0),(3,5,0,0),
(4,1,2,0),(4,2,35,0),(4,3,0,0),(4,4,2,0),(4,5,0,0),
(5,1,83,0),(5,2,2,0),(5,3,20,0),(5,4,75,0),(5,5,0,0),
(6,1,13,0),(6,2,21,0),(6,3,0,0),(6,4,3,0),(6,5,0,0),
(7,1,33,0),(7,2,2,0),(7,3,16,0),(7,4,55,0),(7,5,0,0),
(8,1,12,0),(8,2,1,0),(8,3,38,0),(8,4,50,0),(8,5,0,0),
(9,1,26,0),(9,2,26,0),(9,3,3,0),(9,4,55,0),(9,5,0,0)
ON CONFLICT (cluster_id, department_id) DO NOTHING;

-- Seed programs
INSERT INTO "Program" (id, name, department_id) VALUES
(1,'BSc. Computer Science and Engineering',1),(2,'BSc. Software Engineering',1),
(3,'BSc. Electronic and Telecommunication Engineering',2),(4,'BSc. Electrical Engineering',2),
(5,'BSc. Informatics',3),(6,'BSc. Applied Computing',3),
(7,'BSc. Information Science and Technology',4),(8,'BSc. Business Information Systems',4),
(9,'BSc. Computer Systems and Technology',5),(10,'BSc. Information Technology',5)
ON CONFLICT (id) DO NOTHING;

-- Seed staff
INSERT INTO "Staff" (name, email, password, role, cluster_id) VALUES
('Dr. Mwangi Kamau','m.kamau@university.ac.ke','$2b$12$GWTI3R9QK0NNF23cP03sauZuseMjfqvx/bwEh.bcDeoTKLWJPI8iy','staff',1),
('Eng. Sarah Otieno','s.otieno@university.ac.ke','$2b$12$GWTI3R9QK0NNF23cP03sauZuseMjfqvx/bwEh.bcDeoTKLWJPI8iy','staff',1),
('Dr. Kevin Mutua','k.mutua@university.ac.ke','$2b$12$GWTI3R9QK0NNF23cP03sauZuseMjfqvx/bwEh.bcDeoTKLWJPI8iy','staff',2),
('Eng. Lucy Wambui','l.wambui@university.ac.ke','$2b$12$GWTI3R9QK0NNF23cP03sauZuseMjfqvx/bwEh.bcDeoTKLWJPI8iy','staff',2),
('Prof. James Njoroge','j.njoroge@university.ac.ke','$2b$12$GWTI3R9QK0NNF23cP03sauZuseMjfqvx/bwEh.bcDeoTKLWJPI8iy','staff',3),
('Mr. Peter Wanjiku','p.wanjiku@university.ac.ke','$2b$12$GWTI3R9QK0NNF23cP03sauZuseMjfqvx/bwEh.bcDeoTKLWJPI8iy','staff',3),
('Dr. Catherine Muthoni','c.muthoni@university.ac.ke','$2b$12$GWTI3R9QK0NNF23cP03sauZuseMjfqvx/bwEh.bcDeoTKLWJPI8iy','staff',4),
('Ms. Faith Chebet','f.chebet@university.ac.ke','$2b$12$GWTI3R9QK0NNF23cP03sauZuseMjfqvx/bwEh.bcDeoTKLWJPI8iy','staff',4),
('Dr. Alice Wafula','a.wafula@university.ac.ke','$2b$12$GWTI3R9QK0NNF23cP03sauZuseMjfqvx/bwEh.bcDeoTKLWJPI8iy','staff',5),
('Eng. Brian Kiprono','b.kiprono@university.ac.ke','$2b$12$GWTI3R9QK0NNF23cP03sauZuseMjfqvx/bwEh.bcDeoTKLWJPI8iy','staff',5),
('Prof. Henry Kiplagat','h.kiplagat@university.ac.ke','$2b$12$GWTI3R9QK0NNF23cP03sauZuseMjfqvx/bwEh.bcDeoTKLWJPI8iy','staff',6),
('Mr. Tom Omondi','t.omondi@university.ac.ke','$2b$12$GWTI3R9QK0NNF23cP03sauZuseMjfqvx/bwEh.bcDeoTKLWJPI8iy','staff',6),
('Dr. Robert Kipchumba','r.kipchumba@university.ac.ke','$2b$12$GWTI3R9QK0NNF23cP03sauZuseMjfqvx/bwEh.bcDeoTKLWJPI8iy','staff',7),
('Ms. Ann Nyambura','a.nyambura@university.ac.ke','$2b$12$GWTI3R9QK0NNF23cP03sauZuseMjfqvx/bwEh.bcDeoTKLWJPI8iy','staff',7),
('Dr. David Ochieng','d.ochieng@university.ac.ke','$2b$12$GWTI3R9QK0NNF23cP03sauZuseMjfqvx/bwEh.bcDeoTKLWJPI8iy','staff',8),
('Ms. Grace Akinyi','g.akinyi@university.ac.ke','$2b$12$GWTI3R9QK0NNF23cP03sauZuseMjfqvx/bwEh.bcDeoTKLWJPI8iy','staff',8),
('Dr. Ian Baraza','i.baraza@university.ac.ke','$2b$12$GWTI3R9QK0NNF23cP03sauZuseMjfqvx/bwEh.bcDeoTKLWJPI8iy','staff',9),
('Eng. Mary Kemunto','m.kemunto@university.ac.ke','$2b$12$GWTI3R9QK0NNF23cP03sauZuseMjfqvx/bwEh.bcDeoTKLWJPI8iy','staff',9)
ON CONFLICT (email) DO NOTHING;
