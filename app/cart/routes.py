from flask import Blueprint, request
from flask_login import current_user, login_required

from app.extensions import db
from app.models import CartItem, Product
from app.utils.responses import error, ok

cart_bp = Blueprint("cart", __name__, url_prefix="/api/cart")


def _serialize_cart():
    items = CartItem.query.filter_by(user_id=current_user.id).all()
    total = round(sum(item.product.price * item.quantity for item in items), 2)
    return {
        "items": [item.to_dict() for item in items],
        "total": float(total),
        "itemCount": sum(item.quantity for item in items),
    }


@cart_bp.get("")
@login_required
def get_cart():
    return ok(_serialize_cart())


@cart_bp.post("/items")
@login_required
def add_item():
    data = request.get_json(silent=True) or {}
    product_id = data.get("productId")
    quantity = int(data.get("quantity", 1))

    if quantity < 1:
        return error("Quantidade inválida.", 422)

    product = Product.query.filter_by(id=product_id, active=True).first()
    if not product:
        return error("Produto não encontrado.", 404)

    item = CartItem.query.filter_by(user_id=current_user.id, product_id=product_id).first()
    if item:
        item.quantity += quantity
    else:
        item = CartItem(user_id=current_user.id, product_id=product_id, quantity=quantity)
        db.session.add(item)

    db.session.commit()
    return ok(_serialize_cart(), "Produto adicionado ao carrinho.")


@cart_bp.put("/items/<item_id>")
@login_required
def update_item(item_id):
    data = request.get_json(silent=True) or {}
    quantity = int(data.get("quantity", 1))

    item = CartItem.query.filter_by(id=item_id, user_id=current_user.id).first()
    if not item:
        return error("Item não encontrado no carrinho.", 404)

    if quantity < 1:
        db.session.delete(item)
    else:
        item.quantity = quantity

    db.session.commit()
    return ok(_serialize_cart(), "Carrinho atualizado.")


@cart_bp.delete("/items/<item_id>")
@login_required
def remove_item(item_id):
    item = CartItem.query.filter_by(id=item_id, user_id=current_user.id).first()
    if not item:
        return error("Item não encontrado no carrinho.", 404)

    db.session.delete(item)
    db.session.commit()
    return ok(_serialize_cart(), "Item removido do carrinho.")


@cart_bp.delete("")
@login_required
def clear_cart():
    CartItem.query.filter_by(user_id=current_user.id).delete()
    db.session.commit()
    return ok(_serialize_cart(), "Carrinho esvaziado.")
