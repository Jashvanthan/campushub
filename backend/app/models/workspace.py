import uuid
from datetime import datetime
import json
from .user import db

def gen_id(prefix):
    return f"{prefix}-{uuid.uuid4().hex[:8]}"

class Workspace(db.Model):
    __tablename__ = 'workspaces'

    id = db.Column(db.String(80), primary_key=True, default=lambda: gen_id('ws'))
    idea_id = db.Column(db.String(80), nullable=True, index=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(80), nullable=False, default='Technology')
    visibility = db.Column(db.String(30), default='public') # public, private
    status = db.Column(db.String(50), default='ACTIVE')
    progress = db.Column(db.Integer, default=0)
    tags_json = db.Column(db.Text, nullable=True, default='[]')
    
    lead_id = db.Column(db.String(80), nullable=True)
    lead_name = db.Column(db.String(120), nullable=True)
    lead_avatar = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, **kwargs):
        super().__init__()
        for k, v in kwargs.items():
            setattr(self, k, v)


    # Relationships with optimized selectin batch loading
    members = db.relationship('WorkspaceMember', backref='workspace', cascade='all, delete-orphan', lazy='selectin')
    tasks = db.relationship('Task', backref='workspace', cascade='all, delete-orphan', lazy='selectin')
    milestones = db.relationship('Milestone', backref='workspace', cascade='all, delete-orphan', lazy='selectin')
    discussions = db.relationship('Discussion', backref='workspace', cascade='all, delete-orphan', lazy='selectin')
    files = db.relationship('WorkspaceFile', backref='workspace', cascade='all, delete-orphan', lazy='selectin')
    activities = db.relationship('Activity', backref='workspace', cascade='all, delete-orphan', lazy='selectin')
    chat_messages = db.relationship('ChatMessage', backref='workspace', cascade='all, delete-orphan', lazy='selectin')

    @property
    def tags(self):
        try: return json.loads(self.tags_json) if self.tags_json else []
        except: return []

    @tags.setter
    def tags(self, val):
        self.tags_json = json.dumps(val if isinstance(val, list) else [])

    def to_dict(self):
        m_list = list(self.members)
        t_list = list(self.tasks)
        return {
            'id': self.id,
            'ideaId': self.idea_id,
            'name': self.name,
            'description': self.description,
            'category': self.category,
            'visibility': self.visibility,
            'status': self.status,
            'progress': self.progress,
            'tags': self.tags,
            'lead': {
                'id': self.lead_id,
                'name': self.lead_name or self.lead_id,
                'avatar': self.lead_avatar or (self.lead_name or self.lead_id)[:2].upper() if self.lead_id else 'LD'
            },
            'members': [m.to_dict() for m in m_list],
            'membersCount': len(m_list),
            'tasksCount': len(t_list),
            'completedTasksCount': len([t for t in t_list if t.status == 'DONE']),
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }


class WorkspaceMember(db.Model):
    __tablename__ = 'workspace_members'

    id = db.Column(db.Integer, primary_key=True)
    workspace_id = db.Column(db.String(80), db.ForeignKey('workspaces.id'), nullable=False, index=True)
    user_id = db.Column(db.String(80), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=True)
    username = db.Column(db.String(80), nullable=True)
    avatar = db.Column(db.Text, nullable=True)
    role = db.Column(db.String(50), default='CONTRIBUTOR') # LEAD, MAINTAINER, CONTRIBUTOR, VIEWER
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('workspace_id', 'user_id', name='unique_workspace_member'),
    )

    def __init__(self, **kwargs):
        super().__init__()
        for k, v in kwargs.items():
            setattr(self, k, v)

    def to_dict(self):
        return {
            'userId': self.user_id,
            'name': self.name or self.username or self.user_id,
            'username': self.username or self.user_id,
            'avatar': self.avatar or (self.name or self.user_id)[:2].upper(),
            'role': self.role,
            'joinedAt': self.joined_at.isoformat() if self.joined_at else None
        }


