/* ==========================================================================
   Nordes Story — Busca dinâmica
   Filtra o catálogo em tempo real por título, autor ou categoria.
   ========================================================================== */

function nordesRenderSearchResults(query) {
    const resultsEl = document.getElementById('search-results');
    const emptyEl = document.getElementById('search-empty-state');
    const idleEl = document.getElementById('search-idle-state');
    const term = query.trim().toLowerCase();

    if (term === '') {
        resultsEl.innerHTML = '';
        resultsEl.style.display = 'none';
        emptyEl.style.display = 'none';
        idleEl.style.display = 'flex';
        return;
    }

    idleEl.style.display = 'none';

    const matches = NORDES_PRODUCTS.filter(p =>
        p.title.toLowerCase().includes(term) ||
        p.author.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
    );

    if (matches.length === 0) {
        resultsEl.style.display = 'none';
        emptyEl.style.display = 'flex';
        return;
    }

    emptyEl.style.display = 'none';
    resultsEl.style.display = 'flex';
    resultsEl.innerHTML = matches.map(p => `
        <div class="search-result-item">
            <div class="cart-item-cover" style="background:${p.cover}">
                <i class="fa-solid ${p.icon}"></i>
            </div>
            <div class="cart-item-info">
                <h4>${p.title}</h4>
                <p class="cart-item-author">${p.author} · ${p.category}</p>
                <span class="cart-item-price">${nordesFormatPrice(p.price)}</span>
            </div>
            <button class="add-to-cart-btn add-to-cart-btn--pill" data-id="${p.id}">
                <i class="fa-solid fa-cart-plus"></i> Adicionar
            </button>
        </div>
    `).join('');
}

function nordesOpenSearch() {
    const overlay = document.getElementById('search-overlay');
    overlay.classList.add('open');
    document.body.classList.add('no-scroll');
    const input = document.getElementById('search-input');
    input.value = '';
    nordesRenderSearchResults('');
    // Foco após a transição de abertura para o teclado mobile não brigar com a animação
    setTimeout(() => input.focus(), 150);
}

function nordesCloseSearch() {
    document.getElementById('search-overlay').classList.remove('open');
    document.body.classList.remove('no-scroll');
}

document.addEventListener('DOMContentLoaded', () => {
    const searchIcon = document.getElementById('header-search-icon');
    if (searchIcon) {
        searchIcon.addEventListener('click', nordesOpenSearch);
    }

    document.getElementById('search-close-btn').addEventListener('click', nordesCloseSearch);
    document.getElementById('search-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'search-overlay') nordesCloseSearch();
    });

    const input = document.getElementById('search-input');
    input.addEventListener('input', (e) => {
        nordesRenderSearchResults(e.target.value);
    });

    document.getElementById('search-clear-btn').addEventListener('click', () => {
        input.value = '';
        nordesRenderSearchResults('');
        input.focus();
    });
});
