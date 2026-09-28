from datetime import datetime
from .user import db

class SearchHistory(db.Model):
    __tablename__ = 'search_history'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False, index=True)
    search_term = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def __init__(self, username, query='', search_term='', **kwargs):
        super().__init__(**kwargs)
        self.username = username
        self.search_term = search_term or query

    @property
    def query(self):
        return self.search_term

    @query.setter
    def query(self, val):
        self.search_term = val

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'query': self.search_term,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }
