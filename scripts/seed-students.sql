-- Seed demo students (password: Student@123)
INSERT INTO "Student" (student_id, full_name, department, program, email, password, role) VALUES
('20250001', 'Student 1 (IST)', 'IST', 'BSc. Business Information Systems', 'student1@university.ac.ke', '$2b$12$rr95m2ex2DlSbffweX1wPOctz7.LjlzNHwUWrLaoTGZoNy21phox2', 'student'),
('20250002', 'Student 2 (IF)', 'IF', 'BSc. Informatics', 'student2@university.ac.ke', '$2b$12$rr95m2ex2DlSbffweX1wPOctz7.LjlzNHwUWrLaoTGZoNy21phox2', 'student'),
('20250003', 'Student 3 (ETE)', 'ETE', 'BSc. Electronic and Telecommunication Engineering', 'student3@university.ac.ke', '$2b$12$rr95m2ex2DlSbffweX1wPOctz7.LjlzNHwUWrLaoTGZoNy21phox2', 'student'),
('20250004', 'Student 4 (CoSTE)', 'CoSTE', 'BSc. Computer Systems and Technology', 'student4@university.ac.ke', '$2b$12$rr95m2ex2DlSbffweX1wPOctz7.LjlzNHwUWrLaoTGZoNy21phox2', 'student'),
('20250005', 'Student 5 (CSE)', 'CSE', 'BSc. Computer Science and Engineering', 'student5@university.ac.ke', '$2b$12$rr95m2ex2DlSbffweX1wPOctz7.LjlzNHwUWrLaoTGZoNy21phox2', 'student'),
('20250006', 'Student 6 (IST)', 'IST', 'BSc. Information Science and Technology', 'student6@university.ac.ke', '$2b$12$rr95m2ex2DlSbffweX1wPOctz7.LjlzNHwUWrLaoTGZoNy21phox2', 'student'),
('20250007', 'Student 7 (IF)', 'IF', 'BSc. Applied Computing', 'student7@university.ac.ke', '$2b$12$rr95m2ex2DlSbffweX1wPOctz7.LjlzNHwUWrLaoTGZoNy21phox2', 'student'),
('20250008', 'Student 8 (ETE)', 'ETE', 'BSc. Electrical Engineering', 'student8@university.ac.ke', '$2b$12$rr95m2ex2DlSbffweX1wPOctz7.LjlzNHwUWrLaoTGZoNy21phox2', 'student'),
('20250009', 'Student 9 (CoSTE)', 'CoSTE', 'BSc. Information Technology', 'student9@university.ac.ke', '$2b$12$rr95m2ex2DlSbffweX1wPOctz7.LjlzNHwUWrLaoTGZoNy21phox2', 'student'),
('20250010', 'Student 10 (CSE)', 'CSE', 'BSc. Software Engineering', 'student10@university.ac.ke', '$2b$12$rr95m2ex2DlSbffweX1wPOctz7.LjlzNHwUWrLaoTGZoNy21phox2', 'student')
ON CONFLICT (student_id) DO NOTHING;
