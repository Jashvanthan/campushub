from flask import Blueprint, jsonify
from ..models import db, User, Post, Idea, Workspace, Task, ContributionRequest

stats_bp = Blueprint('stats', __name__, url_prefix='/api')

@stats_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'platform': 'CampusHub API',
        'version': '1.0.0',
        'database': 'connected'
    }), 200


@stats_bp.route('/stats/overview', methods=['GET'])
def get_platform_overview():
    total_users = User.query.count()
    total_posts = Post.query.count()
    total_ideas = Idea.query.count()
    total_workspaces = Workspace.query.count()
    total_tasks = Task.query.count()
    completed_tasks = Task.query.filter_by(status='DONE').count()
    total_contributions = ContributionRequest.query.filter_by(status='ACCEPTED').count()

    trending_projects = Post.query.filter_by(type='project').all()
    trending_projects = sorted(trending_projects, key=lambda p: len(p.likes), reverse=True)[:3]

    latest_events = Post.query.filter_by(type='event').order_by(Post.created_at.desc()).limit(3).all()
    popular_ideas = Idea.query.all()
    popular_ideas = sorted(popular_ideas, key=lambda i: len(i.supports), reverse=True)[:3]

    return jsonify({
        'success': True,
        'metrics': {
            'totalUsers': total_users,
            'totalPosts': total_posts,
            'totalIdeas': total_ideas,
            'totalWorkspaces': total_workspaces,
            'totalTasks': total_tasks,
            'completedTasks': completed_tasks,
            'acceptedContributions': total_contributions
        },
        'trending': [p.to_dict() for p in trending_projects],
        'latestEvents': [e.to_dict() for e in latest_events],
        'popularIdeas': [i.to_dict() for i in popular_ideas]
    }), 200
