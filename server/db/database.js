import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import {
  SEED_IDEAS,
  SEED_WORKSPACES,
  SEED_TASKS,
  SEED_MILESTONES,
  SEED_DISCUSSIONS,
  SEED_FILES,
  SEED_ACTIVITIES,
  SEED_CONTRIBUTION_REQUESTS,
  SEED_CHAT_MESSAGES,
  SEED_TERMINAL_FILES
} from '../../src/data/seedIdeasAndWorkspaces.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'campushub.db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory relational store with auto-persistence
class CampusHubDatabase {
  constructor() {
    this.data = {
      users: {},
      posts: [],
      registrations: {},
      ideas: [],
      contributionRequests: [],
      workspaces: [],
      tasks: [],
      milestones: [],
      discussions: [],
      files: [],
      activities: [],
      chatMessages: [],
      terminalFiles: []
    };
    this.init();
  }

  init() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
        console.log('✅ CampusHub Database loaded from persistence file.');
      } catch (err) {
        console.error('Error reading database file, initializing seeds:', err);
        this.seedInitialData();
      }
    } else {
      this.seedInitialData();
    }
  }

  seedInitialData() {
    console.log('🌱 Seeding initial CampusHub database records...');
    const adminHash = bcrypt.hashSync('Admin@2025!', 10);
    const studentHash = bcrypt.hashSync('Student@2025!', 10);

    this.data.users = {
      admin: {
        id: 'user-admin',
        username: 'admin',
        name: 'Campus Administrator',
        email: 'admin@campushub.edu',
        password: adminHash,
        role: 'admin',
        department: 'Administration',
        skills: ['Management', 'Security', 'System Admin'],
        createdAt: new Date().toISOString()
      },
      std1: {
        id: 'user-std1',
        username: 'std1',
        name: 'Jashvanthan A',
        email: 'jashvanthan@campushub.edu',
        password: studentHash,
        role: 'student',
        department: 'Computer Science & Engineering',
        skills: ['React', 'Node.js', 'Python', 'AI/ML', 'IoT'],
        createdAt: new Date().toISOString()
      },
      sarah_jenkins: {
        id: 'user-sarah',
        username: 'sarah_jenkins',
        name: 'Sarah Jenkins',
        email: 'sarah@campushub.edu',
        password: studentHash,
        role: 'student',
        department: 'Computer Science',
        skills: ['Algorithms', 'Python', 'C++'],
        createdAt: new Date().toISOString()
      },
      david_chen: {
        id: 'user-david',
        username: 'david_chen',
        name: 'David Chen',
        email: 'david@campushub.edu',
        password: studentHash,
        role: 'student',
        department: 'Robotics & Mechatronics',
        skills: ['C++', 'ROS', 'Embedded Systems', 'IoT'],
        createdAt: new Date().toISOString()
      }
    };

    this.data.posts = [
      {
        id: 1,
        author: 'Sarah Jenkins',
        authorId: 'sarah_jenkins',
        role: 'student',
        department: 'Computer Science',
        type: 'project',
        title: 'Campus Navigation & Shortest Path AI',
        content: 'An open-source interactive navigation engine calculating shortest accessible routes across university buildings, elevators, and campus amenities.',
        tags: ['React', 'Algorithms', 'Dijkstra', 'AI'],
        likes: 24,
        likedBy: ['admin'],
        comments: [
          { id: 101, author: 'admin', authorId: 'admin', role: 'admin', text: 'Excellent initiative! Let us integrate this with campus signage.', createdAt: new Date().toISOString() }
        ],
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        author: 'Tech Club',
        authorId: 'tech_club',
        role: 'admin',
        department: 'Student Affairs',
        type: 'event',
        title: 'Campus Hackathon 2026: Cosmic Innovation',
        content: 'Join 500+ student developers, designers, and innovators for a 36-hour hackathon building next-gen campus solutions. Cash prizes & mentorship!',
        tags: ['Hackathon', 'Innovation', 'Prizes'],
        eventDetails: {
          eventDate: '2026-10-15',
          startTime: '09:00 AM',
          venue: 'Grand Tech Auditorium & Labs',
          category: 'Hackathon',
          registrationUrl: 'https://campushub.edu/hackathon-2026'
        },
        likes: 42,
        likedBy: ['std1'],
        comments: [],
        createdAt: new Date().toISOString()
      }
    ];

    this.data.ideas = SEED_IDEAS;
    this.data.workspaces = SEED_WORKSPACES;
    this.data.tasks = SEED_TASKS;
    this.data.milestones = SEED_MILESTONES;
    this.data.discussions = SEED_DISCUSSIONS;
    this.data.files = SEED_FILES;
    this.data.activities = SEED_ACTIVITIES;
    this.data.contributionRequests = SEED_CONTRIBUTION_REQUESTS;
    this.data.chatMessages = SEED_CHAT_MESSAGES;
    this.data.terminalFiles = SEED_TERMINAL_FILES;

    this.save();
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to persist database:', err);
    }
  }

  // Generic Query Helpers
  getCollection(name) {
    if (!this.data[name]) {
      this.data[name] = [];
    }
    return this.data[name];
  }

  findById(collectionName, id) {
    const col = this.getCollection(collectionName);
    return col.find(item => String(item.id) === String(id));
  }

  insert(collectionName, item) {
    const col = this.getCollection(collectionName);
    col.push(item);
    this.save();
    return item;
  }

  update(collectionName, id, updates) {
    const col = this.getCollection(collectionName);
    const index = col.findIndex(item => String(item.id) === String(id));
    if (index === -1) return null;
    col[index] = { ...col[index], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return col[index];
  }

  delete(collectionName, id) {
    const col = this.getCollection(collectionName);
    const index = col.findIndex(item => String(item.id) === String(id));
    if (index === -1) return false;
    col.splice(index, 1);
    this.save();
    return true;
  }
}

export const db = new CampusHubDatabase();
