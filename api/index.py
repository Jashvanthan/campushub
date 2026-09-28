import sys
import os

# Add backend directory to sys.path so app imports resolve properly on Vercel
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app import create_app

app = create_app('production')
