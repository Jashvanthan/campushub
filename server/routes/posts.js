import { Router } from 'express';
import { db } from '../db/database.js';
import { verifyAuth, optionalAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/posts
router.get('/', optionalAuth, (req, res) => {
  const { type, department, search } = req.query;
  let posts = db.getCollection('posts');

  if (type && type !== 'all') {
    posts = posts.filter(p => p.type === type);
  }
  if (department && department !== 'all') {
    posts = posts.filter(p => p.department === department);
  }
  if (search) {
    const q = search.toLowerCase();
    posts = posts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      (p.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }

  // Sort by newest first
  posts = [...posts].reverse();
  res.json({ success: true, count: posts.length, posts });
});

// GET /api/posts/:id
router.get('/:id', optionalAuth, (req, res) => {
  const post = db.findById('posts', req.params.id);
  if (!post) {
    return res.status(404).json({ success: false, error: 'Post not found.' });
  }
  res.json({ success: true, post });
});


// POST /api/posts (Authenticated Student or Admin)
router.post('/', verifyAuth, requireRole('student', 'admin'), (req, res) => {
  const { title, content, type, department, tags, priority, eventDetails } = req.body;
  if (!title || !content || !type) {
    return res.status(400).json({ success: false, error: 'Title, content, and type are required.' });
  }

  const posts = db.getCollection('posts');
  const nextId = posts.length > 0 ? Math.max(...posts.map(p => Number(p.id) || 0)) + 1 : 1;

  const newPost = {
    id: nextId,
    author: req.user.name || req.user.username,
    authorId: req.user.username,
    role: req.user.role,
    department: department || req.user.department || 'Computer Science',
    type,
    title,
    content,
    tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
    priority: priority || (type === 'issue' ? 'medium' : undefined),
    resolved: type === 'issue' ? false : undefined,
    eventDetails: type === 'event' ? eventDetails : undefined,
    likes: 0,
    likedBy: [],
    comments: [],
    createdAt: new Date().toISOString()
  };

  db.insert('posts', newPost);
  res.status(201).json({ success: true, message: 'Post created successfully!', post: newPost });
});

// PUT /api/posts/:id (Strict Author / Owner check)
router.put('/:id', verifyAuth, (req, res) => {
  const post = db.findById('posts', req.params.id);
  if (!post) {
    return res.status(404).json({ success: false, error: 'Post not found.' });
  }

  // Strict ownership check: Only the original author or admin can edit
  if (post.authorId !== req.user.username && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized: Only the original post author can edit this post.'
    });
  }

  const { title, content, department, tags, priority, eventDetails } = req.body;
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (content !== undefined) updates.content = content;
  if (department !== undefined) updates.department = department;
  if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
  if (priority !== undefined) updates.priority = priority;
  if (eventDetails !== undefined) updates.eventDetails = eventDetails;

  const updated = db.update('posts', post.id, updates);
  res.json({ success: true, message: 'Post updated successfully!', post: updated });
});

// DELETE /api/posts/:id (Author or Admin)
router.delete('/:id', verifyAuth, (req, res) => {
  const post = db.findById('posts', req.params.id);
  if (!post) {
    return res.status(404).json({ success: false, error: 'Post not found.' });
  }

  if (post.authorId !== req.user.username && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Unauthorized: Cannot delete another user\'s post.' });
  }

  db.delete('posts', post.id);
  res.json({ success: true, message: 'Post deleted successfully!' });
});

// POST /api/posts/:id/like
router.post('/:id/like', verifyAuth, (req, res) => {
  const post = db.findById('posts', req.params.id);
  if (!post) return res.status(404).json({ success: false, error: 'Post not found.' });

  const username = req.user.username;
  post.likedBy = post.likedBy || [];
  const idx = post.likedBy.indexOf(username);

  if (idx === -1) {
    post.likedBy.push(username);
    post.likes = (post.likes || 0) + 1;
  } else {
    post.likedBy.splice(idx, 1);
    post.likes = Math.max(0, (post.likes || 0) - 1);
  }

  db.save();
  res.json({ success: true, likes: post.likes, likedBy: post.likedBy });
});

// POST /api/posts/:id/comments
router.post('/:id/comments', verifyAuth, (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ success: false, error: 'Comment text is required.' });

  const post = db.findById('posts', req.params.id);
  if (!post) return res.status(404).json({ success: false, error: 'Post not found.' });

  post.comments = post.comments || [];
  const newComment = {
    id: Date.now(),
    author: req.user.name || req.user.username,
    authorId: req.user.username,
    role: req.user.role,
    text,
    createdAt: new Date().toISOString()
  };

  post.comments.push(newComment);
  db.save();
  res.status(201).json({ success: true, comment: newComment });
});

export default router;
