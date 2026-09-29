from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
import json
from ..models import db, Post, PostLike, PostComment, EventRegistration, Notification, Idea, IdeaSupport
from ..utils.auth_helpers import jwt_required
from ..services.recommendation_service import RecommendationService

posts_bp = Blueprint('posts', __name__, url_prefix='/api/posts')

@posts_bp.route('/recommended', methods=['GET'])
@jwt_required(optional=True)
def get_recommended_posts(current_user=None):
    """
    Get personalized recommendations for the authenticated user based on:
    - Liked posts and topics
    - Project similarity
    - Search signals
    - Profile skills and major
    - Recency and popularity
    Gracefully falls back to recent and trending posts if guest or new user.
    """
    limit = min(50, max(1, int(request.args.get('limit', 20))))
    
    try:
        if current_user:
            recommended = RecommendationService.get_recommendations(current_user, limit=limit)
        else:
            # Fallback for guests/unauthenticated users
            recent_posts = Post.query.filter(
                (Post.visibility == 'everyone') | (Post.visibility == None)
            ).order_by(Post.created_at.desc()).limit(limit).all()
            recommended = [p.to_dict() for p in recent_posts]

        return jsonify({
            'success': True,
            'posts': recommended,
            'count': len(recommended),
            'isPersonalized': bool(current_user)
        }), 200
    except Exception as e:
        # Fallback on any failure (Feature 19)
        fallback_posts = Post.query.order_by(Post.created_at.desc()).limit(limit).all()
        return jsonify({
            'success': True,
            'posts': [p.to_dict() for p in fallback_posts],
            'count': len(fallback_posts),
            'isPersonalized': False,
            'fallback': True
        }), 200


@posts_bp.route('', methods=['GET'])
def get_posts():
    post_type = request.args.get('type')
    author_id = request.args.get('authorId')
    category = request.args.get('category')
    department = request.args.get('department')
    search = request.args.get('q')

    query = Post.query
    if post_type and post_type != 'all':
        query = query.filter_by(type=post_type)
    if author_id:
        query = query.filter_by(author_id=author_id)
    if category and category != 'all':
        query = query.filter_by(category=category)
    if department and department != 'all':
        query = query.filter_by(department=department)
    if search:
        query = query.filter(
            (Post.title.ilike(f'%{search}%')) | 
            (Post.description.ilike(f'%{search}%'))
        )

    posts = query.order_by(Post.created_at.desc()).all()
    return jsonify({
        'success': True,
        'posts': [p.to_dict() for p in posts],
        'count': len(posts)
    }), 200


@posts_bp.route('/<post_id>', methods=['GET'])
def get_post(post_id):
    post = db.session.get(Post, post_id)
    if not post:
        try:
            post = db.session.get(Post, int(post_id))
        except (ValueError, TypeError):
            pass
    if not post:
        return jsonify({'success': False, 'message': 'Post not found'}), 404
    return jsonify({
        'success': True,
        'post': post.to_dict()
    }), 200


@posts_bp.route('', methods=['POST'])
@jwt_required()
def create_post(current_user):
    data = request.get_json() or {}
    
    title = data.get('title', '').strip()
    description = data.get('description', data.get('content', '')).strip()
    post_type = data.get('type', 'general')

    if not title:
        return jsonify({'success': False, 'message': 'Title is required'}), 400

    post = Post(
        type=post_type,
        title=title,
        description=description,
        author_id=current_user.username,
        author_name=current_user.name or current_user.username,
        author_avatar=current_user.avatar or (current_user.name or current_user.username)[:2].upper(),
        department=data.get('department', current_user.major),
        image=data.get('image'),
        location=data.get('location', data.get('venue')),
        event_date=data.get('eventDate'),
        event_time=data.get('eventTime'),
        duration=data.get('duration'),
        category=data.get('category'),
        organizer_name=data.get('organizerName'),
        contact_info=data.get('contactInfo'),
        participant_type=data.get('participantType', 'single'),
        min_team_size=data.get('minTeamSize', 1),
        max_team_size=data.get('maxTeamSize', 4),
        priority=data.get('priority', 'Medium'),
        status=data.get('status', 'Open'),
        visibility=data.get('visibility', 'everyone')
    )

    if 'tags' in data: post.tags = data['tags']
    if 'media' in data: post.media = data['media']
    if 'eventDetails' in data: post.event_details = data['eventDetails']

    db.session.add(post)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Post created successfully',
        'post': post.to_dict()
    }), 201


