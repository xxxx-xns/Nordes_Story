from datetime import datetime

from flask import Blueprint, current_app, redirect, request, session, url_for
from flask_login import current_user, login_required, login_user, logout_user

from app.extensions import bcrypt, db, oauth
from app.models import User
from app.utils.responses import error, ok
from app.utils.validators import is_valid_email, validate_register_payload

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


# --------------------------------------------------------------------------
# Registro / Login com e-mail e senha
# --------------------------------------------------------------------------
@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}

    errors = validate_register_payload(data)
    if errors:
        return error("Não foi possível concluir o cadastro.", 422, errors)

    email = data["email"].strip().lower()
    if User.query.filter_by(email=email).first():
        return error("Já existe uma conta com este e-mail.", 409, {"email": "E-mail já cadastrado."})

    password_hash = bcrypt.generate_password_hash(
        data["password"], rounds=current_app.config["BCRYPT_ROUNDS"]
    ).decode("utf-8")

    user = User(name=data["name"].strip(), email=email, password_hash=password_hash)
    db.session.add(user)
    db.session.commit()

    login_user(user, remember=True)
    return ok(user.to_dict(), "Conta criada com sucesso!", status=201)


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not is_valid_email(email):
        return error("Digite um e-mail válido.", 422)

    user = User.query.filter_by(email=email).first()
    if not user or not user.password_hash:
        return error("E-mail não encontrado. Que tal criar uma conta?", 404)

    if not bcrypt.check_password_hash(user.password_hash, password):
        return error("Senha incorreta. Tente novamente.", 401)

    login_user(user, remember=True)
    return ok(user.to_dict(), f"Bem-vindo(a) de volta, {user.name.split(' ')[0]}!")


@auth_bp.post("/logout")
@login_required
def logout():
    logout_user()
    return ok(message="Você saiu da sua conta.")


@auth_bp.get("/me")
def me():
    if not current_user.is_authenticated:
        return error("Não autenticado.", 401)
    return ok(current_user.to_dict())


# --------------------------------------------------------------------------
# Login com Google (OAuth 2.0 / OpenID Connect via Authlib)
# --------------------------------------------------------------------------
@auth_bp.get("/google/login")
def google_login():
    redirect_uri = current_app.config["GOOGLE_REDIRECT_URI"]
    return oauth.google.authorize_redirect(redirect_uri)


@auth_bp.get("/google/callback")
def google_callback():
    token = oauth.google.authorize_access_token()
    userinfo = token.get("userinfo") or oauth.google.userinfo()

    google_sub = userinfo["sub"]
    email = userinfo["email"].lower()
    name = userinfo.get("name") or email.split("@")[0]
    avatar_url = userinfo.get("picture")

    user = User.query.filter_by(google_sub=google_sub).first()
    if not user:
        # Se já existe conta local com o mesmo e-mail, vincula a conta ao Google
        user = User.query.filter_by(email=email).first()
        if user:
            user.google_sub = google_sub
            user.avatar_url = avatar_url or user.avatar_url
        else:
            user = User(name=name, email=email, google_sub=google_sub, avatar_url=avatar_url)
            db.session.add(user)
        db.session.commit()

    login_user(user, remember=True)
    return redirect(current_app.config["FRONTEND_POST_LOGIN_URL"])


# --------------------------------------------------------------------------
# Perfil: edição de dados pessoais e endereço
# --------------------------------------------------------------------------
@auth_bp.put("/profile")
@login_required
def update_profile():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()

    if len(name) < 2:
        return error("Digite seu nome completo.", 422, {"name": "Nome inválido."})
    if not is_valid_email(email):
        return error("Digite um e-mail válido.", 422, {"email": "E-mail inválido."})

    existing = User.query.filter(User.email == email, User.id != current_user.id).first()
    if existing:
        return error("Este e-mail já está em uso.", 409, {"email": "E-mail já em uso."})

    current_user.name = name
    current_user.email = email
    db.session.commit()
    return ok(current_user.to_dict(), "Perfil atualizado com sucesso!")


@auth_bp.put("/profile/personal")
@login_required
def update_personal_info():
    data = request.get_json(silent=True) or {}
    current_user.phone = (data.get("phone") or "").strip() or None
    current_user.cpf = (data.get("cpf") or "").strip() or None

    birthdate = data.get("birthdate")
    if birthdate:
        try:
            current_user.birthdate = datetime.strptime(birthdate, "%Y-%m-%d").date()
        except ValueError:
            return error("Data de nascimento inválida.", 422, {"birthdate": "Formato esperado: AAAA-MM-DD."})
    else:
        current_user.birthdate = None

    db.session.commit()
    return ok(current_user.to_dict(), "Informações pessoais salvas!")


@auth_bp.put("/profile/address")
@login_required
def update_address():
    data = request.get_json(silent=True) or {}
    current_user.address_cep = (data.get("cep") or "").strip()
    current_user.address_street = (data.get("street") or "").strip()
    current_user.address_number = (data.get("number") or "").strip()
    current_user.address_complement = (data.get("complement") or "").strip()
    current_user.address_neighborhood = (data.get("neighborhood") or "").strip()
    current_user.address_city = (data.get("city") or "").strip()
    current_user.address_state = (data.get("state") or "").strip()

    db.session.commit()
    return ok(current_user.to_dict(), "Endereço salvo!")
