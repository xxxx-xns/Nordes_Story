# Nordes Story — Backend (Flask)

API + frontend da loja Nordes Story, com autenticação por e-mail/senha e
login com Google (OAuth 2.0 / OpenID Connect). O Flask agora serve tanto a
API quanto a interface (HTML/CSS/JS) — não é mais preciso rodar um Live
Server separado.

## Estrutura

```
backend/
├── app/
│   ├── __init__.py          # app factory (create_app)
│   ├── config.py            # configuração (lê o .env)
│   ├── extensions.py        # db, bcrypt, login_manager, oauth, cors
│   ├── main/                  # rotas de página: /home, /explorar, /colecoes,
│   │                          # /favoritos, /perfil, /login, /cart
│   ├── templates/
│   │   └── index.html        # SPA (uma seção + header por aba)
│   ├── static/
│   │   ├── css/  js/  assets/ # frontend (mesmos arquivos de antes)
│   ├── models/               # User, Product, CartItem, Order, OrderItem
│   ├── auth/                 # registro, login, logout, Google OAuth, perfil
│   ├── products/             # catálogo
│   ├── cart/                 # carrinho por usuário
│   ├── orders/                # checkout e histórico de pedidos
│   └── utils/                 # respostas padronizadas e validadores
├── run.py                    # ponto de entrada (flask run / gunicorn)
├── seed.py                   # cria tabelas e popula produtos
├── requirements.txt
├── .env.example
└── .gitignore
```

## Rotas de página (cada aba tem a sua)

| Rota         | Aba renderizada                                   |
|--------------|----------------------------------------------------|
| `/` ou `/home` | Início                                            |
| `/explorar`  | Explorar                                            |
| `/colecoes`  | Minhas coleções                                     |
| `/favoritos` | Favoritos                                           |
| `/perfil` ou `/profile` | Perfil                                    |
| `/login`     | Login / Criar conta                                 |
| `/cart`      | Início, com a sacola já aberta                      |

Cada rota renderiza o mesmo template (`index.html`), passando qual seção
deve abrir ativa (`initial_page`). Isso faz o F5, um link direto ou o botão
voltar/avançar do navegador sempre mostrarem a aba certa — a navegação por
clique continua instantânea (sem recarregar a página), via History API.

## 1. Criar o cliente OAuth no Google Cloud Console

1. Acesse https://console.cloud.google.com/apis/credentials
2. "Criar credenciais" → "ID do cliente OAuth" → tipo **Aplicativo da Web**
3. Em **Origens JavaScript autorizadas**, adicione a origem da aplicação, ex:
   `http://localhost:5000`
4. Em **URIs de redirecionamento autorizados**, adicione a URL de callback
   do backend, ex: `http://localhost:5000/api/auth/google/callback`
5. Copie o **Client ID** e o **Client Secret** gerados.

## 2. Configurar o ambiente

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edite o .env e cole GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET
```

## 3. Criar o banco e popular os produtos

```bash
python seed.py
```

## 4. Rodar em desenvolvimento

```bash
flask --app run run --debug --port 5000
# ou simplesmente: python run.py
```

## 5. Rodar em produção

```bash
gunicorn -w 4 -b 0.0.0.0:5000 run:app
```

---

## Endpoints

Todas as respostas seguem o formato:
```json
{ "success": true, "data": {...}, "message": "..." }
{ "success": false, "message": "...", "errors": {...} }
```

### Autenticação — `/api/auth`
| Método | Rota                       | Descrição                              |
|--------|-----------------------------|-----------------------------------------|
| POST   | `/register`                 | Cadastro com nome, e-mail e senha       |
| POST   | `/login`                    | Login com e-mail e senha                |
| POST   | `/logout`                   | Encerra a sessão                        |
| GET    | `/me`                       | Retorna o usuário logado                |
| GET    | `/google/login`             | Redireciona para o consentimento Google |
| GET    | `/google/callback`          | Callback do Google (configurado no GCP) |
| PUT    | `/profile`                  | Atualiza nome/e-mail                    |
| PUT    | `/profile/personal`         | Atualiza telefone, CPF, nascimento      |
| PUT    | `/profile/address`          | Atualiza endereço                       |

**Fluxo do login com Google no frontend**: basta apontar o botão
"Entrar com Google" para `GET {API_URL}/api/auth/google/login`
(navegação de página inteira, não é `fetch`). O Google redireciona de
volta para o callback do backend, que cria a sessão e manda o navegador
para `FRONTEND_POST_LOGIN_URL`.

### Produtos — `/api/products`
| Método | Rota               | Descrição                                  |
|--------|--------------------|---------------------------------------------|
| GET    | `/`                | Lista produtos (`?category=` e `?q=` opcionais) |
| GET    | `/<id>`            | Detalhe de um produto                       |
| GET    | `/categories`      | Lista categorias distintas                  |

### Carrinho — `/api/cart` (requer login)
| Método | Rota            | Descrição                     |
|--------|------------------|---------------------------------|
| GET    | `/`              | Retorna o carrinho do usuário   |
| POST   | `/items`         | Adiciona item (`productId`, `quantity`) |
| PUT    | `/items/<id>`    | Atualiza quantidade              |
| DELETE | `/items/<id>`    | Remove item                      |
| DELETE | `/`              | Esvazia o carrinho               |

### Pedidos — `/api/orders` (requer login)
| Método | Rota           | Descrição                          |
|--------|----------------|--------------------------------------|
| POST   | `/checkout`    | Fecha o pedido a partir do carrinho  |
| GET    | `/`            | Histórico de pedidos do usuário     |
| GET    | `/<id>`        | Detalhe de um pedido                |

## Notas de segurança

- Senhas armazenadas com bcrypt (nunca em texto puro).
- Sessão via cookie `httpOnly`, `SameSite` configurável; ative
  `SESSION_COOKIE_SECURE=true` em produção (HTTPS).
- CORS restrito à origem definida em `FRONTEND_ORIGIN`, com
  `supports_credentials=True` para o cookie de sessão viajar entre
  frontend e backend em domínios/portas diferentes.
- Nenhuma credencial fica no código-fonte — tudo vem do `.env`.
