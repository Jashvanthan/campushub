from datetime import datetime
import json
from .user import db

class Idea(db.Model):
    __tablename__ = 'ideas'

    id = db.Column(db.String(80), primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    problem = db.Column(db.Text, nullable=False)
    solution = db.Column(db.Text, nullable=False)
    impact = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(80), nullable=False, default='Technology', index=True)
    status = db.Column(db.String(50), nullable=False, default='IDEA', index=True)
    
    tags_json = db.Column(db.Text, nullable=True, default='[]')
    skills_required_json = db.Column(db.Text, nullable=True, default='[]')
    contribution_types_json = db.Column(db.Text, nullable=True, default='[]')
    duration = db.Column(db.String(50), nullable=True)
    team_size = db.Column(db.String(50), nullable=True)
    
    creator_id = db.Column(db.String(80), nullable=False, index=True)
    creator_name = db.Column(db.String(120), nullable=True)
    creator_avatar = db.Column(db.Text, nullable=True)
    creator_department = db.Column(db.String(120), nullable=True)
    
    progress = db.Column(db.Integer, default=0)
    workspace_id = db.Column(db.String(80), nullable=True, index=True)
    attachments_json = db.Column(db.Text, nullable=True, default='[]')
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, **kwargs):
        super().__init__()
        for k, v in kwargs.items():
            setattr(self, k, v)


    # Relationships with optimized selectin batch loading
    supports = db.relationship('IdeaSupport', backref='idea', cascade='all, delete-orphan', lazy='selectin')
    followers = db.relationship('IdeaFollower', backref='idea', cascade='all, delete-orphan', lazy='selectin')
    contribution_requests = db.relationship('ContributionRequest', backref='idea', cascade='all, delete-orphan', lazy='selectin')

    @property
    def tags(self):
        try: return json.loads(self.tags_json) if self.tags_json else []
        except: return []

    @tags.setter
    def tags(self, val):
        self.tags_json = json.dumps(val if isinstance(val, list) else [])

    @property
    def skills_required(self):
        try: return json.loads(self.skills_required_json) if self.skills_required_json else []
        except: return []

    @skills_required.setter
    def skills_required(self, val):
        self.skills_required_json = json.dumps(val if isinstance(val, list) else [])

    @property
    def contribution_types(self):
        try: return json.loads(self.contribution_types_json) if self.contribution_types_json else []
        except: return []

    @contribution_types.setter
    def contribution_types(self, val):
        self.contribution_types_json = json.dumps(val if isinstance(val, list) else [])

    @property
    def attachments(self):
        try: return json.loads(self.attachments_json) if self.attachments_json else []
        except: return []

    @attachments.setter
    def attachments(self, val):
        self.attachments_json = json.dumps(val if isinstance(val, list) else [])

    def to_dict(self):
        supported_users = [s.username for s in self.supports]
        followed_users = [f.username for f in self.followers]
        return {
            'id': self.id,
            'title': self.title,
            'problem': self.problem,
            'solution': self.solution,
            'impact': self.impact,
            'category': self.category,
            'status': self.status,
            'tags': self.tags,
            'skillsRequired': self.skills_required,
            'contributionTypes': self.contribution_types,
            'duration': self.duration,
            'teamSize': self.team_size,
            'creatorId': self.creator_id,
            'creatorName': self.creator_name or self.creator_id,
            'creatorAvatar': self.creator_avatar or (self.creator_name or self.creator_id)[:2].upper(),
            'creatorDepartment': self.creator_department,
            'supportedBy': supported_users,
            'supportCount': len(supported_users),
            'followedBy': followed_users,
            'progress': self.progress,
            'workspaceId': self.workspace_id,
            'attachments': self.attachments,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }


class IdeaSupport(db.Model):
    __tablename__ = 'idea_supports'

    id = db.Column(db.Integer, primary_key=True)
    idea_id = db.Column(db.String(80), db.ForeignKey('ideas.id'), nullable=False, index=True)
    username = db.Column(db.String(80), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('idea_id', 'username', name='unique_idea_support_per_user'),
    )


class IdeaFollower(db.Model):
    __tablename__ = 'idea_followers'

    id = db.Column(db.Integer, primary_key=True)
    idea_id = db.Column(db.String(80), db.ForeignKey('ideas.id'), nullable=False, index=True)
    username = db.Column(db.String(80), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('idea_id', 'username', name='unique_idea_follower_per_user'),
    )


class ContributionRequest(db.Model):
    __tablename__ = 'contribution_requests'

    id = db.Column(db.String(80), primary_key=True)
    idea_id = db.Column(db.String(80), db.ForeignKey('ideas.id'), nullable=False, index=True)
    idea_title = db.Column(db.String(255), nullable=True)
    applicant_id = db.Column(db.String(80), nullable=False, index=True)
    applicant_name = db.Column(db.String(120), nullable=True)
    applicant_avatar = db.Column(db.Text, nullable=True)
    role_applied = db.Column(db.String(100), nullable=False)
    skills_json = db.Column(db.Text, nullable=True, default='[]')
    experience = db.Column(db.Text, nullable=True)
    motivation = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(30), default='PENDING', index=True) # PENDING, ACCEPTED, REJECTED
    requested_at = db.Column(db.DateTime, default=datetime.utcnow)
    responded_at = db.Column(db.DateTime, nullable=True)

    @property
    def skills(self):
        try: return json.loads(self.skills_json) if self.skills_json else []
        except: return []

    @skills.setter
    def skills(self, val):
        self.skills_json = json.dumps(val if isinstance(val, list) else [])

    def to_dict(self):
        return {
            'id': self.id,
            'ideaId': self.idea_id,
            'ideaTitle': self.idea_title,
            'applicantId': self.applicant_id,
            'applicantName': self.applicant_name or self.applicant_id,
            'applicantAvatar': self.applicant_avatar or (self.applicant_name or self.applicant_id)[:2].upper(),
            'roleApplied': self.role_applied,
            'skills': self.skills,
            'experience': self.experience,
            'motivation': self.motivation,
            'status': self.status,
            'requestedAt': self.requested_at.isoformat() if self.requested_at else None,
            'respondedAt': self.responded_at.isoformat() if self.responded_at else None
        }
