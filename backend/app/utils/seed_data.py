from datetime import datetime
from ..models import (
    db, User, Post, PostLike, PostComment,
    Idea, IdeaSupport, IdeaFollower, ContributionRequest,
    Workspace, WorkspaceMember, Task, Milestone,
    Discussion, DiscussionReply, WorkspaceFile,
    Activity, ChatMessage
)

DEFAULT_USERS = [
    {
        'username': 'admin',
        'password': 'Admin@2025!',
        'role': 'admin',
        'name': 'Campus Admin',
        'email': 'admin@campushub.edu',
        'avatar': 'AD',
        'institution': 'CampusHub University',
        'major': 'System Administration',
        'bio': 'CampusHub central administrator managing campus safety, announcements, hackathons, and workspace infrastructure.',
        'skills': ['Administration', 'Moderation', 'IT Systems', 'Community Management'],
        'joined': 'January 2025'
    },
    {
        'username': 'student1',
        'password': 'Student@2025!',
        'role': 'student',
        'name': 'Student One',
        'email': 'student1@campushub.edu',
        'avatar': 'S1',
        'institution': 'CampusHub University',
        'major': 'B.S. Computer Science',
        'bio': 'Computer science undergraduate building campus collaborative tools, hackathons, and student engineering workspaces.',
        'skills': ['React', 'JavaScript', 'Python', 'CSS', 'Git', 'Node.js'],
        'joined': 'January 2025'
    },
    {
        'username': 'std1',
        'password': 'Student@2025!',
        'role': 'student',
        'name': 'Student One',
        'email': 'student1@campushub.edu',
        'avatar': 'S1',
        'institution': 'CampusHub University',
        'major': 'B.S. Computer Science',
        'bio': 'Computer science undergraduate building campus collaborative tools, hackathons, and student engineering workspaces.',
        'skills': ['React', 'JavaScript', 'Python', 'CSS', 'Git', 'Node.js'],
        'joined': 'January 2025'
    }
]

