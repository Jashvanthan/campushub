import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from ..models import (
    db, Workspace, WorkspaceMember, Task, Milestone,
    Discussion, DiscussionReply, WorkspaceFile,
    Activity, ChatMessage, Notification, Idea, ContributionRequest
)
from ..utils.auth_helpers import jwt_required

workspaces_bp = Blueprint('workspaces', __name__, url_prefix='/api/workspaces')

@workspaces_bp.route('', methods=['GET'])
def get_workspaces():
    category = request.args.get('category')
    user_id = request.args.get('userId')
    search = request.args.get('q')

    query = Workspace.query
    if category and category != 'all':
        query = query.filter_by(category=category)
    if search:
        query = query.filter(
            (Workspace.name.ilike(f'%{search}%')) |
            (Workspace.description.ilike(f'%{search}%'))
        )

    all_workspaces = query.order_by(Workspace.updated_at.desc()).all()
    
    # Strict Rule: Filter out workspaces whose associated idea is deleted/does not exist or status is CLOSED
    valid_workspaces = []
    for w in all_workspaces:
        if w.status == 'CLOSED':
            continue
        if w.idea_id:
            linked_idea = db.session.get(Idea, w.idea_id)
            if not linked_idea:
                continue
        valid_workspaces.append(w)

    if user_id:
        valid_workspaces = [w for w in valid_workspaces if any(m.user_id == user_id for m in w.members)]

    return jsonify({
        'success': True,
        'workspaces': [w.to_dict() for w in valid_workspaces],
        'count': len(valid_workspaces)
    }), 200


@workspaces_bp.route('/<workspace_id>', methods=['GET'])
def get_workspace_details(workspace_id):
    ws = db.session.get(Workspace, workspace_id)
    if not ws:
        return jsonify({'success': False, 'message': 'Workspace not found'}), 404

    # Strict Rule: If associated idea does not exist or workspace is closed, deny opening
    if ws.status == 'CLOSED':
        return jsonify({
            'success': False,
            'message': 'This workspace is closed because its associated campus idea was removed.',
            'closed': True
        }), 410

    if ws.idea_id:
        linked_idea = db.session.get(Idea, ws.idea_id)
        if not linked_idea:
            return jsonify({
                'success': False,
                'message': 'This workspace cannot be opened because its associated campus idea was deleted.',
                'closed': True
            }), 410

    activities = Activity.query.filter_by(workspace_id=workspace_id).order_by(Activity.timestamp.desc()).all()
    tasks = Task.query.filter_by(workspace_id=workspace_id).order_by(Task.created_at.asc()).all()
    milestones = Milestone.query.filter_by(workspace_id=workspace_id).order_by(Milestone.created_at.asc()).all()
    discussions = Discussion.query.filter_by(workspace_id=workspace_id).order_by(Discussion.created_at.desc()).all()
    files = WorkspaceFile.query.filter_by(workspace_id=workspace_id).order_by(WorkspaceFile.uploaded_at.desc()).all()
    chat_messages = ChatMessage.query.filter_by(workspace_id=workspace_id).order_by(ChatMessage.timestamp.asc()).all()

    return jsonify({
        'success': True,
        'workspace': ws.to_dict(),
        'tasks': [t.to_dict() for t in tasks],
        'milestones': [m.to_dict() for m in milestones],
        'discussions': [d.to_dict() for d in discussions],
        'files': [f.to_dict() for f in files],
        'activities': [a.to_dict() for a in activities],
        'chatMessages': [c.to_dict() for c in chat_messages]
    }), 200


