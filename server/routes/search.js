import { Router } from 'express';
import { db } from '../db/database.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/search
router.get('/', optionalAuth, (req, res) => {
  const rawQuery = (req.query.q || req.query.search || '').trim();
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));
  const userLimit = Math.min(50, Math.max(1, parseInt(req.query.userLimit, 10) || 15));

  if (!rawQuery) {
    return res.json({
      success: true,
      query: '',
      posts: [],
      users: [],
      counts: { posts: 0, users: 0, total: 0 }
    });
  }

  const queryStr = rawQuery.toLowerCase();
  const words = queryStr.split(/\s+/).filter(Boolean);

  // 1. Search Posts
  const allPosts = db.getCollection('posts') || [];
  const matchedPosts = allPosts.filter(p => {
    const title = (p.title || '').toLowerCase();
    const desc = (p.description || p.content || '').toLowerCase();
    const author = (typeof p.author === 'string' ? p.author : p.author?.name || p.authorId || '').toLowerCase();
    const tags = Array.isArray(p.tags) ? p.tags.map(t => String(t).toLowerCase()) : [];
    const dept = (p.department || '').toLowerCase();
    const cat = (p.category || p.eventDetails?.category || '').toLowerCase();

    return words.some(w =>
      title.includes(w) ||
      desc.includes(w) ||
      author.includes(w) ||
      tags.some(t => t.includes(w)) ||
      dept.includes(w) ||
      cat.includes(w)
    );
  });

  // Rank posts (exact title match first, then keyword matches, then recency)
  matchedPosts.sort((a, b) => {
    const titleA = (a.title || '').toLowerCase();
    const titleB = (b.title || '').toLowerCase();
    let scoreA = titleA.includes(queryStr) ? 10 : 0;
    let scoreB = titleB.includes(queryStr) ? 10 : 0;

    words.forEach(w => {
      if (titleA.includes(w)) scoreA += 3;
      if (titleB.includes(w)) scoreB += 3;
    });

    scoreA += (a.likes || 0) * 0.1;
    scoreB += (b.likes || 0) * 0.1;

    return scoreB - scoreA;
  });

  const selectedPosts = matchedPosts.slice(0, limit).map(p => ({
    ...p,
    description: p.description || p.content || '',
    content: p.content || p.description || ''
  }));

  // 2. Search Users
  const allUsers = Object.values(db.data.users || {});
  const matchedUsers = allUsers.filter(u => {
    const username = (u.username || '').toLowerCase();
    const name = (u.name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const major = (u.major || u.department || '').toLowerCase();
    const skills = Array.isArray(u.skills) ? u.skills.map(s => String(s).toLowerCase()) : [];

    return words.some(w =>
      username.includes(w) ||
      name.includes(w) ||
      email.includes(w) ||
      major.includes(w) ||
      skills.some(s => s.includes(w))
    );
  });

  matchedUsers.sort((a, b) => {
    const unameA = (a.username || '').toLowerCase();
    const unameB = (b.username || '').toLowerCase();
    const nameA = (a.name || '').toLowerCase();
    const nameB = (b.name || '').toLowerCase();

    let scoreA = (unameA === queryStr || nameA === queryStr) ? 10 : (unameA.includes(queryStr) || nameA.includes(queryStr)) ? 5 : 0;
    let scoreB = (unameB === queryStr || nameB === queryStr) ? 10 : (unameB.includes(queryStr) || nameB.includes(queryStr)) ? 5 : 0;

    return scoreB - scoreA;
  });

  const selectedUsers = matchedUsers.slice(0, userLimit).map(u => ({
    username: u.username,
    name: u.name || u.username,
    role: u.role,
    email: u.email,
    department: u.department,
    institution: u.institution || '',
    major: u.major || '',
    bio: u.bio || '',
    avatar: u.avatar,
    skills: u.skills || []
  }));

  res.json({
    success: true,
    query: rawQuery,
    posts: selectedPosts,
    users: selectedUsers,
    counts: {
      posts: matchedPosts.length,
      users: matchedUsers.length,
      total: matchedPosts.length + matchedUsers.length
    }
  });
});

// POST /api/search/track
router.post('/track', (req, res) => {
  res.json({ success: true, tracked: true });
});

export default router;
