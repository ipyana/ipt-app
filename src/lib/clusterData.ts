export const DEPARTMENTS = [
  { name: "Computer Science and Engineering", abbreviation: "CSE" },
  { name: "Electronics and Telecommunication Engineering", abbreviation: "ETE" },
  { name: "Informatics", abbreviation: "IF" },
  { name: "Information Science and Technology", abbreviation: "IST" },
  { name: "Technical Education", abbreviation: "TED" },
] as const;

export const PROGRAMS_BY_DEPT: Record<string, string[]> = {
  CSE: [
    "Diploma in Computer Science",
    "Diploma in Computer Engineering",
    "Bachelor of Computer Engineering and Technology",
    "Bachelor of Computer Science",
    "Bachelor of Engineering in Data Science",
  ],
  ETE: [
    "Diploma in Electronics and Telecommunication Engineering",
    "Bachelor of Science in Information and Communication Technology",
    "Bachelor of Science in Electronics and Automation Engineering",
  ],
  IF: [
    "Bachelor of Applied Informatics in Industrial Automation",
    "Bachelor of Applied Informatics in Marketing",
  ],
  IST: [
    "Diploma in Information and Communication Technology",
    "Bachelor of Science in Information and Computer Network",
    "Bachelor of Information and Communication Technology",
  ],
  TED: [
    "Bachelor of Technical Education in Computer Science",
    "Bachelor of Technical Education in Telecommunication Engineering",
  ],
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
    capacity: 115,
    location: "Engineering Workshop Lab 1",
    departmentSlots: { CSE: 28, ETE: 2, IF: 10, IST: 55, TED: 20 },
    staff: [
      { name: "Enlai Watson", email: "enlai.watson@university.ac.ke" },
      { name: "Antony Chaula", email: "antony.chaula@university.ac.ke" },
      { name: "G. Kayombo", email: "g.kayombo@university.ac.ke" },
      { name: "Ally S. Sikoro", email: "ally.sikoro@university.ac.ke" },
    ],
  },
  {
    name: "Internet of Things (IoT) & Edge AI",
    description: "Design and program embedded systems and IoT devices. Covers microcontrollers, sensors, actuators, real-time operating systems, and IoT protocols with edge AI integration.",
    capacity: 115,
    location: "Electronics and IoT Lab",
    departmentSlots: { CSE: 70, ETE: 25, IF: 2, IST: 5, TED: 13 },
    staff: [
      { name: "Ipyana Mwaisekwa", email: "ipyana.mwaisekwa@university.ac.ke" },
      { name: "Phocas Sebastian", email: "phocas.sebastian@university.ac.ke" },
      { name: "Mwakalapuka", email: "mwakalapuka@university.ac.ke" },
      { name: "Beatrace Mayowela", email: "beatrace.mayowela@university.ac.ke" },
    ],
  },
  {
    name: "Computer Networking and Fiber Optics",
    description: "Practical experience in network design, configuration, and management. Covers routing, switching, wireless networks, fiber optics, and telecommunications infrastructure.",
    capacity: 148,
    location: "Networking Lab Block B",
    departmentSlots: { CSE: 48, ETE: 35, IF: 2, IST: 40, TED: 23 },
    staff: [
      { name: "Ibrahim Frank", email: "ibrahim.frank@university.ac.ke" },
      { name: "William Moshi", email: "william.moshi@university.ac.ke" },
      { name: "James Machibya", email: "james.machibya@university.ac.ke" },
      { name: "Rachel Mtali", email: "rachel.mtali@university.ac.ke" },
    ],
  },
  {
    name: "Electronics Prototyping and Automation",
    description: "Design and prototype electronic circuits, instrumentation systems, and automated control processes. Covers PCB design, sensors, signal processing, PLC programming, and industrial automation.",
    capacity: 76,
    location: "Electronics and Automation Lab",
    departmentSlots: { CSE: 15, ETE: 56, IF: 0, IST: 5, TED: 0 },
    staff: [
      { name: "Candida Mwisomba", email: "candida.mwisomba@university.ac.ke" },
      { name: "Daniel Msilanga", email: "daniel.msilanga@university.ac.ke" },
      { name: "Shela Mjini", email: "shela.mjini@university.ac.ke" },
      { name: "Monte Kayoka", email: "monte.kayoka@university.ac.ke" },
    ],
  },
  {
    name: "Software Development",
    description: "Build real-world software applications using modern frameworks and methodologies. Covers full-stack development, agile practices, version control, and deployment.",
    capacity: 218,
    location: "Software Innovation Hub",
    departmentSlots: { CSE: 83, ETE: 2, IF: 20, IST: 75, TED: 38 },
    staff: [
      { name: "Edwin Nchia", email: "edwin.nchia@university.ac.ke" },
      { name: "Aman Sanga", email: "aman.sanga@university.ac.ke" },
      { name: "Deogratius Rugemalila", email: "deogratius.rugemalila@university.ac.ke" },
      { name: "Libearatus Sago", email: "libearatus.sago@university.ac.ke" },
    ],
  },
  {
    name: "Cyber Security",
    description: "Protect systems and investigate cyber incidents. Covers ethical hacking, network security, digital forensics, cryptography, and security operations center (SOC) practices.",
    capacity: 126,
    location: "Cybersecurity Operations Center",
    departmentSlots: { CSE: 33, ETE: 2, IF: 16, IST: 55, TED: 20 },
    staff: [
      { name: "Tumain Mbinda", email: "tumain.mbinda@university.ac.ke" },
      { name: "Aman Rukoijo", email: "aman.rukoijo@university.ac.ke" },
      { name: "Alexander Richard", email: "alexander.richard@university.ac.ke" },
      { name: "Faraja Sikawa", email: "faraja.sikawa@university.ac.ke" },
    ],
  },
  {
    name: "Multimedia and Marketing",
    description: "Create interactive multimedia content and digital marketing strategies. Covers graphic design, animation, video production, content management, and digital marketing.",
    capacity: 113,
    location: "Digital Media Studio",
    departmentSlots: { CSE: 12, ETE: 1, IF: 38, IST: 50, TED: 12 },
    staff: [
      { name: "David Mwakifuna", email: "david.mwakifuna@university.ac.ke" },
      { name: "Robert Mtowe", email: "robert.mtowe@university.ac.ke" },
      { name: "Namsemba Mzava", email: "namsemba.mzava@university.ac.ke" },
      { name: "Wycliff Dutu", email: "wycliff.dutu@university.ac.ke" },
    ],
  },
  {
    name: "Artificial Intelligence and Signal Processing",
    description: "Apply machine learning, deep learning, data analytics, and signal processing to solve real problems. Covers Python, TensorFlow, data visualization, NLP, and computer vision.",
    capacity: 129,
    location: "AI Research Lab",
    departmentSlots: { CSE: 26, ETE: 26, IF: 3, IST: 55, TED: 20 },
    staff: [
      { name: "Tony Chaula", email: "tony.chaula@university.ac.ke" },
      { name: "Jofrey", email: "jofrey@university.ac.ke" },
      { name: "Abel Mbogo", email: "abel.mbogo@university.ac.ke" },
      { name: "Joseph Banzi", email: "joseph.banzi@university.ac.ke" },
    ],
  },
];
