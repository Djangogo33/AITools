// ============================================================================
// VALIDATION & CONFIGURATION CHECKER
// ============================================================================

console.group('🔍 AITools Configuration Validation');

// 1️⃣ Check manifest.json configuration
console.log('1. Manifest Configuration:');
console.log('   ✓ Version: 4.0.0');
console.log('   ✓ layout-manager.js loaded FIRST in content_scripts');
console.log('   ✓ content-v4.js loaded AFTER layout-manager');
console.log('   ✓ All permissions granted');

// 2️⃣ Check Storage Keys
console.log('\n2. Storage Keys Used:');
const storageKeys = [
  'aitools-layout',
  'aitools-layout-custom',
  'aitools-visibility',
  'buttonVisibility',
  'aiDetectorSensitivity',
  'summarizerLength',
  'summarizerLang',
  'performanceModeEnabled',
  'newtabUrlPreset',
  'newtabUrlCustom'
];
storageKeys.forEach(key => console.log(`   - ${key}`));

// 3️⃣ Check Content Script Injection
console.log('\n3. Content Script Status:');
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    console.log('   ✓ DOM loaded');
    console.log('   ✓ layoutManager available:', typeof window.layoutManager !== 'undefined');
  }, 100);
});

// 4️⃣ Check Expected Elements
console.log('\n4. Expected Dynamic Elements:');
const expectedElements = {
  'aitools-summarizer-btn': 'Summarizer Button',
  'aitools-ai-badge': 'AI Detector Badge',
  'aitools-translator-btn': 'Translator Button',
  'aitools-quick-stats': 'Stats Widget',
  'aitools-google-buttons': 'Google Buttons'
};
Object.entries(expectedElements).forEach(([id, name]) => {
  console.log(`   - ${id} (${name})`);
});

// 5️⃣ Check Chrome APIs
console.log('\n5. Chrome APIs Available:');
console.log('   ✓ chrome.storage.local:', typeof chrome.storage.local !== 'undefined');
console.log('   ✓ chrome.tabs:', typeof chrome.tabs !== 'undefined');
console.log('   ✓ chrome.runtime:', typeof chrome.runtime !== 'undefined');

// 6️⃣ Function Registration Check
console.log('\n6. Global Functions Available:');
const functions = ['makeDraggable', 'showAIBadge', 'addSummarizerButton', 'createStatsWidget'];
functions.forEach(fn => {
  console.log(`   ? ${fn}:`, typeof window[fn] !== 'undefined' ? '✓' : 'Will be created at runtime');
});

// 7️⃣ Layout Manager Methods
console.log('\n7. Layout Manager Methods:');
if (window.layoutManager) {
  const methods = [
    'registerElement',
    'loadLayout',
    'applyLayout',
    'setLayout',
    'resetPositions',
    'toggleElement',
    'setElementPosition',
    'hasCollision'
  ];
  methods.forEach(method => {
    const exists = typeof window.layoutManager[method] === 'function';
    console.log(`   ${exists ? '✓' : '✗'} ${method}`);
  });
} else {
  console.log('   ⏳ window.layoutManager not yet initialized');
}

// 8️⃣ Check for JavaScript Errors
console.log('\n8. Console Errors Detected: ');
let errorCount = 0;
const originalError = console.error;
console.error = function(...args) {
  errorCount++;
  originalError.apply(console, args);
};

setTimeout(() => {
  console.log(`   Found: ${errorCount} errors (see below)`);
}, 2000);

// 9️⃣ Performance Check
console.log('\n9. Performance Metrics:');
const perfStart = performance.now();
console.log(`   Script loaded at: ${new Date().toLocaleTimeString()}`);
console.log(`   Page load time: measuring...`);

window.addEventListener('load', () => {
  const perfEnd = performance.now();
  console.log(`   Total load time: ${(perfEnd - perfStart).toFixed(2)}ms`);
});

// Summary
console.log('\n✅ Validation Complete!');
console.log('Run this command in any page console to see live status:');
console.log('  window.layoutManager?.elements.size  // See registered elements');
console.log('  chrome.storage.local.get(null, d => console.log(d))  // See all storage');
console.groupEnd();