@posts_bp.route('/<post_id>', methods=['PUT'])
@jwt_required()
def update_post(current_user, post_id):
    post = db.session.get(Post, post_id)
    if not post:
        try:
            post = db.session.get(Post, int(post_id))
        except (ValueError, TypeError):
            pass
    if not post:
        return jsonify({'success': False, 'message': 'Post not found'}), 404

    # Authorization: Owner or Admin
    if post.author_id != current_user.username and current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized to edit this post'}), 403

    data = request.get_json() or {}
    if 'title' in data: post.title = data['title'].strip()
    if 'description' in data: post.description = data['description'].strip()
    if 'type' in data: post.type = data['type']
    if 'department' in data: post.department = data['department']
    if 'image' in data: post.image = data['image']
    if 'tags' in data: post.tags = data['tags']
    if 'media' in data: post.media = data['media']
    if 'location' in data: post.location = data['location']
    if 'eventDate' in data: post.event_date = data['eventDate']
    if 'eventTime' in data: post.event_time = data['eventTime']
    if 'duration' in data: post.duration = data['duration']
    if 'category' in data: post.category = data['category']
    if 'organizerName' in data: post.organizer_name = data['organizerName']
    if 'contactInfo' in data: post.contact_info = data['contactInfo']
    if 'participantType' in data: post.participant_type = data['participantType']
    if 'minTeamSize' in data: post.min_team_size = data['minTeamSize']
    if 'maxTeamSize' in data: post.max_team_size = data['maxTeamSize']
    if 'eventDetails' in data: post.event_details = data['eventDetails']
    if 'priority' in data: post.priority = data['priority']
    if 'resolved' in data: post.resolved = bool(data['resolved'])
    if 'status' in data: post.status = data['status']
    if 'visibility' in data: post.visibility = data['visibility']

    db.session.commit()
    db.session.expire_all()
    return jsonify({
        'success': True,
        'message': 'Post updated successfully',
        'post': post.to_dict()
    }), 200


