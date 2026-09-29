import { Router } from 'express';
import { db } from '../db/database.js';
import { verifyAuth, optionalAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/posts/recommended (Personalized & Trending Feed)
router.get('/recommended', optionalAuth, (req, res) => {
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
  let posts = db.getCollection('posts') || [];

  const currentUser = req.user;
  let recommended = [...posts];

  if (currentUser && currentUser.username) {
    const u = currentUser.username.toLowerCase();
    const userSkills = Array.isArray(currentUser.skills) ? currentUser.skills.map(s => s.toLowerCase()) : [];
    const userMajor = (currentUser.major || currentUser.department || '').toLowerCase();

    recommended.sort((a, b) => {
      let scoreA = (a.likes || 0) * 2 + (a.comments || []).length * 3;
      let scoreB = (b.likes || 0) * 2 + (b.comments || []).length * 3;

      if ((a.likedBy || []).includes(u)) scoreA += 5;
      if ((b.likedBy || []).includes(u)) scoreB += 5;

      const tagsA = (a.tags || []).map(t => String(t).toLowerCase());
      const tagsB = (b.tags || []).map(t => String(t).toLowerCase());
      
      userSkills.forEach(skill => {
        if (tagsA.includes(skill)) scoreA += 8;
        if (tagsB.includes(skill)) scoreB += 8;
      });

      if (userMajor && (a.department || '').toLowerCase().includes(userMajor)) scoreA += 5;
      if (userMajor && (b.department || '').toLowerCase().includes(userMajor)) scoreB += 5;

      const timeA = new Date(a.createdAt || a.date || 0).getTime();
      const timeB = new Date(b.createdAt || b.date || 0).getTime();
      scoreA += (timeA / 100000000);
      scoreB += (timeB / 100000000);

      return scoreB - scoreA;
    });
  } else {
    // Sort newest first
    recommended.sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));
  }

  const result = recommended.slice(0, limit).map(p => ({
    ...p,
    description: p.description || p.content || '',
    content: p.content || p.description || ''
  }));

  res.json({
    success: true,
    posts: result,
    count: result.length,
    isPersonalized: Boolean(currentUser)
  });
});

// GET /api/posts
router.get('/', optionalAuth, (req, res) => {
  const { type, department, category, authorId, search, q } = req.query;
  let posts = db.getCollection('posts') || [];

  if (type && type !== 'all') {
    posts = posts.filter(p => p.type === type || (type === 'projects' && p.type === 'project') || (type === 'events' && p.type === 'event') || (type === 'issues' && p.type === 'issue') || (type === 'ideas' && p.type === 'idea'));
  }
  if (department && department !== 'all') {
    posts = posts.filter(p => (p.department || '').toLowerCase() === department.toLowerCase());
  }
  if (category && category !== 'all') {
    posts = posts.filter(p => (p.category || p.eventDetails?.category || '').toLowerCase() === category.toLowerCase());
  }
  if (authorId) {
    posts = posts.filter(p => p.authorId === authorId || p.author?.name === authorId);
  }

  const query = (search || q || '').toLowerCase().trim();
  if (query) {
    posts = posts.filter(p => {
      const titleMatch = (p.title || '').toLowerCase().includes(query);
      const descMatch = (p.description || p.content || '').toLowerCase().includes(query);
      const tagMatch = Array.isArray(p.tags) && p.tags.some(t => String(t).toLowerCase().includes(query));
      const authorMatch = (typeof p.author === 'string' ? p.author : p.author?.name || '').toLowerCase().includes(query) || (p.authorId || '').toLowerCase().includes(query);
      const deptMatch = (p.department || '').toLowerCase().includes(query);
      const studentMatch = (p.studentName || '').toLowerCase().includes(query);
      const orgMatch = (p.organization || '').toLowerCase().includes(query);
      return titleMatch || descMatch || tagMatch || authorMatch || deptMatch || studentMatch || orgMatch;
    });
  }

  // Sort by newest first
  posts = [...posts].sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));

  const result = posts.map(p => ({
    ...p,
    description: p.description || p.content || '',
    content: p.content || p.description || ''
  }));

  res.json({ success: true, count: result.length, posts: result });
});

