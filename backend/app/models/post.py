from datetime import datetime
import json
from .user import db

class Post(db.Model):
    __tablename__ = 'posts'

    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50), nullable=False, default='general', index=True) # project, event, idea, issue, announcement, general, achievement, etc.
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    
    author_id = db.Column(db.String(80), nullable=False, index=True)
    author_name = db.Column(db.String(120), nullable=True)
    author_avatar = db.Column(db.Text, nullable=True)
    department = db.Column(db.String(120), nullable=True)
    
    tags_json = db.Column(db.Text, nullable=True, default='[]')
    image = db.Column(db.Text, nullable=True)
    media_json = db.Column(db.Text, nullable=True, default='[]')
    
    # Event specific
    location = db.Column(db.String(200), nullable=True)
    event_date = db.Column(db.String(50), nullable=True)
    event_time = db.Column(db.String(50), nullable=True)
    duration = db.Column(db.String(50), nullable=True)
    category = db.Column(db.String(100), nullable=True)
    organizer_name = db.Column(db.String(120), nullable=True)
    contact_info = db.Column(db.String(100), nullable=True)
    participant_type = db.Column(db.String(50), nullable=True, default='single')
    min_team_size = db.Column(db.Integer, default=1)
    max_team_size = db.Column(db.Integer, default=4)
    event_details_json = db.Column(db.Text, nullable=True)
    
    # Issue specific
    priority = db.Column(db.String(30), nullable=True) # Low, Medium, High, Critical
    resolved = db.Column(db.Boolean, default=False, index=True)
    
    # Idea / Status / Visibility
    status = db.Column(db.String(50), nullable=True)
    visibility = db.Column(db.String(50), default='everyone') # everyone, students, faculty, department, club
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, **kwargs):
        super().__init__()
        for k, v in kwargs.items():
            setattr(self, k, v)


    # Relationships with optimized selectin batch loading
    likes = db.relationship('PostLike', backref='post', cascade='all, delete-orphan', lazy='selectin')
    comments = db.relationship('PostComment', backref='post', cascade='all, delete-orphan', lazy='selectin', order_by='PostComment.created_at.asc()')
    registrations = db.relationship('EventRegistration', backref='post', cascade='all, delete-orphan', lazy='selectin')

    @property
    def tags(self):
        try: return json.loads(self.tags_json) if self.tags_json else []
        except: return []

    @tags.setter
    def tags(self, val):
        self.tags_json = json.dumps(val if isinstance(val, list) else [])

    @property
    def media(self):
        try: return json.loads(self.media_json) if self.media_json else []
        except: return []

    @media.setter
    def media(self, val):
        self.media_json = json.dumps(val if isinstance(val, list) else [])

    @property
    def event_details(self):
        try: return json.loads(self.event_details_json) if self.event_details_json else {}
        except: return {}

    @event_details.setter
    def event_details(self, val):
        self.event_details_json = json.dumps(val if isinstance(val, dict) else {})

    def to_dict(self):
        liked_users = [l.username for l in self.likes]
        return {
            'id': self.id,
            'type': self.type,
            'title': self.title,
            'description': self.description,
            'author': {
                'name': self.author_name or self.author_id,
                'avatar': self.author_avatar or (self.author_name or self.author_id)[:2].upper()
            },
            'authorId': self.author_id,
            'department': self.department,
            'tags': self.tags,
            'image': self.image,
            'media': self.media,
            'location': self.location,
            'eventDate': self.event_date,
            'eventTime': self.event_time,
            'duration': self.duration,
            'category': self.category,
            'organizerName': self.organizer_name,
            'contactInfo': self.contact_info,
            'participantType': self.participant_type,
            'minTeamSize': self.min_team_size,
            'maxTeamSize': self.max_team_size,
            'eventDetails': self.event_details,
            'priority': self.priority,
            'resolved': self.resolved,
            'status': self.status,
            'visibility': self.visibility,
            'likes': len(liked_users),
            'likedBy': liked_users,
            'comments': [c.to_dict() for c in self.comments],
            'date': self.created_at.strftime('%b %d, %Y') if self.created_at else 'Recently',
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }


class PostLike(db.Model):
    __tablename__ = 'post_likes'

    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False, index=True)
    username = db.Column(db.String(80), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('post_id', 'username', name='unique_post_like_per_user'),
    )

    def __init__(self, **kwargs):
        super().__init__()
        for k, v in kwargs.items():
            setattr(self, k, v)


class PostComment(db.Model):
    __tablename__ = 'post_comments'

    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False, index=True)
    author = db.Column(db.String(80), nullable=False)
    author_name = db.Column(db.String(120), nullable=True)
    author_avatar = db.Column(db.Text, nullable=True)
    text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, **kwargs):
        super().__init__()
        for k, v in kwargs.items():
            setattr(self, k, v)

    def to_dict(self):
        return {
            'id': self.id,
            'author': self.author,
            'authorName': self.author_name or self.author,
            'authorAvatar': self.author_avatar or self.author[:2].upper(),
            'text': self.text,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'date': self.created_at.strftime('%b %d, %H:%M') if self.created_at else 'Recently'
        }


class EventRegistration(db.Model):
    __tablename__ = 'event_registrations'

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False, index=True)
    username = db.Column(db.String(80), nullable=False, index=True)
    participant_type = db.Column(db.String(50), default='single')
    team_name = db.Column(db.String(120), nullable=True)
    members_json = db.Column(db.Text, nullable=True, default='[]')
    email = db.Column(db.String(120), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, **kwargs):
        super().__init__()
        for k, v in kwargs.items():
            setattr(self, k, v)

    @property
    def members(self):
        try: return json.loads(self.members_json) if self.members_json else []
        except: return []

    def to_dict(self):
        return {
            'id': self.id,
            'eventId': self.event_id,
            'username': self.username,
            'participantType': self.participant_type,
            'teamName': self.team_name,
            'members': self.members,
            'email': self.email,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }
