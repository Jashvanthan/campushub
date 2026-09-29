import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from ..models import (
    db, Idea, IdeaSupport, IdeaFollower, ContributionRequest,
    Workspace, WorkspaceMember, Task, Milestone,
    Discussion, DiscussionReply, WorkspaceFile,
    Activity, ChatMessage, Notification, Post, PostLike
)
from ..utils.auth_helpers import jwt_required

ideas_bp = Blueprint('ideas', __name__, url_prefix='/api/ideas')

@ideas_bp.route('', methods=['GET'])
def get_ideas():
    category = request.args.get('category')
    status = request.args.get('status')
    creator_id = request.args.get('creatorId')
    search = request.args.get('q')

    query = Idea.query
    if category and category != 'all':
        query = query.filter_by(category=category)
    if status and status != 'all':
        query = query.filter_by(status=status)
    if creator_id:
        query = query.filter_by(creator_id=creator_id)
    if search:
        query = query.filter(
            (Idea.title.ilike(f'%{search}%')) | 
            (Idea.problem.ilike(f'%{search}%')) |
            (Idea.solution.ilike(f'%{search}%'))
        )

    ideas = query.order_by(Idea.created_at.desc()).all()
    return jsonify({
        'success': True,
        'ideas': [i.to_dict() for i in ideas],
        'count': len(ideas)
    }), 200


@ideas_bp.route('/<idea_id>', methods=['GET'])
def get_idea(idea_id):
    idea = db.session.get(Idea, idea_id)
    if not idea:
        return jsonify({'success': False, 'message': 'Idea not found'}), 404
    return jsonify({
        'success': True,
        'idea': idea.to_dict()
    }), 200


@ideas_bp.route('', methods=['POST'])
@jwt_required()
def create_idea(current_user):
    data = request.get_json() or {}
    
    title = data.get('title', '').strip()
    problem = data.get('problem', '').strip()
    solution = data.get('solution', '').strip()

    if not title or not problem or not solution:
        return jsonify({'success': False, 'message': 'Title, problem and solution are required'}), 400

    idea_id = data.get('id') or f"idea-{uuid.uuid4().hex[:8]}"
    create_ws = data.get('createWorkspace', True)

    idea = Idea(
        id=idea_id,
        title=title,
        problem=problem,
        solution=solution,
        impact=data.get('impact', ''),
        category=data.get('category', 'Technology'),
        status=data.get('status', 'IDEA'),
        duration=data.get('duration', '1–3 Months'),
        team_size=data.get('teamSize', '3–5'),
        creator_id=current_user.username,
        creator_name=current_user.name or current_user.username,
        creator_avatar=current_user.avatar,
        creator_department=current_user.major or 'Computer Science',
        progress=0
    )

    if 'tags' in data: idea.tags = data['tags']
    if 'skillsRequired' in data: idea.skills_required = data['skillsRequired']
    if 'contributionTypes' in data: idea.contribution_types = data['contributionTypes']
    if 'attachments' in data: idea.attachments = data['attachments']

    workspace_created = None
    if create_ws:
        ws_id = f"ws-{uuid.uuid4().hex[:8]}"
        idea.workspace_id = ws_id
        ws = Workspace(
            id=ws_id,
            idea_id=idea_id,
            name=f"{title} Workspace",
            description=solution,
            category=idea.category,
            visibility='public',
            status='ACTIVE',
            progress=0,
            lead_id=current_user.username,
            lead_name=current_user.name or current_user.username,
            lead_avatar=current_user.avatar
        )
        ws.tags = idea.tags
        member = WorkspaceMember(
            workspace_id=ws_id,
            user_id=current_user.username,
            name=current_user.name or current_user.username,
            username=current_user.username,
            avatar=current_user.avatar,
            role='LEAD'
        )
        db.session.add(ws)
        db.session.add(member)
        workspace_created = ws

    db.session.add(idea)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Idea submitted successfully',
        'idea': idea.to_dict(),
        'workspace': workspace_created.to_dict() if workspace_created else None
    }), 201


