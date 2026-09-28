import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/database.js';
import { generateToken, verifyAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { username, password, email, name, department, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password are required.' });
  }

  const users = db.data.users;
  if (users[username]) {
    return res.status(409).json({ success: false, error: 'Username is already taken.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const newUser = {
    id: `user-${Date.now()}`,
    username,
    name: name || username,
    email: email || `${username}@campushub.edu`,
    password: passwordHash,
    role: role || 'new_user',
    department: department || 'General Studies',
    skills: [],
    createdAt: new Date().toISOString()
  };

  users[username] = newUser;
  db.save();

  const token = generateToken(newUser);
  res.status(201).json({
    success: true,
    message: 'User registered successfully!',
    token,
    user: {
      username: newUser.username,
      name: newUser.name,
      role: newUser.role,
      email: newUser.email,
      department: newUser.department
    }
  });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password are required.' });
  }

  const user = db.data.users[username];
  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid username or credentials.' });
  }

  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, error: 'Invalid username or password.' });
  }

  const token = generateToken(user);
  res.json({
    success: true,
    token,
    user: {
      username: user.username,
      name: user.name || user.username,
      role: user.role,
      email: user.email,
      department: user.department,
      avatar: user.avatar,
      bio: user.bio,
      skills: user.skills || []
    }
  });
});

// GET /api/auth/me
router.get('/me', verifyAuth, (req, res) => {
  const user = db.data.users[req.user.username];
  if (!user) {
    return res.status(404).json({ success: false, error: 'User profile not found.' });
  }

  res.json({
    success: true,
    user: {
      username: user.username,
      name: user.name || user.username,
      role: user.role,
      email: user.email,
      department: user.department,
      avatar: user.avatar,
      bio: user.bio,
      skills: user.skills || []
    }
  });
});

// PUT /api/auth/profile
router.put('/profile', verifyAuth, (req, res) => {
  const { name, bio, department, skills, avatar } = req.body;
  const user = db.data.users[req.user.username];
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }

  if (name !== undefined) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (department !== undefined) user.department = department;
  if (skills !== undefined) user.skills = skills;
  if (avatar !== undefined) user.avatar = avatar;

  db.save();

  res.json({
    success: true,
    message: 'Profile updated successfully!',
    user: {
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email,
      department: user.department,
      avatar: user.avatar,
      bio: user.bio,
      skills: user.skills
    }
  });
});

// GET /api/auth/users (Admin Only)
router.get('/users', verifyAuth, requireRole('admin'), (req, res) => {
  const usersList = Object.values(db.data.users).map(u => ({
    username: u.username,
    name: u.name || u.username,
    email: u.email,
    role: u.role,
    department: u.department,
    createdAt: u.createdAt
  }));
  res.json({ success: true, users: usersList });
});

export default router;
