from flask import Flask

from app.auth import auth_bp
from app.auth.google_oauth import init_google_oauth
from app.cart import cart_bp
from app.config import get_config
from app.extensions import bcrypt, cors, db, login_manager
from app.main import main_bp
from app.orders import orders_bp
from app.products import products_bp
from app.utils.responses import error


def create_app(config_object=None):
    app = Flask(__name__)
    app.config.from_object(config_object or get_config())

    _init_extensions(app)
    _register_blueprints(app)
    _register_error_handlers(app)

    return app


def _init_extensions(app: Flask) -> None:
    db.init_app(app)
    bcrypt.init_app(app)
    login_manager.init_app(app)
    login_manager.session_protection = "strong"

    # Frontend estático roda em outra origem (ex: Live Server) e precisa
    # mandar cookies de sessão, por isso supports_credentials=True.
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config["FRONTEND_ORIGIN"]}},
        supports_credentials=True,
    )

    init_google_oauth(app)

    from app.models import User

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(user_id)

    @login_manager.unauthorized_handler
    def unauthorized():
        return error("Faça login para continuar.", 401)


def _register_blueprints(app: Flask) -> None:
    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(cart_bp)
    app.register_blueprint(orders_bp)

    @app.get("/api/health")
    def health():
        return {"status": "ok"}


def _register_error_handlers(app: Flask) -> None:
    @app.errorhandler(404)
    def not_found(_):
        return error("Recurso não encontrado.", 404)

    @app.errorhandler(500)
    def internal_error(_):
        return error("Erro interno no servidor.", 500)
