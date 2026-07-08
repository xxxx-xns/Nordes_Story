"""
Cria as tabelas do banco e popula a tabela de produtos com o mesmo
catálogo que hoje está hardcoded em js/products.js — assim o frontend
pode migrar para consumir a API sem perder nenhum item.

Uso:
    python seed.py
"""
from app import create_app
from app.extensions import db
from app.models import Product

PRODUCTS = [
    {"id": "book-1", "title": "O Jardim Secreto", "author": "Frances Hodgson Burnett",
     "category": "Livros", "price": 42.90, "icon": "fa-book-open", "cover": "#E8DED1"},
    {"id": "book-2", "title": "Spy x Family — Vol. 1", "author": "Tatsuya Endo",
     "category": "Mangás", "price": 29.90, "icon": "fa-mask", "cover": "#D1D8E8"},
    {"id": "book-3", "title": "Sussurros da Floresta", "author": "Ana Beatriz Nogueira",
     "category": "Livros", "price": 38.50, "icon": "fa-feather-pointed", "cover": "#E8DED1"},
    {"id": "book-4", "title": "Caderno Artesanal Kraft", "author": "Nordes Ateliê",
     "category": "Papéis", "price": 24.90, "icon": "fa-scroll", "cover": "#F0E6D8"},
    {"id": "book-5", "title": "Jogo de Marcadores Dourados", "author": "Nordes Ateliê",
     "category": "Acessórios", "price": 18.00, "icon": "fa-bookmark", "cover": "#EBE6E1"},
    {"id": "book-6", "title": "Coleção Clássicos — Vol. I", "author": "Vários Autores",
     "category": "Coleções", "price": 89.90, "icon": "fa-shapes", "cover": "#E8D1D1"},
    {"id": "book-7", "title": "Chainsaw Man — Vol. 3", "author": "Tatsuki Fujimoto",
     "category": "Mangás", "price": 27.90, "icon": "fa-mask", "cover": "#D1D8E8"},
    {"id": "book-8", "title": "O Pequeno Príncipe", "author": "Antoine de Saint-Exupéry",
     "category": "Livros", "price": 32.00, "icon": "fa-book-open", "cover": "#E8DED1"},
    {"id": "book-9", "title": "Vela Aromática Petricor", "author": "Nordes Ateliê",
     "category": "Acessórios", "price": 34.90, "icon": "fa-fire", "cover": "#EBE6E1"},
    {"id": "book-10", "title": "Poesias Reunidas", "author": "Clarice Lispector",
     "category": "Livros", "price": 45.00, "icon": "fa-feather-pointed", "cover": "#E8DED1"},
    {"id": "book-11", "title": "Kit Papelaria Vintage", "author": "Nordes Ateliê",
     "category": "Papéis", "price": 52.00, "icon": "fa-scroll", "cover": "#F0E6D8"},
    {"id": "book-12", "title": "Berserk — Vol. 12", "author": "Kentaro Miura",
     "category": "Mangás", "price": 31.90, "icon": "fa-mask", "cover": "#D1D8E8"},
]


def run(app=None):
    app = app or create_app()
    with app.app_context():
        db.create_all()

        for data in PRODUCTS:
            product = Product.query.get(data["id"])
            if product:
                for key, value in data.items():
                    setattr(product, key, value)
            else:
                product = Product(**data, stock=20, active=True)
                db.session.add(product)

        db.session.commit()
        print(f"Banco pronto. {len(PRODUCTS)} produtos sincronizados.")


if __name__ == "__main__":
    run()
