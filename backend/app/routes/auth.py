from flask import Blueprint, request, jsonify

try:
    from ..models import db, User
    from ..utils.auth_helpers import generate_token, jwt_required, admin_required
    from ..utils.email_service import generate_otp, store_otp, verify_and_consume_otp, send_resend_email
except (ImportError, ValueError):
    try:
        from app.models import db, User
        from app.utils.auth_helpers import generate_token, jwt_required, admin_required
        from app.utils.email_service import generate_otp, store_otp, verify_and_consume_otp, send_resend_email
    except (ImportError, ValueError):
        from backend.app.models import db, User
        from backend.app.utils.auth_helpers import generate_token, jwt_required, admin_required
        from backend.app.utils.email_service import generate_otp, store_otp, verify_and_consume_otp, send_resend_email

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')



@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json() or {}
        username = str(data.get('username', '')).strip().lower()
        password = str(data.get('password', ''))

        if not username or not password:
            return jsonify({'success': False, 'message': 'Username and password are required'}), 400

        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({'success': False, 'message': 'User does not exist. Please check your username or register an account.'}), 404
        if not user.check_password(password):
            return jsonify({'success': False, 'message': 'Incorrect password. Please verify your credentials and try again.'}), 401

        token = generate_token(user)
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'token': token,
            'user': user.to_dict(include_private=True)
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Login failed: {str(e)}'}), 500


