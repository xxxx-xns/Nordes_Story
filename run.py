from app import create_app
from seed import run as seed_db

app = create_app()

# Garante tabelas criadas e catálogo sincronizado toda vez que a app sobe,
# sem precisar rodar "python seed.py" à parte.
seed_db(app)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
