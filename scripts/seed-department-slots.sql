-- Seed cluster department slots based on document
-- Departments: CSE=1, ETE=2, IF=3, IST=4, TED=5
-- Clusters: Computer Maintenance and Peripherals=1, IoT & Edge AI=2, etc.

INSERT INTO "ClusterDepartment" (cluster_id, department_id, slots, enrolled) VALUES
(1, 1, 28, 0), (1, 2, 2, 0), (1, 3, 10, 0), (1, 4, 55, 0), (1, 5, 0, 0),
(2, 1, 70, 0), (2, 2, 25, 0), (2, 3, 2, 0), (2, 4, 5, 0), (2, 5, 0, 0),
(3, 1, 48, 0), (3, 2, 35, 0), (3, 3, 2, 0), (3, 4, 40, 0), (3, 5, 0, 0),
(4, 1, 2, 0), (4, 2, 35, 0), (4, 3, 0, 0), (4, 4, 2, 0), (4, 5, 0, 0),
(5, 1, 83, 0), (5, 2, 2, 0), (5, 3, 20, 0), (5, 4, 75, 0), (5, 5, 0, 0),
(6, 1, 13, 0), (6, 2, 21, 0), (6, 3, 0, 0), (6, 4, 3, 0), (6, 5, 0, 0),
(7, 1, 33, 0), (7, 2, 2, 0), (7, 3, 16, 0), (7, 4, 55, 0), (7, 5, 0, 0),
(8, 1, 12, 0), (8, 2, 1, 0), (8, 3, 38, 0), (8, 4, 50, 0), (8, 5, 0, 0),
(9, 1, 26, 0), (9, 2, 26, 0), (9, 3, 3, 0), (9, 4, 55, 0), (9, 5, 0, 0)
ON CONFLICT (cluster_id, department_id) DO NOTHING;
