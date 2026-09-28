import React, { useState, useMemo } from 'react';
import {
  Lightbulb, Plus, Search, Filter, Sparkles, TrendingUp,
  Clock, ThumbsUp, MessageSquare, Layers, Check, X, SlidersHorizontal, UserCheck
} from 'lucide-react';
import IdeaCard from './IdeaCard';
import SubmitIdeaModal from './SubmitIdeaModal';
import IdeaDetailModal from './IdeaDetailModal';
import JoinContributionModal from './JoinContributionModal';
import ManageRequestsModal from './ManageRequestsModal';
import { CATEGORIES, IDEA_STATUSES, SKILLS_LIST } from '../../data/seedIdeasAndWorkspaces';

export default function IdeasPage({
  ideas = [],
  workspaces = [],
  contributionRequests = [],
  currentUser,
  onAddIdea,
  onUpdateIdea,
  onDeleteIdea,
  onToggleSupport,
  onToggleFollow,
  onSubmitContributionRequest,
  onAcceptContributionRequest,
  onRejectContributionRequest,
  onNavigateToWorkspace
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedSkill, setSelectedSkill] = useState('All');
  const [sortBy, setSortBy] = useState('latest');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Modals state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedIdeaDetail, setSelectedIdeaDetail] = useState(null);
  const [joinModalIdea, setJoinModalIdea] = useState(null);
  const [manageRequestsIdea, setManageRequestsIdea] = useState(null);

  // Filtered & Sorted ideas
  const filteredIdeas = useMemo(() => {
    return ideas.filter(idea => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = idea.title?.toLowerCase().includes(q);
        const matchesProblem = idea.problem?.toLowerCase().includes(q);
        const matchesCreator = idea.creatorName?.toLowerCase().includes(q) || idea.creatorId?.toLowerCase().includes(q);
        const matchesTags = (idea.tags || []).some(t => t.toLowerCase().includes(q));
        const matchesSkills = (idea.skillsRequired || []).some(s => s.toLowerCase().includes(q));
        if (!matchesTitle && !matchesProblem && !matchesCreator && !matchesTags && !matchesSkills) {
          return false;
        }
      }

      // Category
      if (selectedCategory !== 'All' && idea.category !== selectedCategory) {
        return false;
      }

      // Status
      if (selectedStatus !== 'All' && idea.status !== selectedStatus) {
        return false;
      }

      // Skill
      if (selectedSkill !== 'All' && !(idea.skillsRequired || []).includes(selectedSkill)) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'latest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'support') {
        return (b.supportCount || (b.supportedBy || []).length || 0) - (a.supportCount || (a.supportedBy || []).length || 0);
      }
      if (sortBy === 'progress') {
        return (b.progress || 0) - (a.progress || 0);
      }
      if (sortBy === 'updated') {
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
      }
      return 0;
    });
  }, [ideas, searchQuery, selectedCategory, selectedStatus, selectedSkill, sortBy]);

  // Handle Idea Detail sync if modified
  const currentDetailIdea = useMemo(() => {
    if (!selectedIdeaDetail) return null;
    return ideas.find(i => i.id === selectedIdeaDetail.id) || selectedIdeaDetail;
  }, [ideas, selectedIdeaDetail]);

  const activeWorkspaceForDetail = useMemo(() => {
    if (!currentDetailIdea?.workspaceId) return null;
    return workspaces.find(w => w.id === currentDetailIdea.workspaceId);
  }, [workspaces, currentDetailIdea]);

  return (
    <div className="ideas-page-container stagger-in" id="ideas-page">
      {/* Top Banner Header */}
      <div className="ideas-hero glass-panel">
        <div className="ideas-hero-content">
          <div className="ideas-hero-badge">
            <Sparkles size={16} /> Campus Collaboration Engine
          </div>
          <h1 className="ideas-hero-title">Ideas &amp; Contributions</h1>
          <p className="ideas-hero-subtitle">
            Turn campus ideas into real projects through student collaboration, task management, and team workspaces.
          </p>
        </div>

        <div className="ideas-hero-actions">
          <button
            className="primary-btn pulse-hover ideas-submit-cta"
            onClick={() => setShowSubmitModal(true)}
          >
            <Plus size={18} /> Submit an Idea
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="ideas-toolbar glass-panel">
        <div className="ideas-search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="ideas-search-input"
            placeholder="Search ideas by title, problem, tags, creator or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter controls row */}
        <div className="ideas-filters-row">
          {/* Category Dropdown */}
          <div className="filter-select-wrapper">
            <label className="filter-label">Category</label>
            <select
              className="form-control filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="filter-select-wrapper">
            <label className="filter-label">Lifecycle Status</label>
            <select
              className="form-control filter-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              {IDEA_STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Skill Filter Dropdown */}
          <div className="filter-select-wrapper">
            <label className="filter-label">Skill</label>
            <select
              className="form-control filter-select"
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
            >
              <option value="All">All Skills</option>
              {SKILLS_LIST.map(sk => (
                <option key={sk} value={sk}>{sk}</option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="filter-select-wrapper">
            <label className="filter-label">Sort By</label>
            <select
              className="form-control filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="latest">Latest Ideas</option>
              <option value="support">Most Supported</option>
              <option value="progress">Highest Progress</option>
              <option value="updated">Recently Updated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active filters pill list */}
      {(selectedCategory !== 'All' || selectedStatus !== 'All' || selectedSkill !== 'All' || searchQuery) && (
        <div className="active-filters-bar">
          <span className="active-filters-title">Active Filters:</span>
          {selectedCategory !== 'All' && (
            <span className="active-filter-chip">
              Category: {selectedCategory}
              <button onClick={() => setSelectedCategory('All')}><X size={12} /></button>
            </span>
          )}
          {selectedStatus !== 'All' && (
            <span className="active-filter-chip">
              Status: {selectedStatus}
              <button onClick={() => setSelectedStatus('All')}><X size={12} /></button>
            </span>
          )}
          {selectedSkill !== 'All' && (
            <span className="active-filter-chip">
              Skill: {selectedSkill}
              <button onClick={() => setSelectedSkill('All')}><X size={12} /></button>
            </span>
          )}
          {searchQuery && (
            <span className="active-filter-chip">
              "{searchQuery}"
              <button onClick={() => setSearchQuery('')}><X size={12} /></button>
            </span>
          )}
          <button
            className="clear-all-filters-btn"
            onClick={() => {
              setSelectedCategory('All');
              setSelectedStatus('All');
              setSelectedSkill('All');
              setSearchQuery('');
            }}
          >
            Clear All
          </button>
        </div>
      )}

      {/* Ideas Card Grid */}
      <div className="ideas-grid">
        {filteredIdeas.length > 0 ? (
          filteredIdeas.map(idea => {
            const pendingReqs = contributionRequests.filter(r => r.ideaId === idea.id && r.status === 'PENDING').length;
            return (
              <IdeaCard
                key={idea.id}
                idea={idea}
                workspaces={workspaces}
                currentUser={currentUser}
                pendingRequestCount={pendingReqs}
                onViewDetails={(i) => setSelectedIdeaDetail(i)}
                onJoinClick={(i) => setJoinModalIdea(i)}
                onToggleSupport={onToggleSupport}
                onToggleFollow={onToggleFollow}
                onNavigateToWorkspace={onNavigateToWorkspace}
                onDeleteIdea={onDeleteIdea}
              />
            );
          })
        ) : (
          <div className="ideas-empty-state glass-panel">
            <Lightbulb size={48} className="idea-empty-icon" />
            <h2>No ideas matched your criteria</h2>
            <p>
              {searchQuery || selectedCategory !== 'All' || selectedStatus !== 'All' || selectedSkill !== 'All'
                ? 'Try adjusting your filters or search keywords to find other campus projects.'
                : 'Have an innovative idea that could improve campus life? Be the first to start a project!'}
            </p>
            <button
              className="primary-btn pulse-hover"
              onClick={() => setShowSubmitModal(true)}
              style={{ marginTop: '1rem' }}
            >
              <Plus size={18} /> Submit Your First Idea
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showSubmitModal && (
        <SubmitIdeaModal
          user={currentUser}
          onSubmit={(newIdea, newWorkspace) => {
            onAddIdea(newIdea, newWorkspace);
            setShowSubmitModal(false);
          }}
          onClose={() => setShowSubmitModal(false)}
        />
      )}

      {currentDetailIdea && (
        <IdeaDetailModal
          idea={currentDetailIdea}
          currentUser={currentUser}
          workspace={activeWorkspaceForDetail}
          pendingRequestCount={contributionRequests.filter(r => r.ideaId === currentDetailIdea.id && r.status === 'PENDING').length}
          onClose={() => setSelectedIdeaDetail(null)}
          onJoinClick={(i) => {
            setSelectedIdeaDetail(null);
            setJoinModalIdea(i);
          }}
          onToggleSupport={onToggleSupport}
          onToggleFollow={onToggleFollow}
          onNavigateToWorkspace={(wsId) => {
            setSelectedIdeaDetail(null);
            onNavigateToWorkspace(wsId);
          }}
          onManageRequests={(i) => {
            setSelectedIdeaDetail(null);
            setManageRequestsIdea(i);
          }}
          onUpdateStatus={onUpdateIdea}
          onDeleteIdea={onDeleteIdea}
        />
      )}

      {joinModalIdea && (
        <JoinContributionModal
          idea={joinModalIdea}
          user={currentUser}
          onSubmit={(req) => {
            onSubmitContributionRequest(req);
            setJoinModalIdea(null);
          }}
          onClose={() => setJoinModalIdea(null)}
        />
      )}

      {manageRequestsIdea && (
        <ManageRequestsModal
          idea={manageRequestsIdea}
          requests={contributionRequests}
          onAccept={(req) => {
            onAcceptContributionRequest(req);
          }}
          onReject={(reqId) => {
            onRejectContributionRequest(reqId);
          }}
          onClose={() => setManageRequestsIdea(null)}
        />
      )}
    </div>
  );
}
