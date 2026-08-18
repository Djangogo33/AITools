import assert from 'node:assert/strict';

const { analyzeAIProbability, getAIStatus, paletteFromText, summarizeWithAI, translateWithAI } = await import('../popup/ai-runtime.js');
const original = Object.fromEntries(['Summarizer', 'LanguageModel', 'Translator', 'LanguageDetector'].map((name) => [name, globalThis[name]]));
const restore = () => { for (const [name, value] of Object.entries(original)) { if (value === undefined) delete globalThis[name]; else globalThis[name] = value; } };
try {
  delete globalThis.Summarizer; delete globalThis.LanguageModel; delete globalThis.Translator; delete globalThis.LanguageDetector;
  const sample = 'Cette extension aide à organiser la navigation. Elle propose une recherche plus ciblée. Les notes restent disponibles localement. Les utilisateurs peuvent synchroniser leurs données lorsqu’ils le souhaitent.';
  const summary = await summarizeWithAI(sample);
  assert.equal(summary.engine, 'heuristique-extractif');
  assert.match(summary.text, /extension/i);
  assert.match(summary.text, /notes/i);
  await assert.rejects(() => summarizeWithAI('   '), /Aucun texte lisible/);
  const longText = [
    'Ce document présente le contexte général du projet et rappelle son historique.',
    'Le risque principal concerne la fiabilité des résumés lorsque le moteur local est indisponible.',
    'La stratégie recommandée consiste à conserver les idées importantes et à signaler clairement les limites.',
    'Les données restent locales et aucune information ne doit être inventée par le système.',
    'Une validation sur des textes courts et longs permet de mesurer la qualité du résultat.',
    'Le risque principal concerne la fiabilité des résumés lorsque le moteur local est indisponible.'
  ].join('\n\n');
  const extractive = await summarizeWithAI(longText);
  assert.equal(extractive.engine, 'heuristique-extractif');
  assert.match(extractive.text, /fiabilité des résumés|stratégie recommandée|données restent locales/i);
  assert.ok(extractive.text.split('\n').filter(Boolean).length >= 3);
  assert.ok((extractive.text.match(/Le risque principal/g) || []).length <= 1, 'les phrases dupliquées ne doivent pas être répétées');
  assert.ok(extractive.text.split('\n').filter(Boolean).length <= 5, 'le repli doit rester concis');
  globalThis.Summarizer = { availability: async () => 'available', create: async () => { throw new Error('modèle indisponible'); } };
  globalThis.LanguageModel = { availability: async () => 'available', create: async () => { throw new Error('modèle indisponible'); } };
  const failedAPIs = await summarizeWithAI(longText);
  assert.equal(failedAPIs.engine, 'heuristique-extractif');
  assert.equal(failedAPIs.availability, 'fallback');
  let destroyed = 0;
  globalThis.Summarizer = { availability: async () => 'downloadable', create: async () => ({ summarize: async () => '• Idée native validée.\n• Aucun fait ajouté.', destroy: () => { destroyed += 1; } }) };
  delete globalThis.LanguageModel;
  const nativeSummary = await summarizeWithAI(longText);
  assert.equal(nativeSummary.engine, 'summarizer-api');
  assert.match(nativeSummary.text, /Idée native validée/);
  assert.equal(destroyed, 1, 'une session native doit être libérée');
  globalThis.Summarizer = {};
  globalThis.LanguageModel = {};
  const status = await getAIStatus();
  assert.equal(status.summary, 'unavailable');
  assert.equal(status.prompt, 'unavailable');
  let translatorDestroyed = 0;
  globalThis.Translator = { availability: async () => 'available', create: async () => ({ translate: async () => 'Bonjour le monde', destroy: () => { translatorDestroyed += 1; } }) };
  const translation = await translateWithAI('Hello world', 'fr');
  assert.equal(translation.engine, 'translator-api');
  assert.equal(translation.text, 'Bonjour le monde');
  assert.equal(translatorDestroyed, 1, 'une session de traduction doit être libérée');
  delete globalThis.Translator;
  await assert.rejects(() => translateWithAI('Hello world', 'fr'), /traduction locale n’est pas disponible/i);
  const analysis = analyzeAIProbability(sample);
  assert.ok(analysis.score >= 5 && analysis.score <= 95);
  assert.equal(analysis.indicators.words > 0, true);
  const palette = paletteFromText('AITools');
  assert.equal(palette.length, 5);
  assert.ok(palette.every((color) => color.startsWith('hsl(')));
  console.log('ai-runtime quality simulation: ok');
} finally { restore(); }