@ideas_bp.route('/<idea_id>', methods=['PUT'])
@jwt_required()
def update_idea(current_user, idea_id):
    idea = db.session.get(Idea, idea_id)
    if not idea:
        return jsonify({'success': False, 'message': 'Idea not found'}), 404

    if idea.creator_id != current_user.username and current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized to edit this idea'}), 403

    data = request.get_json() or {}
    if 'title' in data: idea.title = data['title'].strip()
    if 'problem' in data: idea.problem = data['problem'].strip()
    if 'solution' in data: idea.solution = data['solution'].strip()
    if 'impact' in data: idea.impact = data['impact'].strip()
    if 'category' in data: idea.category = data['category']
    if 'status' in data: idea.status = data['status']
    if 'duration' in data: idea.duration = data['duration']
    if 'teamSize' in data: idea.team_size = data['teamSize']
    if 'progress' in data: idea.progress = int(data['progress'])
    if 'tags' in data: idea.tags = data['tags']
    if 'skillsRequired' in data: idea.skills_required = data['skillsRequired']
    if 'contributionTypes' in data: idea.contribution_types = data['contributionTypes']
    if 'attachments' in data: idea.attachments = data['attachments']

    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Idea updated successfully',
        'idea': idea.to_dict()
    }), 200


@ideas_bp.route('/<idea_id>', methods=['DELETE'])
@jwt_required()
def delete_idea(current_user, idea_id):
    idea = db.session.get(Idea, idea_id)
    if not idea:
        return jsonify({'success': False, 'message': 'Idea not found'}), 404

    if idea.creator_id != current_user.username and current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized to delete this idea'}), 403

    # Strict Rule: Cascade delete and close all associated workspaces & sub-entities
    linked_workspaces = Workspace.query.filter(
        (Workspace.idea_id == idea_id) | (Workspace.id == idea.workspace_id)
    ).all()

    for ws in linked_workspaces:
        Task.query.filter_by(workspace_id=ws.id).delete()
        Milestone.query.filter_by(workspace_id=ws.id).delete()
        WorkspaceFile.query.filter_by(workspace_id=ws.id).delete()
        Activity.query.filter_by(workspace_id=ws.id).delete()
        ChatMessage.query.filter_by(workspace_id=ws.id).delete()
        WorkspaceMember.query.filter_by(workspace_id=ws.id).delete()
        discs = Discussion.query.filter_by(workspace_id=ws.id).all()
        for d in discs:
            DiscussionReply.query.filter_by(discussion_id=d.id).delete()
            db.session.delete(d)
        db.session.delete(ws)

    ContributionRequest.query.filter_by(idea_id=idea_id).delete()
    IdeaSupport.query.filter_by(idea_id=idea_id).delete()
    IdeaFollower.query.filter_by(idea_id=idea_id).delete()

    db.session.delete(idea)
    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Idea and associated workspaces have been deleted and closed successfully',
        'id': idea_id
    }), 200


@ideas_bp.route('/<idea_id>/support', methods=['POST'])
@jwt_required()
def toggle_support(current_user, idea_id):
    idea = db.session.get(Idea, idea_id)
    if not idea:
        # Fallback check workspace ID
        ws = db.session.get(Workspace, idea_id)
        if ws and ws.idea_id:
            idea = db.session.get(Idea, ws.idea_id)
        if not idea:
            return jsonify({'success': False, 'message': 'Idea or Workspace not found'}), 404

    target_idea_id = idea.id

    # 1. Check if user already supported via IdeaSupport table
    existing_support = IdeaSupport.query.filter_by(idea_id=target_idea_id, username=current_user.username).first()

    # 2. Check if user already liked the corresponding Idea Post in PostLike table
    matching_post = None
    try:
        numeric_id = int(str(target_idea_id).replace('idea-', ''))
        matching_post = db.session.get(Post, numeric_id)
    except (ValueError, TypeError):
        pass

    if not matching_post:
        matching_post = Post.query.filter(
            (Post.title.ilike(idea.title)) & 
            ((Post.type == 'idea') | (Post.type == 'project'))
        ).first()

    existing_post_like = None
    if matching_post:
        existing_post_like = PostLike.query.filter_by(post_id=matching_post.id, username=current_user.username).first()

    # Synchronized Toggle: If already supported or liked, dislike/remove both; otherwise add both
    if existing_support or existing_post_like:
        if existing_support:
            db.session.delete(existing_support)
        if existing_post_like:
            db.session.delete(existing_post_like)
        supported = False
        message = 'Removed support from this idea.'
    else:
        db.session.add(IdeaSupport(idea_id=target_idea_id, username=current_user.username))
        if matching_post:
            db.session.add(PostLike(post_id=matching_post.id, username=current_user.username))
        supported = True
        message = 'Thank you for supporting this idea!'

    db.session.commit()
    db.session.expire_all()

    fresh_supports = IdeaSupport.query.filter_by(idea_id=target_idea_id).all()
    supported_users = [s.username for s in fresh_supports]

    fresh_post_likes = []
    if matching_post:
        fresh_post_likes = [l.username for l in PostLike.query.filter_by(post_id=matching_post.id).all()]

    return jsonify({
        'success': True,
        'supported': supported,
        'message': message,
        'supportCount': len(supported_users),
        'supportedBy': supported_users,
        'postId': matching_post.id if matching_post else None,
        'postLikes': len(fresh_post_likes),
        'postLikedBy': fresh_post_likes
    }), 200


