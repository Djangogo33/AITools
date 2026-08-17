const MAX_INPUT = 12_000;

export async function getAIStatus() {
  const summary = await availabilityOf('Summarizer');
  const translator = await availabilityOf('Translator', { sourceLanguage: 'en', targetLanguage: 'fr' });
  const detector = typeof globalThis.LanguageDetector === 'undefined' ? 'unavailable' : 'available';
  const prompt = typeof globalThis.LanguageModel === 'undefined' ? 'unavailable' : await globalThis.LanguageModel.availability().catch(() => 'unavailable');
  return { summary, translator, detector, prompt, local: summary !== 'unavailable' || translator !== 'unavailable' || prompt !== 'unavailable' };
}

export async function summarizeWithAI(text, { length = 'medium', outputLanguage = 'fr' } = {}) {
  const source = normalizeInput(text);
  if (!source) throw new Error('Aucun texte lisible à résumer.');
  if (typeof globalThis.Summarizer !== 'undefined') {
    const availability = await globalThis.Summarizer.availability();
    if (availability !== 'unavailable') {
      const summarizer = await globalThis.Summarizer.create({ type: 'key-points', format: 'markdown', length, outputLanguage });
      try { return { text: await summarizer.summarize(source), engine: 'summarizer-api', availability }; } finally { summarizer.destroy?.(); }
    }
  }
  if (typeof globalThis.LanguageModel !== 'undefined') {
    const availability = await globalThis.LanguageModel.availability();
    if (availability !== 'unavailable') {
      const session = await globalThis.LanguageModel.create();
      try { return { text: await session.prompt(`Résume le texte suivant en français en cinq puces claires. Ne rajoute aucun fait non présent.\n\n${source}`), engine: 'prompt-api', availability }; } finally { session.destroy?.(); }
    }
  }
  return { text: heuristicSummary(source), engine: 'heuristique', availability: 'unavailable' };
}

export async function translateWithAI(text, targetLanguage = 'fr') {
  const source = normalizeInput(text);
  if (!source) throw new Error('Aucun texte à traduire.');
  const sourceLanguage = await detectLanguage(source);
  if (sourceLanguage === targetLanguage) return { text: source, sourceLanguage, targetLanguage, engine: 'none' };
  if (typeof globalThis.Translator !== 'undefined') {
    const availability = await globalThis.Translator.availability({ sourceLanguage, targetLanguage });
    if (availability !== 'unavailable') {
      const translator = await globalThis.Translator.create({ sourceLanguage, targetLanguage });
      try { return { text: await translator.translate(source), sourceLanguage, targetLanguage, engine: 'translator-api', availability }; } finally { translator.destroy?.(); }
    }
  }
  if (typeof globalThis.LanguageModel !== 'undefined') {
    const availability = await globalThis.LanguageModel.availability();
    if (availability !== 'unavailable') {
      const session = await globalThis.LanguageModel.create();
      try { return { text: await session.prompt(`Traduis fidèlement le texte suivant de ${sourceLanguage} vers ${targetLanguage}. Renvoie uniquement la traduction.\n\n${source}`), sourceLanguage, targetLanguage, engine: 'prompt-api', availability }; } finally { session.destroy?.(); }
    }
  }
  throw new Error('La traduction locale n’est pas disponible dans ce navigateur.');
}

export function analyzeAIProbability(text) {
  const value = normalizeInput(text); if (!value) throw new Error('Aucun texte à analyser.');
  const sentences = value.split(/[.!?]+/).map((item) => item.trim()).filter(Boolean);
  const words = value.toLowerCase().match(/[\p{L}’'-]+/gu) || [];
  const uniqueRatio = words.length ? new Set(words).size / words.length : 0;
  const averageLength = sentences.length ? words.length / sentences.length : words.length;
  const connectors = (value.match(/\b(en outre|par conséquent|néanmoins|de plus|ainsi|furthermore|moreover|therefore)\b/gi) || []).length;
  const repeatedOpeners = sentences.reduce((map, sentence) => { const opener = sentence.toLowerCase().split(/\s+/).slice(0, 3).join(' '); map.set(opener, (map.get(opener) || 0) + 1); return map; }, new Map());
  const repetition = [...repeatedOpeners.values()].filter((count) => count > 1).reduce((sum, count) => sum + count - 1, 0);
  let score = 28 + (uniqueRatio < 0.42 ? 18 : 0) + (averageLength > 23 ? 12 : 0) + Math.min(20, connectors * 5) + Math.min(15, repetition * 5);
  score = Math.max(5, Math.min(95, Math.round(score)));
  const confidence = words.length < 80 ? 'faible' : words.length < 250 ? 'modérée' : 'indicative';
  return { score, confidence, indicators: { words: words.length, uniqueRatio: Number(uniqueRatio.toFixed(2)), averageSentenceLength: Number(averageLength.toFixed(1)), connectors, repetition }, disclaimer: 'Cette estimation stylistique ne prouve pas qu’un texte a été produit par une IA.' };
}

export function paletteFromText(seed) {
  const hash = [...String(seed || 'AITools')].reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
  const hue = Math.abs(hash) % 360;
  return [0, 1, 2, 3, 4].map((index) => `hsl(${(hue + index * 37) % 360} ${62 - index * 4}% ${56 - index * 5}%)`);
}

async function detectLanguage(text) {
  if (typeof globalThis.LanguageDetector !== 'undefined') {
    try { const detector = await globalThis.LanguageDetector.create(); const results = await detector.detect(text.slice(0, 4000)); const best = results?.[0]?.detectedLanguage; detector.destroy?.(); if (best) return best; } catch { /* repli */ }
  }
  const lower = text.toLowerCase();
  if (/\b(le|la|les|des|une|est|avec|pour)\b/.test(lower)) return 'fr';
  if (/\b(el|la|los|las|una|para|con)\b/.test(lower)) return 'es';
  if (/\b(der|die|das|und|mit|für)\b/.test(lower)) return 'de';
  return 'en';
}

async function availabilityOf(name, options) {
  const api = globalThis[name]; if (!api?.availability) return 'unavailable';
  try { return await api.availability(options); } catch { return 'unavailable'; }
}
function normalizeInput(value) { return String(value || '').replace(/\s+/g, ' ').trim().slice(0, MAX_INPUT); }
function heuristicSummary(text) { const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]; return sentences.slice(0, 5).map((sentence) => `• ${sentence.trim()}`).join('\n'); }
