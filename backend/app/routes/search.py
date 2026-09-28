from flask import Blueprint, request, jsonify
from sqlalchemy import or_
from ..models import db, Post, User, SearchHistory
from ..utils.auth_helpers import jwt_required, get_current_user_from_request
from ..services.recommendation_service import RecommendationService

search_bp = Blueprint('search', __name__, url_prefix='/api/search')

@search_bp.route('', methods=['GET'])
def search_all():
    """
    Unified search endpoint for posts and users.
    Case-insensitive, whitespace-normalized, partial-match friendly.
    """
    raw_query = request.args.get('q', '').strip()
    limit = min(50, max(1, int(request.args.get('limit', 20))))
    user_limit = min(20, max(1, int(request.args.get('userLimit', 10))))

    if not raw_query:
        return jsonify({
            'success': True,
            'query': '',
            'posts': [],
            'users': [],
            'counts': {
                'posts': 0,
                'users': 0,
                'total': 0
            }
        }), 200

    # Normalization
    query_str = ' '.join(raw_query.split())[:150]
    words = [w for w in query_str.split() if w]

    # Optional search tracking for logged-in users
    current_user = get_current_user_from_request()
    if current_user:
        RecommendationService.record_search(current_user.username, query_str)

    # 1. Search Posts by title primarily, and secondarily description / tags
    post_conditions = []
    for word in words:
        post_conditions.append(Post.title.ilike(f"%{word}%"))
        post_conditions.append(Post.description.ilike(f"%{word}%"))
        post_conditions.append(Post.tags_json.ilike(f"%{word}%"))
        post_conditions.append(Post.category.ilike(f"%{word}%"))

    # Title-matched posts get higher ranking
    posts_query = Post.query.filter(or_(*post_conditions))

    # Visibility filtering
    if not current_user:
        posts_query = posts_query.filter(or_(Post.visibility == 'everyone', Post.visibility == None))
    elif current_user.role != 'admin':
        if current_user.role == 'student':
            posts_query = posts_query.filter(or_(Post.visibility == 'everyone', Post.visibility == 'students', Post.visibility == None))
        else:
            posts_query = posts_query.filter(or_(Post.visibility == 'everyone', Post.visibility == None))

    all_matched_posts = posts_query.all()

    # Sort matched posts prioritizing title matches, then recency
    def post_match_rank(p):
        score = 0
        p_title = (p.title or '').lower()
        p_desc = (p.description or '').lower()
        q_lower = query_str.lower()
        
        # Exact title match or substring
        if q_lower in p_title:
            score += 10
        for w in words:
            w_lower = w.lower()
            if w_lower in p_title:
                score += 3
            if w_lower in p_desc:
                score += 1
            if p.tags and any(w_lower in t.lower() for t in p.tags):
                score += 2
        return score

    all_matched_posts.sort(key=lambda p: (post_match_rank(p), p.created_at or 0), reverse=True)
    selected_posts = all_matched_posts[:limit]

    # 2. Search Users
    user_conditions = []
    for word in words:
        user_conditions.append(User.username.ilike(f"%{word}%"))
        user_conditions.append(User.name.ilike(f"%{word}%"))
        user_conditions.append(User.major.ilike(f"%{word}%"))
        user_conditions.append(User.skills_json.ilike(f"%{word}%"))

    users_query = User.query.filter(or_(*user_conditions))
    all_matched_users = users_query.all()

    def user_match_rank(u):
        score = 0
        u_name = (u.name or '').lower()
        u_username = (u.username or '').lower()
        q_lower = query_str.lower()
        if q_lower == u_username or q_lower == u_name:
            score += 10
        elif q_lower in u_username or q_lower in u_name:
            score += 5
        for w in words:
            w_lower = w.lower()
            if w_lower in u_username:
                score += 3
            if w_lower in u_name:
                score += 2
        return score

    all_matched_users.sort(key=user_match_rank, reverse=True)
    selected_users = all_matched_users[:user_limit]

    return jsonify({
        'success': True,
        'query': query_str,
        'posts': [p.to_dict() for p in selected_posts],
        'users': [u.to_dict(include_private=False) for u in selected_users],
        'counts': {
            'posts': len(all_matched_posts),
            'users': len(all_matched_users),
            'total': len(all_matched_posts) + len(all_matched_users)
        }
    }), 200


@search_bp.route('/track', methods=['POST'])
@jwt_required()
def track_search(current_user):
    """Explicit endpoint to track search queries from frontend search input."""
    data = request.get_json() or {}
    query = data.get('query', '').strip()
    if query:
        RecommendationService.record_search(current_user.username, query)
        return jsonify({'success': True, 'tracked': True}), 200
    return jsonify({'success': False, 'message': 'Query is empty'}), 400
