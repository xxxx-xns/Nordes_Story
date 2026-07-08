"""
Registro do provedor Google no Authlib.

O client_id e client_secret vêm do .env (preenchidos após criar as
credenciais "OAuth Client ID" no Google Cloud Console, tipo
"Web application").

No Google Cloud Console, configure:
  - Authorized JavaScript origins: a origem do seu frontend (ex: http://localhost:5500)
  - Authorized redirect URIs: o valor de GOOGLE_REDIRECT_URI do .env
    (ex: http://localhost:5000/api/auth/google/callback)
"""
from app.extensions import oauth


def init_google_oauth(app) -> None:
    oauth.init_app(app)
    oauth.register(
        name="google",
        client_id=app.config["GOOGLE_CLIENT_ID"],
        client_secret=app.config["GOOGLE_CLIENT_SECRET"],
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )
