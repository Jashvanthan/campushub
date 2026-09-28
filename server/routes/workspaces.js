import { Router } from 'express';
import { db } from '../db/database.js';
import { verifyAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/workspaces
router.get('/', optionalAuth, (req, res) => {
  const workspaces = db.getCollection('workspaces');
  res.json({ success: true, count: workspaces.length, workspaces });
});

// GET /api/workspaces/:id (Full Bundle)
router.get('/:id', optionalAuth, (req, res) => {
  const ws = db.findById('workspaces', req.params.id);
  if (!ws) return res.status(404).json({ success: false, error: 'Workspace not found.' });

  const tasks = db.getCollection('tasks').filter(t => t.workspaceId === ws.id);
  const milestones = db.getCollection('milestones').filter(m => m.workspaceId === ws.id);
  const discussions = db.getCollection('discussions').filter(d => d.workspaceId === ws.id);
  const files = db.getCollection('files').filter(f => f.workspaceId === ws.id);
  const activities = db.getCollection('activities').filter(a => a.workspaceId === ws.id);
  const chatMessages = db.getCollection('chatMessages').filter(c => c.workspaceId === ws.id);

  res.json({
    success: true,
    workspace: ws,
    tasks,
    milestones,
    discussions,
    files,
    activities,
    chatMessages
  });
});

// --- Tasks ---
// POST /api/workspaces/:id/tasks
router.post('/:id/tasks', verifyAuth, (req, res) => {
  const ws = db.findById('workspaces', req.params.id);
  if (!ws) return res.status(404).json({ success: false, error: 'Workspace not found.' });

  const { title, description, priority, assignee, status, dueDate } = req.body;
  const newTask = {
    id: `task-${Date.now()}`,
    workspaceId: ws.id,
    title,
    description: description || '',
    priority: priority || 'medium',
    assignee: assignee || { name: req.user.name || 'Unassigned', avatar: 'UN' },
    status: status || 'todo',
    dueDate: dueDate || '2026-10-30',
    createdAt: new Date().toISOString()
  };

  db.insert('tasks', newTask);
  res.status(201).json({ success: true, task: newTask });
});

// PUT /api/workspaces/:id/tasks/:taskId
router.put('/:id/tasks/:taskId', verifyAuth, (req, res) => {
  const updated = db.update('tasks', req.params.taskId, req.body);
  if (!updated) return res.status(404).json({ success: false, error: 'Task not found.' });
  res.json({ success: true, task: updated });
});

// DELETE /api/workspaces/:id/tasks/:taskId
router.delete('/:id/tasks/:taskId', verifyAuth, (req, res) => {
  const ok = db.delete('tasks', req.params.taskId);
  if (!ok) return res.status(404).json({ success: false, error: 'Task not found.' });
  res.json({ success: true, message: 'Task deleted successfully!' });
});

// --- Milestones ---
// POST /api/workspaces/:id/milestones
router.post('/:id/milestones', verifyAuth, (req, res) => {
  const ws = db.findById('workspaces', req.params.id);
  if (!ws) return res.status(404).json({ success: false, error: 'Workspace not found.' });

  const { title, description, targetDate } = req.body;
  const newMilestone = {
    id: `ms-${Date.now()}`,
    workspaceId: ws.id,
    title,
    description: description || '',
    targetDate: targetDate || '2026-11-15',
    progress: 0,
    status: 'in_progress',
    createdAt: new Date().toISOString()
  };

  db.insert('milestones', newMilestone);
  res.status(201).json({ success: true, milestone: newMilestone });
});

// PUT /api/workspaces/:id/milestones/:msId
router.put('/:id/milestones/:msId', verifyAuth, (req, res) => {
  const updated = db.update('milestones', req.params.msId, req.body);
  if (!updated) return res.status(404).json({ success: false, error: 'Milestone not found.' });
  res.json({ success: true, milestone: updated });
});

// DELETE /api/workspaces/:id/milestones/:msId
router.delete('/:id/milestones/:msId', verifyAuth, (req, res) => {
  const ok = db.delete('milestones', req.params.msId);
  if (!ok) return res.status(404).json({ success: false, error: 'Milestone not found.' });
  res.json({ success: true, message: 'Milestone deleted successfully!' });
});

// --- Files ---
// POST /api/workspaces/:id/files
router.post('/:id/files', verifyAuth, (req, res) => {
  const ws = db.findById('workspaces', req.params.id);
  if (!ws) return res.status(404).json({ success: false, error: 'Workspace not found.' });

  const { name, size, type, url } = req.body;
  const newFile = {
    id: `file-${Date.now()}`,
    workspaceId: ws.id,
    name: name || 'document.pdf',
    size: size || '1.2 MB',
    type: type || 'pdf',
    uploadedBy: req.user.name || req.user.username,
    url: url || '#',
    uploadedAt: new Date().toISOString()
  };

  db.insert('files', newFile);
  res.status(201).json({ success: true, file: newFile });
});

// DELETE /api/workspaces/:id/files/:fileId
router.delete('/:id/files/:fileId', verifyAuth, (req, res) => {
  const ok = db.delete('files', req.params.fileId);
  if (!ok) return res.status(404).json({ success: false, error: 'File not found.' });
  res.json({ success: true, message: 'File removed successfully!' });
});

export default router;
