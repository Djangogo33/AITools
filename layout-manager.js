// ============================================================================
// LAYOUT MANAGER - Gère les positions des éléments pour éviter les chevauchements
// ============================================================================

class LayoutManager {
  constructor() {
    this.elements = new Map();
    this.currentLayout = 'adaptive'; // adaptive, compact, minimal, custom
    this.margin = 10;
    this.loadLayout();
    this.initObserver();
  }

  // Registre les éléments à gérer
  registerElement(id, element, config = {}) {
    this.elements.set(id, {
      id,
      element,
      width: config.width || 150,
      height: config.height || 40,
      minWidth: config.minWidth || 100,
      minHeight: config.minHeight || 30,
      draggable: config.draggable !== false,
      priority: config.priority || 5, // 1-10, 1=critique (toujours visible)
      customPosition: config.customPosition || null,
      visible: config.visible !== false
    });

    this.applyLayout();
  }

  // Charge le layout sauvegardé
  loadLayout() {
    chrome.storage.local.get(['aitools-layout', 'aitools-layout-custom'], (data) => {
      if (data['aitools-layout']) {
        this.currentLayout = data['aitools-layout'];
      }
      if (data['aitools-layout-custom']) {
        this.customPositions = data['aitools-layout-custom'];
      } else {
        this.customPositions = {};
      }
      this.applyLayout();
    });
  }

  // Applique le layout courant
  applyLayout() {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    switch (this.currentLayout) {
      case 'compact':
        this.applyCompactLayout(viewport);
        break;
      case 'minimal':
        this.applyMinimalLayout(viewport);
        break;
      case 'custom':
        this.applyCustomLayout(viewport);
        break;
      default: // adaptive
        this.applyAdaptiveLayout(viewport);
    }
  }

  // Layout Compact - Tous les éléments en colonne à droite en évitant les collisions
  applyCompactLayout(viewport) {
    let positions = [];
    const mainColumn = viewport.width - 180; // Colonne droite
    let rightY = 20;

    // Trier par priorité (1-10, 1=plus critique)
    const sortedElements = Array.from(this.elements.values())
      .filter(e => e.visible)
      .sort((a, b) => a.priority - b.priority);

    for (const elem of sortedElements) {
      if (!elem.element) continue;

      // Position initiale
      let x = mainColumn;
      let y = rightY;

      // Vérifier les collisions
      let collision = true;
      let attempts = 0;
      while (collision && attempts < 10) {
        collision = false;
        for (const pos of positions) {
          if (this.hasCollision({ x, y, width: elem.width, height: elem.height }, pos)) {
            collision = true;
            y += elem.height + this.margin;
            break;
          }
        }
        attempts++;
      }

      // Si en dehors de l'écran, replier vers la gauche
      if (y + elem.height > viewport.height - 100) {
        x = mainColumn - 180;
        y = 20;
      }

      positions.push({ x, y, width: elem.width, height: elem.height });
      this.setElementPosition(elem.element, { x, y });
    }
  }

  // Layout Minimal - Seulement les critiques
  applyMinimalLayout(viewport) {
    const critical = Array.from(this.elements.values())
      .filter(e => e.visible && e.priority <= 3)
      .sort((a, b) => a.priority - b.priority);

    critical.forEach((elem, index) => {
      if (!elem.element) return;
      const x = viewport.width - 180;
      const y = 20 + (index * (elem.height + 10));
      this.setElementPosition(elem.element, { x, y });
    });

    // Cacher les non-critiques
    Array.from(this.elements.values())
      .filter(e => e.priority > 3)
      .forEach(elem => {
        if (elem.element) {
          elem.element.style.display = 'none';
        }
      });
  }

  // Layout Custom - Utilise les positions personnalisées
  applyCustomLayout(viewport) {
    for (const [id, elem] of this.elements) {
      if (!elem.element || !elem.visible) continue;

      if (this.customPositions[id]) {
        const pos = this.customPositions[id];
        this.setElementPosition(elem.element, pos);
      } else {
        this.setElementPosition(elem.element, { x: 20, y: 20 });
      }
    }
  }

