"""
Helpers para padronizar as respostas JSON da API em todos os blueprints.
"""
from flask import jsonify


def ok(data=None, message: str | None = None, status: int = 200):
    body = {"success": True}
    if message:
        body["message"] = message
    if data is not None:
        body["data"] = data
    return jsonify(body), status


def error(message: str, status: int = 400, errors: dict | None = None):
    body = {"success": False, "message": message}
    if errors:
        body["errors"] = errors
    return jsonify(body), status
