from flask_login import current_user, login_required
from flask import Blueprint

from app.extensions import db
from app.models import CartItem, Order, OrderItem
from app.utils.responses import error, ok

orders_bp = Blueprint("orders", __name__, url_prefix="/api/orders")


@orders_bp.post("/checkout")
@login_required
def checkout():
    cart_items = CartItem.query.filter_by(user_id=current_user.id).all()
    if not cart_items:
        return error("Seu carrinho está vazio.", 422)

    # Confere estoque antes de fechar o pedido
    for item in cart_items:
        if item.product.stock < item.quantity:
            return error(
                f'Estoque insuficiente para "{item.product.title}".', 409
            )

    total = round(sum(item.product.price * item.quantity for item in cart_items), 2)
    order = Order(user_id=current_user.id, total=total, status="pendente")
    db.session.add(order)
    db.session.flush()  # garante order.id antes de criar os itens

    for item in cart_items:
        db.session.add(
            OrderItem(
                order_id=order.id,
                product_id=item.product_id,
                title=item.product.title,
                unit_price=item.product.price,
                quantity=item.quantity,
            )
        )
        item.product.stock -= item.quantity
        db.session.delete(item)

    db.session.commit()
    return ok(order.to_dict(), "Pedido criado com sucesso!", status=201)


@orders_bp.get("")
@login_required
def list_orders():
    orders = (
        Order.query.filter_by(user_id=current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return ok([o.to_dict() for o in orders])


@orders_bp.get("/<order_id>")
@login_required
def get_order(order_id):
    order = Order.query.filter_by(id=order_id, user_id=current_user.id).first()
    if not order:
        return error("Pedido não encontrado.", 404)
    return ok(order.to_dict())
