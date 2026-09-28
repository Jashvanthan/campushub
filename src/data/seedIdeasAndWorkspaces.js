/**
 * Seed data for CampusHub Ideas, Contributions & Workspaces
 */

export const CATEGORIES = [
  'Technology',
  'Education',
  'Campus Life',
  'Environment',
  'Sports',
  'Events',
  'Innovation',
  'Social Impact',
  'Infrastructure',
  'Student Welfare',
  'Clubs & Communities',
  'Other'
];

export const IDEA_STATUSES = [
  'IDEA',
  'DISCUSSION',
  'OPEN FOR CONTRIBUTION',
  'IN DEVELOPMENT',
  'PILOT / TESTING',
  'COMPLETED',
  'REJECTED',
  'ARCHIVED'
];

export const SKILLS_LIST = [
  'Java',
  'React',
  'Frontend',
  'Backend',
  'UI/UX',
  'Python',
  'AI/ML',
  'Database',
  'Cloud',
  'DevOps',
  'Research',
  'Content',
  'Marketing',
  'Node.js',
  'Mobile / React Native',
  'IoT',
  'Other'
];

export const CONTRIBUTION_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'UI/UX Designer',
  'Researcher',
  'AI / ML Engineer',
  'Content Creator',
  'Project Manager',
  'Tester / QA',
  'Documentation Lead',
  'Domain Expert',
  'Hardware / IoT Specialist',
  'Other'
];

export const SEED_IDEAS = [
  {
    id: 'idea-1',
    title: 'Smart Campus Navigation & AR Wayfinding',
    problem: 'New students, guests, and visitors frequently get lost navigating between campus blocks, lecture halls, labs, and administrative offices across our 120-acre campus.',
    solution: 'Develop an interactive mobile-first web app with AR indoor/outdoor navigation, real-time classroom schedules, step-by-step route guidance, and wheelchair accessible paths.',
    impact: 'Helps 15,000+ campus students, faculty, and visiting guests save time, locate examination halls instantly, and improves accessibility campus-wide.',
    category: 'Technology',
    status: 'IN DEVELOPMENT',
    tags: ['AR', 'SmartCampus', 'React', 'ThreeJS', 'Accessibility'],
    skillsRequired: ['React', 'Frontend', 'UI/UX', 'Node.js', 'Python', 'AI/ML'],
    contributionTypes: ['Frontend Developer', 'UI/UX Designer', 'Backend Developer', 'Tester / QA'],
    duration: '1–3 Months',
    teamSize: '4–6',
    creatorId: 'student1',
    creatorName: 'Student One',
    creatorAvatar: 'S1',
    creatorDepartment: 'Computer Science',
    supportedBy: ['admin', 'student1'],
    supportCount: 42,
    followedBy: ['admin', 'student1'],
    progress: 70,
    workspaceId: 'ws-1',
    createdAt: '2026-03-10T10:00:00.000Z',
    updatedAt: '2026-03-24T14:30:00.000Z',
    attachments: [
      { name: 'campus_navigation_architecture.pdf', size: '2.4 MB', type: 'application/pdf' },
      { name: 'ui_wireframes_v2.png', size: '1.1 MB', type: 'image/png' }
    ]
  },
  {
    id: 'idea-2',
    title: 'AI Peer Tutoring & Study Group Matcher',
    problem: 'Students struggle finding study partners and peer mentors tailored to their specific subject difficulties and available study slots.',
    solution: 'An intelligent recommendation engine matching students based on course syllabus, weakness topics, learning pace, and mutual calendar availability.',
    impact: 'Improves student pass rates and course mastery by 35% and fosters inclusive peer-to-peer campus learning communities.',
    category: 'Education',
    status: 'OPEN FOR CONTRIBUTION',
    tags: ['AI/ML', 'PeerLearning', 'Python', 'FastAPI', 'Algorithms'],
    skillsRequired: ['Python', 'AI/ML', 'Backend', 'React', 'UI/UX'],
    contributionTypes: ['AI / ML Engineer', 'Backend Developer', 'UI/UX Designer', 'Domain Expert'],
    duration: '2–4 Weeks',
    teamSize: '2–3',
    creatorId: 'admin',
    creatorName: 'Campus Admin',
    creatorAvatar: 'AD',
    creatorDepartment: 'System Administration',
    supportedBy: ['student1', 'admin'],
    supportCount: 28,
    followedBy: ['student1', 'admin'],
    progress: 35,
    workspaceId: 'ws-2',
    createdAt: '2026-03-15T09:15:00.000Z',
    updatedAt: '2026-03-22T11:00:00.000Z',
    attachments: [
      { name: 'recommendation_algorithm_spec.pdf', size: '1.8 MB', type: 'application/pdf' }
    ]
  }
];