// GET /api/posts/:id
router.get('/:id', optionalAuth, (req, res) => {
  const idStr = String(req.params.id);
  const posts = db.getCollection('posts') || [];
  const post = posts.find(p => String(p.id) === idStr);

  if (!post) {
    return res.status(404).json({ success: false, error: 'Post not found.' });
  }
  res.json({
    success: true,
    post: {
      ...post,
      description: post.description || post.content || '',
      content: post.content || post.description || ''
    }
  });
});

// POST /api/posts (Create New Post)
router.post('/', optionalAuth, (req, res) => {
  const body = req.body || {};
  const {
    id, title, content, description, type, department, tags, priority,
    eventDetails, image, studentName, rollNumber, year, status, location,
    organization, eventDate, eventTime, duration, participantType, minTeamSize,
    maxTeamSize, contactInfo, organizerName, author, authorId
  } = body;

  const postTitle = (title || '').trim();
  const postDesc = (description || content || '').trim();
  const postType = type || 'project';

  if (!postTitle || (!postDesc && postType !== 'event')) {
    return res.status(400).json({ success: false, error: 'Title and description are required.' });
  }

  const posts = db.getCollection('posts') || [];
  // Use provided ID or generate a unique ID
  const newId = id || (posts.length > 0 ? Math.max(...posts.map(p => Number(p.id) || 0)) + 1 : Date.now());

  const user = req.user || {};
  const postAuthor = author?.name || author || user.name || user.username || authorId || 'student1';
  const postAuthorId = authorId || user.username || (typeof author === 'string' ? author : author?.name) || 'student1';

  const newPost = {
    id: newId,
    title: postTitle,
    description: postDesc,
    content: postDesc,
    type: postType,
    department: department || user.department || 'Computer Science',
    tags: Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map(t => t.trim()).filter(Boolean) : []),
    image: image || null,
    priority: priority || (postType === 'issue' ? 'medium' : undefined),
    resolved: postType === 'issue' ? false : undefined,
    studentName: studentName || undefined,
    rollNumber: rollNumber || undefined,
    year: year || undefined,
    status: status || (postType === 'idea' ? 'Proposed' : undefined),
    organization: organization || undefined,
    location: location || eventDetails?.venue || undefined,
    eventDate: eventDate || eventDetails?.eventDate || undefined,
    eventTime: eventTime || eventDetails?.startTime || undefined,
    duration: duration || undefined,
    participantType: participantType || undefined,
    minTeamSize: minTeamSize || undefined,
    maxTeamSize: maxTeamSize || undefined,
    contactInfo: contactInfo || undefined,
    organizerName: organizerName || undefined,
    eventDetails: eventDetails || (postType === 'event' ? {
      eventDate,
      startTime: eventTime,
      venue: location,
      category: body.category || 'General',
      duration,
      contactInfo
    } : undefined),
    author: typeof author === 'object' && author ? author : {
      name: postAuthor,
      avatar: (postAuthor || 'ST').substring(0, 2).toUpperCase()
    },
    authorId: postAuthorId,
    role: user.role || 'student',
    likes: body.likes || 0,
    likedBy: Array.isArray(body.likedBy) ? body.likedBy : [],
    comments: Array.isArray(body.comments) ? body.comments : [],
    createdAt: body.createdAt || new Date().toISOString(),
    date: body.date || 'Just now'
  };

  // Upsert into database
  const existingIdx = posts.findIndex(p => String(p.id) === String(newId));
  if (existingIdx !== -1) {
    posts[existingIdx] = newPost;
  } else {
    posts.unshift(newPost);
  }
  db.save();

  res.status(201).json({
    success: true,
    message: 'Post published successfully!',
    post: newPost
  });
});

