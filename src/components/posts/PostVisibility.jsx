import React from 'react';
import { Globe, GraduationCap, Building2, Shield, Users } from 'lucide-react';

export const VISIBILITY_OPTIONS = [
  { id: 'everyone', label: 'Everyone', icon: Globe, desc: 'Public to all campus innovators' },
  { id: 'students', label: 'Students Only', icon: GraduationCap, desc: 'Visible to verified students' },
  { id: 'faculty', label: 'Faculty & Staff', icon: Building2, desc: 'Visible to professors & staff' },
  { id: 'department', label: 'My Department', icon: Shield, desc: 'Visible to your branch/dept' },
  { id: 'club', label: 'My Club / Community', icon: Users, desc: 'Visible to club members' },
];

export default function PostVisibility({ visibility, onSelectVisibility }) {
  return (
    <div className="post-visibility-wrapper">
      <label className="form-label" style={{ display: 'block', marginBottom: '0.6rem' }}>
        Audience Visibility
      </label>
      <div className="visibility-options-grid">
        {VISIBILITY_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = visibility === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectVisibility(opt.id)}
              className={`visibility-pill ${isSelected ? 'selected' : ''}`}
            >
              <Icon size={15} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
