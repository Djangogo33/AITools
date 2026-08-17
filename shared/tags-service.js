const MAX_TAGS = 12;
const MAX_TAG_LENGTH = 32;

export function normalizeTags(value) {
  const source = Array.isArray(value) ? value : String(value || '').split(/[;,\n]/);
  const seen = new Set();
  const tags = [];
  for (const entry of source) {
    const tag = String(entry || '').trim().replace(/^#/, '').replace(/\s+/g, '-').toLocaleLowerCase('fr-FR').slice(0, MAX_TAG_LENGTH);
    if (!tag || !/^[\p{L}\p{N}_-]+$/u.test(tag) || seen.has(tag)) continue;
    seen.add(tag); tags.push(tag);
    if (tags.length >= MAX_TAGS) break;
  }
  return tags;
}

export function tagsFromText(text) {
  return normalizeTags(String(text || '').match(/#[\p{L}\p{N}_-]{1,32}/gu) || []);
}

export function matchesTags(item, filter) {
  const selected = normalizeTags(filter);
  if (!selected.length) return true;
  const itemTags = new Set(normalizeTags(item?.tags));
  return selected.every((tag) => itemTags.has(tag));
}

export function formatTags(tags) { return normalizeTags(tags).map((tag) => `#${tag}`).join(' '); }