@ideas_bp.route('/<idea_id>/follow', methods=['POST'])
@jwt_required()
def toggle_follow(current_user, idea_id):
    idea = db.session.get(Idea, idea_id)
    if not idea:
        return jsonify({'success': False, 'message': 'Idea not found'}), 404

    existing = IdeaFollower.query.filter_by(idea_id=idea_id, username=current_user.username).first()
    if existing:
        db.session.delete(existing)
        following = False
    else:
        db.session.add(IdeaFollower(idea_id=idea_id, username=current_user.username))
        following = True

    db.session.commit()
    fresh_followers = IdeaFollower.query.filter_by(idea_id=idea_id).all()
    followers = [f.username for f in fresh_followers]
    return jsonify({
        'success': True,
        'following': following,
        'followedBy': followers
    }), 200


# ─── Contribution Requests ───

@ideas_bp.route('/requests', methods=['GET'])
def get_all_requests():
    idea_id = request.args.get('ideaId')
    applicant_id = request.args.get('applicantId')
    status = request.args.get('status')

    query = ContributionRequest.query
    if idea_id: query = query.filter_by(idea_id=idea_id)
    if applicant_id: query = query.filter_by(applicant_id=applicant_id)
    if status: query = query.filter_by(status=status)

    reqs = query.order_by(ContributionRequest.requested_at.desc()).all()
    return jsonify({
        'success': True,
        'requests': [r.to_dict() for r in reqs]
    }), 200


@ideas_bp.route('/<idea_id>/requests', methods=['POST'])
@jwt_required()
def submit_contribution_request(current_user, idea_id):
    idea = db.session.get(Idea, idea_id)
    if not idea:
        return jsonify({'success': False, 'message': 'Idea not found'}), 404

    data = request.get_json() or {}
    role_applied = data.get('roleApplied', 'Contributor')

    # Check for existing request from this applicant for this idea
    existing_req = ContributionRequest.query.filter_by(
        idea_id=idea_id,
        applicant_id=current_user.username
    ).first()

    if existing_req:
        if existing_req.status == 'PENDING':
            return jsonify({
                'success': True,
                'message': 'Your contribution request is already submitted and pending review.',
                'request': existing_req.to_dict()
            }), 200
        
        # Re-apply if previously left or rejected
        existing_req.role_applied = role_applied
        existing_req.experience = data.get('experience', '')
        existing_req.motivation = data.get('motivation', '')
        existing_req.status = 'PENDING'
        existing_req.requested_at = datetime.now(timezone.utc)
        existing_req.responded_at = None
        if 'skills' in data: existing_req.skills = data['skills']
        req = existing_req
    else:
        req_id = f"req-{uuid.uuid4().hex[:8]}"
        req = ContributionRequest(
            id=req_id,
            idea_id=idea_id,
            idea_title=idea.title,
            applicant_id=current_user.username,
            applicant_name=current_user.name or current_user.username,
            applicant_avatar=current_user.avatar,
            role_applied=role_applied,
            experience=data.get('experience', ''),
            motivation=data.get('motivation', ''),
            status='PENDING'
        )
        if 'skills' in data: req.skills = data['skills']
        db.session.add(req)

    # Notify idea creator
    if idea.creator_id and idea.creator_id != current_user.username:
        notif = Notification(
            recipient_id=idea.creator_id,
            sender_id=current_user.username,
            sender_name=current_user.name or current_user.username,
            sender_avatar=current_user.avatar,
            type='contribution_request',
            title='New Contribution Request',
            message=f"{current_user.name or current_user.username} applied as {role_applied} for \"{idea.title}\"",
            target_tab='ideas',
            target_id=idea_id
        )
        db.session.add(notif)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Contribution request submitted successfully',
        'request': req.to_dict()
    }), 201


