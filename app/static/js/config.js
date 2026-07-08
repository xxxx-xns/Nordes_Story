/* ==========================================================================
   Nordes Story — Configuração da API
   O frontend agora é servido pelo próprio Flask (mesma origem), então a API
   sempre pode ser chamada com um caminho relativo — funciona em dev e em
   produção sem precisar trocar nada aqui.
   ========================================================================== */

const NORDES_API_BASE = '/api';

/* Helper central de requisições: sempre envia cookies de sessão (credentials)
   e já retorna o corpo JSON parseado junto do status de sucesso. */
async function nordesApiFetch(path, options = {}) {
    const response = await fetch(`${NORDES_API_BASE}${path}`, {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        },
        ...options
    });

    let body = null;
    try {
        body = await response.json();
    } catch (e) {
        body = null;
    }

    return { ok: response.ok, status: response.status, body };
}
