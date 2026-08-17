import { listNotes } from './notes-service.js';
import { listTasks } from './tasks-service.js';
import { listReadingItems } from './reading-list-service.js';
import { listWorkspaces } from './workspaces-service.js';

export async function createUserExport(format = 'markdown') {
  const [notes, tasks, reading, workspaces] = await Promise.all([listNotes(), listTasks(), listReadingItems(), listWorkspaces()]);
  const generatedAt = new Date().toISOString();
  if (format === 'csv') return { filename: `aitools-donnees-${dateStamp()}.csv`, mime: 'text/csv;charset=utf-8', content: toCsv({ notes, tasks, reading, workspaces }) };
  return { filename: `aitools-donnees-${dateStamp()}.md`, mime: 'text/markdown;charset=utf-8', content: toMarkdown({ notes, tasks, reading, workspaces, generatedAt }) };
}

function toMarkdown({ notes, tasks, reading, workspaces, generatedAt }) {
  const lines = ['# Export AITools', '', `Généré le ${new Date(generatedAt).toLocaleString('fr-FR')}.`, '', '## Tâches', ''];
  lines.push(...(tasks.length ? tasks.map((task) => `- [${task.done ? 'x' : ' '}] ${task.title}${task.dueAt ? ` — échéance : ${new Date(task.dueAt).toLocaleString('fr-FR')}` : ''}${task.tags?.length ? ` — ${task.tags.map((tag) => `#${tag}`).join(' ')}` : ''}`) : ['_Aucune tâche._']), '', '## Notes', '');
  lines.push(...(notes.length ? notes.flatMap((note) => [`### ${note.sourceTitle || 'Note'}`, '', note.content, note.tags?.length ? `\nTags : ${note.tags.map((tag) => `#${tag}`).join(' ')}` : '', note.sourceUrl ? `\nSource : ${note.sourceUrl}` : '', '']) : ['_Aucune note._']), '## Liste de lecture', '');
  lines.push(...(reading.length ? reading.map((item) => `- [${item.done ? 'x' : ' '}] [${item.title}](${item.url})${item.tags?.length ? ` — ${item.tags.map((tag) => `#${tag}`).join(' ')}` : ''}`) : ['_Aucune page._']), '', '## Espaces de travail', '');
  lines.push(...(workspaces.length ? workspaces.flatMap((space) => [`### ${space.name}`, '', ...(space.tabs || []).map((tab) => `- [${tab.title}](${tab.url})`), '']) : ['_Aucun espace._']));
  return lines.join('\n');
}

function toCsv({ notes, tasks, reading, workspaces }) {
  const rows = [['type', 'title', 'content_or_url', 'status', 'priority', 'tags', 'due_at', 'updated_at']];
  notes.forEach((note) => rows.push(['note', note.sourceTitle || 'Note', note.content, '', '', (note.tags || []).join('|'), '', note.updatedAt || '']));
  tasks.forEach((task) => rows.push(['task', task.title, task.sourceUrl || '', task.done ? 'done' : 'open', task.priority, (task.tags || []).join('|'), task.dueAt || '', task.updatedAt || '']));
  reading.forEach((item) => rows.push(['reading', item.title, item.url, item.done ? 'done' : 'open', '', (item.tags || []).join('|'), '', item.updatedAt || '']));
  workspaces.forEach((space) => rows.push(['workspace', space.name, String(space.tabs?.length || 0), '', '', (space.tags || []).join('|'), '', space.updatedAt || '']));
  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}
function csvCell(value) { return `"${String(value ?? '').replace(/"/g, '""')}"`; }
function dateStamp() { return new Date().toISOString().slice(0, 10); }
