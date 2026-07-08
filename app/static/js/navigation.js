/* ==========================================================================
   Nordes Story — Navegação entre abas
   Cada aba agora tem uma rota própria no Flask (/home, /explorar, /colecoes,
   /favoritos, /perfil, /login). Trocar de aba atualiza a URL via History API
   (sem recarregar a página), e abrir a URL diretamente (ou dar F5) carrega a
   aba certa porque o Flask já renderiza o template com ela ativa.
   ========================================================================== */

const NORDES_PAGE_ROUTES = {
    home: '/home',
    explorar: '/explorar',
    colecoes: '/colecoes',
    favoritos: '/favoritos',
    perfil: '/perfil',
    login: '/login'
};

const NORDES_PAGE_TITLES = {
    home: 'Nordes Story | Início',
    explorar: 'Nordes Story | Explorar',
    colecoes: 'Nordes Story | Coleções',
    favoritos: 'Nordes Story | Favoritos',
    perfil: 'Nordes Story | Perfil',
    login: 'Nordes Story | Entrar'
};

function navigateTo(pageId, options = {}) {
    const { updateHistory = true } = options;

    // 1. Hide all sections
    const sections = document.querySelectorAll('.page-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // 2. Show the target section
    const targetSection = document.getElementById(pageId);
    if (targetSection) {
        targetSection.classList.add('active');
        // Scroll to top when changing pages
        window.scrollTo(0, 0);
    }

    // 3. Update active state in bottom nav
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === pageId) {
            item.classList.add('active');
        }
    });

    // 4. Toggle body-level state for the auth (login) page
    document.body.classList.toggle('auth-mode', pageId === 'login');

    // 5. Keep the URL and tab title in sync with the current route
    const route = NORDES_PAGE_ROUTES[pageId];
    if (route) {
        document.title = NORDES_PAGE_TITLES[pageId] || document.title;
        if (updateHistory && window.location.pathname !== route) {
            window.history.pushState({ pageId }, '', route);
        }
    }
}

/* Resolve qual aba abrir a partir do caminho da URL atual (usado no F5,
   em links compartilhados e no botão voltar/avançar do navegador). */
function nordesResolvePageFromPath(pathname) {
    const entry = Object.entries(NORDES_PAGE_ROUTES).find(([, route]) => route === pathname);
    return entry ? entry[0] : null;
}

document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = item.getAttribute('data-page');
            navigateTo(pageId);
        });
    });

    // Botões "voltar" dentro de cada header de aba (ex: Explorar -> Início)
    document.querySelectorAll('[data-navigate]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(el.getAttribute('data-navigate'));
        });
    });

    // Volta/avança do navegador: recoloca a aba correta sem duplicar histórico
    window.addEventListener('popstate', (e) => {
        const pageId = (e.state && e.state.pageId) || nordesResolvePageFromPath(window.location.pathname) || 'home';
        navigateTo(pageId, { updateHistory: false });
    });

    // Aba inicial: definida pelo Flask (rota acessada) ou 'home' por padrão
    const initialPage = window.NORDES_INITIAL_PAGE || nordesResolvePageFromPath(window.location.pathname) || 'home';
    navigateTo(initialPage, { updateHistory: false });
    window.history.replaceState({ pageId: initialPage }, '', NORDES_PAGE_ROUTES[initialPage] || '/home');

    // /cart abre a aba Início com a sacola já aberta por cima
    if (window.NORDES_OPEN_CART && typeof nordesOpenCart === 'function') {
        nordesOpenCart();
    }
});
