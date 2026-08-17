import assert from 'node:assert/strict';

const { analyzeAIProbability, paletteFromText, summarizeWithAI } = await import('../popup/ai-runtime.js');
const sample = 'Cette extension aide à organiser la navigation. Elle propose une recherche plus ciblée. Les notes restent disponibles localement. Les utilisateurs peuvent synchroniser leurs données lorsqu’ils le souhaitent.';
const summary = await summarizeWithAI(sample);
assert.equal(summary.engine, 'heuristique-extractif');
assert.match(summary.text, /extension/i);
assert.match(summary.text, /notes/i);
const longText = [
  'Ce document présente le contexte général du projet et rappelle son historique.',
  'Le risque principal concerne la fiabilité des résumés lorsque le moteur local est indisponible.',
  'La stratégie recommandée consiste à conserver les idées importantes et à signaler clairement les limites.',
  'Les données restent locales et aucune information ne doit être inventée par le système.',
  'Une validation sur des textes courts et longs permet de mesurer la qualité du résultat.'
].join(' ');
const extractive = await summarizeWithAI(longText);
assert.equal(extractive.engine, 'heuristique-extractif');
assert.match(extractive.text, /fiabilité des résumés|stratégie recommandée|données restent locales/i);
assert.ok(extractive.text.split('\n').filter(Boolean).length >= 3);
const originalSummarizer = globalThis.Summarizer; const originalLanguageModel = globalThis.LanguageModel;
globalThis.Summarizer = { availability: async () => 'available', create: async () => { throw new Error('modèle indisponible'); } };
globalThis.LanguageModel = { availability: async () => 'available', create: async () => { throw new Error('modèle indisponible'); } };
const failedAPIs = await summarizeWithAI(longText);
assert.equal(failedAPIs.engine, 'heuristique-extractif');
assert.equal(failedAPIs.availability, 'fallback');
if (originalSummarizer === undefined) delete globalThis.Summarizer; else globalThis.Summarizer = originalSummarizer;
if (originalLanguageModel === undefined) delete globalThis.LanguageModel; else globalThis.LanguageModel = originalLanguageModel;
const analysis = analyzeAIProbability(sample);
assert.ok(analysis.score >= 5 && analysis.score <= 95);
assert.equal(analysis.indicators.words > 0, true);
const palette = paletteFromText('AITools');
assert.equal(palette.length, 5);
assert.ok(palette.every((color) => color.startsWith('hsl(')));
console.log('ai-runtime quality simulation: ok');