export const SEED_WORKSPACES = [
  {
    id: 'ws-1',
    ideaId: 'idea-1',
    name: 'Smart Campus Navigation & AR Wayfinding',
    description: 'Central development workspace for the campus AR navigation and interactive directory system.',
    category: 'Technology',
    status: 'IN DEVELOPMENT',
    progress: 70,
    ownerId: 'student1',
    ownerName: 'Student One',
    createdAt: '2026-03-10T11:00:00.000Z',
    members: [
      {
        userId: 'student1',
        name: 'Student One',
        avatar: 'S1',
        role: 'Owner',
        contributionRole: 'Project Lead & Architect',
        department: 'Computer Science',
        joinedAt: '2026-03-10T11:00:00.000Z',
        tasksCompleted: 8,
        totalAssigned: 10
      },
      {
        userId: 'admin',
        name: 'Campus Admin',
        avatar: 'AD',
        role: 'Admin',
        contributionRole: 'Infrastructure & Testing',
        department: 'System Administration',
        joinedAt: '2026-03-12T09:00:00.000Z',
        tasksCompleted: 6,
        totalAssigned: 7
      }
    ]
  },
  {
    id: 'ws-2',
    ideaId: 'idea-2',
    name: 'AI Peer Tutoring & Study Group Matcher',
    description: 'Workspace for building the matching algorithm, student profile indexing, and recommendation engine.',
    category: 'Education',
    status: 'OPEN FOR CONTRIBUTION',
    progress: 35,
    ownerId: 'admin',
    ownerName: 'Campus Admin',
    createdAt: '2026-03-15T10:00:00.000Z',
    members: [
      {
        userId: 'admin',
        name: 'Campus Admin',
        avatar: 'AD',
        role: 'Owner',
        contributionRole: 'Project Coordinator',
        department: 'System Administration',
        joinedAt: '2026-03-15T10:00:00.000Z',
        tasksCompleted: 3,
        totalAssigned: 4
      },
      {
        userId: 'student1',
        name: 'Student One',
        avatar: 'S1',
        role: 'Contributor',
        contributionRole: 'AI / ML Engineer & Fullstack Dev',
        department: 'Computer Science',
        joinedAt: '2026-03-16T12:00:00.000Z',
        tasksCompleted: 2,
        totalAssigned: 3
      }
    ]
  }
];

export const SEED_TASKS = [
  {
    id: 'task-101',
    workspaceId: 'ws-1',
    title: 'Design high-fidelity AR Wayfinding UI Mockups',
    description: 'Create interactive prototypes with mobile viewport for camera AR overlay and route steps.',
    assigneeId: 'student1',
    assigneeName: 'Student One',
    assigneeAvatar: 'S1',
    priority: 'HIGH',
    status: 'DONE',
    dueDate: '2026-03-18',
    checklist: [
      { id: 'c1', text: 'Map view with layer toggles', done: true },
      { id: 'c2', text: 'AR camera viewport HUD', done: true },
      { id: 'c3', text: 'Accessibility high-contrast mode', done: true }
    ],
    labels: ['UI/UX', 'Figma', 'Mobile'],
    createdAt: '2026-03-12T10:00:00.000Z'
  },
  {
    id: 'task-102',
    workspaceId: 'ws-1',
    title: 'Implement SVG Campus Map & Block Geocoding',
    description: 'Render interactive vectorized SVG map of all campus zones with clickable buildings and floor switchers.',
    assigneeId: 'admin',
    assigneeName: 'Campus Admin',
    assigneeAvatar: 'AD',
    priority: 'URGENT',
    status: 'DONE',
    dueDate: '2026-03-22',
    checklist: [
      { id: 'c4', text: 'Parse GeoJSON node coordinates', done: true },
      { id: 'c5', text: 'Implement pan, zoom and pinch controls', done: true },
      { id: 'c6', text: 'Floor-level room search indexing', done: true }
    ],
    labels: ['Frontend', 'Map', 'React'],
    createdAt: '2026-03-14T11:00:00.000Z'
  },
  {
    id: 'task-103',
    workspaceId: 'ws-1',
    title: 'Develop Shortest Path Graph Routing Algorithm',
    description: 'Implement Dijkstra and A* pathfinding algorithm with handicap ramp preferences for campus navigation.',
    assigneeId: 'student1',
    assigneeName: 'Student One',
    assigneeAvatar: 'S1',
    priority: 'HIGH',
    status: 'IN PROGRESS',
    dueDate: '2026-03-28',
    checklist: [
      { id: 'c7', text: 'Construct weighted graph of campus pathways', done: true },
      { id: 'c8', text: 'Implement multi-floor elevator/stair transitions', done: false },
      { id: 'c9', text: 'Benchmark path calculations < 50ms', done: true }
    ],
    labels: ['Algorithms', 'Backend', 'Python'],
    createdAt: '2026-03-16T14:30:00.000Z'
  }
];

