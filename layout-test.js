// ============================================================================
// INTEGRATION TEST - Vérifier que le layout manager fonctionne
// ============================================================================

console.log('[AITools Test] Initializing layout manager tests...');

// Attendre que le DOM soit chargé
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runTests);
} else {
  runTests();
}

function runTests() {
  console.group('AITools Layout Manager - Diagnostic');
  
  // Test 1: Vérifier que layoutManager est disponible
  console.log('✓ Test 1: layoutManager disponible?', typeof window.layoutManager !== 'undefined');
  
  // Test 2: Vérifier les méthodes du layout manager
  if (window.layoutManager) {
    const methods = ['registerElement', 'setLayout', 'resetPositions', 'toggleElement'];
    methods.forEach(method => {
      const exists = typeof window.layoutManager[method] === 'function';
      console.log(`  ✓ Méthode ${method}:`, exists);
    });
  }
  
  // Test 3: Vérifier le stockage local
  chrome.storage.local.get(['aitools-layout', 'aitools-layout-custom'], (data) => {
    console.log('✓ Test 3: Données de layout en storage:');
    console.log('  - Layout courant:', data['aitools-layout'] || 'adaptive (défaut)');
    console.log('  - Positions personnalisées:', Object.keys(data['aitools-layout-custom'] || {}).length, 'éléments');
  });
  
  // Test 4: Vérifier les éléments enregistrés après 2s
  setTimeout(() => {
    if (window.layoutManager && window.layoutManager.elements) {
      console.log('✓ Test 4: Éléments enregistrés:', window.layoutManager.elements.size);
      const elementsInfo = Array.from(window.layoutManager.elements.values()).map(e => ({
        id: e.id,
        priority: e.priority,
        visible: e.visible,
        element: e.element ? '✓' : '✗'
      }));
      console.table(elementsInfo);
    }
  }, 2000);
  
  console.log('\n💡 Conseil: Ouvrez la console (F12) pour voir ces messages sur les pages');
  console.groupEnd();
}

// Écouter le changement de layout
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes['aitools-layout']) {
    console.log('[AITools] Layout changed:', changes['aitools-layout'].newValue);
  }
});
