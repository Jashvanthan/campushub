import os
from flask import Flask, jsonify
from flask_cors import CORS
from .config import config_by_name
from .models import db
from .routes import auth_bp, posts_bp, ideas_bp, workspaces_bp, stats_bp, notifications_bp, search_bp
from .utils.seed_data import seed_database

def create_app(config_name=None):
    if not config_name:
        config_name = os.environ.get('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(config_by_name.get(config_name, config_by_name['default']))

    # Initialize CORS for cross-origin frontend requests from local dev & Vercel
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Initialize Database
    db.init_app(app)

    # Performance & Concurrency: Enable SQLite WAL mode, normal synchronous, and busy timeout
    with app.app_context():
        from sqlalchemy import event
        from sqlalchemy.engine import Engine

        @event.listens_for(Engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            if app.config['SQLALCHEMY_DATABASE_URI'].startswith('sqlite'):
                try:
                    cursor = dbapi_connection.cursor()
                    cursor.execute("PRAGMA journal_mode=WAL")
                    cursor.execute("PRAGMA synchronous=NORMAL")
                    cursor.execute("PRAGMA busy_timeout=10000")
                    cursor.execute("PRAGMA cache_size=-64000")
                    cursor.close()
                except Exception:
                    pass


    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(posts_bp)
    app.register_blueprint(ideas_bp)
    app.register_blueprint(workspaces_bp)
    app.register_blueprint(stats_bp)
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    app.register_blueprint(search_bp)

    # Root route
    @app.route('/')
    def root():
        return jsonify({
            'name': 'CampusHub API Engine',
            'status': 'online',
            'version': '1.0.0',
            'documentation': '/api/stats/overview'
        }), 200

    # Global Error Handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'success': False, 'message': 'Endpoint not found'}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({'success': False, 'message': 'Internal server error'}), 500

    # Auto-create tables and seed database on initial boot
    with app.app_context():
        db.create_all()
        try:
            seed_database()
        except Exception as e:
            app.logger.warning(f"Seed database warning: {e}")

    return app
