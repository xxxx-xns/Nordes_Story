"""
Configurações da aplicação.

Todas as credenciais e parâmetros sensíveis vêm do .env — nunca ficam
hardcoded no código. Use o .env.example como referência.
"""
import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()


def _bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in ("1", "true", "yes", "on")


class Config:
    # --- Core Flask ---
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    ENV = os.environ.get("FLASK_ENV", "production")
    DEBUG = _bool(os.environ.get("FLASK_DEBUG"), default=False)

    # --- Banco de dados ---
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", "sqlite:///nordes_store.db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}

    # --- Sessão / cookies ---
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = os.environ.get("SESSION_COOKIE_SAMESITE", "Lax")
    SESSION_COOKIE_SECURE = _bool(os.environ.get("SESSION_COOKIE_SECURE"), default=True)
    PERMANENT_SESSION_LIFETIME = timedelta(
        days=int(os.environ.get("SESSION_LIFETIME_DAYS", 7))
    )

    # --- CORS (frontend agora é servido pelo próprio Flask, mesma origem;
    # mantido configurável para quem ainda rodar o frontend separado) ---
    FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5000")

    # --- Google OAuth 2.0 ---
    GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
    # URL para onde o Google redireciona após o login (deve estar cadastrada
    # no Google Cloud Console em "URIs de redirecionamento autorizados")
    GOOGLE_REDIRECT_URI = os.environ.get(
        "GOOGLE_REDIRECT_URI", "http://localhost:5000/api/auth/google/callback"
    )
    # Para onde o usuário é enviado no navegador após o login concluir
    # (agora é uma rota Flask de verdade, não mais um #hash)
    FRONTEND_POST_LOGIN_URL = os.environ.get(
        "FRONTEND_POST_LOGIN_URL", "http://localhost:5000/perfil"
    )

    # --- Senhas ---
    BCRYPT_ROUNDS = int(os.environ.get("BCRYPT_ROUNDS", 12))


class DevelopmentConfig(Config):
    DEBUG = True
    SESSION_COOKIE_SECURE = False


class ProductionConfig(Config):
    DEBUG = False


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
}


def get_config():
    env = os.environ.get("FLASK_ENV", "production")
    return config_by_name.get(env, ProductionConfig)
