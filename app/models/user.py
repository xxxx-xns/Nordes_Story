import uuid
from datetime import datetime

from flask_login import UserMixin

from app.extensions import db


def _uuid() -> str:
    return str(uuid.uuid4())


class User(UserMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=_uuid)

    name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=True)  # nulo se login só via Google

    # Autenticação via Google
    google_sub = db.Column(db.String(64), unique=True, nullable=True, index=True)
    avatar_url = db.Column(db.String(500), nullable=True)

    # Dados pessoais
    phone = db.Column(db.String(30), nullable=True)
    cpf = db.Column(db.String(20), nullable=True)
    birthdate = db.Column(db.Date, nullable=True)

    # Endereço
    address_cep = db.Column(db.String(15), nullable=True)
    address_street = db.Column(db.String(200), nullable=True)
    address_number = db.Column(db.String(20), nullable=True)
    address_complement = db.Column(db.String(100), nullable=True)
    address_neighborhood = db.Column(db.String(100), nullable=True)
    address_city = db.Column(db.String(100), nullable=True)
    address_state = db.Column(db.String(2), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    cart_items = db.relationship(
        "CartItem", backref="user", lazy=True, cascade="all, delete-orphan"
    )
    orders = db.relationship("Order", backref="user", lazy=True)

    def to_dict(self, include_address: bool = True) -> dict:
        data = {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "avatarUrl": self.avatar_url,
            "phone": self.phone,
            "cpf": self.cpf,
            "birthdate": self.birthdate.isoformat() if self.birthdate else None,
            "viaGoogle": self.google_sub is not None,
        }
        if include_address:
            data["address"] = {
                "cep": self.address_cep or "",
                "street": self.address_street or "",
                "number": self.address_number or "",
                "complement": self.address_complement or "",
                "neighborhood": self.address_neighborhood or "",
                "city": self.address_city or "",
                "state": self.address_state or "",
            }
        return data
