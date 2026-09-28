import React from 'react';
import { Calendar, Clock, MapPin, Link as LinkIcon, Phone, User, Users } from 'lucide-react';

export default function EventDetailsForm({ eventData, onChange, errors }) {
  const todayStr = new Date().toISOString().split('T')[0];

  const handleField = (field, val) => {
    onChange({
      ...eventData,
      [field]: val,
    });
  };

  return (
    <div className="event-details-section">
      <div className="event-section-header">
        <div className="event-header-icon">
          <Calendar size={20} color="#10b981" />
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>Event Specific Details</h4>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Provide scheduling, venue, and registration information for campus attendees.
          </p>
        </div>
      </div>

      <div className="event-fields-grid">
        {/* Event Date & Time */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              <Calendar size={14} /> Event Date <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="date"
              className={`form-control ${errors?.eventDate ? 'input-error' : ''}`}
              min={todayStr}
              value={eventData.eventDate || todayStr}
              onChange={(e) => handleField('eventDate', e.target.value)}
              required
            />
            {errors?.eventDate && <span className="field-error-text">{errors.eventDate}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">
              <Clock size={14} /> Start Time <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="time"
              className={`form-control ${errors?.startTime ? 'input-error' : ''}`}
              value={eventData.startTime || '10:00'}
              onChange={(e) => handleField('startTime', e.target.value)}
              required
            />
            {errors?.startTime && <span className="field-error-text">{errors.startTime}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">
              <Clock size={14} /> End Time
            </label>
            <input
              type="time"
              className="form-control"
              value={eventData.endTime || '16:00'}
              onChange={(e) => handleField('endTime', e.target.value)}
            />
          </div>
        </div>

        {/* Venue & Duration */}
        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label className="form-label">
              <MapPin size={14} /> Venue / Location <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="text"
              className={`form-control ${errors?.venue ? 'input-error' : ''}`}
              placeholder="e.g. Main Auditorium, Seminar Hall 2, Virtual Meet"
              value={eventData.venue || ''}
              onChange={(e) => handleField('venue', e.target.value)}
              required
            />
            {errors?.venue && <span className="field-error-text">{errors.venue}</span>}
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Duration</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 3 Hours / 2 Days"
              value={eventData.duration || ''}
              onChange={(e) => handleField('duration', e.target.value)}
            />
          </div>
        </div>

        {/* Category & Participant Type */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-control"
              value={eventData.category || 'Hackathon'}
              onChange={(e) => handleField('category', e.target.value)}
            >
              <option value="Hackathon">Hackathon</option>
              <option value="Coding Event">Coding Event</option>
              <option value="Workshop">Workshop</option>
              <option value="Seminar">Seminar</option>
              <option value="Cultural">Cultural / Fest</option>
              <option value="Sports">Sports Meet</option>
              <option value="Conference">Tech Conference</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Users size={14} /> Participation Mode
            </label>
            <select
              className="form-control"
              value={eventData.participantType || 'single'}
              onChange={(e) => handleField('participantType', e.target.value)}
            >
              <option value="single">Individual (Single)</option>
              <option value="team">Team Participation</option>
            </select>
          </div>
        </div>

        {/* Team size config if team selected */}
        {eventData.participantType === 'team' && (
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Min Team Size</label>
              <input
                type="number"
                min={2}
                max={10}
                className="form-control"
                value={eventData.minTeamSize || 2}
                onChange={(e) => handleField('minTeamSize', parseInt(e.target.value) || 2)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Max Team Size</label>
              <input
                type="number"
                min={2}
                max={15}
                className="form-control"
                value={eventData.maxTeamSize || 4}
                onChange={(e) => handleField('maxTeamSize', parseInt(e.target.value) || 4)}
              />
            </div>
          </div>
        )}

        {/* Registration URL & Contact */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              <LinkIcon size={14} /> Registration URL
            </label>
            <input
              type="url"
              className={`form-control ${errors?.registrationUrl ? 'input-error' : ''}`}
              placeholder="https://event.campus.edu/register"
              value={eventData.registrationUrl || ''}
              onChange={(e) => handleField('registrationUrl', e.target.value)}
            />
            {errors?.registrationUrl && <span className="field-error-text">{errors.registrationUrl}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">
              <Phone size={14} /> Contact Phone / Email
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 9876543210 or club@campus.edu"
              value={eventData.contactInfo || ''}
              onChange={(e) => handleField('contactInfo', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