def seed_database():
    """Populates database with default users, posts, ideas, workspaces, and comments safely."""
    try:
        # 1. Seed Users
        for u_data in DEFAULT_USERS:
            try:
                existing = User.query.filter_by(username=u_data['username']).first()
                if not existing:
                    user = User(
                        username=u_data['username'],
                        role=u_data['role'],
                        name=u_data['name'],
                        email=u_data['email'],
                        avatar=u_data['avatar'],
                        institution=u_data['institution'],
                        major=u_data['major'],
                        bio=u_data['bio'],
                        joined_date=u_data['joined']
                    )
                    user.set_password(u_data['password'])
                    user.skills = u_data['skills']
                    db.session.add(user)
                    db.session.commit()
            except Exception:
                db.session.rollback()

        # 2. Seed Posts if empty
        try:
            if Post.query.count() == 0:
                p1 = Post(
                    id=1,
                    type='project',
                    title='Smart Campus Attendance & Recognition System',
                    description='Automated campus attendance tracking powered by computer vision and deep learning with real-time analytics dashboard.',
                    author_id='student1',
                    author_name='Student One',
                    author_avatar='S1',
                    department='Computer Science',
                    image='https://images.unsplash.com/photo-1555949963-aa79dcee57d5?auto=format&fit=crop&q=80&w=800',
                    visibility='everyone'
                )
                p1.tags = ['AI/ML', 'Computer Vision', 'Python']

                p2 = Post(
                    id=2,
                    type='event',
                    title='Campus Innovators Hackathon 2026',
                    description='Join us for a 48-hour collaborative engineering sprint! Build solutions for sustainability, smart campus, and student health.',
                    author_id='admin',
                    author_name='Campus Admin',
                    author_avatar='AD',
                    location='Main Auditorium & Virtual Hub',
                    event_date='2026-04-15',
                    event_time='09:00 AM',
                    duration='48 Hours',
                    category='Hackathon',
                    participant_type='team',
                    min_team_size=2,
                    max_team_size=4,
                    image='https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800',
                    visibility='everyone'
                )
                p2.tags = ['Hackathon', 'Coding', 'Innovation']

                p3 = Post(
                    id=3,
                    type='idea',
                    title='Automated Digital Campus Library Kiosk',
                    description='Self-service interactive library stations with RFID tracking, automated reservations, and fast book check-in/out.',
                    author_id='student1',
                    author_name='Student One',
                    author_avatar='S1',
                    status='Under Review',
                    image='https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=800',
                    visibility='everyone'
                )
                p3.tags = ['IoT', 'Library', 'Hardware']

                p4 = Post(
                    id=4,
                    type='issue',
                    title='Campus Wi-Fi Bandwidth Optimization in Engineering Wing',
                    description='High latency reported during peak lecture hours across 3rd floor labs. Networking team is deploying enhanced mesh routing.',
                    author_id='admin',
                    author_name='Campus Admin',
                    author_avatar='AD',
                    priority='High',
                    resolved=False,
                    visibility='everyone'
                )
                p4.tags = ['Network', 'Infrastructure', 'Campus']

                db.session.add_all([p1, p2, p3, p4])
                db.session.commit()

                # Seed Comments & Likes
                c1 = PostComment(post_id=1, author='admin', author_name='Campus Admin', text='Excellent architecture! Let us coordinate on server deployment.')
                c2 = PostComment(post_id=1, author='student1', author_name='Student One', text='Thanks! The prototype repository will be linked in the workspace.')
                c3 = PostComment(post_id=4, author='student1', author_name='Student One', text='Confirmed improved speeds near Lab 204.')
                db.session.add_all([c1, c2, c3])

                l1 = PostLike(post_id=1, username='admin')
                l2 = PostLike(post_id=1, username='student1')
                l3 = PostLike(post_id=2, username='student1')
                db.session.add_all([l1, l2, l3])
                db.session.commit()
        except Exception:
            db.session.rollback()

        # 3. Seed Ideas if empty
        try:
            if Idea.query.count() == 0:
                i1 = Idea(
                    id='idea-1',
                    title='Smart Campus Navigation & Interactive Wayfinding',
                    problem='Students and visitors often need fast turn-by-turn guidance across academic blocks, labs, and lecture halls.',
                    solution='Develop a responsive web application with indoor navigation, interactive floor plans, and accessible routes.',
                    impact='Saves time for 10,000+ campus members and ensures seamless event navigation.',
                    category='Technology',
                    status='IN DEVELOPMENT',
                    duration='1–3 Months',
                    team_size='4–6',
                    creator_id='student1',
                    creator_name='Student One',
                    creator_avatar='S1',
                    creator_department='Computer Science',
                    progress=70,
                    workspace_id='ws-1'
                )
                i1.tags = ['Navigation', 'SmartCampus', 'React', 'ThreeJS']
                i1.skills_required = ['React', 'Frontend', 'UI/UX', 'Node.js', 'Python']
                i1.contribution_types = ['Frontend Developer', 'UI/UX Designer', 'Backend Developer', 'QA Tester']
                i1.attachments = [
                    {'name': 'campus_navigation_architecture.pdf', 'size': '2.4 MB', 'type': 'application/pdf'},
                    {'name': 'ui_wireframes_v2.png', 'size': '1.1 MB', 'type': 'image/png'}
                ]

                i2 = Idea(
                    id='idea-2',
                    title='AI Peer Tutoring & Collaborative Study Pods',
                    problem='Students often seek study partners and peer mentors tailored to specific subject modules and mutual availability.',
                    solution='Intelligent matchmaking platform connecting students based on syllabus topics, course schedules, and study goals.',
                    impact='Enhances academic mastery and fosters inclusive peer learning across departments.',
                    category='Education',
                    status='OPEN FOR CONTRIBUTION',
                    duration='2–4 Weeks',
                    team_size='2–4',
                    creator_id='admin',
                    creator_name='Campus Admin',
                    creator_avatar='AD',
                    creator_department='System Administration',
                    progress=35,
                    workspace_id='ws-2'
                )
                i2.tags = ['AI/ML', 'PeerLearning', 'Python', 'FastAPI']
                i2.skills_required = ['Python', 'AI/ML', 'Backend', 'React', 'UI/UX']
                i2.contribution_types = ['Full Stack Engineer', 'Backend Developer', 'UI/UX Designer']

                db.session.add_all([i1, i2])
                db.session.commit()

                # Seed Supports
                db.session.add(IdeaSupport(idea_id='idea-1', username='admin'))
                db.session.add(IdeaSupport(idea_id='idea-1', username='student1'))
                db.session.add(IdeaSupport(idea_id='idea-2', username='student1'))
                db.session.add(IdeaSupport(idea_id='idea-2', username='admin'))
                db.session.commit()
        except Exception:
            db.session.rollback()

        # 4. Seed Workspaces if empty
        try:
            if Workspace.query.count() == 0:
                ws1 = Workspace(
                    id='ws-1',
                    idea_id='idea-1',
                    name='Smart Campus Navigation AR',
                    description='Interactive web-based campus wayfinding and accessible navigation system.',
                    category='Technology',
                    visibility='public',
                    status='ACTIVE',
                    progress=70,
                    lead_id='student1',
                    lead_name='Student One',
                    lead_avatar='S1'
                )
                ws1.tags = ['Navigation', 'ThreeJS', 'React', 'Mobile']

                ws2 = Workspace(
                    id='ws-2',
                    idea_id='idea-2',
                    name='AI Peer Tutoring Platform',
                    description='Intelligent matching platform connecting students for peer mentorship and study group coordination.',
                    category='Education',
                    visibility='public',
                    status='ACTIVE',
                    progress=35,
                    lead_id='admin',
                    lead_name='Campus Admin',
                    lead_avatar='AD'
                )
                ws2.tags = ['AI/ML', 'FastAPI', 'PeerLearning']

                db.session.add_all([ws1, ws2])
                db.session.commit()

                # Members
                m1 = WorkspaceMember(workspace_id='ws-1', user_id='student1', name='Student One', username='student1', role='LEAD')
                m2 = WorkspaceMember(workspace_id='ws-1', user_id='admin', name='Campus Admin', username='admin', role='MAINTAINER')
                m3 = WorkspaceMember(workspace_id='ws-2', user_id='admin', name='Campus Admin', username='admin', role='LEAD')
                m4 = WorkspaceMember(workspace_id='ws-2', user_id='student1', name='Student One', username='student1', role='CONTRIBUTOR')
                db.session.add_all([m1, m2, m3, m4])

                # Tasks
                t1 = Task(id='task-1', workspace_id='ws-1', title='Build 3D interactive campus map layout', description='Render building layers with responsive pan/zoom controls', assignee_id='student1', assignee_name='Student One', status='DONE', priority='HIGH')
                t2 = Task(id='task-2', workspace_id='ws-1', title='Implement indoor routing algorithms', description='Calculate accessible pathways and floor transitions', assignee_id='admin', assignee_name='Campus Admin', status='IN_PROGRESS', priority='URGENT')
                t3 = Task(id='task-3', workspace_id='ws-1', title='Optimize mobile viewport rendering', description='Verify performance on iOS and Android viewports', assignee_id='student1', assignee_name='Student One', status='TODO', priority='MEDIUM')
                db.session.add_all([t1, t2, t3])

                # Milestones
                ms1 = Milestone(id='ms-1', workspace_id='ws-1', title='Phase 1: Interactive Campus Map & Node Graph', description='Complete floor plans for primary academic wings', due_date='2026-04-10', progress=100, status='COMPLETED')
                ms2 = Milestone(id='ms-2', workspace_id='ws-1', title='Phase 2: Live Navigation & GPS Integration', description='Integrate real-time step guidance and path calculation', due_date='2026-05-15', progress=50, status='IN_PROGRESS')
                db.session.add_all([ms1, ms2])

                # Discussions
                disc1 = Discussion(id='disc-1', workspace_id='ws-1', title='Framework comparison for 3D map rendering', content='Evaluating performance across mobile devices before finalizing render pipeline.', author_id='student1', author_name='Student One')
                db.session.add(disc1)
                db.session.commit()

                r1 = DiscussionReply(discussion_id='disc-1', author_id='admin', author_name='Campus Admin', text='WebGL with GLTF models offers 60fps rendering across all modern mobile browsers.')
                db.session.add(r1)

                # Chat
                chat1 = ChatMessage(id='chat-1', workspace_id='ws-1', sender_id='student1', sender_name='Student One', message='Welcome everyone to the Smart Campus Navigation Workspace!')
                chat2 = ChatMessage(id='chat-2', workspace_id='ws-1', sender_id='admin', sender_name='Campus Admin', message='Excited to collaborate on the project!')
                db.session.add_all([chat1, chat2])
                db.session.commit()
        except Exception:
            db.session.rollback()

    except Exception:
        db.session.rollback()
