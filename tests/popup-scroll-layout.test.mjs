import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const css = await readFile(new URL('../popup/popup.css', import.meta.url), 'utf8');
assert.match(css, /html,body\{width:620px;height:700px;min-height:700px;max-height:700px;overflow:hidden\}/);
assert.match(css, /\.app-shell\{width:100%;height:100%;min-height:0;max-height:100%;overflow:hidden\}/);
assert.match(css, /\.sidebar\{height:100%;min-height:0;overflow:hidden;overscroll-behavior:none\}/);
assert.match(css, /\.main-content\{height:100%;min-height:0;max-height:none;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;scrollbar-gutter:stable\}/);
assert.doesNotMatch(css, /@media\(max-height:700px\)\{html,body\{height:100vh/);
console.log('popup single-scroll layout simulation: ok');
