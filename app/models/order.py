import uuid
from datetime import datetime

from app.extensions import db


def _uuid() -> str:
    return str(uuid.uuid4())


class CartItem(db.Model):
    __tablename__ = "cart_items"
    __table_args__ = (db.UniqueConstraint("user_id", "product_id", name="uq_user_product"),)

    id = db.Column(db.String(36), primary_key=True, default=_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    product_id = db.Column(db.String(50), db.ForeignKey("products.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)

    product = db.relationship("Product")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "product": self.product.to_dict(),
            "quantity": self.quantity,
            "subtotal": round(float(self.product.price) * self.quantity, 2),
        }


class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.String(36), primary_key=True, default=_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    status = db.Column(db.String(30), nullable=False, default="pendente")
    total = db.Column(db.Numeric(10, 2), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    items = db.relationship(
        "OrderItem", backref="order", lazy=True, cascade="all, delete-orphan"
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "status": self.status,
            "total": float(self.total),
            "createdAt": self.created_at.isoformat(),
            "items": [item.to_dict() for item in self.items],
        }


class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(db.String(36), primary_key=True, default=_uuid)
    order_id = db.Column(db.String(36), db.ForeignKey("orders.id"), nullable=False)
    product_id = db.Column(db.String(50), db.ForeignKey("products.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)  # snapshot do nome no momento da compra
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)  # snapshot do preço
    quantity = db.Column(db.Integer, nullable=False)

    def to_dict(self) -> dict:
        return {
            "productId": self.product_id,
            "title": self.title,
            "unitPrice": float(self.unit_price),
            "quantity": self.quantity,
            "subtotal": round(float(self.unit_price) * self.quantity, 2),
        }
