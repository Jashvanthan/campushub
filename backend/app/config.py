import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

def get_database_url():
    url = os.environ.get('DATABASE_URL')
    if not url:
        # Default to local SQLite database in instance folder
        return f"sqlite:///{os.path.join(BASE_DIR, '..', 'campushub.db')}"
    # Render / Heroku Postgres URL fix for SQLAlchemy 2.0+
    if url.startswith('postgres://'):
        url = url.replace('postgres://', 'postgresql://', 1)
    return url

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'campushub-super-secret-key-2026-production')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'campushub-jwt-secret-token-key-2026')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)
    
    SQLALCHEMY_DATABASE_URI = get_database_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # High-concurrency database connection pooling & performance tuning
    if not get_database_url().startswith('sqlite'):
        SQLALCHEMY_ENGINE_OPTIONS = {
            'pool_size': 20,
            'max_overflow': 40,
            'pool_timeout': 30,
            'pool_recycle': 1800,
            'pool_pre_ping': True,
        }
    else:
        SQLALCHEMY_ENGINE_OPTIONS = {
            'connect_args': {
                'check_same_thread': False,
                'timeout': 30,
            },
            'pool_pre_ping': True,
        }

    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

