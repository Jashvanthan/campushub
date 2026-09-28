from .auth import auth_bp
from .posts import posts_bp
from .ideas import ideas_bp
from .workspaces import workspaces_bp
from .stats import stats_bp
from .notifications import notifications_bp
from .search import search_bp

__all__ = [
    'auth_bp',
    'posts_bp',
    'ideas_bp',
    'workspaces_bp',
    'stats_bp',
    'notifications_bp',
    'search_bp'
]