export const SEED_MILESTONES = [
  {
    id: 'ms-1',
    workspaceId: 'ws-1',
    title: 'Milestone 1: Research & Map Geocoding',
    description: 'Complete campus topography surveys, room indexing, and vector floor plans.',
    dueDate: '2026-03-20',
    completed: true,
    tasks: [
      { id: 'mt-1', title: 'Survey all campus blocks and ramps', done: true },
      { id: 'mt-2', title: 'Compile room numbering registry (750+ rooms)', done: true },
      { id: 'mt-3', title: 'Export vectorized SVGs per floor level', done: true }
    ]
  },
  {
    id: 'ms-2',
    workspaceId: 'ws-1',
    title: 'Milestone 2: Navigation Engine & Core UI',
    description: 'Ship graph routing algorithm, path visualizer, and responsive HUD interface.',
    dueDate: '2026-04-05',
    completed: false,
    tasks: [
      { id: 'mt-4', title: 'A* Pathfinding engine implementation', done: true },
      { id: 'mt-5', title: 'Turn-by-turn instruction banners', done: false }
    ]
  }
];

export const SEED_DISCUSSIONS = [
  {
    id: 'disc-1',
    workspaceId: 'ws-1',
    title: 'Should we use Three.js WebGL or lightweight Canvas2D for indoor AR arrows?',
    category: 'Development',
    authorId: 'student1',
    authorName: 'Student One',
    authorAvatar: 'S1',
    content: 'We need high framerate on mobile devices while keeping battery usage minimal. Three.js gives smooth 3D depth, but Canvas2D has near-zero bundle footprint. Thoughts team?',
    likes: ['admin'],
    isPinned: true,
    isSolved: true,
    createdAt: '2026-03-15T14:20:00.000Z',
    replies: [
      {
        id: 'rep-1',
        authorId: 'admin',
        authorName: 'Campus Admin',
        authorAvatar: 'AD',
        text: 'Three.js using a single lightweight arrow mesh achieved 60fps easily with under 10% CPU usage. Plus models load asynchronously.',
        createdAt: '2026-03-15T15:10:00.000Z'
      }
    ]
  }
];

export const SEED_FILES = [
  {
    id: 'file-1',
    workspaceId: 'ws-1',
    name: 'campus_navigation_architecture.pdf',
    category: 'Architecture',
    folder: 'Documentation',
    uploadedBy: 'Student One',
    uploaderId: 'student1',
    size: '2.4 MB',
    type: 'application/pdf',
    url: '#',
    uploadedAt: '2026-03-11T12:00:00.000Z'
  },
  {
    id: 'file-2',
    workspaceId: 'ws-1',
    name: 'ar_ui_wireframes_v2.fig',
    category: 'Design',
    folder: 'Design',
    uploadedBy: 'Campus Admin',
    uploaderId: 'admin',
    size: '8.7 MB',
    type: 'application/octet-stream',
    url: '#',
    uploadedAt: '2026-03-17T15:30:00.000Z'
  }
];

