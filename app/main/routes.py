"""
Rotas de página do frontend (SPA servida pelo próprio Flask).

Cada aba do app ganhou sua própria rota (/home, /explorar, /colecoes,
/favoritos, /perfil, /login, /cart). Todas renderizam o mesmo template
(index.html), mas informam a ele qual seção deve abrir já ativa através da
variável `initial_page` — assim, atualizar a página (F5), abrir um link
direto ou usar o botão voltar/avançar do navegador sempre mostra a aba
certa, mesmo sem passar pela navegação em JavaScript.
"""
from flask import Blueprint, redirect, render_template, url_for

main_bp = Blueprint("main", __name__)


def _render_page(initial_page: str, open_cart: bool = False):
    return render_template(
        "index.html",
        initial_page=initial_page,
        open_cart=open_cart,
    )


@main_bp.get("/")
def index():
    return redirect(url_for("main.home"))


@main_bp.get("/home")
def home():
    return _render_page("home")


@main_bp.get("/explorar")
def explorar():
    return _render_page("explorar")


@main_bp.get("/colecoes")
def colecoes():
    return _render_page("colecoes")


@main_bp.get("/favoritos")
def favoritos():
    return _render_page("favoritos")


@main_bp.get("/perfil")
@main_bp.get("/profile")
def perfil():
    return _render_page("perfil")


@main_bp.get("/login")
def login():
    return _render_page("login")


@main_bp.get("/cart")
def cart():
    # A sacola é um painel lateral sobre a Home (não é uma aba do bottom
    # nav), então /cart abre a Home já com a sacola aberta por cima.
    return _render_page("home", open_cart=True)