@workspaces_bp.route('', methods=['POST'])
@jwt_required()
def create_workspace(current_user):
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    description = data.get('description', '').strip()

    if not name or not description:
        return jsonify({'success': False, 'message': 'Name and description are required'}), 400

    ws_id = data.get('id') or f"ws-{uuid.uuid4().hex[:8]}"
    ws = Workspace(
        id=ws_id,
        idea_id=data.get('ideaId'),
        name=name,
        description=description,
        category=data.get('category', 'Technology'),
        visibility=data.get('visibility', 'public'),
        status=data.get('status', 'ACTIVE'),
        progress=int(data.get('progress', 0)),
        lead_id=current_user.username,
        lead_name=current_user.name or current_user.username,
        lead_avatar=current_user.avatar
    )
    if 'tags' in data: ws.tags = data['tags']

    member = WorkspaceMember(
        workspace_id=ws_id,
        user_id=current_user.username,
        name=current_user.name or current_user.username,
        username=current_user.username,
        avatar=current_user.avatar,
        role='LEAD'
    )

    act = Activity(
        id=f"act-{uuid.uuid4().hex[:8]}",
        workspace_id=ws_id,
        actor_id=current_user.username,
        actor_name=current_user.name or current_user.username,
        actor_avatar=current_user.avatar,
        description="initialized the workspace",
        type='member'
    )

    db.session.add(ws)
    db.session.add(member)
    db.session.add(act)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Workspace created successfully',
        'workspace': ws.to_dict()
    }), 201


@workspaces_bp.route('/<workspace_id>', methods=['PUT'])
@jwt_required()
def update_workspace(current_user, workspace_id):
    ws = db.session.get(Workspace, workspace_id)
    if not ws:
        return jsonify({'success': False, 'message': 'Workspace not found'}), 404

    is_member = any(m.user_id == current_user.username for m in ws.members)
    if ws.lead_id != current_user.username and current_user.role != 'admin' and not is_member:
        return jsonify({'success': False, 'message': 'Unauthorized to modify this workspace'}), 403

    data = request.get_json() or {}
    if 'name' in data: ws.name = data['name'].strip()
    if 'description' in data: ws.description = data['description'].strip()
    if 'category' in data: ws.category = data['category']
    if 'visibility' in data: ws.visibility = data['visibility']
    if 'status' in data: ws.status = data['status']
    if 'progress' in data: ws.progress = int(data['progress'])
    if 'tags' in data: ws.tags = data['tags']

    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Workspace updated',
        'workspace': ws.to_dict()
    }), 200


@workspaces_bp.route('/<workspace_id>', methods=['DELETE'])
@jwt_required()
def delete_workspace(current_user, workspace_id):
    ws = db.session.get(Workspace, workspace_id)
    if not ws:
        return jsonify({'success': False, 'message': 'Workspace not found'}), 404

    if ws.lead_id != current_user.username and current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized to delete this workspace'}), 403

    Task.query.filter_by(workspace_id=workspace_id).delete()
    Milestone.query.filter_by(workspace_id=workspace_id).delete()
    WorkspaceFile.query.filter_by(workspace_id=workspace_id).delete()
    Activity.query.filter_by(workspace_id=workspace_id).delete()
    ChatMessage.query.filter_by(workspace_id=workspace_id).delete()
    WorkspaceMember.query.filter_by(workspace_id=workspace_id).delete()
    discs = Discussion.query.filter_by(workspace_id=workspace_id).all()
    for d in discs:
        DiscussionReply.query.filter_by(discussion_id=d.id).delete()
        db.session.delete(d)

    db.session.delete(ws)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Workspace deleted successfully',
        'id': workspace_id
    }), 200


@workspaces_bp.route('/<workspace_id>/leave', methods=['POST'])
@jwt_required()
def leave_workspace(current_user, workspace_id):
    ws = db.session.get(Workspace, workspace_id)
    if not ws:
        return jsonify({'success': False, 'message': 'Workspace not found'}), 404

    if ws.lead_id == current_user.username:
        return jsonify({'success': False, 'message': 'Workspace owner/lead cannot leave without transferring ownership.'}), 400

    member = WorkspaceMember.query.filter_by(workspace_id=workspace_id, user_id=current_user.username).first()
    if not member:
        return jsonify({'success': False, 'message': 'You are not an active member of this workspace'}), 404

    db.session.delete(member)

    # Update contribution request if any
    if ws.idea_id:
        req = ContributionRequest.query.filter_by(idea_id=ws.idea_id, applicant_id=current_user.username).first()
        if req:
            req.status = 'LEFT'

    # Add activity record
    act = Activity(
        id=f"act-{uuid.uuid4().hex[:8]}",
        workspace_id=workspace_id,
        actor_id=current_user.username,
        actor_name=current_user.name or current_user.username,
        actor_avatar=current_user.avatar or 'CU',
        description="left the workspace",
        type='member'
    )
    db.session.add(act)
    db.session.commit()

    return jsonify({'success': True, 'message': 'Successfully left workspace'}), 200


