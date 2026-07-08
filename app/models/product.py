from app.extensions import db


class Product(db.Model):
    __tablename__ = "products"

    # Mantém os ids "book-1", "book-2"... usados hoje no frontend estático
    id = db.Column(db.String(50), primary_key=True)

    title = db.Column(db.String(200), nullable=False)
    author = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(80), nullable=False, index=True)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    icon = db.Column(db.String(50), nullable=False)
    cover = db.Column(db.String(20), nullable=False)  # cor hex usada como capa
    stock = db.Column(db.Integer, nullable=False, default=0)
    active = db.Column(db.Boolean, nullable=False, default=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "author": self.author,
            "category": self.category,
            "price": float(self.price),
            "icon": self.icon,
            "cover": self.cover,
            "stock": self.stock,
        }
