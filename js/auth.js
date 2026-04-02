/* ============================================================
   auth.js — Authentification TutoFacile
   Même système SHA-256 que le portfolio about-me,
   adapté pour les utilisateurs publics (register/login)
   + admin avec hash en dur.

   ADMIN :
   - Identifiant : admin
   - Mot de passe : défini par ADMIN_PASS_HASH ci-dessous
   - Pour changer : https://emn178.github.io/online-tools/sha256.html
   ============================================================ */

const Auth = (() => {

  /* === Config admin === */
  const ADMIN_USER      = 'admin';
  /* SHA-256 de "TutoAdmin2026!" — À CHANGER */
  const ADMIN_PASS_HASH = '10125b435f7cbddab3d6f537f13a4bc62e65e53c844857047698d44c8e2bad46';
  const TOKEN_SECRET    = 'tutofacile-admin-sel-2026-perso';
  /* =================== */

  const STORAGE = {
    USERS    : 'tf_users',
    SESSION  : 'tf_session',
    A_SESSION: 'tf_admin_session',
  };
  const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; /* 7 jours */

  /* ── SHA-256 natif ── */
  async function sha256(msg) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  }

  /* ── Token de session signé ── */
  async function makeToken(data, secret) {
    const exp = Date.now() + SESSION_DURATION;
    const pay = JSON.stringify({ ...data, exp });
    const sig = await sha256(pay + secret);
    return btoa(JSON.stringify({ pay, sig }));
  }

  async function verifyToken(raw, secret) {
    try {
      const { pay, sig } = JSON.parse(atob(raw));
      const { exp }      = JSON.parse(pay);
      if (Date.now() > exp) return null;
      if (await sha256(pay + secret) !== sig) return null;
      return JSON.parse(pay);
    } catch { return null; }
  }

  /* ── Helpers localStorage ── */
  const getUsers = () => JSON.parse(localStorage.getItem(STORAGE.USERS) || '[]');
  const setUsers = u  => localStorage.setItem(STORAGE.USERS, JSON.stringify(u));

  /* ══════════════════════════════════════
     API PUBLIQUE
  ══════════════════════════════════════ */
  return {

    /* ── Inscription utilisateur ── */
    async register(username, email, password) {
      const users = getUsers();

      /* Validations */
      if (!username || username.length < 3)
        throw new Error('Le nom d\'utilisateur doit faire au moins 3 caractères.');
      if (!email || !email.includes('@'))
        throw new Error('Adresse email invalide.');
      if (!password || password.length < 6)
        throw new Error('Le mot de passe doit faire au moins 6 caractères.');
      if (users.find(u => u.username.toLowerCase() === username.toLowerCase()))
        throw new Error('Ce nom d\'utilisateur est déjà pris.');
      if (users.find(u => u.email.toLowerCase() === email.toLowerCase()))
        throw new Error('Cette adresse email est déjà utilisée.');

      const hash = await sha256(password);
      const user = {
        id       : Date.now().toString(),
        username : username.trim(),
        email    : email.trim().toLowerCase(),
        hash,
        createdAt: new Date().toISOString(),
        role     : 'user',
      };

      users.push(user);
      setUsers(users);

      /* Connecter directement après inscription */
      const token = await makeToken({ id: user.id, username: user.username }, TOKEN_SECRET);
      localStorage.setItem(STORAGE.SESSION, token);
      return user;
    },

    /* ── Connexion utilisateur ── */
    async login(username, password) {
      const users = getUsers();
      const user  = users.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (!user) throw new Error('Nom d\'utilisateur ou mot de passe incorrect.');

      const hash = await sha256(password);
      if (hash !== user.hash) throw new Error('Nom d\'utilisateur ou mot de passe incorrect.');

      const token = await makeToken({ id: user.id, username: user.username }, TOKEN_SECRET);
      localStorage.setItem(STORAGE.SESSION, token);
      return user;
    },

    /* ── Récupérer l'utilisateur connecté ── */
    async getCurrentUser() {
      const token = localStorage.getItem(STORAGE.SESSION);
      if (!token) return null;
      const data  = await verifyToken(token, TOKEN_SECRET);
      if (!data)  { localStorage.removeItem(STORAGE.SESSION); return null; }
      const users = getUsers();
      return users.find(u => u.id === data.id) || null;
    },

    /* ── Déconnexion ── */
    logout() {
      localStorage.removeItem(STORAGE.SESSION);
    },

    /* ── Changer le mot de passe ── */
    async changePassword(userId, oldPassword, newPassword) {
      const users = getUsers();
      const idx   = users.findIndex(u => u.id === userId);
      if (idx < 0) throw new Error('Utilisateur introuvable.');

      const oldHash = await sha256(oldPassword);
      if (oldHash !== users[idx].hash) throw new Error('Mot de passe actuel incorrect.');
      if (newPassword.length < 6) throw new Error('Le nouveau mot de passe doit faire au moins 6 caractères.');

      users[idx].hash = await sha256(newPassword);
      setUsers(users);
    },

    /* ══════════════════════════════════════
       ADMIN (même système que about-me)
    ══════════════════════════════════════ */

    /* Connexion admin avec SHA-256 */
    async adminLogin(username, password) {
      if (username.toLowerCase() !== ADMIN_USER) return false;
      const hash = await sha256(password);
      if (hash !== ADMIN_PASS_HASH) return false;
      const token = await makeToken({ role: 'admin', user: ADMIN_USER }, TOKEN_SECRET + '-admin');
      sessionStorage.setItem(STORAGE.A_SESSION, token);
      return true;
    },

    /* Vérifier la session admin */
    async isAdminAuthenticated() {
      const token = sessionStorage.getItem(STORAGE.A_SESSION);
      if (!token) return false;
      const data  = await verifyToken(token, TOKEN_SECRET + '-admin');
      return data?.role === 'admin';
    },

    /* Déconnexion admin */
    adminLogout() {
      sessionStorage.removeItem(STORAGE.A_SESSION);
    },

    /* Utilitaire : hasher un mot de passe */
    sha256,

    ADMIN_USER,
  };

})();

window.Auth = Auth;
