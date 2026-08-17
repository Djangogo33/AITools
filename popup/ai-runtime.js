const MAX_INPUT = 12_000;

export async function getAIStatus() {
  const summary = await availabilityOf('Summarizer');
  const translator = await availabilityOf('Translator', { sourceLanguage: 'en', targetLanguage: 'fr' });
  const detector = await availabilityOf('LanguageDetector');
  const prompt = await availabilityOf('LanguageModel');
  return { summary, translator, detector, prompt, local: summary !== 'unavailable' || translator !== 'unavailable' || prompt !== 'unavailable' };
}

export async function summarizeWithAI(text, { length = 'medium', outputLanguage = 'fr' } = {}) {
  const source = normalizeInput(text);
  if (!source) throw new Error('Aucun texte lisible à résumer.');
  let summarizerAvailability = 'unavailable';
  if (typeof globalThis.Summarizer !== 'undefined') {
    summarizerAvailability = await availabilityOf('Summarizer');
    if (summarizerAvailability !== 'unavailable') {
      try {
        const summarizer = await globalThis.Summarizer.create({ type: 'key-points', format: 'markdown', length, outputLanguage });
        try { const output = cleanModelOutput(await summarizer.summarize(source)); if (output) return { text: output, engine: 'summarizer-api', availability: summarizerAvailability }; }
        finally { summarizer.destroy?.(); }
      } catch { /* l’API peut être disponible mais non téléchargeable ou échouer à l’initialisation */ }
    }
  }
  let promptAvailability = 'unavailable';
  if (typeof globalThis.LanguageModel !== 'undefined') {
    promptAvailability = await availabilityOf('LanguageModel');
    if (promptAvailability !== 'unavailable') {
      try {
        const session = await globalThis.LanguageModel.create();
        try { const output = cleanModelOutput(await session.prompt(`Résume fidèlement le texte suivant en français en cinq points maximum. N’ajoute aucun fait absent du texte. Si le texte est court, conserve toutes ses idées importantes.\n\n${source}`)); if (output) return { text: output, engine: 'prompt-api', availability: promptAvailability }; }
        finally { session.destroy?.(); }
      } catch { /* repli extractif */ }
    }
  }
  return { text: heuristicSummary(source), engine: 'heuristique-extractif', availability: summarizerAvailability !== 'unavailable' || promptAvailability !== 'unavailable' ? 'fallback' : 'unavailable' };
}

export async function translateWithAI(text, targetLanguage = 'fr') {
  const source = normalizeInput(text);
  if (!source) throw new Error('Aucun texte à traduire.');
  const sourceLanguage = await detectLanguage(source);
  if (sourceLanguage === targetLanguage) return { text: source, sourceLanguage, targetLanguage, engine: 'none' };
  if (typeof globalThis.Translator !== 'undefined') {
    const availability = await availabilityOf('Translator', { sourceLanguage, targetLanguage });
    if (availability !== 'unavailable') {
      try {
        const translator = await globalThis.Translator.create({ sourceLanguage, targetLanguage });
        try { const output = cleanModelOutput(await translator.translate(source)); if (output) return { text: output, sourceLanguage, targetLanguage, engine: 'translator-api', availability }; }
        finally { translator.destroy?.(); }
      } catch { /* essayer le Prompt API puis signaler l’indisponibilité */ }
    }
  }
  if (typeof globalThis.LanguageModel !== 'undefined') {
    const availability = await availabilityOf('LanguageModel');
    if (availability !== 'unavailable') {
      try {
        const session = await globalThis.LanguageModel.create();
        try { const output = cleanModelOutput(await session.prompt(`Traduis fidèlement le texte suivant de ${sourceLanguage} vers ${targetLanguage}. Renvoie uniquement la traduction.\n\n${source}`)); if (output) return { text: output, sourceLanguage, targetLanguage, engine: 'prompt-api', availability }; }
        finally { session.destroy?.(); }
      } catch { /* message d’indisponibilité ci-dessous */ }
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
function normalizeInput(value) { return String(value || '').replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, MAX_INPUT); }
function cleanModelOutput(value) { const output = String(value || '').replace(/\r/g, '').trim(); return output.length >= 12 ? output : ''; }
function heuristicSummary(text) {
  const source = normalizeInput(text); const raw = source.split(/\n+|(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Þ0-9À-ÿ])/u).map((item) => item.replace(/^[-*•]\s*/, '').trim()).filter((item) => item.length >= 24);
  if (!raw.length) return `• ${source}`;
  const sentences = [...new Map(raw.map((sentence, index) => [sentence, { sentence, index }])).values()];
  const words = sentences.flatMap(({ sentence }) => sentence.toLowerCase().match(/[\p{L}\d]{3,}/gu) || []); const frequency = words.reduce((map, word) => map.set(word, (map.get(word) || 0) + 1), new Map());
  const selectedCount = sentences.length <= 3 ? sentences.length : source.length < 900 ? 3 : source.length < 2_500 ? 4 : 5;
  const ranked = sentences.map((item) => ({ ...item, score: item.index === 0 ? 1.5 : 0 + Math.min(1.2, item.sentence.length / 500) + [...new Set(item.sentence.toLowerCase().match(/[\p{L}\d]{3,}/gu) || [])].reduce((sum, word) => sum + Math.min(0.4, (frequency.get(word) || 0) * 0.08), 0) })).sort((a, b) => b.score - a.score || a.index - b.index).slice(0, selectedCount).sort((a, b) => a.index - b.index);
  return ranked.map(({ sentence }) => `• ${sentence}`).join('\n');
}
