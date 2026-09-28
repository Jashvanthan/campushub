import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import postsRoutes from './routes/posts.js';
import ideasRoutes from './routes/ideas.js';
import workspacesRoutes from './routes/workspaces.js';
import chatRoutes from './routes/chat.js';
import terminalRoutes from './routes/terminal.js';
import { setupWebSocketServer } from './websocket.js';
import { db } from './db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'CampusHub Backend API',
    version: '2.5.0',
    timestamp: new Date().toISOString(),
    database: {
      usersCount: Object.keys(db.data.users).length,
      postsCount: db.data.posts.length,
      ideasCount: db.data.ideas.length,
      workspacesCount: db.data.workspaces.length
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/ideas', ideasRoutes);
app.use('/api/workspaces', workspacesRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/terminal', terminalRoutes);

// Serve static build in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api') || req.url.startsWith('/ws')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Unhandled Error:', err);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

// Create HTTP server & bind WebSockets
const server = http.createServer(app);
setupWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`
  🚀 =======================================================
  🌌 CampusHub Backend & Database Server running!
  📡 HTTP API:      http://localhost:${PORT}/api/health
  ⚡ WebSocket:     ws://localhost:${PORT}/ws
  🗄️  Database:      JSON Relational Store (ACID persistent)
  =======================================================
  `);
});
