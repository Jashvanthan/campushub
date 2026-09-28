import { Router } from 'express';
import { db } from '../db/database.js';
import { verifyAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/chat/:workspaceId
router.get('/:workspaceId', optionalAuth, (req, res) => {
  const { channel } = req.query;
  let msgs = db.getCollection('chatMessages').filter(c => c.workspaceId === req.params.workspaceId);
  if (channel) {
    msgs = msgs.filter(c => c.channel === channel);
  }
  res.json({ success: true, count: msgs.length, messages: msgs });
});

// POST /api/chat/:workspaceId
router.post('/:workspaceId', verifyAuth, (req, res) => {
  const { channel, content, codeSnippet } = req.body;
  if (!content && !codeSnippet) {
    return res.status(400).json({ success: false, error: 'Content or code snippet required.' });
  }

  const newMsg = {
    id: `msg-${Date.now()}`,
    workspaceId: req.params.workspaceId,
    channel: channel || 'general',
    senderId: req.user.username,
    senderName: req.user.name || req.user.username,
    senderAvatar: (req.user.name || req.user.username).substring(0, 2).toUpperCase(),
    senderRole: req.user.role === 'admin' ? 'Admin' : 'Contributor',
    content: content || '',
    codeSnippet: codeSnippet || null,
    reactions: {},
    timestamp: new Date().toISOString()
  };

  db.insert('chatMessages', newMsg);
  res.status(201).json({ success: true, message: newMsg });
});

// POST /api/chat/:workspaceId/messages/:messageId/reactions
router.post('/:workspaceId/messages/:messageId/reactions', verifyAuth, (req, res) => {
  const { emoji } = req.body;
  const msg = db.findById('chatMessages', req.params.messageId);
  if (!msg) return res.status(404).json({ success: false, error: 'Message not found.' });

  msg.reactions = msg.reactions || {};
  const current = msg.reactions[emoji] || [];
  const u = req.user.username;

  if (current.includes(u)) {
    msg.reactions[emoji] = current.filter(x => x !== u);
    if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
  } else {
    msg.reactions[emoji] = [...current, u];
  }

  db.save();
  res.json({ success: true, reactions: msg.reactions });
});

export default router;
