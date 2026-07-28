export const DEPARTMENTS = [
  { name: "Computer Science and Engineering", abbreviation: "CSE" },
  { name: "Electronics and Telecommunication Engineering", abbreviation: "ETE" },
  { name: "Informatics", abbreviation: "IF" },
  { name: "Information Science and Technology", abbreviation: "IST" },
  { name: "Technical Education", abbreviation: "TED" },
] as const;

export const PROGRAMS_BY_DEPT: Record<string, string[]> = {
  CSE: ["BSc. Computer Science and Engineering", "BSc. Software Engineering"],
  ETE: ["BSc. Electronic and Telecommunication Engineering", "BSc. Electrical Engineering"],
  IF: ["BSc. Informatics", "BSc. Applied Computing"],
  IST: ["BSc. Information Science and Technology", "BSc. Business Information Systems"],
  TED: ["BSc. Computer Systems and Technology", "BSc. Information Technology"],
};

export interface ClusterSeed {
  name: string;
  description: string;
  capacity: number;
  location: string;
  departmentSlots: Record<string, number>;
  staff: { name: string; email: string }[];
}

export const CLUSTER_SEED_DATA: ClusterSeed[] = [
  {
    name: "Computer Maintenance and Peripherals",
    description: "Hands-on training in computer hardware diagnostics, repair, maintenance of desktops, laptops, and peripheral devices. Covers troubleshooting methodologies and preventative maintenance.",
    capacity: 95,
    location: "Engineering Workshop Lab 1",
    departmentSlots: { CSE: 28, ETE: 2, IF: 10, IST: 55, TED: 0 },
    staff: [
      { name: "Dr. Mwangi Kamau", email: "m.kamau@university.ac.ke" },
      { name: "Eng. Sarah Otieno", email: "s.otieno@university.ac.ke" },
    ],
  },
  {
    name: "Internet of Things (IoT) & Edge AI",
    description: "Design and program embedded systems and IoT devices. Covers microcontrollers, sensors, actuators, real-time operating systems, and IoT protocols with edge AI integration.",
    capacity: 102,
    location: "Electronics and IoT Lab",
    departmentSlots: { CSE: 70, ETE: 25, IF: 2, IST: 5, TED: 0 },
    staff: [
      { name: "Dr. Kevin Mutua", email: "k.mutua@university.ac.ke" },
      { name: "Eng. Lucy Wambui", email: "l.wambui@university.ac.ke" },
    ],
  },
  {
    name: "Computer Networking and Fiber Optics",
    description: "Practical experience in network design, configuration, and management. Covers routing, switching, wireless networks, fiber optics, and telecommunications infrastructure.",
    capacity: 125,
    location: "Networking Lab Block B",
    departmentSlots: { CSE: 48, ETE: 35, IF: 2, IST: 40, TED: 0 },
    staff: [
      { name: "Prof. James Njoroge", email: "j.njoroge@university.ac.ke" },
      { name: "Mr. Peter Wanjiku", email: "p.wanjiku@university.ac.ke" },
    ],
  },
  {
    name: "Electronics Prototyping and Instrumentation",
    description: "Design, implement, and prototype electronic circuits and instrumentation systems. Covers PCB design, sensors, signal processing, and test equipment.",
    capacity: 39,
    location: "Electronics Lab",
    departmentSlots: { CSE: 2, ETE: 35, IF: 0, IST: 2, TED: 0 },
    staff: [
      { name: "Dr. Catherine Muthoni", email: "c.muthoni@university.ac.ke" },
      { name: "Ms. Faith Chebet", email: "f.chebet@university.ac.ke" },
    ],
  },
  {
    name: "Software Development",
    description: "Build real-world software applications using modern frameworks and methodologies. Covers full-stack development, agile practices, version control, and deployment.",
    capacity: 180,
    location: "Software Innovation Hub",
    departmentSlots: { CSE: 83, ETE: 2, IF: 20, IST: 75, TED: 0 },
    staff: [
      { name: "Dr. Alice Wafula", email: "a.wafula@university.ac.ke" },
      { name: "Eng. Brian Kiprono", email: "b.kiprono@university.ac.ke" },
    ],
  },
  {
    name: "Automation and Control Systems",
    description: "Learn to design and manage automated systems and control processes. Covers PLC programming, SCADA systems, industrial automation, and process control.",
    capacity: 37,
    location: "Automation Lab",
    departmentSlots: { CSE: 13, ETE: 21, IF: 0, IST: 3, TED: 0 },
    staff: [
      { name: "Prof. Henry Kiplagat", email: "h.kiplagat@university.ac.ke" },
      { name: "Mr. Tom Omondi", email: "t.omondi@university.ac.ke" },
    ],
  },
  {
    name: "Cyber Security",
    description: "Protect systems and investigate cyber incidents. Covers ethical hacking, network security, digital forensics, cryptography, and security operations center (SOC) practices.",
    capacity: 106,
    location: "Cybersecurity Operations Center",
    departmentSlots: { CSE: 33, ETE: 2, IF: 16, IST: 55, TED: 0 },
    staff: [
      { name: "Dr. Robert Kipchumba", email: "r.kipchumba@university.ac.ke" },
      { name: "Ms. Ann Nyambura", email: "a.nyambura@university.ac.ke" },
    ],
  },
  {
    name: "Multimedia and Marketing",
    description: "Create interactive multimedia content and digital marketing strategies. Covers graphic design, animation, video production, content management, and digital marketing.",
    capacity: 101,
    location: "Digital Media Studio",
    departmentSlots: { CSE: 12, ETE: 1, IF: 38, IST: 50, TED: 0 },
    staff: [
      { name: "Dr. David Ochieng", email: "d.ochieng@university.ac.ke" },
      { name: "Ms. Grace Akinyi", email: "g.akinyi@university.ac.ke" },
    ],
  },
  {
    name: "Artificial Intelligence and Signal Processing",
    description: "Apply machine learning, deep learning, data analytics, and signal processing to solve real problems. Covers Python, TensorFlow, data visualization, NLP, and computer vision.",
    capacity: 109,
    location: "AI Research Lab",
    departmentSlots: { CSE: 26, ETE: 26, IF: 3, IST: 55, TED: 0 },
    staff: [
      { name: "Dr. Ian Baraza", email: "i.baraza@university.ac.ke" },
      { name: "Eng. Mary Kemunto", email: "m.kemunto@university.ac.ke" },
    ],
  },
];