export const SEED_ACTIVITIES = [
  {
    id: 'act-1',
    workspaceId: 'ws-1',
    actorId: 'student1',
    actorName: 'Student One',
    actorAvatar: 'S1',
    action: 'created the workspace and initialized roadmap',
    timestamp: '2026-03-10T11:00:00.000Z',
    type: 'workspace'
  },
  {
    id: 'act-2',
    workspaceId: 'ws-1',
    actorId: 'admin',
    actorName: 'Campus Admin',
    actorAvatar: 'AD',
    action: 'joined workspace as infrastructure maintainer',
    timestamp: '2026-03-12T09:00:00.000Z',
    type: 'member'
  }
];

export const SEED_CONTRIBUTION_REQUESTS = [
  {
    id: 'req-1',
    ideaId: 'idea-2',
    workspaceId: 'ws-2',
    applicantId: 'student1',
    applicantName: 'Student One',
    applicantAvatar: 'S1',
    applicantDepartment: 'Computer Science',
    roles: ['Backend Developer', 'AI / ML Engineer'],
    skills: ['Python', 'FastAPI', 'PyTorch', 'Vector Search'],
    message: 'I built semantic similarity matchers using embeddings in previous projects and can set up the core student recommendation pipeline.',
    status: 'ACCEPTED',
    createdAt: '2026-03-16T11:00:00.000Z'
  }
];

export const SEED_CHAT_MESSAGES = [
  {
    id: 'chat-1',
    workspaceId: 'ws-1',
    channel: 'general',
    senderId: 'student1',
    senderName: 'Student One',
    senderAvatar: 'S1',
    senderRole: 'Owner',
    content: 'Welcome team! 🚀 Sprint 2 for the **Smart Campus Navigation** system is active. Architecture specs are uploaded in Files.',
    timestamp: '2026-03-25T09:30:00.000Z',
    reactions: { '🚀': ['admin'], '👍': ['student1'] }
  },
  {
    id: 'chat-2',
    workspaceId: 'ws-1',
    channel: 'general',
    senderId: 'admin',
    senderName: 'Campus Admin',
    senderAvatar: 'AD',
    senderRole: 'Admin',
    content: 'High-fidelity mockups uploaded to the Design folder. Ready for review!',
    timestamp: '2026-03-25T09:34:00.000Z',
    reactions: { '❤️': ['student1'] }
  }
];