# ─── Tasks ───

@workspaces_bp.route('/<workspace_id>/tasks', methods=['GET'])
def get_tasks(workspace_id):
    tasks = Task.query.filter_by(workspace_id=workspace_id).order_by(Task.created_at.asc()).all()
    return jsonify({'success': True, 'tasks': [t.to_dict() for t in tasks]}), 200


@workspaces_bp.route('/<workspace_id>/tasks', methods=['POST'])
@jwt_required()
def create_task(current_user, workspace_id):
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    if not title:
        return jsonify({'success': False, 'message': 'Task title required'}), 400

    task_id = data.get('id') or f"task-{uuid.uuid4().hex[:8]}"
    task = Task(
        id=task_id,
        workspace_id=workspace_id,
        title=title,
        description=data.get('description', ''),
        assignee_id=data.get('assigneeId', current_user.username),
        assignee_name=data.get('assigneeName', current_user.name or current_user.username),
        assignee_avatar=data.get('assigneeAvatar', current_user.avatar),
        status=data.get('status', 'TODO'),
        priority=data.get('priority', 'MEDIUM'),
        due_date=data.get('dueDate')
    )
    if 'tags' in data: task.tags = data['tags']

    act = Activity(
        id=f"act-{uuid.uuid4().hex[:8]}",
        workspace_id=workspace_id,
        actor_id=current_user.username,
        actor_name=current_user.name or current_user.username,
        actor_avatar=current_user.avatar,
        description=f"created task \"{title}\"",
        type='task'
    )

    db.session.add(task)
    db.session.add(act)
    db.session.commit()
    return jsonify({'success': True, 'task': task.to_dict()}), 201


@workspaces_bp.route('/<workspace_id>/tasks/<task_id>', methods=['PUT'])
@jwt_required()
def update_task(current_user, workspace_id, task_id):
    task = Task.query.filter_by(id=task_id, workspace_id=workspace_id).first()
    if not task:
        return jsonify({'success': False, 'message': 'Task not found'}), 404

    data = request.get_json() or {}
    old_status = task.status
    if 'title' in data: task.title = data['title']
    if 'description' in data: task.description = data['description']
    if 'status' in data: task.status = data['status']
    if 'priority' in data: task.priority = data['priority']
    if 'dueDate' in data: task.due_date = data['dueDate']
    if 'assigneeId' in data: task.assignee_id = data['assigneeId']
    if 'assigneeName' in data: task.assignee_name = data['assigneeName']
    if 'assigneeAvatar' in data: task.assignee_avatar = data['assigneeAvatar']
    if 'tags' in data: task.tags = data['tags']

    if 'status' in data and data['status'] == 'DONE' and old_status != 'DONE':
        act = Activity(
            id=f"act-{uuid.uuid4().hex[:8]}",
            workspace_id=workspace_id,
            actor_id=current_user.username,
            actor_name=current_user.name or current_user.username,
            actor_avatar=current_user.avatar,
            description=f"completed task \"{task.title}\"",
            type='task'
        )
        db.session.add(act)

    db.session.commit()
    return jsonify({'success': True, 'task': task.to_dict()}), 200


