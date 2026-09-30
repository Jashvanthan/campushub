/**
 * CampusHub Frontend API Client
 * Seamlessly interfaces with the Python Flask Backend with JWT auth, smart caching, offline queue & retry.
 */

import { networkManager } from './networkManager';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export function parseJwt(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (_) {
    return null;
  }
}

export function isTokenExpired(token) {
  if (!token) return false;
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return false;
  // Expired if current time strictly exceeds the JWT exp timestamp
  return (Date.now() / 1000) > payload.exp;
}

function getAuthHeader() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('campushub_jwt_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}, config = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers
  };

  return await networkManager.smartFetch(url, {
    ...options,
    headers
  }, config);
}

export const api = {
  // ─── Health & Stats ───
  getHealth: () => request('/health'),
  getOverview: () => request('/stats/overview'),

  // ─── Authentication & Users ───
  login: (username, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  }, { allowOfflineQueue: false }),
  register: (payload) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  }, { allowOfflineQueue: false }),
  forgotPassword: (identifier) => request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ identifier })
  }, { allowOfflineQueue: false }),
  resetPassword: (payload) => request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload)
  }, { allowOfflineQueue: false }),
  getMe: () => request('/auth/me'),
  updateProfile: (profile) => request('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(profile)
  }),
  getAllUsers: (search = '', role = 'all') => {
    const params = new URLSearchParams();
    if (search) params.append('q', search);
    if (role && role !== 'all') params.append('role', role);
    return request(`/auth/users?${params.toString()}`);
  },
  getUserProfile: (username) => request(`/auth/users/${username}`),
  adminCreateUser: (payload) => request('/auth/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  adminUpdateUser: (username, updates) => request(`/auth/admin/users/${username}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  }),
  adminDeleteUser: (username) => request(`/auth/admin/users/${username}`, {
    method: 'DELETE'
  }),

  // ─── Search & Recommendations ───
  search: (query = '', limit = 20) => {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (limit) params.append('limit', limit);
    return request(`/search?${params.toString()}`);
  },
  trackSearch: (query) => request('/search/track', {
    method: 'POST',
    body: JSON.stringify({ query })
  }),
  getRecommendedPosts: (limit = 20) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    return request(`/posts/recommended?${params.toString()}`);
  },

  // ─── Posts & Events ───
  getPosts: (type = 'all', search = '') => {
    const params = new URLSearchParams();
    if (type && type !== 'all') params.append('type', type);
    if (search) params.append('q', search);
    return request(`/posts?${params.toString()}`);
  },
  getPost: (id) => request(`/posts/${id}`),
  createPost: (post) => request('/posts', {
    method: 'POST',
    body: JSON.stringify(post)
  }),
  updatePost: (id, updates) => request(`/posts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  }),
  deletePost: (id) => request(`/posts/${id}`, {
    method: 'DELETE'
  }),
  toggleLike: (id) => request(`/posts/${id}/like`, {
    method: 'POST'
  }),
  addComment: (id, text) => request(`/posts/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify({ text })
  }),
  deleteComment: (postId, commentId) => request(`/posts/${postId}/comments/${commentId}`, {
    method: 'DELETE'
  }),
  registerForEvent: (postId, regData) => request(`/posts/${postId}/register`, {
    method: 'POST',
    body: JSON.stringify(regData)
  }),

  // ─── Ideas Ecosystem ───
  getIdeas: (category = 'all', status = 'all', search = '') => {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (status && status !== 'all') params.append('status', status);
    if (search) params.append('q', search);
    return request(`/ideas?${params.toString()}`);
  },
  getIdea: (id) => request(`/ideas/${id}`),
  createIdea: (idea) => request('/ideas', {
    method: 'POST',
    body: JSON.stringify(idea)
  }),
  updateIdea: (id, updates) => request(`/ideas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  }),
  deleteIdea: (id) => request(`/ideas/${id}`, {
    method: 'DELETE'
  }),
  toggleSupport: (id) => request(`/ideas/${id}/support`, {
    method: 'POST'
  }),
  toggleFollow: (id) => request(`/ideas/${id}/follow`, {
    method: 'POST'
  }),

  // ─── Contribution Requests ───
  getContributionRequests: (ideaId = null, status = null) => {
    const params = new URLSearchParams();
    if (ideaId) params.append('ideaId', ideaId);
    if (status) params.append('status', status);
    return request(`/ideas/requests?${params.toString()}`);
  },
  submitContributionRequest: (ideaId, payload) => request(`/ideas/${ideaId}/requests`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  respondContributionRequest: (reqId, action) => request(`/ideas/requests/${reqId}/respond`, {
    method: 'POST',
    body: JSON.stringify({ action })
  }),

  // ─── Workspaces Platform ───
  getWorkspaces: (category = 'all', search = '') => {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (search) params.append('q', search);
    return request(`/workspaces?${params.toString()}`);
  },
  getWorkspaceDetails: (workspaceId) => request(`/workspaces/${workspaceId}`),
  createWorkspace: (workspace) => request('/workspaces', {
    method: 'POST',
    body: JSON.stringify(workspace)
  }),
  updateWorkspace: (workspaceId, updates) => request(`/workspaces/${workspaceId}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  }),
  leaveWorkspace: (workspaceId) => request(`/workspaces/${workspaceId}/leave`, {
    method: 'POST'
  }),

  // Tasks
  getTasks: (workspaceId) => request(`/workspaces/${workspaceId}/tasks`),
  createTask: (workspaceId, task) => request(`/workspaces/${workspaceId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(task)
  }),
  updateTask: (workspaceId, taskId, updates) => request(`/workspaces/${workspaceId}/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  }),
  deleteTask: (workspaceId, taskId) => request(`/workspaces/${workspaceId}/tasks/${taskId}`, {
    method: 'DELETE'
  }),

  // Milestones
  createMilestone: (workspaceId, milestone) => request(`/workspaces/${workspaceId}/milestones`, {
    method: 'POST',
    body: JSON.stringify(milestone)
  }),
  updateMilestone: (workspaceId, milestoneId, updates) => request(`/workspaces/${workspaceId}/milestones/${milestoneId}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  }),
  deleteMilestone: (workspaceId, milestoneId) => request(`/workspaces/${workspaceId}/milestones/${milestoneId}`, {
    method: 'DELETE'
  }),

  // Discussions
  createDiscussion: (workspaceId, discussion) => request(`/workspaces/${workspaceId}/discussions`, {
    method: 'POST',
    body: JSON.stringify(discussion)
  }),
  replyDiscussion: (workspaceId, discussionId, text) => request(`/workspaces/${workspaceId}/discussions/${discussionId}/replies`, {
    method: 'POST',
    body: JSON.stringify({ text })
  }),

  // Chat
  getChatMessages: (workspaceId, channel = null) => {
    const params = new URLSearchParams();
    if (channel) params.append('channel', channel);
    return request(`/workspaces/${workspaceId}/chat?${params.toString()}`);
  },
  sendChatMessage: (workspaceId, payload) => request(`/workspaces/${workspaceId}/chat`, {
    method: 'POST',
    body: JSON.stringify(typeof payload === 'string' ? { message: payload } : payload)
  }),
  reactChatMessage: (workspaceId, messageId, emoji) => request(`/workspaces/${workspaceId}/chat/${messageId}/react`, {
    method: 'POST',
    body: JSON.stringify({ emoji })
  }),
  deleteChatMessage: (workspaceId, messageId) => request(`/workspaces/${workspaceId}/chat/${messageId}`, {
    method: 'DELETE'
  }),
  clearAllChatMessages: (workspaceId, channel = null) => {
    const params = new URLSearchParams();
    if (channel) params.append('channel', channel);
    return request(`/workspaces/${workspaceId}/chat/clear?${params.toString()}`, {
      method: 'DELETE'
    });
  },

  // Files
  addFile: (workspaceId, fileData) => request(`/workspaces/${workspaceId}/files`, {
    method: 'POST',
    body: JSON.stringify(fileData)
  }),
  deleteFile: (workspaceId, fileId) => request(`/workspaces/${workspaceId}/files/${fileId}`, {
    method: 'DELETE'
  }),

  // ─── Notifications ───
  getNotifications: () => request('/notifications'),
  createNotification: (payload) => request('/notifications', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  markNotificationRead: (notifId) => request(`/notifications/${notifId}/read`, {
    method: 'PUT'
  }),
  markAllNotificationsRead: () => request('/notifications/read-all', {
    method: 'PUT'
  }),
  deleteNotification: (notifId) => request(`/notifications/${notifId}`, {
    method: 'DELETE'
  }),
  clearNotifications: () => request('/notifications/clear', {
    method: 'DELETE'
  })
};
