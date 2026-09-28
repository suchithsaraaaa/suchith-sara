// Single source of truth for every fact the film states.
// Nothing on screen may come from anywhere else. Missing facts stay null
// and the UI omits them rather than inventing a value.

export const person = {
  name: 'Suchith Sara',
  roles: ['AI Engineer', 'Systems Builder'],
  location: 'Hyderabad / India',
  coordinates: '17.385° N  78.487° E',
  education: {
    degree: 'B.Tech, Computer Science & Information Technology',
    short: 'B.Tech CSIT',
    school: 'CMR Technical Campus',
    city: 'Hyderabad',
    years: '2023–2027',
  },
  site: 'https://suchithsara.com',
  // From the resume and GitHub profile.
  summary: 'Python developer with 7+ months of internship experience in backend engineering and applied AI.',
};

export type Role = {
  title: string;
  org: string;
  dates: string;
  scene: SceneId | null; // the scene a role surfaces in, if any
  notes?: string[];      // supplied facts only (resume, GitHub)
};

export const experience: Role[] = [
  { title: 'Technical Engineer Intern', org: 'Telangana Police IT Cell', dates: 'Sep 2026–Present', scene: 'real-world' },
  {
    title: 'AI/ML and Full Stack Intern', org: 'Telangana Police IT Cell', dates: 'May–Jun 2026', scene: 'intelligence',
    notes: [
      'Architected an on-premises retrieval-augmented generation system for internal government use: LLM selection, infrastructure sizing and deployment planning.',
      'Two-tier LLM architecture, Llama 3.1 8B and Llama 3.3 70B with AWQ INT4 quantisation, served through vLLM across 6 NVIDIA A100 80GB GPUs.',
      'Multilingual retrieval across English, Telugu and Hindi with BGE-M3 embeddings and Qdrant.',
      'Automated bulk processing and AI enrichment of information memo PDFs with the Anthropic API.',
      'Prepared a 5-year total cost of ownership analysis: on-premises against public and private cloud.',
    ],
  },
  {
    title: 'Python Developer Intern', org: 'Meta SciFor Technologies', dates: 'Feb–Sep 2025', scene: 'systems',
    notes: [
      '20+ secure REST APIs with OAuth2, in Django and Flask.',
      'Database query performance and storage efficiency improved by 40%.',
      '7+ workflows automated with webhooks and third-party integrations.',
      'Worked across 3 cross-functional teams on backend systems and CI/CD pipelines.',
    ],
  },
  {
    title: 'Cloud Virtual Internship', org: 'AWS Academy', dates: 'Oct–Dec 2024', scene: null,
    notes: ['AWS Academy Cloud Architecting and Cloud Foundations certifications.'],
  },
  {
    title: 'Google Campus Ambassador', org: 'Google, CMR Technical Campus', dates: 'Jul–Dec 2025', scene: null,
    notes: ['1,000+ students engaged; 10+ technical events organised; participation up 35%.'],
  },
  {
    title: 'Treasurer and Core Committee Member', org: 'Lexis Club, CMR Technical Campus', dates: 'Jan 2024–Jul 2026', scene: null,
    notes: ['Budgeting, sponsorships and planning for 15+ workshops and seminars.'],
  },
];

export const recognition = ['National Hackathon Finalist', 'Google Campus Ambassador', 'Treasurer, Lexis Club'];

export const certifications = [
  'AWS Academy Cloud Architecting', 'AWS Academy Cloud Foundations', 'ServiceNow CSA', 'ServiceNow CAD',
  'DLT and Hedera Network', 'Generative AI Tools', 'Scrum Bootcamp',
];