@ideas_bp.route('/requests/<req_id>/respond', methods=['POST'])
@jwt_required()
def respond_contribution_request(current_user, req_id):
    req_obj = db.session.get(ContributionRequest, req_id)
    if not req_obj:
        return jsonify({'success': False, 'message': 'Request not found'}), 404

    idea = db.session.get(Idea, req_obj.idea_id)
    # Only Idea Creator or Admin can respond
    if idea and idea.creator_id != current_user.username and current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized to manage requests for this idea'}), 403

    data = request.get_json() or {}
    action = data.get('action') # 'ACCEPT' or 'REJECT'

    if action == 'ACCEPT':
        req_obj.status = 'ACCEPTED'
        req_obj.responded_at = datetime.now(timezone.utc)
        
        # Resolve linked workspace
        ws = None
        if idea and idea.workspace_id:
            ws = db.session.get(Workspace, idea.workspace_id)
        if not ws and idea:
            ws = Workspace.query.filter_by(idea_id=idea.id).first()

        if ws:
            if idea and not idea.workspace_id:
                idea.workspace_id = ws.id

            existing_member = WorkspaceMember.query.filter_by(workspace_id=ws.id, user_id=req_obj.applicant_id).first()
            if not existing_member:
                db.session.add(WorkspaceMember(
                    workspace_id=ws.id,
                    user_id=req_obj.applicant_id,
                    name=req_obj.applicant_name,
                    username=req_obj.applicant_id,
                    avatar=req_obj.applicant_avatar,
                    role='CONTRIBUTOR'
                ))
                # Add activity record
                act = Activity(
                    id=f"act-{uuid.uuid4().hex[:8]}",
                    workspace_id=ws.id,
                    actor_id=req_obj.applicant_id,
                    actor_name=req_obj.applicant_name,
                    actor_avatar=req_obj.applicant_avatar or 'CU',
                    description=f"joined the workspace as {req_obj.role_applied}",
                    type='member'
                )
                db.session.add(act)
        
        # Notify applicant
        notif = Notification(
            recipient_id=req_obj.applicant_id,
            sender_id=current_user.username,
            sender_name=current_user.name or current_user.username,
            sender_avatar=current_user.avatar,
            type='contribution_status',
            title='Contribution Request Accepted! 🎉',
            message=f"Your request to join \"{idea.title if idea else 'the project'}\" was accepted!",
            target_tab='workspaces' if (ws or (idea and idea.workspace_id)) else 'ideas',
            target_id=(ws.id if ws else (idea.workspace_id if idea else idea.id))
        )
        db.session.add(notif)
    elif action == 'REJECT':
        req_obj.status = 'REJECTED'
        req_obj.responded_at = datetime.now(timezone.utc)
        notif = Notification(
            recipient_id=req_obj.applicant_id,
            sender_id=current_user.username,
            sender_name=current_user.name or current_user.username,
            sender_avatar=current_user.avatar,
            type='contribution_status',
            title='Contribution Request Declined',
            message=f"Your request to join \"{idea.title if idea else 'the project'}\" was not accepted.",
            target_tab='ideas',
            target_id=idea.id if idea else req_obj.idea_id
        )
        db.session.add(notif)
    else:
        return jsonify({'success': False, 'message': 'Invalid action'}), 400

    db.session.commit()
    return jsonify({
        'success': True,
        'message': f"Request {req_obj.status.lower()} successfully",
        'request': req_obj.to_dict()
    }), 200
