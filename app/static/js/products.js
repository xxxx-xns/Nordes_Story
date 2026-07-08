/* ==========================================================================
   Nordes Story — Catálogo de produtos (integrado com a API Flask)
   NORDES_PRODUCTS começa vazio e é preenchido a partir de GET /api/products
   assim que a página carrega. search.js e cart.js consultam esse array.
   ========================================================================== */

let NORDES_PRODUCTS = [];

async function nordesLoadProducts() {
    const { ok, body } = await nordesApiFetch('/products');
    if (ok) {
        NORDES_PRODUCTS = body.data;
    }
    return NORDES_PRODUCTS;
}

/* Helper de busca: retorna referência ao produto pelo id */
function nordesFindProduct(id) {
    return NORDES_PRODUCTS.find(p => p.id === id);
}

/* Helper de formatação de preço em Real */
function nordesFormatPrice(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

document.addEventListener('DOMContentLoaded', () => {
    nordesLoadProducts();
});