export const skills: [string, string[]][] = [
  ['Languages', ['Python', 'SQL', 'TypeScript', 'JavaScript']],
  ['AI and ML', ['Machine learning', 'Deep learning', 'NLP', 'LLMs', 'Generative AI', 'RAG', 'Computer vision', 'OpenCV']],
  ['Frameworks', ['Django', 'Django REST Framework', 'Flask', 'FastAPI', 'React', 'Next.js', 'Streamlit', 'pandas', 'NumPy', 'scikit-learn', 'XGBoost']],
  ['Data', ['PostgreSQL', 'MongoDB', 'SQLite', 'Qdrant']],
  ['Cloud and DevOps', ['AWS EC2', 'S3', 'IAM', 'Docker', 'Git', 'Linux', 'Nginx', 'Gunicorn']],
  ['AI infrastructure', ['Llama 3.1', 'Llama 3.3', 'BGE-M3', 'vLLM', 'Anthropic API']],
];

export const aiStack = {
  pipeline: ['Documents', 'BGE-M3', 'Embeddings', 'Qdrant', 'vLLM'],
  models: ['Llama 3.1 8B', 'Llama 3.3 70B'],
  quantisation: 'AWQ INT4',
  languages: 'English / Telugu / Hindi',
  hardware: '6 × A100 80GB',
  deployment: 'On-premises',
};

export const softwareStack = {
  flow: ['Request', 'REST API', 'Django / Flask', 'Python', 'Queue / Worker', 'PostgreSQL', 'AWS', 'React / Next.js'],
  languages: ['Python', 'TypeScript', 'JavaScript'],
};

// Supplied figures only. Do not add to this object without a source.
export const mapStory = {
  title: 'The night the map went live',
  occasion: 'Ganesh Chaturthi',
  city: 'Hyderabad',
  client: 'Telangana Police IT Cell',
  purpose: 'Live visarjan monitoring',
  requirement: 4000,
  detents: [4000, 4031, 4087, 4126, 4181, 4200],
  held: 4200,
  idols: '14,900+',
  idolPoints: 14900,
  stations: 72,
  journey: ['GPS', 'Backend', 'Database', 'Live update', 'Command view'],
  journeyStates: ['Live journey', 'Current position', 'Route history', 'Completed journey'],
  caption: 'Artistic visualisation. Not operational data or footage.',
};

export const resqmesh = {
  name: 'ResQMesh',
  tagline: 'Offline-first AI',
  inspiration: 'Inspired by the Nepal flash floods',
  honesty: 'An engineering project inspired by the problem. Not deployed in any response.',
  pipeline: ['Local data', 'Document processing', 'Embeddings', 'Vector retrieval', 'LLM', 'Intelligence'],
  capabilities: ['Offline-first AI', 'On-device RAG', 'Incident correlation', 'AI-assisted triage', 'Offline geospatial capabilities'],
  // From the resume and the project README.
  mesh: ['Peer-to-peer mesh', 'UDP + mDNS discovery', 'Up to 5 hops', 'Packet caching', 'Link quality metrics'],
  sop: 'On-device SOP engine: 17 protocols from NDMA, WHO, IFRC and INSARAG',
  stack: ['FastAPI', 'SQLite', 'Electron', 'React'],
  zeroCloud: 'No cloud infrastructure. No external APIs.',
  link: 'https://res-q-mesh-cinematic-website--suchithssara.replit.app/',
  demoCaption: 'Demonstration data. Not real incidents.',
};

// The main projects are told as scenes: the live Ganesh tracking system (05),
// ResQMesh (06) and NestIQ (07).
export const nestiq = {
  name: 'NestIQ',
  tagline: 'Intelligent real estate forecasting',
  what: 'Property valuation with a 5-year forecast, across 7 global regions.',
  why: 'It prices the place, not just the building: crime, accessibility, traffic and amenities shape the forecast.',
  layers: ['Crime index', 'Accessibility', 'Traffic', 'Amenities within 1.5 km'],
  model: 'Random Forest + economic heuristics',
  stack: ['Django REST', 'Random Forest', 'OSMnx', 'Shapely', 'Geopy', 'React', 'AWS EC2', 'Nginx'],
  link: 'https://github.com/suchithsaraaaa/integrated_predictor',
};

export const contact = {
  github: 'https://github.com/suchithsaraaaa',
  email: 'suchithsara.work@gmail.com',
  linkedin: 'https://www.linkedin.com/in/suchith-sara-903133339/',
  // Served from this site (public/); override with NEXT_PUBLIC_RESUME_URL.
  resume: process.env.NEXT_PUBLIC_RESUME_URL || '/Suchith_Sara_Resume.pdf',
};

