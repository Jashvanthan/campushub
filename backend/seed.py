import os
from app import create_app
from app.models import db
from app.utils.seed_data import seed_database

app = create_app('development')

with app.app_context():
    print("[CampusHub] Resetting and re-seeding database...")
    db.drop_all()
    db.create_all()
    seed_database()
    print("[CampusHub] Database seeded successfully with users, posts, ideas, workspaces, and chats!")
