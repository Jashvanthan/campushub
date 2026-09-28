from datetime import datetime
import json
from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(30), nullable=False, default='student', index=True) # admin, student, new_user, guest
    name = db.Column(db.String(120), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    avatar = db.Column(db.Text, nullable=True)
    institution = db.Column(db.String(200), nullable=True, default='CampusHub University')
    major = db.Column(db.String(200), nullable=True, default='Undergraduate')
    bio = db.Column(db.Text, nullable=True)
    skills_json = db.Column(db.Text, nullable=True, default='[]')
    joined_date = db.Column(db.String(50), nullable=True, default='2026')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, username=None, password_hash=None, role='student', name=None, email=None, avatar=None, institution='CampusHub University', major='Undergraduate', bio=None, skills=None, joined_date='2026', **kwargs):
        super().__init__(**kwargs)
        if username is not None: self.username = username
        if password_hash is not None: self.password_hash = password_hash
        if role is not None: self.role = role
        if name is not None: self.name = name
        if email is not None: self.email = email
        if avatar is not None: self.avatar = avatar
        if institution is not None: self.institution = institution
        if major is not None: self.major = major
        if bio is not None: self.bio = bio
        if skills is not None: self.skills = skills
        if joined_date is not None: self.joined_date = joined_date

    def set_password(self, password):

        # Generate secure salted hash using PBKDF2 with SHA-256 and 600k iterations
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256', salt_length=16)

    def check_password(self, password):
        if not self.password_hash or not password:
            return False
        # Support legacy SHA256 hex hashes with timing-safe comparison & auto-upgrade
        if len(self.password_hash) == 64 and all(c in '0123456789abcdefABCDEF' for c in self.password_hash):
            import hashlib
            import hmac
            computed = hashlib.sha256(password.encode()).hexdigest()
            if hmac.compare_digest(computed, self.password_hash):
                # Auto-upgrade to PBKDF2
                self.set_password(password)
                try:
                    db.session.commit()
                except Exception:
                    pass
                return True
            return False
        return check_password_hash(self.password_hash, password)


    @property
    def skills(self):
        try:
            return json.loads(self.skills_json) if self.skills_json else []
        except:
            return []

    @skills.setter
    def skills(self, val):
        self.skills_json = json.dumps(val if isinstance(val, list) else [])

    def to_dict(self, include_private=False):
        data = {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'name': self.name or self.username,
            'email': self.email or '',
            'avatar': self.avatar or (self.name or self.username)[:2].upper(),
            'institution': self.institution or 'CampusHub University',
            'major': self.major or 'Undergraduate',
            'bio': self.bio or '',
            'skills': self.skills,
            'joined': self.joined_date,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }
        if include_private:
            data['email'] = self.email
        return data
