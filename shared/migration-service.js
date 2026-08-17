const SCHEMA_VERSION_KEY = 'aitools.schema-version';
const CURRENT_SCHEMA_VERSION = 7;

export async function migrateLocalData() {
  const stored = await chrome.storage.local.get([SCHEMA_VERSION_KEY, 'aitools.tasks', 'aitools.settings', 'aitools.inbox', 'aitools.workspaces']);
  const fromVersion = Math.max(0, Number(stored[SCHEMA_VERSION_KEY]) || 0); const updates = {};
  if (fromVersion < 7) {
    if (Array.isArray(stored['aitools.tasks'])) updates['aitools.tasks'] = stored['aitools.tasks'].map((task) => ({ ...task, recurrence: ['none', 'daily', 'weekly', 'monthly'].includes(task?.recurrence) ? task.recurrence : 'none', recurrenceSeriesId: typeof task?.recurrenceSeriesId === 'string' ? task.recurrenceSeriesId : null }));
    if (stored['aitools.settings'] && typeof stored['aitools.settings'] === 'object' && !validDate(stored['aitools.settings'].updatedAt)) updates['aitools.settings'] = { ...stored['aitools.settings'], updatedAt: new Date().toISOString() };
    if (Array.isArray(stored['aitools.inbox'])) updates['aitools.inbox'] = stored['aitools.inbox'].map((capture) => ({ ...capture, processedAt: validDate(capture?.processedAt) ? capture.processedAt : null, dismissedAt: validDate(capture?.dismissedAt) ? capture.dismissedAt : null }));
    if (Array.isArray(stored['aitools.workspaces'])) updates['aitools.workspaces'] = stored['aitools.workspaces'].map((workspace) => ({ ...workspace, tags: Array.isArray(workspace?.tags) ? workspace.tags : [], tabs: Array.isArray(workspace?.tabs) ? workspace.tabs : [] }));
  }
  updates[SCHEMA_VERSION_KEY] = CURRENT_SCHEMA_VERSION;
  await chrome.storage.local.set(updates);
  return { fromVersion, toVersion: CURRENT_SCHEMA_VERSION, migrated: fromVersion < CURRENT_SCHEMA_VERSION };
}

export async function getLocalSchemaVersion() { return Number((await chrome.storage.local.get(SCHEMA_VERSION_KEY))[SCHEMA_VERSION_KEY]) || 0; }
function validDate(value) { return value && Number.isFinite(new Date(value).getTime()); }