// PUT /api/posts/:id (Edit Post)
router.put('/:id', optionalAuth, (req, res) => {
  const idStr = String(req.params.id);
  const posts = db.getCollection('posts') || [];
  const post = posts.find(p => String(p.id) === idStr);

  if (!post) {
    return res.status(404).json({ success: false, error: 'Post not found.' });
  }

  // Ownership check
  if (req.user && post.authorId && req.user.username !== post.authorId && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Unauthorized: Only author can edit this post.' });
  }

  const updates = req.body || {};
  if (updates.title !== undefined) post.title = updates.title;
  if (updates.description !== undefined) {
    post.description = updates.description;
    post.content = updates.description;
  }
  if (updates.content !== undefined) {
    post.content = updates.content;
    post.description = updates.content;
  }
  if (updates.department !== undefined) post.department = updates.department;
  if (updates.tags !== undefined) post.tags = Array.isArray(updates.tags) ? updates.tags : String(updates.tags).split(',').map(t => t.trim());
  if (updates.priority !== undefined) post.priority = updates.priority;
  if (updates.resolved !== undefined) post.resolved = updates.resolved;
  if (updates.image !== undefined) post.image = updates.image;
  if (updates.eventDetails !== undefined) post.eventDetails = updates.eventDetails;

  db.save();
  res.json({ success: true, message: 'Post updated successfully!', post });
});

// DELETE /api/posts/:id (Delete Post Permanently)
router.delete('/:id', optionalAuth, (req, res) => {
  const idStr = String(req.params.id);
  const posts = db.getCollection('posts') || [];
  const idx = posts.findIndex(p => String(p.id) === idStr);

  if (idx === -1) {
    // Already removed from DB
    return res.json({ success: true, message: 'Post already removed from database.' });
  }

  posts.splice(idx, 1);
  db.save();
  res.json({ success: true, message: 'Post permanently deleted from database.' });
});

// POST /api/posts/:id/like
router.post('/:id/like', optionalAuth, (req, res) => {
  const idStr = String(req.params.id);
  const posts = db.getCollection('posts') || [];
  const post = posts.find(p => String(p.id) === idStr);

  if (!post) {
    return res.status(404).json({ success: false, error: 'Post not found.' });
  }

  const username = req.user?.username || req.body?.username || 'user';
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
router.post('/:id/comments', optionalAuth, (req, res) => {
  const { text, author, authorId } = req.body || {};
  if (!text) return res.status(400).json({ success: false, error: 'Comment text is required.' });

  const idStr = String(req.params.id);
  const posts = db.getCollection('posts') || [];
  const post = posts.find(p => String(p.id) === idStr);

  if (!post) return res.status(404).json({ success: false, error: 'Post not found.' });

  post.comments = post.comments || [];
  const user = req.user || {};
  const commenterName = author || user.name || user.username || authorId || 'Member';
  const commenterId = authorId || user.username || commenterName;

  const newComment = {
    id: Date.now(),
    author: commenterName,
    authorId: commenterId,
    role: user.role || 'student',
    text: String(text).trim(),
    createdAt: new Date().toISOString()
  };

  post.comments.push(newComment);
  db.save();
  res.status(201).json({ success: true, comment: newComment });
});

// DELETE /api/posts/:id/comments/:commentId
router.delete('/:id/comments/:commentId', optionalAuth, (req, res) => {
  const idStr = String(req.params.id);
  const commentIdStr = String(req.params.commentId);
  const posts = db.getCollection('posts') || [];
  const post = posts.find(p => String(p.id) === idStr);

  if (!post) return res.status(404).json({ success: false, error: 'Post not found.' });

  post.comments = (post.comments || []).filter(c => String(c.id) !== commentIdStr);
  db.save();
  res.json({ success: true, message: 'Comment deleted.' });
});

export default router;
