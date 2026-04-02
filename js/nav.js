/* ============================================================
   nav.js — Navigation, dark mode, langue, toasts
   ============================================================ */

/* ── Traductions ── */
const i18n = {
  fr: {
    nav_home: 'Accueil', nav_categories: 'Catégories', nav_contribute: 'Contribuer',
    nav_login: 'Connexion', nav_register: 'S\'inscrire', nav_dashboard: 'Dashboard',
    nav_logout: 'Déconnexion', nav_admin: 'Admin',
    cat_diy: '🔨 Bricolage', cat_cooking: '👨‍🍳 Cuisine', cat_code: '💻 Programmation',
    cat_gardening: '🌱 Jardinage', cat_wellness: '🧘 Bien-être',
    search_placeholder: 'Rechercher un tutoriel...',
    filter_all: 'Tous', filter_easy: 'Facile', filter_medium: 'Moyen', filter_hard: 'Difficile',
    loading: 'Chargement...', no_results: 'Aucun résultat',
    error_generic: 'Une erreur est survenue.',
  },
  en: {
    nav_home: 'Home', nav_categories: 'Categories', nav_contribute: 'Contribute',
    nav_login: 'Login', nav_register: 'Sign Up', nav_dashboard: 'Dashboard',
    nav_logout: 'Logout', nav_admin: 'Admin',
    cat_diy: '🔨 DIY', cat_cooking: '👨‍🍳 Cooking', cat_code: '💻 Programming',
    cat_gardening: '🌱 Gardening', cat_wellness: '🧘 Wellness',
    search_placeholder: 'Search a tutorial...',
    filter_all: 'All', filter_easy: 'Easy', filter_medium: 'Medium', filter_hard: 'Hard',
    loading: 'Loading...', no_results: 'No results',
    error_generic: 'An error occurred.',
  },
};

/* ── Lang courante ── */
function getLang() { return localStorage.getItem('tf_lang') || 'fr'; }
function setLang(l) {
  localStorage.setItem('tf_lang', l);
  applyLang();
}
function t(key) { return i18n[getLang()]?.[key] || i18n.fr[key] || key; }
window.t = t;

function applyLang() {
  const lang = getLang();
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const val = t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = val;
    else el.textContent = val;
  });
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });
}
window.applyLang = applyLang;

/* ── Dark mode ── */
/* Appliquer immédiatement pour éviter le flash blanc */
(function () {
  if (localStorage.getItem('tf_dark') === 'true') {
    document.documentElement.classList.add('dark');
  }
})();

function getDark() { return localStorage.getItem('tf_dark') === 'true'; }
function toggleDark() {
  const next = !getDark();
  localStorage.setItem('tf_dark', next);
  applyDark();
}
function applyDark() {
  const dark = getDark();
  document.documentElement.classList.toggle('dark', dark);
  document.querySelectorAll('.dark-toggle').forEach(b => {
    b.textContent = dark ? '☀️' : '🌙';
    b.title       = dark ? 'Mode clair' : 'Mode sombre';
  });
}
window.applyDark = applyDark;

/* ── Navigation scroll ── */
function initHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ── Dropdown catégories ── */
function initDropdowns() {
  document.querySelectorAll('.nav-dropdown').forEach(dd => {
    const toggle = dd.querySelector('.nav-dropdown-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', e => {
      e.stopPropagation();
      dd.classList.toggle('open');
    });
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.nav-dropdown.open').forEach(d => d.classList.remove('open'));
  });
}

/* ── Burger mobile ── */
function initBurger() {
  const burger = document.getElementById('nav-burger');
  const mobile = document.getElementById('nav-mobile');
  if (!burger || !mobile) return;

  burger.addEventListener('click', () => {
    const open = burger.classList.toggle('open');
    mobile.classList.toggle('open', open);
  });
  mobile.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('click', () => {
      burger.classList.remove('open');
      mobile.classList.remove('open');
    });
  });
  document.addEventListener('click', e => {
    if (!burger.contains(e.target) && !mobile.contains(e.target)) {
      burger.classList.remove('open');
      mobile.classList.remove('open');
    }
  });
}

/* ── Mettre à jour l'UI selon l'utilisateur connecté ── */
async function initUserNav() {
  if (typeof Auth === 'undefined') return;
  const user = await Auth.getCurrentUser();

  const loginLink     = document.getElementById('nav-login');
  const registerLink  = document.getElementById('nav-register');
  const dashLink      = document.getElementById('nav-dashboard');
  const logoutBtn     = document.getElementById('nav-logout');
  const navAvatar     = document.getElementById('nav-avatar');

  if (user) {
    loginLink?.style   && (loginLink.style.display    = 'none');
    registerLink?.style && (registerLink.style.display = 'none');
    dashLink?.style    && (dashLink.style.display     = '');
    logoutBtn?.style   && (logoutBtn.style.display    = '');
    if (navAvatar) {
      navAvatar.textContent = user.username[0].toUpperCase();
      navAvatar.style.display = 'flex';
    }
  } else {
    dashLink?.style  && (dashLink.style.display  = 'none');
    logoutBtn?.style && (logoutBtn.style.display = 'none');
  }

  logoutBtn?.addEventListener('click', () => {
    Auth.logout();
    window.location.href = '/';
  });
}

/* ── Activer le lien de nav courant ── */
function markActiveLink() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link[href]').forEach(a => {
    const href = a.getAttribute('href').split('/').pop();
    a.classList.toggle('active', href === path || (path === '' && href === 'index.html'));
  });
}

/* ══════════════════════════════════════
   TOASTS
══════════════════════════════════════ */
function toast(msg, type = 'success', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span><span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(120%)';
    el.style.transition = 'all 0.3s ease';
    setTimeout(() => el.remove(), 300);
  }, duration);
}
window.toast = toast;

/* ══════════════════════════════════════
   DIALOG DE CONFIRMATION
══════════════════════════════════════ */
function confirm(message, onConfirm) {
  let overlay = document.getElementById('confirm-dialog');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'confirm-dialog';
    overlay.className = 'dialog-overlay';
    overlay.innerHTML = `
      <div class="dialog-box">
        <h3 id="confirm-title">Confirmation</h3>
        <p id="confirm-msg"></p>
        <div class="dialog-actions">
          <button class="btn btn-ghost" id="confirm-cancel">Annuler</button>
          <button class="btn btn-danger" id="confirm-ok">Confirmer</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('confirm-cancel').addEventListener('click', () => {
      overlay.classList.remove('open');
    });
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  }
  document.getElementById('confirm-msg').textContent = message;
  overlay.classList.add('open');
  const okBtn = document.getElementById('confirm-ok');
  const handler = () => {
    overlay.classList.remove('open');
    onConfirm();
    okBtn.removeEventListener('click', handler);
  };
  okBtn.addEventListener('click', handler);
}
window.confirmDialog = confirm;

/* ══════════════════════════════════════
   INIT GLOBAL
══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  applyDark();
  applyLang();
  initHeader();
  initDropdowns();
  initBurger();
  markActiveLink();
  initUserNav();

  /* Lang buttons — évite le double-binding */
  document.querySelectorAll('.lang-btn').forEach(b => {
    if (b.dataset.langBound) return;
    b.dataset.langBound = '1';
    b.addEventListener('click', () => setLang(b.dataset.lang));
  });
  /* Dark toggle — évite le double-binding */
  document.querySelectorAll('.dark-toggle').forEach(b => {
    if (b.dataset.darkBound) return;
    b.dataset.darkBound = '1';
    b.addEventListener('click', toggleDark);
  });
});
