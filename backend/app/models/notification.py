import uuid
from datetime import datetime
from .user import db

def gen_id(prefix='notif'):
    return f"{prefix}-{uuid.uuid4().hex[:8]}"

class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.String(80), primary_key=True, default=lambda: gen_id('notif'))
    recipient_id = db.Column(db.String(80), nullable=False, index=True) # username or 'all'
    sender_id = db.Column(db.String(80), nullable=True)
    sender_name = db.Column(db.String(120), nullable=True)
    sender_avatar = db.Column(db.Text, nullable=True)
    
    type = db.Column(db.String(50), default='system', index=True) # chat, contribution_request, contribution_status, post_like, post_comment, task_assignment, idea_support, system
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    
    target_tab = db.Column(db.String(50), nullable=True) # workspaces, ideas, explore, profile
    target_id = db.Column(db.String(80), nullable=True) # workspaceId, ideaId, postId
    target_channel = db.Column(db.String(80), nullable=True) # e.g. general
    
    is_read = db.Column(db.Boolean, default=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def __init__(self, **kwargs):
        super().__init__()
        for k, v in kwargs.items():
            setattr(self, k, v)


    def to_dict(self):
        return {
            'id': self.id,
            'recipientId': self.recipient_id,
            'senderId': self.sender_id,
            'senderName': self.sender_name,
            'senderAvatar': self.sender_avatar,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'targetTab': self.target_tab,
            'targetId': self.target_id,
            'targetChannel': self.target_channel,
            'isRead': self.is_read,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }
