"""
Instâncias das extensões Flask, criadas aqui (sem app ainda) e
inicializadas depois em create_app() — evita import circular entre
os blueprints e o app factory.
"""
from authlib.integrations.flask_client import OAuth
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_login import LoginManager
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
bcrypt = Bcrypt()
login_manager = LoginManager()
oauth = OAuth()
cors = CORS()