export const SEED_TERMINAL_FILES = [
  {
    id: 'file-term-1',
    workspaceId: 'ws-1',
    name: 'navigation_engine.js',
    language: 'javascript',
    content: `// CampusHub Navigation Engine - Dijkstra Campus Routing
console.log("🚀 Initializing Campus Node Graph...");

const CAMPUS_GRAPH = {
  'Main Gate': { 'Admin Block': 120, 'Block A': 180, 'Library': 250 },
  'Admin Block': { 'Main Gate': 120, 'Auditorium': 90, 'Block A': 110 },
  'Block A': { 'Main Gate': 180, 'Admin Block': 110, 'Science Lab': 140 },
  'Science Lab': { 'Block A': 140, 'Hostel Hub': 310, 'Library': 190 },
  'Auditorium': { 'Admin Block': 90, 'Cafeteria': 85 },
  'Cafeteria': { 'Auditorium': 85, 'Sports Complex': 200, 'Library': 130 },
  'Library': { 'Main Gate': 250, 'Cafeteria': 130, 'Science Lab': 190 },
  'Sports Complex': { 'Cafeteria': 200, 'Hostel Hub': 220 },
  'Hostel Hub': { 'Sports Complex': 220, 'Science Lab': 310 }
};

function dijkstra(graph, startNode, endNode) {
  const distances = {};
  const previous = {};
  const unvisited = new Set(Object.keys(graph));

  for (let node of Object.keys(graph)) {
    distances[node] = Infinity;
    previous[node] = null;
  }
  distances[startNode] = 0;

  while (unvisited.size > 0) {
    let curr = null;
    for (let node of unvisited) {
      if (curr === null || distances[node] < distances[curr]) {
        curr = node;
      }
    }

    if (distances[curr] === Infinity || curr === endNode) break;
    unvisited.delete(curr);

    for (let neighbor in graph[curr]) {
      let alt = distances[curr] + graph[curr][neighbor];
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
        previous[neighbor] = curr;
      }
    }
  }

  const path = [];
  let u = endNode;
  while (u) {
    path.unshift(u);
    u = previous[u];
  }
  return { path, totalDistanceMeters: distances[endNode] };
}

const start = 'Main Gate';
const destination = 'Science Lab';
const result = dijkstra(CAMPUS_GRAPH, start, destination);

console.log(\`✅ Navigation Path Computed: \${result.path.join(' ➔ ')}\`);
console.log(\`📍 Total Distance: \${result.totalDistanceMeters} meters\`);
console.log(\`⏱️ Estimated Walking Time: \${Math.ceil(result.totalDistanceMeters / 80)} minutes\`);
console.table({
  Origin: start,
  Destination: destination,
  Hops: result.path.length - 1,
  Distance: \`\${result.totalDistanceMeters} m\`,
  Status: 'Optimal Route Ready'
});
`
  },
  {
    id: 'file-term-2',
    workspaceId: 'ws-1',
    name: 'api_benchmark.js',
    language: 'javascript',
    content: `// Workspace API Benchmark & Health Check
console.log("⚡ Running CampusHub API Latency Test Suite...");

const endpoints = [
  { route: '/api/v1/ideas', targetMs: 150 },
  { route: '/api/v1/workspaces/ws-1/tasks', targetMs: 120 },
  { route: '/api/v1/workspaces/ws-1/chat', targetMs: 80 },
  { route: '/api/v1/geo/ar-waypoints', targetMs: 200 }
];

endpoints.forEach((ep, idx) => {
  const simulatedLatency = Math.floor(Math.random() * 60) + 40;
  const passed = simulatedLatency <= ep.targetMs;
  console.log(\`[\${idx + 1}/\${endpoints.length}] \${ep.route} - \${simulatedLatency}ms (\${passed ? 'PASSED ✅' : 'SLOW ⚠️'})\`);
});

console.log("\\n🎉 All 4 core microservices responding under budget!");
`
  },
  {
    id: 'file-term-3',
    workspaceId: 'ws-1',
    name: 'peer_matcher.py',
    language: 'python',
    content: `# Python AI Student Matcher Prototype
import math

students = [
    {"name": "Arun K.", "skills": ["React", "UI/UX"], "interests": ["AR", "Mobile"]},
    {"name": "Sarah J.", "skills": ["Algorithms", "Python"], "interests": ["AR", "Cloud"]},
    {"name": "Priya M.", "skills": ["FastAPI", "PostgreSQL"], "interests": ["Backend", "AI"]}
]

def calculate_jaccard_similarity(list1, list2):
    s1, s2 = set(list1), set(list2)
    return len(s1.intersection(s2)) / len(s1.union(s2))

print("=== Campus Match Score ===")
score = calculate_jaccard_similarity(students[0]["interests"], students[1]["interests"])
print(f"Match between {students[0]['name']} and {students[1]['name']}: {score * 100:.1f}%")
`
  }
];

export const SEED_NOTIFICATIONS = [
  {
    id: 'notif-1',
    recipientId: 'all',
    senderId: 'admin',
    senderName: 'CampusHub Admin',
    senderAvatar: 'AD',
    type: 'system',
    title: 'Welcome to CampusHub 🚀',
    message: 'Explore ideas, collaborate on workspaces, and chat with team members in real-time!',
    targetTab: 'all',
    targetId: null,
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'notif-2',
    recipientId: 'std1',
    senderId: 'admin',
    senderName: 'CampusHub Admin',
    senderAvatar: 'AD',
    type: 'workspace',
    title: 'Workspace Active: Smart Campus AR Navigation',
    message: 'You have been assigned as lead contributor in the Smart Campus AR workspace.',
    targetTab: 'workspaces',
    targetId: 'ws-1',
    isRead: false,
    createdAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 'notif-3',
    recipientId: 'std1',
    senderId: 'admin',
    senderName: 'Sarah Jenkins',
    senderAvatar: 'SJ',
    type: 'chat',
    title: 'New Message in #dev-engineers',
    message: 'Sarah Jenkins posted: "I just deployed the Three.js point-cloud engine to staging."',
    targetTab: 'workspaces',
    targetId: 'ws-1',
    targetChannel: 'dev-engineers',
    isRead: false,
    createdAt: new Date(Date.now() - 900000).toISOString()
  }
];


