import uuid
from flask import Blueprint, request, jsonify
from .. import db
from ..models.notification import Notification
from ..utils.auth_helpers import jwt_required

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('', methods=['GET'])
@jwt_required()
def get_user_notifications(current_user):
    """Fetch all notifications for the current user (or global 'all' notifications), ordered newest first."""
    notifications = Notification.query.filter(
        (Notification.recipient_id == current_user.username) | (Notification.recipient_id == 'all')
    ).order_by(Notification.created_at.desc()).limit(100).all()
    
    return jsonify({
        'success': True,
        'notifications': [n.to_dict() for n in notifications],
        'unreadCount': sum(1 for n in notifications if not n.is_read)
    }), 200


@notifications_bp.route('', methods=['POST'])
@jwt_required()
def create_notification(current_user):
    """Create a new notification."""
    data = request.get_json() or {}
    recipient_id = data.get('recipientId')
    title = data.get('title', '').strip()
    message = data.get('message', '').strip()
    
    if not recipient_id or not title or not message:
        return jsonify({'success': False, 'message': 'recipientId, title, and message are required'}), 400
    
    notif = Notification(
        id=data.get('id') or f"notif-{uuid.uuid4().hex[:8]}",
        recipient_id=recipient_id,
        sender_id=current_user.username,
        sender_name=current_user.name or current_user.username,
        sender_avatar=current_user.avatar,
        type=data.get('type', 'system'),
        title=title,
        message=message,
        target_tab=data.get('targetTab'),
        target_id=data.get('targetId'),
        target_channel=data.get('targetChannel')
    )
    db.session.add(notif)
    db.session.commit()
    
    return jsonify({'success': True, 'notification': notif.to_dict()}), 201


@notifications_bp.route('/<notif_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_read(current_user, notif_id):
    """Mark a notification as read."""
    notif = Notification.query.filter_by(id=notif_id).first()
    if not notif:
        return jsonify({'success': False, 'message': 'Notification not found'}), 404
    
    if notif.recipient_id != current_user.username and notif.recipient_id != 'all' and current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    notif.is_read = True
    db.session.commit()
    return jsonify({'success': True, 'notification': notif.to_dict()}), 200


@notifications_bp.route('/read-all', methods=['PUT'])
@jwt_required()
def mark_all_notifications_read(current_user):
    """Mark all notifications for the current user as read."""
    Notification.query.filter(
        (Notification.recipient_id == current_user.username) | (Notification.recipient_id == 'all')
    ).update({'is_read': True}, synchronize_session=False)
    
    db.session.commit()
    return jsonify({'success': True, 'message': 'All notifications marked as read'}), 200


@notifications_bp.route('/<notif_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(current_user, notif_id):
    """Delete a single notification."""
    notif = Notification.query.filter_by(id=notif_id).first()
    if not notif:
        return jsonify({'success': False, 'message': 'Notification not found'}), 404
    
    if notif.recipient_id != current_user.username and notif.recipient_id != 'all' and current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    db.session.delete(notif)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Notification deleted', 'id': notif_id}), 200


@notifications_bp.route('/clear', methods=['DELETE'])
@jwt_required()
def clear_all_notifications(current_user):
    """Clear all notifications for the current user."""
    Notification.query.filter(
        (Notification.recipient_id == current_user.username) | (Notification.recipient_id == 'all')
    ).delete(synchronize_session=False)
    
    db.session.commit()
    return jsonify({'success': True, 'message': 'All notifications cleared'}), 200
