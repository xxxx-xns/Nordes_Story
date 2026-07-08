/* ==========================================================================
   Nordes Story — Carrinho / Sacola (integrado com a API Flask)
   O carrinho é por usuário logado, guardado no banco. Cada ação (adicionar,
   atualizar, remover) chama a API e re-renderiza a partir da resposta.
   ========================================================================== */

let nordesCart = { items: [], total: 0, itemCount: 0 };

function nordesEmptyCart() {
    return { items: [], total: 0, itemCount: 0 };
}

async function nordesFetchCart() {
    if (!nordesIsLoggedIn()) {
        nordesCart = nordesEmptyCart();
        nordesRenderCart();
        nordesUpdateCartBadge();
        return nordesCart;
    }

    const { ok, body } = await nordesApiFetch('/cart');
    nordesCart = ok ? body.data : nordesEmptyCart();
    nordesRenderCart();
    nordesUpdateCartBadge();
    return nordesCart;
}

async function nordesAddToCart(productId, qty = 1) {
    if (!nordesIsLoggedIn()) {
        nordesShowToast('Faça login para adicionar itens à sacola.');
        navigateTo('login');
        nordesShowLoginView('login');
        return;
    }

    const { ok, body } = await nordesApiFetch('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity: qty })
    });

    if (!ok) {
        nordesShowToast(body?.message || 'Não foi possível adicionar o item.');
        return;
    }

    nordesCart = body.data;
    nordesRenderCart();
    nordesUpdateCartBadge();

    const added = nordesCart.items.find(item => item.product.id === productId);
    nordesShowToast(`"${added ? added.product.title : 'Item'}" adicionado à sacola`);
}

async function nordesRemoveFromCart(itemId) {
    const { ok, body } = await nordesApiFetch(`/cart/items/${itemId}`, { method: 'DELETE' });
    if (!ok) {
        nordesShowToast(body?.message || 'Não foi possível remover o item.');
        return;
    }
    nordesCart = body.data;
    nordesRenderCart();
    nordesUpdateCartBadge();
}

async function nordesUpdateQty(itemId, delta) {
    const item = nordesCart.items.find(i => i.id === itemId);
    if (!item) return;

    const newQty = item.quantity + delta;
    const { ok, body } = await nordesApiFetch(`/cart/items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: newQty })
    });

    if (!ok) {
        nordesShowToast(body?.message || 'Não foi possível atualizar a quantidade.');
        return;
    }

    nordesCart = body.data;
    nordesRenderCart();
    nordesUpdateCartBadge();
}

function nordesGetCartCount() {
    return nordesCart.itemCount || 0;
}

function nordesGetCartTotal() {
    return nordesCart.total || 0;
}

function nordesUpdateCartBadge() {
    const badges = document.querySelectorAll('.js-cart-badge');
    if (!badges.length) return;
    const count = nordesGetCartCount();
    badges.forEach(badge => {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    });
}

function nordesRenderCart() {
    const list = document.getElementById('cart-items-list');
    const emptyState = document.getElementById('cart-empty-state');
    const footer = document.getElementById('cart-footer');
    if (!list) return;

    const items = nordesCart.items || [];
    list.innerHTML = '';

    if (items.length === 0) {
        emptyState.style.display = 'flex';
        footer.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    footer.style.display = 'block';

    items.forEach(item => {
        const product = item.product;

        const el = document.createElement('div');
        el.className = 'cart-item';
        el.innerHTML = `
            <div class="cart-item-cover" style="background:${product.cover}">
                <i class="fa-solid ${product.icon}"></i>
            </div>
            <div class="cart-item-info">
                <h4>${product.title}</h4>
                <p class="cart-item-author">${product.author}</p>
                <div class="cart-item-bottom">
                    <span class="cart-item-price">${nordesFormatPrice(product.price)}</span>
                    <div class="qty-stepper">
                        <button class="qty-btn" data-action="dec" data-item-id="${item.id}" aria-label="Diminuir quantidade"><i class="fa-solid fa-minus"></i></button>
                        <span class="qty-value">${item.quantity}</span>
                        <button class="qty-btn" data-action="inc" data-item-id="${item.id}" aria-label="Aumentar quantidade"><i class="fa-solid fa-plus"></i></button>
                    </div>
                </div>
            </div>
            <button class="cart-item-remove" data-item-id="${item.id}" aria-label="Remover item">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        `;
        list.appendChild(el);
    });

    const totalEl = document.getElementById('cart-total');
    if (totalEl) totalEl.textContent = nordesFormatPrice(nordesGetCartTotal());
}

function nordesOpenCart() {
    document.getElementById('cart-overlay').classList.add('open');
    document.body.classList.add('no-scroll');
}

function nordesCloseCart() {
    document.getElementById('cart-overlay').classList.remove('open');
    document.body.classList.remove('no-scroll');
}

function nordesShowToast(message) {
    let toast = document.getElementById('nordes-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'nordes-toast';
        toast.className = 'nordes-toast';
        document.body.appendChild(toast);
    }
    toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${message}`;
    toast.classList.remove('show');
    // Força reflow para reiniciar a animação em toques consecutivos
    void toast.offsetWidth;
    toast.classList.add('show');

    clearTimeout(toast._hideTimeout);
    toast._hideTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2400);
}

async function nordesCheckout() {
    if (!nordesIsLoggedIn()) {
        nordesShowToast('Faça login para finalizar a compra.');
        navigateTo('login');
        return;
    }

    const { ok, body } = await nordesApiFetch('/orders/checkout', { method: 'POST' });
    if (!ok) {
        nordesShowToast(body?.message || 'Não foi possível finalizar a compra.');
        return;
    }

    nordesShowToast('Compra finalizada com sucesso! 🎉');
    await nordesFetchCart();
    setTimeout(nordesCloseCart, 900);
}

document.addEventListener('DOMContentLoaded', () => {
    // A busca inicial do carrinho é disparada por auth.js, logo após
    // resolver se há usuário logado (garante a ordem correta).

    // Abrir sacola pelo ícone do header (presente em cada aba)
    document.querySelectorAll('.js-cart-icon').forEach(icon => {
        icon.addEventListener('click', nordesOpenCart);
    });

    // Fechar sacola
    document.getElementById('cart-close-btn').addEventListener('click', nordesCloseCart);
    document.getElementById('cart-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'cart-overlay') nordesCloseCart();
    });

    // Delegação de eventos: botões de quantidade e remoção dentro da lista
    document.getElementById('cart-items-list').addEventListener('click', (e) => {
        const qtyBtn = e.target.closest('.qty-btn');
        if (qtyBtn) {
            const itemId = qtyBtn.getAttribute('data-item-id');
            const action = qtyBtn.getAttribute('data-action');
            nordesUpdateQty(itemId, action === 'inc' ? 1 : -1);
            return;
        }
        const removeBtn = e.target.closest('.cart-item-remove');
        if (removeBtn) {
            nordesRemoveFromCart(removeBtn.getAttribute('data-item-id'));
        }
    });

    // Botão de finalizar compra
    document.getElementById('cart-checkout-btn').addEventListener('click', nordesCheckout);

    // Delegação global: qualquer botão "adicionar à sacola" nos cards de produto
    document.addEventListener('click', (e) => {
        const addBtn = e.target.closest('.add-to-cart-btn');
        if (addBtn) {
            e.preventDefault();
            e.stopPropagation();
            nordesAddToCart(addBtn.getAttribute('data-id'));
        }
    });
});
