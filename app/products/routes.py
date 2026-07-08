from flask import Blueprint, request

from app.models import Product
from app.utils.responses import error, ok

products_bp = Blueprint("products", __name__, url_prefix="/api/products")


@products_bp.get("")
def list_products():
    query = Product.query.filter_by(active=True)

    category = request.args.get("category")
    if category:
        query = query.filter_by(category=category)

    search = request.args.get("q")
    if search:
        like = f"%{search.strip()}%"
        query = query.filter(
            (Product.title.ilike(like)) | (Product.author.ilike(like))
        )

    products = query.order_by(Product.title).all()
    return ok([p.to_dict() for p in products])


@products_bp.get("/<product_id>")
def get_product(product_id):
    product = Product.query.filter_by(id=product_id, active=True).first()
    if not product:
        return error("Produto não encontrado.", 404)
    return ok(product.to_dict())


@products_bp.get("/categories")
def list_categories():
    rows = Product.query.with_entities(Product.category).distinct().all()
    return ok(sorted({row[0] for row in rows}))
