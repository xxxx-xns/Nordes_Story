/* ==========================================================================
   Nordes Story — Autenticação e Perfil (integrado com a API Flask)
   O usuário logado fica em cache em memória (nordesCurrentUser) e é
   sincronizado com o backend via cookie de sessão HTTPOnly.
   ========================================================================== */

let nordesCurrentUser = null;

function nordesGetAccount() {
    return nordesCurrentUser;
}

function nordesIsLoggedIn() {
    return !!nordesCurrentUser;
}

/* --------------------------------------------------------------------
   Carrega o usuário logado ao abrir a página (se houver sessão válida)
   -------------------------------------------------------------------- */
async function nordesFetchMe() {
    const { ok, body } = await nordesApiFetch('/auth/me');
    nordesCurrentUser = ok ? body.data : null;
    nordesUpdateHeaderAvatar();
    return nordesCurrentUser;
}

/* --------------------------------------------------------------------
   Navegação de acesso: avatar do header decide entre Perfil e Login
   -------------------------------------------------------------------- */
function nordesGoToProfile() {
    if (nordesIsLoggedIn()) {
        navigateTo('perfil');
        nordesRenderProfile();
    } else {
        navigateTo('login');
        nordesShowLoginView('login');
    }
}

function nordesUpdateHeaderAvatar() {
    const avatarImg = document.getElementById('header-avatar-img');
    if (!avatarImg) return;
    const account = nordesGetAccount();
    if (nordesIsLoggedIn() && account) {
        avatarImg.src = account.avatarUrl ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(account.name)}&background=2D241E&color=fff`;
        avatarImg.alt = account.name;
    } else {
        avatarImg.src = 'https://ui-avatars.com/api/?name=Visitante&background=D1C7BD&color=fff';
        avatarImg.alt = 'Visitante';
    }
}

/* --------------------------------------------------------------------
   Login / Cadastro
   -------------------------------------------------------------------- */
function nordesShowLoginView(view) {
    document.getElementById('login-view').classList.toggle('hidden', view !== 'login');
    document.getElementById('register-view').classList.toggle('hidden', view !== 'register');
    document.querySelectorAll('#login .auth-error').forEach(el => { el.textContent = ''; });
}

async function nordesHandleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    errorEl.textContent = '';

    const { ok, body } = await nordesApiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });

    if (!ok) {
        errorEl.textContent = body?.message || 'Não foi possível entrar. Tente novamente.';
        return;
    }

    nordesCurrentUser = body.data;
    nordesUpdateHeaderAvatar();
    nordesShowToast(`Bem-vindo(a) de volta, ${nordesCurrentUser.name.split(' ')[0]}!`);
    navigateTo('perfil');
    nordesRenderProfile();
    e.target.reset();
}

async function nordesHandleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;
    const errorEl = document.getElementById('register-error');
    errorEl.textContent = '';

    const { ok, body } = await nordesApiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, confirmPassword })
    });

    if (!ok) {
        const errors = body?.errors || {};
        errorEl.textContent = Object.values(errors)[0] || body?.message || 'Não foi possível criar a conta.';
        return;
    }

    nordesCurrentUser = body.data;
    nordesUpdateHeaderAvatar();
    nordesShowToast(`Conta criada! Bem-vindo(a), ${nordesCurrentUser.name.split(' ')[0]} 🎉`);
    navigateTo('perfil');
    nordesRenderProfile();
    e.target.reset();
}

async function nordesLogout() {
    await nordesApiFetch('/auth/logout', { method: 'POST' });
    nordesCurrentUser = null;
    nordesUpdateHeaderAvatar();
    if (typeof nordesFetchCart === 'function') {
        await nordesFetchCart();
    }
    nordesShowToast('Você saiu da sua conta.');
    navigateTo('home');
}

/* --------------------------------------------------------------------
   Login com Google — navegação de página inteira (fluxo OAuth padrão),
   o backend redireciona de volta para cá após o consentimento.
   -------------------------------------------------------------------- */
function nordesHandleGoogleLogin() {
    window.location.href = `${NORDES_API_BASE}/auth/google/login`;
}

/* --------------------------------------------------------------------
   Renderização da página de perfil
   -------------------------------------------------------------------- */
function nordesRenderProfile() {
    const account = nordesGetAccount();
    if (!account) return;

    document.getElementById('profile-name').textContent = account.name;
    document.getElementById('profile-email').textContent = account.email;
    document.getElementById('profile-avatar-img').src = account.avatarUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(account.name)}&background=2D241E&color=fff&size=128`;

    const addr = account.address || {};
    const addressComplete = addr.street && addr.city;
    document.getElementById('profile-address-summary').textContent = addressComplete
        ? `${addr.street}, ${addr.number} — ${addr.city}/${addr.state}`
        : 'Nenhum endereço cadastrado';

    document.getElementById('profile-phone-summary').textContent = account.phone || 'Não informado';
}

/* --------------------------------------------------------------------
   Modais de configurações (Editar perfil / Informações pessoais / Endereço)
   -------------------------------------------------------------------- */
