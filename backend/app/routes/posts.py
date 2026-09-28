from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
import json
from ..models import db, Post, PostLike, PostComment, EventRegistration, Notification
from ..utils.auth_helpers import jwt_required

posts_bp = Blueprint('posts', __name__, url_prefix='/api/posts')

@posts_bp.route('', methods=['GET'])
def get_posts():
    post_type = request.args.get('type')
    author_id = request.args.get('authorId')
    search = request.args.get('q')

    query = Post.query
    if post_type and post_type != 'all':
        query = query.filter_by(type=post_type)
    if author_id:
        query = query.filter_by(author_id=author_id)
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


@posts_bp.route('/<int:post_id>', methods=['GET'])
def get_post(post_id):
    post = db.session.get(Post, post_id)
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
        author_avatar=current_user.avatar,
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


@posts_bp.route('/<int:post_id>', methods=['PUT'])
@jwt_required()
def update_post(current_user, post_id):
    post = db.session.get(Post, post_id)
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
    return jsonify({
        'success': True,
        'message': 'Post updated successfully',
        'post': post.to_dict()
    }), 200


@posts_bp.route('/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(current_user, post_id):
    post = db.session.get(Post, post_id)
    if not post:
        return jsonify({'success': False, 'message': 'Post not found'}), 404

    if post.author_id != current_user.username and current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized to delete this post'}), 403

    db.session.delete(post)
    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Post deleted successfully',
        'id': post_id
    }), 200


@posts_bp.route('/<int:post_id>/like', methods=['POST'])
@jwt_required()
def toggle_like(current_user, post_id):
    post = db.session.get(Post, post_id)
    if not post:
        return jsonify({'success': False, 'message': 'Post not found'}), 404

    existing_like = PostLike.query.filter_by(post_id=post_id, username=current_user.username).first()
    if existing_like:
        db.session.delete(existing_like)
        liked = False
    else:
        new_like = PostLike(post_id=post_id, username=current_user.username)
        db.session.add(new_like)
        liked = True

        # Notify post author if not self
        if post.author_id and post.author_id != current_user.username:
            notif = Notification(
                recipient_id=post.author_id,
                sender_id=current_user.username,
                sender_name=current_user.name or current_user.username,
                sender_avatar=current_user.avatar,
                type='post_like',
                title='New Like on your post',
                message=f"{current_user.name or current_user.username} liked your post \"{post.title}\"",
                target_tab='explore',
                target_id=str(post_id)
            )
            db.session.add(notif)

    db.session.commit()
    liked_users = [l.username for l in post.likes]
    return jsonify({
        'success': True,
        'liked': liked,
        'likes': len(liked_users),
        'likedBy': liked_users
    }), 200


@posts_bp.route('/<int:post_id>/comments', methods=['POST'])
@jwt_required()
def add_comment(current_user, post_id):
    post = db.session.get(Post, post_id)
    if not post:
        return jsonify({'success': False, 'message': 'Post not found'}), 404

    data = request.get_json() or {}
    text = data.get('text', '').strip()
    if not text:
        return jsonify({'success': False, 'message': 'Comment text cannot be empty'}), 400

    comment = PostComment(
        post_id=post_id,
        author=current_user.username,
        author_name=current_user.name or current_user.username,
        author_avatar=current_user.avatar,
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
            target_id=str(post_id)
        )
        db.session.add(notif)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Comment added',
        'comment': comment.to_dict()
    }), 201


@posts_bp.route('/<int:post_id>/comments/<int:comment_id>', methods=['DELETE'])
@jwt_required()
def delete_comment(current_user, post_id, comment_id):
    comment = PostComment.query.filter_by(id=comment_id, post_id=post_id).first()
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


@posts_bp.route('/<int:post_id>/register', methods=['POST'])
@jwt_required()
def register_for_event(current_user, post_id):
    post = db.session.get(Post, post_id)
    if not post or post.type != 'event':
        return jsonify({'success': False, 'message': 'Event not found'}), 404

    data = request.get_json() or {}
    reg = EventRegistration(
        event_id=post_id,
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