  // Layout Adaptive - Intelligent placement
  applyAdaptiveLayout(viewport) {
    const gridSize = 20;
    const usedPositions = [];

    // Zones sûres (ne pas gêner le contenu)
    const safeZones = [
      { x: viewport.width - 200, y: 20, w: 180, h: viewport.height - 40 }, // Droit
      { x: 20, y: viewport.height - 200, w: 180, h: 180 }, // Bas-gauche
      { x: 20, y: 20, w: 180, h: 180 } // Haut-gauche
    ];

    const visibleElements = Array.from(this.elements.values())
      .filter(e => e.visible)
      .sort((a, b) => a.priority - b.priority);

    for (const elem of visibleElements) {
      if (!elem.element) continue;

      let placed = false;
      for (const zone of safeZones) {
        for (let x = zone.x; x < zone.x + zone.w; x += gridSize) {
          for (let y = zone.y; y < zone.y + zone.h; y += gridSize) {
            const testBox = { x, y, width: elem.width, height: elem.height };
            
            // Vérifier si dans la zone
            if (x + elem.width > zone.x + zone.w || y + elem.height > zone.y + zone.h) continue;

            // Vérifier les collisions
            let hasCollision = false;
            for (const used of usedPositions) {
              if (this.hasCollision(testBox, used)) {
                hasCollision = true;
                break;
              }
            }

            if (!hasCollision) {
              this.setElementPosition(elem.element, { x, y });
              usedPositions.push(testBox);
              placed = true;
              break;
            }
          }
          if (placed) break;
        }
        if (placed) break;
      }

      // Fallback - mettre hors écran si impossible
      if (!placed) {
        elem.element.style.display = 'none';
      }
    }
  }

  // Crée un layout custom - pour chaque élément
  createCustomLayout() {
    const positions = {};
    Array.from(this.elements.values()).forEach(elem => {
      if (elem.element) {
        const rect = elem.element.getBoundingClientRect();
        positions[elem.id] = {
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY,
          width: rect.width,
          height: rect.height
        };
      }
    });
    return positions;
  }

  // Enregistre un position personnalisée
  setCustomPosition(elementId, x, y) {
    this.customPositions[elementId] = { x, y };
    chrome.storage.local.set({
      'aitools-layout-custom': this.customPositions
    });

    const elem = this.elements.get(elementId);
    if (elem && elem.element) {
      this.setElementPosition(elem.element, { x, y });
    }
  }

  // Supprime la collision detection en le plaçant smartly
  setElementPosition(element, pos) {
    element.style.position = 'fixed';
    element.style.left = pos.x + 'px';
    element.style.top = pos.y + 'px';
    element.style.zIndex = '9998'; // Juste sous les modales
  }

  // Detection de collision
  hasCollision(box1, box2) {
    return !(
      box1.x + box1.width + this.margin < box2.x ||
      box2.x + box2.width + this.margin < box1.x ||
      box1.y + box1.height + this.margin < box2.y ||
      box2.y + box2.height + this.margin < box1.y
    );
  }

  // Change le layout
  setLayout(layoutName) {
    this.currentLayout = layoutName;
    chrome.storage.local.set({ 'aitools-layout': layoutName });
    this.applyLayout();
  }

  // Observer pour redimensionnement
  initObserver() {
    window.addEventListener('resize', () => {
      this.applyLayout();
    });
  }

  // Met à jour la visibilité
  toggleElement(elementId, visible) {
    const elem = this.elements.get(elementId);
    if (elem) {
      elem.visible = visible;
      if (elem.element) {
        elem.element.style.display = visible ? '' : 'none';
      }
      this.applyLayout();
    }
  }

  // Obtient la position d'un élément
  getElementPosition(elementId) {
    const elem = this.elements.get(elementId);
    if (elem && elem.element) {
      const rect = elem.element.getBoundingClientRect();
      return {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      };
    }
    return null;
  }

  // Réinitialise les positions
  resetPositions() {
    this.customPositions = {};
    chrome.storage.local.remove(['aitools-layout-custom']);
    this.currentLayout = 'adaptive';
    chrome.storage.local.set({ 'aitools-layout': 'adaptive' });
    this.applyLayout();
  }
}

// Instance globale
window.layoutManager = new LayoutManager();
