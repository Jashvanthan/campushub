import React, { useState, useMemo } from 'react';
import {
  Briefcase, CheckSquare, Target, MessageSquare, FileText,
  Users, Activity, Sparkles, ChevronDown, Plus, ArrowLeft,
  Layers, ExternalLink, Settings, CheckCircle2, MessageCircle,
  Terminal as TerminalIcon, LogOut, Lock, Shield, UserPlus
} from 'lucide-react';
import { usePopup } from '../common/PopupDialog';
import WorkspaceOverview from './WorkspaceOverview';
import WorkspaceTasks from './WorkspaceTasks';
import WorkspaceMilestones from './WorkspaceMilestones';
import WorkspaceDiscussions from './WorkspaceDiscussions';
import WorkspaceFiles from './WorkspaceFiles';
import WorkspaceMembers from './WorkspaceMembers';
import WorkspaceActivity from './WorkspaceActivity';
import WorkspaceChat from './WorkspaceChat';
import WorkspaceTerminal from './WorkspaceTerminal';
import NewTaskModal from './NewTaskModal';

const WORKSPACE_TABS = [
  { id: 'overview', label: 'Overview', icon: Sparkles },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'milestones', label: 'Milestones', icon: Target },
  { id: 'chat', label: 'Team Chat', icon: MessageCircle },
  { id: 'terminal', label: 'Code Terminal', icon: TerminalIcon },
  { id: 'discussions', label: 'Discussions', icon: MessageSquare },
  { id: 'files', label: 'Files & Docs', icon: FileText },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'activity', label: 'Activity', icon: Activity }
];

