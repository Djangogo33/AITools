import assert from 'node:assert/strict';

const { analyzeAIProbability, paletteFromText, summarizeWithAI } = await import('../popup/ai-runtime.js');
const sample = 'Cette extension aide à organiser la navigation. Elle propose une recherche plus ciblée. Les notes restent disponibles localement. Les utilisateurs peuvent synchroniser leurs données lorsqu’ils le souhaitent.';
const summary = await summarizeWithAI(sample);
assert.equal(summary.engine, 'heuristique');
assert.match(summary.text, /extension/i);
const analysis = analyzeAIProbability(sample);
assert.ok(analysis.score >= 5 && analysis.score <= 95);
assert.equal(analysis.indicators.words > 0, true);
const palette = paletteFromText('AITools');
assert.equal(palette.length, 5);
assert.ok(palette.every((color) => color.startsWith('hsl(')));
console.log('ai-runtime fallback simulation: ok');
