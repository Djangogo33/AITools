import { listFocusSessions } from './focus-service.js';

const TASKS_KEY = 'aitools.tasks';
const READING_KEY = 'aitools.reading-list';
const WORKSPACES_KEY = 'aitools.workspaces';

export async function getWeeklyReview() {
  const start = startOfDay(daysAgo(6)); const tomorrow = startOfDay(daysFromNow(1));
  const stored = await chrome.storage.local.get([TASKS_KEY, READING_KEY, WORKSPACES_KEY]);
  const tasks = Array.isArray(stored[TASKS_KEY]) ? stored[TASKS_KEY] : [];
  const completed = tasks.filter((task) => validDate(task?.completedAt) && new Date(task.completedAt) >= start && new Date(task.completedAt) < tomorrow);
  const open = tasks.filter((task) => !task?.done);
  const missed = open.filter((task) => validDate(task?.dueAt) && new Date(task.dueAt) < startOfDay(new Date()));
  const completedLate = completed.filter((task) => validDate(task?.dueAt) && new Date(task.completedAt) > new Date(task.dueAt));
  const sessions = (await listFocusSessions()).filter((session) => new Date(session.endedAt) >= start && new Date(session.endedAt) < tomorrow);
  const minutes = sessions.reduce((total, session) => total + Number(session.minutes || 0), 0);
  const domains = countDomains([...(Array.isArray(stored[READING_KEY]) ? stored[READING_KEY] : []).map((item) => item.url), ...(Array.isArray(stored[WORKSPACES_KEY]) ? stored[WORKSPACES_KEY] : []).flatMap((space) => Array.isArray(space?.tabs) ? space.tabs.map((tab) => tab.url) : [])]);
  const taskLabels = countLabels(sessions.map((session) => session.taskTitle));
  return { generatedAt: new Date().toISOString(), rangeStart: start.toISOString(), rangeEnd: tomorrow.toISOString(), completedTasks: completed.length, missedOpenTasks: missed.length, completedLateTasks: completedLate.length, openTasks: open.length, focus: { sessions: sessions.length, minutes, averageMinutes: sessions.length ? Math.round(minutes / sessions.length) : 0 }, frequentDomains: domains.slice(0, 5), focusedTasks: taskLabels.slice(0, 5) };
}

function countDomains(urls) { const counts = new Map(); for (const value of urls) { try { const domain = new URL(value).hostname.replace(/^www\./, '').toLowerCase(); counts.set(domain, (counts.get(domain) || 0) + 1); } catch { /* Les valeurs non-URL sont ignorées. */ } } return [...counts.entries()].map(([domain, count]) => ({ domain, count })).sort((a, b) => b.count - a.count || a.domain.localeCompare(b.domain, 'fr')); }
function countLabels(values) { const counts = new Map(); for (const value of values) { const label = String(value || '').trim(); if (label) counts.set(label, (counts.get(label) || 0) + 1); } return [...counts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'fr')); }
function daysAgo(days) { const date = new Date(); date.setDate(date.getDate() - days); return date; }
function daysFromNow(days) { const date = new Date(); date.setDate(date.getDate() + days); return date; }
function startOfDay(value) { const date = new Date(value); date.setHours(0, 0, 0, 0); return date; }
function validDate(value) { return value && Number.isFinite(new Date(value).getTime()); }