@posts_bp.route('/<post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(current_user, post_id):
    post = db.session.get(Post, post_id)
    if not post:
        try:
            post = db.session.get(Post, int(post_id))
        except (ValueError, TypeError):
            pass
    if not post:
        return jsonify({'success': False, 'message': 'Post not found'}), 404

    target_id = post.id
    if post.author_id != current_user.username and current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized to delete this post'}), 403

    # Permanently delete all associated notifications
    Notification.query.filter(Notification.target_id == str(target_id)).delete(synchronize_session=False)

    # Permanently delete associated likes, comments, and event registrations
    PostLike.query.filter_by(post_id=target_id).delete(synchronize_session=False)
    PostComment.query.filter_by(post_id=target_id).delete(synchronize_session=False)
    EventRegistration.query.filter_by(event_id=target_id).delete(synchronize_session=False)

    db.session.delete(post)
    db.session.commit()
    db.session.expire_all()
    return jsonify({
        'success': True,
        'message': 'Post permanently deleted from database',
        'id': target_id
    }), 200


@posts_bp.route('/<post_id>/like', methods=['POST'])
@jwt_required()
def toggle_like(current_user, post_id):
    post = db.session.get(Post, post_id)
    if not post:
        try:
            post = db.session.get(Post, int(post_id))
        except (ValueError, TypeError):
            pass
    if not post:
        return jsonify({'success': False, 'message': 'Post not found'}), 404

    target_id = post.id
    existing_like = PostLike.query.filter_by(post_id=target_id, username=current_user.username).first()

    # Check if this post is linked to an Idea or Workspace
    matching_idea = db.session.get(Idea, f"idea-{target_id}")
    if not matching_idea:
        matching_idea = db.session.get(Idea, str(target_id))
    if not matching_idea:
        matching_idea = Idea.query.filter(Idea.title.ilike(post.title)).first()

    existing_idea_support = None
    if matching_idea:
        existing_idea_support = IdeaSupport.query.filter_by(idea_id=matching_idea.id, username=current_user.username).first()

    # Bidirectional Toggle: If already liked or supported in workspace, dislike/remove both; otherwise add both
    if existing_like or (matching_idea and existing_idea_support):
        if existing_like:
            db.session.delete(existing_like)
        if matching_idea and existing_idea_support:
            db.session.delete(existing_idea_support)
        liked = False
    else:
        new_like = PostLike(post_id=target_id, username=current_user.username)
        db.session.add(new_like)
        if matching_idea:
            db.session.add(IdeaSupport(idea_id=matching_idea.id, username=current_user.username))
        liked = True

    # Notify post author if not self
    if liked and post.author_id and post.author_id != current_user.username:
        notif = Notification(
            recipient_id=post.author_id,
            sender_id=current_user.username,
            sender_name=current_user.name or current_user.username,
            sender_avatar=current_user.avatar,
            type='post_like',
            title='New Like on your post',
            message=f"{current_user.name or current_user.username} liked your post \"{post.title}\"",
            target_tab='explore',
            target_id=str(target_id)
        )
        db.session.add(notif)

    db.session.commit()
    db.session.expire_all()

    # Direct fresh query to prevent stale relationship cache
    fresh_likes = PostLike.query.filter_by(post_id=target_id).all()
    liked_users = [l.username for l in fresh_likes]

    fresh_idea_supports = []
    if matching_idea:
        fresh_idea_supports = [s.username for s in IdeaSupport.query.filter_by(idea_id=matching_idea.id).all()]
    
    # Reload post with fresh state
    fresh_post = db.session.get(Post, target_id)

    return jsonify({
        'success': True,
        'liked': liked,
        'likes': len(liked_users),
        'likedBy': liked_users,
        'post': fresh_post.to_dict() if fresh_post else None,
        'ideaId': matching_idea.id if matching_idea else None,
        'ideaSupports': len(fresh_idea_supports),
        'ideaSupportedBy': fresh_idea_supports
    }), 200


@posts_bp.route('/<post_id>/comments', methods=['POST'])
@jwt_required()
def add_comment(current_user, post_id):
    post = db.session.get(Post, post_id)
    if not post:
        try:
            post = db.session.get(Post, int(post_id))
        except (ValueError, TypeError):
            pass
    if not post:
        return jsonify({'success': False, 'message': 'Post not found'}), 404

    target_id = post.id
    data = request.get_json() or {}
    text = data.get('text', '').strip()
    if not text:
        return jsonify({'success': False, 'message': 'Comment text cannot be empty'}), 400

    comment = PostComment(
        post_id=target_id,
        author=current_user.username,
        author_name=current_user.name or current_user.username,
        author_avatar=current_user.avatar or (current_user.name or current_user.username)[:2].upper(),
        text=text
    )
    db.session.add(comment)

    # Notify post author if not self
    if post.author_id and post.author_id != current_user.username:
        notif = Notification(
            recipient_id=post.author_id,
            sender_id=current_user.username,
            sender_name=current_user.name or current_user.username,
            sender_avatar=current_user.avatar,
            type='post_comment',
            title='New Comment on your post',
            message=f"{current_user.name or current_user.username} commented: \"{text[:70]}\"",
            target_tab='explore',
            target_id=str(target_id)
        )
        db.session.add(notif)

    db.session.commit()
    db.session.expire_all()

    return jsonify({
        'success': True,
        'message': 'Comment added',
        'comment': comment.to_dict()
    }), 201


@posts_bp.route('/<post_id>/comments/<int:comment_id>', methods=['DELETE'])
@jwt_required()
def delete_comment(current_user, post_id, comment_id):
    post = db.session.get(Post, post_id)
    if not post:
        try:
            post = db.session.get(Post, int(post_id))
        except (ValueError, TypeError):
            pass
    if not post:
        return jsonify({'success': False, 'message': 'Post not found'}), 404

    comment = PostComment.query.filter_by(id=comment_id, post_id=post.id).first()
    if not comment:
        return jsonify({'success': False, 'message': 'Comment not found'}), 404

    if comment.author != current_user.username and current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized to delete this comment'}), 403

    db.session.delete(comment)
    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Comment deleted',
        'commentId': comment_id
    }), 200


@posts_bp.route('/<post_id>/register', methods=['POST'])
@jwt_required()
def register_for_event(current_user, post_id):
    post = db.session.get(Post, post_id)
    if not post:
        try:
            post = db.session.get(Post, int(post_id))
        except (ValueError, TypeError):
            pass
    if not post or post.type != 'event':
        return jsonify({'success': False, 'message': 'Event not found'}), 404

    target_id = post.id
    data = request.get_json() or {}
    
    existing_reg = EventRegistration.query.filter_by(event_id=target_id, username=current_user.username).first()
    if existing_reg:
        existing_reg.participant_type = data.get('participantType', existing_reg.participant_type)
        existing_reg.team_name = data.get('teamName', existing_reg.team_name)
        existing_reg.email = data.get('email', existing_reg.email)
        if 'members' in data: existing_reg.members_json = json.dumps(data['members'])
        reg = existing_reg
    else:
        reg = EventRegistration(
            event_id=target_id,
            username=current_user.username,
            participant_type=data.get('participantType', 'single'),
            team_name=data.get('teamName'),
            email=data.get('email', current_user.email)
        )
        if 'members' in data: reg.members_json = json.dumps(data['members'])
        db.session.add(reg)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Registered for event successfully',
        'registration': reg.to_dict()
    }), 201
