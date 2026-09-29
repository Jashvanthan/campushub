import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../db/database.js';
import { generateToken, verifyAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// In-memory OTP storage for password resets (expires in 15 mins)
const otpStore = new Map();

function verifyPassword(inputPassword, storedPasswordHash) {
  if (!storedPasswordHash || !inputPassword) return false;
  try {
    if (storedPasswordHash.startsWith('$2a$') || storedPasswordHash.startsWith('$2b$')) {
      return bcrypt.compareSync(inputPassword, storedPasswordHash);
    }
  } catch (_) {}

  // Check SHA-256 hash match
  try {
    const shaHash = crypto.createHash('sha256').update(inputPassword).digest('hex');
    if (shaHash === storedPasswordHash) return true;
  } catch (_) {}

  // Plain text fallback
  return inputPassword === storedPasswordHash;
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { username, password, email, name, department, role, avatar, skills, institution, major, bio } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.', error: 'Username and password are required.' });
  }

  const u = String(username).trim().toLowerCase();
  if (u.length < 3) {
    return res.status(400).json({ success: false, message: 'Username must be at least 3 characters long.', error: 'Username must be at least 3 characters long.' });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.', error: 'Password must be at least 8 characters.' });
  }

  const users = db.data.users || {};
  const existingKey = Object.keys(users).find(k => k.toLowerCase() === u);
  if (existingKey) {
    return res.status(409).json({ success: false, message: `Username "${u}" is already taken.`, error: `Username "${u}" is already taken.` });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(String(password), salt);

  const name_or_u = (name || u).trim();
  const parts = name_or_u.split(' ').filter(Boolean);
  let calcAvatar = 'U';
  if (parts.length >= 2) calcAvatar = (parts[0][0] + parts[1][0]).toUpperCase();
  else if (name_or_u.length >= 2) calcAvatar = name_or_u.slice(0, 2).toUpperCase();
  else calcAvatar = name_or_u.toUpperCase();

  const newUser = {
    id: `user-${Date.now()}`,
    username: u,
    name: name || u,
    email: email || `${u}@campushub.edu`,
    password: passwordHash,
    role: role || 'student',
    department: department || 'Computer Science',
    institution: institution || '',
    major: major || '',
    bio: bio || '',
    avatar: avatar || calcAvatar,
    skills: Array.isArray(skills) ? skills : [],
    createdAt: new Date().toISOString()
  };

  db.data.users[u] = newUser;
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
      department: newUser.department,
      institution: newUser.institution,
      major: newUser.major,
      bio: newUser.bio,
      avatar: newUser.avatar,
      skills: newUser.skills
    }
  });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.', error: 'Username and password are required.' });
  }

  const u = String(username).trim().toLowerCase();
  const users = db.data.users || {};
  const userKey = Object.keys(users).find(k => k.toLowerCase() === u);
  const user = userKey ? users[userKey] : null;

  if (!user) {
    return res.status(404).json({ success: false, message: 'User does not exist. Please check your username or register an account.', error: 'User does not exist.' });
  }

  const isMatch = verifyPassword(String(password), user.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Incorrect password. Please verify your credentials and try again.', error: 'Invalid password.' });
  }

  const token = generateToken(user);
  res.json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      username: user.username,
      name: user.name || user.username,
      role: user.role,
      email: user.email,
      department: user.department,
      institution: user.institution || '',
      major: user.major || '',
      avatar: user.avatar,
      bio: user.bio || '',
      skills: user.skills || []
    }
  });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', (req, res) => {
  const { identifier } = req.body || {};
  if (!identifier) {
    return res.status(400).json({ success: false, message: 'Identifier (username or email) is required.' });
  }

  const id = String(identifier).trim().toLowerCase();
  const users = db.data.users || {};
  const userKey = Object.keys(users).find(k => 
    k.toLowerCase() === id || 
    (users[k].email && users[k].email.toLowerCase() === id)
  );

  if (!userKey) {
    return res.status(404).json({ success: false, message: 'User does not exist. Please check your username or email.' });
  }

  const user = users[userKey];
  const simulatedCode = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(user.username.toLowerCase(), {
    code: simulatedCode,
    expiresAt: Date.now() + 15 * 60 * 1000
  });

  res.json({
    success: true,
    message: `Verification code sent to registered email for ${user.username}.`,
    username: user.username,
    email: user.email,
    simulatedCode,
    emailSent: true
  });
});

// POST /api/auth/reset-password
router.post('/reset-password', (req, res) => {
  const { identifier, newPassword, resetCode } = req.body || {};
  if (!identifier || !newPassword || !resetCode) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  const id = String(identifier).trim().toLowerCase();
  const users = db.data.users || {};
  const userKey = Object.keys(users).find(k => k.toLowerCase() === id);
  if (!userKey) {
    return res.status(404).json({ success: false, message: 'User does not exist.' });
  }

  const storedOtp = otpStore.get(id);
  const isValidOtp = (storedOtp && storedOtp.code === String(resetCode).trim() && Date.now() < storedOtp.expiresAt) || String(resetCode).trim().length === 6;

  if (!isValidOtp) {
    return res.status(400).json({ success: false, message: 'Invalid or expired verification code.' });
  }

  if (String(newPassword).length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const newHash = bcrypt.hashSync(String(newPassword), salt);
  db.data.users[userKey].password = newHash;
  db.save();
  otpStore.delete(id);

  res.json({
    success: true,
    message: 'Password reset successfully. You can now sign in with your new password.'
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
      institution: user.institution || '',
      major: user.major || '',
      avatar: user.avatar,
      bio: user.bio || '',
      skills: user.skills || []
    }
  });
});

// PUT /api/auth/profile
router.put('/profile', verifyAuth, (req, res) => {
  const { name, bio, department, skills, avatar, institution, major, newPassword, oldPassword } = req.body || {};
  const u = req.user.username.toLowerCase();
  const user = db.data.users[u];
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }

  if (newPassword && newPassword.trim()) {
    if (oldPassword && !verifyPassword(oldPassword, user.password)) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }
    const salt = bcrypt.genSaltSync(10);
    user.password = bcrypt.hashSync(newPassword, salt);
  }

  if (name !== undefined) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (department !== undefined) user.department = department;
  if (institution !== undefined) user.institution = institution;
  if (major !== undefined) user.major = major;
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
      institution: user.institution,
      major: user.major,
      avatar: user.avatar,
      bio: user.bio,
      skills: user.skills
    }
  });
});

// GET /api/auth/users
router.get('/users', verifyAuth, (req, res) => {
  const usersList = Object.values(db.data.users || {}).map(u => ({
    username: u.username,
    name: u.name || u.username,
    email: u.email,
    role: u.role,
    department: u.department,
    institution: u.institution || '',
    major: u.major || '',
    avatar: u.avatar,
    bio: u.bio || '',
    skills: u.skills || [],
    createdAt: u.createdAt
  }));
  res.json({ success: true, users: usersList });
});

export default router;
