import React from 'react';
import {
  Code2, Calendar, Flag, Lightbulb, Megaphone, Trophy,
  HelpCircle, Search, Briefcase, Users, FileText
} from 'lucide-react';

export const POST_TYPES = [
  { id: 'project', label: 'Project', icon: Code2, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', desc: 'Showcase code & innovations' },
  { id: 'event', label: 'Event', icon: Calendar, color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', desc: 'Hackathons, seminars & workshops' },
  { id: 'announcement', label: 'Announcement', icon: Megaphone, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)', desc: 'Important campus updates' },
  { id: 'achievement', label: 'Achievement', icon: Trophy, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', desc: 'Awards, wins & milestones' },
  { id: 'idea', label: 'Idea', icon: Lightbulb, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', desc: 'Brainstorms & proposals' },
  { id: 'internship', label: 'Internship / Job', icon: Briefcase, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)', desc: 'Placements & referrals' },
  { id: 'question', label: 'Question', icon: HelpCircle, color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', desc: 'Ask campus community' },
  { id: 'lost_found', label: 'Lost & Found', icon: Search, color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', desc: 'Recover lost belongings' },
  { id: 'club', label: 'Club / Community', icon: Users, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', desc: 'Recruitments & meetups' },
  { id: 'notice', label: 'Notice', icon: FileText, color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)', desc: 'Deadlines & circulars' },
  { id: 'issue', label: 'Issue / Complaint', icon: Flag, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', desc: 'Report facility issues' },
];

export default function PostTypeSelector({ selectedType, onSelectType }) {
  return (
    <div className="post-type-selector-wrapper">
      <label className="form-label" style={{ display: 'block', marginBottom: '0.6rem' }}>
        Select Post Type <span style={{ color: 'var(--danger)' }}>*</span>
      </label>
      <div className="post-type-grid">
        {POST_TYPES.map((t) => {
          const Icon = t.icon;
          const isSelected = selectedType === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelectType(t.id)}
              className={`post-type-pill ${isSelected ? 'selected' : ''}`}
              style={{
                borderColor: isSelected ? t.color : 'rgba(255, 255, 255, 0.08)',
                background: isSelected ? t.bg : 'rgba(255, 255, 255, 0.03)',
                boxShadow: isSelected ? `0 4px 18px ${t.bg}` : 'none',
              }}
            >
              <div
                className="type-pill-icon"
                style={{
                  color: isSelected ? '#fff' : t.color,
                  background: isSelected ? t.color : 'rgba(255, 255, 255, 0.05)',
                }}
              >
                <Icon size={16} />
              </div>
              <div className="type-pill-text">
                <span className="type-pill-title" style={{ color: isSelected ? '#fff' : 'var(--text-primary)' }}>
                  {t.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