export default function WorkspacesPage({
  workspaces = [],
  ideas = [],
  tasks = [],
  milestones = [],
  discussions = [],
  files = [],
  activities = [],
  chatMessages = [],
  currentUser,
  activeWorkspaceId,
  onSelectWorkspace,
  onNavigateToIdeas,
  onLeaveWorkspace,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAddMilestone,
  onUpdateMilestone,
  onDeleteMilestone,
  onAddDiscussion,
  onUpdateDiscussion,
  onAddFile,
  onDeleteFile,
  onUpdateMemberRole,
  onSendMessage,
  onDeleteMessage,
  onClearAllMessages,
  onReactMessage
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [activeSnippetForTerminal, setActiveSnippetForTerminal] = useState(null);

  // ─── Strict Rule: Active Idea Validation ───
  const activeIdeaIds = useMemo(() => new Set((ideas || []).map(i => i.id)), [ideas]);

  // Valid workspaces (must have an active idea in ideas list and not be CLOSED)
  const validWorkspaces = useMemo(() => {
    return (workspaces || []).filter(ws => {
      if (ws.status === 'CLOSED') return false;
      if (ws.ideaId && !activeIdeaIds.has(ws.ideaId)) return false;
      return true;
    });
  }, [workspaces, activeIdeaIds]);

  // Filter user's workspaces
  const myWorkspaces = useMemo(() => {
    return validWorkspaces.filter(ws =>
      (ws.members || []).some(m => m.userId === currentUser?.username) ||
      ws.ownerId === currentUser?.username ||
      currentUser?.role === 'admin'
    );
  }, [validWorkspaces, currentUser]);

  // Selected workspace
  const activeWorkspace = useMemo(() => {
    if (activeWorkspaceId) {
      const found = validWorkspaces.find(w => w.id === activeWorkspaceId);
      if (found) return found;
    }
    return myWorkspaces[0] || validWorkspaces[0] || null;
  }, [validWorkspaces, activeWorkspaceId, myWorkspaces]);

  const { showConfirm } = usePopup();

  const isMember = useMemo(() => {
    if (!activeWorkspace || !currentUser) return false;
    return (
      currentUser.role === 'admin' ||
      activeWorkspace.ownerId === currentUser.username ||
      activeWorkspace.lead_id === currentUser.username ||
      (activeWorkspace.members || []).some(m => m.userId === currentUser.username || m.username === currentUser.username)
    );
  }, [activeWorkspace, currentUser]);

  const isOwner = useMemo(() => {
    if (!activeWorkspace || !currentUser) return false;
    return activeWorkspace.ownerId === currentUser.username || activeWorkspace.lead_id === currentUser.username;
  }, [activeWorkspace, currentUser]);

  // Check if user specifically requested a workspace whose idea was deleted
  const isRequestedWorkspaceClosed = useMemo(() => {
    if (!activeWorkspaceId) return false;
    const requestedWs = (workspaces || []).find(w => w.id === activeWorkspaceId);
    if (!requestedWs) return false;
    if (requestedWs.status === 'CLOSED') return true;
    if (requestedWs.ideaId && !activeIdeaIds.has(requestedWs.ideaId)) return true;
    return false;
  }, [workspaces, activeWorkspaceId, activeIdeaIds]);

  // Workspace sub-entities
  const wsTasks = useMemo(() => {
    if (!activeWorkspace) return [];
    return tasks.filter(t => t.workspaceId === activeWorkspace.id);
  }, [tasks, activeWorkspace]);

  const wsMilestones = useMemo(() => {
    if (!activeWorkspace) return [];
    return milestones.filter(m => m.workspaceId === activeWorkspace.id);
  }, [milestones, activeWorkspace]);

  const wsDiscussions = useMemo(() => {
    if (!activeWorkspace) return [];
    return discussions.filter(d => d.workspaceId === activeWorkspace.id);
  }, [discussions, activeWorkspace]);

  const wsFiles = useMemo(() => {
    if (!activeWorkspace) return [];
    return files.filter(f => f.workspaceId === activeWorkspace.id);
  }, [files, activeWorkspace]);

  const wsActivities = useMemo(() => {
    if (!activeWorkspace) return [];
    return activities.filter(a => a.workspaceId === activeWorkspace.id);
  }, [activities, activeWorkspace]);

  const wsChatMessages = useMemo(() => {
    if (!activeWorkspace) return [];
    return chatMessages.filter(m => m.workspaceId === activeWorkspace.id);
  }, [chatMessages, activeWorkspace]);

  const handleOpenInTerminal = (snippet) => {
    setActiveSnippetForTerminal(snippet);
    setActiveTab('terminal');
  };

  const handleShareTerminalToChat = (chatPayload) => {
    if (!onSendMessage) return;
    onSendMessage({
      id: `chat-${Date.now()}`,
      workspaceId: activeWorkspace.id,
      channel: 'dev-engineers',
      senderId: currentUser?.username || 'user',
      senderName: currentUser?.name || 'CurrentUser',
      senderAvatar: (currentUser?.name || 'CU').substring(0, 2).toUpperCase(),
      senderRole: (activeWorkspace.members || []).find(m => m.userId === currentUser?.username)?.role || 'Contributor',
      content: chatPayload.content,
      codeSnippet: chatPayload.codeSnippet,
      timestamp: new Date().toISOString(),
      reactions: {}
    });
    setActiveTab('chat');
  };

  if (isRequestedWorkspaceClosed) {
    return (
      <div className="workspace-page-container stagger-in">
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto', color: '#f87171' }}>
            <Layers size={34} />
          </div>
          <h2 style={{ color: '#fff', fontSize: '1.6rem', marginBottom: '0.6rem' }}>Workspace Closed & Inaccessible</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0.5rem auto 1.75rem auto', lineHeight: 1.6 }}>
            This workspace cannot be opened because its associated campus idea was removed or closed. Workspace access terminates when an idea is deleted.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="primary-btn pulse-hover" onClick={onNavigateToIdeas}>
              Explore Active Ideas
            </button>
            {validWorkspaces.length > 0 && (
              <button className="secondary-btn" onClick={() => onSelectWorkspace(validWorkspaces[0].id)}>
                Go to Active Workspace ({validWorkspaces.length})
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!activeWorkspace) {
    return (
      <div className="workspace-page-container stagger-in">
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <Briefcase size={54} color="var(--accent-primary)" style={{ margin: '0 auto 1.5rem auto' }} />
          <h2>No Active Workspaces Found</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0.5rem auto 1.5rem auto' }}>
            Workspaces are automatically created when you submit an idea or get accepted to collaborate on campus projects.
          </p>
          <button className="primary-btn pulse-hover" onClick={onNavigateToIdeas}>
            Explore Campus Ideas &amp; Projects
          </button>
        </div>
      </div>
    );
  }

  // Access Control: Non-members cannot enter private workspaces
  if (!isMember) {
    return (
      <div className="workspace-page-container stagger-in">
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto', color: 'var(--accent-primary)' }}>
            <Shield size={34} />
          </div>
          <h2 style={{ color: '#fff', fontSize: '1.6rem', marginBottom: '0.6rem' }}>Private Team Workspace</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '540px', margin: '0.5rem auto 1.75rem auto', lineHeight: 1.6 }}>
            You are not an active contributor in <strong>{activeWorkspace.name}</strong>. Team tasks, documents, and discussions are restricted to approved members.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="primary-btn pulse-hover" onClick={onNavigateToIdeas}>
              <UserPlus size={16} /> Request to Join on Ideas Page
            </button>
            {myWorkspaces.length > 0 && (
              <button className="secondary-btn" onClick={() => onSelectWorkspace(myWorkspaces[0].id)}>
                Go to My Workspace ({myWorkspaces.length})
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-page-container stagger-in" id="workspace-page">
      {/* Workspace Header & Switcher */}
      <div className="workspace-header glass-panel">
        <div className="workspace-header-top">
          <div className="workspace-header-info-group">
            <div className="workspace-title-row">
              <div className="workspace-badge-icon">
                <Briefcase size={20} />
              </div>

              {/* Workspace dropdown selector */}
              <div className="workspace-selector-dropdown">
                <select
                  className="form-control workspace-select-box"
                  value={activeWorkspace.id}
                  onChange={(e) => onSelectWorkspace(e.target.value)}
                >
                  <optgroup label="My Workspaces">
                    {myWorkspaces.map(ws => (
                      <option key={ws.id} value={ws.id}>
                        {ws.name} ({ws.members?.length || 1} members)
                      </option>
                    ))}
                  </optgroup>
                  {validWorkspaces.filter(ws => !myWorkspaces.some(m => m.id === ws.id)).length > 0 && (
                    <optgroup label="Other Campus Workspaces">
                      {validWorkspaces.filter(ws => !myWorkspaces.some(m => m.id === ws.id)).map(ws => (
                        <option key={ws.id} value={ws.id}>
                          {ws.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            </div>

            <div className="workspace-header-meta-row">
              <span className="idea-category-tag">
                <Layers size={13} /> {activeWorkspace.category || 'Technology'}
              </span>
            </div>
          </div>

          <div className="workspace-header-actions-group" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {isMember && !isOwner && onLeaveWorkspace && (
              <button
                className="secondary-btn workspace-leave-btn"
                style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.35)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.9rem', borderRadius: '8px' }}
                onClick={async () => {
                  const confirmed = await showConfirm(
                    `Are you sure you want to leave "${activeWorkspace.name}"? You will lose access to team discussions, tasks, and chat. If you want to rejoin later, you will need to submit a new contribution request.`,
                    'Leave Workspace',
                    { isDanger: true, confirmText: 'Yes, Leave Workspace' }
                  );
                  if (confirmed) {
                    onLeaveWorkspace(activeWorkspace.id);
                  }
                }}
                title="Leave this workspace"
              >
                <LogOut size={14} /> <span>Leave Workspace</span>
              </button>
            )}

            <button
              className="secondary-btn workspace-back-btn"
              onClick={onNavigateToIdeas}
            >
              <ArrowLeft size={14} /> <span>Back to Ideas</span>
            </button>
          </div>
        </div>

        {/* Description line */}
        <p className="workspace-header-desc">
          {activeWorkspace.description || 'Collaborative team workspace for student campus innovation.'}
        </p>

        {/* Tab Navigation Menu */}
        <div className="workspace-tabs-nav">
          {WORKSPACE_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            let badge = null;
            if (tab.id === 'tasks') badge = wsTasks.length;
            if (tab.id === 'milestones') badge = wsMilestones.length;
            if (tab.id === 'chat') badge = wsChatMessages.length;
            if (tab.id === 'discussions') badge = wsDiscussions.length;
            if (tab.id === 'files') badge = wsFiles.length;
            if (tab.id === 'members') badge = (activeWorkspace.members || []).length;

            return (
              <button
                key={tab.id}
                type="button"
                className={`workspace-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
                {badge !== null && badge > 0 && (
                  <span className="tab-pill-badge">{badge}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Workspace Body Tab Content */}
      <div className="workspace-content-body">
        {activeTab === 'overview' && (
          <WorkspaceOverview
            workspace={activeWorkspace}
            tasks={wsTasks}
            milestones={wsMilestones}
            discussions={wsDiscussions}
            files={wsFiles}
            activities={wsActivities}
            currentUser={currentUser}
            onNavigateTab={(t) => setActiveTab(t)}
            onOpenNewTask={() => setShowNewTaskModal(true)}
          />
        )}

        {activeTab === 'tasks' && (
          <WorkspaceTasks
            workspace={activeWorkspace}
            tasks={wsTasks}
            currentUser={currentUser}
            onAddTask={onAddTask}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
          />
        )}

        {activeTab === 'milestones' && (
          <WorkspaceMilestones
            workspace={activeWorkspace}
            milestones={wsMilestones}
            currentUser={currentUser}
            onAddMilestone={onAddMilestone}
            onUpdateMilestone={onUpdateMilestone}
            onDeleteMilestone={onDeleteMilestone}
          />
        )}

        {activeTab === 'chat' && (
          <WorkspaceChat
            workspace={activeWorkspace}
            chatMessages={chatMessages}
            currentUser={currentUser}
            onSendMessage={onSendMessage}
            onDeleteMessage={onDeleteMessage}
            onClearAllMessages={onClearAllMessages}
            onReactMessage={onReactMessage}
            onOpenInTerminal={handleOpenInTerminal}
          />
        )}

        {activeTab === 'terminal' && (
          <WorkspaceTerminal
            workspace={activeWorkspace}
            currentUser={currentUser}
            tasks={wsTasks}
            initialSnippet={activeSnippetForTerminal}
            onShareToChat={handleShareTerminalToChat}
          />
        )}

        {activeTab === 'discussions' && (
          <WorkspaceDiscussions
            workspace={activeWorkspace}
            discussions={wsDiscussions}
            currentUser={currentUser}
            onAddDiscussion={onAddDiscussion}
            onUpdateDiscussion={onUpdateDiscussion}
          />
        )}

        {activeTab === 'files' && (
          <WorkspaceFiles
            workspace={activeWorkspace}
            files={wsFiles}
            currentUser={currentUser}
            onAddFile={onAddFile}
            onDeleteFile={onDeleteFile}
          />
        )}

        {activeTab === 'members' && (
          <WorkspaceMembers
            workspace={activeWorkspace}
            currentUser={currentUser}
            onUpdateMemberRole={onUpdateMemberRole}
            onLeaveWorkspace={onLeaveWorkspace}
          />
        )}

        {activeTab === 'activity' && (
          <WorkspaceActivity
            activities={wsActivities}
          />
        )}
      </div>

      {/* Direct New Task Modal if opened from Overview */}
      {showNewTaskModal && (
        <NewTaskModal
          workspace={activeWorkspace}
          members={activeWorkspace.members || []}
          onSubmit={(taskData) => {
            onAddTask(taskData);
            setShowNewTaskModal(false);
          }}
          onClose={() => setShowNewTaskModal(false)}
        />
      )}
    </div>
  );
}
