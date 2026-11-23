// Profiles: several people sharing one device, each with their own library,
// progress, notes and settings. The first profile ("main") uses the original
// storage names, so nothing moves for existing users.

const LIST_KEY = "kitsune.profiles", CUR_KEY = "kitsune.profile";
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export const PROFILE_COLORS = ["#c9661a", "#c2456f", "#3e55c2", "#4f7a28", "#7a4cc2", "#0f8b8d"];

export function getProfiles() {
  const list = read(LIST_KEY, null);
  return Array.isArray(list) && list.length ? list : [{ id: "main", name: "Me", color: PROFILE_COLORS[0], kids: false }];
}
export function currentId() {
  const id = read(CUR_KEY, "main");
  return getProfiles().some((p) => p.id === id) ? id : "main";
}
export const currentProfile = () => getProfiles().find((p) => p.id === currentId());
export const isKids = () => !!currentProfile()?.kids;

// Storage names for the active profile.
export const dbName = () => (currentId() === "main" ? "kitsune2" : `kitsune2-${currentId()}`);
export const lsPrefix = () => (currentId() === "main" ? "kitsune." : `kitsune.${currentId()}.`);

export function createProfile({ name, kids = false, color }) {
  const list = getProfiles();
  const id = "p" + Date.now().toString(36);
  list.push({ id, name: name.trim().slice(0, 24) || "Reader", kids, color: color || PROFILE_COLORS[list.length % PROFILE_COLORS.length] });
  write(LIST_KEY, list);
  return id;
}
export function updateProfile(id, patch) {
  write(LIST_KEY, getProfiles().map((p) => (p.id === id ? { ...p, ...patch } : p)));
}
export function switchProfile(id) {
  write(CUR_KEY, id);
  location.hash = "home";
  location.reload();
}
export async function deleteProfile(id) {
  if (id === "main") throw new Error("The first profile can't be deleted.");
  write(LIST_KEY, getProfiles().filter((p) => p.id !== id));
  await new Promise((res) => { const r = indexedDB.deleteDatabase(`kitsune2-${id}`); r.onsuccess = r.onerror = r.onblocked = () => res(); });
  try { Object.keys(localStorage).filter((k) => k.startsWith(`kitsune.${id}.`)).forEach((k) => localStorage.removeItem(k)); } catch {}
  if (currentId() === id) switchProfile("main");
}
