import { Router } from 'express';
import { db } from '../db/database.js';
import { verifyAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/ideas
router.get('/', optionalAuth, (req, res) => {
  const { category, status, search } = req.query;
  let ideas = db.getCollection('ideas');

  if (category && category !== 'All') {
    ideas = ideas.filter(i => i.category === category);
  }
  if (status && status !== 'All') {
    ideas = ideas.filter(i => i.status === status);
  }
  if (search) {
    const q = search.toLowerCase();
    ideas = ideas.filter(i =>
      i.title.toLowerCase().includes(q) ||
      i.problemStatement.toLowerCase().includes(q) ||
      i.proposedSolution.toLowerCase().includes(q) ||
      (i.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }

  res.json({ success: true, count: ideas.length, ideas });
});

// POST /api/ideas
router.post('/', verifyAuth, (req, res) => {
  const {
    title, summary, problemStatement, proposedSolution,
    category, targetAudience, requiredSkills, openRoles, tags
  } = req.body;

  if (!title || !problemStatement || !proposedSolution) {
    return res.status(400).json({ success: false, error: 'Title, problem statement, and solution are required.' });
  }

  const newIdea = {
    id: `idea-${Date.now()}`,
    title,
    summary: summary || title,
    problemStatement,
    proposedSolution,
    category: category || 'Technology',
    targetAudience: targetAudience || 'Campus Community',
    status: 'OPEN FOR CONTRIBUTION',
    creator: {
      id: req.user.username,
      name: req.user.name || req.user.username,
      avatar: (req.user.name || req.user.username).substring(0, 2).toUpperCase(),
      role: 'Idea Author',
      department: req.user.department || 'Computer Science'
    },
    tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
    requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
    openRoles: Array.isArray(openRoles) ? openRoles : [{ role: 'Developer', needed: 2, filled: 0 }],
    upvotes: 1,
    upvotedBy: [req.user.username],
    contributorsCount: 1,
    workspaceId: null,
    createdAt: new Date().toISOString()
  };

  // Automatically create a dedicated Workspace for this idea
  const newWorkspace = {
    id: `ws-${Date.now()}`,
    ideaId: newIdea.id,
    name: newIdea.title,
    description: newIdea.summary,
    category: newIdea.category,
    ownerId: req.user.username,
    progress: 10,
    status: 'Active Development',
    members: [
      {
        userId: req.user.username,
        name: req.user.name || req.user.username,
        role: 'Project Lead',
        avatar: newIdea.creator.avatar,
        joinedAt: new Date().toISOString()
      }
    ],
    createdAt: new Date().toISOString()
  };

  newIdea.workspaceId = newWorkspace.id;

  db.insert('ideas', newIdea);
  db.insert('workspaces', newWorkspace);

  res.status(201).json({
    success: true,
    message: 'Idea submitted and workspace initialized!',
    idea: newIdea,
    workspace: newWorkspace
  });
});

// POST /api/ideas/:id/upvote
router.post('/:id/upvote', verifyAuth, (req, res) => {
  const idea = db.findById('ideas', req.params.id);
  if (!idea) return res.status(404).json({ success: false, error: 'Idea not found.' });

  idea.upvotedBy = idea.upvotedBy || [];
  const u = req.user.username;
  const idx = idea.upvotedBy.indexOf(u);

  if (idx === -1) {
    idea.upvotedBy.push(u);
    idea.upvotes = (idea.upvotes || 0) + 1;
  } else {
    idea.upvotedBy.splice(idx, 1);
    idea.upvotes = Math.max(0, (idea.upvotes || 0) - 1);
  }

  db.save();
  res.json({ success: true, upvotes: idea.upvotes, upvotedBy: idea.upvotedBy });
});

// POST /api/ideas/:id/requests (Submit Contribution Request)
router.post('/:id/requests', verifyAuth, (req, res) => {
  const idea = db.findById('ideas', req.params.id);
  if (!idea) return res.status(404).json({ success: false, error: 'Idea not found.' });

  const { role, pitch, portfolioUrl, skills } = req.body;
  const newReq = {
    id: `req-${Date.now()}`,
    ideaId: idea.id,
    userId: req.user.username,
    userName: req.user.name || req.user.username,
    userDepartment: req.user.department || 'Computer Science',
    userAvatar: (req.user.name || req.user.username).substring(0, 2).toUpperCase(),
    appliedRole: role || 'Contributor',
    pitch: pitch || 'I am excited to build this project with the campus team!',
    portfolioUrl: portfolioUrl || '',
    skills: Array.isArray(skills) ? skills : [],
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  db.insert('contributionRequests', newReq);
  res.status(201).json({ success: true, message: 'Contribution request submitted!', request: newReq });
});

// PUT /api/ideas/:id/requests/:reqId (Accept / Reject)
router.put('/:id/requests/:reqId', verifyAuth, (req, res) => {
  const { status } = req.body; // 'accepted' or 'rejected'
  const request = db.findById('contributionRequests', req.params.reqId);
  if (!request) return res.status(404).json({ success: false, error: 'Request not found.' });

  request.status = status;

  if (status === 'accepted') {
    const idea = db.findById('ideas', request.ideaId);
    if (idea && idea.workspaceId) {
      const workspace = db.findById('workspaces', idea.workspaceId);
      if (workspace) {
        workspace.members = workspace.members || [];
        if (!workspace.members.some(m => m.userId === request.userId)) {
          workspace.members.push({
            userId: request.userId,
            name: request.userName,
            role: request.appliedRole,
            avatar: request.userAvatar,
            joinedAt: new Date().toISOString()
          });
        }
      }
    }
  }

  db.save();
  res.json({ success: true, message: `Request ${status} successfully!`, request });
});

export default router;