@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json() or {}
        username = str(data.get('username', '')).strip().lower()
        password = str(data.get('password', ''))
        role = str(data.get('role', 'student')).strip()
        name = str(data.get('name', username)).strip()
        email = str(data.get('email', f"{username}@campushub.edu")).strip()
        institution = str(data.get('institution', '')).strip()
        major = str(data.get('major', '')).strip()
        bio = str(data.get('bio', '')).strip()

        # Compute avatar initials
        name_or_u = (name or username).strip()
        parts = [p for p in name_or_u.split() if p]
        if len(parts) >= 2:
            calc_avatar = (parts[0][0] + parts[1][0]).upper()
        elif len(name_or_u) == 1:
            calc_avatar = name_or_u.upper()
        elif len(name_or_u) >= 2:
            calc_avatar = name_or_u[:2].upper()
        else:
            calc_avatar = 'NA'

        avatar = data.get('avatar') or calc_avatar

        if not username or not password:
            return jsonify({'success': False, 'message': 'Username and password are required'}), 400

        if len(password) < 8:
            return jsonify({'success': False, 'message': 'Password must be at least 8 characters'}), 400

        if User.query.filter_by(username=username).first():
            return jsonify({'success': False, 'message': f'Username "{username}" is already taken'}), 409

        user = User(
            username=username,
            role=role,
            name=name,
            email=email,
            institution=institution,
            major=major,
            bio=bio,
            avatar=avatar
        )
        user.set_password(password)
        skills = data.get('skills', [])
        user.skills = skills if isinstance(skills, list) else []

        db.session.add(user)
        db.session.commit()

        token = generate_token(user)
        return jsonify({
            'success': True,
            'message': 'Account created successfully',
            'token': token,
            'user': user.to_dict(include_private=True)
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Registration error: {str(e)}'}), 500


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.get_json() or {}
        identifier = str(data.get('identifier', data.get('username', data.get('email', '')))).strip()
        
        if not identifier:
            return jsonify({'success': False, 'message': 'Please provide your username or email address'}), 400
        
        user = User.query.filter(
            (User.username.ilike(identifier)) | 
            (User.email.ilike(identifier)) |
            (User.name.ilike(identifier))
        ).first()
        
        if not user:
            return jsonify({'success': False, 'message': 'User does not exist. Please check your username or register a new account.'}), 404
        
        # 1. Generate 6-digit OTP code and store with 10-min expiration
        otp_code = generate_otp()
        user_email = user.email or f"{user.username}@campushub.edu"
        store_otp(user.username, user_email, otp_code)

        # 2. Dispatch email via Resend API
        email_result = send_resend_email(user_email, user.name or user.username, otp_code)

        resp_payload = {
            'success': True,
            'message': f'6-digit verification code sent to {user_email}',
            'username': user.username,
            'email': user_email,
            'verificationRequired': True,
            'emailSent': email_result.get('sent', False)
        }
        # In simulation mode (e.g., when testing in local dev without RESEND_API_KEY), attach code for convenience
        if email_result.get('simulated'):
            resp_payload['simulatedCode'] = otp_code

        return jsonify(resp_payload), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Forgot password error: {str(e)}'}), 500


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.get_json() or {}
        identifier = str(data.get('identifier', data.get('username', data.get('email', '')))).strip()
        new_password = str(data.get('newPassword', data.get('password', ''))).strip()
        reset_code = str(data.get('resetCode', data.get('code', ''))).strip()
        
        if not identifier or not new_password:
            return jsonify({'success': False, 'message': 'Username and new password are required'}), 400
        
        if len(new_password) < 8:
            return jsonify({'success': False, 'message': 'Password must be at least 8 characters'}), 400
            
        user = User.query.filter(
            (User.username.ilike(identifier)) | 
            (User.email.ilike(identifier)) |
            (User.name.ilike(identifier))
        ).first()
        
        if not user:
            return jsonify({'success': False, 'message': 'User does not exist'}), 404

        if not reset_code:
            return jsonify({'success': False, 'message': 'Please enter the 6-digit verification code sent to your email'}), 400

        # Strict OTP verification
        valid, verify_msg = verify_and_consume_otp(identifier, reset_code)
        if not valid:
            valid_user, verify_msg_user = verify_and_consume_otp(user.username, reset_code)
            if not valid_user and user.email:
                valid_email, verify_msg_email = verify_and_consume_otp(user.email, reset_code)
                if not valid_email:
                    return jsonify({'success': False, 'message': verify_msg}), 400
            elif not valid_user:
                return jsonify({'success': False, 'message': verify_msg}), 400
            
        user.set_password(new_password)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Password has been reset successfully. You can now sign in with your new password.',
            'username': user.username
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Reset password failed: {str(e)}'}), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me(current_user):
    return jsonify({
        'success': True,
        'user': current_user.to_dict(include_private=True)
    }), 200


@auth_bp.route('/verify', methods=['GET'])
@jwt_required()
def verify_token(current_user):
    """Verify that current JWT token is valid and active."""
    return jsonify({
        'success': True,
        'valid': True,
        'user': current_user.to_dict(include_private=True)
    }), 200


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required()
def refresh_token(current_user):
    """Generate a refreshed JWT access token for active session."""
    new_token = generate_token(current_user)
    return jsonify({
        'success': True,
        'token': new_token,
        'user': current_user.to_dict(include_private=True)
    }), 200


@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile(current_user):
    try:
        data = request.get_json() or {}
        
        # Check if changing username
        new_username = str(data.get('username', '')).strip().lower()
        username_changed = False
        if new_username and new_username != current_user.username:
            if User.query.filter_by(username=new_username).first():
                return jsonify({'success': False, 'message': 'Username is already taken'}), 409
            current_user.username = new_username
            username_changed = True

        # Update basic profile details
        if 'name' in data and data['name']: current_user.name = str(data['name']).strip()
        if 'institution' in data: current_user.institution = str(data['institution']).strip()
        if 'major' in data: current_user.major = str(data['major']).strip()
        if 'bio' in data: current_user.bio = str(data['bio']).strip()
        if 'avatar' in data: current_user.avatar = data['avatar']
        if 'skills' in data:
            skills_val = data['skills']
            current_user.skills = skills_val if isinstance(skills_val, list) else [skills_val]
        if 'email' in data and data['email']: current_user.email = str(data['email']).strip()

        # Optional password change
        new_password = str(data.get('newPassword', ''))
        old_password = str(data.get('oldPassword', ''))
        if new_password.strip():
            if len(new_password) < 8:
                return jsonify({'success': False, 'message': 'New password must be at least 8 characters'}), 400
            if old_password and not current_user.check_password(old_password):
                return jsonify({'success': False, 'message': 'Current password is incorrect'}), 400
            current_user.set_password(new_password)

        db.session.commit()

        # Issue updated token if username changed
        new_token = generate_token(current_user) if username_changed else None

        res_payload = {
            'success': True,
            'message': 'Profile updated successfully',
            'user': current_user.to_dict(include_private=True)
        }
        if new_token:
            res_payload['token'] = new_token

        return jsonify(res_payload), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Profile update failed: {str(e)}'}), 500


@auth_bp.route('/users', methods=['GET'])
def get_all_users():
    """Retrieve all users directory for fast searching & profile discovery."""
    search = request.args.get('q', '').strip()
    role = request.args.get('role')
    
    # Safe limit parsing
    try:
        limit = min(max(int(request.args.get('limit', 50)), 1), 100)
    except (ValueError, TypeError):
        limit = 50
    
    query = User.query
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (User.username.ilike(search_pattern)) |
            (User.name.ilike(search_pattern)) |
            (User.email.ilike(search_pattern)) |
            (User.major.ilike(search_pattern)) |
            (User.institution.ilike(search_pattern)) |
            (User.role.ilike(search_pattern))
        )
    if role and role != 'all':
        query = query.filter_by(role=role)

    users = query.order_by(User.username.asc()).limit(limit).all()
    # Format as dictionary mapping username -> user info for compatibility with frontend users dict
    users_dict = {u.username: u.to_dict() for u in users}
    return jsonify({
        'success': True,
        'users': users_dict,
        'list': [u.to_dict() for u in users],
        'count': len(users)
    }), 200


@auth_bp.route('/users/<username>', methods=['GET'])
def get_user_profile(username):
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    return jsonify({
        'success': True,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/admin/users', methods=['POST'])
@admin_required()
def admin_create_user(current_user):
    try:
        data = request.get_json() or {}
        username = str(data.get('username', '')).strip().lower()
        password = str(data.get('password', ''))
        role = str(data.get('role', 'student')).strip()

        if not username or not password:
            return jsonify({'success': False, 'message': 'Username and password required'}), 400

        if User.query.filter_by(username=username).first():
            return jsonify({'success': False, 'message': f'User "{username}" already exists'}), 409

        user = User(
            username=username,
            role=role,
            name=str(data.get('name', username)).strip(),
            email=str(data.get('email', f'{username}@campushub.edu')).strip(),
            institution=str(data.get('institution', '')).strip(),
            major=str(data.get('major', '')).strip(),
            bio=str(data.get('bio', '')).strip()
        )
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'User "{username}" created successfully',
            'user': user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to create user: {str(e)}'}), 500


@auth_bp.route('/admin/users/<username>', methods=['PUT'])
@admin_required()
def admin_update_user(current_user, username):
    try:
        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        data = request.get_json() or {}
        new_username = str(data.get('newUsername', '')).strip().lower()
        if new_username and new_username != username:
            if User.query.filter_by(username=new_username).first():
                return jsonify({'success': False, 'message': 'New username is already taken'}), 409
            user.username = new_username

        if 'role' in data: user.role = str(data['role']).strip()
        if 'name' in data: user.name = str(data['name']).strip()
        if 'email' in data: user.email = str(data['email']).strip()
        if 'institution' in data: user.institution = str(data['institution']).strip()
        if 'major' in data: user.major = str(data['major']).strip()
        if 'newPassword' in data and str(data['newPassword']).strip():
            user.set_password(str(data['newPassword']).strip())

        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'User updated successfully',
            'user': user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to update user: {str(e)}'}), 500


@auth_bp.route('/admin/users/<username>', methods=['DELETE'])
@admin_required()
def admin_delete_user(current_user, username):
    try:
        if current_user.username == username:
            return jsonify({'success': False, 'message': 'Cannot delete your own account'}), 400

        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        db.session.delete(user)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': f'User "{username}" deleted successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to delete user: {str(e)}'}), 500

