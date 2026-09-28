import uuid
from functools import wraps
from datetime import datetime, timezone, timedelta
import jwt
from flask import request, jsonify, current_app
from ..models import User

def generate_token(user, custom_expiry=None):
    """
    Generate a cryptographically secure JWT access token with standard RFC 7519 claims:
    - sub: Subject (user id)
    - username: User's unique handle
    - role: Access role (admin, student, etc.)
    - name: Display name
    - jti: Unique token ID to mitigate replay
    - iat: Issued at
    - nbf: Not before
    - exp: Expiration timestamp
    """
    now = datetime.now(timezone.utc)
    expires_in = custom_expiry or current_app.config.get('JWT_ACCESS_TOKEN_EXPIRES', timedelta(days=7))
    
    payload = {
        'sub': str(user.id),
        'username': user.username,
        'role': user.role,
        'name': user.name or user.username,
        'email': user.email or '',
        'jti': uuid.uuid4().hex,
        'iat': int(now.timestamp()),
        'nbf': int(now.timestamp()),
        'exp': int((now + expires_in).timestamp())
    }
    return jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')

def decode_token(token):
    """
    Safely decode and verify JWT signature, algorithm, and expiration.
    """
    try:
        payload = jwt.decode(
            token,
            current_app.config['JWT_SECRET_KEY'],
            algorithms=['HS256'],
            options={
                'require': ['exp', 'iat', 'sub'],
                'verify_signature': True,
                'verify_exp': True
            }
        )
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
    except Exception:
        return None

def get_current_user_from_request():
    """Extract and validate bearer token from Authorization header and fetch User model."""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ', 1)[1].strip()
    if not token:
        return None

    payload = decode_token(token)
    if not payload or not payload.get('username'):
        return None
        
    return User.query.filter_by(username=payload.get('username')).first()

def jwt_required(optional=False):
    """Decorator to require a valid JWT token for protected endpoints."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user = get_current_user_from_request()
            if not user and not optional:
                return jsonify({
                    'success': False,
                    'message': 'Authentication required or token expired',
                    'code': 'UNAUTHORIZED'
                }), 401
            return f(*args, current_user=user, **kwargs)
        return decorated_function
    return decorator

def admin_required():
    """Decorator to require admin role for privileged operations."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user = get_current_user_from_request()
            if not user:
                return jsonify({
                    'success': False,
                    'message': 'Authentication required',
                    'code': 'UNAUTHORIZED'
                }), 401
            if user.role != 'admin':
                return jsonify({
                    'success': False,
                    'message': 'Admin privileges required',
                    'code': 'FORBIDDEN'
                }), 403
            return f(*args, current_user=user, **kwargs)
        return decorated_function
    return decorator

