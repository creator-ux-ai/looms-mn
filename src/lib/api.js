// Browser-storage data layer.
// It keeps the same call shape the original site used (records.list / create / replace / delete),
// so you can later swap the body of `api()` for Firebase, Supabase or your own server
// without touching App.jsx.
//
// NOTE: localStorage lives in each visitor's own browser. Orders placed by customers are
// therefore NOT visible on your device until you connect a real backend (see README).

const PREFIX = "mnlooms:";

function read(collection) {
  try {
    const raw = localStorage.getItem(PREFIX + collection);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function write(collection, list) {
  try {
    localStorage.setItem(PREFIX + collection, JSON.stringify(list));
  } catch (e) {
    throw new Error("Browser storage is full or blocked. " + (e?.message || ""));
  }
}

function newId() {
  return (crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`).replace(/-/g, "");
}

export async function api(action, args = {}) {
  const { collection } = args;
  if (!collection) throw new Error("Missing collection");
  const list = read(collection);

  switch (action) {
    case "records.list":
      return { records: list };

    case "records.create": {
      const key = args.idempotency_key;
      if (key) {
        const existing = list.find((r) => r.idempotency_key === key);
        if (existing) return existing;
      }
      const rec = { id: newId(), value: args.value, created_at: new Date().toISOString(), idempotency_key: key };
      write(collection, [...list, rec]);
      return rec;
    }

    case "records.replace": {
      const idx = list.findIndex((r) => r.id === args.id);
      if (idx === -1) throw new Error("Record not found");
      const next = [...list];
      next[idx] = { ...next[idx], value: args.value };
      write(collection, next);
      return next[idx];
    }

    case "records.delete": {
      write(collection, list.filter((r) => r.id !== args.id));
      return { deleted: true };
    }

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