function nordesOpenModal(modalId) {
    const account = nordesGetAccount();
    if (!account) return;

    if (modalId === 'modal-editar-perfil') {
        document.getElementById('edit-name').value = account.name || '';
        document.getElementById('edit-email').value = account.email || '';
    }
    if (modalId === 'modal-info-pessoais') {
        document.getElementById('edit-phone').value = account.phone || '';
        document.getElementById('edit-cpf').value = account.cpf || '';
        document.getElementById('edit-birthdate').value = account.birthdate || '';
    }
    if (modalId === 'modal-endereco') {
        const addr = account.address || {};
        document.getElementById('edit-cep').value = addr.cep || '';
        document.getElementById('edit-street').value = addr.street || '';
        document.getElementById('edit-number').value = addr.number || '';
        document.getElementById('edit-complement').value = addr.complement || '';
        document.getElementById('edit-neighborhood').value = addr.neighborhood || '';
        document.getElementById('edit-city').value = addr.city || '';
        document.getElementById('edit-state').value = addr.state || '';
    }

    document.getElementById(modalId).classList.add('open');
    document.body.classList.add('no-scroll');
}

function nordesCloseModal(modalId) {
    document.getElementById(modalId).classList.remove('open');
    document.body.classList.remove('no-scroll');
}

async function nordesHandleEditProfileSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('edit-name').value.trim();
    const email = document.getElementById('edit-email').value.trim();

    const { ok, body } = await nordesApiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, email })
    });

    if (!ok) {
        nordesShowToast(body?.message || 'Não foi possível atualizar o perfil.');
        return;
    }

    nordesCurrentUser = body.data;
    nordesRenderProfile();
    nordesUpdateHeaderAvatar();
    nordesCloseModal('modal-editar-perfil');
    nordesShowToast('Perfil atualizado com sucesso!');
}

async function nordesHandleInfoSubmit(e) {
    e.preventDefault();
    const phone = document.getElementById('edit-phone').value.trim();
    const cpf = document.getElementById('edit-cpf').value.trim();
    const birthdate = document.getElementById('edit-birthdate').value;

    const { ok, body } = await nordesApiFetch('/auth/profile/personal', {
        method: 'PUT',
        body: JSON.stringify({ phone, cpf, birthdate })
    });

    if (!ok) {
        nordesShowToast(body?.message || 'Não foi possível salvar as informações.');
        return;
    }

    nordesCurrentUser = body.data;
    nordesRenderProfile();
    nordesCloseModal('modal-info-pessoais');
    nordesShowToast('Informações pessoais salvas!');
}

async function nordesHandleAddressSubmit(e) {
    e.preventDefault();
    const payload = {
        cep: document.getElementById('edit-cep').value.trim(),
        street: document.getElementById('edit-street').value.trim(),
        number: document.getElementById('edit-number').value.trim(),
        complement: document.getElementById('edit-complement').value.trim(),
        neighborhood: document.getElementById('edit-neighborhood').value.trim(),
        city: document.getElementById('edit-city').value.trim(),
        state: document.getElementById('edit-state').value.trim()
    };

    const { ok, body } = await nordesApiFetch('/auth/profile/address', {
        method: 'PUT',
        body: JSON.stringify(payload)
    });

    if (!ok) {
        nordesShowToast(body?.message || 'Não foi possível salvar o endereço.');
        return;
    }

    nordesCurrentUser = body.data;
    nordesRenderProfile();
    nordesCloseModal('modal-endereco');
    nordesShowToast('Endereço salvo!');
}

/* --------------------------------------------------------------------
   Inicialização
   -------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', async () => {
    // Busca a sessão atual no backend antes de renderizar qualquer coisa
    await nordesFetchMe();

    // Agora que sabemos se há usuário logado, busca o carrinho dele
    if (typeof nordesFetchCart === 'function') {
        await nordesFetchCart();
    }

    // Se a aba atual já é o Perfil (ex: acabamos de voltar do login com
    // Google, que redireciona para a rota /perfil), renderiza os dados.
    if (nordesIsLoggedIn() && document.getElementById('perfil')?.classList.contains('active')) {
        nordesRenderProfile();
    }

    const avatarBtn = document.getElementById('header-profile-btn');
    if (avatarBtn) avatarBtn.addEventListener('click', nordesGoToProfile);

    // Login / cadastro
    document.getElementById('login-form').addEventListener('submit', nordesHandleLogin);
    document.getElementById('register-form').addEventListener('submit', nordesHandleRegister);
    document.getElementById('show-register-link').addEventListener('click', (e) => {
        e.preventDefault();
        nordesShowLoginView('register');
    });
    document.getElementById('show-login-link').addEventListener('click', (e) => {
        e.preventDefault();
        nordesShowLoginView('login');
    });
    document.getElementById('google-login-btn').addEventListener('click', nordesHandleGoogleLogin);
    document.getElementById('google-register-btn').addEventListener('click', nordesHandleGoogleLogin);

    // Botões de configurações do perfil
    document.querySelectorAll('[data-open-modal]').forEach(btn => {
        btn.addEventListener('click', () => nordesOpenModal(btn.getAttribute('data-open-modal')));
    });
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', () => nordesCloseModal(btn.getAttribute('data-close-modal')));
    });
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) nordesCloseModal(overlay.id);
        });
    });

    // Forms de configurações
    document.getElementById('form-editar-perfil').addEventListener('submit', nordesHandleEditProfileSubmit);
    document.getElementById('form-info-pessoais').addEventListener('submit', nordesHandleInfoSubmit);
    document.getElementById('form-endereco').addEventListener('submit', nordesHandleAddressSubmit);

    // Logout
    document.getElementById('logout-btn').addEventListener('click', nordesLogout);
});