@workspaces_bp.route('/<workspace_id>/tasks/<task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(current_user, workspace_id, task_id):
    task = Task.query.filter_by(id=task_id, workspace_id=workspace_id).first()
    if not task:
        return jsonify({'success': False, 'message': 'Task not found'}), 404

    db.session.delete(task)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Task deleted', 'id': task_id}), 200


# ─── Milestones ───

@workspaces_bp.route('/<workspace_id>/milestones', methods=['POST'])
@jwt_required()
def create_milestone(current_user, workspace_id):
    data = request.get_json() or {}
    ms_id = data.get('id') or f"ms-{uuid.uuid4().hex[:8]}"
    title = data.get('title', 'New Milestone').strip()
    ms = Milestone(
        id=ms_id,
        workspace_id=workspace_id,
        title=title,
        description=data.get('description', ''),
        due_date=data.get('dueDate'),
        progress=int(data.get('progress', 0)),
        status=data.get('status', 'UPCOMING')
    )
    if 'deliverables' in data: ms.deliverables = data['deliverables']

    act = Activity(
        id=f"act-{uuid.uuid4().hex[:8]}",
        workspace_id=workspace_id,
        actor_id=current_user.username,
        actor_name=current_user.name or current_user.username,
        actor_avatar=current_user.avatar,
        description=f"created milestone \"{title}\"",
        type='milestone'
    )

    db.session.add(ms)
    db.session.add(act)
    db.session.commit()
    return jsonify({'success': True, 'milestone': ms.to_dict()}), 201


@workspaces_bp.route('/<workspace_id>/milestones/<ms_id>', methods=['PUT'])
@jwt_required()
def update_milestone(current_user, workspace_id, ms_id):
    ms = Milestone.query.filter_by(id=ms_id, workspace_id=workspace_id).first()
    if not ms:
        return jsonify({'success': False, 'message': 'Milestone not found'}), 404

    data = request.get_json() or {}
    old_status = ms.status
    if 'title' in data: ms.title = data['title']
    if 'description' in data: ms.description = data['description']
    if 'dueDate' in data: ms.due_date = data['dueDate']
    if 'progress' in data: ms.progress = int(data['progress'])
    if 'status' in data: ms.status = data['status']
    if 'deliverables' in data: ms.deliverables = data['deliverables']

    if 'status' in data and data['status'] == 'COMPLETED' and old_status != 'COMPLETED':
        act = Activity(
            id=f"act-{uuid.uuid4().hex[:8]}",
            workspace_id=workspace_id,
            actor_id=current_user.username,
            actor_name=current_user.name or current_user.username,
            actor_avatar=current_user.avatar,
            description=f"completed milestone \"{ms.title}\"",
            type='milestone'
        )
        db.session.add(act)

    db.session.commit()
    return jsonify({'success': True, 'milestone': ms.to_dict()}), 200


@workspaces_bp.route('/<workspace_id>/milestones/<ms_id>', methods=['DELETE'])
@jwt_required()
def delete_milestone(current_user, workspace_id, ms_id):
    ms = Milestone.query.filter_by(id=ms_id, workspace_id=workspace_id).first()
    if not ms:
        return jsonify({'success': False, 'message': 'Milestone not found'}), 404

    db.session.delete(ms)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Milestone deleted', 'id': ms_id}), 200


# ─── Discussions ───

@workspaces_bp.route('/<workspace_id>/discussions', methods=['POST'])
@jwt_required()
def create_discussion(current_user, workspace_id):
    data = request.get_json() or {}
    disc_id = data.get('id') or f"disc-{uuid.uuid4().hex[:8]}"
    title = data.get('title', 'Discussion Topic').strip()
    disc = Discussion(
        id=disc_id,
        workspace_id=workspace_id,
        title=title,
        content=data.get('content', ''),
        category=data.get('category', 'General'),
        author_id=current_user.username,
        author_name=current_user.name or current_user.username,
        author_avatar=current_user.avatar
    )

    act = Activity(
        id=f"act-{uuid.uuid4().hex[:8]}",
        workspace_id=workspace_id,
        actor_id=current_user.username,
        actor_name=current_user.name or current_user.username,
        actor_avatar=current_user.avatar,
        description=f"started discussion \"{title}\"",
        type='discussion'
    )

    db.session.add(disc)
    db.session.add(act)
    db.session.commit()
    return jsonify({'success': True, 'discussion': disc.to_dict()}), 201


@workspaces_bp.route('/<workspace_id>/discussions/<disc_id>/replies', methods=['POST'])
@jwt_required()
def reply_discussion(current_user, workspace_id, disc_id):
    disc = Discussion.query.filter_by(id=disc_id, workspace_id=workspace_id).first()
    if not disc:
        return jsonify({'success': False, 'message': 'Discussion not found'}), 404

    data = request.get_json() or {}
    reply_id = f"rep-{uuid.uuid4().hex[:8]}"
    reply = DiscussionReply(
        id=reply_id,
        discussion_id=disc_id,
        author_id=current_user.username,
        author_name=current_user.name or current_user.username,
        author_avatar=current_user.avatar,
        text=data.get('text', '')
    )
    db.session.add(reply)
    db.session.commit()
    return jsonify({'success': True, 'reply': reply.to_dict(), 'discussion': disc.to_dict()}), 201


# ─── Chat Messages ───

@workspaces_bp.route('/<workspace_id>/chat', methods=['GET'])
def get_chat_messages(workspace_id):
    channel = request.args.get('channel')
    query = ChatMessage.query.filter_by(workspace_id=workspace_id)
    if channel:
        query = query.filter_by(channel=channel)
    messages = query.order_by(ChatMessage.timestamp.asc()).all()
    return jsonify({'success': True, 'messages': [m.to_dict() for m in messages]}), 200


@workspaces_bp.route('/<workspace_id>/chat', methods=['POST'])
@jwt_required()
def send_chat_message(current_user, workspace_id):
    ws = db.session.get(Workspace, workspace_id)
    if not ws:
        return jsonify({'success': False, 'message': 'Workspace not found'}), 404

    data = request.get_json() or {}
    text = (data.get('content') or data.get('message') or '').strip()
    code_snippet = data.get('codeSnippet')

    # Basic Chat Rules Validation
    if not text and not code_snippet:
        return jsonify({'success': False, 'message': 'Message cannot be empty'}), 400

    if len(text) > 1000:
        return jsonify({'success': False, 'message': 'Message exceeds maximum limit of 1000 characters'}), 400

    if not text and code_snippet:
        text = f"Shared a code snippet: {code_snippet.get('title', 'snippet.js')}"

    msg_id = data.get('id') or f"chat-{uuid.uuid4().hex[:8]}"
    channel = data.get('channel') or 'general'
    sender_role = data.get('senderRole') or 'Contributor'
    
    # Try finding member's actual role in this workspace
    member = WorkspaceMember.query.filter_by(workspace_id=workspace_id, user_id=current_user.username).first()
    if member:
        sender_role = member.role
    elif ws.lead_id == current_user.username:
        sender_role = 'Lead'

    chat = ChatMessage(
        id=msg_id,
        workspace_id=workspace_id,
        channel=channel,
        sender_id=current_user.username,
        sender_name=current_user.name or current_user.username,
        sender_avatar=current_user.avatar or (current_user.name or current_user.username)[:2].upper(),
        sender_role=sender_role,
        message=text,
        is_system=bool(data.get('isSystem', False))
    )
    if data.get('replyTo'):
        chat.reply_to = data['replyTo']
    if code_snippet:
        chat.code_snippet = code_snippet

    db.session.add(chat)

    # Automatically generate in-app notifications for workspace members
    try:
        members = WorkspaceMember.query.filter_by(workspace_id=workspace_id).all()
        member_ids = {m.user_id for m in members}
        if ws.lead_id:
            member_ids.add(ws.lead_id)
        # Notify everyone except the sender
        for recipient in member_ids:
            if recipient != current_user.username:
                notif = Notification(
                    recipient_id=recipient,
                    sender_id=current_user.username,
                    sender_name=current_user.name or current_user.username,
                    sender_avatar=current_user.avatar,
                    type='chat',
                    title=f"New Message in #{channel}",
                    message=f"{current_user.name or current_user.username} posted in {ws.name}: {text[:80]}",
                    target_tab='workspaces',
                    target_id=workspace_id,
                    target_channel=channel
                )
                db.session.add(notif)
    except Exception as e:
        # Non-fatal if notification trigger encounters an issue
        pass

    db.session.commit()
    return jsonify({'success': True, 'message': chat.to_dict()}), 201


@workspaces_bp.route('/<workspace_id>/chat/<msg_id>/react', methods=['POST'])
@jwt_required()
def react_chat_message(current_user, workspace_id, msg_id):
    msg = ChatMessage.query.filter_by(id=msg_id, workspace_id=workspace_id).first()
    if not msg:
        return jsonify({'success': False, 'message': 'Message not found'}), 404

    data = request.get_json() or {}
    emoji = data.get('emoji')
    if not emoji:
        return jsonify({'success': False, 'message': 'Emoji is required'}), 400

    reactions = dict(msg.reactions)
    user_list = list(reactions.get(emoji, []))
    u = current_user.username
    if u in user_list:
        user_list.remove(u)
    else:
        user_list.append(u)

    if user_list:
        reactions[emoji] = user_list
    else:
        reactions.pop(emoji, None)

    msg.reactions = reactions
    db.session.commit()
    return jsonify({'success': True, 'message': msg.to_dict()}), 200


@workspaces_bp.route('/<workspace_id>/chat/<msg_id>', methods=['DELETE'])
@jwt_required()
def delete_chat_message(current_user, workspace_id, msg_id):
    msg = ChatMessage.query.filter_by(id=msg_id, workspace_id=workspace_id).first()
    if not msg:
        return jsonify({'success': False, 'message': 'Message not found'}), 404

    ws = db.session.get(Workspace, workspace_id)
    is_ws_lead = ws and ws.lead_id == current_user.username
    if msg.sender_id != current_user.username and current_user.role != 'admin' and not is_ws_lead:
        return jsonify({'success': False, 'message': 'Unauthorized to delete this message'}), 403

    db.session.delete(msg)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Message deleted', 'id': msg_id}), 200


@workspaces_bp.route('/<workspace_id>/chat/clear', methods=['DELETE'])
@jwt_required()
def clear_all_chat_messages(current_user, workspace_id):
    ws = db.session.get(Workspace, workspace_id)
    if not ws:
        return jsonify({'success': False, 'message': 'Workspace not found'}), 404

    if ws.lead_id != current_user.username and current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Only workspace leads or admins can clear chat'}), 403

    channel = request.args.get('channel')
    query = ChatMessage.query.filter_by(workspace_id=workspace_id)
    if channel:
        query = query.filter_by(channel=channel)
    
    query.delete(synchronize_session=False)
    db.session.commit()
    return jsonify({'success': True, 'message': f"All chat messages{' in #' + channel if channel else ''} cleared"}), 200


# ─── Files ───

@workspaces_bp.route('/<workspace_id>/files', methods=['POST'])
@jwt_required()
def add_file(current_user, workspace_id):
    data = request.get_json() or {}
    file_id = data.get('id') or f"file-{uuid.uuid4().hex[:8]}"
    file_name = data.get('name', 'file.txt').strip()
    f = WorkspaceFile(
        id=file_id,
        workspace_id=workspace_id,
        name=file_name,
        size=data.get('size', '1.0 MB'),
        type=data.get('type', 'application/octet-stream'),
        url=data.get('url'),
        uploader_id=current_user.username,
        uploader_name=current_user.name or current_user.username
    )

    act = Activity(
        id=f"act-{uuid.uuid4().hex[:8]}",
        workspace_id=workspace_id,
        actor_id=current_user.username,
        actor_name=current_user.name or current_user.username,
        actor_avatar=current_user.avatar,
        description=f"uploaded file \"{file_name}\"",
        type='file'
    )

    db.session.add(f)
    db.session.add(act)
    db.session.commit()
    return jsonify({'success': True, 'file': f.to_dict()}), 201


@workspaces_bp.route('/<workspace_id>/files/<file_id>', methods=['DELETE'])
@jwt_required()
def delete_file(current_user, workspace_id, file_id):
    f = WorkspaceFile.query.filter_by(id=file_id, workspace_id=workspace_id).first()
    if not f:
        return jsonify({'success': False, 'message': 'File not found'}), 404

    db.session.delete(f)
    db.session.commit()
    return jsonify({'success': True, 'message': 'File deleted', 'id': file_id}), 200