class Task(db.Model):
    __tablename__ = 'tasks'

    id = db.Column(db.String(80), primary_key=True, default=lambda: gen_id('task'))
    workspace_id = db.Column(db.String(80), db.ForeignKey('workspaces.id'), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    assignee_id = db.Column(db.String(80), nullable=True, index=True)
    assignee_name = db.Column(db.String(120), nullable=True)
    assignee_avatar = db.Column(db.Text, nullable=True)
    
    status = db.Column(db.String(50), default='TODO', index=True) # TODO, IN_PROGRESS, REVIEW, DONE
    priority = db.Column(db.String(30), default='MEDIUM') # LOW, MEDIUM, HIGH, URGENT
    due_date = db.Column(db.String(50), nullable=True)
    tags_json = db.Column(db.Text, nullable=True, default='[]')
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, **kwargs):
        super().__init__()
        for k, v in kwargs.items():
            setattr(self, k, v)

    @property
    def tags(self):
        try: return json.loads(self.tags_json) if self.tags_json else []
        except: return []

    @tags.setter
    def tags(self, val):
        self.tags_json = json.dumps(val if isinstance(val, list) else [])

    def to_dict(self):
        return {
            'id': self.id,
            'workspaceId': self.workspace_id,
            'title': self.title,
            'description': self.description or '',
            'assigneeId': self.assignee_id,
            'assigneeName': self.assignee_name,
            'assigneeAvatar': self.assignee_avatar,
            'status': self.status,
            'priority': self.priority,
            'dueDate': self.due_date,
            'tags': self.tags,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }


class Milestone(db.Model):
    __tablename__ = 'milestones'

    id = db.Column(db.String(80), primary_key=True, default=lambda: gen_id('ms'))
    workspace_id = db.Column(db.String(80), db.ForeignKey('workspaces.id'), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    due_date = db.Column(db.String(50), nullable=True)
    progress = db.Column(db.Integer, default=0)
    status = db.Column(db.String(50), default='UPCOMING') # UPCOMING, IN_PROGRESS, COMPLETED
    deliverables_json = db.Column(db.Text, nullable=True, default='[]')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, **kwargs):
        super().__init__()
        for k, v in kwargs.items():
            setattr(self, k, v)

    @property
    def deliverables(self):
        try: return json.loads(self.deliverables_json) if self.deliverables_json else []
        except: return []

    @deliverables.setter
    def deliverables(self, val):
        self.deliverables_json = json.dumps(val if isinstance(val, list) else [])

    def to_dict(self):
        return {
            'id': self.id,
            'workspaceId': self.workspace_id,
            'title': self.title,
            'description': self.description or '',
            'dueDate': self.due_date,
            'progress': self.progress,
            'status': self.status,
            'deliverables': self.deliverables,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }


class Discussion(db.Model):
    __tablename__ = 'discussions'

    id = db.Column(db.String(80), primary_key=True, default=lambda: gen_id('disc'))
    workspace_id = db.Column(db.String(80), db.ForeignKey('workspaces.id'), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(80), default='General')
    
    author_id = db.Column(db.String(80), nullable=False)
    author_name = db.Column(db.String(120), nullable=True)
    author_avatar = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    replies = db.relationship('DiscussionReply', backref='discussion', cascade='all, delete-orphan', lazy='dynamic', order_by='DiscussionReply.created_at.asc()')

    def __init__(self, **kwargs):
        super().__init__()
        for k, v in kwargs.items():
            setattr(self, k, v)

    def to_dict(self):
        return {
            'id': self.id,
            'workspaceId': self.workspace_id,
            'title': self.title,
            'content': self.content,
            'category': self.category,
            'authorId': self.author_id,
            'authorName': self.author_name or self.author_id,
            'authorAvatar': self.author_avatar or (self.author_name or self.author_id)[:2].upper(),
            'replies': [r.to_dict() for r in self.replies.all()],
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }


class DiscussionReply(db.Model):
    __tablename__ = 'discussion_replies'

    id = db.Column(db.String(80), primary_key=True, default=lambda: gen_id('rep'))
    discussion_id = db.Column(db.String(80), db.ForeignKey('discussions.id'), nullable=False, index=True)
    author_id = db.Column(db.String(80), nullable=False)
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
            'authorId': self.author_id,
            'authorName': self.author_name or self.author_id,
            'authorAvatar': self.author_avatar or (self.author_name or self.author_id)[:2].upper(),
            'text': self.text,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }


