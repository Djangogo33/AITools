const MESSAGE_TYPES = {
  getPageText: 'page/get-text',
  anonymizePage: 'page/anonymize',
  summarizePage: 'page/summarize'
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === MESSAGE_TYPES.getPageText) {
    sendResponse({ ok: true, text: extractReadableText() });
    return false;
  }
  if (message?.type === MESSAGE_TYPES.anonymizePage) {
    const count = anonymizeVisibleText();
    sendResponse({ ok: true, count });
    return false;
  }
  if (message?.type === MESSAGE_TYPES.summarizePage) {
    const text = extractReadableText();
    sendResponse({ ok: true, summary: summarizeLocally(text) });
    return false;
  }
  return false;
});

function extractReadableText() {
  const root = document.querySelector('article, main, [role="main"]') || document.body;
  return (root?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 18000);
}

function summarizeLocally(text) {
  if (!text) return 'Aucun contenu lisible n’a été trouvé sur cette page.';
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  return sentences.slice(0, 3).join(' ').trim();
}

function anonymizeVisibleText() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  let count = 0;
  const patterns = [
    [/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email masqué]'],
    [/(?:\+33|0)[1-9](?:[ .-]?\d{2}){4}\b/g, '[téléphone masqué]'],
    [/\b\d{1,3}(?:\.\d{1,3}){3}\b/g, '[IP masquée]']
  ];
  for (const node of nodes) {
    if (!node.parentElement || ['SCRIPT', 'STYLE', 'INPUT', 'TEXTAREA'].includes(node.parentElement.tagName)) continue;
    let value = node.nodeValue;
    for (const [pattern, replacement] of patterns) value = value.replace(pattern, () => { count += 1; return replacement; });
    node.nodeValue = value;
  }
  return count;
}
