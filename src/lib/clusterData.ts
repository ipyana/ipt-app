export const DEPARTMENTS = [
  { name: "Electronics and Telecommunication Engineering", abbreviation: "ETE" },
  { name: "Information Science and Technology", abbreviation: "IST" },
  { name: "Informatics", abbreviation: "IF" },
  { name: "Computer Science and Engineering", abbreviation: "CSE" },
  { name: "Computer Systems and Technology", abbreviation: "CoSTE" },
] as const;

export const PROGRAMS_BY_DEPT: Record<string, string[]> = {
  ETE: ["BSc. Electronic and Telecommunication Engineering", "BSc. Electrical Engineering"],
  IST: ["BSc. Information Science and Technology", "BSc. Business Information Systems"],
  IF: ["BSc. Informatics", "BSc. Applied Computing"],
  CSE: ["BSc. Computer Science and Engineering", "BSc. Software Engineering"],
  CoSTE: ["BSc. Computer Systems and Technology", "BSc. Information Technology"],
};

export interface ClusterSeed {
  name: string;
  description: string;
  capacity: number;
  location: string;
  programSlots: Record<string, number>;
  staff: { name: string; email: string }[];
}

export const CLUSTER_SEED_DATA: ClusterSeed[] = [
  {
    name: "Computer Maintenance and Peripherals",
    description: "Hands-on training in computer hardware diagnostics, repair, maintenance of desktops, laptops, and peripheral devices. Covers troubleshooting methodologies and preventative maintenance.",
    capacity: 144,
    location: "Engineering Workshop Lab 1",
    programSlots: {
      "BSc. Electronic and Telecommunication Engineering": 48,
      "BSc. Computer Science and Engineering": 48,
      "BSc. Computer Systems and Technology": 48,
    },
    staff: [
      { name: "Dr. Mwangi Kamau", email: "m.kamau@university.ac.ke" },
      { name: "Eng. Sarah Otieno", email: "s.otieno@university.ac.ke" },
    ],
  },
  {
    name: "Networking and Telecommunications",
    description: "Practical experience in network design, configuration, and management. Covers routing, switching, wireless networks, fiber optics, and telecommunications infrastructure.",
    capacity: 188,
    location: "Networking Lab Block B",
    programSlots: {
      "BSc. Electronic and Telecommunication Engineering": 47,
      "BSc. Information Science and Technology": 47,
      "BSc. Computer Science and Engineering": 47,
      "BSc. Computer Systems and Technology": 47,
    },
    staff: [
      { name: "Prof. James Njoroge", email: "j.njoroge@university.ac.ke" },
      { name: "Mr. Peter Wanjiku", email: "p.wanjiku@university.ac.ke" },
    ],
  },
  {
    name: "Software Development and Applications",
    description: "Build real-world software applications using modern frameworks and methodologies. Covers full-stack development, agile practices, version control, and deployment.",
    capacity: 165,
    location: "Software Innovation Hub",
    programSlots: {
      "BSc. Informatics": 55,
      "BSc. Computer Science and Engineering": 55,
      "BSc. Information Science and Technology": 55,
    },
    staff: [
      { name: "Dr. Alice Wafula", email: "a.wafula@university.ac.ke" },
      { name: "Eng. Brian Kiprono", email: "b.kiprono@university.ac.ke" },
    ],
  },
  {
    name: "Database Management Systems",
    description: "Design, implement, and administer database systems. Covers SQL, NoSQL, data modeling, performance tuning, backup and recovery strategies.",
    capacity: 140,
    location: "Data Center Lab",
    programSlots: {
      "BSc. Informatics": 35,
      "BSc. Information Science and Technology": 35,
      "BSc. Business Information Systems": 35,
      "BSc. Computer Science and Engineering": 35,
      "BSc. Computer Systems and Technology": 35,
    },
    staff: [
      { name: "Dr. Catherine Muthoni", email: "c.muthoni@university.ac.ke" },
      { name: "Ms. Faith Chebet", email: "f.chebet@university.ac.ke" },
    ],
  },
  {
    name: "Web and Multimedia Technologies",
    description: "Create interactive web applications and multimedia content. Covers frontend/backend development, UI/UX design, graphic design, animation, and content management systems.",
    capacity: 155,
    location: "Digital Media Studio",
    programSlots: {
      "BSc. Informatics": 31,
      "BSc. Information Science and Technology": 31,
      "BSc. Computer Science and Engineering": 31,
      "BSc. Electronic and Telecommunication Engineering": 31,
      "BSc. Computer Systems and Technology": 31,
    },
    staff: [
      { name: "Dr. David Ochieng", email: "d.ochieng@university.ac.ke" },
      { name: "Ms. Grace Akinyi", email: "g.akinyi@university.ac.ke" },
    ],
  },
  {
    name: "Information Systems Management",
    description: "Learn to manage IT resources in organizations. Covers IT governance, project management, business analysis, enterprise systems, and IT service management.",
    capacity: 150,
    location: "Business IT Lab",
    programSlots: {
      "BSc. Information Science and Technology": 30,
      "BSc. Business Information Systems": 40,
      "BSc. Informatics": 40,
      "BSc. Computer Systems and Technology": 40,
    },
    staff: [
      { name: "Prof. Henry Kiplagat", email: "h.kiplagat@university.ac.ke" },
      { name: "Mr. Tom Omondi", email: "t.omondi@university.ac.ke" },
    ],
  },
  {
    name: "Embedded Systems and IoT",
    description: "Design and program embedded systems and IoT devices. Covers microcontrollers, sensors, actuators, real-time operating systems, and IoT protocols.",
    capacity: 145,
    location: "Electronics and IoT Lab",
    programSlots: {
      "BSc. Electronic and Telecommunication Engineering": 49,
      "BSc. Computer Science and Engineering": 48,
      "BSc. Computer Systems and Technology": 48,
    },
    staff: [
      { name: "Dr. Kevin Mutua", email: "k.mutua@university.ac.ke" },
      { name: "Eng. Lucy Wambui", email: "l.wambui@university.ac.ke" },
    ],
  },
  {
    name: "Cybersecurity and Forensics",
    description: "Protect systems and investigate cyber incidents. Covers ethical hacking, network security, digital forensics, cryptography, and security operations center (SOC) practices.",
    capacity: 160,
    location: "Cybersecurity Operations Center",
    programSlots: {
      "BSc. Computer Science and Engineering": 40,
      "BSc. Informatics": 40,
      "BSc. Information Science and Technology": 40,
      "BSc. Electronic and Telecommunication Engineering": 40,
    },
    staff: [
      { name: "Dr. Robert Kipchumba", email: "r.kipchumba@university.ac.ke" },
      { name: "Ms. Ann Nyambura", email: "a.nyambura@university.ac.ke" },
    ],
  },
  {
    name: "Artificial Intelligence and Data Science",
    description: "Apply machine learning, deep learning, and data analytics to solve real problems. Covers Python, TensorFlow, data visualization, NLP, and computer vision.",
    capacity: 149,
    location: "AI Research Lab",
    programSlots: {
      "BSc. Computer Science and Engineering": 30,
      "BSc. Informatics": 30,
      "BSc. Information Science and Technology": 30,
      "BSc. Computer Systems and Technology": 30,
      "BSc. Electronic and Telecommunication Engineering": 29,
    },
    staff: [
      { name: "Dr. Ian Baraza", email: "i.baraza@university.ac.ke" },
      { name: "Eng. Mary Kemunto", email: "m.kemunto@university.ac.ke" },
    ],
  },
];