/** Opens a new message to the contact address in Gmail. */
export const gmailCompose = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contact.email)}`;

// ---- Film structure --------------------------------------------------------

export type SceneId =
  | 'origin' | 'intelligence' | 'systems' | 'real-world'
  | 'the-map' | 'resqmesh' | 'nestiq' | 'contact';

export type Scene = {
  id: SceneId;
  n: string;       // "01"
  label: string;   // HUD label
  title: string;   // readable title
  t0: number;      // film seconds
  t1: number;
  // Scroll distance in viewport heights, optionally split into sub-segments
  // [filmSeconds, vh] so dwell zones get more scroll per second.
  segments: [number, number][];
  beats: number[]; // film times keyboard stepping stops at
};

export const RUNTIME = 90;

// Stretches of film time played slower so they can be read: [from, to, rate].
// 0.4 means 1 film second takes 2.5 real seconds. See lib/timeline.ts.
export const warp: [number, number, number][] = [
  [16.0, 18.4, 0.34],  // 02 · experience in the spotlight
  [24.5, 28.3, 0.3],   // 03 · SYSTEMS, then experience in the spotlight
  [60.5, 68.2, 0.45],  // 05 · the journey, the scale, one live system
  [68.2, 69.2, 0.26],  // 05 · it was the operation
  [69.2, 70, 0.13],    // 05 · the role, in the spotlight
  [70, 78, 0.42],      // 06 · ResQMesh
  [78, 84, 0.55],      // 07 · NestIQ
  [84, 90, 0.8],       // 08 · Contact
];

export const scenes: Scene[] = [
  { id: 'origin', n: '01', label: 'Origin', title: 'Origin', t0: 0, t1: 8, segments: [[5.6, 40], [2.4, 120]], beats: [5.6, 6.8] },
  { id: 'intelligence', n: '02', label: 'Intelligence', title: 'Intelligence', t0: 8, t1: 18, segments: [[8, 128], [2, 120]], beats: [9.4, 11.1, 12.8, 14.5, 16.5, 17.4] },
  { id: 'systems', n: '03', label: 'Systems', title: 'Systems', t0: 18, t1: 28, segments: [[6.5, 104], [3.5, 240]], beats: [18.6, 19.8, 21, 22.2, 23.4, 25, 26.3, 27.5] },
  { id: 'real-world', n: '04', label: 'Real world', title: 'Real world', t0: 28, t1: 40, segments: [[12, 180]], beats: [28.6, 31, 34.3, 36.4, 39.2] },
  {
    id: 'the-map', n: '05', label: 'The map', title: 'The night the map went live', t0: 40, t1: 70,
    // Shot durations and scroll weights from the storyboard (shots 01–13).
    segments: [[2, 50], [2, 50], [3, 70], [3, 70], [2, 50], [2.5, 90], [2.5, 160], [1.5, 70], [2.5, 70], [3, 160], [2, 120], [2, 120], [2, 280]],
    beats: [40.6, 43, 45.5, 48.5, 50.6, 53.6, 54.75, 55.25, 55.75, 56.25, 56.75, 57.8, 59.4, 62, 63.4, 65, 66.5, 67.1, 67.7, 68.8, 69.5],
  },
  { id: 'resqmesh', n: '06', label: 'ResQMesh', title: 'ResQMesh', t0: 70, t1: 78, segments: [[2, 140], [2, 130], [4, 270]], beats: [70.5, 71.4, 72.6, 73.4, 74.6, 76, 77.2] },
  { id: 'nestiq', n: '07', label: 'NestIQ', title: 'NestIQ', t0: 78, t1: 84, segments: [[6, 320]], beats: [78.6, 79.8, 81.0, 82.2, 83.2] },
  { id: 'contact', n: '08', label: 'Contact', title: 'Contact', t0: 84, t1: 90, segments: [[6, 140]], beats: [85.4, 86.8, 90] },
];
