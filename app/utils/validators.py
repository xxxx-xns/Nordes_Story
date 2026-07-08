import re

EMAIL_RE = re.compile(r"^\S+@\S+\.\S+$")


def is_valid_email(email: str) -> bool:
    return bool(email) and bool(EMAIL_RE.match(email))


def validate_register_payload(data: dict) -> dict:
    """Retorna dicionário {campo: mensagem} com erros encontrados (vazio se ok)."""
    errors = {}

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    confirm = data.get("confirmPassword") or ""

    if len(name) < 2:
        errors["name"] = "Digite seu nome completo."
    if not is_valid_email(email):
        errors["email"] = "Digite um e-mail válido."
    if len(password) < 6:
        errors["password"] = "A senha precisa ter ao menos 6 caracteres."
    if password != confirm:
        errors["confirmPassword"] = "As senhas não coincidem."

    return errors