class WorkspaceFile(db.Model):
    __tablename__ = 'workspace_files'

    id = db.Column(db.String(80), primary_key=True, default=lambda: gen_id('file'))
    workspace_id = db.Column(db.String(80), db.ForeignKey('workspaces.id'), nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    size = db.Column(db.String(50), default='1 MB')
    type = db.Column(db.String(100), default='application/octet-stream')
    url = db.Column(db.Text, nullable=True)
    uploader_id = db.Column(db.String(80), nullable=False)
    uploader_name = db.Column(db.String(120), nullable=True)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, **kwargs):
        super().__init__()
        for k, v in kwargs.items():
            setattr(self, k, v)

    def to_dict(self):
        return {
            'id': self.id,
            'workspaceId': self.workspace_id,
            'name': self.name,
            'size': self.size,
            'type': self.type,
            'url': self.url,
            'uploaderId': self.uploader_id,
            'uploaderName': self.uploader_name or self.uploader_id,
            'uploadedAt': self.uploaded_at.isoformat() if self.uploaded_at else None
        }


class Activity(db.Model):
    __tablename__ = 'workspace_activities'

    id = db.Column(db.String(80), primary_key=True, default=lambda: gen_id('act'))
    workspace_id = db.Column(db.String(80), db.ForeignKey('workspaces.id'), nullable=False, index=True)
    type = db.Column(db.String(50), default='UPDATE')
    actor_id = db.Column(db.String(80), nullable=False)
    actor_name = db.Column(db.String(120), nullable=True)
    actor_avatar = db.Column(db.Text, nullable=True)
    description = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def __init__(self, **kwargs):
        super().__init__()
        if 'action' in kwargs and 'description' not in kwargs:
            kwargs['description'] = kwargs.pop('action')
        for k, v in kwargs.items():
            setattr(self, k, v)

    @property
    def action(self):
        return self.description

    @action.setter
    def action(self, val):
        self.description = val

    def to_dict(self):
        return {
            'id': self.id,
            'workspaceId': self.workspace_id,
            'type': self.type,
            'actorId': self.actor_id,
            'actorName': self.actor_name or self.actor_id,
            'actorAvatar': self.actor_avatar or (self.actor_name or self.actor_id)[:2].upper(),
            'description': self.description,
            'action': self.description,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }


class ChatMessage(db.Model):
    __tablename__ = 'workspace_chat_messages'

    id = db.Column(db.String(80), primary_key=True, default=lambda: gen_id('chat'))
    workspace_id = db.Column(db.String(80), db.ForeignKey('workspaces.id'), nullable=False, index=True)
    channel = db.Column(db.String(80), default='general', index=True)
    sender_id = db.Column(db.String(80), nullable=False)
    sender_name = db.Column(db.String(120), nullable=True)
    sender_avatar = db.Column(db.Text, nullable=True)
    sender_role = db.Column(db.String(80), default='Contributor')
    message = db.Column(db.Text, nullable=False)
    reactions_json = db.Column(db.Text, nullable=True, default='{}')
    reply_to_json = db.Column(db.Text, nullable=True)
    code_snippet_json = db.Column(db.Text, nullable=True)
    is_system = db.Column(db.Boolean, default=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def __init__(self, **kwargs):
        super().__init__()
        for k, v in kwargs.items():
            setattr(self, k, v)

    @property
    def reactions(self):
        try: return json.loads(self.reactions_json) if self.reactions_json else {}
        except: return {}

    @reactions.setter
    def reactions(self, val):
        self.reactions_json = json.dumps(val if isinstance(val, dict) else {})

    @property
    def reply_to(self):
        try: return json.loads(self.reply_to_json) if self.reply_to_json else None
        except: return None

    @reply_to.setter
    def reply_to(self, val):
        self.reply_to_json = json.dumps(val) if val else None

    @property
    def code_snippet(self):
        try: return json.loads(self.code_snippet_json) if self.code_snippet_json else None
        except: return None

    @code_snippet.setter
    def code_snippet(self, val):
        self.code_snippet_json = json.dumps(val) if val else None

    def to_dict(self):
        return {
            'id': self.id,
            'workspaceId': self.workspace_id,
            'channel': self.channel or 'general',
            'senderId': self.sender_id,
            'senderName': self.sender_name or self.sender_id,
            'senderAvatar': self.sender_avatar or (self.sender_name or self.sender_id)[:2].upper(),
            'senderRole': self.sender_role or 'Contributor',
            'message': self.message,
            'content': self.message,
            'reactions': self.reactions,
            'replyTo': self.reply_to,
            'codeSnippet': self.code_snippet,
            'isSystem': self.is_system,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

