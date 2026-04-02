/* ============================================================
   data.js — Gestion des tutoriels (localStorage + data.json)
   ============================================================ */

const TutoData = (() => {

  const KEYS = {
    CUSTOM  : 'tf_custom_tutos',   /* Tutoriels créés par les users */
    MODS    : 'tf_mods',           /* Modifications admin sur tutos de base */
    DELETED : 'tf_deleted',        /* IDs supprimés par admin */
  };

  let _base = null; /* Cache du data.json */

  /* ── Charger les tutos de base depuis data/tutorials.json ── */
  async function loadBase() {
    if (_base) return _base;
    try {
      const res  = await fetch('data/tutorials.json?t=' + Date.now());
      if (!res.ok) throw new Error('HTTP ' + res.status);
      _base = await res.json();
    } catch (e) {
      console.warn('Impossible de charger data/tutorials.json :', e.message);
      _base = [];
    }
    return _base;
  }

  /* ── Helpers localStorage ── */
  const getCustom  = () => JSON.parse(localStorage.getItem(KEYS.CUSTOM)  || '[]');
  const getMods    = () => JSON.parse(localStorage.getItem(KEYS.MODS)    || '{}');
  const getDeleted = () => JSON.parse(localStorage.getItem(KEYS.DELETED) || '[]');
  const setCustom  = d => localStorage.setItem(KEYS.CUSTOM,  JSON.stringify(d));
  const setMods    = d => localStorage.setItem(KEYS.MODS,    JSON.stringify(d));
  const setDeleted = d => localStorage.setItem(KEYS.DELETED, JSON.stringify(d));

  /* ── Récupérer tous les tutoriels PUBLICS (custom publiés + base) ── */
  async function getAll() {
    const all = await getAllForAdmin();
    return all.filter(t => t.published !== false);
  }

  /* ── Récupérer TOUS les tutoriels y compris brouillons (admin uniquement) ── */
  async function getAllForAdmin() {
    const base    = await loadBase();
    const custom  = getCustom();
    const mods    = getMods();
    const deleted = getDeleted();

    const baseFinal = base
      .filter(t => !deleted.includes(String(t.id)))
      .map(t => mods[t.id] ? { ...t, ...mods[t.id] } : t);

    return [...custom, ...baseFinal];
  }

  /* ── Tutoriels d'un utilisateur ── */
  function getUserTutos(userId) {
    return getCustom().filter(t => t.authorId === userId);
  }

  /* ── Un tutoriel par ID ── */
  async function getById(id) {
    const all = await getAll();
    return all.find(t => String(t.id) === String(id)) || null;
  }

  /* ── Créer un tutoriel ── */
  function create(data, author) {
    const tuto = {
      id         : Date.now().toString(),
      titre      : data.titre?.trim()       || 'Sans titre',
      description: data.description?.trim() || '',
      categorie  : data.categorie           || 'Autre',
      difficulty : data.difficulty          || 'Facile',
      time       : parseInt(data.time)      || 15,
      content    : data.content?.trim()     || '',
      image      : data.image?.trim()       || '',
      emoji      : data.emoji               || '📚',
      tags       : data.tags                || [],
      authorId   : author.id,
      authorName : author.username,
      createdAt  : new Date().toISOString(),
      updatedAt  : new Date().toISOString(),
      views      : 0,
      published  : data.published !== undefined ? !!data.published : true,
    };
    const custom = getCustom();
    custom.unshift(tuto);
    setCustom(custom);
    return tuto;
  }

  /* ── Modifier un tutoriel ── */
  function update(id, data, userId) {
    const custom = getCustom();
    const idx    = custom.findIndex(t => t.id === id);

    if (idx >= 0) {
      /* Tutoriel custom — vérifier propriété */
      if (custom[idx].authorId !== userId) throw new Error('Non autorisé.');
      custom[idx] = { ...custom[idx], ...data, updatedAt: new Date().toISOString() };
      setCustom(custom);
      return custom[idx];
    }

    /* Tutoriel de base — stocker la modif */
    const mods = getMods();
    mods[id]   = { ...mods[id], ...data };
    setMods(mods);
    return { id, ...data };
  }

  /* ── Supprimer un tutoriel ── */
  function remove(id, userId, isAdmin = false) {
    const custom = getCustom();
    const idx    = custom.findIndex(t => t.id === id);

    if (idx >= 0) {
      if (!isAdmin && custom[idx].authorId !== userId) throw new Error('Non autorisé.');
      custom.splice(idx, 1);
      setCustom(custom);
      return;
    }

    /* Tutoriel de base → marquer supprimé (admin seulement) */
    if (!isAdmin) throw new Error('Non autorisé.');
    const del = getDeleted();
    if (!del.includes(String(id))) { del.push(String(id)); setDeleted(del); }
  }

  /* ── Incrémenter les vues ── */
  function addView(id) {
    const custom = getCustom();
    const idx    = custom.findIndex(t => t.id === id);
    if (idx >= 0) { custom[idx].views = (custom[idx].views || 0) + 1; setCustom(custom); }
  }

  /* ── Filtrer / rechercher ── */
  function filter(tutos, { q, cat, diff, sort } = {}) {
    let res = [...tutos];

    if (q) {
      const query = q.toLowerCase();
      res = res.filter(t =>
        t.titre?.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.categorie?.toLowerCase().includes(query)
      );
    }
    if (cat  && cat  !== 'all') res = res.filter(t => t.categorie === cat);
    if (diff && diff !== 'all') res = res.filter(t => t.difficulty === diff);

    switch (sort) {
      case 'oldest': res.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
      case 'views':  res.sort((a,b) => (b.views||0) - (a.views||0)); break;
      default:       res.sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0)); break;
    }
    return res;
  }

  /* ── Invalider le cache (admin : après modif d'un tuto de base) ── */
  function _invalidateCache() { _base = null; }

  return {
    getAll, getAllForAdmin, getById, getUserTutos,
    create, update, remove, addView, filter,
    loadBase, _invalidateCache,
  };

})();

window.TutoData = TutoData;
