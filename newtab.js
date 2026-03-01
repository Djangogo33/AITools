// AITools Newtab - Instant Redirect Handler

console.log('[AITools Newtab] Redirecting...');

const urls = {
  'google': 'https://www.google.com/',
  'bing': 'https://www.bing.com/',
  'qwant': 'https://www.qwant.com/',
  'duckduckgo': 'https://www.duckduckgo.com/',
  'startpage': 'https://www.startpage.com/',
  'yahoo': 'https://search.yahoo.com/',
  'ecosia': 'https://www.ecosia.org/',
  'github': 'https://github.com/'
};

// Get stored preference and redirect immediately
chrome.storage.local.get(['newtabUrlPreset', 'newtabUrlCustom'], (data) => {
  const preset = data.newtabUrlPreset || 'google';
  const customUrl = data.newtabUrlCustom;
  
  let targetUrl = urls[preset] || urls['google'];
  
  if (preset === 'custom' && customUrl) {
    targetUrl = customUrl;
  }
  
  console.log('[AITools Newtab] Redirecting to:', targetUrl);
  window.location.replace(targetUrl);
});

